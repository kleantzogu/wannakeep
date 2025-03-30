import { Inter } from 'next/font/google'
import ThemeProvider from '@/providers/ThemeProvider'
import NextTopLoader from 'nextjs-toploader'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ReactQueryProvider from '@/providers/ReactQueryProvider'
import { NotesProvider } from '@/providers/NotesProvider'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { Sidebar } from '@/components/Sidebar'
import { ThemeSynchronizer } from '@/components/ThemeSynchronizer'
import { SearchProvider } from '@/providers/SearchProvider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Wannakeep - Note Organization App',
  description: 'Capture, organize, and manage notes from various sources with visual sticky notes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.className} antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-screen">
        <NextTopLoader showSpinner={false} height={1} color="#09090b" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <SettingsProvider>
              <NotesProvider>
                <SearchProvider>
                  <ThemeSynchronizer />
                  <div className="flex min-h-screen w-full">
                    <Sidebar />
                    <div className="flex-1 w-full">
                      <main className="h-full">
                        {children}
                      </main>
                    </div>
                  </div>
                  <Analytics />
                  <Toaster />
                </SearchProvider>
              </NotesProvider>
            </SettingsProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
