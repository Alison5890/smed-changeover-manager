const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ─── OB 1: Henley T-Shirt (21 ops) ────────────────────────────────────────
  const henley = await prisma.operationalBreakdown.create({
    data: {
      styleName: 'Henley Short Sleeve',
      buyer: 'GAP',
      styleNumber: 'D93965-907038-855322',
      totalOperations: 21,
      totalSAM: 8.867,
      operations: {
        create: [
          { slNo: 1,  description: 'WCL PREPARE & ATTACH',            machineType: 'SNLS',     baseSAM: 0.28, allowancePercent: 15, totalSAM: 0.322, threadConsumption: 0.20, isCritical: false },
          { slNo: 2,  description: 'NECK RIB PREPARE',                machineType: 'SNLS',     baseSAM: 0.30, allowancePercent: 15, totalSAM: 0.345, threadConsumption: 0.25, isCritical: false },
          { slNo: 3,  description: 'NECK RIB STAY STITCH',            machineType: 'F/L(2T)',  baseSAM: 0.32, allowancePercent: 15, totalSAM: 0.368, threadConsumption: 0.90, isCritical: false },
          { slNo: 4,  description: 'KNIT PLACKET PREPARE',            machineType: 'SNLS',     baseSAM: 0.45, allowancePercent: 15, totalSAM: 0.517, threadConsumption: 0.40, isCritical: false },
          { slNo: 5,  description: 'KNIT PLACKET MARK & SLASH FRONT', machineType: 'HAND',     baseSAM: 0.50, allowancePercent: 15, totalSAM: 0.575, threadConsumption: 0.00, isCritical: false },
          { slNo: 6,  description: 'KNIT PLACKET ATTACH',             machineType: 'SNLS',     baseSAM: 0.65, allowancePercent: 15, totalSAM: 0.747, threadConsumption: 0.55, isCritical: true,  requiredGrade: 'A' },
          { slNo: 7,  description: 'KNIT PLACKET TOP STITCH',         machineType: 'SNLS',     baseSAM: 0.40, allowancePercent: 15, totalSAM: 0.460, threadConsumption: 0.45, isCritical: false },
          { slNo: 8,  description: 'BUTTON HOLE ON PLACKET',          machineType: 'BH',       baseSAM: 0.25, allowancePercent: 15, totalSAM: 0.287, threadConsumption: 0.09, isCritical: false },
          { slNo: 9,  description: 'BUTTON ATTACH ON PLACKET',        machineType: 'BT',       baseSAM: 0.28, allowancePercent: 15, totalSAM: 0.322, threadConsumption: 0.05, isCritical: false },
          { slNo: 10, description: 'SHOULDER ATTACH',                 machineType: '4TH O/L',  baseSAM: 0.45, allowancePercent: 15, totalSAM: 0.517, threadConsumption: 1.54, isCritical: true,  requiredGrade: 'A' },
          { slNo: 11, description: 'NECK RIB ATTACH',                 machineType: '4TH O/L',  baseSAM: 0.50, allowancePercent: 15, totalSAM: 0.575, threadConsumption: 1.68, isCritical: true,  requiredGrade: 'A' },
          { slNo: 12, description: 'BACK NECK BINDING ATTACH',        machineType: 'F/L(2T)',  baseSAM: 0.35, allowancePercent: 15, totalSAM: 0.402, threadConsumption: 0.60, isCritical: false },
          { slNo: 13, description: 'MAIN LABEL ATTACH / HEAT SEAL',   machineType: 'HT',       baseSAM: 0.20, allowancePercent: 15, totalSAM: 0.230, threadConsumption: 0.00, isCritical: false },
          { slNo: 14, description: 'NECK TOP STITCH',                 machineType: 'F/L(2T)',  baseSAM: 0.35, allowancePercent: 15, totalSAM: 0.402, threadConsumption: 0.75, isCritical: false },
          { slNo: 15, description: 'TACK & FINISH BACK NECK BINDING', machineType: 'SNLS',     baseSAM: 0.25, allowancePercent: 15, totalSAM: 0.287, threadConsumption: 0.18, isCritical: false },
          { slNo: 16, description: 'SLEEVE ATTACH',                   machineType: '4TH O/L',  baseSAM: 0.50, allowancePercent: 15, totalSAM: 0.575, threadConsumption: 1.96, isCritical: true,  requiredGrade: 'A' },
          { slNo: 17, description: 'SIDE ATTACH',                     machineType: '4TH O/L',  baseSAM: 0.50, allowancePercent: 15, totalSAM: 0.575, threadConsumption: 2.10, isCritical: true,  requiredGrade: 'A' },
          { slNo: 18, description: 'SLEEVE HEM',                      machineType: 'F/L(3T)',  baseSAM: 0.38, allowancePercent: 15, totalSAM: 0.437, threadConsumption: 1.43, isCritical: false },
          { slNo: 19, description: 'BOTTOM HEM',                      machineType: 'F/L(3T)',  baseSAM: 0.40, allowancePercent: 15, totalSAM: 0.460, threadConsumption: 1.73, isCritical: false },
          { slNo: 20, description: 'SLEEVE & BOTTOM TACK',            machineType: 'SNLS',     baseSAM: 0.22, allowancePercent: 15, totalSAM: 0.253, threadConsumption: 0.18, isCritical: false },
          { slNo: 21, description: 'PLACKET BAR TACK',                machineType: 'BT',       baseSAM: 0.18, allowancePercent: 15, totalSAM: 0.207, threadConsumption: 0.05, isCritical: false },
        ],
      },
    },
  })

  // ─── OB 2: Round Neck T-Shirt (14 ops) ────────────────────────────────────
  const roundNeck = await prisma.operationalBreakdown.create({
    data: {
      styleName: 'Round Neck T-Shirt',
      buyer: 'GAP',
      styleNumber: 'GS-RN-001-2024',
      totalOperations: 14,
      totalSAM: 5.912,
      operations: {
        create: [
          { slNo: 1,  description: 'SHOULDER ATTACH',          machineType: '4TH O/L', baseSAM: 0.45, allowancePercent: 15, totalSAM: 0.517, threadConsumption: 1.54, isCritical: true,  requiredGrade: 'A' },
          { slNo: 2,  description: 'NECK RIB PREPARE',         machineType: 'SNLS',    baseSAM: 0.28, allowancePercent: 15, totalSAM: 0.322, threadConsumption: 0.22, isCritical: false },
          { slNo: 3,  description: 'NECK RIB ATTACH',          machineType: '4TH O/L', baseSAM: 0.48, allowancePercent: 15, totalSAM: 0.552, threadConsumption: 1.60, isCritical: true,  requiredGrade: 'A' },
          { slNo: 4,  description: 'BACK NECK TAPE ATTACH',    machineType: 'F/L(2T)', baseSAM: 0.32, allowancePercent: 15, totalSAM: 0.368, threadConsumption: 0.55, isCritical: false },
          { slNo: 5,  description: 'MAIN LABEL ATTACH',        machineType: 'HT',      baseSAM: 0.18, allowancePercent: 15, totalSAM: 0.207, threadConsumption: 0.00, isCritical: false },
          { slNo: 6,  description: 'NECK TOP STITCH',          machineType: 'F/L(2T)', baseSAM: 0.35, allowancePercent: 15, totalSAM: 0.402, threadConsumption: 0.72, isCritical: false },
          { slNo: 7,  description: 'SLEEVE ATTACH',            machineType: '4TH O/L', baseSAM: 0.48, allowancePercent: 15, totalSAM: 0.552, threadConsumption: 1.92, isCritical: true,  requiredGrade: 'A' },
          { slNo: 8,  description: 'SIDE SEAM',                machineType: '4TH O/L', baseSAM: 0.45, allowancePercent: 15, totalSAM: 0.517, threadConsumption: 2.05, isCritical: true,  requiredGrade: 'A' },
          { slNo: 9,  description: 'SLEEVE HEM',               machineType: 'F/L(3T)', baseSAM: 0.35, allowancePercent: 15, totalSAM: 0.402, threadConsumption: 1.38, isCritical: false },
          { slNo: 10, description: 'BOTTOM HEM',               machineType: 'F/L(3T)', baseSAM: 0.38, allowancePercent: 15, totalSAM: 0.437, threadConsumption: 1.68, isCritical: false },
          { slNo: 11, description: 'CARE LABEL ATTACH',        machineType: 'SNLS',    baseSAM: 0.15, allowancePercent: 15, totalSAM: 0.172, threadConsumption: 0.12, isCritical: false },
          { slNo: 12, description: 'SIDE SEAM TOP STITCH',     machineType: 'F/L(2T)', baseSAM: 0.32, allowancePercent: 15, totalSAM: 0.368, threadConsumption: 0.80, isCritical: false },
          { slNo: 13, description: 'SLEEVE TACK',              machineType: 'BT',      baseSAM: 0.15, allowancePercent: 15, totalSAM: 0.172, threadConsumption: 0.04, isCritical: false },
          { slNo: 14, description: 'BOTTOM TACK',              machineType: 'BT',      baseSAM: 0.15, allowancePercent: 15, totalSAM: 0.172, threadConsumption: 0.04, isCritical: false },
        ],
      },
    },
  })

  // ─── OB 3: Crew Neck Woven (13 ops) ───────────────────────────────────────
  const crewNeck = await prisma.operationalBreakdown.create({
    data: {
      styleName: 'Crew Neck Woven Shirt',
      buyer: 'Hugo Boss',
      styleNumber: 'HB-CN-WV-2024-007',
      totalOperations: 13,
      totalSAM: 7.245,
      operations: {
        create: [
          { slNo: 1,  description: 'COLLAR ATTACH',            machineType: 'SNLS',     baseSAM: 0.65, allowancePercent: 15, totalSAM: 0.747, threadConsumption: 0.60, isCritical: true,  requiredGrade: 'A+' },
          { slNo: 2,  description: 'COLLAR FINISH',            machineType: 'SNLS',     baseSAM: 0.55, allowancePercent: 15, totalSAM: 0.632, threadConsumption: 0.50, isCritical: true,  requiredGrade: 'A' },
          { slNo: 3,  description: 'SLEEVE PLACKET ATTACH',    machineType: 'SNLS',     baseSAM: 0.70, allowancePercent: 15, totalSAM: 0.805, threadConsumption: 0.65, isCritical: true,  requiredGrade: 'A' },
          { slNo: 4,  description: 'CUFF ATTACH',              machineType: 'SNLS',     baseSAM: 0.60, allowancePercent: 15, totalSAM: 0.690, threadConsumption: 0.55, isCritical: true,  requiredGrade: 'A' },
          { slNo: 5,  description: 'SHOULDER ATTACH',          machineType: '4TH O/L',  baseSAM: 0.42, allowancePercent: 15, totalSAM: 0.483, threadConsumption: 1.40, isCritical: false },
          { slNo: 6,  description: 'SLEEVE ATTACH (FOLDER)',   machineType: '4TH O/L',  baseSAM: 0.55, allowancePercent: 15, totalSAM: 0.632, threadConsumption: 2.10, isCritical: true,  requiredGrade: 'A' },
          { slNo: 7,  description: 'SIDE SEAM',                machineType: '4TH O/L',  baseSAM: 0.50, allowancePercent: 15, totalSAM: 0.575, threadConsumption: 2.20, isCritical: false },
          { slNo: 8,  description: 'POCKET ATTACH',            machineType: 'SNLS',     baseSAM: 0.55, allowancePercent: 15, totalSAM: 0.632, threadConsumption: 0.50, isCritical: true,  requiredGrade: 'A' },
          { slNo: 9,  description: 'BUTTON HOLE',              machineType: 'BH',       baseSAM: 0.30, allowancePercent: 15, totalSAM: 0.345, threadConsumption: 0.12, isCritical: false },
          { slNo: 10, description: 'BUTTON ATTACH',            machineType: 'BT',       baseSAM: 0.35, allowancePercent: 15, totalSAM: 0.402, threadConsumption: 0.08, isCritical: false },
          { slNo: 11, description: 'KANSAI STITCH',            machineType: 'KANSAI',   baseSAM: 0.40, allowancePercent: 15, totalSAM: 0.460, threadConsumption: 1.80, isCritical: false },
          { slNo: 12, description: 'BOTTOM HEM',               machineType: 'F/L(3T)',  baseSAM: 0.38, allowancePercent: 15, totalSAM: 0.437, threadConsumption: 1.65, isCritical: false },
          { slNo: 13, description: 'MAIN LABEL ATTACH',        machineType: 'HT',       baseSAM: 0.18, allowancePercent: 15, totalSAM: 0.207, threadConsumption: 0.00, isCritical: false },
        ],
      },
    },
  })

  // ─── Workers (50 across E1–E5) ────────────────────────────────────────────
  const workerData = [
    // E1
    { empNo: '3441548', name: 'Sumithra K',          dateOfJoin: new Date('2023-01-12'), grade: 'FLOATER', currentLine: 'E1' },
    { empNo: '3444438', name: 'Shrikanta Sethi',     dateOfJoin: new Date('2024-08-15'), grade: 'A+',      currentLine: 'E1' },
    { empNo: '3441170', name: 'K Sakunthala',        dateOfJoin: new Date('2022-11-20'), grade: 'A+',      currentLine: 'E1' },
    { empNo: '3447188', name: 'Firdaus Mallik',      dateOfJoin: new Date('2025-07-28'), grade: 'A*',      currentLine: 'E1' },
    { empNo: '3442201', name: 'Lakshmi Devi',        dateOfJoin: new Date('2022-03-10'), grade: 'A',       currentLine: 'E1' },
    { empNo: '3443390', name: 'Priya Rajan',         dateOfJoin: new Date('2023-05-22'), grade: 'A',       currentLine: 'E1' },
    { empNo: '3445512', name: 'Meenakshi S',         dateOfJoin: new Date('2024-01-08'), grade: 'B',       currentLine: 'E1' },
    { empNo: '3446623', name: 'Asha Kumari',         dateOfJoin: new Date('2024-04-15'), grade: 'B',       currentLine: 'E1' },
    { empNo: '3447734', name: 'Kavitha Nair',        dateOfJoin: new Date('2025-02-01'), grade: 'C',       currentLine: 'E1' },
    { empNo: '3448845', name: 'Radha Krishnan',      dateOfJoin: new Date('2023-09-12'), grade: 'A',       currentLine: 'E1' },
    // E2
    { empNo: '3441001', name: 'Anitha Rao',          dateOfJoin: new Date('2021-06-15'), grade: 'A+',      currentLine: 'E2' },
    { empNo: '3441002', name: 'Suresh Kumar',        dateOfJoin: new Date('2022-08-20'), grade: 'A',       currentLine: 'E2' },
    { empNo: '3441003', name: 'Geetha Reddy',        dateOfJoin: new Date('2023-02-14'), grade: 'A',       currentLine: 'E2' },
    { empNo: '3441004', name: 'Ravi Shankar',        dateOfJoin: new Date('2022-11-30'), grade: 'A*',      currentLine: 'E2' },
    { empNo: '3441005', name: 'Padma Venkatesh',     dateOfJoin: new Date('2024-03-10'), grade: 'B',       currentLine: 'E2' },
    { empNo: '3441006', name: 'Deepa Nair',          dateOfJoin: new Date('2023-07-25'), grade: 'A',       currentLine: 'E2' },
    { empNo: '3441007', name: 'Srinivas M',          dateOfJoin: new Date('2024-05-18'), grade: 'B',       currentLine: 'E2' },
    { empNo: '3441008', name: 'Usha Rani',           dateOfJoin: new Date('2022-12-01'), grade: 'A+',      currentLine: 'E2' },
    { empNo: '3441009', name: 'Jayanthi P',          dateOfJoin: new Date('2025-01-20'), grade: 'C',       currentLine: 'E2' },
    { empNo: '3441010', name: 'Murugesan R',         dateOfJoin: new Date('2023-04-05'), grade: 'A',       currentLine: 'E2' },
    // E3
    { empNo: '3442001', name: 'Saranya M',           dateOfJoin: new Date('2021-09-10'), grade: 'A*',      currentLine: 'E3' },
    { empNo: '3442002', name: 'Balasubramanian K',   dateOfJoin: new Date('2022-06-15'), grade: 'A+',      currentLine: 'E3' },
    { empNo: '3442003', name: 'Vasantha Devi',       dateOfJoin: new Date('2023-01-20'), grade: 'A',       currentLine: 'E3' },
    { empNo: '3442004', name: 'Rajeshwari T',        dateOfJoin: new Date('2024-02-28'), grade: 'B',       currentLine: 'E3' },
    { empNo: '3442005', name: 'Chandra Shekar',      dateOfJoin: new Date('2022-10-05'), grade: 'A',       currentLine: 'E3' },
    { empNo: '3442006', name: 'Pushpa Rani',         dateOfJoin: new Date('2023-08-12'), grade: 'A',       currentLine: 'E3' },
    { empNo: '3442007', name: 'Nagaraj S',           dateOfJoin: new Date('2024-06-01'), grade: 'C',       currentLine: 'E3' },
    { empNo: '3442008', name: 'Indira Devi',         dateOfJoin: new Date('2022-04-14'), grade: 'A+',      currentLine: 'E3' },
    { empNo: '3442009', name: 'Ramakrishna G',       dateOfJoin: new Date('2023-11-10'), grade: 'B',       currentLine: 'E3' },
    { empNo: '3442010', name: 'Vijayalakshmi N',     dateOfJoin: new Date('2021-12-01'), grade: 'A*',      currentLine: 'E3' },
    // E4
    { empNo: '3443001', name: 'Malathi P',           dateOfJoin: new Date('2022-07-20'), grade: 'A',       currentLine: 'E4' },
    { empNo: '3443002', name: 'Govindraj H',         dateOfJoin: new Date('2023-03-15'), grade: 'A+',      currentLine: 'E4' },
    { empNo: '3443003', name: 'Shanthi Kumari',      dateOfJoin: new Date('2024-01-05'), grade: 'B',       currentLine: 'E4' },
    { empNo: '3443004', name: 'Ponnusamy R',         dateOfJoin: new Date('2022-09-18'), grade: 'A',       currentLine: 'E4' },
    { empNo: '3443005', name: 'Kamala Devi',         dateOfJoin: new Date('2023-06-22'), grade: 'A*',      currentLine: 'E4' },
    { empNo: '3443006', name: 'Thangavel K',         dateOfJoin: new Date('2024-04-10'), grade: 'C',       currentLine: 'E4' },
    { empNo: '3443007', name: 'Parimala S',          dateOfJoin: new Date('2022-02-28'), grade: 'A+',      currentLine: 'E4' },
    { empNo: '3443008', name: 'Venkatramaiah D',     dateOfJoin: new Date('2023-10-01'), grade: 'A',       currentLine: 'E4' },
    { empNo: '3443009', name: 'Selvi R',             dateOfJoin: new Date('2025-03-15'), grade: 'C',       currentLine: 'E4' },
    { empNo: '3443010', name: 'Muthukrishnan A',     dateOfJoin: new Date('2022-05-10'), grade: 'A',       currentLine: 'E4' },
    // E5
    { empNo: '3444001', name: 'Rukmini Devi',        dateOfJoin: new Date('2021-07-08'), grade: 'A*',      currentLine: 'E5' },
    { empNo: '3444002', name: 'Arumugam S',          dateOfJoin: new Date('2022-10-20'), grade: 'A+',      currentLine: 'E5' },
    { empNo: '3444003', name: 'Sowmya N',            dateOfJoin: new Date('2023-04-12'), grade: 'A',       currentLine: 'E5' },
    { empNo: '3444004', name: 'Basavaraj T',         dateOfJoin: new Date('2024-02-14'), grade: 'B',       currentLine: 'E5' },
    { empNo: '3444005', name: 'Kumari Devi',         dateOfJoin: new Date('2022-08-01'), grade: 'A',       currentLine: 'E5' },
    { empNo: '3444006', name: 'Natarajan V',         dateOfJoin: new Date('2023-12-10'), grade: 'A+',      currentLine: 'E5' },
    { empNo: '3444007', name: 'Girija K',            dateOfJoin: new Date('2024-07-05'), grade: 'C',       currentLine: 'E5' },
    { empNo: '3444008', name: 'Ramadoss M',          dateOfJoin: new Date('2022-03-25'), grade: 'A',       currentLine: 'E5' },
    { empNo: '3444009', name: 'Nirmala Devi',        dateOfJoin: new Date('2023-09-18'), grade: 'A',       currentLine: 'E5' },
    { empNo: '3444010', name: 'Palaniappan G',       dateOfJoin: new Date('2021-11-15'), grade: 'A*',      currentLine: 'E5' },
  ]

  const workers = await Promise.all(workerData.map(w => prisma.worker.create({ data: w })))

  // ─── Worker Skills ─────────────────────────────────────────────────────────
  const allOps = [
    'SHOULDER ATTACH', 'NECK RIB ATTACH', 'SLEEVE ATTACH', 'SIDE SEAM', 'BOTTOM HEM',
    'SLEEVE HEM', 'NECK RIB PREPARE', 'COLLAR ATTACH', 'COLLAR FINISH', 'POCKET ATTACH',
    'SIDE SEAM TOP STITCH', 'KANSAI STITCH', 'SLEEVE ATTACH (FOLDER)', 'CUFF ATTACH',
    'KNIT PLACKET ATTACH', 'BACK NECK BINDING ATTACH', 'SLEEVE PLACKET ATTACH',
    'BUTTON HOLE', 'BUTTON ATTACH', 'BOTTOM TACK', 'SLEEVE TACK',
  ]

  for (const worker of workers) {
    const numSkills = worker.grade === 'A*' ? 12 : worker.grade === 'A+' ? 10 : worker.grade === 'A' ? 8 : worker.grade === 'B' ? 5 : 3
    const shuffled = [...allOps].sort(() => 0.5 - Math.random()).slice(0, numSkills)
    const baseEff = worker.grade === 'A*' ? 0.85 : worker.grade === 'A+' ? 0.78 : worker.grade === 'A' ? 0.68 : worker.grade === 'B' ? 0.55 : 0.40

    await prisma.workerSkill.createMany({
      data: shuffled.map(op => ({
        workerId: worker.id,
        operationName: op,
        efficiency: Math.min(1.0, baseEff + (Math.random() * 0.20 - 0.05)),
        lastAssessed: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      })),
    })
  }

  // Ensure critical operations have at least a few skilled workers on E1–E3
  const criticalOps = ['SHOULDER ATTACH', 'NECK RIB ATTACH', 'SLEEVE ATTACH', 'COLLAR ATTACH']
  const e1Workers = workers.filter(w => w.currentLine === 'E1').slice(0, 5)
  const e2Workers = workers.filter(w => w.currentLine === 'E2').slice(0, 5)

  for (const op of criticalOps) {
    for (const w of [...e1Workers, ...e2Workers]) {
      await prisma.workerSkill.upsert({
        where: { workerId_operationName: { workerId: w.id, operationName: op } },
        update: {},
        create: { workerId: w.id, operationName: op, efficiency: 0.75 + Math.random() * 0.20, lastAssessed: new Date() },
      })
    }
  }

  // ─── Machines (30 across 5 lines) ─────────────────────────────────────────
  const machineData = [
    // E1
    { machineCode: 'SNLS-001', machineType: 'SNLS',    brand: 'Juki',    currentLine: 'E1', workstationNo: 1,  condition: 'RUNNING' },
    { machineCode: 'SNLS-002', machineType: 'SNLS',    brand: 'Juki',    currentLine: 'E1', workstationNo: 2,  condition: 'RUNNING' },
    { machineCode: 'SNLS-003', machineType: 'SNLS',    brand: 'Juki',    currentLine: 'E1', workstationNo: 3,  condition: 'RUNNING' },
    { machineCode: 'OL4-001',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E1', workstationNo: 5,  condition: 'RUNNING' },
    { machineCode: 'OL4-002',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E1', workstationNo: 6,  condition: 'RUNNING' },
    { machineCode: 'FL2T-001', machineType: 'F/L(2T)', brand: 'Yamato',  currentLine: 'E1', workstationNo: 8,  condition: 'RUNNING' },
    // E2
    { machineCode: 'SNLS-004', machineType: 'SNLS',    brand: 'Brother', currentLine: 'E2', workstationNo: 1,  condition: 'RUNNING' },
    { machineCode: 'SNLS-005', machineType: 'SNLS',    brand: 'Brother', currentLine: 'E2', workstationNo: 2,  condition: 'NEEDS_MAINTENANCE' },
    { machineCode: 'OL4-003',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E2', workstationNo: 4,  condition: 'RUNNING' },
    { machineCode: 'OL4-004',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E2', workstationNo: 5,  condition: 'RUNNING' },
    { machineCode: 'FL3T-001', machineType: 'F/L(3T)', brand: 'Yamato',  currentLine: 'E2', workstationNo: 7,  condition: 'RUNNING' },
    { machineCode: 'BH-001',   machineType: 'BH',      brand: 'Juki',    currentLine: 'E2', workstationNo: 9,  condition: 'RUNNING' },
    // E3
    { machineCode: 'SNLS-006', machineType: 'SNLS',    brand: 'Juki',    currentLine: 'E3', workstationNo: 1,  condition: 'RUNNING' },
    { machineCode: 'SNLS-007', machineType: 'SNLS',    brand: 'Juki',    currentLine: 'E3', workstationNo: 2,  condition: 'RUNNING' },
    { machineCode: 'OL4-005',  machineType: '4TH O/L', brand: 'Kansai',  currentLine: 'E3', workstationNo: 4,  condition: 'BREAKDOWN', notes: 'Motor fault - waiting for part' },
    { machineCode: 'OL4-006',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E3', workstationNo: 5,  condition: 'RUNNING' },
    { machineCode: 'FL2T-002', machineType: 'F/L(2T)', brand: 'Yamato',  currentLine: 'E3', workstationNo: 7,  condition: 'RUNNING' },
    { machineCode: 'KNS-001',  machineType: 'KANSAI',  brand: 'Kansai',  currentLine: 'E3', workstationNo: 10, condition: 'RUNNING' },
    // E4
    { machineCode: 'SNLS-008', machineType: 'SNLS',    brand: 'Brother', currentLine: 'E4', workstationNo: 1,  condition: 'RUNNING' },
    { machineCode: 'SNLS-009', machineType: 'SNLS',    brand: 'Brother', currentLine: 'E4', workstationNo: 2,  condition: 'RUNNING' },
    { machineCode: 'OL4-007',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E4', workstationNo: 4,  condition: 'IN_REPAIR' },
    { machineCode: 'FL3T-002', machineType: 'F/L(3T)', brand: 'Yamato',  currentLine: 'E4', workstationNo: 6,  condition: 'RUNNING' },
    { machineCode: 'HT-001',   machineType: 'HT',      brand: 'Stahls',  currentLine: 'E4', workstationNo: 11, condition: 'RUNNING' },
    { machineCode: 'BT-001',   machineType: 'BT',      brand: 'Juki',    currentLine: 'E4', workstationNo: 12, condition: 'RUNNING' },
    // E5
    { machineCode: 'SNLS-010', machineType: 'SNLS',    brand: 'Juki',    currentLine: 'E5', workstationNo: 1,  condition: 'RUNNING' },
    { machineCode: 'SNLS-011', machineType: 'SNLS',    brand: 'Juki',    currentLine: 'E5', workstationNo: 2,  condition: 'RUNNING' },
    { machineCode: 'OL4-008',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E5', workstationNo: 4,  condition: 'RUNNING' },
    { machineCode: 'OL4-009',  machineType: '4TH O/L', brand: 'Pegasus', currentLine: 'E5', workstationNo: 5,  condition: 'RUNNING' },
    { machineCode: 'FL2T-003', machineType: 'F/L(2T)', brand: 'Yamato',  currentLine: 'E5', workstationNo: 7,  condition: 'NEEDS_MAINTENANCE', nextMaintenanceDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { machineCode: 'BH-002',   machineType: 'BH',      brand: 'Juki',    currentLine: 'E5', workstationNo: 9,  condition: 'RUNNING' },
  ]

  await prisma.machine.createMany({ data: machineData })

  // ─── Sample Checklist for E2 (changeover in 3 days) ───────────────────────
  const changeoverDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const fileHandoverDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)

  const checklist = await prisma.checklist.create({
    data: {
      lineId: 'E2',
      buyer: 'GAP',
      styleNumber: roundNeck.styleNumber,
      description: roundNeck.styleName,
      factoryLine: 'E2',
      fileHandoverDate,
      changeoverDate,
      obId: roundNeck.id,
      status: 'IN_PROGRESS',
      items: {
        create: [
          // Industrial Engineering
          { section: 'Industrial Engineering', activity: 'Line Design OB is Made', responsible: 'ANIRUD', daysBefore: 7, dueDate: new Date(changeoverDate.getTime() - 7 * 86400000), status: 'DONE', actualDate: new Date(changeoverDate.getTime() - 8 * 86400000) },
          { section: 'Industrial Engineering', activity: 'Line design reviewed with team & Simulation Layout displayed', responsible: 'Vinay', daysBefore: 5, dueDate: new Date(changeoverDate.getTime() - 5 * 86400000), status: 'DONE', actualDate: new Date(changeoverDate.getTime() - 5 * 86400000) },
          { section: 'Industrial Engineering', activity: 'Preparatory Line requirement identified and Planned', responsible: 'ANIRUD', daysBefore: 5, dueDate: new Date(changeoverDate.getTime() - 5 * 86400000), status: 'DELAYED', remarks: 'Waiting for final OB approval' },
          { section: 'Industrial Engineering', activity: 'Preparatory line started as per Plan', responsible: 'Vinay', daysBefore: 3, dueDate: new Date(changeoverDate.getTime() - 3 * 86400000), status: 'PENDING' },
          // COT Kit
          { section: 'COT Kit', activity: 'Pattern received on time', responsible: 'POOJITHA', daysBefore: 10, dueDate: new Date(changeoverDate.getTime() - 10 * 86400000), status: 'DONE' },
          { section: 'COT Kit', activity: 'New Profiles/templates identified', responsible: 'ROBERT', daysBefore: 8, dueDate: new Date(changeoverDate.getTime() - 8 * 86400000), status: 'DONE' },
          { section: 'COT Kit', activity: 'Profiles received on time', responsible: 'POOJITHA', daysBefore: 5, dueDate: new Date(changeoverDate.getTime() - 5 * 86400000), status: 'PENDING' },
          { section: 'COT Kit', activity: 'Folders and Gauge Sets incorporated in COT KIT', responsible: 'ROBERT', daysBefore: 3, dueDate: new Date(changeoverDate.getTime() - 3 * 86400000), status: 'PENDING' },
          { section: 'COT Kit', activity: 'Special machines available and set offline with actual fabric', responsible: 'POOJITHA', daysBefore: 2, dueDate: new Date(changeoverDate.getTime() - 2 * 86400000), status: 'PENDING' },
          // Planning
          { section: 'Planning', activity: 'Size set completed on time (3 days from file receipt)', responsible: 'AJITH', daysBefore: 5, dueDate: new Date(changeoverDate.getTime() - 5 * 86400000), status: 'DONE' },
          { section: 'Planning', activity: 'PP Meeting completed', responsible: 'BABU', daysBefore: 4, dueDate: new Date(changeoverDate.getTime() - 4 * 86400000), status: 'DONE' },
          { section: 'Planning', activity: 'Cutting Approval given on time', responsible: 'AJITH', daysBefore: 3, dueDate: new Date(changeoverDate.getTime() - 3 * 86400000), status: 'PENDING' },
          // Production
          { section: 'Production', activity: 'Supervisor sample prepared', responsible: 'PM/APM', daysBefore: 4, dueDate: new Date(changeoverDate.getTime() - 4 * 86400000), status: 'DONE' },
          { section: 'Production', activity: 'Notch & Numbering requirements communicated to Cutting', responsible: 'TECHNICIAN', daysBefore: 3, dueDate: new Date(changeoverDate.getTime() - 3 * 86400000), status: 'DELAYED', remarks: 'Cutting dept not available' },
          { section: 'Production', activity: 'DFM done for this style and CTQ/CTP published', responsible: 'AMAR', daysBefore: 5, dueDate: new Date(changeoverDate.getTime() - 5 * 86400000), status: 'DONE' },
          { section: 'Production', activity: 'Critical Operations identified and requirements discussed', responsible: 'PM/APM', daysBefore: 4, dueDate: new Date(changeoverDate.getTime() - 4 * 86400000), status: 'DONE' },
          { section: 'Production', activity: 'Operators trained for Critical Operations per Skill GAP', responsible: 'TECHNICIAN', daysBefore: 2, dueDate: new Date(changeoverDate.getTime() - 2 * 86400000), status: 'PENDING' },
        ],
      },
      wipEntries: {
        create: [
          { section: 'FRONT',    cotTarget: 10, peakTargetHrs: 4 },
          { section: 'BACK',     cotTarget: 10, peakTargetHrs: 4 },
          { section: 'SLEEVE',   cotTarget: 10, peakTargetHrs: 4 },
          { section: 'COLLAR',   cotTarget: 10, peakTargetHrs: 4 },
          { section: 'CUFF',     cotTarget: 10, peakTargetHrs: 4 },
          { section: 'ASSEMBLY', cotTarget: 10, peakTargetHrs: 4 },
        ],
      },
    },
  })

  // ─── Sample Allocation Plan for E1 ────────────────────────────────────────
  const henleyOps = await prisma.operation.findMany({ where: { obId: henley.id } })
  const e1WorkerRecords = await prisma.worker.findMany({ where: { currentLine: 'E1' } })

  const plan = await prisma.allocationPlan.create({
    data: {
      lineId: 'E1',
      obId: henley.id,
      changeoverDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'CONFIRMED',
      createdBy: 'ANIRUD',
    },
  })

  // Create entries (simple round-robin for seed)
  const entries = henleyOps.slice(0, e1WorkerRecords.length).map((op, i) => ({
    planId: plan.id,
    operationId: op.id,
    workerId: e1WorkerRecords[i % e1WorkerRecords.length].id,
    matchScore: 0.65 + Math.random() * 0.30,
    isManualOverride: false,
  }))

  await prisma.allocationEntry.createMany({ data: entries })

  console.log('✅ Seed complete:')
  console.log(`   3 OBs (${henley.styleNumber}, ${roundNeck.styleNumber}, ${crewNeck.styleNumber})`)
  console.log(`   ${workers.length} workers across E1–E5`)
  console.log(`   ${machineData.length} machines across 5 lines`)
  console.log(`   1 checklist (E2 changeover in 3 days)`)
  console.log(`   1 allocation plan (E1 — confirmed)`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
