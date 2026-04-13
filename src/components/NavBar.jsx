import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import TaskForm from './TaskForm'
import ProjectForm from './ProjectForm'

const links = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/all',
    label: 'All Tasks',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
      </svg>
    ),
  },
  {
    to: '/general',
    label: 'General',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    to: '/setup',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
]

export default function NavBar() {
  const { pathname } = useLocation()
  const [showTask, setShowTask] = useState(false)
  const [showProject, setShowProject] = useState(false)

  const isProjects = pathname === '/projects'
  const label = isProjects ? 'New Project' : 'New Task'

  function handleAdd() {
    if (isProjects) setShowProject(true)
    else setShowTask(true)
  }

  return (
    <>
      {/* Single centered row: add button + nav pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">

        {/* Add button — collinear but distinct color */}
        <button
          onClick={handleAdd}
          title={label}
          className="flex items-center gap-2 px-4 h-[52px] rounded-2xl
            bg-[#1E2D3D] border border-[#2A4060]
            text-[#7AADCF] text-sm font-medium
            hover:bg-[#243548] hover:border-[#3A5878] hover:text-[#9CC4E0]
            shadow-2xl backdrop-blur-md transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {label}
        </button>

        {/* Nav pill */}
        <nav className="flex items-center gap-0.5 px-1.5 h-[52px]
          bg-[#202020]/95 backdrop-blur-md
          border border-[#3A3A3A] rounded-2xl shadow-2xl">
          {links.map(({ to, label: navLabel, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={navLabel}
              className={({ isActive }) =>
                `flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                ${isActive
                  ? 'bg-[#2F2F2F] text-[#CFCFCE]'
                  : 'text-[#6B6B6B] hover:bg-[#2A2A2A] hover:text-[#9A9A9A]'
                }`
              }
            >
              {icon}
            </NavLink>
          ))}
        </nav>
      </div>

      {showTask && <TaskForm onClose={() => setShowTask(false)} />}
      {showProject && <ProjectForm onClose={() => setShowProject(false)} />}
    </>
  )
}
