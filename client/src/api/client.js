const BASE = '/api'
const TOKEN_KEY = 'smed_auth_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: t => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function req(method, path, body, isFormData = false) {
  const token = tokenStore.get()
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const opts = {
    method,
    headers,
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  }
  const res = await fetch(`${BASE}${path}`, opts)
  if (res.status === 401) {
    tokenStore.clear()
    // Soft redirect so React Router picks it up
    if (!location.pathname.startsWith('/login')) location.href = '/login'
    throw new Error('Session expired — please log in again')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  me: () => req('GET', '/auth/me'),
  getUsers: () => req('GET', '/auth/users'),
  createUser: data => req('POST', '/auth/users', data),
  updateUser: (id, data) => req('PUT', `/auth/users/${id}`, data),
  deleteUser: id => req('DELETE', `/auth/users/${id}`),

  // OB
  getOBs: (params = {}) => req('GET', `/ob?${new URLSearchParams(params)}`),
  getOB: id => req('GET', `/ob/${id}`),
  createOB: data => req('POST', '/ob', data),
  updateOB: (id, data) => req('PUT', `/ob/${id}`, data),
  deleteOB: id => req('DELETE', `/ob/${id}`),
  duplicateOB: id => req('POST', `/ob/${id}/duplicate`),
  uploadOBXlsx: file => { const fd = new FormData(); fd.append('file', file); return req('POST', '/ob/upload/xlsx', fd, true) },
  addOperations: (obId, ops) => req('POST', `/ob/${obId}/operations`, { operations: ops }),
  updateOperation: (opId, data) => req('PUT', `/ob/operations/${opId}`, data),
  deleteOperation: opId => req('DELETE', `/ob/operations/${opId}`),

  // Workers
  getWorkers: (params = {}) => req('GET', `/workers?${new URLSearchParams(params)}`),
  getWorker: id => req('GET', `/workers/${id}`),
  createWorker: data => req('POST', '/workers', data),
  updateWorker: (id, data) => req('PUT', `/workers/${id}`, data),
  getLineWorkers: lineId => req('GET', `/workers/line/${lineId}`),
  getSkillMatrix: lineId => req('GET', `/workers/matrix/${lineId}`),
  getSkillGap: (obId, lineId) => req('GET', `/workers/gap/${obId}${lineId ? `?lineId=${lineId}` : ''}`),
  addSkill: (workerId, data) => req('POST', `/workers/${workerId}/skills`, data),
  uploadSkillMatrix: file => { const fd = new FormData(); fd.append('file', file); return req('POST', '/workers/upload/xlsx', fd, true) },

  // Allocation
  getPlans: (params = {}) => req('GET', `/allocation?${new URLSearchParams(params)}`),
  getPlan: id => req('GET', `/allocation/${id}`),
  createPlan: data => req('POST', '/allocation', data),
  generateAllocation: id => req('POST', `/allocation/${id}/generate`),
  updateEntry: (entryId, data) => req('PUT', `/allocation/entries/${entryId}`, data),
  updatePlanStatus: (id, status) => req('PUT', `/allocation/${id}/status`, { status }),
  deletePlan: id => req('DELETE', `/allocation/${id}`),
  getT2Alerts: () => req('GET', '/allocation/alerts/t2'),

  // Machines
  getMachines: (params = {}) => req('GET', `/machines?${new URLSearchParams(params)}`),
  getMachineSummary: () => req('GET', '/machines/summary'),
  getMachine: id => req('GET', `/machines/${id}`),
  createMachine: data => req('POST', '/machines', data),
  updateMachine: (id, data) => req('PUT', `/machines/${id}`, data),
  deleteMachine: id => req('DELETE', `/machines/${id}`),
  transferMachine: (id, data) => req('POST', `/machines/${id}/transfer`, data),
  updateCondition: (id, data) => req('POST', `/machines/${id}/condition`, data),
  checkMachineReq: (obId, lineId) => req('POST', '/machines/check', { obId, lineId }),

  // Checklists
  getChecklists: (params = {}) => req('GET', `/checklists?${new URLSearchParams(params)}`),
  getChecklist: id => req('GET', `/checklists/${id}`),
  createChecklist: data => req('POST', '/checklists', data),
  updateChecklist: (id, data) => req('PUT', `/checklists/${id}`, data),
  updateItem: (itemId, data) => req('PATCH', `/checklists/items/${itemId}`, data),
  updateWIP: (wipId, data) => req('PATCH', `/checklists/wip/${wipId}`, data),
  getOverdueItems: () => req('GET', '/checklists/alerts/overdue'),

  // Dashboard
  getDashboard: () => req('GET', '/dashboard'),
}
