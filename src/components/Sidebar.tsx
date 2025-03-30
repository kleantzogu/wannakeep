'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { 
  PlusIcon,
  FileTextIcon,
  BookmarkIcon, 
  GearIcon, 
  MagnifyingGlassIcon,
  TrashIcon,
  DotsHorizontalIcon,
  Pencil1Icon,
  ChevronDownIcon,
  ArrowRightIcon,
} from '@radix-ui/react-icons'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { supabase, testBucketAccess } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSearch } from '@/providers/SearchProvider'

// Navigation items with their routes and functionality
const NAV_ITEMS = [
  {
    href: '/',
    icon: PlusIcon,
    label: 'New',
    description: 'Create new notes from text or files'
  },
  {
    href: '/notes',
    icon: FileTextIcon,
    label: 'Notes',
    description: 'View all projects and their notes'
  },
  {
    href: '/bookmarks',
    icon: BookmarkIcon,
    label: 'Bookmarks',
    description: 'Access bookmarked notes by project'
  },
  {
    href: '/settings',
    icon: GearIcon,
    label: 'Settings',
    description: 'Manage account and preferences'
  },
]

interface Bucket {
  id: string
  name: string
  emoji: string
  created_at: string
  updated_at: string
}

// Add this constant at the top of the file, after the imports
const BUCKET_EMOJIS = [
  '📝', // Notes
  '📚', // Books
  '💡', // Ideas
  '🎯', // Goals
  '📋', // Checklist
  '📎', // Attachments
  '📌', // Important
  '🔖', // Bookmarks
  '📅', // Calendar
  '📊', // Analytics
  '💼', // Work
  '🎓', // Education
  '🏠', // Home
  '💻', // Tech
  '🎨', // Creative
  '📱', // Mobile
  '🔍', // Research
  '💭', // Thoughts
  '📸', // Photos
  '🎵', // Music
]

