'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateNoteTitle } from '@/lib/utils'

// Define types
export interface Project {
  id: string
  title: string
  sourceText: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  projectId: string
  title: string
  content: string
  sentiment: 'positive' | 'negative' | 'neutral'
  tags: string[]
  textPosition: {
    start: number
    end: number
  }
  createdAt: string
  updatedAt: string
  isBookmarked: boolean
  bucketId?: string | null
  exactText?: string
}

interface NotesContextType {
  projects: Project[]
  notes: Note[]
  addProject: (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<Project>
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>
  updateNote: (id: string, note: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  isLoading: boolean
  getNoteById: (id: string) => Note | undefined
}

// Create context
const NotesContext = createContext<NotesContextType | undefined>(undefined)

// Provider component
export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data on mount
  useEffect(() => {
    fetchData()

    // Subscribe to changes
    const projectsSubscription = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects((prev) => [...prev, payload.new as Project])
          } else if (payload.eventType === 'UPDATE') {
            setProjects((prev) =>
              prev.map((project) =>
                project.id === payload.new.id
                  ? (payload.new as Project)
                  : project,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setProjects((prev) =>
              prev.filter((project) => project.id !== payload.old.id),
            )
          }
        },
      )
      .subscribe()

    const notesSubscription = supabase
      .channel('notes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes((prev) => [...prev, payload.new as Note])
          } else if (payload.eventType === 'UPDATE') {
            setNotes((prev) =>
              prev.map((note) =>
                note.id === payload.new.id ? (payload.new as Note) : note,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setNotes((prev) =>
              prev.filter((note) => note.id !== payload.old.id),
            )
          }
        },
      )
      .subscribe()

    return () => {
      projectsSubscription.unsubscribe()
      notesSubscription.unsubscribe()
    }
  }, [])

