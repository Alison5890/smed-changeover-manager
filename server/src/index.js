require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const obRoutes = require('./routes/ob')
const workerRoutes = require('./routes/workers')
const allocationRoutes = require('./routes/allocation')
const machineRoutes = require('./routes/machines')
const checklistRoutes = require('./routes/checklists')
const dashboardRoutes = require('./routes/dashboard')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/ob', obRoutes)
app.use('/api/workers', workerRoutes)
app.use('/api/allocation', allocationRoutes)
app.use('/api/machines', machineRoutes)
app.use('/api/checklists', checklistRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`SMED Server running on http://localhost:${PORT}`)
})
