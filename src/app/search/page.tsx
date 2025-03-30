'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useNotes, Note, Project } from '@/providers/NotesProvider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BookmarkIcon, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DotsHorizontalIcon, BookmarkFilledIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useSearch } from '@/providers/SearchProvider'

interface SearchResult {
  type: 'note' | 'project' | 'tag'
  id: string
  title: string
  content?: string
  projectId?: string
  projectTitle?: string
  tags?: string[]
  tag?: string
  tagCount?: number
  sentiment?: string
  isBookmarked?: boolean
  bucketId?: string | null
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { notes, projects, updateNote } = useNotes()
  const { searchQuery, setLocalQuery } = useSearch()
  const [results, setResults] = useState<SearchResult[]>([])
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null)
  
  // Synchronize URL query parameter with search context on initial page load
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    
    // Update the local query in the search provider (which will trigger search)
    if (urlQuery && urlQuery !== searchQuery) {
      setLocalQuery(urlQuery);
    }
  }, [searchParams]);
  
  // Perform search when searchQuery in context changes
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery)
    } else {
      setResults([])
      setSearchPerformed(false)
    }
  }, [searchQuery, notes, projects])
  
  // Search through notes, projects, and tags
  const performSearch = (searchQuery: string) => {
    const normalizedQuery = searchQuery.toLowerCase().trim()
    
    if (!normalizedQuery) {
      setResults([])
      setSearchPerformed(false)
      return
    }
    
    setSearchPerformed(true)
    
    // Search results array
    const searchResults: SearchResult[] = []
    
    // Find matching notes
    const matchingNotes = notes.filter(note => 
      note.content.toLowerCase().includes(normalizedQuery) ||
      note.title.toLowerCase().includes(normalizedQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
    )
    
    matchingNotes.forEach(note => {
      // Find the project for this note
      const project = projects.find(p => p.id === note.projectId)
      
      searchResults.push({
        type: 'note',
        id: note.id,
        title: note.title,
        content: note.content,
        projectId: note.projectId,
        projectTitle: project?.title || 'Unknown Project',
        tags: note.tags,
        sentiment: note.sentiment,
        isBookmarked: note.isBookmarked,
        bucketId: note.bucketId
      })
    })
    
    // Find matching projects
    const matchingProjects = projects.filter(project =>
      project.title.toLowerCase().includes(normalizedQuery)
    )
    
    matchingProjects.forEach(project => {
      // Only add if not already added as part of a note
      if (!searchResults.some(result => result.type === 'project' && result.id === project.id)) {
        searchResults.push({
          type: 'project',
          id: project.id,
          title: project.title,
          content: project.sourceText.substring(0, 150) + (project.sourceText.length > 150 ? '...' : '')
        })
      }
    })
    
    // Find matching tags and count their occurrences
    const allTags = notes.flatMap(note => note.tags)
    const tagCounts = allTags.reduce((acc, tag) => {
      const lowerTag = tag.toLowerCase()
      if (lowerTag.includes(normalizedQuery)) {
        acc[tag] = (acc[tag] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    // Add tags to search results
    Object.entries(tagCounts).forEach(([tag, count]) => {
      searchResults.push({
        type: 'tag',
        id: `tag-${tag}`,
        title: tag,
        tag: tag,
        tagCount: count
      })
    })
    
    setResults(searchResults)
  }
  
  // Highlight matching text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 rounded-sm px-0.5">{part}</mark>
        : part
    )
  }
  
  // Get appropriate link for search result
  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'note':
        return result.bucketId 
          ? `/buckets/${result.bucketId}?note=${result.id}`
          : `/notes?project=${result.projectId}&note=${result.id}`
      case 'project':
        return `/notes?project=${result.id}`
      case 'tag':
        return `/bookmarks?tag=${encodeURIComponent(result.title)}`
      default:
        return '#'
    }
  }
  
  // Handle toggling bookmark status
  const handleBookmark = async (noteId: string) => {
    setBookmarkLoading(noteId)
    
    try {
      // Find the note
      const note = notes.find(n => n.id === noteId)
      if (!note) return
      
      // Toggle bookmark status
      await updateNote(noteId, { isBookmarked: !note.isBookmarked })
      
      // Update local results state for immediate UI feedback
      setResults(prev => 
        prev.map(result => 
          result.type === 'note' && result.id === noteId
            ? { ...result, isBookmarked: !result.isBookmarked }
            : result
        )
      )
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
  
  // Group results by type and project for better organization
  const groupedResults = useMemo(() => {
    const grouped: Record<string, SearchResult[]> = {
      notes: [],
      projects: [],
      tags: []
    }
    
    results.forEach(result => {
      if (result.type === 'note') {
        grouped.notes.push(result)
      } else if (result.type === 'project') {
        grouped.projects.push(result)
      } else if (result.type === 'tag') {
        grouped.tags.push(result)
      }
    })
    
    // Group notes by project
    const notesByProject: Record<string, { projectId: string, projectTitle: string, notes: SearchResult[] }> = {}
    
    grouped.notes.forEach(note => {
      const projectId = note.projectId || 'unknown'
      if (!notesByProject[projectId]) {
        notesByProject[projectId] = {
          projectId,
          projectTitle: note.projectTitle || 'Unknown Project',
          notes: []
        }
      }
      notesByProject[projectId].notes.push(note)
    })
    
    return {
      notesByProject,
      projects: grouped.projects,
      tags: grouped.tags
    }
  }, [results])
  
  return (
    <div className="h-full p-6 bg-background">
      {searchPerformed && (
        <div className="space-y-6">
          {/* Search stats */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {results.length > 0
                ? `Found ${results.length} results for "${searchQuery}"`
                : `No results found for "${searchQuery}"`
              }
            </h2>
          </div>
          
          {results.length > 0 ? (
            <div className="space-y-10">
              {/* Notes Section */}
              {Object.values(groupedResults.notesByProject).length > 0 && (
                <div className="space-y-8">
                  {Object.values(groupedResults.notesByProject).map((group) => (
                    <div key={group.projectId}>
                      <h2 className="font-medium mb-4">{group.projectTitle}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.notes.map((note) => (
                          <Link 
                            key={note.id}
                            href={getResultLink(note)}
                            className={`p-4 rounded-lg border ${getNoteColorClass(note.sentiment || 'neutral')} shadow-sm hover:shadow-md transition-all group relative`}
                          >
                            <div className="min-h-[100px]">
                              <p className="text-base mb-3">{highlightMatch(note.content || '', searchQuery || '')}</p>
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {note.tags && note.tags.map((tag, tagIndex) => (
                                  <span 
                                    key={tagIndex}
                                    className="bg-white/50 px-2 py-0.5 rounded text-xs font-normal opacity-75"
                                  >
                                    {highlightMatch(tag, searchQuery || '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`absolute right-2 top-2 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity ${note.isBookmarked ? '!opacity-100' : ''}`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleBookmark(note.id)
                              }}
                              disabled={bookmarkLoading === note.id}
                            >
                              {bookmarkLoading === note.id ? (
                                <div className="h-full w-full animate-spin rounded-full border-2 border-black/10 border-t-black" />
                              ) : (
                                <BookmarkIcon className={`h-full w-full ${note.isBookmarked ? 'fill-current' : ''}`} />
                              )}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Projects Section */}
              {groupedResults.projects.length > 0 && (
                <div>
                  <h2 className="font-medium mb-4">Projects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedResults.projects.map((project) => (
                      <Link 
                        key={project.id}
                        href={getResultLink(project)}
                        className="p-4 rounded-lg border bg-green-50 border-green-200 text-green-800 shadow-sm hover:shadow-md transition-all"
                      >
                        <h3 className="text-base font-medium truncate">
                          {highlightMatch(project.title, searchQuery || '')}
                        </h3>
                        <p className="text-sm mt-2 line-clamp-3">{highlightMatch(project.content || '', searchQuery || '')}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags Section */}
              {groupedResults.tags.length > 0 && (
                <div>
                  <h2 className="font-medium mb-4">Tags</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedResults.tags.map((tag) => (
                      <Link 
                        key={tag.id}
                        href={getResultLink(tag)}
                        className="p-4 rounded-lg border bg-purple-50 border-purple-200 text-purple-800 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">#</span>
                        </div>
                        <div>
                          <h3 className="text-base font-medium">
                            {highlightMatch(tag.title, searchQuery || '')}
                          </h3>
                          <p className="text-sm mt-1">{tag.tagCount} notes</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 bg-card p-6 rounded-lg border border-border">
              <p className="text-muted-foreground">Try adjusting your search terms or browsing all notes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 