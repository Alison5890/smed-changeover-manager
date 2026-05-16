import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OBManager from './pages/OBManager'
import SkillMatrix from './pages/SkillMatrix'
import AllocationPlanner from './pages/AllocationPlanner'
import MachineInventory from './pages/MachineInventory'
import ChangeoverChecklist from './pages/ChangeoverChecklist'
import Users from './pages/Users'

function Shell({ children }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

function HomeRedirect() {
  const { user, canAccess } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (canAccess('/dashboard')) return <Navigate to="/dashboard" replace />
  if (canAccess('/machines')) return <Navigate to="/machines" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/dashboard"  element={<ProtectedRoute requirePath="/dashboard"><Shell><Dashboard /></Shell></ProtectedRoute>} />
          <Route path="/ob"         element={<ProtectedRoute requirePath="/ob"><Shell><OBManager /></Shell></ProtectedRoute>} />
          <Route path="/skills"     element={<ProtectedRoute requirePath="/skills"><Shell><SkillMatrix /></Shell></ProtectedRoute>} />
          <Route path="/allocation" element={<ProtectedRoute requirePath="/allocation"><Shell><AllocationPlanner /></Shell></ProtectedRoute>} />
          <Route path="/machines"   element={<ProtectedRoute requirePath="/machines"><Shell><MachineInventory /></Shell></ProtectedRoute>} />
          <Route path="/checklists" element={<ProtectedRoute requirePath="/checklists"><Shell><ChangeoverChecklist /></Shell></ProtectedRoute>} />
          <Route path="/users"      element={<ProtectedRoute requireAdmin><Shell><Users /></Shell></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
