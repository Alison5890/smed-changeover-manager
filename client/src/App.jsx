import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import OBManager from './pages/OBManager'
import SkillMatrix from './pages/SkillMatrix'
import AllocationPlanner from './pages/AllocationPlanner'
import MachineInventory from './pages/MachineInventory'
import ChangeoverChecklist from './pages/ChangeoverChecklist'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ob" element={<OBManager />} />
              <Route path="/skills" element={<SkillMatrix />} />
              <Route path="/allocation" element={<AllocationPlanner />} />
              <Route path="/machines" element={<MachineInventory />} />
              <Route path="/checklists" element={<ChangeoverChecklist />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
