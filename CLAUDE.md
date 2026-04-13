# Taskflow — Claude Code Build Specification

This is a complete build specification for Taskflow, a personal task tracker that runs on GitHub Pages and stores all data as a JSON file in the same GitHub repository. Read this entire file before writing any code.

---

## What you are building

A single-user personal productivity web app. No backend server. No database. No auth service. Data lives in `data/tasks.json` inside the GitHub repo, read and written via the GitHub Contents API using a Personal Access Token stored in the browser's localStorage.

The app has four screens: Dashboard, All Tasks, Projects, and General Tasks. It tracks two kinds of tasks — project tasks (belonging to a named project) and general tasks (standalone). Every task has either a deadline constraint (fixed due date, shows countdown) or a free constraint (no due date, shows elapsed time). A persistent "today strip" at the top of Dashboard and All Tasks shows what needs attention right now.

---

## Tech stack — do not deviate

- React 18 + Vite
- Tailwind CSS v3
- Recharts (for schedule bar chart and Gantt chart)
- React Router v6 (hash router — required for GitHub Pages)
- No backend, no Supabase, no Firebase, no external auth
- GitHub Contents API for all data read/write
- Deploy target: GitHub Pages

### Project scaffold

```
taskflow/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── github.js          ← all GitHub API calls live here
│   ├── store.js           ← global state (React context)
│   ├── utils.js           ← date helpers, priority score, time labels
│   ├── components/
│   │   ├── TopBar.jsx
│   │   ├── NavBar.jsx
│   │   ├── TodayStrip.jsx
│   │   ├── TaskItem.jsx
│   │   ├── TaskForm.jsx   ← modal for add/edit task
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectForm.jsx ← modal for add/edit project
│   │   ├── MetricCard.jsx
│   │   ├── ScheduleChart.jsx
│   │   └── GanttChart.jsx
│   └── screens/
│       ├── Dashboard.jsx
│       ├── AllTasks.jsx
│       ├── Projects.jsx
│       ├── General.jsx
│       └── Setup.jsx
├── data/
│   ├── tasks.json         ← live data file (written by app)
│   └── tasks.example.json ← clean starter copy (never touched by app)
├── index.html
├── vite.config.js
├── tailwind.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml     ← GitHub Actions deploy to Pages
├── README.md              ← user-facing setup guide
└── CLAUDE.md              ← this file
```

---

## Design language

The app should feel like a refined, focused productivity tool — not generic. Use these design decisions consistently:

- Font: `DM Sans` (body) + `DM Mono` (code/timestamps). Load from Google Fonts.
- Color palette: near-white background (`#FAFAF9`), dark text (`#1C1C1A`), blue accent (`#2563EB`), subtle warm borders (`#E5E4E0`).
- Cards: white (`#FFFFFF`), 1px border `#E5E4E0`, border-radius `10px`, padding `14px 16px`.
- Today strip: light blue tinted background `#EFF6FF`, blue text `#1D4ED8`.
- Priority colors: urgent = red (`#DC2626` / `#FEE2E2`), normal = blue (`#2563EB` / `#DBEAFE`), someday = gray (`#6B7280` / `#F3F4F6`).
- Constraint colors: deadline = amber (`#D97706` / `#FEF3C7`), free = green (`#16A34A` / `#DCFCE7`).
- Project colors: user-assigned from a fixed palette of 8 — `#2563EB`, `#DC2626`, `#16A34A`, `#D97706`, `#9333EA`, `#0891B2`, `#DB2777`, `#65A30D`.
- Overdue text: always `#DC2626`.
- All transitions: `150ms ease`.
- No gradients. No shadows except `0 1px 3px rgba(0,0,0,0.06)` on cards.

---

## Data schema — implement exactly as specified

### `data/tasks.json` — full structure

