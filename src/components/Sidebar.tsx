'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/lib/auth'
import { useSettings } from '@/providers/SettingsProvider'
import { cn } from '@/lib/utils'
import {
  MagnifyingGlassIcon,
  HomeIcon,
  DocumentIcon,
  FolderIcon,
  BookmarkIcon,
  TagIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const navigationItems = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Notes', href: '/notes', icon: DocumentIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Bookmarks', href: '/bookmarks', icon: BookmarkIcon },
  { name: 'Tags', href: '/tags', icon: TagIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
  { name: 'About', href: '/about', icon: InformationCircleIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, setSettings } = useSettings()
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleSidebar = () => {
    setSettings({
      ...settings,
      sidebarCollapsed: !settings.sidebarCollapsed,
    })
  }

  const handleSearchIconClick = () => {
    const e = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: false,
      bubbles: true,
      cancelable: true,
      composed: true,
    })
    document.dispatchEvent(e)
  }

  return (
    <div
      className={cn(
        'h-screen border-r border-border bg-background transition-all duration-300',
        settings.sidebarCollapsed ? 'w-[60px]' : 'w-[240px]',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearchIconClick}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          {!settings.sidebarCollapsed && (
            <span className="text-lg font-semibold">Wannakeep</span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {settings.sidebarCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex flex-col gap-1 p-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {!settings.sidebarCollapsed && <span>{item.name}</span>}
            </button>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-border p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          {!settings.sidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )
}
