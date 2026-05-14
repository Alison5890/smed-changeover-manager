const { execSync } = require('child_process')
const path = require('path')

const serverDir = path.join(__dirname, '..')

console.log('Pushing database schema...')
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: serverDir })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

prisma.worker.count().then(count => {
  if (count === 0) {
    console.log('Empty database — seeding demo data...')
    execSync('node prisma/seed.js', { stdio: 'inherit', cwd: serverDir })
  } else {
    console.log(`Database ready (${count} workers)`)
  }
  return prisma.$disconnect()
}).then(() => {
  require('../src/index.js')
}).catch(e => {
  console.error('Startup failed:', e)
  process.exit(1)
})
