const XLSX = require('xlsx')

const str = v => (v === null || v === undefined ? null : (String(v).trim() || null))
const num = v => {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

const HEADER_LABELS = {
  'style no': 'styleNumber',
  'style no.': 'styleNumber',
  'style number': 'styleNumber',
  'buyer': 'buyer',
  'm/c sam': 'machineSAMTotal',
  'output at 60%': 'output60',
  'item no': 'itemNo',
  'item no.': 'itemNo',
  'order qty': 'orderQty',
  'output at 100%': 'output100',
  'desc': 'description',
  'description': 'description',
  'line no': 'lineNo',
  'line no.': 'lineNo',
  'total sam': 'totalSAMHeader',
  'min. per day': 'minPerDay',
  'min per day': 'minPerDay',
  'fabric': 'fabric',
  'takt time in sec': 'taktTimeSec',
  'takt time': 'taktTimeSec',
  'm/c ws': 'machineWS',
  'output / hr (100%)': 'outputPerHr',
  'output/hr (100%)': 'outputPerHr',
  'output / hr': 'outputPerHr',
  'output/hr': 'outputPerHr',
  'division': 'division',
  'non machine ws': 'nonMachineWS',
  'non m/c ws': 'nonMachineWS',
  'pcs / mc': 'pcsPerMC',
  'pcs/mc': 'pcsPerMC',
  'total w.s': 'totalWS',
  'total ws': 'totalWS',
}

const cleanLabel = s => String(s || '').trim().toLowerCase().replace(/\s*:\s*$/, '').replace(/\s+/g, ' ')

function scanHeader(headerRows) {
  const out = {}
  for (const row of headerRows) {
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]
      if (cell === '' || cell == null) continue
      const key = HEADER_LABELS[cleanLabel(cell)]
      if (!key) continue
      for (let k = c + 1; k < Math.min(c + 6, row.length); k++) {
        const v = row[k]
        if (v !== '' && v != null && String(v).trim() !== '') {
          out[key] = v
          break
        }
      }
    }
  }
  return out
}

function isSectionBanner(row) {
  // SL.NO empty, OPERATION cell has section name, everything else empty
  const c0 = String(row[0] || '').trim()
  const c1 = String(row[1] || '').trim().toUpperCase()
  if (c0) return false
  if (!c1) return false
  return c1.includes('SECTION') || c1 === 'CENTRALIZED' || c1 === 'AFTER WASH' || c1 === 'CENTRALISED'
}

function isSummaryRow(row) {
  const c1 = String(row[1] || '').trim().toUpperCase()
  return c1.includes('SUB TOTAL') || c1.startsWith('TOTAL ') || c1 === 'TOTAL' || c1.includes('SUMMARY')
}

function normalizeSection(label) {
  return label.replace(/\s*SECTION\s*$/i, '').trim().toUpperCase()
}

function parseTDSFormat(rows, headerRowIdx) {
  const header = scanHeader(rows.slice(0, headerRowIdx))

  let i = headerRowIdx + 1
  // Skip the sub-header row that holds "PER HR | PER DAY"
  if (i < rows.length) {
    const subRow = rows[i].map(c => String(c || '').toUpperCase()).join(' ')
    if (subRow.includes('PER HR') || subRow.includes('PER DAY')) i++
  }

  let section = null
  const operations = []

  for (; i < rows.length; i++) {
    const row = rows[i] || []
    if (isSummaryRow(row)) break
    if (isSectionBanner(row)) { section = normalizeSection(String(row[1])); continue }

    const sl = parseInt(row[0])
    const desc = String(row[1] || '').trim()
    if (!Number.isFinite(sl) || !desc) continue

    const baseSAM = num(row[2]) || 0
    const manualSAM = num(row[3])
    const machineType = String(row[4] || 'SNLS').trim().toUpperCase() || 'SNLS'
    const critPts = str(row[21])
    const totalSAM = parseFloat((baseSAM + (manualSAM || 0)).toFixed(3))

    operations.push({
      slNo: sl,
      section,
      description: desc.toUpperCase(),
      machineType,
      baseSAM,
      manualSAM,
      allowancePercent: 0,
      totalSAM,
      uncutThreadSources: str(row[5]),
      machineLimitationOnUT: str(row[6]),
      folderWorkaids: str(row[7]),
      noOfMcCalculation: num(row[8]),
      workstationsNo: num(row[9]),
      perHr: num(row[10]),
      targetAt70: null,
      perDay: num(row[11]),
      needle: str(row[12]),
      thread: str(row[13]),
      threadConsumption: null,
      spi: num(row[14]),
      presserFoot: str(row[15]),
      feedDog: str(row[16]),
      spm: num(row[17]),
      spring: str(row[18]),
      needlePlate: str(row[19]),
      model: str(row[20]),
      criticalPoints: critPts,
      remarks: str(row[22]),
      isCritical: !!critPts,
      requiredGrade: null,
    })
  }

  return {
    header: {
      styleNumber: str(header.styleNumber),
      buyer: str(header.buyer),
      itemNo: str(header.itemNo),
      orderQty: num(header.orderQty),
      description: str(header.description),
      fabric: str(header.fabric),
      division: str(header.division),
      lineNo: str(header.lineNo),
      taktTimeSec: num(header.taktTimeSec),
      output60: num(header.output60),
      output100: num(header.output100),
      outputPerHr: num(header.outputPerHr),
      minPerDay: num(header.minPerDay),
      pcsPerMC: num(header.pcsPerMC),
      machineWS: num(header.machineWS),
      nonMachineWS: num(header.nonMachineWS),
      totalWS: num(header.totalWS),
    },
    operations,
  }
}

