const express = require('express')
const multer = require('multer')
const { PrismaClient } = require('@prisma/client')
const { parseOBFile } = require('../utils/xlsxParser')

const router = express.Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// GET all OBs
router.get('/', async (req, res) => {
  try {
    const { search, buyer } = req.query
    const obs = await prisma.operationalBreakdown.findMany({
      where: {
        ...(search ? { OR: [{ styleName: { contains: search, mode: 'insensitive' } }, { styleNumber: { contains: search, mode: 'insensitive' } }] } : {}),
        ...(buyer ? { buyer } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(obs)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET single OB with operations
router.get('/:id', async (req, res) => {
  try {
    const ob = await prisma.operationalBreakdown.findUnique({
      where: { id: req.params.id },
      include: { operations: { orderBy: { slNo: 'asc' } } },
    })
    if (!ob) return res.status(404).json({ error: 'OB not found' })
    res.json(ob)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create new OB (manual)
router.post('/', async (req, res) => {
  try {
    const { styleName, buyer, styleNumber, operations = [] } = req.body
    const totalSAM = operations.reduce((s, o) => s + (o.totalSAM || 0), 0)
    const ob = await prisma.operationalBreakdown.create({
      data: {
        styleName, buyer, styleNumber,
        totalOperations: operations.length,
        totalSAM: parseFloat(totalSAM.toFixed(3)),
        operations: { create: operations.map(op => ({
          slNo: op.slNo, description: op.description.toUpperCase(), machineType: op.machineType.toUpperCase(),
          baseSAM: op.baseSAM, allowancePercent: op.allowancePercent || 15,
          totalSAM: op.totalSAM || parseFloat((op.baseSAM * (1 + (op.allowancePercent || 15) / 100)).toFixed(3)),
          threadConsumption: op.threadConsumption || null, isCritical: op.isCritical || false,
          requiredGrade: op.requiredGrade || null,
        })) },
      },
      include: { operations: { orderBy: { slNo: 'asc' } } },
    })
    res.status(201).json(ob)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update OB
router.put('/:id', async (req, res) => {
  try {
    const { styleName, buyer, styleNumber } = req.body
    const ob = await prisma.operationalBreakdown.update({
      where: { id: req.params.id },
      data: { styleName, buyer, styleNumber },
    })
    res.json(ob)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE OB
router.delete('/:id', async (req, res) => {
  try {
    await prisma.operationalBreakdown.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST duplicate OB
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await prisma.operationalBreakdown.findUnique({
      where: { id: req.params.id },
      include: { operations: true },
    })
    if (!original) return res.status(404).json({ error: 'OB not found' })

    const copy = await prisma.operationalBreakdown.create({
      data: {
        styleName: `${original.styleName} (Copy)`,
        buyer: original.buyer,
        styleNumber: `${original.styleNumber}-COPY`,
        totalOperations: original.totalOperations,
        totalSAM: original.totalSAM,
        operations: {
          create: original.operations.map(({ id, obId, ...op }) => op),
        },
      },
      include: { operations: { orderBy: { slNo: 'asc' } } },
    })
    res.status(201).json(copy)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST upload XLSX
router.post('/upload/xlsx', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const operations = parseOBFile(req.file.buffer)
    res.json({ operations, count: operations.length })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// POST add operations to existing OB
router.post('/:id/operations', async (req, res) => {
  try {
    const { operations } = req.body
    const created = await prisma.operation.createMany({
      data: operations.map(op => ({
        obId: req.params.id, slNo: op.slNo, description: op.description.toUpperCase(),
        machineType: op.machineType.toUpperCase(), baseSAM: op.baseSAM,
        allowancePercent: op.allowancePercent || 15,
        totalSAM: op.totalSAM || parseFloat((op.baseSAM * 1.15).toFixed(3)),
        threadConsumption: op.threadConsumption || null, isCritical: op.isCritical || false,
        requiredGrade: op.requiredGrade || null,
      })),
    })
    // Update totals
    const all = await prisma.operation.findMany({ where: { obId: req.params.id } })
    await prisma.operationalBreakdown.update({
      where: { id: req.params.id },
      data: { totalOperations: all.length, totalSAM: all.reduce((s, o) => s + o.totalSAM, 0) },
    })
    res.json({ count: created.count })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update single operation
router.put('/operations/:opId', async (req, res) => {
  try {
    const op = await prisma.operation.update({ where: { id: req.params.opId }, data: req.body })
    res.json(op)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE single operation
router.delete('/operations/:opId', async (req, res) => {
  try {
    const op = await prisma.operation.delete({ where: { id: req.params.opId } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
