const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// GET all machines
router.get('/', async (req, res) => {
  try {
    const { line, type, condition, search } = req.query
    const machines = await prisma.machine.findMany({
      where: {
        ...(line ? { currentLine: line } : {}),
        ...(type ? { machineType: type } : {}),
        ...(condition ? { condition } : {}),
        ...(search ? { OR: [{ machineCode: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }] } : {}),
      },
      orderBy: [{ currentLine: 'asc' }, { machineType: 'asc' }, { workstationNo: 'asc' }],
    })
    res.json(machines)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET machine counts by line
router.get('/summary', async (req, res) => {
  try {
    const lines = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'STORE']
    const summary = await Promise.all(
      lines.map(async line => {
        const machines = await prisma.machine.findMany({ where: { currentLine: line } })
        const byType = machines.reduce((acc, m) => {
          acc[m.machineType] = (acc[m.machineType] || 0) + 1
          return acc
        }, {})
        return {
          line, total: machines.length,
          running: machines.filter(m => m.condition === 'RUNNING').length,
          issues: machines.filter(m => m.condition !== 'RUNNING').length,
          byType,
        }
      })
    )
    res.json(summary.filter(s => s.total > 0))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET single machine
router.get('/:id', async (req, res) => {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: req.params.id },
      include: { transfers: { orderBy: { date: 'desc' }, take: 10 } },
    })
    if (!machine) return res.status(404).json({ error: 'Machine not found' })
    res.json(machine)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create machine
router.post('/', async (req, res) => {
  try {
    const machine = await prisma.machine.create({ data: req.body })
    res.status(201).json(machine)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update machine
router.put('/:id', async (req, res) => {
  try {
    const machine = await prisma.machine.update({ where: { id: req.params.id }, data: req.body })
    res.json(machine)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE machine
router.delete('/:id', async (req, res) => {
  try {
    await prisma.machine.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST transfer machine to another line
router.post('/:id/transfer', async (req, res) => {
  try {
    const { toLine, reason, movedBy } = req.body
    const machine = await prisma.machine.findUnique({ where: { id: req.params.id } })
    if (!machine) return res.status(404).json({ error: 'Machine not found' })

    await prisma.$transaction([
      prisma.machineTransfer.create({
        data: { machineId: machine.id, fromLine: machine.currentLine, toLine, date: new Date(), reason, movedBy },
      }),
      prisma.machine.update({
        where: { id: machine.id },
        data: { currentLine: toLine, workstationNo: null },
      }),
    ])

    const updated = await prisma.machine.findUnique({ where: { id: req.params.id } })
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST update condition (maintenance log)
router.post('/:id/condition', async (req, res) => {
  try {
    const { condition, notes, nextMaintenanceDue } = req.body
    const machine = await prisma.machine.update({
      where: { id: req.params.id },
      data: {
        condition,
        notes: notes || undefined,
        lastMaintenanceDate: condition === 'RUNNING' ? new Date() : undefined,
        nextMaintenanceDue: nextMaintenanceDue ? new Date(nextMaintenanceDue) : undefined,
      },
    })
    res.json(machine)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST check machine requirements for an OB vs a line
router.post('/check', async (req, res) => {
  try {
    const { obId, lineId } = req.body
    const operations = await prisma.operation.findMany({ where: { obId } })
    const lineMachines = await prisma.machine.findMany({ where: { currentLine: lineId } })

    // Count required by type
    const required = operations.reduce((acc, op) => {
      if (op.machineType !== 'HAND') acc[op.machineType] = (acc[op.machineType] || 0) + 1
      return acc
    }, {})

    // Count available by type (running only)
    const available = lineMachines.reduce((acc, m) => {
      if (!acc[m.machineType]) acc[m.machineType] = { running: 0, issues: [], all: [] }
      if (m.condition === 'RUNNING') acc[m.machineType].running++
      if (m.condition !== 'RUNNING') acc[m.machineType].issues.push({ code: m.machineCode, condition: m.condition })
      acc[m.machineType].all.push(m)
      return acc
    }, {})

    // Build gap analysis
    const checks = Object.entries(required).map(([type, needed]) => {
      const avail = available[type] || { running: 0, issues: [], all: [] }
      const status = avail.running >= needed ? 'OK' : avail.running > 0 ? 'PARTIAL' : 'MISSING'
      return { machineType: type, required: needed, available: avail.running, status, issues: avail.issues }
    })

    // Find same type machines on other lines that could be moved
    const missingTypes = checks.filter(c => c.status !== 'OK').map(c => c.machineType)
    const alternatives = missingTypes.length > 0
      ? await prisma.machine.findMany({
          where: { machineType: { in: missingTypes }, condition: 'RUNNING', currentLine: { not: lineId } },
          select: { id: true, machineCode: true, machineType: true, currentLine: true },
        })
      : []

    res.json({ required, checks, alternatives })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
