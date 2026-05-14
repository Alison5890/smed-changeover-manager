const express = require('express')
const multer = require('multer')
const { PrismaClient } = require('@prisma/client')
const { parseSkillMatrixFile } = require('../utils/xlsxParser')

const router = express.Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

// GET all workers
router.get('/', async (req, res) => {
  try {
    const { search, line, grade, active } = req.query
    const workers = await prisma.worker.findMany({
      where: {
        isActive: active === 'false' ? false : true,
        ...(line ? { currentLine: line } : {}),
        ...(grade ? { grade } : {}),
        ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { empNo: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      include: { skills: true },
      orderBy: [{ currentLine: 'asc' }, { grade: 'asc' }, { name: 'asc' }],
    })
    res.json(workers)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET workers for a specific line (for allocation)
router.get('/line/:lineId', async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { currentLine: req.params.lineId, isActive: true },
      include: { skills: true },
      orderBy: { grade: 'asc' },
    })
    res.json(workers)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET single worker
router.get('/:id', async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: req.params.id },
      include: { skills: { orderBy: { operationName: 'asc' } } },
    })
    if (!worker) return res.status(404).json({ error: 'Worker not found' })
    res.json(worker)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create worker
router.post('/', async (req, res) => {
  try {
    const worker = await prisma.worker.create({ data: req.body })
    res.status(201).json(worker)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update worker
router.put('/:id', async (req, res) => {
  try {
    const worker = await prisma.worker.update({ where: { id: req.params.id }, data: req.body })
    res.json(worker)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST add/update skill
router.post('/:id/skills', async (req, res) => {
  try {
    const { operationName, efficiency } = req.body
    const skill = await prisma.workerSkill.upsert({
      where: { workerId_operationName: { workerId: req.params.id, operationName } },
      update: { efficiency, lastAssessed: new Date() },
      create: { workerId: req.params.id, operationName, efficiency, lastAssessed: new Date() },
    })
    res.json(skill)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET skill matrix for a line or all lines (for heatmap)
router.get('/matrix/:lineId', async (req, res) => {
  try {
    const isAll = req.params.lineId === 'ALL'
    const workers = await prisma.worker.findMany({
      where: { ...(isAll ? {} : { currentLine: req.params.lineId }), isActive: true },
      include: { skills: true },
      orderBy: isAll ? [{ currentLine: 'asc' }, { name: 'asc' }] : [{ name: 'asc' }],
    })

    // Collect all unique operations
    const opSet = new Set()
    workers.forEach(w => w.skills.forEach(s => opSet.add(s.operationName)))
    const operations = [...opSet].sort()

    const matrix = workers.map(w => ({
      id: w.id, empNo: w.empNo, name: w.name, grade: w.grade,
      currentLine: w.currentLine,
      skills: Object.fromEntries(w.skills.map(s => [s.operationName, s.efficiency])),
    }))

    res.json({ workers: matrix, operations })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST upload skill matrix XLSX
router.post('/upload/xlsx', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const parsed = parseSkillMatrixFile(req.file.buffer)

    const upserted = []
    for (const w of parsed) {
      const { skills, ...workerData } = w
      const worker = await prisma.worker.upsert({
        where: { empNo: workerData.empNo },
        update: { name: workerData.name, grade: workerData.grade, currentLine: workerData.currentLine },
        create: workerData,
      })
      for (const skill of skills) {
        await prisma.workerSkill.upsert({
          where: { workerId_operationName: { workerId: worker.id, operationName: skill.operationName } },
          update: { efficiency: skill.efficiency, lastAssessed: new Date() },
          create: { workerId: worker.id, ...skill, lastAssessed: new Date() },
        })
      }
      upserted.push(worker.empNo)
    }
    res.json({ count: upserted.length, workers: upserted })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// GET skill gap analysis for an OB
router.get('/gap/:obId', async (req, res) => {
  try {
    const { lineId } = req.query
    const ob = await prisma.operationalBreakdown.findUnique({
      where: { id: req.params.obId },
      include: { operations: true },
    })
    if (!ob) return res.status(404).json({ error: 'OB not found' })

    const workers = await prisma.worker.findMany({
      where: { ...(lineId ? { currentLine: lineId } : {}), isActive: true },
      include: { skills: true },
    })

    const gap = ob.operations.map(op => {
      const qualified = workers.filter(w => {
        const skill = w.skills.find(s => s.operationName.toLowerCase().includes(op.description.toLowerCase()) ||
          op.description.toLowerCase().includes(s.operationName.toLowerCase()))
        return skill && (!op.requiredGrade || (GRADE_ORDER[w.grade] || 0) >= (GRADE_ORDER[op.requiredGrade] || 0))
      })
      return {
        operation: op.description, machineType: op.machineType, isCritical: op.isCritical,
        requiredGrade: op.requiredGrade, qualifiedCount: qualified.length,
        hasGap: qualified.length === 0,
        topWorkers: qualified.slice(0, 3).map(w => ({ name: w.name, grade: w.grade })),
      }
    })

    const GRADE_ORDER = { 'A*': 5, 'A+': 4, 'A': 3, 'B': 2, 'C': 1, 'FLOATER': 0 }
    res.json({ ob: { id: ob.id, styleName: ob.styleName }, gap, gapCount: gap.filter(g => g.hasGap).length })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
