const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { generateAllocation } = require('../utils/allocationEngine')

const router = express.Router()
const prisma = new PrismaClient()

// GET all allocation plans
router.get('/', async (req, res) => {
  try {
    const { status, lineId } = req.query
    const plans = await prisma.allocationPlan.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(lineId ? { lineId } : {}),
      },
      include: {
        ob: { select: { styleName: true, buyer: true, styleNumber: true, totalSAM: true } },
        entries: { include: { worker: { select: { name: true, grade: true, empNo: true } }, operation: { select: { description: true, machineType: true, isCritical: true } } } },
      },
      orderBy: { changeoverDate: 'asc' },
    })
    res.json(plans)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET single plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await prisma.allocationPlan.findUnique({
      where: { id: req.params.id },
      include: {
        ob: { include: { operations: { orderBy: { slNo: 'asc' } } } },
        entries: {
          include: {
            worker: { include: { skills: true } },
            operation: true,
          },
          orderBy: { operation: { slNo: 'asc' } },
        },
      },
    })
    if (!plan) return res.status(404).json({ error: 'Plan not found' })
    res.json(plan)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create new plan (manual, no auto-allocation)
router.post('/', async (req, res) => {
  try {
    const { lineId, obId, changeoverDate, createdBy } = req.body
    const plan = await prisma.allocationPlan.create({
      data: { lineId, obId, changeoverDate: new Date(changeoverDate), createdBy, status: 'DRAFT' },
      include: { ob: true },
    })
    res.status(201).json(plan)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST generate auto-allocation for a plan
router.post('/:id/generate', async (req, res) => {
  try {
    const plan = await prisma.allocationPlan.findUnique({
      where: { id: req.params.id },
      include: { ob: { include: { operations: true } } },
    })
    if (!plan) return res.status(404).json({ error: 'Plan not found' })

    // Get workers for this line
    const workers = await prisma.worker.findMany({
      where: { currentLine: plan.lineId, isActive: true },
    })
    const workerSkills = await prisma.workerSkill.findMany({
      where: { workerId: { in: workers.map(w => w.id) } },
    })

    const suggestions = generateAllocation(plan.ob.operations, workers, workerSkills)

    // Delete existing auto entries, keep manual overrides
    await prisma.allocationEntry.deleteMany({
      where: { planId: plan.id, isManualOverride: false },
    })

    // Create new entries
    if (suggestions.length > 0) {
      await prisma.allocationEntry.createMany({ data: suggestions.map(s => ({ ...s, planId: plan.id })) })
    }

    // Fetch updated plan
    const updated = await prisma.allocationPlan.findUnique({
      where: { id: plan.id },
      include: {
        ob: { include: { operations: { orderBy: { slNo: 'asc' } } } },
        entries: { include: { worker: true, operation: true }, orderBy: { operation: { slNo: 'asc' } } },
      },
    })
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST update a single allocation entry (manual override)
router.put('/entries/:entryId', async (req, res) => {
  try {
    const { workerId, notes } = req.body
    const entry = await prisma.allocationEntry.update({
      where: { id: req.params.entryId },
      data: { workerId, notes, isManualOverride: true, matchScore: null },
      include: { worker: true, operation: true },
    })
    res.json(entry)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update plan status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const plan = await prisma.allocationPlan.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json(plan)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE plan
router.delete('/:id', async (req, res) => {
  try {
    await prisma.allocationPlan.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET T-2 alerts (changeovers in the next 2 days)
router.get('/alerts/t2', async (req, res) => {
  try {
    const now = new Date()
    const in2days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

    const plans = await prisma.allocationPlan.findMany({
      where: {
        changeoverDate: { gte: now, lte: in2days },
        status: { in: ['DRAFT', 'CONFIRMED'] },
      },
      include: {
        ob: true,
        entries: { include: { worker: true, operation: true } },
      },
    })

    const alerts = plans.map(plan => {
      const gaps = plan.entries.filter(e => !e.workerId)
      return {
        planId: plan.id,
        lineId: plan.lineId,
        changeoverDate: plan.changeoverDate,
        styleName: plan.ob.styleName,
        status: plan.status,
        totalOps: plan.entries.length,
        gapCount: gaps.length,
        gapOps: gaps.map(e => e.operation.description),
      }
    })

    res.json(alerts)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
