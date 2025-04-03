'use client'

import { NotesProvider } from '@/providers/NotesProvider'
import { SearchProvider } from '@/providers/SearchProvider'
import { CommandPalette } from '@/components/CommandPalette'
import { CreateBucketDialog } from '@/components/CreateBucketDialog'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  FileText,
  Home,
  BookmarkIcon,
  Settings,
  Plus,
  Tags,
  HelpCircle,
  Info,
  ChevronRight,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RootLayoutClientProps {
  children: React.ReactNode
  fontClassName: string
}

interface Bucket {
  id: string
  name: string
  emoji: string
}

export default function RootLayoutClient({
  children,
  fontClassName,
}: RootLayoutClientProps) {
  const pathname = usePathname()
  const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false)
  const [isBucketsExpanded, setIsBucketsExpanded] = useState(true)
  const [buckets, setBuckets] = useState<Bucket[]>([
    { id: 'main', name: 'Main', emoji: '📁' },
    { id: '221', name: '221', emoji: '📚' },
    { id: 'psst', name: 'PSST!', emoji: '🤫' },
    { id: 'we', name: 'we', emoji: '👥' },
  ])

  const handleCreateBucket = (name: string, emoji: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    setBuckets([...buckets, { id, name, emoji }])
  }

  const handleSearchClick = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <html lang="en">
      <body className={fontClassName}>
        <NotesProvider>
          <SearchProvider>
            <div className="flex min-h-screen">
              {/* Sidebar Navigation */}
              <div className="w-52 flex-shrink-0 border-r border-zinc-200 bg-zinc-50/50">
                <div className="flex h-full flex-col p-2">
                  <div className="mb-4 flex items-center justify-between px-2 py-1.5">
                    <Image
                      src="/wannakeep-logo.svg"
                      alt="Wannakeep"
                      width={120}
                      height={18}
                      priority
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-zinc-200"
                      onClick={handleSearchClick}
                    >
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Main Menu Items */}
                  <nav className="space-y-0.5">
                    <Link
                      href="/"
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ${pathname === '/' ? 'bg-zinc-200' : 'hover:bg-zinc-100'}`}
                    >
                      <Home className="h-3.5 w-3.5" />
                      Home
                    </Link>
                    <Link
                      href="/notes"
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ${pathname === '/notes' ? 'bg-zinc-200' : 'hover:bg-zinc-100'}`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Notes
                    </Link>
                    <Link
                      href="/bookmarks"
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ${pathname === '/bookmarks' ? 'bg-zinc-200' : 'hover:bg-zinc-100'}`}
                    >
                      <BookmarkIcon className="h-3.5 w-3.5" />
                      Bookmarks
                    </Link>
                    <Link
                      href="/settings"
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ${pathname === '/settings' ? 'bg-zinc-200' : 'hover:bg-zinc-100'}`}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </Link>
                  </nav>

                  {/* Buckets Section */}
                  <div className="mt-6 flex-1 overflow-y-auto">
                    <button
                      onClick={() => setIsBucketsExpanded(!isBucketsExpanded)}
                      className="flex w-full items-center justify-between px-2 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
                    >
                      <div className="flex items-center gap-1">
                        <ChevronRight
                          className={`h-3 w-3 transition-transform ${isBucketsExpanded ? 'rotate-90' : ''}`}
                        />
                        <span>Buckets</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-zinc-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsCreateBucketOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </button>
                    {isBucketsExpanded && (
                      <div className="ml-2 mt-0.5 space-y-0.5 border-l border-zinc-200 pl-2">
                        {buckets.map((bucket) => (
                          <Link
                            key={bucket.id}
                            href={`/buckets/${bucket.id}`}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium ${
                              pathname === `/buckets/${bucket.id}`
                                ? 'bg-zinc-200'
                                : 'hover:bg-zinc-100'
                            }`}
                          >
                            <span className="text-base leading-none">
                              {bucket.emoji}
                            </span>
                            {bucket.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Menu Items */}
                  <div className="mt-6 space-y-0.5">
                    {/* Removed Settings from here since it's now in the main menu */}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">{children}</div>
            </div>
            <CommandPalette />
            <CreateBucketDialog
              isOpen={isCreateBucketOpen}
              onClose={() => setIsCreateBucketOpen(false)}
              onCreateBucket={handleCreateBucket}
            />
            <Toaster />
          </SearchProvider>
        </NotesProvider>
      </body>
    </html>
  )
}