export function Sidebar() {
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('📝')
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null)
  const [deletingBucket, setDeletingBucket] = useState<Bucket | null>(null)
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isBucketsExpanded, setIsBucketsExpanded] = useState(true)
  const router = useRouter()
  const { searchQuery, localQuery, setLocalQuery, isTyping } = useSearch()

  // Focus the search input on initial mount for search pages
  useEffect(() => {
    if (pathname.startsWith('/search') && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [pathname])

  // Handle submitting the search form
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Navigate only on explicit form submission
    if (localQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`, { scroll: false })
      
      // Focus input after navigation
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    } else if (pathname.startsWith('/search')) {
      router.push('/', { scroll: false });
    }
  }

  // Fetch buckets on mount
  useEffect(() => {
    let channel: any;

    async function initializeBuckets() {
      try {
        console.log('Initializing buckets...')
        // First test if we can access the buckets table
        const canAccessBuckets = await testBucketAccess()
        if (!canAccessBuckets) {
          console.error('Cannot access buckets table')
          toast.error('Failed to connect to buckets. Please check your connection.')
          return
        }

        // If we can access the table, fetch the buckets
        await fetchBuckets()

        console.log('Setting up real-time subscription...')
        // Subscribe to bucket changes
        channel = supabase
          .channel('buckets_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'buckets' 
            }, 
            (payload) => {
              if (!payload) {
                console.error('Received null payload in bucket changes')
                return
              }

              console.log('Received bucket change:', payload)

              // Handle INSERT event
              if (payload.eventType === 'INSERT' && payload.new) {
                const newBucket = payload.new as Bucket
                console.log('Adding new bucket to state:', newBucket)
                setBuckets(prev => {
                  // Check if bucket already exists to prevent duplicates
                  if (prev.some(bucket => bucket.id === newBucket.id)) {
                    return prev
                  }
                  const newBuckets = [...prev, newBucket]
                  console.log('Updated buckets state:', newBuckets)
                  return newBuckets
                })
              }
              // Handle DELETE event
              else if (payload.eventType === 'DELETE' && payload.old) {
                const deletedBucket = payload.old as Bucket
                console.log('Removing bucket from state:', deletedBucket)
                setBuckets(prev => prev.filter(bucket => bucket.id !== deletedBucket.id))
              }
              // Handle UPDATE event
              else if (payload.eventType === 'UPDATE' && payload.new) {
                const updatedBucket = payload.new as Bucket
                console.log('Updating bucket in state:', updatedBucket)
                setBuckets(prev => prev.map(bucket => 
                  bucket.id === updatedBucket.id ? updatedBucket : bucket
                ))
              }
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status)
          })

      } catch (error) {
        console.error('Error initializing buckets:', error)
        toast.error('Failed to initialize buckets. Please check your connection.')
      }
    }

    initializeBuckets()

    return () => {
      if (channel) {
        console.log('Cleaning up subscription...')
        channel.unsubscribe()
      }
    }
  }, [])

  const fetchBuckets = async () => {
    try {
      console.log('Fetching buckets...')
      const { data, error } = await supabase
        .from('buckets')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Fetched buckets:', data)
      setBuckets(data || [])
    } catch (error) {
      console.error('Error fetching buckets:', error)
      toast.error('Failed to load buckets. Please check the console for details.')
    }
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      toast.error('Bucket name is required')
      return
    }

    setIsLoading(true)
    try {
      // Log the attempt
      console.log('Attempting to create bucket:', {
        name: newBucketName.trim(),
        emoji: selectedEmoji
      })

      // Create bucket with emoji
      const { data, error } = await supabase
        .from('buckets')
        .insert([{ 
          name: newBucketName.trim(),
          emoji: selectedEmoji
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from bucket creation')
      }

      console.log('Bucket created successfully:', data)

      // Update local state
      setBuckets(prev => [...prev, data])

      // Reset form and close dialog
      setNewBucketName('')
      setSelectedEmoji('📝')
      setIsCreateOpen(false)
      toast.success('Bucket created successfully')
    } catch (error) {
      console.error('Error in bucket creation:', error)
      const errorMessage = error instanceof Error 
        ? `Failed to create bucket: ${error.message}`
        : 'Failed to create bucket. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBucket = async () => {
    if (!deletingBucket) return

    try {
      // Optimistically update the UI
      setBuckets(prev => prev.filter(bucket => bucket.id !== deletingBucket.id))

      const { error } = await supabase
        .from('buckets')
        .delete()
        .eq('id', deletingBucket.id)

      if (error) {
        // If there's an error, revert the optimistic update
        await fetchBuckets()
        throw error
      }
      
      setIsDeleteOpen(false)
      setDeletingBucket(null)
      toast.success('Bucket deleted successfully')
    } catch (error) {
      console.error('Error deleting bucket:', error)
      toast.error('Failed to delete bucket')
    }
  }

  const handleRenameBucket = async () => {
    if (!editingBucket || !newBucketName.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('buckets')
        .update({ 
          name: newBucketName.trim(),
          emoji: selectedEmoji,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingBucket.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Immediately update the buckets state with the renamed bucket
      if (data) {
        setBuckets(prev => prev.map(bucket => 
          bucket.id === data.id ? data : bucket
        ))
      }

      setNewBucketName('')
      setSelectedEmoji('📝')
      setIsRenameOpen(false)
      setEditingBucket(null)
      toast.success('Bucket renamed successfully')
    } catch (error) {
      console.error('Error renaming bucket:', error)
      toast.error('Failed to rename bucket')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="sidebar w-[240px] h-screen border-r border-border bg-background/80 backdrop-blur-xl fixed left-0 top-0 p-3 flex flex-col gap-6">
      <div className="flex items-start">
        <Link href="/">
          <Image
            src="/wannakeep-logo.svg"
            alt="Wannakeep"
            width={140}
            height={140}
            priority
            className="dark:invert cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      <div className="relative">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <MagnifyingGlassIcon 
              className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 z-10 ${isTyping ? 'text-foreground' : 'text-gray-400 dark:text-gray-500'}`} 
            />
            
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes..."
              value={localQuery}
              onChange={(e) => {
                // Update local query in the provider
                setLocalQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setLocalQuery('');
                  if (pathname.startsWith('/search')) {
                    router.push('/', { scroll: false });
                  }
                }
              }}
              className={`
                w-full pl-8 pr-8 h-8 bg-gray-100 dark:bg-gray-800
                border-0 shadow-sm
                transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1
                ${isTyping ? 'text-foreground font-medium' : ''}
                text-sm rounded-md placeholder-gray-300 dark:placeholder-gray-500
              `}
              style={{
                color: "var(--foreground)",
                caretColor: "var(--foreground)",
                opacity: 0.95
              }}
            />
            
            {/* Clear button */}
            {localQuery && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => {
                  setLocalQuery('');
                  if (pathname.startsWith('/search')) {
                    router.push('/', { scroll: false });
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            
            {/* Search button - appears when typing to allow explicit search */}
            {isTyping && localQuery.trim() && !pathname.startsWith('/search') && (
              <button
                type="submit"
                className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                title="Execute search"
              >
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Typing indicator - only show when typing but not showing search button */}
            {isTyping && (!localQuery.trim() || pathname.startsWith('/search')) && (
              <div className="typing-indicator absolute right-8 top-1/2 -translate-y-1/2 flex space-x-0.5">
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              </div>
            )}
          </div>
        </form>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          // Special handling for "New" button to force reset on home page
          if (item.label === 'New') {
            return (
              <button
                key={item.href}
                className={cn('sidebar-item group text-left', isActive && 'active')}
                title={item.description}
                onClick={() => {
                  // If already on home page, we want to reload it to clear state
                  if (pathname === '/') {
                    // Force a query parameter change to trigger useEffect in Home
                    router.push('/?new=' + Date.now())
                  } else {
                    // Normal navigation to home
                    router.push('/')
                  }
                }}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-item group', isActive && 'active')}
              title={item.description}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 mt-2">
        <div 
          className="flex items-center justify-between px-2 cursor-pointer"
          onClick={() => setIsBucketsExpanded(!isBucketsExpanded)}
        >
          <div className="flex items-center gap-1">
            <ChevronDownIcon 
              className={`h-4 w-4 text-muted-foreground transition-transform ${isBucketsExpanded ? '' : '-rotate-90'}`} 
            />
            <h3 className="text-sm font-medium text-muted-foreground">Buckets</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation(); // Prevent the collapse toggle from firing
              setIsCreateOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {isBucketsExpanded && (
          <div className="flex flex-col">
            {buckets.length > 0 ? (
              buckets.map(bucket => (
                <div
                  key={bucket.id}
                  className={cn(
                    "group flex items-center rounded-md",
                    (openDropdownId === bucket.id) ? "bg-secondary/50" : "hover:bg-secondary/50"
                  )}
                >
                  <Link
                    href={`/buckets/${bucket.id}`}
                    className={cn(
                      "flex-1 text-[13px] px-2 h-8 text-left transition-colors hover:text-primary w-full flex items-center",
                      pathname === `/buckets/${bucket.id}` && "text-foreground bg-secondary"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span>{bucket.emoji}</span>
                        <span>{bucket.name}</span>
                      </div>
                      <DropdownMenu open={openDropdownId === bucket.id} onOpenChange={(open) => setOpenDropdownId(open ? bucket.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-7 w-7 text-muted-foreground hover:text-foreground",
                              openDropdownId === bucket.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                          >
                            <DotsHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingBucket(bucket)
                              setNewBucketName(bucket.name)
                              setIsRenameOpen(true)
                            }}
                          >
                            <Pencil1Icon className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeletingBucket(bucket)
                              setIsDeleteOpen(true)
                            }}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground px-3">No buckets yet</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bucket</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-xl"
                  >
                    {selectedEmoji}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {BUCKET_EMOJIS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-xl hover:bg-secondary"
                        onClick={() => {
                          setSelectedEmoji(emoji)
                          setIsEmojiPickerOpen(false)
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                placeholder="Enter bucket name"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleCreateBucket()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBucket} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Bucket</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-xl"
                  >
                    {selectedEmoji}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {BUCKET_EMOJIS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-xl hover:bg-secondary"
                        onClick={() => {
                          setSelectedEmoji(emoji)
                          setIsEmojiPickerOpen(false)
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                placeholder="Enter new bucket name"
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleRenameBucket()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameBucket} disabled={isLoading}>
              {isLoading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bucket</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{deletingBucket?.name}&quot;? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteBucket}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
} 