```json
{
  "meta": {
    "version": "1.0",
    "last_synced": "2026-04-13T08:30:00Z"
  },
  "projects": [
    {
      "id": "smart-bell",
      "name": "Smart Bell System",
      "color": "#2563EB",
      "start_date": "2026-03-01",
      "deadline": "2026-05-01",
      "status": "active",
      "archived": false
    }
  ],
  "tasks": [
    {
      "id": "a1b2c3d4",
      "type": "project",
      "project_id": "smart-bell",
      "title": "Implement relay control logic",
      "notes": "GPIO10 on XIAO C3 — check pull-up config",
      "tags": ["firmware", "esp32"],
      "constraint": "deadline",
      "due_date": "2026-04-17",
      "today_flag": false,
      "priority": "urgent",
      "estimate_hrs": 3,
      "progress": 0,
      "done": false,
      "created_at": "2026-04-13T08:00:00Z",
      "completed_at": null,
      "updated_at": "2026-04-13T08:00:00Z",
      "recurrence": null,
      "streak": 0
    },
    {
      "id": "e5f6g7h8",
      "type": "general",
      "project_id": null,
      "title": "Research LoRa antenna options",
      "notes": "",
      "tags": [],
      "constraint": "free",
      "due_date": null,
      "today_flag": true,
      "priority": "normal",
      "estimate_hrs": 1,
      "progress": 0,
      "done": false,
      "created_at": "2026-04-10T10:00:00Z",
      "completed_at": null,
      "updated_at": "2026-04-13T09:00:00Z",
      "recurrence": null,
      "streak": 0
    }
  ]
}
```

### Field rules — enforce these in TaskForm validation

- `type`: `"project"` or `"general"`. Project tasks must have `project_id`. General tasks must have `project_id: null`.
- `constraint`: `"deadline"` or `"free"`. When `deadline`, `due_date` must be a valid ISO date string. When `free`, `due_date` must be `null`.
- `priority`: `"urgent"`, `"normal"`, or `"someday"`.
- `progress`: integer 0–100.
- `id`: generate with `crypto.randomUUID()` trimmed to 8 chars.
- `created_at` and `updated_at`: full ISO timestamp (`new Date().toISOString()`).
- `completed_at`: set to `new Date().toISOString()` when `done` flips to `true`. Reset to `null` if unchecked.
- `recurrence` and `streak`: always `null` and `0` for now (phase 2 features, keep fields in schema).

### Project field rules

- `id`: kebab-case slug derived from name, e.g. `"My Project"` → `"my-project"`. Append `-2`, `-3` etc. if duplicate.
- `start_date`: ISO date string, required.
- `deadline`: ISO date string or `null` for open-ended projects.
- `status`: `"active"`, `"on-hold"`, or `"completed"`.

---

## `src/github.js` — implement all of these functions

```javascript
// Initialize with values from localStorage
const STORAGE_KEYS = {
  TOKEN: 'taskflow_token',
  USERNAME: 'taskflow_username',
  REPO: 'taskflow_repo',
};

export function getConfig() {
  return {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN),
    username: localStorage.getItem(STORAGE_KEYS.USERNAME),
    repo: localStorage.getItem(STORAGE_KEYS.REPO),
  };
}

export function saveConfig({ token, username, repo }) { ... }
export function clearConfig() { ... }
export function isConfigured() { ... } // returns true if all three are set

// Read tasks.json from GitHub. Returns { data, sha }.
// sha must be stored and passed back on every write.
export async function readTasks() { ... }

// Write tasks.json to GitHub.
// Requires the current sha from the last readTasks() call.
export async function writeTasks(data, sha, commitMessage) { ... }

// Test connection — try to fetch tasks.json and return { ok, error }
export async function testConnection() { ... }
```

### GitHub API details

- Base URL: `https://api.github.com`
- Read file: `GET /repos/{username}/{repo}/contents/data/tasks.json`
- Write file: `PUT /repos/{username}/{repo}/contents/data/tasks.json`
  - Body: `{ message, content: btoa(JSON.stringify(data, null, 2)), sha }`
- Headers on every request:
  ```
  Authorization: token {PAT}
  Accept: application/vnd.github.v3+json
  Content-Type: application/json
  ```
- File content from GitHub is base64 encoded. Decode with `atob(response.content)` then `JSON.parse()`.
- Always store the `sha` from every GET response and pass it in the next PUT. Without the correct sha, GitHub rejects the write with 409.
- On 409 conflict: re-fetch to get latest sha, then retry the write once.
- On 401: clear config, redirect to Setup screen.
- On network error: show a toast "Could not reach GitHub — check your connection."

---

## `src/utils.js` — implement all of these

