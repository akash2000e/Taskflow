import { createContext, useContext, useReducer, useCallback } from 'react'
import { readTasks, writeTasks, isConfigured } from './github'
import { newId, slugify, toISODate } from './utils'

// ─── PREVIEW MODE ───────────────────────────────────────────────────────────
// Set to true to use the app without GitHub (data stored in memory only).
// Set to false to use GitHub for persistent storage.
const PREVIEW_MODE = false
// ────────────────────────────────────────────────────────────────────────────

const EMPTY_DATA = {
  meta: { version: '1.0', last_synced: new Date().toISOString() },
  projects: [],
  tasks: [],
}

const StoreContext = createContext(null)

const initialState = {
  data: PREVIEW_MODE ? EMPTY_DATA : null,
  sha: PREVIEW_MODE ? 'preview' : null,
  loading: PREVIEW_MODE ? false : true,
  saving: false,
  error: null,
  configured: PREVIEW_MODE ? true : isConfigured(),
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return { ...state, data: action.data, sha: action.sha, loading: false, error: null }
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error }
    case 'SAVE_START':
      return { ...state, saving: true, data: action.data }
    case 'SAVE_SUCCESS':
      return { ...state, saving: false, sha: action.sha, data: action.data }
    case 'SAVE_ERROR':
      return { ...state, saving: false, error: action.error, data: action.prevData }
    case 'SET_CONFIGURED':
      return { ...state, configured: action.configured, loading: action.configured }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadData = useCallback(async () => {
    if (PREVIEW_MODE) return { ok: true }
    try {
      const { data, sha } = await readTasks()
      dispatch({ type: 'LOAD_SUCCESS', data, sha })
      return { ok: true }
    } catch (err) {
      dispatch({ type: 'LOAD_ERROR', error: err.message })
      return { ok: false, error: err.message }
    }
  }, [])

  async function persist(newData, prevData, sha, commitMsg) {
    dispatch({ type: 'SAVE_START', data: newData })
    if (PREVIEW_MODE) {
      dispatch({ type: 'SAVE_SUCCESS', sha: 'preview', data: newData })
      return
    }
    try {
      const result = await writeTasks(newData, sha, commitMsg)
      const synced = {
        ...newData,
        meta: { ...newData.meta, last_synced: new Date().toISOString() },
      }
      dispatch({ type: 'SAVE_SUCCESS', sha: result.sha, data: synced })
    } catch (err) {
      dispatch({ type: 'SAVE_ERROR', error: err.message, prevData })
    }
  }

  function addTask(taskFields) {
    const task = {
      id: newId(),
      type: 'general',
      project_id: null,
      title: '',
      notes: '',
      tags: [],
      constraint: 'free',
      due_date: null,
      today_flag: false,
      priority: 'normal',
      estimate_hrs: null,
      progress: 0,
      done: false,
      created_at: new Date().toISOString(),
      completed_at: null,
      updated_at: new Date().toISOString(),
      recurrence: null,
      streak: 0,
      ...taskFields,
    }
    const newData = { ...state.data, tasks: [...state.data.tasks, task] }
    persist(newData, state.data, state.sha, `Add task: ${task.title}`)
  }

  function updateTask(id, changes) {
    const newTasks = state.data.tasks.map(t =>
      t.id === id ? { ...t, ...changes, updated_at: new Date().toISOString() } : t
    )
    const newData = { ...state.data, tasks: newTasks }
    persist(newData, state.data, state.sha, `Update task: ${id}`)
  }

  function deleteTask(id) {
    const newTasks = state.data.tasks.filter(t => t.id !== id)
    const newData = { ...state.data, tasks: newTasks }
    persist(newData, state.data, state.sha, `Delete task: ${id}`)
  }

  function toggleDone(id) {
    const task = state.data.tasks.find(t => t.id === id)
    if (!task) return
    const done = !task.done
    updateTask(id, {
      done,
      completed_at: done ? new Date().toISOString() : null,
      progress: done ? 100 : task.progress,
    })
  }

  function togglePin(id) {
    const task = state.data.tasks.find(t => t.id === id)
    if (!task) return
    updateTask(id, { today_flag: !task.today_flag })
  }

  function addProject(projectFields) {
    const base = slugify(projectFields.name)
    const existing = state.data.projects.map(p => p.id)
    let id = base
    let n = 2
    while (existing.includes(id)) {
      id = `${base}-${n++}`
    }
    const project = {
      id,
      name: '',
      color: '#3B82F6',
      start_date: toISODate(),
      deadline: null,
      status: 'active',
      archived: false,
      logged_mins: 0,
      ...projectFields,
      id,
    }
    const newData = { ...state.data, projects: [...state.data.projects, project] }
    persist(newData, state.data, state.sha, `Add project: ${project.name}`)
  }

  function updateProject(id, changes) {
    const newProjects = state.data.projects.map(p =>
      p.id === id ? { ...p, ...changes } : p
    )
    const newData = { ...state.data, projects: newProjects }
    persist(newData, state.data, state.sha, `Update project: ${id}`)
  }

  function logTime(projectId, durationMins) {
    if (!durationMins || durationMins <= 0) return
    const newProjects = state.data.projects.map(p =>
      p.id === projectId
        ? { ...p, logged_mins: (p.logged_mins ?? 0) + durationMins }
        : p
    )
    const newData = { ...state.data, projects: newProjects }
    persist(newData, state.data, state.sha, `Log time: ${projectId} +${durationMins}m`)
  }

  function deleteProject(id) {
    const newProjects = state.data.projects.filter(p => p.id !== id)
    const newTasks = state.data.tasks.filter(t => t.project_id !== id)
    const newData = { ...state.data, projects: newProjects, tasks: newTasks }
    persist(newData, state.data, state.sha, `Delete project: ${id}`)
  }

  function setConfigured(configured) {
    dispatch({ type: 'SET_CONFIGURED', configured })
  }

  function clearError() {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    tasks: state.data?.tasks ?? [],
    projects: state.data?.projects ?? [],
    loadData,
    addTask,
    updateTask,
    deleteTask,
    toggleDone,
    togglePin,
    addProject,
    updateProject,
    deleteProject,
    logTime,
    setConfigured,
    clearError,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
