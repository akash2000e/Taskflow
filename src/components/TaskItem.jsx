import { useStore } from '../store'
import { timeLabel } from '../utils'

const PRIORITY_DOT = {
  urgent: '#E87060',
  normal: '#5E8CD6',
  someday: '#4A4A4A',
}

export default function TaskItem({ task, onEdit, showPin = true }) {
  const { toggleDone, togglePin, projects } = useStore()
  const project = projects.find(p => p.id === task.project_id)
  const { text: timeText, color: timeColor } = timeLabel(task, projects)

  return (
    <div
      className={`flex items-start gap-3 py-3 border-b border-border last:border-0
        ${task.done ? 'opacity-30' : ''}`}
    >
      {/* Checkbox — wrapped in a larger tap area for mobile */}
      <button
        onClick={() => toggleDone(task.id)}
        className={`mt-0.5 shrink-0 rounded border flex items-center justify-center transition-colors active:opacity-70
          ${task.done ? 'bg-[#5E8CD6] border-[#5E8CD6]' : 'border-[#444] hover:border-[#5E8CD6]'}`}
        style={{ width: 20, height: 20, minWidth: 20 }}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="2 5 4 7 8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 mt-px"
            style={{ background: PRIORITY_DOT[task.priority] }}
          />
          <span
            className={`text-sm text-[#CFCFCE] cursor-pointer hover:text-[#5E8CD6] transition-colors leading-snug ${task.done ? 'line-through' : ''}`}
            onClick={() => onEdit && onEdit(task)}
          >
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap ml-3.5">
          {project && (
            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#252525] text-[#6B6B6B]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: project.color }}/>
              {project.name}
            </span>
          )}
          <span className="text-[10px] font-mono" style={{ color: timeColor }}>{timeText}</span>
          {task.estimate_hrs != null && (
            <span className="text-[10px] text-[#4A4A4A]">{task.estimate_hrs}h</span>
          )}
        </div>
      </div>

      {/* Pin */}
      {showPin && !task.done && task.constraint === 'free' && (
        <button
          onClick={() => togglePin(task.id)}
          title={task.today_flag ? 'Unpin from today' : 'Pin to today'}
          className={`shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors active:opacity-70
            ${task.today_flag
              ? 'bg-[#1A2A3D] border-[#2A4060] text-[#5E8CD6]'
              : 'border-border text-[#4A4A4A] hover:border-[#3A5070] hover:text-[#5E8CD6]'
            }`}
        >
          {task.today_flag ? '★' : '+'}
        </button>
      )}
    </div>
  )
}
