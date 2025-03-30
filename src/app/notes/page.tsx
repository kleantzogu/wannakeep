'use client'

import { Button } from '@/components/ui/button'
import { useNotes, Note, Project as ProjectType } from '@/providers/NotesProvider'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { FileText, ChevronRight, ChevronLeft, BookmarkIcon, FolderIcon, Plus } from 'lucide-react'
import { DotsHorizontalIcon, TrashIcon } from '@radix-ui/react-icons'
import { generateNoteTitle } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Input } from '@/components/ui/input'

interface Bucket {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface Project extends Omit<ProjectType, 'createdAt'> {
  notes: Note[]
  displayTitle: string
  createdAt: Date
}

// Add highlight styles
const highlightStyles = `
  .highlight {
    background-color: #fef08a !important; /* Tailwind yellow-200 */
    color: inherit;
  }
`

export default function NotesPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { notes, projects, updateNote, deleteNote } = useNotes()
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)
  const [isAddToBucketOpen, setIsAddToBucketOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')

  // Helper function to generate a project title based on its content
  const generateProjectTitle = (project: ProjectType) => {
    // If there are notes, use their content to generate a title
    const projectNotes = notes.filter(note => note.projectId === project.id && !note.bucketId)
    if (projectNotes.length > 0) {
      const allContent = projectNotes.map(note => note.content).join(' ')
      return generateNoteTitle(allContent)
    }
    // If no notes but has source text, generate from source text
    if (project.sourceText) {
      return generateNoteTitle(project.sourceText)
    }
    // Fallback to original title or default
    return project.title || 'Untitled Project'
  }

  // Group notes by their project
  const projectsWithNotes = useMemo(() => {
    // Create a map of projects with their notes
    return projects.map(project => {
      // Filter out notes that belong to buckets
      const projectNotes = notes.filter(note => 
        note.projectId === project.id && !note.bucketId
      )
      const enrichedProject: Project = {
        ...project,
        notes: projectNotes,
        createdAt: new Date(project.createdAt),
        displayTitle: generateProjectTitle(project) // Use the generated title instead of the original
      }
      return enrichedProject
    }).filter(project => project.notes.length > 0) // Only show projects that have notes
  }, [projects, notes])

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    return projectsWithNotes.filter(project => 
      project.displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.sourceText.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projectsWithNotes, searchQuery])

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

  const handleNoteClick = (note: Note) => {
    const textarea = document.getElementById('source-text')
    if (textarea && selectedProject) {
      // Only proceed if the note belongs to the currently selected project
      if (note.projectId !== selectedProject.id) {
        console.warn('Note does not belong to the currently selected project')
        return
      }
      
      // Reset scroll position
      textarea.scrollTop = 0
      
      // Find complete sentence boundaries
      const text = selectedProject.sourceText || ''
      
      // Get the correct position from the note
      const start = note.textPosition.start
      const end = note.textPosition.end
      
      // If the positions are both 0, which means there's no specific text position,
      // we'll just highlight the entire note content in the source
      let effectiveStart = start
      let effectiveEnd = end
      
      if (start === 0 && end === 0) {
        // Try to find the note content in the source text
        const contentPos = text.indexOf(note.content)
        if (contentPos !== -1) {
          effectiveStart = contentPos
          effectiveEnd = contentPos + note.content.length
        }
      }
      
      const boundaries = findSentenceBoundaries(text, effectiveStart, effectiveEnd)
      const boundaryStart = boundaries.start
      const boundaryEnd = boundaries.end
      
      // Create a temporary div to measure the exact height
      const tempDiv = document.createElement('div')
      tempDiv.style.width = `${textarea.clientWidth - 48}px` // Account for padding
      tempDiv.style.font = window.getComputedStyle(textarea).font
      tempDiv.style.lineHeight = '1.5' // Match textarea line height
      tempDiv.style.whiteSpace = 'pre-wrap'
      tempDiv.textContent = text.substring(0, boundaryStart)
      document.body.appendChild(tempDiv)
      
      // Get the exact height up to the selection start
      const heightUpToSelection = tempDiv.offsetHeight
      
      // Calculate the height of the selected text
      tempDiv.textContent = text.substring(boundaryStart, boundaryEnd)
      const selectionHeight = tempDiv.offsetHeight
      
      // Clean up
      document.body.removeChild(tempDiv)
      
      // Calculate the scroll position to center the selection
      const viewportHeight = textarea.clientHeight
      const scrollPosition = Math.max(0, heightUpToSelection - (viewportHeight / 2) + (selectionHeight / 2))
      
      // Smooth scroll to position
      textarea.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })

      // Remove any existing highlights
      const existingHighlights = textarea.getElementsByClassName('highlight')
      while (existingHighlights.length > 0) {
        const highlight = existingHighlights[0]
        const parent = highlight.parentNode
        if (parent) {
          parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight)
        }
      }

      // Create a new text node with the content
      const content = textarea.textContent || ''
      const beforeText = content.substring(0, boundaryStart)
      const selectedText = content.substring(boundaryStart, boundaryEnd)
      const afterText = content.substring(boundaryEnd)

      // Clear the textarea
      textarea.textContent = ''

      // Add the text nodes back with highlighting
      if (beforeText) {
        textarea.appendChild(document.createTextNode(beforeText))
      }
      
      const highlightSpan = document.createElement('span')
      highlightSpan.className = 'highlight'
      highlightSpan.textContent = selectedText
      textarea.appendChild(highlightSpan)
      
      if (afterText) {
        textarea.appendChild(document.createTextNode(afterText))
      }
    }
  }

  // Helper function to find sentence boundaries
  const findSentenceBoundaries = (text: string, start: number, end: number) => {
    // Look backwards for sentence start (period + space or start of text)
    let sentenceStart = start
    while (sentenceStart > 0) {
      // Check for sentence boundaries (., !, ?) followed by space or newline
      if ((text[sentenceStart - 1] === '.' || text[sentenceStart - 1] === '!' || text[sentenceStart - 1] === '?') &&
          (text[sentenceStart] === ' ' || text[sentenceStart] === '\n')) {
        break
      }
      sentenceStart--
    }

    // Look forward for sentence end (period, exclamation, question mark)
    let sentenceEnd = end
    while (sentenceEnd < text.length) {
      if (text[sentenceEnd] === '.' || text[sentenceEnd] === '!' || text[sentenceEnd] === '?') {
        sentenceEnd++
        break
      }
      sentenceEnd++
    }

    return { start: sentenceStart, end: sentenceEnd }
  }

  const handleBookmark = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent note selection when clicking bookmark
    setBookmarkLoading(noteId)
    setError(null)
    
    try {
    const note = notes.find(n => n.id === noteId)
    if (note) {
        await updateNote(noteId, { isBookmarked: !note.isBookmarked })
      }
    } catch (error) {
      console.error('Error updating bookmark:', error)
      setError('Failed to update bookmark')
    } finally {
      setBookmarkLoading(null)
    }
  }

  // Fetch buckets on mount
  useEffect(() => {
    let channel: any;

    async function initializeBuckets() {
      try {
        // First fetch existing buckets
        const { data, error } = await supabase
          .from('buckets')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw error
        setBuckets(data || [])

        // Set up real-time subscription
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
        toast.error('Failed to load buckets')
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

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      toast.error('Bucket name is required')
      return
    }

    setIsLoading(true)
    try {
      // Create the bucket
      const { data: bucket, error: bucketError } = await supabase
        .from('buckets')
        .insert([{ 
          name: newBucketName.trim(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (bucketError) {
        console.error('Error creating bucket:', bucketError)
        throw bucketError
      }
      if (!bucket) {
        throw new Error('No data returned from bucket creation')
      }

      console.log('Bucket created successfully:', bucket)

      // Add the note to the newly created bucket
      if (selectedNote) {
        try {
          console.log('Adding note to bucket:', { noteId: selectedNote.id, bucketId: bucket.id })
          await updateNote(selectedNote.id, { bucketId: bucket.id })
          setIsAddToBucketOpen(false)
          setSelectedNote(null)
          toast.success('Note added to bucket successfully')
        } catch (error) {
          console.error('Error adding note to bucket:', error)
          toast.error('Failed to add note to bucket')
        }
      }

      // Close the create bucket dialog and reset state
      setIsCreateBucketOpen(false)
      setNewBucketName('')
      toast.success('Bucket created successfully')

      // Force a refresh of the buckets list
      const { data: refreshedBuckets, error: refreshError } = await supabase
        .from('buckets')
        .select('*')
        .order('created_at', { ascending: true })

      if (refreshError) {
        console.error('Error refreshing buckets:', refreshError)
        throw refreshError
      }

      setBuckets(refreshedBuckets || [])
    } catch (error) {
      console.error('Error creating bucket:', error)
      toast.error('Failed to create bucket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToBucketClick = (note: Note) => {
    setSelectedNote(note)
    setIsAddToBucketOpen(true)
  }

  return (
    <div className="flex h-screen bg-background">
      <style>{highlightStyles}</style>
      {/* Projects List */}
      <div className="h-screen bg-white border-r border-zinc-200 w-72 flex flex-col shrink-0">
        <div className="p-3 border-b border-zinc-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FileText className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid gap-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`rounded-lg border ${selectedProject?.id === project.id ? 'border-black' : 'border-zinc-200'} p-3 hover:border-zinc-400 transition-colors cursor-pointer`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-zinc-100 text-zinc-600 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="font-medium text-[14px] line-clamp-1">{project.displayTitle}</h2>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {project.notes.length} notes • {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex bg-zinc-50 min-w-0 justify-center h-screen">
        {selectedProject ? (
          <>
            {/* Source Text */}
            <div className="w-[400px] border-r border-zinc-200 flex flex-col bg-white min-w-0 h-screen">
              <div className="p-3 border-b border-zinc-200 flex-shrink-0">
                <h2 className="font-medium text-sm line-clamp-1">{selectedProject.displayTitle}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div 
                  id="source-text"
                  className="prose prose-zinc prose-sm max-w-none"
                >
                  {selectedProject.sourceText}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="w-[600px] flex flex-col bg-white min-w-0 h-screen">
              <div className="p-3 border-b border-zinc-200 flex-shrink-0">
                <h2 className="font-medium text-sm">Generated Notes</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {selectedProject.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border ${getNoteColorClass(note.sentiment)} shadow-sm hover:shadow-md transition-all cursor-pointer group relative`}
                      onClick={() => handleNoteClick(note)}
                    >
                      <p className="text-base">{note.content}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map((tag, tagIndex) => (
                          <span 
                            key={tagIndex}
                            className="bg-white/50 px-1.5 py-0.5 rounded text-[10px] font-normal opacity-75"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute right-2 top-2 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity ${note.isBookmarked ? '!opacity-100' : ''}`}
                        onClick={(e) => handleBookmark(note.id, e)}
                        disabled={bookmarkLoading === note.id}
                      >
                        {bookmarkLoading === note.id ? (
                          <div className="h-full w-full animate-spin rounded-full border-2 border-black/10 border-t-black" />
                        ) : (
                          <BookmarkIcon className={`h-full w-full ${note.isBookmarked ? 'fill-current' : ''}`} />
                        )}
                      </Button>
                      <div className="absolute bottom-2 right-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DotsHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToBucketClick(note)
                              }}
                            >
                              <FolderIcon className="mr-2 h-4 w-4" />
                              Add to Bucket
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a project to view its notes
          </div>
        )}
      </div>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {buckets.map(bucket => (
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
                <p className="text-sm text-muted-foreground">No buckets available</p>
              )}
            </div>
            
            {/* Create new bucket section */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Create New Bucket</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter bucket name"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && newBucketName.trim() && handleCreateBucket()}
                />
                <Button 
                  onClick={handleCreateBucket}
                  disabled={isLoading || !newBucketName.trim()}
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToBucketOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bucket Dialog */}
      <Dialog open={isCreateBucketOpen} onOpenChange={setIsCreateBucketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bucket</DialogTitle>
            <DialogDescription>
              Enter a name for the new bucket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Bucket Name"
              className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBucketOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBucket}
              className="bg-black text-white hover:bg-black/90"
              disabled={isLoading}
            >
              Create Bucket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 