'use client'

import { useEffect, useState } from 'react'
import { testSupabaseConnection } from '@/lib/supabase'
import { useNotes } from '@/providers/NotesProvider'

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [connectionDetails, setConnectionDetails] = useState<{
    url: string
    keyExists: boolean
  } | null>(null)
  const { projects, notes, addProject, addNote } = useNotes()

  useEffect(() => {
    async function checkConnection() {
      try {
        console.log('Checking connection...')
        const isConnected = await testSupabaseConnection()
        setConnectionStatus(isConnected ? 'success' : 'error')
        
        // Log environment variables (without exposing the actual key)
        setConnectionDetails({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
          keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        })
      } catch (error) {
        console.error('Connection error:', error)
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
        setConnectionStatus('error')
      }
    }
    checkConnection()
  }, [])

  const handleTestData = async () => {
    try {
      console.log('Starting to add test data...')
      
      // First, add a project
      const project = await addProject({
        title: 'Test Project',
        sourceText: 'This is a test project with some long text content. It should be stored in the projects table and can contain multiple notes.'
      })
      console.log('Project added:', project)

      // Then, add a note to the project
      try {
        console.log('Attempting to add note with projectId:', project.id)
        const note = await addNote({
          projectId: project.id,
          title: 'Test Note',
          content: 'This is a test note with a maximum of 280 characters. It should be stored in the notes table and linked to the project.',
          sentiment: 'neutral',
          tags: ['test', 'example'],
          textPosition: { start: 0, end: 0 },
          isBookmarked: false
        })
        console.log('Note added successfully:', note)
        setErrorMessage('Test data added successfully!')
      } catch (noteError) {
        console.error('Error adding note:', noteError)
        setErrorMessage(`Failed to add note: ${noteError instanceof Error ? noteError.message : 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding test data:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add test data')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Connection Status:</h2>
        <div className={`inline-block px-3 py-1 rounded ${
          connectionStatus === 'success' ? 'bg-green-100 text-green-800' :
          connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {connectionStatus === 'success' ? 'Connected' :
           connectionStatus === 'error' ? 'Connection Failed' :
           'Checking...'}
        </div>
        {errorMessage && (
          <div className="mt-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Connection Details:</h2>
        <div className="bg-gray-100 p-4 rounded">
          {connectionDetails ? (
            <>
              <p>SUPABASE_URL: {connectionDetails.url}</p>
              <p>SUPABASE_ANON_KEY: {connectionDetails.keyExists ? '✅ Set' : '❌ Not Set'}</p>
            </>
          ) : (
            <p>Loading connection details...</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Projects:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(projects, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Current Notes:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(notes, null, 2)}
        </pre>
      </div>

      <button
        onClick={handleTestData}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add Test Data
      </button>
    </div>
  )
} 