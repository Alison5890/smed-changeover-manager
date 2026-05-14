const XLSX = require('xlsx')

/**
 * Parse an OB (Operational Breakdown) XLSX file.
 * Expected columns: SL#, Description/Operation, Machine Type, Base SAM, Allowance %, Thread
 */
function parseOBFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })

  if (rows.length === 0) throw new Error('Empty sheet — no data found')

  // Try to auto-detect column names (case-insensitive)
  const sampleRow = rows[0]
  const keys = Object.keys(sampleRow).map(k => k.trim())

  const findCol = (...candidates) => {
    for (const c of candidates) {
      const match = keys.find(k => k.toLowerCase().includes(c.toLowerCase()))
      if (match) return match
    }
    return null
  }

  const slCol   = findCol('sl', 'no', '#', 'seq')
  const descCol = findCol('description', 'operation', 'activity', 'desc')
  const mcCol   = findCol('machine', 'm/c', 'mc')
  const samCol  = findCol('base sam', 'sam', 'smv', 'base')
  const allowCol= findCol('allowance', 'allow', '%')
  const threadCol= findCol('thread', 'consumption')

  if (!descCol || !samCol) throw new Error('Could not find required columns: Description and SAM')

  const operations = []
  for (const row of rows) {
    const desc = String(row[descCol] || '').trim().toUpperCase()
    const sam  = parseFloat(row[samCol]) || 0
    if (!desc || desc === 'TOTAL' || sam === 0) continue

    const allow = parseFloat(row[allowCol]) || 15
    const thread = parseFloat(row[threadCol]) || 0
    operations.push({
      slNo: parseInt(row[slCol]) || operations.length + 1,
      description: desc,
      machineType: String(row[mcCol] || 'SNLS').trim().toUpperCase(),
      baseSAM: sam,
      allowancePercent: allow,
      totalSAM: parseFloat((sam * (1 + allow / 100)).toFixed(3)),
      threadConsumption: thread,
      isCritical: false,
      requiredGrade: null,
    })
  }

  return operations
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

    // Row index 6 (0-based) = headers row (SL NO, EMP NO, NAME, DOJ, GRADE, op1, op2...)
    const headerRow = raw[6]
    if (!headerRow || headerRow.length < 6) continue

    // Operations start from column 5 (index 5)
    const ops = headerRow.slice(5).map(h => String(h || '').trim().toUpperCase()).filter(Boolean)

    // Data rows start from row 7 (index 7)
    for (let i = 7; i < raw.length; i++) {
      const row = raw[i]
      const empNo = String(row[1] || '').trim()
      const name  = String(row[2] || '').trim()
      const doj   = row[3]
      const grade = String(row[4] || '').trim().toUpperCase()

      if (!empNo || !name || empNo === 'EMP NO') continue

      const skills = []
      for (let j = 0; j < ops.length; j++) {
        const val = parseFloat(row[j + 5])
        if (!isNaN(val) && val > 0) {
          skills.push({ operationName: ops[j], efficiency: Math.min(val, 1.2) })
        }
      }

      let dateOfJoin
      if (doj && typeof doj === 'string' && doj.includes('-')) {
        dateOfJoin = new Date(doj)
      } else if (typeof doj === 'number') {
        dateOfJoin = XLSX.SSF.parse_date_code(doj)
        dateOfJoin = new Date(dateOfJoin.y, dateOfJoin.m - 1, dateOfJoin.d)
      } else {
        dateOfJoin = new Date()
      }

      results.push({
        empNo,
        name,
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
