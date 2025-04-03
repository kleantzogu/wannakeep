'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useNotes } from '@/providers/NotesProvider'
import { useSearch } from '@/providers/SearchProvider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookmarkIcon } from 'lucide-react'

interface SearchResult {
  type: 'note' | 'project' | 'tag'
  id: string
  title: string
  content?: string
  projectId?: string
  projectTitle?: string
  tags?: string[]
  sentiment?: string
  isBookmarked?: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const { notes, projects, updateNote } = useNotes()
  const { query, setQuery } = useSearch()
  const [results, setResults] = useState<SearchResult[]>([])
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null)

  // Initialize search query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    setQuery(urlQuery)
  }, [searchParams, setQuery])

  // Perform search when query changes
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const normalizedQuery = query.toLowerCase().trim()
    const searchResults: SearchResult[] = []

    // Search notes
    notes.forEach((note) => {
      if (
        note.content.toLowerCase().includes(normalizedQuery) ||
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      ) {
        const project = projects.find((p) => p.id === note.projectId)
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
        })
      }
    })

    // Search projects
    projects.forEach((project) => {
      if (project.title.toLowerCase().includes(normalizedQuery)) {
        searchResults.push({
          type: 'project',
          id: project.id,
          title: project.title,
          content:
            project.sourceText.substring(0, 150) +
            (project.sourceText.length > 150 ? '...' : ''),
        })
      }
    })

    setResults(searchResults)
  }, [query, notes, projects])

  const handleBookmark = async (noteId: string) => {
    setBookmarkLoading(noteId)
    try {
      const note = notes.find((n) => n.id === noteId)
      if (!note) return
      await updateNote(noteId, { isBookmarked: !note.isBookmarked })
      setResults((prev) =>
        prev.map((result) =>
          result.type === 'note' && result.id === noteId
            ? { ...result, isBookmarked: !result.isBookmarked }
            : result,
        ),
      )
    } catch (error) {
      console.error('Error updating bookmark:', error)
    } finally {
      setBookmarkLoading(null)
    }
  }

  return (
    <div className="h-full bg-background p-6">
      {query && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {results.length > 0
                ? `Found ${results.length} results for "${query}"`
                : `No results found for "${query}"`}
            </h2>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="rounded-lg border bg-card p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{result.title}</h3>
                      {result.content && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {result.content}
                        </p>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {result.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {result.type === 'note' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBookmark(result.id)}
                        disabled={bookmarkLoading === result.id}
                      >
                        {bookmarkLoading === result.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black" />
                        ) : (
                          <BookmarkIcon
                            className={`h-4 w-4 ${result.isBookmarked ? 'fill-current' : ''}`}
                          />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-6 py-10 text-center">
              <p className="text-muted-foreground">
                Try adjusting your search terms or browsing all notes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
