import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import TaskForm from './TaskForm'
import ProjectForm from './ProjectForm'

export default function FloatingActions() {
  const { pathname } = useLocation()
  const [showTask, setShowTask] = useState(false)
  const [showProject, setShowProject] = useState(false)

  const isProjects = pathname === '/projects'
  const label = isProjects ? 'New Project' : 'New Task'

  function handleClick() {
    if (isProjects) setShowProject(true)
    else setShowTask(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-[5.5rem] right-6 z-40
          flex items-center gap-2 px-4 py-2.5
          bg-[#2F2F2F] hover:bg-[#383838]
          border border-[#444444]
          text-[#CFCFCE] text-sm font-medium
          rounded-xl shadow-xl backdrop-blur-sm
          transition-colors"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {label}
      </button>

      {showTask && <TaskForm onClose={() => setShowTask(false)} />}
      {showProject && <ProjectForm onClose={() => setShowProject(false)} />}
    </>
  )
}
