import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../store'
import { priorityScore, timeLabel, toISODate } from '../utils'
import TaskItem from '../components/TaskItem'
import TaskForm from '../components/TaskForm'
import ScheduleChart from '../components/ScheduleChart'
import GanttChart from '../components/GanttChart'

function Window({ title, action, children, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-2xl flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">{title}</span>
        {action}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

const PRIORITY_COLORS = {
  urgent: '#E87060',
  normal: '#5E8CD6',
  someday: '#6B7280',
}

function PriorityDonut({ activeTasks }) {
  const data = useMemo(() => [
    { name: 'Urgent', value: activeTasks.filter(t => t.priority === 'urgent').length, color: '#E87060' },
    { name: 'Normal', value: activeTasks.filter(t => t.priority === 'normal').length, color: '#5E8CD6' },
    { name: 'Someday', value: activeTasks.filter(t => t.priority === 'someday').length, color: '#6B7280' },
  ].filter(d => d.value > 0), [activeTasks])

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-xs text-[#4A4A4A]">No tasks</div>
  }

  return (
    <div className="flex items-center gap-4 h-full px-4 py-3">
      <ResponsiveContainer width={90} height={90}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={26}
            outerRadius={42}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <ReTooltip
            contentStyle={{ fontSize: 11, background: '#1A1A18', border: '1px solid #2A2A28', borderRadius: 6, color: '#CFCFCE' }}
            formatter={(val, name) => [`${val} tasks`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] text-[#6B6B6B]">{d.name}</span>
            <span className="text-[11px] font-mono text-[#CFCFCE] ml-auto pl-3">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function fmtMins(mins) {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function ProjectProgress({ projects, tasks }) {
  const stats = useMemo(() => projects
    .map(p => {
      const pts = tasks.filter(t => t.project_id === p.id)
      const done = pts.filter(t => t.done).length
      return {
        ...p,
        total: pts.length,
        done,
        pct: pts.length ? Math.round((done / pts.length) * 100) : 0,
        logged_mins: p.logged_mins ?? 0,
      }
    })
    .filter(p => p.total > 0)
    .sort((a, b) => b.pct - a.pct),
  [projects, tasks])

  if (stats.length === 0) {
    return <div className="px-4 py-3 text-xs text-[#4A4A4A]">No projects yet.</div>
  }

  return (
    <div className="px-4 py-3 flex flex-col gap-3">
      {stats.map(p => (
        <div key={p.id}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="text-[11px] text-[#CFCFCE] truncate">{p.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {p.logged_mins > 0 && (
                <span className="text-[9px] font-mono text-[#4A4A4A]">{fmtMins(p.logged_mins)}</span>
              )}
              <span className="text-[10px] font-mono text-[#6B6B6B]">{p.done}/{p.total}</span>
            </div>
          </div>
          {/* Task completion bar */}
          <div className="h-1.5 rounded-full bg-[#252525] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TimeLoggedSection({ projects }) {
  const withTime = projects.filter(p => (p.logged_mins ?? 0) > 0)
  if (withTime.length === 0) return null

  const maxMins = Math.max(...withTime.map(p => p.logged_mins))

  return (
    <Window
      title="Time Logged"
      action={
        <span className="text-[10px] text-[#4A4A4A]">
          {fmtMins(withTime.reduce((s, p) => s + p.logged_mins, 0))} total
        </span>
      }
    >
      <div className="px-4 py-3 flex flex-col gap-3">
        {withTime
          .sort((a, b) => b.logged_mins - a.logged_mins)
          .map(p => {
            const pct = (p.logged_mins / maxMins) * 100
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-[11px] text-[#CFCFCE] truncate">{p.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#CFCFCE] ml-2 shrink-0">{fmtMins(p.logged_mins)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#1E1E1C] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: `${p.color}BB` }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </Window>
  )
}

function StreakWidget({ tasks }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const dateStr = toISODate(d)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
    const count = tasks.filter(t => t.done && t.completed_at?.slice(0, 10) === dateStr).length
    return { dateStr, label, count }
  })

  const completedDays = new Set(tasks.filter(t => t.done && t.completed_at).map(t => t.completed_at.slice(0, 10)))
  let streak = 0
  const checkDay = new Date(today)
  while (completedDays.has(toISODate(checkDay))) {
    streak++
    checkDay.setDate(checkDay.getDate() - 1)
  }

  const maxCount = Math.max(...last7.map(d => d.count), 1)

  return (
    <Window title="Streak">
      <div className="px-4 py-3 flex flex-col h-full">
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className={`text-3xl font-semibold font-mono ${streak > 0 ? 'text-[#4CAF82]' : 'text-[#CFCFCE]'}`}>
            {streak}
          </span>
          <span className="text-xs text-[#4A4A4A]">day{streak !== 1 ? 's' : ''}</span>
          {streak > 0 && <span className="text-[10px] text-[#4CAF82] ml-1">🔥</span>}
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-1 flex-1" style={{ minHeight: 44 }}>
          {last7.map((d, i) => {
            const isToday = i === 6
            const barH = d.count > 0 ? Math.max((d.count / maxCount) * 36, 8) : 4
            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm transition-all duration-300"
                  style={{
                    height: barH,
                    background: d.count > 0
                      ? (isToday ? '#4CAF82' : 'rgba(76,175,130,0.5)')
                      : '#252525',
                    minHeight: 4,
                  }}
                  title={`${d.count} task${d.count !== 1 ? 's' : ''} on ${d.dateStr}`}
                />
                <span className={`text-[8px] font-mono ${isToday ? 'text-[#6B6B6B]' : 'text-[#3A3A38]'}`}>
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Window>
  )
}

function SuggestedTasks({ tasks, projects, onEdit, onPin }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeTasks = tasks.filter(t => !t.done)
  const todayTaskIds = new Set(
    activeTasks.filter(t =>
      t.today_flag ||
      (t.constraint === 'deadline' && t.due_date && new Date(t.due_date) <= today)
    ).map(t => t.id)
  )

  const suggestions = activeTasks
    .filter(t => !todayTaskIds.has(t.id))
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 5)
    .map(t => {
      const proj = projects.find(p => p.id === t.project_id)
      let reason = ''
      if (t.priority === 'urgent') {
        reason = 'High urgency'
      } else if (t.constraint === 'deadline' && t.due_date) {
        const diff = Math.round((new Date(t.due_date) - today) / 86400000)
        reason = diff === 1 ? 'Due tomorrow' : `Due in ${diff}d`
      } else {
        const created = new Date(t.created_at)
        const days = Math.floor((today - created) / 86400000)
        if (days > 14) reason = `Stale · ${days}d`
        else if (t.priority === 'someday') reason = 'Someday'
        else reason = 'In queue'
      }
      return { task: t, reason, proj }
    })

  if (suggestions.length === 0) return null

  return (
    <Window
      title="Suggested"
      action={
        <span className="text-[10px] text-[#4A4A4A]">tasks you might want to tackle</span>
      }
    >
      <div>
        {suggestions.map(({ task, reason, proj }) => {
          const { text: timeText, color: timeColor } = timeLabel(task, projects)
          return (
            <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
              {/* Priority dot */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: PRIORITY_COLORS[task.priority] }}
              />
              <div className="flex-1 min-w-0">
                <span
                  className="text-sm text-[#CFCFCE] cursor-pointer hover:text-[#5E8CD6] truncate block leading-snug"
                  onClick={() => onEdit(task)}
                >
                  {task.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {proj && (
                    <span className="flex items-center gap-1 text-[10px] text-[#6B6B6B]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: proj.color }} />
                      {proj.name}
                    </span>
                  )}
                  <span className="text-[10px] font-mono" style={{ color: timeColor }}>{timeText}</span>
                  <span className="text-[10px] text-[#3A3A38]">·</span>
                  <span className="text-[10px] text-[#4A4A4A]">{reason}</span>
                </div>
              </div>
              {/* Pin button */}
              <button
                onClick={() => onPin(task.id)}
                title={task.today_flag ? 'Unpin from today' : 'Add to today'}
                className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border transition-colors active:opacity-70
                  ${task.today_flag
                    ? 'bg-[#1A2A3D] border-[#2A4060] text-[#5E8CD6]'
                    : 'border-border text-[#4A4A4A] hover:border-[#3A5070] hover:text-[#5E8CD6]'
                  }`}
                style={{ fontSize: 11 }}
              >
                {task.today_flag ? '★' : '+'}
              </button>
            </div>
          )
        })}
      </div>
    </Window>
  )
}

export default function Dashboard() {
  const { tasks, projects, toggleDone, togglePin } = useStore()
  const [editTask, setEditTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [chartTab, setChartTab] = useState('schedule') // 'schedule' | 'gantt'

  const activeTasks = tasks.filter(t => !t.done)
  const overdue = activeTasks.filter(t => t.constraint === 'deadline' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString()))
  const hoursQueued = activeTasks.reduce((s, t) => s + (t.estimate_hrs ?? 0), 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toISODate(today)

  const doneTodayCount = tasks.filter(t => t.done && t.completed_at && t.completed_at.slice(0, 10) === todayStr).length

  const todayTasks = tasks.filter(t => {
    if (t.done) return false
    if (t.today_flag) return true
    if (t.constraint === 'deadline' && t.due_date)
      return new Date(t.due_date) <= new Date(new Date().toDateString())
    return false
  })

  const priorityQueue = [...activeTasks]
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 9)

  const openEdit = t => { setEditTask(t); setShowTaskForm(true) }

  return (
    <div className="min-h-screen px-4 sm:px-6 pb-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 mt-5">

        {/* ── Project Progress (top of page) ── */}
        <Window title="Project Tracking">
          <div className="px-4 py-3">
            {(() => {
              const stats = projects
                .map(p => {
                  const pts = tasks.filter(t => t.project_id === p.id)
                  const done = pts.filter(t => t.done).length
                  return {
                    ...p,
                    total: pts.length,
                    done,
                    pct: pts.length ? Math.round((done / pts.length) * 100) : 0,
                    logged_mins: p.logged_mins ?? 0,
                  }
                })
                .filter(p => p.total > 0)
                .sort((a, b) => b.pct - a.pct)

              if (stats.length === 0) {
                return <div className="text-xs text-[#4A4A4A]">No projects yet.</div>
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                  {stats.map(p => (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                          <span className="text-[11px] text-[#CFCFCE] truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {p.logged_mins > 0 && (
                            <span className="text-[9px] font-mono text-[#4A4A4A]">{fmtMins(p.logged_mins)}</span>
                          )}
                          <span className="text-[10px] font-mono text-[#6B6B6B]">{p.done}/{p.total}</span>
                          <span className="text-[10px] font-mono text-[#4A4A4A]">{p.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#252525] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: p.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </Window>

        {/* ── Metric cards (Active · Done Today · Hours · Overdue) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Window title="Active">
            <div className="px-5 py-5 text-center">
              <div className="text-4xl font-semibold font-mono text-[#CFCFCE]">{activeTasks.length}</div>
              <div className="text-xs text-[#4A4A4A] mt-1">tasks running</div>
            </div>
          </Window>

          <Window title="Done Today">
            <div className="px-5 py-5 text-center">
              <div className={`text-4xl font-semibold font-mono ${doneTodayCount > 0 ? 'text-[#4CAF82]' : 'text-[#CFCFCE]'}`}>
                {doneTodayCount}
              </div>
              <div className="text-xs text-[#4A4A4A] mt-1">{doneTodayCount > 0 ? 'completed' : 'keep going'}</div>
            </div>
          </Window>

          <Window title="Hours Queued">
            <div className="px-5 py-5 text-center">
              <div className="text-4xl font-semibold font-mono text-[#CFCFCE]">{hoursQueued.toFixed(1)}</div>
              <div className="text-xs text-[#4A4A4A] mt-1">estimated hours</div>
            </div>
          </Window>

          <Window title="Overdue">
            <div className="px-5 py-5 text-center">
              <div className={`text-4xl font-semibold font-mono ${overdue.length > 0 ? 'text-[#E87060]' : 'text-[#CFCFCE]'}`}>
                {overdue.length}
              </div>
              <div className="text-xs text-[#4A4A4A] mt-1">{overdue.length > 0 ? 'need attention' : 'all on track'}</div>
            </div>
          </Window>
        </div>

        {/* ── Today + Priority + Project Progress + Streak ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Today strip */}
          <Window
            title="Today"
            className="sm:col-span-1"
            action={todayTasks.length > 0 && (
              <span className="text-xs text-[#3A5070]">{todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''}</span>
            )}
          >
            {todayTasks.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[#4A4A4A]">Nothing due today — you're clear.</div>
            ) : (
              <div className="px-4 py-1">
                {todayTasks.map(task => {
                  const project = projects.find(p => p.id === task.project_id)
                  const { text: timeText, color: timeColor } = timeLabel(task, projects)
                  return (
                    <div key={task.id} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
                      <button
                        onClick={() => toggleDone(task.id)}
                        className={`mt-0.5 shrink-0 rounded border flex items-center justify-center transition-colors active:opacity-70
                          ${task.done ? 'bg-[#5E8CD6] border-[#5E8CD6]' : 'border-[#444] hover:border-[#5E8CD6]'}`}
                        style={{ width: 20, height: 20, minWidth: 20 }}
                      >
                        {task.done && (
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                            <polyline points="2 5 4 7 8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span
                          className="block text-sm text-[#CFCFCE] cursor-pointer hover:text-[#5E8CD6] leading-snug"
                          onClick={() => openEdit(task)}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {project && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252525] text-[#6B6B6B]">
                              {project.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono" style={{ color: timeColor }}>{timeText}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Window>

          {/* Priority breakdown donut */}
          <Window title="Priority Breakdown" className="sm:col-span-1">
            <div style={{ height: 130 }}>
              <PriorityDonut activeTasks={activeTasks} />
            </div>
          </Window>

          {/* Streak widget */}
          <StreakWidget tasks={tasks} />
        </div>

        {/* ── Schedule / Gantt charts ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
              {chartTab === 'schedule' ? 'Schedule — Next 7 Days' : 'Gantt — 14 Day View'}
            </span>
            <div className="flex gap-1">
              {['schedule', 'gantt'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors capitalize
                    ${chartTab === tab
                      ? 'bg-[#1A2A3D] text-[#5E8CD6] border border-[#2A4060]'
                      : 'text-[#4A4A4A] hover:text-[#CFCFCE] border border-transparent'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-4 overflow-x-auto">
            {chartTab === 'schedule'
              ? <ScheduleChart />
              : <GanttChart onEdit={openEdit} />
            }
          </div>
        </div>

        {/* ── Time logged per project ── */}
        <TimeLoggedSection projects={projects} />

        {/* ── Priority queue ── */}
        <Window title="Priority Queue">
          {priorityQueue.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#4A4A4A] text-sm">
              Add your first task to get started.
            </div>
          ) : (
            <div className="p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {priorityQueue.map(task => (
                <div
                  key={task.id}
                  className="bg-[#161614] border border-border rounded-xl overflow-hidden"
                >
                  <TaskItem task={task} onEdit={openEdit} />
                </div>
              ))}
            </div>
          )}
        </Window>

        {/* ── Suggested tasks ── */}
        <SuggestedTasks
          tasks={tasks}
          projects={projects}
          onEdit={openEdit}
          onPin={togglePin}
        />

      </div>

      {showTaskForm && (
        <TaskForm task={editTask} onClose={() => { setShowTaskForm(false); setEditTask(null) }} />
      )}
    </div>
  )
}
