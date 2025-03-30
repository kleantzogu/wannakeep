'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Upload, Clipboard, Bookmark, FolderIcon, TrashIcon, Plus, Link } from 'lucide-react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useNotes, Note } from '@/providers/NotesProvider'
import { useSettings } from '@/lib/store/settings'
import { generateNoteTitle } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import AnimatedGenerateButton from '@/components/AnimatedGenerateButton'

interface Bucket {
  id: string
  name: string
  created_at: string
  updated_at: string
}

// Add global styles for text selection
const textSelectionStyles = `
  .custom-textarea::selection {
    background-color: #fef08a !important; /* Tailwind yellow-200 */
    color: inherit;
  }
  .custom-textarea::-moz-selection {
    background-color: #fef08a !important; /* Tailwind yellow-200 */
    color: inherit;
  }
  
  @keyframes highlight-pulse {
    0%, 100% { background-color: #fef08a; box-shadow: 0 0 0 2px #fef08a; }
    50% { background-color: #fde047; box-shadow: 0 0 0 2px #fde047; }
  }
  
  .custom-highlight {
    background-color: #fef08a !important; /* Tailwind yellow-200 */
    display: inline;
    padding: 2px 0;
    box-shadow: 0 0 0 2px #fef08a;
    border-radius: 2px;
    position: relative;
    color: #1e293b; /* Dark text for better contrast */
    font-weight: 500;
    animation: highlight-pulse 2s ease-in-out infinite;
  }
  
  .source-text-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto !important;
    white-space: pre-wrap;
    word-wrap: break-word;
    padding: 1.5rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #374151;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-height: 100%;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    cursor: text;
    user-select: text;
  }

  .source-text-container::-webkit-scrollbar {
    width: 12px;
  }

  .source-text-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
  }

  .source-text-container::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }

  .source-text-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
    border: 3px solid transparent;
    background-clip: padding-box;
  }
`

