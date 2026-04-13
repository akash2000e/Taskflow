# Taskflow

A personal task tracker that runs on GitHub Pages and stores all data as `data/tasks.json` in this repository.

## Setup

### 1. Fork or clone this repo

Fork this repository to your own GitHub account, or create a new repo and push this code to it.

### 2. Add your tasks data file

Copy the example data file:

```
data/tasks.example.json  →  data/tasks.json
```

Commit and push `data/tasks.json` to your repo.

### 3. Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Set **Source** to `gh-pages` branch (created automatically after first deploy)
3. Save

### 4. Create a Personal Access Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Name it "Taskflow"
3. Set expiration (90 days or no expiry)
4. Select scope: `repo` (full repository access)
5. Click **Generate token** — copy it immediately

### 5. Open the app and connect

After GitHub Actions deploys the app, open your GitHub Pages URL:

```
https://<your-username>.github.io/<repo-name>/
```

Enter your GitHub username, repo name, and PAT on the Setup screen. Click **Test connection & save**.

## How it works

- All data lives in `data/tasks.json` in your repo
- Every change commits directly to that file via the GitHub Contents API
- Your PAT is stored only in your browser's `localStorage`

## Resetting data

Replace `data/tasks.json` with the contents of `data/tasks.example.json` and commit/push.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.
