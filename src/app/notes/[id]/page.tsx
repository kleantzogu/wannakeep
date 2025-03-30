'use client'

import { useNotes } from '@/providers/NotesProvider'
import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import NoteEditor from '@/components/NoteEditor'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotePage() {
  const { id } = useParams()
  const { getNoteById, updateNote, deleteNote } = useNotes()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  
  const noteId = Array.isArray(id) ? id[0] : id
  const note = getNoteById(noteId)
  
  if (!note) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Note Not Found</h2>
        <p className="mb-6">The note you're looking for doesn't exist or has been deleted.</p>
        <Link href="/notes">
          <Button>Go Back to Notes</Button>
        </Link>
      </div>
    )
  }
  
  const handleUpdateNote = (updatedNote: any) => {
    updateNote(noteId, {
      title: updatedNote.title,
      content: updatedNote.content,
      sentiment: updatedNote.sentiment,
      tags: updatedNote.tags,
    })
    setIsEditing(false)
  }
  
  const handleDeleteNote = () => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(noteId)
      router.push('/notes')
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
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Note' : note.title}</h1>
        <div className="flex gap-2">
          {isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDeleteNote}>
                Delete
              </Button>
              <Link href="/notes">
                <Button variant="secondary">Back to Notes</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <NoteEditor 
          initialTitle={note.title}
          initialContent={note.content}
          initialTags={note.tags}
          onSave={handleUpdateNote}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-md p-6">
            <h2 className="text-xl font-semibold mb-4">Note Content</h2>
            <p className="whitespace-pre-wrap mb-6">{note.content}</p>
            
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-sm font-medium">Tags:</span>
                {note.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(note.updatedAt).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="border rounded-md p-6">
            <h2 className="text-xl font-semibold mb-4">Note Preview</h2>
            <div className={`p-4 rounded-md border ${getNoteColorClass(note.sentiment)}`}>
              <h3 className="font-medium mb-2">{note.title}</h3>
              <p className="text-sm mb-2 line-clamp-4">{note.content}</p>
              <p className="text-xs capitalize mt-4">Sentiment: {note.sentiment}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 