import { createContext, useContext } from 'react'
import { useStore } from './store'
import { useFocusSession } from './hooks/useFocusSession'

const FocusContext = createContext(null)

export function FocusProvider({ children }) {
  const { logTime } = useStore()

  const focus = useFocusSession({
    onStop: (projectId, durationMins) => {
      logTime(projectId, durationMins)
    },
  })

  return <FocusContext.Provider value={focus}>{children}</FocusContext.Provider>
}

export function useFocus() {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used within FocusProvider')
  return ctx
}
