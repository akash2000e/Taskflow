import { useState } from 'react'
import { useStore } from '../store'
import { priorityScore } from '../utils'
import TaskItem from '../components/TaskItem'
import TaskForm from '../components/TaskForm'

function Window({ title, color, count, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }}/>}
        <span className="text-sm font-medium text-[#CFCFCE] flex-1">{title}</span>
        {count != null && <span className="text-xs text-[#4A4A4A]">{count}</span>}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

export default function AllTasks() {
  const { tasks, projects } = useStore()
  const [editTask, setEditTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const sections = [
    ...projects.filter(p => !p.archived).map(p => ({
      id: p.id, label: p.name, color: p.color,
      tasks: tasks.filter(t => t.project_id === p.id),
    })),
    { id: '__general', label: 'General', color: '#4A4A4A', tasks: tasks.filter(t => t.type === 'general') },
  ].filter(s => s.tasks.length > 0)

  sections.sort((a, b) => {
    const sa = Math.max(...a.tasks.filter(t => !t.done).map(priorityScore), 0)
    const sb = Math.max(...b.tasks.filter(t => !t.done).map(priorityScore), 0)
    return sb - sa
  })

  const openForm = (task = null) => { setEditTask(task); setShowTaskForm(true) }

  return (
    <div className="min-h-screen pt-14 pb-32 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto mt-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold text-[#4A4A4A] uppercase tracking-wider">All Tasks</span>
        </div>

        {sections.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl px-4 py-16 text-center">
            <p className="text-[#4A4A4A] text-sm">No tasks yet. Use the + button below to add one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map(section => {
              const active = section.tasks.filter(t => !t.done).sort((a, b) => priorityScore(b) - priorityScore(a))
              const done = section.tasks.filter(t => t.done)
              return (
                <Window key={section.id} title={section.label} color={section.color} count={section.tasks.length}>
                  <div className="px-4 pb-1">
                    {active.map(task => <TaskItem key={task.id} task={task} onEdit={openForm} />)}
                    {done.map(task => <TaskItem key={task.id} task={task} onEdit={openForm} showPin={false} />)}
                    {active.length === 0 && done.length === 0 && (
                      <p className="py-6 text-xs text-[#4A4A4A] text-center">No tasks</p>
                    )}
                  </div>
                </Window>
              )
            })}
          </div>
        )}
      </div>

      {showTaskForm && (
        <TaskForm task={editTask} onClose={() => { setShowTaskForm(false); setEditTask(null) }} />
      )}
    </div>
  )
}
