import { useFocus } from '../FocusContext'
import { useStore } from '../store'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusBar() {
  const { projects } = useStore()
  const { activeProjectId, elapsed, isPaused, isActive, switchProject, pauseSession, resumeSession, stopSession } = useFocus()

  const activeProjects = projects.filter(p => p.status === 'active' && !p.archived)

  if (activeProjects.length === 0) return null

  const activeProject = projects.find(p => p.id === activeProjectId)

  return (
    <div
      className="fixed left-0 right-0 z-30 flex items-center gap-3 px-5 border-b border-[#232321]"
      style={{
        top: 'calc(max(2.75rem, env(safe-area-inset-top) + 2rem) + 2px)',
        height: 52,
        background: '#131311',
      }}
    >
      {/* Project pills — scrollable */}
      <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {activeProjects.map(p => {
          const isSelected = activeProjectId === p.id
          return (
            <button
              key={p.id}
              onClick={() => switchProject(p.id)}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 border"
              style={isSelected ? {
                background: `${p.color}22`,
                borderColor: `${p.color}66`,
                color: p.color,
                boxShadow: `0 0 10px ${p.color}33`,
              } : {
                background: 'transparent',
                borderColor: '#2A2A28',
                color: '#4A4A4A',
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-all"
                style={{
                  background: p.color,
                  opacity: isSelected ? 1 : 0.35,
                  boxShadow: isSelected ? `0 0 5px ${p.color}` : 'none',
                }}
              />
              {p.name}
              {isSelected && !isPaused && (
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* Timer + controls — only when active */}
      {isActive && (
        <div className="flex items-center gap-2.5 shrink-0 pl-3 border-l border-[#2A2A28]">
          {/* Active project name (compact, desktop only) */}
          {activeProject && (
            <span className="text-[11px] hidden sm:block truncate max-w-[90px]" style={{ color: activeProject.color }}>
              {activeProject.name}
            </span>
          )}

          {/* Paused label */}
          {isPaused && (
            <span className="text-[10px] text-[#4A4A4A] uppercase tracking-wider hidden sm:block">paused</span>
          )}

          {/* Timer */}
          <span
            className={`font-mono text-[13px] tabular-nums transition-colors ${isPaused ? 'text-[#3A3A38]' : 'text-[#CFCFCE]'}`}
          >
            {formatTime(elapsed)}
          </span>

          {/* Pause / Resume */}
          <button
            onClick={isPaused ? resumeSession : pauseSession}
            title={isPaused ? 'Resume' : 'Pause'}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#2A2A28] text-[#4A4A4A] hover:text-[#CFCFCE] hover:border-[#444] transition-colors"
          >
            {isPaused ? (
              <svg width="9" height="10" viewBox="0 0 8 9" fill="currentColor">
                <path d="M1 1.5L7 4.5L1 7.5V1.5Z"/>
              </svg>
            ) : (
              <svg width="9" height="10" viewBox="0 0 8 9" fill="currentColor">
                <rect x="1" y="1" width="2" height="7" rx="0.5"/>
                <rect x="5" y="1" width="2" height="7" rx="0.5"/>
              </svg>
            )}
          </button>

          {/* Stop */}
          <button
            onClick={stopSession}
            title="Stop & save time"
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#2A2A28] text-[#4A4A4A] hover:text-[#E87060] hover:border-[#5A2020] transition-colors"
          >
            <svg width="8" height="8" viewBox="0 0 7 7" fill="currentColor">
              <rect width="7" height="7" rx="1"/>
            </svg>
          </button>
        </div>
      )}

      {/* Idle hint */}
      {!isActive && (
        <span className="shrink-0 text-[11px] text-[#2A2A28]">click a project to start focus</span>
      )}
    </div>
  )
}
