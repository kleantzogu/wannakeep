'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useSettings } from '@/lib/store/settings'

export function ThemeSynchronizer() {
  const { theme, setTheme } = useSettings()
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme()
  const isSyncingRef = useRef(false)

  // Single effect for theme synchronization with a guard against loops
  useEffect(() => {
    // Skip if we're already in the middle of a sync operation
    if (isSyncingRef.current) {
      return
    }

    // Only sync if themes don't match and both exist
    if (theme && currentTheme && theme !== currentTheme) {
      // Set sync flag to prevent loops
      isSyncingRef.current = true

      // Prefer the theme from our settings store
      setNextTheme(theme)
      
      // Reset the sync flag after a short delay to allow state updates to process
      setTimeout(() => {
        isSyncingRef.current = false
      }, 100)
    }
  }, [theme, currentTheme, setNextTheme])

  // Component doesn't render anything
  return null
} 