import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell
} from 'recharts'
import { useStore } from '../store'
import { toISODate } from '../utils'

export default function ScheduleChart() {
  const { tasks, projects } = useStore()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return toISODate(d)
  })

  // Collect all project ids that appear
  const projectIds = [...new Set(
    tasks.filter(t => t.type === 'project' && t.project_id && t.constraint === 'deadline' && t.due_date && !t.done)
         .map(t => t.project_id)
  )]

  // Build chart data per day
  const data = useMemo(() => days.map(day => {
    const row = { date: day }
    // Project tasks
    for (const pid of projectIds) {
      const hrs = tasks
        .filter(t => t.project_id === pid && t.due_date === day && !t.done && t.estimate_hrs)
        .reduce((s, t) => s + t.estimate_hrs, 0)
      if (hrs > 0) row[pid] = hrs
    }
    // General tasks
    const genHrs = tasks
      .filter(t => t.type === 'general' && t.due_date === day && !t.done && t.estimate_hrs)
      .reduce((s, t) => s + t.estimate_hrs, 0)
    if (genHrs > 0) row['__general'] = genHrs
    return row
  }), [tasks, projects])

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const todayStr = toISODate(today)

  return (
    <div style={{ minWidth: 400 }}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20}>
          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
          <Tooltip
            formatter={(val, name) => {
              if (name === '__general') return [`${val}h`, 'General']
              const p = projects.find(p => p.id === name)
              return [`${val}h`, p?.name ?? name]
            }}
            labelFormatter={formatDate}
            contentStyle={{ fontSize: 11, borderColor: '#E5E4E0' }}
          />
          <ReferenceLine x={todayStr} stroke="#2563EB" strokeWidth={1.5} strokeDasharray="3 3" />
          {projectIds.map(pid => {
            const proj = projects.find(p => p.id === pid)
            return (
              <Bar key={pid} dataKey={pid} stackId="a" fill={proj?.color ?? '#2563EB'} radius={[0, 0, 0, 0]} />
            )
          })}
          <Bar dataKey="__general" stackId="a" fill="#9CA3AF" />
        </BarChart>
      </ResponsiveContainer>
      {data.every(d => Object.keys(d).length === 1) && (
        <p className="text-center text-xs text-gray-400 mt-2">No deadline tasks with estimates in the next 7 days.</p>
      )}
    </div>
  )
}