```javascript
// Returns integer days between today and dateStr. Negative = past.
export function dayDiff(dateStr) { ... }

// Returns elapsed time label for free tasks.
// Uses project start_date if project task, created_at if general.
// "Running · 3d" / "Running · 2w" / "Running · 1mo"
export function elapsedLabel(fromDateStr) { ... }

// Returns { text, color } for the time display on a task.
// Deadline tasks: overdue (red), due today (amber), N days left (gray).
// Free tasks: elapsed label (green/muted).
export function timeLabel(task, projects) { ... }

// Returns true if task should appear in today's strip.
// True if: today_flag OR (deadline && due_date <= today) OR (deadline && overdue)
export function isToday(task) { ... }

// Priority score for ranking. Higher = more urgent.
// score = weight(priority) / max(dayDiff(due_date), 0.5) for deadline tasks
// score = weight(priority) * 0.5 for free tasks (deprioritised but visible)
// weights: urgent=3, normal=2, someday=1
export function priorityScore(task) { ... }

// Generate a short unique ID
export function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

// Human-readable relative date: "Today", "Tomorrow", "In 3 days", "Apr 17", "3 days ago"
export function relativeDate(dateStr) { ... }
```

---

## `src/store.js` — global state

Use React Context + useReducer. The store holds:

```javascript
{
  data: null,          // the full tasks.json object, null until loaded
  sha: null,           // current GitHub file sha
  loading: true,       // initial load in progress
  saving: false,       // write in progress
  error: null,         // string error message or null
  configured: false,   // whether GitHub config exists in localStorage
}
```

Actions: `LOAD_SUCCESS`, `LOAD_ERROR`, `SAVE_START`, `SAVE_SUCCESS`, `SAVE_ERROR`, `SET_CONFIGURED`.

Expose these from the store context:
- `tasks` — `data.tasks` or `[]`
- `projects` — `data.projects` or `[]`
- `addTask(task)` — adds to tasks array, writes to GitHub
- `updateTask(id, changes)` — merges changes, sets `updated_at`, writes to GitHub
- `deleteTask(id)` — removes task, writes to GitHub
- `toggleDone(id)` — flips `done`, sets/clears `completed_at`, writes to GitHub
- `togglePin(id)` — flips `today_flag`, writes to GitHub
- `addProject(project)` — adds to projects array, writes to GitHub
- `updateProject(id, changes)` — merges changes, writes to GitHub

