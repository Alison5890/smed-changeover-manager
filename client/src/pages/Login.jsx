import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/dashboard'

  const submit = async e => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate(from, { replace: true })
    } catch (e) {
      setErr(e.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-teal-600 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-800">SMED Manager</h1>
          <p className="text-xs text-slate-500">Arvind Limited — Woven Unit</p>
        </div>

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Sign in to continue</h2>

          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@arvind.com" autoFocus required />

          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required />

          {err && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={busy || !email || !password}>
            {busy ? 'Signing in…' : <><LogIn size={15} /> Sign In</>}
          </Button>

          <details className="text-xs text-slate-500 cursor-pointer">
            <summary className="font-medium text-slate-600">Demo accounts</summary>
            <ul className="mt-2 space-y-1 font-mono text-[11px]">
              <li>admin@arvind.com / admin123 — Admin</li>
              <li>ie@arvind.com / ie123 — Industrial Engineer</li>
              <li>supervisor@arvind.com / super123 — Supervisor</li>
              <li>maintenance@arvind.com / maint123 — Maintenance</li>
            </ul>
          </details>
        </form>
      </div>
    </div>
  )
}
