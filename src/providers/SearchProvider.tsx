'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Define the search context type
export interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  localQuery: string;
  setLocalQuery: (query: string) => void;
  isTyping: boolean;
}

// Create the context with default values
export const SearchContext = createContext<SearchContextType>({
  searchQuery: '',
  setSearchQuery: () => {},
  localQuery: '',
  setLocalQuery: () => {},
  isTyping: false,
});

// Hook to use the search context
export const useSearch = () => useContext(SearchContext);

interface SearchProviderProps {
  children: ReactNode;
}

// Search provider component
export function SearchProvider({ children }: SearchProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Sync with URL when path or search params change
  useEffect(() => {
    if (pathname.startsWith('/search')) {
      const query = searchParams.get('q') || '';
      setSearchQuery(query);
      setLocalQuery(query);
    } else if (pathname === '/' && !searchParams.has('q')) {
      // Clear search when navigating to home without search params
      setSearchQuery('');
      setLocalQuery('');
    }
  }, [pathname, searchParams]);

  // Handle typing state with debounce
  const handleSetLocalQuery = (query: string) => {
    setLocalQuery(query);
    setIsTyping(true);
    
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to handle when user stops typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      setSearchQuery(query.trim());
    }, 300);
    
    setTypingTimeout(timeout);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return (
    <SearchContext.Provider 
      value={{ 
        searchQuery, 
        setSearchQuery, 
        localQuery, 
        setLocalQuery: handleSetLocalQuery,
        isTyping
      }}
    >
      {children}
    </SearchContext.Provider>
  );
} 