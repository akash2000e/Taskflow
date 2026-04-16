import { useStore } from '../store'
import { useFocus } from '../FocusContext'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TopBar() {
  const { saving, projects } = useStore()
  const { activeProjectId, elapsed, isPaused, isActive } = useFocus()

  const activeProject = projects.find(p => p.id === activeProjectId)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center gap-2 px-5 py-3.5"
      style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
    >
      {/* Logo */}
      <svg width="19" height="19" viewBox="0 0 32 32" fill="none" className="shrink-0">
        <rect width="32" height="32" rx="6" fill="#5E8CD6"/>
        <path d="M8 10h16M8 16h10M8 22h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <span className="font-semibold text-[#CFCFCE] text-sm tracking-tight">Taskflow</span>

      {/* Saving indicator */}
      {saving && (
        <span className="ml-2 text-xs text-[#6B6B6B] flex items-center gap-1.5">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          Saving…
        </span>
      )}

      {/* Live focus indicator (right side) */}
      {isActive && (
        <div className="ml-auto flex items-center gap-2">
          {/* Colored project dot */}
          {activeProject && (
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: activeProject.color }}
            />
          )}
          <span
            className={`font-mono text-[11px] tabular-nums ${isPaused ? 'text-[#3A3A38]' : 'text-[#6B6B6B]'}`}
          >
            {formatTime(elapsed)}
          </span>
          {isPaused && (
            <span className="text-[9px] text-[#3A3A38] uppercase tracking-wider">paused</span>
          )}
        </div>
      )}
    </header>
  )
}
