const GRADE_ORDER = { 'A*': 5, 'A+': 4, 'A': 3, 'B': 2, 'C': 1, 'FLOATER': 0 }

function meetsGrade(workerGrade, requiredGrade) {
  if (!requiredGrade) return true
  return (GRADE_ORDER[workerGrade] || 0) >= (GRADE_ORDER[requiredGrade] || 0)
}

function getEfficiency(skillsMap, operationName) {
  if (!skillsMap) return 0
  if (skillsMap.has(operationName)) return skillsMap.get(operationName)
  // fuzzy: partial match
  const opLower = operationName.toLowerCase()
  for (const [name, eff] of skillsMap.entries()) {
    const nameLower = name.toLowerCase()
    if (nameLower.includes(opLower) || opLower.includes(nameLower)) return eff
    // word-level match (e.g. "SLEEVE ATTACH" matches "SLEEVE ATTACH (FOLDER)")
    const opWords = opLower.split(' ').filter(w => w.length > 3)
    const nameWords = nameLower.split(' ').filter(w => w.length > 3)
    const common = opWords.filter(w => nameWords.includes(w))
    if (common.length >= 2) return eff * 0.85 // small penalty for fuzzy
  }
  return 0
}

function generateAllocation(operations, workers, workerSkillsData) {
  // Build skill lookup: workerId -> Map<operationName, efficiency>
  const workerSkills = new Map()
  for (const skill of workerSkillsData) {
    if (!workerSkills.has(skill.workerId)) workerSkills.set(skill.workerId, new Map())
    workerSkills.get(skill.workerId).set(skill.operationName, skill.efficiency)
  }

  // Sort ops: critical first, then by SAM descending
  const sorted = [...operations].sort((a, b) => {
    if (a.isCritical !== b.isCritical) return (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0)
    return b.totalSAM - a.totalSAM
  })

  const allocated = new Set()
  const resultMap = new Map()

  for (const op of sorted) {
    const candidates = workers.filter(w =>
      !allocated.has(w.id) &&
      meetsGrade(w.grade, op.requiredGrade) &&
      getEfficiency(workerSkills.get(w.id), op.description) > 0
    )

    candidates.sort((a, b) =>
      getEfficiency(workerSkills.get(b.id), op.description) -
      getEfficiency(workerSkills.get(a.id), op.description)
    )

    if (candidates.length > 0) {
      const best = candidates[0]
      allocated.add(best.id)
      resultMap.set(op.id, {
        operationId: op.id,
        workerId: best.id,
        matchScore: getEfficiency(workerSkills.get(best.id), op.description),
        isManualOverride: false,
      })
    } else {
      resultMap.set(op.id, {
        operationId: op.id,
        workerId: null,
        matchScore: 0,
        isManualOverride: false,
      })
    }
  }

  // Return in original slNo order
  return [...operations].sort((a, b) => a.slNo - b.slNo).map(op => resultMap.get(op.id))
}

module.exports = { generateAllocation }
