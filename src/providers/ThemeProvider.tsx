'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { useSettings } from '@/lib/store/settings'

const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  const { theme } = useSettings()
  
  // Set the default theme from the settings
  const defaultTheme = theme || 'system'

  return (
    <NextThemesProvider {...props} defaultTheme={defaultTheme}>
      {children}
    </NextThemesProvider>
  )
}

export default ThemeProvider
