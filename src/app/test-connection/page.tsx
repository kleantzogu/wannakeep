'use client'

import { useEffect, useState } from 'react'
import { supabase, testBucketAccess } from '@/lib/supabase'

export default function TestConnection() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [error, setError] = useState<string>('')
  const [envVars, setEnvVars] = useState<{
    url: string
    keyExists: boolean
  } | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        // Check environment variables
        setEnvVars({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
          keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        })

        // Test bucket access
        const canAccessBuckets = await testBucketAccess()
        setStatus(canAccessBuckets ? 'success' : 'error')
      } catch (error) {
        console.error('Connection error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        setStatus('error')
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Connection Status:</h2>
        <div className={`inline-block px-3 py-1 rounded ${
          status === 'success' ? 'bg-green-100 text-green-800' :
          status === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status === 'success' ? 'Connected' :
           status === 'error' ? 'Connection Failed' :
           'Checking...'}
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
        <div className="bg-gray-100 p-4 rounded">
          {envVars ? (
            <>
              <p>NEXT_PUBLIC_SUPABASE_URL: {envVars.url}</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.keyExists ? '✅ Set' : '❌ Not Set'}</p>
            </>
          ) : (
            <p>Loading environment variables...</p>
          )}
        </div>
      </div>
    </div>
  )
} 