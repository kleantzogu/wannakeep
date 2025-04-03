'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'
import { Note, Project } from '@/types'
import { supabase } from '@/lib/supabase'

export type { Note, Project }

interface NotesContextType {
  notes: Note[]
  projects: Project[]
  setNotes: (notes: Note[]) => void
  setProjects: (projects: Project[]) => void
  addNote: (note: Note) => void
  updateNote: (note: Note) => void
  deleteNote: (id: string) => void
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>
}

const NotesContext = createContext<NotesContextType>({
  notes: [],
  projects: [],
  setNotes: () => {},
  setProjects: () => {},
  addNote: () => {},
  updateNote: () => {},
  deleteNote: () => {},
  addProject: async () => ({
    id: '',
    title: '',
    sourceText: '',
    createdAt: '',
  }),
})

export function useNotes() {
  return useContext(NotesContext)
}

interface NotesProviderProps {
  children: ReactNode
}

export function NotesProvider({ children }: NotesProviderProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          setProjects(
            data.map((project) => ({
              id: project.id,
              title: project.title,
              sourceText: project.source_text,
              createdAt: project.created_at,
            })),
          )
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    fetchProjects()
  }, [])

  const addNote = (note: Note) => {
    setNotes((prev) => [...prev, note])
  }

  const updateNote = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)),
    )
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }

  const addProject = async (
    project: Omit<Project, 'id' | 'createdAt'>,
  ): Promise<Project> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            title: project.title,
            source_text: project.sourceText,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      if (!data) throw new Error('Failed to create project')

      const newProject: Project = {
        id: data.id,
        title: data.title,
        sourceText: data.source_text,
        createdAt: data.created_at,
      }

      setProjects((prev) => [newProject, ...prev])
      return newProject
    } catch (error) {
      console.error('Error adding project:', error)
      throw error
    }
  }

  return (
    <NotesContext.Provider
      value={{
        notes,
        projects,
        setNotes,
        setProjects,
        addNote,
        updateNote,
        deleteNote,
        addProject,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}
