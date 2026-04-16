import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider, useStore } from './store'
import { FocusProvider } from './FocusContext'
import TopBar from './components/TopBar'
import FocusBar from './components/FocusBar'
import NavBar from './components/NavBar'
import Dashboard from './screens/Dashboard'
import AllTasks from './screens/AllTasks'
import Projects from './screens/Projects'
import General from './screens/General'
import Setup from './screens/Setup'
import Help from './screens/Help'
import { ToastProvider } from './components/Toast'

function AppShell() {
  const { configured, loadData, loading, error } = useStore()

  useEffect(() => {
    if (configured) {
      loadData()
    }
  }, [configured])

  if (!configured) {
    return (
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-[#525252] text-sm">Loading…</div>
      </div>
    )
  }

  if (error === 'AUTH_ERROR') {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="max-w-sm w-full mx-4 p-6 bg-card rounded-xl border border-border text-center">
          <p className="text-red-400 font-medium mb-2">Token invalid or expired</p>
          <p className="text-[#737373] text-sm mb-4">Your GitHub token is invalid or expired.</p>
          <a href="#/setup" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Go to Setup</a>
        </div>
      </div>
    )
  }

  if (error === 'NOT_FOUND') {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="max-w-sm w-full mx-4 p-6 bg-card rounded-xl border border-border text-center">
          <p className="text-[#E8E8E6] font-medium mb-2">tasks.json not found</p>
          <p className="text-[#737373] text-sm mb-4">
            Copy <code className="font-mono bg-[#262626] px-1 rounded text-xs">data/tasks.example.json</code> to{' '}
            <code className="font-mono bg-[#262626] px-1 rounded text-xs">data/tasks.json</code> in your repository.
          </p>
          <a href="#/setup" className="text-blue-400 text-sm underline">Back to Setup</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopBar />
      <FocusBar />
      {/* paddingTop accounts for TopBar (~48px) + FocusBar (52px) */}
      <main className="pb-32" style={{ paddingTop: 'max(6.5rem, calc(env(safe-area-inset-top) + 6rem))' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/all" element={<AllTasks />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/general" element={<General />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <ToastProvider>
          <FocusProvider>
            <AppShell />
          </FocusProvider>
        </ToastProvider>
      </StoreProvider>
    </HashRouter>
  )
}
