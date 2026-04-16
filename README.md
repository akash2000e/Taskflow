# Taskflow

A personal task and project tracker that runs entirely on GitHub Pages. No backend, no database — all data lives as a single JSON file in your GitHub repository, read and written via the GitHub API.

---

## Setup

### 1. Fork or clone this repo

Fork this repository to your own GitHub account, or create a new repo and push this code to it.

### 2. Add your data file

Copy the example data file and commit it:

```
data/tasks.example.json  →  data/tasks.json
```

Commit and push `data/tasks.json` to your repo. This is the file the app reads and writes.

### 3. Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Set **Source** to `gh-pages` branch (created automatically after first deploy)
3. Save

### 4. Create a Personal Access Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Name it `Taskflow`
3. Set expiration (90 days recommended, or no expiry for convenience)
4. Select scope: **`repo`** (full repository access)
5. Click **Generate token** — copy it immediately, you won't see it again

### 5. Connect the app

After GitHub Actions deploys the app (check the Actions tab), open your Pages URL:

```
https://<your-username>.github.io/<repo-name>/
```

Enter your GitHub username, repo name, and PAT on the Setup screen. Click **Test connection & save**. On success, you're taken straight to the Dashboard.

---

## Screens

### Dashboard

The main overview screen. Contains:

- **Metric cards** — Active tasks, Done Today, Hours Queued, Overdue count
- **Today strip** — tasks due today or pinned to today
- **Priority breakdown** — donut chart of urgent / normal / someday counts
- **Project progress** — per-project task completion bars with logged time
- **Streak widget** — consecutive days with at least one completed task, with a 7-day bar chart
- **Schedule / Gantt tabs** — toggle between the 7-day schedule chart and 14-day Gantt view
- **Time Logged** — horizontal bars showing hours logged per project via focus sessions (appears once you've logged time)
- **Priority queue** — top 9 tasks ranked by urgency score
- **Suggested tasks** — tasks not yet in today's strip, ranked by priority, with a reason label and a quick pin button

### All Tasks

All tasks grouped by project (then a General section). Each section is collapsible. Active tasks are sorted by priority score; completed tasks are faded at the bottom.

### Projects

All project cards with task counts, completion bars, time-left / elapsed labels, and a task list that expands on click. Add tasks directly from within a project card.

### General Tasks

Standalone tasks (not attached to a project), sorted by priority score.

---

## Task fields

| Field | Description |
|---|---|
| **Title** | Required |
| **Type** | `project` (linked to a project) or `general` (standalone) |
| **Constraint** | `deadline` (has a due date) or `free` (no due date) |
| **Due date** | Required when constraint is deadline |
| **Start date** | Optional — when you plan to begin. Used in the Gantt and Schedule charts |
| **Priority** | `urgent`, `normal`, or `someday` |
| **Estimate** | Hours (step 0.5). Used in the Schedule chart and Hours Queued metric |
| **Progress** | 0–100% slider |
| **Notes** | Free text |
| **Tags** | Comma-separated list |
| **Pin to today** | Forces the task into today's strip regardless of due date |

---

## Focus bar

A fixed bar just below the top bar shows all your active projects as clickable buttons.

**How it works:**

1. Click a project button — it highlights with the project's color and a live timer starts
2. Click the same button again — timer stops and the elapsed time is saved to that project
3. Click a different button — the current session is saved and a new one begins for that project
4. Use the **⏸ pause** button to manually pause the timer
5. The timer **auto-pauses after 15 minutes of inactivity** (no mouse, keyboard, or scroll events). It resumes automatically the moment you interact with the page again
6. Use the **■ stop** button to end the session and save time without switching projects
7. The tab title bar shows a pulsing dot + live `MM:SS` counter while a session is running
8. **Closing the tab ends the session** — `sessionStorage` is used intentionally so time tracking stops with your work session

Logged time is saved to `data/tasks.json` under each project's `logged_mins` field and shown in the **Time Logged** section on the Dashboard.

---

## Schedule chart

A 7-day stacked bar chart showing estimated hours per day. Tasks appear at their **due date** if they have one, or at their **start date** if they have a start date but no deadline. This gives you a view of both upcoming deadlines and planned work.

---

## Gantt chart

A 14-day horizontal bar chart, one row per active task. Each bar spans from the task's **start date** (if set) or creation date, to its due date (or 7 days ahead for free tasks). Progress is shown as a lighter fill inside the bar.

- Click any bar to open the task for editing
- Filter by project using the pill buttons at the top
- Today is marked with a blue vertical line
- Overdue tasks have a red left edge and an `overdue` badge

---

## Streak tracking

The Dashboard **Streak widget** counts consecutive days (going back from today) on which you completed at least one task. The 7-day mini bar chart shows completions per day — today's bar is brighter green.

---

## Suggested tasks

Below the Priority Queue, the **Suggested** section surfaces tasks not already in your today strip, ranked by priority score. Each suggestion includes a reason:

- `High urgency` — priority is set to urgent
- `Due in Xd` — deadline tasks coming up soon
- `Stale · Xd` — tasks created more than 14 days ago with no progress
- `In queue` / `Someday` — lower priority tasks waiting

Click `+` to pin any suggestion to today.

---

## Priority scoring

Tasks are ranked using a score:

- Deadline tasks: `weight / max(days_until_due, 0.5)`
- Free tasks: `weight × 0.5`
- Weights: urgent = 3, normal = 2, someday = 1

Overdue tasks score highest (days_until_due is negative, clamped to 0.5).

---

## How data is stored

- All data lives in `data/tasks.json` in your GitHub repository
- Every add, edit, delete, or toggle commits directly to that file via the GitHub Contents API
- Your PAT is stored only in your browser's `localStorage` — it never leaves your device
- The `sha` of the file is tracked per-write to prevent conflicts. On a 409 (conflict), the app re-fetches the latest version and retries once
- Focus session time is stored in `sessionStorage` while active (tab-local, auto-clears on close) and written to `tasks.json` when a session ends

---

## Resetting data

Replace `data/tasks.json` with the contents of `data/tasks.example.json` and commit/push.

---

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Set `PREVIEW_MODE = true` in `src/store.jsx` to run without GitHub (data lives in memory only).

---

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which builds the app and pushes the output to the `gh-pages` branch automatically.