Every write must:
1. Set `saving: true`
2. Optimistically update local state immediately (don't wait for GitHub)
3. Call `writeTasks()` in the background
4. On success: update `sha`, set `saving: false`, update `meta.last_synced`
5. On error: revert local state, set `error`, set `saving: false`

---

## Screen specifications

### Setup screen (`/setup`)

Shown automatically on first visit (when `isConfigured()` is false) or when navigating to `/setup`.

Fields:
- GitHub username (text input)
- Repository name (text input)  
- Personal Access Token (password input, toggle show/hide)
- "Test connection" button — calls `testConnection()`, shows green tick or red error inline

On successful test: save config, load data, redirect to Dashboard.

Also show: a concise explanation of what the PAT is used for and how to create one, with a direct link to `https://github.com/settings/tokens/new`.

### Dashboard screen (`/`)

Layout from top to bottom:

1. Three metric cards in a row: Active tasks (count), Overdue (count, red if >0), Hours queued (sum of estimate_hrs for active tasks, 1 decimal).

2. Today strip — full width, blue tinted. Shows all tasks where `isToday()` is true. Each task shows: checkbox, title, project badge (or "General"), constraint badge, time label. Clicking the checkbox calls `toggleDone()`. If empty: "Nothing due today — you're clear."

3. Schedule chart — horizontal bar chart using Recharts. X axis: next 7 days. Y axis: hours. Stacked bars coloured by project. Data: sum of `estimate_hrs` for active tasks grouped by `due_date` and `project_id`. General tasks grouped separately as a neutral gray bar. Show a thin vertical line for today.

4. Priority queue — top 5 tasks ranked by `priorityScore()`, excluding done tasks. Each shows title, project badge, priority badge, constraint badge, time label, estimate, and a "+ today" pin button.

### All Tasks screen (`/all`)

Layout:
1. Today strip (same as dashboard).
2. Collapsible sections — one per project (sorted by priority score of contained tasks), then a "General" section. Each section header shows project name with color dot, task count, collapse chevron.
3. Within each section: tasks sorted by priority score, done tasks shown faded at the bottom with strikethrough.
4. "+ today" pin button on every free task (deadline tasks auto-surface, no pin needed).

### Projects screen (`/projects`)

List of project cards. Each card shows:
- Colored dot + project name + status badge
- Task count, completed count, hours remaining
- Time display: if project has `deadline`, show "Xd left" (amber) or "Xd over" (red). If no deadline, show elapsed since `start_date` (green: "Running · 2w").
- Progress bar: % of tasks done, filled with project color.
- Click to expand: reveals task list for that project, each task showing full detail. Collapsed by default.
- Expand shows an "Add task to [project]" button at the bottom.
- "New project" button at the top right.

### General Tasks screen (`/general`)

Simple list of all `type: "general"` tasks, sorted by priority score. Done tasks faded at the bottom. "+ today" pin button on each. "Add general task" button at the bottom.

---

## TaskForm modal — add and edit tasks

Single modal used for both adding and editing. Fields:

| Field | Input type | Notes |
|---|---|---|
| Title | text | Required |
| Type | radio: project / general | Switches project selector visibility |
| Project | select | Only shown when type = project. Lists active projects. |
| Constraint | radio: deadline / free | Switches due date field visibility |
| Due date | date picker | Only shown when constraint = deadline. Required if deadline. |
| Priority | radio: urgent / normal / someday | |
| Estimate | number input | Hours, step 0.5, min 0 |
| Progress | range slider 0–100 | Shows % value next to slider |
| Notes | textarea | Optional, 3 rows |
| Tags | text input | Comma-separated, split into array on save |
| Pin to today | checkbox | Sets today_flag |

Validation before save:
- Title must not be empty
- If type = project, project_id must be selected
- If constraint = deadline, due_date must be set and valid

### ProjectForm modal — add and edit projects

| Field | Input type | Notes |
|---|---|---|
| Name | text | Required. Auto-generates id slug. |
| Color | color picker | 8 preset swatches, pick one |
| Start date | date picker | Required, defaults to today |
| Deadline | date picker | Optional. Leave blank for open-ended. |
| Status | select: active / on-hold / completed | |

---

## GanttChart component

Placed on the Dashboard below the schedule chart, or as a separate tab within Dashboard (implement as a tab: "Schedule" / "Gantt").

- X axis: 14-day window starting from today.
- Y axis: one row per active task, grouped by project.
- Each bar: starts at task `created_at` date (or project `start_date` if earlier for project tasks), ends at `due_date` (for deadline tasks) or today + 7 days (for free tasks — visual only, no real deadline implied).
- Bar fill: progress % shown as a lighter shade of the project color inside the bar.
- Today line: vertical blue line at today's position.
- Overdue indicator: red left edge if task is past due date.
- Clicking a bar opens TaskForm in edit mode for that task.
- Filter buttons: All, then one per project, then General.

Implement this as a pure HTML/CSS/JS approach inside React (not a Recharts chart) — use absolute positioning with percentage-based left/width calculated from day offsets. This gives more control than trying to coerce Recharts into a Gantt layout.

---

## Routing

Use `HashRouter` from react-router-dom. GitHub Pages doesn't support SPA fallback routing, so hash-based routing is required.

```
/#/           → Dashboard
/#/all        → All Tasks
/#/projects   → Projects
/#/general    → General Tasks
/#/setup      → Setup
```

On app load: if not configured, redirect to `/#/setup`. Otherwise load data and go to `/#/`.

---

## `data/tasks.example.json`

Create this file with 3 sample projects and 8 sample tasks demonstrating all combinations: project/general × deadline/free. Use realistic maker-project content. This file is the template users copy to reset their data.

---

## GitHub Actions deploy workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',   // required for GitHub Pages — makes all asset paths relative
})
```

The `base: './'` is critical. Without it, GitHub Pages serves assets from the wrong path.

---

## `tailwind.config.js`

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        surface: '#FAFAF9',
        border: '#E5E4E0',
      },
    },
  },
}
```

---

## `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Taskflow</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Mono&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## Toast notifications

Implement a lightweight toast system (no external library). Show toasts for:
- "Saving..." (while writing to GitHub, auto-dismiss never — dismiss when save finishes)
- "Saved" (green, auto-dismiss 2s)
- "Could not save — changes will be retried" (red, stays until dismissed)
- "Connected to GitHub" (green, auto-dismiss 3s, shown on first successful load)

Position: bottom-right, stacked, slide in from right.

---

## Error states

Handle these explicitly:

- `tasks.json` not found in repo (404): Show a friendly message explaining the file is missing with instructions to create it from `tasks.example.json`. Link to the repo.
- GitHub API rate limited (403): Show "GitHub API rate limit reached. Try again in an hour."
- Token expired/invalid (401): Show "Your GitHub token is invalid or expired." with a button to go to Setup.
- Network offline: Show a banner "You're offline — changes will sync when you reconnect."

