'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SearchContextType {
  query: string
  setQuery: (query: string) => void
}

const SearchContext = createContext<SearchContextType>({
  query: '',
  setQuery: () => {},
})

export function useSearch() {
  return useContext(SearchContext)
}

interface SearchProviderProps {
  children: ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [query, setQuery] = useState('')

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  )
}