// Add animation styles
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .note-card {
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
  }
  
  .note-card-appear {
    animation-play-state: running;
  }
  
  @keyframes shimmer {
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  }
  
  .note-card-placeholder {
    background: #f6f7f8;
    background: linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%);
    background-size: 800px 104px;
    animation: shimmer 1.5s infinite linear;
    border-radius: 0.5rem;
    min-height: 180px;
  }
  
  .text-map {
    position: relative;
    height: 6px;
    background: rgba(0,0,0,0.1);
    border-radius: 3px;
    overflow: hidden;
    width: 100%;
    margin: 24px 0;
  }
  
  .text-map-indicator {
    position: absolute;
    height: 100%;
    background: #000;
    transition: all 0.3s ease;
    border-radius: 3px;
  }
  
  .text-map-note {
    position: absolute;
    top: 0;
    height: 100%;
    background: rgba(99, 102, 241, 0.5);
    border-radius: 2px;
    transition: all 0.3s ease;
  }
  
  .text-map-note.positive { background: rgba(74, 222, 128, 0.5); }
  .text-map-note.negative { background: rgba(248, 113, 113, 0.5); }
  .text-map-note.neutral { background: rgba(99, 102, 241, 0.5); }
  
  @keyframes gradientFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes pulse {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
  }
  
  .analysis-animation {
    animation: pulse 2s infinite ease-in-out;
  }
  
  @keyframes progress-bar-movement {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
  
  .progress-bar-analyzing {
    background: linear-gradient(90deg, 
      rgba(251, 191, 36, 0.3) 0%, 
      rgba(251, 191, 36, 0.8) 50%, 
      rgba(251, 191, 36, 0.3) 100%
    );
    background-size: 200% 100%;
    animation: progress-bar-movement 2s linear infinite;
  }
  
  @keyframes scanning {
    0% { left: 0; width: 30%; }
    50% { left: 35%; width: 30%; }
    100% { left: 70%; width: 30%; }
  }
  
  .analysis-scanning {
    position: absolute;
    height: 100%;
    background: rgba(251, 191, 36, 0.15);
    animation: scanning 3s infinite ease-in-out;
  }
  
  .analysis-text-preview {
    position: relative;
    height: 80px;
    overflow: hidden;
    border-radius: 4px;
    margin-top: 20px;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .analysis-text-content {
    position: absolute;
    inset: 0;
    padding: 8px;
    font-size: 10px;
    line-height: 1.2;
    color: rgba(0, 0, 0, 0.5);
    font-family: monospace;
    white-space: pre-wrap;
    overflow: hidden;
  }
  
  .analysis-text-highlight {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
`

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [uploadStatus, setUploadStatus] = useState<{
    fileName: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
  } | null>(null)
  const [progressMessage, setProgressMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sourceTextContainerRef = useRef<HTMLDivElement>(null)
  const { addProject, addNote, updateNote, notes } = useNotes()
  const { notesPerProject, noteCharLimit } = useSettings()
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isAddToBucketOpen, setIsAddToBucketOpen] = useState(false)
  const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false)
  const [newBucketName, setNewBucketName] = useState('')
  const [isImportUrlOpen, setIsImportUrlOpen] = useState(false)
  const [urlToImport, setUrlToImport] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [notesGenerated, setNotesGenerated] = useState(false)
  
  // Add hooks to detect navigation
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Create a navigation key that changes with route changes
  const navigationKey = `${pathname}${searchParams}`

  // Reset page state when component mounts or when navigation occurs
  useEffect(() => {
    // Clear all state to show an empty page
    setInputText('')
    setGeneratedNotes([])
    setIsLoading(false)
    setError(null)
    setSelectedNote(null)
    setUploadStatus(null)
    setProgressMessage('')
    setNotesGenerated(false)
    
    // Focus on the textarea if it exists
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 100) // Short delay to ensure DOM is ready
    
    console.log('Home page reset to initial state')
  }, [navigationKey]) // This will trigger on any navigation change

  // Fetch buckets on mount
  useEffect(() => {
    async function fetchBuckets() {
      try {
        const { data, error } = await supabase
          .from('buckets')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw error
        setBuckets(data || [])
      } catch (error) {
        console.error('Error fetching buckets:', error)
        toast.error('Failed to load buckets')
      }
    }

    fetchBuckets()
  }, [])

  // Helper function to find sentence boundaries
  const findSentenceBoundaries = (text: string, start: number, end: number) => {
    // Look backwards for sentence start (period + space or start of text)
    let sentenceStart = start;
    
    // Skip any whitespace at the beginning
    while (sentenceStart > 0 && /\s/.test(text[sentenceStart - 1])) {
      sentenceStart--;
    }
    
    // Look for the beginning of the sentence
    while (sentenceStart > 0) {
      // Look for prior sentence ending followed by space/newline
      const prevChar = text[sentenceStart - 1];
      
      // If we find a sentence-ending character followed by a space or new line, we've found our start
      if ((prevChar === '.' || prevChar === '!' || prevChar === '?' || prevChar === ':' || prevChar === ';') && 
          (sentenceStart === text.length || /[\s\n]/.test(text[sentenceStart]))) {
        break;
      }
      
      // If we hit a paragraph boundary, use that as the sentence start
      if (sentenceStart > 1 && text[sentenceStart - 1] === '\n' && text[sentenceStart - 2] === '\n') {
        break;
      }
      
      sentenceStart--;
    }

    // Look forward for sentence end (period, exclamation, question mark)
    let sentenceEnd = end;
    
    // Skip any whitespace at the end
    while (sentenceEnd < text.length && /\s/.test(text[sentenceEnd])) {
      sentenceEnd++;
    }
    
    // Find the next sentence end
    while (sentenceEnd < text.length) {
      // Check for sentence-ending punctuation
      if (text[sentenceEnd] === '.' || text[sentenceEnd] === '!' || text[sentenceEnd] === '?') {
        // Make sure we include the punctuation
        sentenceEnd++;
        
        // Include any closing quotes or parentheses that may follow the punctuation
        while (sentenceEnd < text.length && /["\'\)\]\}]/.test(text[sentenceEnd])) {
          sentenceEnd++;
        }
        
        break;
      }
      
      // If we hit a paragraph boundary, use that as the sentence end
      if (sentenceEnd < text.length - 1 && text[sentenceEnd] === '\n' && text[sentenceEnd + 1] === '\n') {
        sentenceEnd++;
        break;
      }
      
      sentenceEnd++;
    }

    // If we've expanded too much, limit to a reasonable size
    if (sentenceEnd - sentenceStart > 2000) {
      const midpoint = Math.floor((sentenceStart + sentenceEnd) / 2);
      sentenceStart = Math.max(0, midpoint - 1000);
      sentenceEnd = Math.min(text.length, midpoint + 1000);
    }

    return { start: sentenceStart, end: sentenceEnd };
  }

  // Improved function to escape HTML special characters
  const escapeHTML = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const handleGenerateNotes = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text first')
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedNote(null)
    setGeneratedNotes([])
    setLoadingProgress(0)
    setProgressMessage('Initializing...')

    // Create an interval for updating the progress during the API call
    let analysisStage = 0;
    let analysisInterval: NodeJS.Timeout | null = null;
    
    try {
      console.log('Starting note generation process...')
      
      // First, create a project for this text
      setProgressMessage('Creating project...')
      console.log('Creating project...')
      setLoadingProgress(10)
      const project = await addProject({
        title: generateNoteTitle(inputText),
        sourceText: inputText
      })
      console.log('Project created:', project)
      setLoadingProgress(20)

      // Generate notes using OpenAI
      setProgressMessage('Analyzing text content...')
      console.log('Calling OpenAI API...')
      setLoadingProgress(30)
      
      // Start showing progress updates during the analysis phase
      const analysisStages = [
        "Analyzing text structure...",
        "Identifying key concepts...",
        "Finding main insights...",
        "Extracting important points...",
        "Evaluating sentiment...",
        "Organizing information...",
        "Reviewing content relevance..."
      ];
      
      // Start visual progress updates to keep user engaged
      analysisInterval = setInterval(() => {
        // Only update during the analysis phase (30-45%)
        if (analysisStage < analysisStages.length) {
          const newMessage = analysisStages[analysisStage];
          setProgressMessage(newMessage);
          
          // Slowly increment progress for visual feedback
          const progress = 30 + ((analysisStage / (analysisStages.length - 1)) * 15);
          setLoadingProgress(Math.min(45, progress));
          
          analysisStage++;
        }
      }, 2500); // Update every 2.5 seconds
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: inputText,
          notesPerProject,
          noteCharLimit
        }),
      })

      // Clear the interval once we've received a response
      if (analysisInterval) {
        clearInterval(analysisInterval);
        analysisInterval = null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API response not OK:', response.status, errorData)
        throw new Error(`Failed to generate notes: ${response.status} ${errorData.message || response.statusText}`)
      }

      setLoadingProgress(45)
      setProgressMessage('Processing results...')

      // Handle the SSE stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let processedNotes: Note[] = []

      // Set notes generated true early to show the content area
      setNotesGenerated(true)
      
      setLoadingProgress(50)
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.note) {
                // Process one note at a time and add it to UI immediately
                try {
                  // Update progress first - adjust to use remaining 50% of progress bar
                  const progressIncrement = 45 / notesPerProject
                  const currentProgress = Math.min(95, 50 + ((processedNotes.length + 1) * progressIncrement))
                  setLoadingProgress(currentProgress)
                  
                  // Calculate approximate text position percentage to help user understand progress
                  const textPercentage = parsed.note.textPosition?.start
                    ? Math.round((parsed.note.textPosition.start / inputText.length) * 100)
                    : 0
                  
                  setProgressMessage(`Creating note ${processedNotes.length + 1} (${textPercentage}% through text)...`)
                  
                  // Save this note to Supabase
                  const savedNote = await addNote({
                    projectId: project.id,
                    title: parsed.note.title || 'Untitled Note',
                    content: parsed.note.content,
                    sentiment: parsed.note.sentiment,
                    tags: parsed.note.tags,
                    textPosition: parsed.note.textPosition,
                    exactText: parsed.note.exactText || "",
                    isBookmarked: false
                  })
                  
                  console.log('Note saved:', savedNote.id)
                  
                  // Add to our processed notes array
                  processedNotes.push(savedNote)
                  
                  // Update the UI immediately for each note
                  setGeneratedNotes([...processedNotes])
                  
                } catch (noteError) {
                  console.error('Error saving note:', noteError)
                  // Continue with other notes instead of failing completely
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

      setLoadingProgress(100)
      setProgressMessage(`Completed: ${processedNotes.length} notes created`)
      
      if (processedNotes.length === 0) {
        throw new Error('No notes were generated')
      }

      console.log('Note generation process completed successfully with', processedNotes.length, 'notes')
    } catch (err) {
      console.error('Error in handleGenerateNotes:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate notes')
      // Reset notes generated if we failed
      setNotesGenerated(false)
    } finally {
      // Clear any interval that might still be running
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
      
      // Keep the progress message visible for a bit longer, then clear it
      setTimeout(() => {
        setProgressMessage('')
      }, 2000)
      setIsLoading(false)
      setLoadingProgress(0)
    }
  }

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    
    if (!sourceTextContainerRef.current || !inputText) {
      console.error('Missing source text container or input text')
      return
    }
    
    try {
      console.log('Handling note click for:', note.id)
      
      // Get the container and reset it
      const container = sourceTextContainerRef.current
      
      // We'll prepare a processed version of the text that properly handles line breaks
      const processedText = inputText.replace(/\n/g, '<br>')
      container.innerHTML = processedText
      
      // Find the text to highlight
      let matchPosition = -1
      let matchLength = 0
      let exactTextToMatch = ''
      
      // Strategy 1: Use the exact text if available
      if (note.exactText && note.exactText.length > 10) {
        // Use the exactText to find a precise match
        exactTextToMatch = note.exactText
        matchPosition = inputText.indexOf(exactTextToMatch)
        
        if (matchPosition >= 0) {
          matchLength = exactTextToMatch.length
          console.log('Found match using exactText at position:', matchPosition)
        } else {
          // Try with fuzzy matching for exactText
          const cleanExactText = note.exactText.replace(/\s+/g, ' ').trim();
          const words = cleanExactText.split(/\s+/).filter((w: string) => w.length > 0);
          
          // For long exactText, try to match on multiple word segments to improve chances
          if (words.length >= 5) {
            // Try with the first 5 words
            const firstSegment = words.slice(0, 5).join(' ');
            matchPosition = inputText.indexOf(firstSegment);
            
            if (matchPosition >= 0) {
              // Find paragraph boundaries
              const paraStart = inputText.lastIndexOf('\n\n', matchPosition);
              const paraEnd = inputText.indexOf('\n\n', matchPosition + firstSegment.length);
              
              // Extend to paragraph boundaries if found
              matchPosition = paraStart > -1 ? paraStart + 2 : matchPosition;
              const endPos = paraEnd > -1 ? paraEnd : Math.min(inputText.length, matchPosition + 500);
              matchLength = endPos - matchPosition;
              
              console.log('Found match using first segment of exactText at paragraph:', matchPosition);
            }
          }
        }
      }
      
      // Strategy 2: Use positions if available and they're valid
      if (matchPosition < 0 && note.textPosition && 
          typeof note.textPosition.start === 'number' && 
          typeof note.textPosition.end === 'number' &&
          note.textPosition.start >= 0 && 
          note.textPosition.end > 0 &&
          note.textPosition.end <= inputText.length) {
        
        matchPosition = note.textPosition.start
        matchLength = note.textPosition.end - note.textPosition.start
        
        // Verify that the positions point to valid text
        const extractedText = inputText.substring(matchPosition, matchPosition + matchLength)
        if (extractedText.length > 0) {
          console.log('Using stored positions:', matchPosition, matchLength)
          console.log('Text at position:', extractedText.substring(0, 30) + '...')
        } else {
          // Reset position if extracted text is empty
          matchPosition = -1
        }
      }
      
      // Try other matching strategies if needed
      if (matchPosition < 0) {
        // Additional strategies from our previous implementation...
        
        // Strategy 3: Direct content match
        matchPosition = inputText.indexOf(note.content)
        if (matchPosition >= 0) {
          matchLength = note.content.length
          console.log('Found exact content match at:', matchPosition)
        } else {
          // Strategy 4: Try with normalized whitespace
          const normalizedContent = note.content.replace(/\s+/g, ' ').trim()
          const normalizedInput = inputText.replace(/\s+/g, ' ')
          matchPosition = normalizedInput.indexOf(normalizedContent)
          
          if (matchPosition >= 0) {
            // Now we need to map back to the original text position
            let charCount = 0
            let normalizedCharCount = 0
            
            // Map the normalized position back to the original text
            while (normalizedCharCount < matchPosition && charCount < inputText.length) {
              if (!/\s/.test(inputText[charCount]) || 
                  (normalizedInput[normalizedCharCount] === ' ' && /\s/.test(inputText[charCount]))) {
                normalizedCharCount++
              }
              charCount++
            }
            
            matchPosition = charCount
            matchLength = note.content.length
            console.log('Found normalized content match at:', matchPosition)
          }
        }
      }
      
      // URL-imported content special handling
      if (matchPosition < 0 && note.content && inputText.includes(note.content)) {
        // For URL content specifically, try a fuzzy match looking for key phrases (5+ words)
        const words = note.content.split(/\s+/).filter((w: string) => w.length > 0);
        if (words.length >= 5) {
          // Try matching on a phrase of 5+ words
          const phrasesToTry = [];
          // Try beginning, middle and end phrases
          if (words.length >= 5) phrasesToTry.push(words.slice(0, 5).join(' '));
          if (words.length >= 10) phrasesToTry.push(words.slice(Math.floor(words.length/2)-2, Math.floor(words.length/2)+3).join(' '));
          if (words.length >= 5) phrasesToTry.push(words.slice(-5).join(' '));
          
          for (const phrase of phrasesToTry) {
            if (phrase.length >= 20) {
              matchPosition = inputText.indexOf(phrase);
              if (matchPosition >= 0) {
                console.log('Found URL content phrase match at:', matchPosition);
                // Find the paragraph boundaries around this match
                const paraStart = inputText.lastIndexOf('\n\n', matchPosition);
                const paraEnd = inputText.indexOf('\n\n', matchPosition + phrase.length);
                matchPosition = paraStart > -1 ? paraStart + 2 : matchPosition;
                matchLength = (paraEnd > -1 ? paraEnd : matchPosition + phrase.length + 100) - matchPosition;
                break;
              }
            }
          }
        }
      }
      
      // Fallback - just use the beginning of text
      if (matchPosition < 0) {
        matchPosition = 0
        const firstParaEnd = inputText.indexOf('\n\n')
        matchLength = firstParaEnd > 0 ? firstParaEnd : Math.min(100, inputText.length)
        console.log('Using fallback first paragraph')
      }
      
      // Expand to sentence boundaries or word boundaries
      if (matchPosition >= 0 && matchLength > 0) {
        // First try to expand to complete sentences
        const { start, end } = findSentenceBoundaries(inputText, matchPosition, matchPosition + matchLength)
        
        if (start >= 0 && end > start && end - start <= 2000) { // Limit sentence expansion to prevent overflows
          matchPosition = start
          matchLength = end - start
          console.log('Expanded to sentence boundaries:', { start, end })
        } else {
          // If sentence boundaries are too large or couldn't be found, expand to word boundaries
          // Find the previous word boundary
          while (matchPosition > 0 && !/\s/.test(inputText[matchPosition - 1])) {
            matchPosition--;
            matchLength++;
          }
          
          // Find the next word boundary 
          let endPos = matchPosition + matchLength;
          while (endPos < inputText.length && !/\s/.test(inputText[endPos])) {
            endPos++;
            matchLength = endPos - matchPosition;
          }
          
          console.log('Expanded to word boundaries:', { matchPosition, matchLength })
        }
      }
      
      // Extract and validate the text to highlight
      const textToHighlight = inputText.substring(matchPosition, matchPosition + matchLength);
      console.log('Text to highlight:', textToHighlight.substring(0, Math.min(50, textToHighlight.length)) + (textToHighlight.length > 50 ? '...' : ''));
      
      // Prepare HTML with appropriate escaping to avoid injection issues
      const preText = escapeHTML(inputText.substring(0, matchPosition)).replace(/\n/g, '<br>');
      const highlightText = escapeHTML(textToHighlight).replace(/\n/g, '<br>');
      const postText = escapeHTML(inputText.substring(matchPosition + matchLength)).replace(/\n/g, '<br>');
      
      // Combine with highlight
      const highlightedHtml = preText +
                             '<span id="active-highlight" class="custom-highlight">' + 
                             highlightText + 
                             '</span>' + 
                             postText;
      
      // Apply the highlighted HTML
      container.innerHTML = highlightedHtml;
      
      // Scroll to the highlight
      setTimeout(() => {
        const highlightElement = document.getElementById('active-highlight')
        if (!highlightElement) {
          console.error('Highlight element not found')
          return
        }
        
        try {
          // Get the position and size
          const highlightRect = highlightElement.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          
          // Calculate the scroll position to center the highlight
          const scrollPosition = highlightElement.offsetTop - 
                                (containerRect.height / 2) + 
                                (highlightRect.height / 2)
          
          // Scroll to that position
          container.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
          })
          
          // Add a subtle flash animation to draw attention
          highlightElement.animate(
            [
              { backgroundColor: 'rgba(254, 240, 138, 0.5)' },
              { backgroundColor: 'rgba(254, 240, 138, 1)' },
              { backgroundColor: 'rgba(254, 240, 138, 0.5)' }
            ],
            {
              duration: 800,
              iterations: 1
            }
          )
          
          console.log('Scrolled to highlight at position:', scrollPosition)
        } catch (error) {
          console.error('Error scrolling to highlight:', error)
          
          // Fallback
          highlightElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }, 100)
    } catch (error) {
      console.error('Error in handleNoteClick:', error)
      
      // Fallback: just show the text without highlighting
      if (sourceTextContainerRef.current) {
        sourceTextContainerRef.current.textContent = inputText
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedNote(null)
    setGeneratedNotes([])
    setUploadStatus({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    })

    try {
      // Handle text files directly with FileReader
      if (file.type === 'text/plain' || 
          file.name.endsWith('.txt') || 
          file.name.endsWith('.md')) {
        try {
          setUploadStatus(prev => prev ? { ...prev, status: 'processing', progress: 30 } : null)
          
          // Read file as text
          const reader = new FileReader();
          
          // Create a promise from the FileReader
          const fileData = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              setUploadStatus(prev => prev ? { ...prev, progress: 60 } : null)
              try {
                const text = e.target?.result as string || "";
                resolve(text);
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
          });
          
          // Update progress
          setUploadStatus(prev => prev ? { ...prev, progress: 90 } : null)
          
          // Set the extracted text in the input area
          setInputText(fileData);
          setUploadStatus(prev => prev ? { ...prev, status: 'complete', progress: 100 } : null)
          toast.success('File text extracted successfully')
          setIsLoading(false)
          
          // Clear upload status after 3 seconds
          setTimeout(() => {
            setUploadStatus(null)
          }, 3000)
          
          return
        } catch (textError) {
          console.error('Error reading text file:', textError)
          throw new Error('Failed to read text file.')
        }
      }

      // For other file types, use Supabase for storage and processing
      // Check if 'documents' storage bucket exists
      try {
        const { data: bucketData, error: bucketError } = await supabase.storage
          .getBucket('documents')
        
        if (bucketError) {
          console.error('Storage bucket check error:', bucketError)
          toast.error('Storage not configured. Please run the storage migration first.')
          throw new Error('Storage bucket "documents" does not exist. Please run the storage migration.')
        }
        
        console.log('Storage bucket exists:', bucketData)
      } catch (storageErr) {
        console.error('Failed to check storage bucket:', storageErr)
        // Continue with the try...catch flow
      }

      // Create a project for this file
      const project = await addProject({
        title: file.name,
        sourceText: '' // We'll update this after processing
      })

      setUploadStatus(prev => prev ? { ...prev, progress: 20, status: 'processing' } : null)

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${project.id}/${Date.now()}.${fileExt}`
      
      console.log('Uploading file to storage bucket "documents"...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('Storage bucket "documents" not found. Please run the storage migration first.')
        }
        throw uploadError
      }

      setUploadStatus(prev => prev ? { ...prev, progress: 40, status: 'processing' } : null)

      // Get the file content
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .download(fileName)

      if (fileError) throw fileError

      // Convert file content to text
      const text = await fileData.text()
      
      setUploadStatus(prev => prev ? { ...prev, progress: 60, status: 'processing' } : null)

      // Update project with the text content
      await supabase
        .from('projects')
        .update({ source_text: text })
        .eq('id', project.id)

      // Generate notes using OpenAI
      console.log('Calling /api/generate endpoint...')
      setUploadStatus(prev => prev ? { ...prev, progress: 70, status: 'processing' } : null)
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          notesPerProject,
          noteCharLimit
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(`Failed to generate notes: ${response.status} ${errorData.message || errorData.details || response.statusText}`)
      }

      setUploadStatus(prev => prev ? { ...prev, progress: 80, status: 'processing' } : null)

      // Handle the SSE stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let notes: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.note) {
                notes.push(parsed.note)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
              throw new Error('Failed to parse note data')
            }
          }
        }
      }

      if (!notes.length) {
        throw new Error('No notes were generated')
      }

      setUploadStatus(prev => prev ? { ...prev, progress: 90, status: 'processing' } : null)

      // Save each generated note to Supabase
      const savedNotes: Note[] = []
      for (const note of notes) {
        try {
          const savedNote = await addNote({
            projectId: project.id,
            title: note.title || 'Untitled Note',
            content: note.content,
            sentiment: note.sentiment,
            tags: note.tags,
            textPosition: note.textPosition,
            isBookmarked: false
          })
          savedNotes.push(savedNote)
        } catch (noteError) {
          console.error('Error saving note:', noteError)
          throw new Error(`Failed to save note: ${noteError instanceof Error ? noteError.message : 'Unknown error'}`)
        }
      }

      setGeneratedNotes(savedNotes)
      setUploadStatus(prev => prev ? { ...prev, status: 'complete', progress: 100 } : null)
      setNotesGenerated(true)
      toast.success('Notes generated successfully')
    } catch (err) {
      console.error('Error in handleFileUpload:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file'
      setError(errorMessage)
      
      // Show toast with a more user-friendly message
      if (errorMessage.includes('bucket not found') || errorMessage.includes('Storage bucket')) {
        toast.error('Storage not configured. Please run the storage migration first.')
      } else if (errorMessage.includes('Failed to generate notes')) {
        toast.error('Failed to generate notes. Check console for details.')
      } else {
        toast.error(errorMessage)
      }
      
      setUploadStatus(prev => prev ? { ...prev, status: 'error' } : null)
    } finally {
      setIsLoading(false)
      // Clear upload status after 3 seconds
      setTimeout(() => {
        setUploadStatus(null)
      }, 3000)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInputText(text)
      setError(null)
      setSelectedNote(null)
    } catch (err) {
      console.error('Failed to read clipboard:', err)
      setError('Failed to read from clipboard')
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

  const handleBookmark = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent note selection when clicking bookmark
    console.log('Bookmark clicked for note:', noteId)
    
    const note = notes.find(n => n.id === noteId)
    if (!note) {
      console.error('Note not found:', noteId)
      return
    }

    try {
      console.log('Current bookmark state:', note.isBookmarked)
      const newBookmarkState = !note.isBookmarked
      console.log('New bookmark state:', newBookmarkState)

      // Update in Supabase
      await updateNote(noteId, { isBookmarked: newBookmarkState })
      console.log('Note updated in Supabase')

      // Update local state
      setGeneratedNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, isBookmarked: newBookmarkState } : n
      ))
      console.log('Local state updated')
    } catch (error) {
      console.error('Error updating bookmark:', error)
      setError('Failed to update bookmark')
    }
  }

  const handleAddToBucket = async (bucketId: string) => {
    if (!selectedNote) return

    setIsLoading(true)
    try {
      await updateNote(selectedNote.id, { bucketId })
      setIsAddToBucketOpen(false)
      setSelectedNote(null)
      toast.success('Note added to bucket successfully')
    } catch (error) {
      console.error('Error adding note to bucket:', error)
      toast.error('Failed to add note to bucket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      toast.error('Bucket name is required')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('buckets')
        .insert([{ name: newBucketName.trim() }])
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned from insert')

      setBuckets(prev => [...prev, data])
      setIsCreateBucketOpen(false)
      setNewBucketName('')
      toast.success('Bucket created successfully')

      // Add the note to the newly created bucket
      if (selectedNote) {
        await handleAddToBucket(data.id)
      }
    } catch (error) {
      console.error('Error creating bucket:', error)
      toast.error('Failed to create bucket')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToBucketClick = (note: Note) => {
    setSelectedNote(note)
    setIsAddToBucketOpen(true)
  }

  // Handle importing content from a URL
  const handleImportUrl = async () => {
    if (!urlToImport.trim()) {
      setImportError('URL is required')
      return
    }
    
    setIsImporting(true)
    setImportError(null)
    setGeneratedNotes([])
    
    try {
      // Call our scrape API
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToImport.trim() }),
      })
      
      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json()
        throw new Error(errorData.error || 'Failed to import URL')
      }
      
      const scrapeData = await scrapeResponse.json()
      
      // Show that we're generating notes
      toast.info('Analyzing content and generating notes...')
      
      // Create a project for this URL content
      const project = await addProject({
        title: scrapeData.title || urlToImport,
        sourceText: scrapeData.content
      })
      
      // Call the generate-project-notes API
      const generateResponse = await fetch('/api/generate-project-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: scrapeData.title,
          content: scrapeData.content,
          url: urlToImport.trim(),
          notesCount: notesPerProject,
          noteCharLimit
        }),
      })
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json()
        throw new Error(errorData.error || 'Failed to generate notes')
      }
      
      const generateData = await generateResponse.json()
      
      // Save the generated notes to the database
      const savedNotes: Note[] = []
      const sourceText = scrapeData.content;
      
      // Create a function to find the position of text in the source
      const findTextPosition = (text: string, source: string) => {
        if (!text || !source) return { start: 0, end: 0 };
        
        // Try direct match first
        const directPos = source.indexOf(text);
        if (directPos >= 0) {
          return { start: directPos, end: directPos + text.length };
        }
        
        // Try normalized match (handle whitespace differences)
        const normalizedText = text.replace(/\s+/g, ' ').trim();
        const normalizedSource = source.replace(/\s+/g, ' ');
        
        const normalizedPos = normalizedSource.indexOf(normalizedText);
        if (normalizedPos >= 0) {
          // Map back to original position
          let sourceIdx = 0;
          let normalizedIdx = 0;
          let startPos = 0;
          
          // Find the matching start position
          while (normalizedIdx < normalizedPos && sourceIdx < source.length) {
            if (!/\s/.test(source[sourceIdx]) || 
                (normalizedSource[normalizedIdx] === ' ' && /\s/.test(source[sourceIdx]))) {
              normalizedIdx++;
            }
            sourceIdx++;
          }
          
          startPos = sourceIdx;
          
          // For the end position, add the length of the normalized text
          // but map through the original text to get the actual length
          normalizedIdx = 0;
          let endPos = startPos;
          
          while (normalizedIdx < normalizedText.length && endPos < source.length) {
            if (!/\s/.test(source[endPos]) || 
                (normalizedIdx < normalizedText.length && 
                 normalizedText[normalizedIdx] === ' ' && 
                 /\s/.test(source[endPos]))) {
              normalizedIdx++;
            }
            endPos++;
          }
          
          return { start: startPos, end: endPos };
        }
        
        // If all else fails, do a fuzzy match with word sequences
        const words = text.split(/\s+/).filter((w: string) => w.length > 0);
        if (words.length >= 3) {
          // Try to match on groups of 3+ words
          for (let i = 0; i <= words.length - 3; i++) {
            const phrase = words.slice(i, i + 3).join(' ');
            const phrasePos = source.indexOf(phrase);
            
            if (phrasePos >= 0) {
              // Find surrounding paragraph
              const prevNewline = source.lastIndexOf('\n\n', phrasePos);
              const nextNewline = source.indexOf('\n\n', phrasePos);
              
              const start = prevNewline >= 0 ? prevNewline + 2 : Math.max(0, phrasePos - 40);
              const end = nextNewline >= 0 ? nextNewline : Math.min(source.length, phrasePos + phrase.length + 160);
              
              return { start, end };
            }
          }
        }
        
        // Last resort - return approximate position
        const firstSentence = text.match(/^([^.!?]+[.!?])/);
        if (firstSentence) {
          const firstSentencePos = source.indexOf(firstSentence[0]);
          if (firstSentencePos >= 0) {
            return { 
              start: firstSentencePos, 
              end: firstSentencePos + firstSentence[0].length
            };
          }
        }
        
        return { start: 0, end: Math.min(500, source.length) };
      };
      
      for (const note of generateData.notes) {
        try {
          // Find the position of the exactText in the source text
          let textPosition = { start: 0, end: 0 };
          let exactText = note.exactText || note.content;
          
          if (exactText && sourceText) {
            textPosition = findTextPosition(exactText, sourceText);
            
            // Verify the found position
            const extractedText = sourceText.substring(textPosition.start, textPosition.end);
            if (extractedText.length < 10) {
              // Bad match, try with note content instead
              textPosition = findTextPosition(note.content, sourceText);
              exactText = sourceText.substring(textPosition.start, textPosition.end);
            } else {
              exactText = extractedText;
            }
            
            console.log('Found text position for note:', {
              noteId: note.id,
              start: textPosition.start,
              end: textPosition.end,
              textLength: exactText.length
            });
          }
          
          const savedNote = await addNote({
            projectId: project.id,
            title: note.title || 'Untitled Note',
            content: note.content,
            sentiment: note.sentiment,
            tags: note.tags,
            textPosition: textPosition,
            exactText: exactText,
            isBookmarked: false
          })
          savedNotes.push(savedNote)
        } catch (noteError) {
          console.error('Error saving note:', noteError)
          // Continue with other notes instead of failing completely
        }
      }
      
      // Set the generated notes to display
      if (savedNotes.length > 0) {
        setGeneratedNotes(savedNotes)
        
        // Set the input text to the imported content
        setInputText(scrapeData.content)
        
        // Close the dialog
        setIsImportUrlOpen(false)
        
        // Set notes as generated
        setNotesGenerated(true)
        
        // Reset the URL field
        setUrlToImport('')
        
        // Show success message
        toast.success(`Generated ${savedNotes.length} notes from URL content`)
      } else {
        throw new Error('No notes were generated')
      }
      
    } catch (error) {
      console.error('Error importing URL:', error)
      setImportError(error instanceof Error ? error.message : 'Failed to import URL')
      toast.error('Failed to import URL: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed top-0 left-[240px] right-0 bottom-0 flex">
      <style>{textSelectionStyles}</style>
      <style>{animationStyles}</style>
      {/* Left side - Text Input */}
      <div className="flex-1 flex flex-col bg-zinc-100 p-6">
        <div className="flex-1 relative rounded-lg bg-zinc-100">
          {!notesGenerated ? (
            <Textarea 
              ref={textareaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                setError(null)
                setSelectedNote(null)
              }}
              placeholder="Paste your text here..."
              className="flex-1 resize-none p-6 text-base bg-transparent absolute inset-0 border-0 focus-visible:ring-0 custom-textarea"
            />
          ) : (
            <div 
              ref={sourceTextContainerRef} 
              className="source-text-container"
              onClick={(e) => {
                // Allow text selection
                e.stopPropagation();
              }}
              style={{ 
                overflowY: 'auto',
                position: 'absolute',
                inset: 0,
              }}
            >
              {inputText}
            </div>
          )}
          {!inputText && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 pointer-events-none text-muted-foreground p-6">
              <div className="flex flex-col items-center gap-3">
                <FileText className="w-8 h-8" />
                <span className="text-lg font-medium">Add your text</span>
                <span className="text-sm text-center">Choose one of the options below to get started</span>
              </div>
              <div className="flex flex-col gap-4 items-center pointer-events-auto">
                <div className="flex gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-zinc-200 hover:border-black transition-colors border bg-white"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      <DropdownMenuItem onClick={() => document.getElementById('file-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsImportUrlOpen(true)}>
                        <Link className="mr-2 h-4 w-4" />
                        Import URL
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.md"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-md px-4 py-2 text-sm hover:bg-zinc-200 hover:border-black transition-colors border bg-white"
                    onClick={handlePasteFromClipboard}
                  >
                    <Clipboard className="w-4 h-4" />
                    Paste from Clipboard
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">Supports plain text (.txt) and Markdown (.md) files</span>
              </div>
            </div>
          )}
          {inputText && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
              {error && (
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-sm text-red-500">{error}</span>
                </div>
              )}
              {!generatedNotes.length && !notesGenerated && (
                <AnimatedGenerateButton
                  onClick={handleGenerateNotes}
                  disabled={isLoading}
                  isGenerating={isLoading}
                />
              )}
            </div>
          )}
          {uploadStatus && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white px-4 py-2 rounded-md shadow-sm">
              <div className="flex items-center gap-2">
                {uploadStatus.status === 'uploading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                )}
                {uploadStatus.status === 'processing' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                )}
                {uploadStatus.status === 'complete' && (
                  <div className="h-4 w-4 text-green-500">✓</div>
                )}
                {uploadStatus.status === 'error' && (
                  <div className="h-4 w-4 text-red-500">✕</div>
                )}
                <span className="text-sm">
                  {uploadStatus.status === 'uploading' && 'Uploading...'}
                  {uploadStatus.status === 'processing' && 'Processing...'}
                  {uploadStatus.status === 'complete' && 'Complete'}
                  {uploadStatus.status === 'error' && 'Error'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {uploadStatus.fileName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Generated Notes Grid */}
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        {isLoading && generatedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Minimal, monochromatic loading state */}
            <div className="flex flex-col items-center max-w-xs">
              {/* Simple percentage indicator */}
              <div className="relative w-full my-8">
                <div className="w-full h-[1px] bg-gray-200"></div>
                <div 
                  className={`absolute top-0 left-0 h-[1px] ${loadingProgress >= 30 && loadingProgress < 45 ? 'progress-bar-analyzing' : 'bg-black'}`}
                  style={{ width: `${loadingProgress}%` }}
                ></div>
                <div 
                  className="absolute -top-2 h-4 flex items-center justify-center text-xs text-gray-500 font-mono"
                  style={{ left: `${loadingProgress}%` }}
                >
                  <div className="absolute -left-[50%] whitespace-nowrap">{loadingProgress}%</div>
                </div>
              </div>
              
              {/* Progress message */}
              <div className={`text-sm text-gray-500 mb-10 font-mono ${loadingProgress >= 30 && loadingProgress < 45 ? 'analysis-animation' : ''}`}>
                {progressMessage || (
                  loadingProgress < 30 ? 'initializing...' :
                  loadingProgress < 70 ? 'processing content...' : 
                  'finalizing...'
                )}
              </div>
              
              {/* Text preview during analysis phase */}
              {loadingProgress >= 30 && loadingProgress < 45 && (
                <div className="analysis-text-preview w-full">
                  <div className="analysis-text-content">
                    {inputText.substring(0, 500).replace(/\n+/g, ' ')}
                  </div>
                  <div className="analysis-text-highlight">
                    <div className="analysis-scanning"></div>
                  </div>
                </div>
              )}
              
              {/* Animated activity indicator during analysis phase */}
              {loadingProgress >= 30 && loadingProgress < 45 && (
                <div className="mt-6 flex space-x-2 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-[pulse_0.75s_ease-in-out_0s_infinite]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-[pulse_0.75s_ease-in-out_0.15s_infinite]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-[pulse_0.75s_ease-in-out_0.3s_infinite]"></div>
                </div>
              )}
            </div>
          </div>
        ) : generatedNotes.length > 0 ? (
          <>
            {/* Text map visualization */}
            {isLoading && (
              <div className="mb-6 px-1">
                <p className="text-xs text-gray-500 mb-1">Text Coverage Map:</p>
                <div className="text-map">
                  {/* Indicator of current processing position */}
                  <div 
                    className="text-map-indicator" 
                    style={{ 
                      width: `${loadingProgress / 100 * 100}%`
                    }}
                  ></div>
                  
                  {/* Show where each note is located in the text */}
                  {generatedNotes.map((note, index) => {
                    // Only show if there's valid position data
                    if (!note.textPosition || typeof note.textPosition.start !== 'number') {
                      return null;
                    }
                    
                    const startPercent = (note.textPosition.start / inputText.length) * 100;
                    const endPercent = (note.textPosition.end / inputText.length) * 100;
                    const width = Math.max(0.5, endPercent - startPercent);
                    
                    return (
                      <div 
                        key={`note-map-${index}`}
                        className={`text-map-note ${note.sentiment}`}
                        style={{ 
                          left: `${startPercent}%`,
                          width: `${width}%`
                        }}
                        title={`Note ${index + 1}: ${note.content.substring(0, 30)}...`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {generatedNotes.map((note, index) => (
                <div
                  key={index}
                  className={`note-card note-card-appear p-4 rounded-lg border ${getNoteColorClass(note.sentiment)} shadow-sm hover:shadow-md transition-all cursor-pointer group hover:scale-[1.01] ${selectedNote === note ? 'ring-2 ring-black' : ''} relative`}
                  onClick={() => handleNoteClick(note)}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <div className={`absolute top-2 right-2 ${note.isBookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 hover:bg-white/50 ${note.isBookmarked ? 'opacity-100' : ''}`}
                      onClick={(e) => handleBookmark(note.id, e)}
                    >
                      <Bookmark 
                        className={`h-5 w-5 ${note.isBookmarked ? 'fill-current' : ''}`}
                      />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DotsHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToBucketClick(note)
                          }}
                        >
                          <FolderIcon className="mr-2 h-4 w-4" />
                          Add to Bucket
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg leading-relaxed pr-8">{note.content}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="bg-white/50 px-2 py-0.5 rounded-md text-xs font-normal opacity-75"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Placeholder cards that show while loading more notes */}
              {isLoading && generatedNotes.length > 0 && (
                <>
                  <div className="note-card-placeholder"></div>
                  <div className="note-card-placeholder"></div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Notes will appear here
          </div>
        )}
      </div>

      {/* Add to Bucket Dialog */}
      <Dialog open={isAddToBucketOpen} onOpenChange={setIsAddToBucketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Bucket</DialogTitle>
            <DialogDescription>
              Select a bucket to add this note to or create a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing buckets */}
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {buckets.map(bucket => (
                <Button
                  key={bucket.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddToBucket(bucket.id)}
                  disabled={isLoading}
                >
                  <FolderIcon className="mr-2 h-4 w-4" />
                  {bucket.name}
                </Button>
              ))}
              {buckets.length === 0 && (
                <p className="text-sm text-muted-foreground">No buckets available</p>
              )}
            </div>
            
            {/* Create new bucket section */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Create New Bucket</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter bucket name"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && newBucketName.trim() && handleCreateBucket()}
                />
                <Button 
                  onClick={handleCreateBucket}
                  disabled={isLoading || !newBucketName.trim()}
                  className="bg-black text-white hover:bg-black/90"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"/>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToBucketOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bucket Dialog */}
      <Dialog open={isCreateBucketOpen} onOpenChange={setIsCreateBucketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Bucket</DialogTitle>
            <DialogDescription>
              Enter a name for your new bucket.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter bucket name"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateBucketOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBucket}
                className="bg-black text-white hover:bg-black/90"
                disabled={isLoading}
              >
                Create Bucket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import URL Dialog */}
      <Dialog open={isImportUrlOpen} onOpenChange={setIsImportUrlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Content from URL</DialogTitle>
            <DialogDescription>
              Enter a URL to import its content for note generation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Input
                placeholder="https://example.com/article"
                value={urlToImport}
                onChange={(e) => setUrlToImport(e.target.value)}
                type="url"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && !isImporting && handleImportUrl()}
              />
              {importError && (
                <p className="text-sm text-destructive">{importError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportUrlOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportUrl} disabled={isImporting}>
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