function parseFlatFormat(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  if (rows.length === 0) throw new Error('Empty sheet — no data found')

  const keys = Object.keys(rows[0]).map(k => k.trim())
  const findCol = (...cands) => {
    for (const c of cands) {
      const m = keys.find(k => k.toLowerCase().includes(c.toLowerCase()))
      if (m) return m
    }
    return null
  }

  const slCol = findCol('sl', '#', 'seq')
  const descCol = findCol('operation', 'description', 'desc')
  const mcCol = findCol('machine type', 'm/c type', 'machine')
  const mSamCol = findCol('machine sam', 'base sam', 'sam')
  const manualSamCol = findCol('manual sam')
  const allowCol = findCol('allowance', 'allow')
  if (!descCol || !mSamCol) throw new Error('Could not find required columns: Operation and Machine SAM')

  const sStr = (row, col) => (col ? str(row[col]) : null)
  const sNum = (row, col) => (col ? num(row[col]) : null)

  const operations = []
  for (const row of rows) {
    const desc = String(row[descCol] || '').trim().toUpperCase()
    const sam = parseFloat(row[mSamCol]) || 0
    if (!desc || desc === 'TOTAL' || sam === 0) continue
    const allow = parseFloat(row[allowCol]) || 15
    operations.push({
      slNo: parseInt(row[slCol]) || operations.length + 1,
      section: null,
      description: desc,
      machineType: String(row[mcCol] || 'SNLS').trim().toUpperCase(),
      baseSAM: sam,
      manualSAM: sNum(row, manualSamCol),
      allowancePercent: allow,
      totalSAM: parseFloat((sam * (1 + allow / 100)).toFixed(3)),
      isCritical: false,
      requiredGrade: null,
    })
  }
  return { header: {}, operations }
}

/**
 * Parse an OB / Technical Data Sheet XLSX.
 * Detects the multi-row TDS format (header metadata block + section-banded operations).
 * Falls back to flat single-row-header format for older sheets.
 * Returns { header, operations }.
 */
function parseOBFile(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: true })
  if (!rows.length) throw new Error('Empty sheet — no data found')

  let headerRowIdx = -1
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const c0 = String(rows[i][0] || '').trim().toUpperCase().replace(/\./g, '')
    const c1 = String(rows[i][1] || '').trim().toUpperCase()
    if ((c0 === 'SLNO' || c0 === 'SL NO' || c0 === 'SL#' || c0 === 'SL') &&
        (c1 === 'OPERATION' || c1 === 'DESCRIPTION' || c1 === 'ACTIVITY')) {
      headerRowIdx = i
      break
    }
  }

  if (headerRowIdx === -1) return parseFlatFormat(buffer)
  return parseTDSFormat(rows, headerRowIdx)
}

/**
 * Parse a Skill Matrix XLSX file.
 * Format: multiple sheets (one per line).
 * Row 7+ = workers. Columns 6+ = operation skills (efficiency values).
 */
function parseSkillMatrixFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const results = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    if (raw.length < 8) continue

    const headerRow = raw[6]
    if (!headerRow || headerRow.length < 6) continue

    const ops = headerRow.slice(5).map(h => String(h || '').trim().toUpperCase()).filter(Boolean)

    for (let i = 7; i < raw.length; i++) {
      const row = raw[i]
      const empNo = String(row[1] || '').trim()
      const name = String(row[2] || '').trim()
      const doj = row[3]
      const grade = String(row[4] || '').trim().toUpperCase()

      if (!empNo || !name || empNo === 'EMP NO') continue

      const skills = []
      for (let j = 0; j < ops.length; j++) {
        const val = parseFloat(row[j + 5])
        if (!isNaN(val) && val > 0) skills.push({ operationName: ops[j], efficiency: Math.min(val, 1.2) })
      }

      let dateOfJoin
      if (doj && typeof doj === 'string' && doj.includes('-')) dateOfJoin = new Date(doj)
      else if (typeof doj === 'number') {
        const p = XLSX.SSF.parse_date_code(doj)
        dateOfJoin = new Date(p.y, p.m - 1, p.d)
      } else dateOfJoin = new Date()

      results.push({
        empNo, name,
        dateOfJoin: isNaN(dateOfJoin.getTime()) ? new Date() : dateOfJoin,
        grade: ['A*', 'A+', 'A', 'B', 'C', 'FLOATER'].includes(grade) ? grade : 'B',
        currentLine: sheetName.match(/E\d+/i)?.[0]?.toUpperCase() || null,
        skills,
      })
    }
  }
  return results
}

module.exports = { parseOBFile, parseSkillMatrixFile }
