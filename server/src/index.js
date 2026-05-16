require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes = require('./routes/auth')
const obRoutes = require('./routes/ob')
const workerRoutes = require('./routes/workers')
const allocationRoutes = require('./routes/allocation')
const machineRoutes = require('./routes/machines')
const checklistRoutes = require('./routes/checklists')
const dashboardRoutes = require('./routes/dashboard')
const { requireAuth } = require('./middleware/auth')

const app = express()
const PORT = process.env.PORT || 5000
const isProd = process.env.NODE_ENV === 'production'

app.use(cors({
  origin: isProd ? true : 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/ob', requireAuth, obRoutes)
app.use('/api/workers', requireAuth, workerRoutes)
app.use('/api/allocation', requireAuth, allocationRoutes)
app.use('/api/machines', requireAuth, machineRoutes)
app.use('/api/checklists', requireAuth, checklistRoutes)
app.use('/api/dashboard', requireAuth, dashboardRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// Serve React build in production
if (isProd) {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist')
  app.use(express.static(clientDist))
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`SMED Server running on http://localhost:${PORT}`)
})
