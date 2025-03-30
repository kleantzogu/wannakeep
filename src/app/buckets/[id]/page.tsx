'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useNotes } from '@/providers/NotesProvider'
import { Plus, TrashIcon, FolderIcon, X, BookmarkIcon } from 'lucide-react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Bucket {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default function BucketPage() {
  const { id } = useParams()
  const { notes, addNote, updateNote, deleteNote, addProject, projects } = useNotes()
  const [bucket, setBucket] = useState<Bucket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    content: '',
    sentiment: 'neutral' as const,
    tags: [] as string[],
    newTag: '' // For tag input
  })
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null)

  // Ensure default project exists
  useEffect(() => {
    async function ensureDefaultProject() {
      try {
        // Check if we have any project with title 'Bucket Notes'
        const bucketProject = projects.find(p => p.title === 'Bucket Notes')
        if (!bucketProject) {
          console.log('Creating default project for bucket notes...')
          await addProject({
            title: 'Bucket Notes',
            sourceText: 'Default project for storing notes in buckets'
          })
        }
      } catch (error) {
        console.error('Error ensuring default project exists:', error)
      }
    }
    ensureDefaultProject()
  }, [projects, addProject])

  // Fetch bucket details
  useEffect(() => {
    const fetchBucket = async () => {
      try {
        console.log('Fetching bucket with ID:', id)
        const response = await fetch(`/api/buckets/${id}`)
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Failed to fetch bucket:', errorData)
          throw new Error(errorData.error || 'Failed to fetch bucket')
        }
        const data = await response.json()
        console.log('Fetched bucket data:', data)
        setBucket(data)
      } catch (error) {
        console.error('Error fetching bucket:', error)
        toast.error('Failed to load bucket')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchBucket()
    }
  }, [id])

  // Filter notes for this bucket
  const bucketNotes = notes.filter(note => note.bucketId === id)
  console.log('Filtered notes for bucket:', { bucketId: id, notes: bucketNotes })

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['great', 'good', 'excellent', 'awesome', 'happy', 'love', 'success', 'best']
    const negativeWords = ['bad', 'issue', 'problem', 'difficult', 'sad', 'hate', 'fail', 'worst']
    
    const lowerText = text.toLowerCase()
    let positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    let negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) {
      toast.error('Note content is required')
      return
    }

    try {
      // Find the Bucket Notes project
      const bucketProject = projects.find(p => p.title === 'Bucket Notes')
      if (!bucketProject) {
        throw new Error('Bucket Notes project not found')
      }

      const sentiment = analyzeSentiment(newNote.content)
      console.log('Creating note with data:', {
        content: newNote.content,
        sentiment,
        tags: newNote.tags,
        bucketId: id,
        projectId: bucketProject.id
      })
      
      await addNote({
        title: '', // Empty string for title
        content: newNote.content.trim(),
        sentiment,
        tags: newNote.tags,
        bucketId: id as string,
        projectId: bucketProject.id,
        textPosition: { start: 0, end: 0 },
        isBookmarked: false
      })

      setNewNote({
        content: '',
        sentiment: 'neutral',
        tags: [],
        newTag: ''
      })
      setIsCreateDialogOpen(false)
      toast.success('Note created successfully')
    } catch (error) {
      console.error('Error creating note:', error)
      toast.error('Failed to create note: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleAddTag = () => {
    if (newNote.newTag.trim() && !newNote.tags.includes(newNote.newTag.trim())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }))
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
      toast.success('Note deleted successfully')
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const handleBookmark = async (noteId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (bookmarkLoading === noteId) return
    setBookmarkLoading(noteId)
    try {
      await updateNote(noteId, { isBookmarked: !notes.find(n => n.id === noteId)?.isBookmarked })
      toast.success('Bookmark status updated successfully')
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast.error('Failed to update bookmark')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading bucket...</div>
      </div>
    )
  }

  if (!bucket) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Bucket not found</div>
      </div>
    )
  }

  return (
    <div className="pl-[240px] min-h-screen bg-background">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{bucket.name}</h1>
            <p className="text-muted-foreground">
              {bucketNotes.length} {bucketNotes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 bg-black text-white hover:bg-black/90"
          >
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        {/* Create Note Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Textarea
                  placeholder="Write your note here... (max 280 characters)"
                  value={newNote.content}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 280) {
                      setNewNote(prev => ({ ...prev, content: value }))
                    }
                  }}
                  className="min-h-[200px]"
                  maxLength={280}
                />
                <div className="text-sm text-muted-foreground text-right">
                  {newNote.content.length}/280 characters
                </div>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Type tags separated by commas"
                  value={newNote.newTag}
                  onChange={(e) => setNewNote(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === ',' || e.key === 'Enter') {
                      e.preventDefault()
                      const tag = newNote.newTag.trim()
                      if (tag && !newNote.tags.includes(tag)) {
                        setNewNote(prev => ({
                          ...prev,
                          tags: [...prev.tags, tag],
                          newTag: ''
                        }))
                      }
                    }
                  }}
                  onBlur={() => {
                    const tag = newNote.newTag.trim()
                    if (tag && !newNote.tags.includes(tag)) {
                      setNewNote(prev => ({
                        ...prev,
                        tags: [...prev.tags, tag],
                        newTag: ''
                      }))
                    }
                  }}
                />
                {newNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {newNote.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-secondary px-2 py-1 rounded-md text-sm font-normal flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateNote} 
                  className="bg-black text-white hover:bg-black/90"
                >
                  Create Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-6 gap-4">
          {bucketNotes.map((note) => (
            <div
              key={note.id}
              className={`note-card p-4 rounded-lg border ${getNoteColorClass(note.sentiment)} shadow-sm hover:shadow-md transition-all group hover:scale-[1.01] relative col-span-2`}
            >
              <div className="absolute bottom-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                    >
                      <DotsHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-3">
                <p className="text-lg leading-relaxed pr-8">{note.content}</p>
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="bg-white/50 px-2 py-0.5 rounded-md text-xs font-normal opacity-75"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
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
            </div>
          ))}
        </div>

        {bucketNotes.length === 0 && !isCreateDialogOpen && (
          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
            <FolderIcon className="w-12 h-12 mb-4" />
            <p className="text-lg">No notes in this bucket yet</p>
            <p className="text-sm">Click "New Note" to create one</p>
          </div>
        )}
      </div>
    </div>
  )
} 