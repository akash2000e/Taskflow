import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { toISODate } from '../utils'

const PROJECT_COLORS = [
  '#5E8CD6', '#E87060', '#5DAB7D', '#E09F3E',
  '#9B7EC8', '#4BACC6', '#D66FA8', '#7DB84A',
]

const EMPTY = {
  name: '',
  color: '#5E8CD6',
  start_date: toISODate(),
  deadline: '',
  status: 'active',
}

const STATUS_OPTIONS = [
  {
    val: 'active',
    label: 'Active',
    activeClass: 'bg-[#1E2D3D] border-[#2A4060] text-[#5E8CD6]',
  },
  {
    val: 'on-hold',
    label: 'On Hold',
    activeClass: 'bg-[#2A2010] border-[#4A3A10] text-[#E09F3E]',
  },
  {
    val: 'completed',
    label: 'Completed',
    activeClass: 'bg-[#102A18] border-[#1A5028] text-[#5DAB7D]',
  },
]

const inputCls = 'w-full bg-[#191919] border border-border rounded-lg px-3 py-2 text-sm text-[#CFCFCE] placeholder-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5E8CD6] focus:border-[#5E8CD6]'
const labelCls = 'block text-xs font-medium text-[#6B6B6B] mb-2'

export default function ProjectForm({ project, onClose }) {
  const { addProject, updateProject } = useStore()
  const isEdit = Boolean(project)

  const [form, setForm] = useState(() =>
    project ? { ...project, deadline: project.deadline ?? '' } : { ...EMPTY }
  )
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.start_date) errs.start_date = 'Start date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const payload = { ...form, name: form.name.trim(), deadline: form.deadline || null }
    if (isEdit) updateProject(project.id, payload)
    else addProject(payload)
    onClose()
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-[3px] pb-[5.5rem] sm:pb-0"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1C1C1C] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-[#1C1C1C]">
          <h2 className="text-sm font-semibold text-[#CFCFCE]">{isEdit ? 'Edit project' : 'New project'}</h2>
          <button onClick={onClose} className="text-[#4A4A4A] hover:text-[#9A9A9A] transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">

          {/* Name */}
          <div>
            <label className={labelCls}>Project name</label>
            <input autoFocus type="text" value={form.name} onChange={e => set('name', e.target.value)}
              className={`${inputCls} ${errors.name ? 'border-[#E87060]' : ''}`} placeholder="My Project"/>
            {errors.name && <p className="text-xs text-[#E87060] mt-1">{errors.name}</p>}
          </div>

          {/* Color */}
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform
                    ${form.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Status — button group */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map(({ val, label, activeClass }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('status', val)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors
                    ${form.status === val
                      ? activeClass
                      : 'bg-[#252525] border-border text-[#6B6B6B] hover:bg-[#2A2A2A] hover:text-[#9A9A9A]'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start date</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className={`${inputCls} ${errors.start_date ? 'border-[#E87060]' : ''}`}/>
              {errors.start_date && <p className="text-xs text-[#E87060] mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className={labelCls}>Deadline (optional)</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={inputCls}/>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border sticky bottom-0 bg-[#1C1C1C]">
          <button onClick={onClose}
            className="flex-1 border border-border text-sm rounded-xl py-2 text-[#6B6B6B] hover:bg-[#252525] hover:text-[#9A9A9A] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 bg-[#2A3A52] hover:bg-[#334A68] border border-[#3A5070] text-[#8AB4D6] text-sm font-medium rounded-xl py-2 transition-colors">
            {isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>
    </div>
  )
}
