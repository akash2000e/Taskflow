const STORAGE_KEYS = {
  TOKEN: 'taskflow_token',
  USERNAME: 'taskflow_username',
  REPO: 'taskflow_repo',
}

const BASE_URL = 'https://api.github.com'

export function getConfig() {
  return {
    token: localStorage.getItem(STORAGE_KEYS.TOKEN),
    username: localStorage.getItem(STORAGE_KEYS.USERNAME),
    repo: localStorage.getItem(STORAGE_KEYS.REPO),
  }
}

export function saveConfig({ token, username, repo }) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  localStorage.setItem(STORAGE_KEYS.USERNAME, username)
  localStorage.setItem(STORAGE_KEYS.REPO, repo)
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USERNAME)
  localStorage.removeItem(STORAGE_KEYS.REPO)
}

export function isConfigured() {
  const { token, username, repo } = getConfig()
  return Boolean(token && username && repo)
}

function getHeaders() {
  const { token } = getConfig()
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

function getFilePath() {
  const { username, repo } = getConfig()
  return `${BASE_URL}/repos/${username}/${repo}/contents/data/tasks.json`
}

export async function readTasks() {
  const res = await fetch(getFilePath(), { headers: getHeaders() })

  if (res.status === 401) {
    clearConfig()
    throw new Error('AUTH_ERROR')
  }
  if (res.status === 403) {
    throw new Error('RATE_LIMIT')
  }
  if (res.status === 404) {
    throw new Error('NOT_FOUND')
  }
  if (!res.ok) {
    throw new Error('NETWORK_ERROR')
  }

  const json = await res.json()
  const data = JSON.parse(atob(json.content))
  return { data, sha: json.sha }
}

export async function writeTasks(data, sha, commitMessage = 'Update tasks') {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))
  const body = JSON.stringify({ message: commitMessage, content, sha })

  const res = await fetch(getFilePath(), {
    method: 'PUT',
    headers: getHeaders(),
    body,
  })

  if (res.status === 409) {
    // Conflict — re-fetch sha and retry once
    const refetch = await fetch(getFilePath(), { headers: getHeaders() })
    if (!refetch.ok) throw new Error('CONFLICT')
    const json = await refetch.json()
    const newSha = json.sha

    const retry = await fetch(getFilePath(), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ message: commitMessage, content, sha: newSha }),
    })
    if (!retry.ok) throw new Error('CONFLICT')
    const retryJson = await retry.json()
    return { sha: retryJson.content.sha }
  }

  if (res.status === 401) {
    clearConfig()
    throw new Error('AUTH_ERROR')
  }
  if (!res.ok) {
    throw new Error('WRITE_ERROR')
  }

  const json = await res.json()
  return { sha: json.content.sha }
}

export async function testConnection() {
  try {
    const { data, sha } = await readTasks()
    return { ok: true, sha, data }
  } catch (err) {
    const msg = err.message
    if (msg === 'AUTH_ERROR') return { ok: false, error: 'Invalid or expired token.' }
    if (msg === 'NOT_FOUND') return { ok: false, error: 'Repository or tasks.json not found. Make sure the file exists at data/tasks.json.' }
    if (msg === 'RATE_LIMIT') return { ok: false, error: 'GitHub API rate limit reached. Try again in an hour.' }
    return { ok: false, error: 'Could not reach GitHub — check your connection and credentials.' }
  }
}
