'use client'

import React, { useState, useEffect, Suspense } from 'react'

// Loading component for Suspense
function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center min-h-[200px]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  )
}

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component that properly handles client-side rendering by:
 * 1. Not rendering anything on the server
 * 2. Rendering a fallback during hydration
 * 3. Rendering children after hydration
 * 
 * This solves issues with useSearchParams() and other client-only hooks
 */
export default function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // Return fallback or nothing during SSR/initial render
    return fallback ? <>{fallback}</> : null
  }

  // Wrap in Suspense to handle useSearchParams and other hooks
  return <Suspense fallback={fallback || <Loading />}>{children}</Suspense>
} 