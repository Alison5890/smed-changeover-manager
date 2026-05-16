const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { requireAuth, requireRole, JWT_SECRET } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// GET /api/auth/users — admin only
router.get('/users', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })
    res.json(users)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST /api/auth/users — admin only, create user
router.post('/users', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' })
    const validRoles = ['ADMIN', 'IE', 'SUPERVISOR', 'MAINTENANCE']
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase().trim(), password: hashed, role },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Email already exists' })
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/auth/users/:id — admin only, update role or status
router.put('/users/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, role, isActive } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE /api/auth/users/:id — admin only, can't delete yourself
router.delete('/users/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: "Can't delete your own account" })
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