---

## Responsive layout

The app must work on both desktop and mobile browser. Use these breakpoints:

- Mobile (< 640px): single column, nav is a bottom tab bar with icons only (no labels), metric cards stack 1-per-row, charts scroll horizontally.
- Desktop (≥ 640px): standard layout, side-padded content max-width `720px` centered.

---

## Build and run commands

```bash
npm create vite@latest taskflow -- --template react
cd taskflow
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom recharts
npm run dev      # development
npm run build    # production build → dist/
```

---

## What NOT to build

- No user accounts or multi-user support
- No backend server or serverless functions
- No real-time sync (refresh page to get latest data from another device)
- No offline queue / service worker (keep it simple)
- No recurring tasks UI (the schema has recurrence/streak fields but leave them as null — Phase 2)
- No calendar sync (Phase 2)
- No drag-and-drop reordering

---

## Build order — follow this sequence

1. Scaffold Vite + React project, install dependencies, configure Tailwind, set up hash router.
2. Implement `github.js` — all API functions. Test with console logs before building UI.
3. Implement `utils.js` — all helper functions. Write unit tests inline as console.assert calls.
4. Implement `store.js` — context + reducer. Verify state shape with a simple debug display.
5. Build Setup screen. Verify PAT storage and connection test work end-to-end.
6. Build `TaskItem` component — the atomic unit everything else uses.
7. Build `TodayStrip` component.
8. Build Dashboard screen with metrics and today strip (no charts yet).
9. Build `TaskForm` modal — add and edit. Verify data writes to GitHub and reads back correctly.
10. Build `ProjectForm` modal.
11. Build All Tasks screen.
12. Build Projects screen.
13. Build General Tasks screen.
14. Add `ScheduleChart` (Recharts bar chart).
15. Add `GanttChart` (custom CSS/absolute positioning).
16. Add toast notification system.
17. Add responsive mobile layout.
18. Configure GitHub Actions deploy workflow.
19. Create `data/tasks.example.json` with sample data.
20. Final pass: error states, edge cases, empty states.

---

## Edge cases to handle

- Empty state: no projects yet — show "Create your first project" prompt on Projects screen.
- Empty state: no tasks — show "Add your first task" on All Tasks and Dashboard.
- Task with no `estimate_hrs` — omit from schedule chart, show no hours estimate in UI.
- Project with no tasks — still show project card with 0 tasks.
- All tasks done — today strip shows "Nothing due today — you're clear."
- Simultaneous edit from two browser tabs — on 409 from GitHub, fetch latest sha and retry write once. If still fails, show error toast.
- `due_date` in the past for a deadline task — always show overdue in red, include in today strip.
- Free task pinned to today (`today_flag: true`) — stays in today strip until manually unpinned or marked done.
- Progress slider on a done task — disable it (done = 100% implicitly).
- Deleting a project — prompt "Delete [name] and all its tasks?" confirmation. On confirm, remove project and all tasks with that `project_id`.

---

## Sample data for `data/tasks.example.json`

Use these exact projects and tasks as the starter data:

Projects:
- Smart Bell System — `#2563EB` — start `2026-03-01` — deadline `2026-05-01`
- MorseTorch — `#DC2626` — start `2026-02-15` — no deadline
- KSUM Work — `#16A34A` — start `2026-01-01` — deadline `2026-06-30`

Tasks (mix of all types):
- [project, smart-bell, deadline] Implement relay control logic — urgent — due 2026-04-17 — 3h
- [project, smart-bell, deadline] Fix SPIFFS schedule storage bug — urgent — due 2026-04-12 — 2h — progress 60
- [project, smart-bell, free] Web dashboard UI — normal — 3h
- [project, smart-bell, deadline] NTP sync for IST timezone — normal — due 2026-04-18 — 1h
- [project, morsetorch, deadline] Design PETG enclosure — urgent — due 2026-04-15 — 2h — progress 20
- [project, morsetorch, free] Custom Meshtastic plugin — normal — 4h
- [project, ksum, deadline] Monthly fellowship report — normal — due 2026-04-17 — 1.5h — progress 10
- [general, free] Research LoRa antenna options — normal — 1h — today_flag true
- [general, deadline] Buy soldering flux — urgent — due 2026-04-13 — 0.5h
- [general, free] Read ESP-IDF docs chapter 4 — someday — 2h
