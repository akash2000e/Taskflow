import { useState } from 'react'
import { useStore } from '../store'
import { priorityScore } from '../utils'
import TaskItem from '../components/TaskItem'
import TaskForm from '../components/TaskForm'

export default function General() {
  const { tasks } = useStore()
  const [editTask, setEditTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const generalTasks = tasks.filter(t => t.type === 'general')
  const active = [...generalTasks.filter(t => !t.done)].sort((a, b) => priorityScore(b) - priorityScore(a))
  const done = generalTasks.filter(t => t.done)

  const openForm = (task = null) => { setEditTask(task); setShowTaskForm(true) }

  return (
    <div className="min-h-screen pt-14 pb-32 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto mt-5">
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-[#4A4A4A] uppercase tracking-wider">General Tasks</span>
        </div>

        {active.length === 0 && done.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl px-4 py-16 text-center">
            <p className="text-[#4A4A4A] text-sm">No general tasks yet. Use the + button below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(task => (
              <div key={task.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 pb-1">
                  <TaskItem task={task} onEdit={openForm} />
                </div>
              </div>
            ))}
            {done.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden sm:col-span-2 lg:col-span-3">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-[11px] font-semibold text-[#4A4A4A] uppercase tracking-wider">Completed · {done.length}</span>
                </div>
                <div className="px-4 grid sm:grid-cols-2 lg:grid-cols-3">
                  {done.map(task => <TaskItem key={task.id} task={task} onEdit={openForm} showPin={false} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showTaskForm && (
        <TaskForm task={editTask} onClose={() => { setShowTaskForm(false); setEditTask(null) }} />
      )}
    </div>
  )
}
