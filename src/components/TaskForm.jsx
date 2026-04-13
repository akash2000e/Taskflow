import { useState, useEffect } from 'react'
import { useStore } from '../store'

const EMPTY_TASK = {
  title: '',
  type: 'general',
  project_id: null,
  constraint: 'free',
  due_date: '',
  priority: 'normal',
  estimate_hrs: '',
  progress: 0,
  notes: '',
  tags: '',
  today_flag: false,
}

const inputCls = 'w-full bg-[#191919] border border-border rounded-lg px-3 py-2 text-sm text-[#CFCFCE] placeholder-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5E8CD6] focus:border-[#5E8CD6]'
const labelCls = 'block text-xs font-medium text-[#6B6B6B] mb-2'

// Generic segmented button group
function ButtonGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(({ val, label, activeClass }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors
            ${value === val
              ? activeClass
              : 'bg-[#252525] border-border text-[#6B6B6B] hover:bg-[#2A2A2A] hover:text-[#9A9A9A]'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const TYPE_OPTIONS = [
  { val: 'general', label: 'General',  activeClass: 'bg-[#252525] border-[#444] text-[#CFCFCE]' },
  { val: 'project', label: 'Project',  activeClass: 'bg-[#1E2D3D] border-[#2A4060] text-[#7AADCF]' },
]

const CONSTRAINT_OPTIONS = [
  { val: 'free',     label: 'Free',     activeClass: 'bg-[#102A18] border-[#1A5028] text-[#5DAB7D]' },
  { val: 'deadline', label: 'Deadline', activeClass: 'bg-[#2A2010] border-[#4A3A10] text-[#E09F3E]' },
]

const PRIORITY_OPTIONS = [
  { val: 'urgent',  label: 'Urgent',  activeClass: 'bg-[#3D1A1A] border-[#8A3020] text-[#F08070] ring-1 ring-[#8A3020]' },
  { val: 'normal',  label: 'Normal',  activeClass: 'bg-[#1A2E48] border-[#2A5080] text-[#7AADCF] ring-1 ring-[#2A5080]' },
  { val: 'someday', label: 'Someday', activeClass: 'bg-[#303030] border-[#606060] text-[#AAAAAA] ring-1 ring-[#606060]' },
]

export default function TaskForm({ task, onClose, defaultProjectId }) {
  const { projects, addTask, updateTask, deleteTask } = useStore()
  const isEdit = Boolean(task)

  const [form, setForm] = useState(() => {
    if (task) {
      return {
        ...task,
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
        estimate_hrs: task.estimate_hrs ?? '',
        due_date: task.due_date ?? '',
      }
    }
    return {
      ...EMPTY_TASK,
      project_id: defaultProjectId ?? null,
      type: defaultProjectId ? 'project' : 'general',
    }
  })
  const [errors, setErrors] = useState({})

  const activeProjects = projects.filter(p => p.status === 'active' && !p.archived)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (form.type === 'project' && !form.project_id) errs.project_id = 'Select a project'
    if (form.constraint === 'deadline' && !form.due_date) errs.due_date = 'Due date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const payload = {
      ...form,
      title: form.title.trim(),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimate_hrs: form.estimate_hrs !== '' ? parseFloat(form.estimate_hrs) : null,
      due_date: form.constraint === 'deadline' ? form.due_date : null,
      project_id: form.type === 'project' ? form.project_id : null,
      progress: Number(form.progress),
    }
    if (isEdit) updateTask(task.id, payload)
    else addTask(payload)
    onClose()
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const progressPct = `${form.progress}%`

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-[3px] pb-36 sm:pb-0"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1C1C1C] w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-h-[calc(100vh-9rem)] sm:max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-[#1C1C1C] z-10">
          <h2 className="text-sm font-semibold text-[#CFCFCE]">{isEdit ? 'Edit task' : 'New task'}</h2>
          <button onClick={onClose} className="text-[#4A4A4A] hover:text-[#9A9A9A] transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">

          {/* Title */}
          <div>
            <label className={labelCls}>Title</label>
            <input autoFocus type="text" value={form.title} onChange={e => set('title', e.target.value)}
              className={`${inputCls} ${errors.title ? 'border-[#E87060]' : ''}`} placeholder="Task title"/>
            {errors.title && <p className="text-xs text-[#E87060] mt-1">{errors.title}</p>}
          </div>

          {/* Type */}
          <div>
            <label className={labelCls}>Type</label>
            <ButtonGroup options={TYPE_OPTIONS} value={form.type} onChange={v => set('type', v)} />
          </div>

          {/* Project selector */}
          {form.type === 'project' && (
            <div>
              <label className={labelCls}>Project</label>
              <select value={form.project_id ?? ''} onChange={e => set('project_id', e.target.value || null)}
                className={`${inputCls} ${errors.project_id ? 'border-[#E87060]' : ''}`}>
                <option value="">Select a project…</option>
                {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.project_id && <p className="text-xs text-[#E87060] mt-1">{errors.project_id}</p>}
            </div>
          )}

          {/* Constraint */}
          <div>
            <label className={labelCls}>Constraint</label>
            <ButtonGroup options={CONSTRAINT_OPTIONS} value={form.constraint} onChange={v => set('constraint', v)} />
          </div>

          {/* Due date */}
          {form.constraint === 'deadline' && (
            <div>
              <label className={labelCls}>Due date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className={`${inputCls} ${errors.due_date ? 'border-[#E87060]' : ''}`}/>
              {errors.due_date && <p className="text-xs text-[#E87060] mt-1">{errors.due_date}</p>}
            </div>
          )}

          {/* Priority */}
          <div>
            <label className={labelCls}>Priority</label>
            <ButtonGroup options={PRIORITY_OPTIONS} value={form.priority} onChange={v => set('priority', v)} />
          </div>

          {/* Estimate + Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Estimate (hrs)</label>
              <input type="number" min="0" step="0.5" value={form.estimate_hrs}
                onChange={e => set('estimate_hrs', e.target.value)}
                className={inputCls} placeholder="0"/>
            </div>
            <div>
              <label className={labelCls}>Progress — {form.progress}%</label>
              <div className="mt-1 relative">
                <input
                  type="range"
                  min="0" max="100"
                  value={form.progress}
                  onChange={e => set('progress', e.target.value)}
                  disabled={form.done}
                  className="boxy-slider w-full"
                  style={{ '--progress': progressPct }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
              className={`${inputCls} resize-none`} placeholder="Optional notes…"/>
          </div>

          {/* Tags */}
          <div>
            <label className={labelCls}>Tags</label>
            <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
              className={inputCls} placeholder="tag1, tag2"/>
          </div>

          {/* Pin to today */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.today_flag} onChange={e => set('today_flag', e.target.checked)}/>
            <span className="text-sm text-[#9A9A9A]">Pin to today</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border sticky bottom-0 bg-[#1C1C1C]">
          {isEdit && (
            <button
              onClick={() => {
                if (window.confirm('Delete this task?')) {
                  deleteTask(task.id)
                  onClose()
                }
              }}
              className="shrink-0 border border-[#5A2020] text-sm rounded-xl px-3 py-2 text-[#E87060] hover:bg-[#3D1A1A] transition-colors"
              title="Delete task"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 border border-border text-sm rounded-xl py-2 text-[#6B6B6B] hover:bg-[#252525] hover:text-[#9A9A9A] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 bg-[#2A3A52] hover:bg-[#334A68] border border-[#3A5070] text-[#8AB4D6] text-sm font-medium rounded-xl py-2 transition-colors">
            {isEdit ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </div>
    </div>
  )
}
