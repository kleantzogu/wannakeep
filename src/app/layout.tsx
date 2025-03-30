// Ensure pages are rendered dynamically
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

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
import { Suspense } from 'react'
import ClientOnly from '@/components/ClientOnly'

const inter = Inter({ subsets: ['latin'] })

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Wannakeep - Note Organization App',
  description: 'Capture, organize, and manage notes from various sources with visual sticky notes',
}

// Fallback for sidebar
function SidebarFallback() {
  return <div className="w-[240px] h-screen bg-background/80 backdrop-blur-xl border-r border-border" />
}

// Fallback for page content
function PageLoadingFallback() {
  return (
    <div className="flex-1 h-full w-full bg-background flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  )
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
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <SettingsProvider>
              <NotesProvider>
                <SearchProvider>
                  <ThemeSynchronizer />
                  <div className="flex min-h-screen w-full">
                    <Suspense fallback={<SidebarFallback />}>
                      <Sidebar />
                    </Suspense>
                    <div className="flex-1 w-full">
                      <main className="h-full">
                        <ClientOnly fallback={<PageLoadingFallback />}>
                          {children}
                        </ClientOnly>
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