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

function ProjectProgress({ projects, tasks }) {
  const stats = useMemo(() => projects
    .map(p => {
      const pts = tasks.filter(t => t.project_id === p.id)
      const done = pts.filter(t => t.done).length
      return { ...p, total: pts.length, done, pct: pts.length ? Math.round((done / pts.length) * 100) : 0 }
    })
    .filter(p => p.total > 0)
    .sort((a, b) => b.pct - a.pct),
  [projects, tasks])

  if (stats.length === 0) {
    return <div className="px-4 py-3 text-xs text-[#4A4A4A]">No projects yet.</div>
  }

  return (
    <div className="px-4 py-3 flex flex-col gap-2.5">
      {stats.map(p => (
        <div key={p.id}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
              <span className="text-[11px] text-[#CFCFCE] truncate">{p.name}</span>
            </div>
            <span className="text-[10px] font-mono text-[#6B6B6B] ml-2 shrink-0">{p.done}/{p.total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#252525] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${p.pct}%`, background: p.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { tasks, projects, toggleDone } = useStore()
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

        {/* ── Metric cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Window title="Active">
            <div className="px-5 py-5 text-center">
              <div className="text-4xl font-semibold font-mono text-[#CFCFCE]">{activeTasks.length}</div>
              <div className="text-xs text-[#4A4A4A] mt-1">tasks running</div>
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

          <Window title="Hours Queued">
            <div className="px-5 py-5 text-center">
              <div className="text-4xl font-semibold font-mono text-[#CFCFCE]">{hoursQueued.toFixed(1)}</div>
              <div className="text-xs text-[#4A4A4A] mt-1">estimated hours</div>
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
        </div>

        {/* ── Today + Priority breakdown + Project progress ─ */}
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

          {/* Project progress */}
          <Window title="Project Progress" className="sm:col-span-1">
            <ProjectProgress projects={projects} tasks={tasks} />
          </Window>
        </div>

        {/* ── Schedule / Gantt charts ───────────────────────── */}
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

        {/* ── Priority queue ───────────────────────────────── */}
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

      </div>

      {showTaskForm && (
        <TaskForm task={editTask} onClose={() => { setShowTaskForm(false); setEditTask(null) }} />
      )}
    </div>
  )
}
