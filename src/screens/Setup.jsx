import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { saveConfig, testConnection } from '../github'
import { useStore } from '../store'

const inputCls = 'w-full bg-[#191919] border border-border rounded-lg px-3 py-2 text-sm text-[#CFCFCE] placeholder-[#4A4A4A] focus:outline-none focus:ring-1 focus:ring-[#5E8CD6] focus:border-[#5E8CD6]'
const labelCls = 'block text-xs font-medium text-[#6B6B6B] mb-1.5'

export default function Setup() {
  const navigate = useNavigate()
  const { setConfigured, loadData } = useStore()

  const [username, setUsername] = useState('')
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)

  async function handleTest() {
    if (!username || !repo || !token) {
      setResult({ ok: false, error: 'Please fill in all fields.' })
      return
    }
    setTesting(true)
    setResult(null)
    saveConfig({ token, username, repo })
    const res = await testConnection()
    if (res.ok) {
      setConfigured(true)
      await loadData()
      navigate('/')
    } else {
      setResult({ ok: false, error: res.error })
    }
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-8">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="#5E8CD6"/>
            <path d="M8 10h16M8 16h10M8 22h12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="text-xl font-semibold text-[#CFCFCE]">Taskflow</span>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h1 className="text-base font-semibold text-[#CFCFCE] mb-1">Connect your GitHub repo</h1>
          <p className="text-sm text-[#4A4A4A] mb-6">
            Tasks are stored as <code className="font-mono bg-[#252525] px-1 rounded text-xs text-[#9A9A9A]">data/tasks.json</code> in a repo you own. Token stays in this browser only.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>GitHub Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="your-username" className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>Repository Name</label>
              <input type="text" value={repo} onChange={e => setRepo(e.target.value)}
                placeholder="my-taskflow" className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>Personal Access Token</label>
              <div className="relative">
                <input type={showToken ? 'text' : 'password'} value={token} onChange={e => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx" className={`${inputCls} pr-10 font-mono`}/>
                <button type="button" onClick={() => setShowToken(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4A4A4A] hover:text-[#6B6B6B]">
                  {showToken ? (
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div className={`mt-4 flex items-start gap-2 text-sm rounded-xl px-3 py-2.5
              ${result.ok ? 'bg-[#102A18] text-[#5DAB7D]' : 'bg-[#2A1010] text-[#E87060]'}`}>
              <span>{result.ok ? '✓' : '✕'}</span>
              <span>{result.ok ? 'Connected!' : result.error}</span>
            </div>
          )}

          <button onClick={handleTest} disabled={testing}
            className="mt-5 w-full bg-[#2A3A52] hover:bg-[#334A68] border border-[#3A5070] disabled:opacity-50 text-[#8AB4D6] font-medium text-sm rounded-xl py-2.5 transition-colors">
            {testing ? 'Testing connection…' : 'Test & connect'}
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">How to create a token</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-[#4A4A4A]">
            <li>Go to <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-[#5E8CD6] hover:underline">github.com/settings/tokens/new</a></li>
            <li>Name it "Taskflow", set expiry</li>
            <li>Select scope: <code className="font-mono bg-[#252525] px-1 rounded text-xs text-[#9A9A9A]">repo</code></li>
            <li>Generate and paste above</li>
          </ol>
        </div>

        {/* Wiki link */}
        <Link
          to="/help"
          className="flex items-center justify-between w-full bg-card border border-border rounded-2xl px-5 py-4 hover:bg-[#252525] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1E2D3D] border border-[#2A4060] flex items-center justify-center shrink-0">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#5E8CD6" strokeWidth="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#CFCFCE]">How to use Taskflow</p>
              <p className="text-xs text-[#4A4A4A]">Guide to tasks, projects, constraints and more</p>
            </div>
          </div>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#4A4A4A" strokeWidth="2"
            className="group-hover:stroke-[#6B6B6B] transition-colors shrink-0">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}
