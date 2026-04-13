import { useState } from 'react'
import { useStore } from '../store'
import { toISODate } from '../utils'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
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

  const days = Array.from({ length: WINDOW }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return toISODate(d)
  })

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

  const todayPct = (0 / WINDOW) * 100 // today is at day 0

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
    if (pts.length) grouped.push({ label: proj?.name ?? pid, color: proj?.color ?? '#2563EB', tasks: pts })
  }
  const genTasks = filtered.filter(t => t.type === 'general')
  if (genTasks.length) grouped.push({ label: 'General', color: '#6B7280', tasks: genTasks })

  if (filtered.length === 0) {
    return <p className="text-center text-xs text-gray-400 py-4">No active tasks to display.</p>
  }

  return (
    <div style={{ minWidth: 400 }}>
      {/* Filter buttons */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {[{ id: 'all', label: 'All' }, ...allProjectIds.map(id => ({
          id,
          label: projects.find(p => p.id === id)?.name ?? id,
          color: projects.find(p => p.id === id)?.color,
        })), { id: '__general', label: 'General', color: '#6B7280' }].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors font-medium
              ${filter === f.id ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-border text-gray-500 hover:border-gray-400'}`}
          >
            {f.id !== 'all' && f.color && (
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: f.color }} />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Header: day labels */}
      <div className="relative mb-1" style={{ height: 18 }}>
        {[0, 2, 4, 7, 10, 13].map(i => {
          const d = new Date(today)
          d.setDate(d.getDate() + i)
          return (
            <span
              key={i}
              className="absolute text-[9px] text-gray-400 font-mono"
              style={{ left: pct(i), transform: 'translateX(-50%)' }}
            >
              {i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )
        })}
      </div>

      {/* Chart rows */}
      {grouped.map(group => (
        <div key={group.label} className="mb-2">
          <div className="text-[10px] font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: group.color }} />
            {group.label}
          </div>
          {group.tasks.map(task => {
            const proj = projects.find(p => p.id === task.project_id)
            const color = proj?.color ?? '#6B7280'

            // Bar start
            let barStartDate
            if (task.type === 'project' && proj?.start_date) {
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

            const startOff = Math.max(dayOffset(barStartDate), 0)
            const endOff = Math.min(dayOffset(barEndDate) + 1, WINDOW)
            const width = Math.max(endOff - startOff, 0.5)
            const isOverdue = task.constraint === 'deadline' && task.due_date && new Date(task.due_date) < today

            return (
              <div key={task.id} className="relative mb-1.5" style={{ height: 22 }}>
                {/* Background track */}
                <div className="absolute inset-y-0 left-0 right-0 rounded bg-gray-50 border border-border" />

                {/* Today line */}
                <div className="absolute inset-y-0 border-l-2 border-blue-400 border-dashed z-10" style={{ left: pct(0) }} />

                {/* Task bar */}
                <button
                  onClick={() => onEdit && onEdit(task)}
                  className="absolute inset-y-1 rounded cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                  style={{
                    left: pct(startOff),
                    width: pct(width),
                    background: color,
                    borderLeft: isOverdue ? '3px solid #DC2626' : 'none',
                  }}
                  title={task.title}
                >
                  {/* Progress fill */}
                  {task.progress > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded opacity-50"
                      style={{ width: `${task.progress}%`, background: lighten(color, 0.6) }}
                    />
                  )}
                  <span className="relative z-10 px-1.5 text-[9px] text-white font-medium truncate block leading-[20px]">
                    {task.title}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
