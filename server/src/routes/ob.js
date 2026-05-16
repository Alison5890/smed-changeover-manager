const express = require('express')
const multer = require('multer')
const { PrismaClient } = require('@prisma/client')
const { parseOBFile } = require('../utils/xlsxParser')

const router = express.Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const num = v => (v === null || v === undefined || v === '' ? null : (Number.isFinite(Number(v)) ? Number(v) : null))
const str = v => (v === null || v === undefined || v === '' ? null : String(v))

const mapHeader = h => ({
  styleName: h.styleName,
  buyer: h.buyer,
  styleNumber: h.styleNumber,
  itemNo: str(h.itemNo),
  orderQty: num(h.orderQty),
  description: str(h.description),
  fabric: str(h.fabric),
  division: str(h.division),
  lineNo: str(h.lineNo),
  taktTimeSec: num(h.taktTimeSec),
  output60: num(h.output60),
  output100: num(h.output100),
  outputPerHr: num(h.outputPerHr),
  minPerDay: num(h.minPerDay) != null ? Math.round(num(h.minPerDay)) : null,
  pcsPerMC: num(h.pcsPerMC),
  machineWS: num(h.machineWS),
  nonMachineWS: num(h.nonMachineWS),
  totalWS: num(h.totalWS),
  machineTimePct: num(h.machineTimePct),
})

const mapOp = op => ({
  slNo: op.slNo, section: op.section ? String(op.section).toUpperCase() : null,
  description: String(op.description || '').toUpperCase(), machineType: String(op.machineType || 'SNLS').toUpperCase(),
  baseSAM: Number(op.baseSAM) || 0, manualSAM: op.manualSAM != null && op.manualSAM !== '' ? Number(op.manualSAM) : null,
  allowancePercent: Number(op.allowancePercent) || 15,
  totalSAM: op.totalSAM || parseFloat(((Number(op.baseSAM) || 0) * (1 + (Number(op.allowancePercent) || 15) / 100)).toFixed(3)),
  uncutThreadSources: op.uncutThreadSources || null, machineLimitationOnUT: op.machineLimitationOnUT || null,
  folderWorkaids: op.folderWorkaids || null, noOfMcCalculation: op.noOfMcCalculation != null ? Number(op.noOfMcCalculation) : null,
  workstationsNo: op.workstationsNo != null ? Number(op.workstationsNo) : null,
  perHr: op.perHr != null ? Number(op.perHr) : null, targetAt70: op.targetAt70 != null ? Number(op.targetAt70) : null,
  perDay: op.perDay != null ? Number(op.perDay) : null,
  needle: op.needle || null, thread: op.thread || null, threadConsumption: op.threadConsumption != null ? Number(op.threadConsumption) : null,
  spi: op.spi != null ? Number(op.spi) : null, presserFoot: op.presserFoot || null, feedDog: op.feedDog || null,
  spm: op.spm != null ? Number(op.spm) : null, spring: op.spring || null, needlePlate: op.needlePlate || null,
  model: op.model || null, criticalPoints: op.criticalPoints || null, remarks: op.remarks || null,
  isCritical: op.isCritical || false, requiredGrade: op.requiredGrade || null,
})

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
    const { operations = [] } = req.body
    const totalSAM = operations.reduce((s, o) => s + (Number(o.totalSAM) || 0), 0)
    const totalManualSAM = operations.reduce((s, o) => s + (Number(o.manualSAM) || 0), 0)
    const ob = await prisma.operationalBreakdown.create({
      data: {
        ...mapHeader(req.body),
        totalOperations: operations.length,
        totalSAM: parseFloat(totalSAM.toFixed(3)),
        totalManualSAM: parseFloat(totalManualSAM.toFixed(3)),
        operations: { create: operations.map(op => mapOp(op)) },
      },
      include: { operations: { orderBy: { slNo: 'asc' } } },
    })
    res.status(201).json(ob)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update OB (header only)
router.put('/:id', async (req, res) => {
  try {
    const ob = await prisma.operationalBreakdown.update({
      where: { id: req.params.id },
      data: mapHeader(req.body),
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

    const { id: _id, createdAt: _c, updatedAt: _u, operations, ...header } = original
    const copy = await prisma.operationalBreakdown.create({
      data: {
        ...header,
        styleName: `${original.styleName} (Copy)`,
        styleNumber: `${original.styleNumber}-COPY`,
        operations: { create: operations.map(({ id, obId, ...op }) => op) },
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
    const result = parseOBFile(req.file.buffer)
    // Backward-compatible: parser may return an array (legacy) or { header, operations }
    if (Array.isArray(result)) return res.json({ operations: result, count: result.length })
    res.json({ header: result.header, operations: result.operations, count: result.operations.length })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// POST add operations to existing OB
router.post('/:id/operations', async (req, res) => {
  try {
    const { operations } = req.body
    const created = await prisma.operation.createMany({
      data: operations.map(op => ({ obId: req.params.id, ...mapOp(op) })),
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
