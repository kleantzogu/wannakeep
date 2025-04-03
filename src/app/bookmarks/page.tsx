'use client'

import { useState, useMemo, useEffect } from 'react'
import { useNotes } from '@/providers/NotesProvider'
import { Button } from '@/components/ui/button'
import { Bookmark, Search, Filter, ChevronDown, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { generateNoteTitle } from '@/lib/utils'
import { BookmarkIcon } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { X, FolderIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DotsHorizontalIcon, TrashIcon } from '@radix-ui/react-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Note as NoteType } from '@/providers/NotesProvider'

interface Bucket {
  id: string
  name: string
  created_at: string
  updated_at: string
}

// Helper function to generate a group title from notes
function generateGroupTitle(notes: NoteType[]): string {
  return notes.length > 0 ? notes[0].title : 'Untitled Group'
}

export default function BookmarksPage() {
  const { notes: allNotes, updateNote, deleteNote, projects } = useNotes()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingNote, setDeletingNote] = useState<NoteType | null>(null)
  const [isAddToBucketOpen, setIsAddToBucketOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null)
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')

  // Get all unique tags from bookmarked notes
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    allNotes
      .filter((note) => note.isBookmarked)
      .forEach((note) => note.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags)
  }, [allNotes])

  // Group bookmarked notes by project
  const groupedNotes = useMemo(() => {
    const bookmarkedNotes = allNotes.filter((note) => note.isBookmarked)
    const filteredNotes = bookmarkedNotes.filter((note) => {
      const matchesSearch =
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSentiment =
        selectedSentiment === 'all' || note.sentiment === selectedSentiment
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => note.tags.includes(tag))
      return matchesSearch && matchesSentiment && matchesTags
    })

    const grouped = filteredNotes.reduce(
      (acc, note) => {
        const projectId = note.projectId
        if (!acc[projectId]) {
          // Find the project to get its title
          const project = projects.find((p) => p.id === projectId)
          acc[projectId] = {
            projectId,
            notes: [],
            title: project?.title || 'Untitled Project',
          }
        }
        acc[projectId].notes.push(note)
        return acc
      },
      {} as Record<
        string,
        { projectId: string; notes: typeof allNotes; title: string }
      >,
    )

    return grouped
  }, [allNotes, projects, searchQuery, selectedSentiment, selectedTags])

  const handleBookmark = async (noteId: string) => {
    setBookmarkLoading(noteId)
    setError(null)

    try {
      await updateNote(noteId, {
        isBookmarked: !allNotes.find((n) => n.id === noteId)?.isBookmarked,
      })
    } catch (error) {
      console.error('Error updating bookmark:', error)
      setError('Failed to update bookmark')
    } finally {
      setBookmarkLoading(null)
    }
  }

  // Helper function to determine note color based on sentiment
  const getNoteColorClass = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 border-green-300 text-green-800'
      case 'negative':
        return 'bg-red-100 border-red-300 text-red-800'
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800' // neutral
    }
  }

  // Fetch buckets on mount
  useEffect(() => {
    async function fetchBuckets() {
      try {
        const { data, error } = await supabase
          .from('buckets')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw error
        setBuckets(data || [])
      } catch (error) {
        console.error('Error fetching buckets:', error)
        toast.error('Failed to load buckets')
      }
    }

    fetchBuckets()
  }, [])

  const handleDeleteNote = async () => {
    if (!deletingNote) return

    try {
      await deleteNote(deletingNote.id)
      setIsDeleteDialogOpen(false)
      setDeletingNote(null)
      toast.success('Note deleted successfully')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const handleAddToBucket = async (bucketId: string) => {
    if (!selectedNote) return

    setIsLoading(true)
    try {
      await updateNote(selectedNote.id, { bucketId })
      setIsAddToBucketOpen(false)
      setSelectedNote(null)
      toast.success('Note added to bucket successfully')
    } catch (error) {
      console.error('Error adding note to bucket:', error)
      toast.error('Failed to add note to bucket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToBucketClick = (note: NoteType) => {
    setSelectedNote(note)
    setIsAddToBucketOpen(true)
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      toast.error('Bucket name is required')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('buckets')
        .insert([{ name: newBucketName.trim() }])
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned from insert')

      setBuckets((prev) => [...prev, data])
      setIsCreateBucketOpen(false)
      setNewBucketName('')
      toast.success('Bucket created successfully')

      // Add the note to the newly created bucket
      if (selectedNote) {
        await handleAddToBucket(data.id)
      }
    } catch (error) {
      console.error('Error creating bucket:', error)
      toast.error('Failed to create bucket')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full bg-background">
      <div className="h-full p-3">
        {/* Header with filters */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Bookmarks</h1>

          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Filter className="h-4 w-4" />
                  Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search tags..." className="h-8" />
                  <div className="space-y-1 p-1">
                    {allTags.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No tags found.
                      </p>
                    ) : (
                      allTags.map((tag) => (
                        <button
                          key={tag}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setSelectedTags((prev) =>
                              prev.includes(tag)
                                ? prev.filter((t) => t !== tag)
                                : [...prev, tag],
                            )
                          }}
                        >
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                              selectedTags.includes(tag)
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-primary'
                            }`}
                          >
                            {selectedTags.includes(tag) && (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9 1L3.5 7L1 4.5" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate">{tag}</span>
                        </button>
                      ))
                    )}
                  </div>
                </Command>
              </PopoverContent>
            </Popover>

            <Select
              value={selectedSentiment}
              onValueChange={setSelectedSentiment}
            >
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="All Sentiments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="h-6 gap-1">
                {tag}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedTags(selectedTags.filter((t) => t !== tag))
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() =>
                    setSelectedTags(selectedTags.filter((t) => t !== tag))
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Projects Grid */}
        <div className="space-y-8">
          {Object.values(groupedNotes).map((project) => (
            <div key={project.projectId}>
              <h2 className="mb-4 font-medium">{project.title}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {project.notes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-lg border p-4 ${getNoteColorClass(note.sentiment)} group relative shadow-sm transition-all hover:shadow-md`}
                  >
                    <p className="text-base">{note.content}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {note.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="rounded bg-white/50 px-2 py-0.5 text-xs font-normal opacity-75"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute right-2 top-2 h-6 w-6 p-1 opacity-0 transition-opacity group-hover:opacity-100 ${note.isBookmarked ? '!opacity-100' : ''}`}
                      onClick={() => handleBookmark(note.id)}
                      disabled={bookmarkLoading === note.id}
                    >
                      {bookmarkLoading === note.id ? (
                        <div className="h-full w-full animate-spin rounded-full border-2 border-black/10 border-t-black" />
                      ) : (
                        <BookmarkIcon
                          className={`h-full w-full ${note.isBookmarked ? 'fill-current' : ''}`}
                        />
                      )}
                    </Button>
                    <div className="absolute bottom-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                          >
                            <DotsHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => {
                              handleAddToBucketClick(note)
                            }}
                          >
                            <FolderIcon className="mr-2 h-4 w-4" />
                            Add to Bucket
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeletingNote(note)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNote}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Bucket Dialog */}
      <Dialog open={isAddToBucketOpen} onOpenChange={setIsAddToBucketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Bucket</DialogTitle>
            <DialogDescription>
              Select a bucket to add this note to or create a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing buckets */}
            <div className="max-h-[240px] space-y-2 overflow-y-auto">
              {buckets.map((bucket) => (
                <Button
                  key={bucket.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddToBucket(bucket.id)}
                  disabled={isLoading}
                >
                  <FolderIcon className="mr-2 h-4 w-4" />
                  {bucket.name}
                </Button>
              ))}
              {buckets.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No buckets available
                </p>
              )}
            </div>

            {/* Create new bucket section */}
            <div className="border-t pt-4">
              <h3 className="mb-2 text-sm font-medium">Create New Bucket</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter bucket name"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    !isLoading &&
                    newBucketName.trim() &&
                    handleCreateBucket()
                  }
                />
                <Button
                  onClick={handleCreateBucket}
                  disabled={isLoading || !newBucketName.trim()}
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddToBucketOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bucket Dialog */}
      <Dialog open={isCreateBucketOpen} onOpenChange={setIsCreateBucketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bucket</DialogTitle>
            <DialogDescription>
              Enter a name for your new bucket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter bucket name"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateBucketOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBucket}
                className="bg-black text-white hover:bg-black/90"
                disabled={isLoading}
              >
                Create Bucket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