  const fetchData = async () => {
    try {
      const [projectsResult, notesResult] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      if (projectsResult.error) throw projectsResult.error
      if (notesResult.error) throw notesResult.error

      // Map database fields to our Project type
      const mappedProjects = (projectsResult.data || []).map((project) => ({
        id: project.id,
        title: project.title,
        sourceText: project.source_text,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      }))

      // Map database fields to our Note type
      const mappedNotes = (notesResult.data || []).map((note) => ({
        id: note.id,
        projectId: note.project_id,
        title: note.title,
        content: note.content,
        sentiment: note.sentiment,
        tags: note.tags || [],
        textPosition: note.text_position || { start: 0, end: 0 },
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isBookmarked: note.is_bookmarked || false,
        bucketId: note.bucket_id || null,
        exactText: note.exact_text || undefined,
      }))

      setProjects(mappedProjects)
      setNotes(mappedNotes)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addProject = async (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Project> => {
    try {
      const projectData = {
        title: project.title,
        source_text: project.sourceText,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // First, check if the projects table exists
      const { error: checkError } = await supabase
        .from('projects')
        .select('count')
        .limit(1)
        .single()

      if (checkError) {
        console.error('Error checking projects table:', checkError)
        // If the table doesn't exist, create a mock project with a temporary ID
        if (checkError.code === '42P01') {
          // PostgreSQL error code for "relation does not exist"
          console.warn('Projects table does not exist, using fallback')
          const tempProject: Project = {
            id: crypto.randomUUID(),
            title: project.title,
            sourceText: project.sourceText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setProjects((prev) => [tempProject, ...prev])
          return tempProject
        }
        throw checkError
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single()

      if (error) {
        console.error('Supabase error in addProject:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }
      if (!data) throw new Error('No data returned from insert')

      const newProject: Project = {
        id: data.id,
        title: data.title,
        sourceText: data.source_text,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      setProjects((prev) => [newProject, ...prev])
      return newProject
    } catch (error) {
      console.error('Error in addProject:', error)
      // Create a fallback project with a temporary ID for development
      const tempProject: Project = {
        id: crypto.randomUUID(),
        title: project.title,
        sourceText: project.sourceText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setProjects((prev) => [tempProject, ...prev])
      return tempProject
    }
  }

  const addNote = async (
    note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Note> => {
    try {
      // Generate title from content if not provided
      const generatedTitle = generateNoteTitle(note.content)

      const noteData = {
        project_id: note.projectId,
        title: note.title || generatedTitle, // Use provided title or generated one
        content: note.content,
        sentiment: note.sentiment,
        tags: note.tags,
        text_position: note.textPosition,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_bookmarked: note.isBookmarked,
        bucket_id: note.bucketId || null,
        exact_text: note.exactText || undefined,
      }

      // Check if the notes table exists
      const { error: checkError } = await supabase
        .from('notes')
        .select('count')
        .limit(1)
        .single()

      if (checkError) {
        console.error('Error checking notes table:', checkError)
        // If the table doesn't exist, create a mock note with a temporary ID
        if (checkError.code === '42P01') {
          // PostgreSQL error code for "relation does not exist"
          console.warn('Notes table does not exist, using fallback')
          const tempNote: Note = {
            id: crypto.randomUUID(),
            projectId: note.projectId,
            title: note.title || generatedTitle,
            content: note.content,
            sentiment: note.sentiment,
            tags: note.tags || [],
            textPosition: note.textPosition || { start: 0, end: 0 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isBookmarked: note.isBookmarked || false,
            bucketId: note.bucketId || null,
            exactText: note.exactText || undefined,
          }
          setNotes((prev) => [tempNote, ...prev])
          return tempNote
        }
        throw checkError
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single()

      if (error) {
        console.error('Supabase error in addNote:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }
      if (!data) throw new Error('No data returned from insert')

      const newNote: Note = {
        id: data.id,
        projectId: data.project_id,
        title: data.title,
        content: data.content,
        sentiment: data.sentiment,
        tags: data.tags,
        textPosition: data.text_position,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isBookmarked: data.is_bookmarked,
        bucketId: data.bucket_id,
        exactText: data.exact_text,
      }

      setNotes((prev) => [newNote, ...prev])
      return newNote
    } catch (error) {
      console.error('Error in addNote:', error)
      // Create a fallback note with a temporary ID for development
      const generatedTitle = generateNoteTitle(note.content)
      const tempNote: Note = {
        id: crypto.randomUUID(),
        projectId: note.projectId,
        title: note.title || generatedTitle,
        content: note.content,
        sentiment: note.sentiment,
        tags: note.tags || [],
        textPosition: note.textPosition || { start: 0, end: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isBookmarked: note.isBookmarked || false,
        bucketId: note.bucketId || null,
        exactText: note.exactText || undefined,
      }
      setNotes((prev) => [tempNote, ...prev])
      return tempNote
    }
  }

  const updateNote = async (
    id: string,
    content: Partial<Note>,
  ): Promise<void> => {
    console.log('Updating note:', id, content)
    try {
      const noteToUpdate = notes.find((n) => n.id === id)
      if (!noteToUpdate) {
        console.error('Note not found:', id)
        throw new Error('Note not found')
      }

      const updatedNote = {
        ...noteToUpdate,
        ...content,
        updated_at: new Date().toISOString(),
      }

      console.log('Preparing note data for update:', updatedNote)

      const { data, error } = await supabase
        .from('notes')
        .update({
          project_id: updatedNote.projectId,
          title: updatedNote.title,
          content: updatedNote.content,
          sentiment: updatedNote.sentiment,
          tags: updatedNote.tags,
          text_position: updatedNote.textPosition,
          is_bookmarked: updatedNote.isBookmarked,
          bucket_id: updatedNote.bucketId,
          exact_text: updatedNote.exactText,
          updated_at: updatedNote.updated_at,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating note:', error)
        throw error
      }

      console.log('Successfully updated note:', data)

      const updatedNoteWithId = {
        ...updatedNote,
        id: data.id,
        bucketId: data.bucket_id,
        projectId: data.project_id,
        textPosition: data.text_position,
        isBookmarked: data.is_bookmarked,
        exactText: data.exact_text,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      console.log('Updated note with ID:', updatedNoteWithId)

      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? updatedNoteWithId : note)),
      )
    } catch (error) {
      console.error('Error in updateNote:', error)
      throw error
    }
  }

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id)

      if (error) throw error

      setNotes((prev) => prev.filter((note) => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  }

  const getNoteById = (id: string): Note | undefined => {
    return notes.find((note) => note.id === id)
  }

  return (
    <NotesContext.Provider
      value={{
        projects,
        notes,
        addProject,
        addNote,
        updateNote,
        deleteNote,
        isLoading,
        getNoteById,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

// Custom hook for using the notes context
export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}

// Export types
export type { NotesContextType }
