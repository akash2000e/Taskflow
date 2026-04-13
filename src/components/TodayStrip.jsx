import { useStore } from '../store'
import { isToday, timeLabel } from '../utils'

export default function TodayStrip({ onEdit }) {
  const { tasks, projects, toggleDone } = useStore()
  const todayTasks = tasks.filter(t => isToday(t))

  return (
    <div className="bg-[#1E2228] border border-[#2A3340] rounded-2xl px-4 py-3 mb-4">
      <div className="flex items-center gap-2 mb-2.5">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#5E8CD6" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <span className="text-xs font-semibold text-[#5E8CD6]">Today</span>
        {todayTasks.length > 0 && (
          <span className="ml-auto text-xs text-[#3A5070]">
            {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {todayTasks.length === 0 ? (
        <p className="text-sm text-[#3A5070]">Nothing due today — you're clear.</p>
      ) : (
        <div className="flex flex-col">
          {todayTasks.map(task => {
            const project = projects.find(p => p.id === task.project_id)
            const { text: timeText, color: timeColor } = timeLabel(task, projects)
            return (
              <div key={task.id} className="flex items-center gap-2.5 py-2 border-b border-[#2A3340] last:border-0">
                <button
                  onClick={() => toggleDone(task.id)}
                  className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors
                    ${task.done ? 'bg-[#5E8CD6] border-[#5E8CD6]' : 'border-[#3A5070] hover:border-[#5E8CD6]'}`}
                >
                  {task.done && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <polyline points="2 5 4 7 8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <span
                  className={`flex-1 text-sm text-[#8AB4D6] cursor-pointer hover:text-[#CFCFCE] min-w-0 truncate ${task.done ? 'line-through opacity-40' : ''}`}
                  onClick={() => onEdit && onEdit(task)}
                >
                  {task.title}
                </span>

                {project && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A2030] text-[#5E8CD6] font-medium shrink-0">
                    {project.name}
                  </span>
                )}

                <span className="text-[10px] font-mono shrink-0" style={{ color: timeColor }}>{timeText}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
