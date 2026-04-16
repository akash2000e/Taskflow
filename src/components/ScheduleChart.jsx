import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine
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

  // Collect all project ids that appear (including free tasks with start_date)
  const projectIds = [...new Set(
    tasks.filter(t => t.type === 'project' && t.project_id && !t.done && t.estimate_hrs &&
      (t.constraint === 'deadline' || t.start_date))
         .map(t => t.project_id)
  )]

  // Determine which day a task "lands on" in the schedule
  function taskDay(t) {
    if (t.constraint === 'deadline' && t.due_date) return t.due_date
    if (t.start_date) return t.start_date
    return null
  }

  // Build chart data per day
  const data = useMemo(() => days.map(day => {
    const row = { date: day }
    // Project tasks
    for (const pid of projectIds) {
      const hrs = tasks
        .filter(t => t.project_id === pid && !t.done && t.estimate_hrs && taskDay(t) === day)
        .reduce((s, t) => s + t.estimate_hrs, 0)
      if (hrs > 0) row[pid] = hrs
    }
    // General tasks (deadline or has start_date)
    const genHrs = tasks
      .filter(t => t.type === 'general' && !t.done && t.estimate_hrs && taskDay(t) === day)
      .reduce((s, t) => s + t.estimate_hrs, 0)
    if (genHrs > 0) row['__general'] = genHrs
    return row
  }), [tasks, projects])

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const isToday = dateStr === toISODate(today)
    if (isToday) return 'Today'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const todayStr = toISODate(today)
  const hasData = data.some(d => Object.keys(d).length > 1)

  return (
    <div style={{ minWidth: 400 }}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={22}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: '#6B6B6B', fontFamily: 'DM Mono, monospace' }}
            axisLine={{ stroke: '#2A2A28' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#4A4A4A', fontFamily: 'DM Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(val, name) => {
              if (name === '__general') return [`${val}h`, 'General']
              const p = projects.find(p => p.id === name)
              return [`${val}h`, p?.name ?? name]
            }}
            labelFormatter={formatDate}
            contentStyle={{
              fontSize: 11,
              background: '#1C1C1A',
              border: '1px solid #2A2A28',
              borderRadius: 8,
              color: '#CFCFCE',
            }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <ReferenceLine x={todayStr} stroke="#5E8CD6" strokeWidth={1.5} strokeDasharray="3 3" />
          {projectIds.map(pid => {
            const proj = projects.find(p => p.id === pid)
            return (
              <Bar key={pid} dataKey={pid} stackId="a" fill={proj?.color ?? '#5E8CD6'} radius={[0, 0, 0, 0]} />
            )
          })}
          <Bar dataKey="__general" stackId="a" fill="#4A4A4A" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {!hasData && (
        <p className="text-center text-xs text-[#4A4A4A] mt-2">
          No tasks with due dates or start dates in the next 7 days.
        </p>
      )}
    </div>
  )
}
