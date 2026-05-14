const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

const LINES = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10']

router.get('/', async (req, res) => {
  try {
    const now = new Date()
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Upcoming changeovers (next 7 days)
    const [upcomingPlans, upcomingChecklists] = await Promise.all([
      prisma.allocationPlan.findMany({
        where: { changeoverDate: { gte: now, lte: in7days } },
        include: { ob: true },
        orderBy: { changeoverDate: 'asc' },
      }),
      prisma.checklist.findMany({
        where: { changeoverDate: { gte: now, lte: in7days } },
        include: { items: true },
        orderBy: { changeoverDate: 'asc' },
      }),
    ])

    // Machine alerts
    const [breakdowns, dueSoon] = await Promise.all([
      prisma.machine.findMany({
        where: { condition: { in: ['BREAKDOWN', 'IN_REPAIR'] } },
        select: { machineCode: true, machineType: true, currentLine: true, condition: true, notes: true },
      }),
      prisma.machine.findMany({
        where: { nextMaintenanceDue: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
        select: { machineCode: true, machineType: true, currentLine: true, nextMaintenanceDue: true },
      }),
    ])

    // Overdue checklist items
    const overdueItems = await prisma.checklistItem.findMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      include: { checklist: { select: { lineId: true, styleNumber: true } } },
    })

    // Per-line status
    const lineCards = await Promise.all(LINES.map(async lineId => {
      const nextPlan = await prisma.allocationPlan.findFirst({
        where: { lineId, changeoverDate: { gte: now }, status: { not: 'COMPLETED' } },
        include: { ob: true },
        orderBy: { changeoverDate: 'asc' },
      })
      const nextChecklist = await prisma.checklist.findFirst({
        where: { lineId, changeoverDate: { gte: now } },
        include: { items: true },
        orderBy: { changeoverDate: 'asc' },
      })
      const machineIssues = await prisma.machine.count({
        where: { currentLine: lineId, condition: { not: 'RUNNING' } },
      })

      let checklistPct = null
      if (nextChecklist) {
        const done = nextChecklist.items.filter(i => i.status === 'DONE' || i.status === 'NOT_APPLICABLE').length
        checklistPct = nextChecklist.items.length > 0 ? Math.round((done / nextChecklist.items.length) * 100) : 0
      }

      return {
        lineId,
        nextChangeover: nextPlan ? { date: nextPlan.changeoverDate, style: nextPlan.ob.styleName, status: nextPlan.status } : null,
        checklistProgress: checklistPct,
        machineIssues,
        hasAlerts: machineIssues > 0 || (nextChecklist?.items.some(i => i.status === 'DELAYED')),
      }
    }))

    res.json({
      lineCards,
      upcomingChangeovers: upcomingPlans.map(p => ({
        id: p.id, lineId: p.lineId, date: p.changeoverDate,
        style: p.ob.styleName, buyer: p.ob.buyer, status: p.status,
      })),
      alerts: {
        breakdowns: breakdowns.length,
        maintenanceDue: dueSoon.length,
        overdueChecklist: overdueItems.length,
        details: { breakdowns, dueSoon, overdueItems: overdueItems.slice(0, 10) },
      },
      stats: {
        totalOBs: await prisma.operationalBreakdown.count(),
        totalWorkers: await prisma.worker.count({ where: { isActive: true } }),
        totalMachines: await prisma.machine.count(),
        activePlans: await prisma.allocationPlan.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'ACTIVE'] } } }),
      },
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
