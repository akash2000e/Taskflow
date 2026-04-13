import { useNavigate } from 'react-router-dom'

const sections = [
  {
    title: 'What is Taskflow?',
    body: `Taskflow is a personal task tracker that lives entirely in your browser and stores all data as a JSON file in your own GitHub repository. No accounts, no servers — just your data, your repo.`,
  },
  {
    title: 'Getting started',
    steps: [
      'Create a GitHub repo (can be private) — e.g. my-taskflow.',
      'Copy data/tasks.example.json to data/tasks.json inside that repo.',
      'Go to Settings and enter your GitHub username, repo name, and a Personal Access Token with repo scope.',
      'Click "Test & connect". If it goes green, you\'re live.',
    ],
  },
  {
    title: 'Task types',
    items: [
      ['Project task', 'Belongs to a named project. Shows up under that project in the Projects and All Tasks views.'],
      ['General task', 'Standalone — not tied to any project. Lives in the General view.'],
    ],
  },
  {
    title: 'Constraints',
    items: [
      ['Deadline', 'Has a fixed due date. Shows a countdown ("3d left") or overdue warning in red.'],
      ['Free', 'No due date. Shows elapsed time since creation. Can be pinned to Today manually.'],
    ],
  },
  {
    title: 'Priority levels',
    items: [
      ['Urgent', 'Surfaces at the top of the priority queue. Shown with a red dot.'],
      ['Normal', 'Default. Shown with a blue dot.'],
      ['Someday', 'Low priority. Shown with a grey dot, appears at the bottom.'],
    ],
  },
  {
    title: 'Today strip',
    body: `The Today strip on the Dashboard shows tasks that need attention right now. A task appears here if:
• It has today_flag pinned (use the ★ button on any free task), or
• It has a deadline of today or earlier (overdue tasks always appear).`,
  },
  {
    title: 'Priority queue',
    body: `The Dashboard's Priority Queue ranks your top tasks by score: urgent deadline tasks score highest, free/someday tasks score lowest. Use it as your daily focus list.`,
  },
  {
    title: 'Projects',
    body: `Projects have a color, start date, optional deadline, and a status (Active / On Hold / Completed). Each project card shows a progress bar based on how many tasks are done. Click a project card to expand it and see or add tasks.`,
  },
  {
    title: 'Data & sync',
    body: `Every change (add, edit, complete, delete) is immediately written to your GitHub repo as a commit. Open Taskflow on another device and refresh to get the latest data. There is no real-time sync — refresh the page to pull updates.`,
  },
  {
    title: 'Keyboard shortcut',
    body: `Press Escape to close any open modal.`,
  },
]

export default function Help() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen px-4 sm:px-6">
      <div className="max-w-2xl mx-auto mt-6">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#9A9A9A] mb-6 transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#CFCFCE] mb-1">How to use Taskflow</h1>
          <p className="text-sm text-[#4A4A4A]">A quick reference guide — everything you need to know.</p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {sections.map(section => (
            <div key={section.title} className="bg-card border border-border rounded-2xl px-5 py-4">
              <h2 className="text-sm font-semibold text-[#CFCFCE] mb-2.5">{section.title}</h2>

              {section.body && (
                <p className="text-sm text-[#6B6B6B] leading-relaxed whitespace-pre-line">{section.body}</p>
              )}

              {section.steps && (
                <ol className="flex flex-col gap-1.5">
                  {section.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#6B6B6B]">
                      <span className="shrink-0 w-5 h-5 rounded-md bg-[#252525] border border-border text-[#4A4A4A] text-[10px] font-mono flex items-center justify-center mt-px">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}

              {section.items && (
                <div className="flex flex-col gap-2">
                  {section.items.map(([term, desc]) => (
                    <div key={term} className="flex gap-3">
                      <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-lg bg-[#252525] border border-border text-[#9A9A9A] h-fit mt-0.5">
                        {term}
                      </span>
                      <span className="text-sm text-[#6B6B6B] leading-relaxed">{desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-[#3A3A3A] text-center mt-6">
          Taskflow v1.0 — data stored in your GitHub repo, never on a server.
        </p>
      </div>
    </div>
  )
}
