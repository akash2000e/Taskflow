import { useState } from 'react'
import { useStore } from '../store'
import { priorityScore, timeLabel } from '../utils'
import TaskItem from '../components/TaskItem'
import TaskForm from '../components/TaskForm'

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

export default function Dashboard() {
  const { tasks, projects, toggleDone } = useStore()
  const [editTask, setEditTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const activeTasks = tasks.filter(t => !t.done)
  const overdue = activeTasks.filter(t => t.constraint === 'deadline' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString()))
  const hoursQueued = activeTasks.reduce((s, t) => s + (t.estimate_hrs ?? 0), 0)

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

  return (
    <div className="min-h-screen px-4 sm:px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">

        {/* Metric windows */}
        <Window title="Active">
          <div className="px-5 py-6 text-center">
            <div className="text-4xl font-semibold font-mono text-[#CFCFCE]">{activeTasks.length}</div>
            <div className="text-xs text-[#4A4A4A] mt-1">tasks running</div>
          </div>
        </Window>

        <Window title="Overdue">
          <div className="px-5 py-6 text-center">
            <div className={`text-4xl font-semibold font-mono ${overdue.length > 0 ? 'text-[#E87060]' : 'text-[#CFCFCE]'}`}>
              {overdue.length}
            </div>
            <div className="text-xs text-[#4A4A4A] mt-1">{overdue.length > 0 ? 'need attention' : 'all on track'}</div>
          </div>
        </Window>

        <Window title="Hours Queued">
          <div className="px-5 py-6 text-center">
            <div className="text-4xl font-semibold font-mono text-[#CFCFCE]">{hoursQueued.toFixed(1)}</div>
            <div className="text-xs text-[#4A4A4A] mt-1">estimated hours</div>
          </div>
        </Window>

        {/* Today window */}
        <Window
          title="Today"
          className="sm:col-span-2"
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
                        onClick={() => { setEditTask(task); setShowTaskForm(true) }}
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

        {/* Priority queue */}
        <Window title="Priority Queue" className="sm:col-span-3">
          {priorityQueue.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#4A4A4A] text-sm">
              Add your first task to get started.
            </div>
          ) : (
            <div className="px-4 grid sm:grid-cols-2 lg:grid-cols-3">
              {priorityQueue.map(task => (
                <TaskItem key={task.id} task={task} onEdit={t => { setEditTask(t); setShowTaskForm(true) }} />
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
