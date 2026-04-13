import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const toast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const saving = useCallback(() => toast('Saving…', 'saving', 0), [toast])
  const saved = useCallback((savingId) => {
    if (savingId) dismiss(savingId)
    toast('Saved', 'success', 2000)
  }, [toast, dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss, saving, saved }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-md text-sm font-medium
              animate-[slideIn_150ms_ease] transition-all
              ${t.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${t.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${t.type === 'saving' ? 'bg-gray-800 text-white' : ''}
              ${t.type === 'info' ? 'bg-gray-800 text-white' : ''}
            `}
            style={{ animation: 'slideIn 150ms ease' }}
          >
            {t.type === 'saving' && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            )}
            <span>{t.message}</span>
            {t.type !== 'saving' && (
              <button onClick={() => dismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be within ToastProvider')
  return ctx
}
