import { useState } from 'react'
import { useStore } from '../store'
import { toISODate } from '../utils'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function lighten(hex, amount = 0.5) {
  const { r, g, b } = hexToRgb(hex)
  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)
  return `rgb(${lr},${lg},${lb})`
}

const WINDOW = 14 // days

export default function GanttChart({ onEdit }) {
  const { tasks, projects } = useStore()
  const [filter, setFilter] = useState('all')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = today
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + WINDOW)

  function dayOffset(dateStr) {
    const d = new Date(dateStr)
    return (d - startDate) / (1000 * 60 * 60 * 24)
  }

  function pct(offset) {
    return `${(offset / WINDOW) * 100}%`
  }

  // Filter active tasks
  const activeTasks = tasks.filter(t => !t.done)

  // Group by project for filter buttons
  const allProjectIds = [...new Set(activeTasks.filter(t => t.project_id).map(t => t.project_id))]

  const filtered = activeTasks.filter(t => {
    if (filter === 'all') return true
    if (filter === '__general') return t.type === 'general'
    return t.project_id === filter
  })

  // Group: project tasks by project, then general
  const grouped = []
  for (const pid of allProjectIds) {
    const proj = projects.find(p => p.id === pid)
    const pts = filtered.filter(t => t.project_id === pid)
    if (pts.length) grouped.push({ label: proj?.name ?? pid, color: proj?.color ?? '#5E8CD6', tasks: pts })
  }
  const genTasks = filtered.filter(t => t.type === 'general')
  if (genTasks.length) grouped.push({ label: 'General', color: '#6B6B6B', tasks: genTasks })

  if (filtered.length === 0) {
    return <p className="text-center text-xs text-[#4A4A4A] py-6">No active tasks to display.</p>
  }

  return (
    <div style={{ minWidth: 400 }}>
      {/* Filter buttons */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {[{ id: 'all', label: 'All' }, ...allProjectIds.map(id => ({
          id,
          label: projects.find(p => p.id === id)?.name ?? id,
          color: projects.find(p => p.id === id)?.color,
        })), { id: '__general', label: 'General', color: '#6B6B6B' }].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-medium flex items-center gap-1
              ${filter === f.id
                ? 'bg-[#1A2A3D] border-[#2A4060] text-[#5E8CD6]'
                : 'border-[#2A2A28] text-[#4A4A4A] hover:border-[#3A3A38] hover:text-[#6B6B6B]'}`}
          >
            {f.id !== 'all' && f.color && (
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.color }} />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Day header */}
      <div className="relative mb-2 pl-0" style={{ height: 20 }}>
        {[0, 2, 4, 7, 10, 13].map(i => {
          const d = new Date(today)
          d.setDate(d.getDate() + i)
          return (
            <span
              key={i}
              className="absolute text-[9px] text-[#4A4A4A] font-mono"
              style={{ left: pct(i), transform: 'translateX(-50%)' }}
            >
              {i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )
        })}
      </div>

      {/* Chart groups */}
      <div className="flex flex-col gap-3">
        {grouped.map(group => (
          <div key={group.label}>
            {/* Group label */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: group.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: withAlpha(group.color, 0.8) }}>
                {group.label}
              </span>
              <div className="flex-1 h-px bg-[#2A2A28]" />
            </div>

            {/* Task rows */}
            <div className="flex flex-col gap-1.5">
              {group.tasks.map(task => {
                const proj = projects.find(p => p.id === task.project_id)
                const color = proj?.color ?? '#6B6B6B'

                // Bar start: use task.start_date first, then project start, then created_at
                let barStartDate
                if (task.start_date) {
                  barStartDate = task.start_date
                } else if (task.type === 'project' && proj?.start_date) {
                  const ps = new Date(proj.start_date)
                  const ca = new Date(task.created_at)
                  barStartDate = ps < ca ? proj.start_date : task.created_at.slice(0, 10)
                } else {
                  barStartDate = task.created_at.slice(0, 10)
                }

                // Bar end
                let barEndDate
                if (task.constraint === 'deadline' && task.due_date) {
                  barEndDate = task.due_date
                } else {
                  const e = new Date(today)
                  e.setDate(e.getDate() + 7)
                  barEndDate = toISODate(e)
                }

                const startOff = Math.max(dayOffset(barStartDate), -2)
                const endOff = Math.min(dayOffset(barEndDate) + 1, WINDOW)
                const clampedStart = Math.max(startOff, 0)
                const width = Math.max(endOff - clampedStart, 0.5)
                const isOverdue = task.constraint === 'deadline' && task.due_date && new Date(task.due_date) < today
                const isStartingFuture = startOff > 0

                return (
                  <div key={task.id} className="relative" style={{ height: 28 }}>
                    {/* Background track */}
                    <div className="absolute inset-y-0 left-0 right-0 rounded-md"
                      style={{ background: '#1A1A18', border: '1px solid #262624' }} />

                    {/* Grid lines at each day marker */}
                    {[2, 4, 7, 10].map(di => (
                      <div key={di} className="absolute inset-y-0 border-l border-[#262624]"
                        style={{ left: pct(di) }} />
                    ))}

                    {/* Today line */}
                    <div className="absolute inset-y-0 z-10"
                      style={{ left: pct(0), borderLeft: '2px solid #5E8CD6', opacity: 0.6 }} />

                    {/* Pre-start shading (if task starts in future) */}
                    {isStartingFuture && startOff < WINDOW && (
                      <div
                        className="absolute inset-y-1 rounded-l-sm opacity-20"
                        style={{
                          left: 0,
                          width: pct(Math.min(startOff, WINDOW)),
                          background: color,
                        }}
                      />
                    )}

                    {/* Task bar */}
                    <button
                      onClick={() => onEdit && onEdit(task)}
                      className="absolute inset-y-1 rounded-md cursor-pointer transition-opacity hover:opacity-90 overflow-hidden z-20 group"
                      style={{
                        left: pct(clampedStart),
                        width: pct(width),
                        background: withAlpha(color, 0.85),
                        borderLeft: isOverdue ? '3px solid #E87060' : 'none',
                      }}
                      title={task.title}
                    >
                      {/* Progress fill */}
                      {task.progress > 0 && (
                        <div
                          className="absolute inset-y-0 left-0 rounded-md"
                          style={{ width: `${task.progress}%`, background: lighten(color, 0.3), opacity: 0.4 }}
                        />
                      )}
                      <span className="relative z-10 px-2 text-[9px] text-white font-medium truncate flex items-center h-full leading-none">
                        {task.title}
                      </span>
                    </button>

                    {/* Overdue badge */}
                    {isOverdue && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-30">
                        <span className="text-[8px] font-mono text-[#E87060] bg-[#3D1A1A] px-1 rounded">
                          overdue
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#2A2A28]">
        <div className="flex items-center gap-1.5 text-[9px] text-[#4A4A4A]">
          <div className="w-3 h-0.5 border-l-2 border-[#5E8CD6]" style={{ width: 10 }} />
          Today
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-[#4A4A4A]">
          <div className="w-3 h-2 rounded-sm" style={{ background: '#3D1A1A', borderLeft: '2px solid #E87060' }} />
          Overdue
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-[#4A4A4A]">
          <div className="w-3 h-2 rounded-sm bg-[#2A3A52] opacity-40" />
          Progress fill
        </div>
      </div>
    </div>
  )
}
