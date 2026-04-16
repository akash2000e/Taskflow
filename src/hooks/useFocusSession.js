import { useState, useEffect, useRef, useCallback } from 'react'

const SESSION_KEY = 'taskflow_focus_session'
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000 // 15 minutes

function loadSession() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

function saveSession(session) {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

export function useFocusSession({ onStop }) {
  const [session, setSession] = useState(() => loadSession())
  const [elapsed, setElapsed] = useState(() => {
    const s = loadSession()
    if (!s) return 0
    return Math.floor((s.accumulatedMs + (Date.now() - s.resumedAt)) / 1000)
  })
  const [isPaused, setIsPaused] = useState(false)

  const lastActivityRef = useRef(Date.now())
  const intervalRef = useRef(null)
  const onStopRef = useRef(onStop)
  useEffect(() => { onStopRef.current = onStop }, [onStop])

  // Persist to sessionStorage whenever session changes
  useEffect(() => {
    saveSession(session)
  }, [session])

  // Live timer tick + inactivity check
  useEffect(() => {
    if (!session || isPaused) {
      clearInterval(intervalRef.current)
      return
    }

    const tick = () => {
      const now = Date.now()
      if (now - lastActivityRef.current > INACTIVITY_LIMIT_MS) {
        // Auto-pause: freeze accumulated time
        setSession(s => s ? {
          ...s,
          accumulatedMs: s.accumulatedMs + (now - s.resumedAt),
          resumedAt: now,
        } : s)
        setIsPaused(true)
        clearInterval(intervalRef.current)
        return
      }
      const total = session.accumulatedMs + (now - session.resumedAt)
      setElapsed(Math.floor(total / 1000))
    }

    intervalRef.current = setInterval(tick, 1000)
    tick()
    return () => clearInterval(intervalRef.current)
  }, [session, isPaused])

  // Activity listeners — auto-resume on user interaction
  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now()
      if (isPaused) {
        setSession(s => s ? { ...s, resumedAt: Date.now() } : s)
        setIsPaused(false)
      }
    }
    window.addEventListener('mousemove', onActivity)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('click', onActivity)
    window.addEventListener('scroll', onActivity, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('click', onActivity)
      window.removeEventListener('scroll', onActivity)
    }
  }, [isPaused])

  // ── actions ─────────────────────────────────────────────────────────────────

  const _flush = useCallback((s, paused) => {
    if (!s) return
    const totalMs = s.accumulatedMs + (paused ? 0 : Date.now() - s.resumedAt)
    const mins = Math.round(totalMs / 60000)
    if (mins > 0) onStopRef.current?.(s.projectId, mins)
  }, [])

  const startSession = useCallback((projectId) => {
    const now = Date.now()
    setSession({ projectId, startedAt: now, resumedAt: now, accumulatedMs: 0 })
    setElapsed(0)
    setIsPaused(false)
    lastActivityRef.current = now
  }, [])

  const stopSession = useCallback(() => {
    setSession(s => { _flush(s, isPaused); return null })
    setElapsed(0)
    setIsPaused(false)
  }, [_flush, isPaused])

  const pauseSession = useCallback(() => {
    if (!session || isPaused) return
    const now = Date.now()
    setSession(s => s ? {
      ...s,
      accumulatedMs: s.accumulatedMs + (now - s.resumedAt),
      resumedAt: now,
    } : s)
    setIsPaused(true)
  }, [session, isPaused])

  const resumeSession = useCallback(() => {
    if (!session || !isPaused) return
    setSession(s => s ? { ...s, resumedAt: Date.now() } : s)
    setIsPaused(false)
    lastActivityRef.current = Date.now()
  }, [session, isPaused])

  // Click same project = stop, different project = flush + start new
  const switchProject = useCallback((projectId) => {
    if (session?.projectId === projectId) {
      stopSession()
    } else {
      setSession(s => { _flush(s, isPaused); return null })
      startSession(projectId)
    }
  }, [session, isPaused, _flush, startSession, stopSession])

  return {
    activeProjectId: session?.projectId ?? null,
    elapsed,        // seconds (live)
    isPaused,
    isActive: session !== null,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    switchProject,
  }
}
