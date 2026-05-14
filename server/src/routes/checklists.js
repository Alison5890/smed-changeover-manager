const express = require('express')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

const CHECKLIST_TEMPLATE = [
  { section: 'Industrial Engineering', activity: 'Line Design OB is Made',                                                    responsible: 'IE Engineer',  daysBefore: 7 },
  { section: 'Industrial Engineering', activity: 'Line design reviewed with team & Simulation Layout displayed in floor',      responsible: 'IE Engineer',  daysBefore: 5 },
  { section: 'Industrial Engineering', activity: 'Preparatory Line requirement identified and Planned',                        responsible: 'IE Engineer',  daysBefore: 5 },
  { section: 'Industrial Engineering', activity: 'Preparatory line started as per Plan',                                       responsible: 'Supervisor',   daysBefore: 3 },
  { section: 'COT Kit',                activity: 'Pattern received on time',                                                   responsible: 'POOJITHA',     daysBefore: 10 },
  { section: 'COT Kit',                activity: 'New Profiles/templates identified or existing can be used',                  responsible: 'ROBERT',       daysBefore: 8 },
  { section: 'COT Kit',                activity: 'Profiles received on time',                                                  responsible: 'POOJITHA',     daysBefore: 5 },
  { section: 'COT Kit',                activity: 'Collar, Cuff, Sleeve Placket and Pocket Templates received on time',        responsible: 'ROBERT',       daysBefore: 5 },
  { section: 'COT Kit',                activity: 'Sleeve Placket Die set is Ready',                                            responsible: 'POOJITHA',     daysBefore: 3 },
  { section: 'COT Kit',                activity: 'Cuff Die set is Ready',                                                     responsible: 'ROBERT',       daysBefore: 3 },
  { section: 'COT Kit',                activity: 'Folders and Gauge Sets incorporated in COT KIT',                            responsible: 'POOJITHA',     daysBefore: 3 },
  { section: 'COT Kit',                activity: 'Special machines available and set Offline with actual fabric',             responsible: 'ROBERT',       daysBefore: 2 },
  { section: 'Line Mechanic',          activity: 'Bobbin & Case available for all running and future machines',               responsible: 'Mechanic',     daysBefore: 2 },
  { section: 'Line Mechanic',          activity: 'Needle available for all running and future machines',                      responsible: 'Mechanic',     daysBefore: 2 },
  { section: 'Planning',               activity: 'Size set completed on time (3 days from file receipt)',                     responsible: 'AJITH',        daysBefore: 5 },
  { section: 'Planning',               activity: 'PP Meeting done',                                                           responsible: 'BABU',         daysBefore: 4 },
  { section: 'Planning',               activity: 'Cutting Approval given on time',                                            responsible: 'AJITH',        daysBefore: 3 },
  { section: 'Production',             activity: 'Supervisor sample prepared',                                                responsible: 'PM/APM',       daysBefore: 4 },
  { section: 'Production',             activity: 'Notch, Numbering placement & Margins requirement communicated to Cutting',  responsible: 'TECHNICIAN',   daysBefore: 3 },
  { section: 'Production',             activity: 'DFM done for this style and CTQ and CTP published',                        responsible: 'AMAR',         daysBefore: 5 },
  { section: 'Production',             activity: 'Critical Operations identified and requirements discussed with team',       responsible: 'PM/APM',       daysBefore: 4 },
  { section: 'Production',             activity: 'Operators trained for Critical Operations per Skill GAP',                  responsible: 'TECHNICIAN',   daysBefore: 2 },
]

const WIP_SECTIONS = ['FRONT', 'BACK', 'SLEEVE', 'COLLAR', 'CUFF', 'ASSEMBLY']

// GET all checklists
router.get('/', async (req, res) => {
  try {
    const { lineId, status } = req.query
    const lists = await prisma.checklist.findMany({
      where: {
        ...(lineId ? { lineId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        ob: { select: { styleName: true, totalSAM: true } },
        items: true,
        wipEntries: true,
      },
      orderBy: { changeoverDate: 'asc' },
    })
    res.json(lists)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET single checklist
router.get('/:id', async (req, res) => {
  try {
    const checklist = await prisma.checklist.findUnique({
      where: { id: req.params.id },
      include: {
        ob: true,
        items: { orderBy: [{ section: 'asc' }, { daysBefore: 'desc' }] },
        wipEntries: { orderBy: { section: 'asc' } },
      },
    })
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' })
    res.json(checklist)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create checklist (auto-generates items from template)
router.post('/', async (req, res) => {
  try {
    const { lineId, buyer, styleNumber, description, factoryLine, fileHandoverDate, changeoverDate, obId } = req.body
    const cod = new Date(changeoverDate)

    const items = CHECKLIST_TEMPLATE.map(t => ({
      ...t,
      dueDate: new Date(cod.getTime() - t.daysBefore * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    }))

    const checklist = await prisma.checklist.create({
      data: {
        lineId, buyer, styleNumber, description, factoryLine,
        fileHandoverDate: new Date(fileHandoverDate),
        changeoverDate: cod,
        obId: obId || null,
        status: 'NOT_STARTED',
        items: { create: items },
        wipEntries: { create: WIP_SECTIONS.map(s => ({ section: s, cotTarget: 10, peakTargetHrs: 4 })) },
      },
      include: { items: true, wipEntries: true },
    })
    res.status(201).json(checklist)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT update checklist header
router.put('/:id', async (req, res) => {
  try {
    const checklist = await prisma.checklist.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(checklist)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PATCH update a checklist item (mark done/delayed)
router.patch('/items/:itemId', async (req, res) => {
  try {
    const { status, remarks, actualDate } = req.body
    const item = await prisma.checklistItem.update({
      where: { id: req.params.itemId },
      data: {
        status,
        remarks: remarks || undefined,
        actualDate: status === 'DONE' ? (actualDate ? new Date(actualDate) : new Date()) : null,
      },
    })

    // Update parent checklist status
    const siblings = await prisma.checklistItem.findMany({ where: { checklistId: item.checklistId } })
    const doneCount = siblings.filter(s => s.status === 'DONE' || s.status === 'NOT_APPLICABLE').length
    const delayedCount = siblings.filter(s => s.status === 'DELAYED').length
    const overallStatus = doneCount === siblings.length ? 'COMPLETED' : doneCount > 0 || delayedCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    await prisma.checklist.update({ where: { id: item.checklistId }, data: { status: overallStatus } })

    res.json(item)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PATCH update WIP entry
router.patch('/wip/:wipId', async (req, res) => {
  try {
    const entry = await prisma.wipEntry.update({ where: { id: req.params.wipId }, data: req.body })
    res.json(entry)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET overdue items across all checklists
router.get('/alerts/overdue', async (req, res) => {
  try {
    const now = new Date()
    const items = await prisma.checklistItem.findMany({
      where: { status: 'PENDING', dueDate: { lt: now } },
      include: { checklist: { select: { lineId: true, styleNumber: true, changeoverDate: true } } },
      orderBy: { dueDate: 'asc' },
    })
    res.json(items)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
