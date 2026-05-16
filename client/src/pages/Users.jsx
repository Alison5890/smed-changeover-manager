import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Shield, ShieldCheck, ShieldX, User as UserIcon } from 'lucide-react'
import { api } from '@/api/client'
import { useAuth, ROLES } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { LoadingPage } from '@/components/ui/spinner'
import { fmtDate } from '@/lib/utils'

const ROLE_OPTIONS = ['ADMIN', 'IE', 'SUPERVISOR', 'MAINTENANCE']
const ROLE_COLORS = {
  ADMIN: 'purple', IE: 'blue', SUPERVISOR: 'teal', MAINTENANCE: 'amber',
}

function NewUserDialog({ open, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SUPERVISOR' })
  const [err, setErr] = useState('')
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.createUser(form),
    onSuccess: () => {
      qc.invalidateQueries(['users'])
      onClose()
      setForm({ name: '', email: '', password: '', role: 'SUPERVISOR' })
      setErr('')
    },
    onError: e => setErr(e.message),
  })

  return (
    <Dialog open={open} onClose={onClose} title="Add New User" size="sm">
      <div className="p-6 space-y-3">
        <Input label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
        <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@arvind.com" />
        <Input label="Temporary Password *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" />
        <Select label="Role *" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLES[r].label} ({r})</option>)}
        </Select>
        {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => mut.mutate()} disabled={!form.name || !form.email || !form.password || mut.isPending}>
            {mut.isPending ? 'Creating…' : 'Create User'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default function Users() {
  const [showNew, setShowNew] = useState(false)
  const { user: currentUser } = useAuth()
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: api.getUsers })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => api.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries(['users']),
  })
  const deleteMut = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => qc.invalidateQueries(['users']),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-5 max-w-screen-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">User Profiles & Access</h2>
          <p className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> Add User</Button>
      </div>

      {/* Role legend */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Access by role</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {ROLE_OPTIONS.map(r => (
              <div key={r} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                <Badge variant={ROLE_COLORS[r]}>{r}</Badge>
                <div className="text-xs text-slate-600">
                  <p className="font-medium text-slate-700">{ROLES[r].label}</p>
                  <p className="text-slate-500 text-[11px]">
                    {ROLES[r].allowedPaths.includes('*') ? 'All modules' : ROLES[r].allowedPaths.map(p => p.replace('/', '')).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 text-xs uppercase">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 text-xs uppercase">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 text-xs uppercase">Role</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 text-xs uppercase">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 text-xs uppercase">Joined</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {u.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
                    </div>
                    <span className="font-medium text-slate-800">{u.name}</span>
                    {u.id === currentUser?.id && <Badge variant="teal" className="text-[10px]">You</Badge>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-2.5">
                  <Select value={u.role} onChange={e => updateMut.mutate({ id: u.id, data: { role: e.target.value } })}
                    disabled={u.id === currentUser?.id} className="h-8 text-xs">
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => updateMut.mutate({ id: u.id, data: { isActive: !u.isActive } })}
                    disabled={u.id === currentUser?.id}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'} disabled:opacity-50`}>
                    {u.isActive ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                    {u.isActive ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMut.mutate(u.id) }}
                    disabled={u.id === currentUser?.id}
                    className="p-1.5 rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewUserDialog open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}
