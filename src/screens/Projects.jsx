import { useState } from 'react'
import { useStore } from '../store'
import { dayDiff, elapsedLabel } from '../utils'
import TaskItem from '../components/TaskItem'
import TaskForm from '../components/TaskForm'
import ProjectForm from '../components/ProjectForm'

function ProjectWindow({ project, onEditProject }) {
  const { tasks, deleteProject } = useStore()
  const [expanded, setExpanded] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const projectTasks = tasks.filter(t => t.project_id === project.id)
  const doneTasks = projectTasks.filter(t => t.done)
  const activeTasks = projectTasks.filter(t => !t.done)
  const hoursLeft = activeTasks.reduce((s, t) => s + (t.estimate_hrs ?? 0), 0)
  const progress = projectTasks.length > 0 ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0

  let timeText = '', timeColor = '#4A4A4A'
  if (project.deadline) {
    const diff = dayDiff(project.deadline)
    timeText = diff < 0 ? `${Math.abs(diff)}d over` : `${diff}d left`
    timeColor = diff < 0 ? '#E87060' : '#E09F3E'
  } else {
    timeText = elapsedLabel(project.start_date)
    timeColor = '#5DAB7D'
  }

  const STATUS = {
    active: 'bg-[#1A2A3D] text-[#5E8CD6]',
    'on-hold': 'bg-[#2A2010] text-[#E09F3E]',
    completed: 'bg-[#102A18] text-[#5DAB7D]',
  }

  function handleDelete() {
    if (window.confirm(`Delete "${project.name}" and all its tasks?`)) deleteProject(project.id)
  }

  return (
    <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: project.color }}/>
          <span className="text-sm font-semibold text-[#CFCFCE] flex-1 truncate">{project.name}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS[project.status]}`}>
            {project.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#4A4A4A] mb-3">
          <span>{projectTasks.length} tasks</span>
          <span>·</span>
          <span>{doneTasks.length} done</span>
          {hoursLeft > 0 && <><span>·</span><span>{hoursLeft.toFixed(1)}h</span></>}
          <span className="ml-auto font-mono text-[10px]" style={{ color: timeColor }}>{timeText}</span>
        </div>

        <div className="h-[3px] bg-[#252525] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: project.color }}/>
        </div>
      </div>

      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-center gap-1.5 py-2 text-[11px] text-[#4A4A4A] hover:text-[#6B6B6B] hover:bg-[#252525] border-t border-border transition-colors"
      >
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <polyline points="18 15 12 9 6 15"/>
        </svg>
        {expanded ? 'Hide' : `${projectTasks.length} task${projectTasks.length !== 1 ? 's' : ''}`}
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="px-4 pb-1">
            {projectTasks.filter(t => !t.done).map(task => (
              <TaskItem key={task.id} task={task} onEdit={t => { setEditTask(t); setShowTaskForm(true) }}/>
            ))}
            {projectTasks.filter(t => t.done).map(task => (
              <TaskItem key={task.id} task={task} onEdit={t => { setEditTask(t); setShowTaskForm(true) }} showPin={false}/>
            ))}
            {projectTasks.length === 0 && <p className="py-4 text-xs text-[#4A4A4A] text-center">No tasks yet</p>}
          </div>
          <div className="flex gap-3 px-4 py-2.5 border-t border-border">
            <button onClick={() => { setEditTask(null); setShowTaskForm(true) }}
              className="text-xs text-[#5E8CD6] hover:text-[#8AB4D6]">+ Add task</button>
            <button onClick={() => onEditProject(project)} className="ml-auto text-xs text-[#4A4A4A] hover:text-[#6B6B6B]">Edit</button>
            <button onClick={handleDelete} className="text-xs text-[#8A4040] hover:text-[#E87060]">Delete</button>
          </div>
        </div>
      )}

      {showTaskForm && (
        <TaskForm task={editTask} defaultProjectId={project.id}
          onClose={() => { setShowTaskForm(false); setEditTask(null) }}/>
      )}
    </div>
  )
}

export default function Projects() {
  const { projects } = useStore()
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const visible = projects.filter(p => !p.archived)

  return (
    <div className="min-h-screen pt-14 pb-32 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto mt-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold text-[#4A4A4A] uppercase tracking-wider">Projects</span>
        </div>

        {visible.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl px-4 py-16 text-center">
            <p className="text-[#4A4A4A] text-sm">No projects yet. Use the + button below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(project => (
              <ProjectWindow key={project.id} project={project}
                onEditProject={p => { setEditProject(p); setShowProjectForm(true) }}/>
            ))}
          </div>
        )}
      </div>

      {showProjectForm && (
        <ProjectForm project={editProject}
          onClose={() => { setShowProjectForm(false); setEditProject(null) }}/>
      )}
    </div>
  )
}
