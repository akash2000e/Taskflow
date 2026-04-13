// Returns integer days between today and dateStr. Negative = past.
export function dayDiff(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

// Returns elapsed label: "Running · 3d" / "Running · 2w" / "Running · 1mo"
export function elapsedLabel(fromDateStr) {
  const from = new Date(fromDateStr)
  const now = new Date()
  const days = Math.floor((now - from) / (1000 * 60 * 60 * 24))
  if (days < 7) return `Running · ${days}d`
  if (days < 30) return `Running · ${Math.floor(days / 7)}w`
  return `Running · ${Math.floor(days / 30)}mo`
}

// Returns { text, color } for time display on a task
export function timeLabel(task, projects = []) {
  if (task.constraint === 'deadline') {
    const diff = dayDiff(task.due_date)
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: '#DC2626' }
    if (diff === 0) return { text: 'Due today', color: '#D97706' }
    return { text: `${diff}d left`, color: '#6B7280' }
  }

  // Free task — use project start_date for project tasks, created_at for general
  let fromDate = task.created_at
  if (task.type === 'project' && task.project_id) {
    const project = projects.find(p => p.id === task.project_id)
    if (project) fromDate = project.start_date
  }
  return { text: elapsedLabel(fromDate), color: '#16A34A' }
}

// Returns true if task should appear in today's strip
export function isToday(task) {
  if (task.done) return false
  if (task.today_flag) return true
  if (task.constraint === 'deadline' && task.due_date) {
    return dayDiff(task.due_date) <= 0
  }
  return false
}

// Priority score for ranking — higher = more urgent
export function priorityScore(task) {
  const weights = { urgent: 3, normal: 2, someday: 1 }
  const w = weights[task.priority] ?? 1
  if (task.constraint === 'deadline' && task.due_date) {
    const diff = dayDiff(task.due_date)
    return w / Math.max(diff, 0.5)
  }
  return w * 0.5
}

// Generate a short unique ID
export function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}

// Kebab-case slug from name
export function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Human-readable relative date
export function relativeDate(dateStr) {
  const diff = dayDiff(dateStr)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff <= 6) return `In ${diff} days`
  if (diff < -1 && diff >= -6) return `${Math.abs(diff)} days ago`
  // Fallback: format as "Apr 17"
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Format date as YYYY-MM-DD
export function toISODate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}
