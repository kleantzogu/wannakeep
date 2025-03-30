'use client'

import { useEffect, ReactNode } from 'react'
import { useSettings } from '@/lib/store/settings'

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { loadUserSettings } = useSettings()

  // Load user settings once on app initialization
  useEffect(() => {
    loadUserSettings()
  }, [loadUserSettings])

  return <>{children}</>
} 