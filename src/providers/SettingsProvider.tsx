'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SettingsContextType {
  settings: {
    theme: 'light' | 'dark' | 'system'
    sidebarCollapsed: boolean
  }
  setSettings: (settings: SettingsContextType['settings']) => void
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {
    theme: 'system',
    sidebarCollapsed: false,
  },
  setSettings: () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<SettingsContextType['settings']>({
    theme: 'system',
    sidebarCollapsed: false,
  })

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
