'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { BookmarkIcon, TrashIcon, FolderIcon, Sparkles, Loader } from 'lucide-react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  initialContent?: string
  initialTitle?: string
  initialTags?: string[]
  onSave: (note: { title: string; content: string; sentiment?: string; tags?: string[] }) => void
}

export default function NoteEditor({ 
  initialContent = '', 
  initialTitle = '', 
  initialTags = [],
  onSave 
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [newTag, setNewTag] = useState('')
  const [sentiment, setSentiment] = useState<string>('neutral')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateBgPosition, setGenerateBgPosition] = useState(0)
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Animate the Generate Notes button background
  useEffect(() => {
    const interval = setInterval(() => {
      setGenerateBgPosition(prev => (prev + 1) % 100)
    }, 50)
    
    return () => clearInterval(interval)
  }, [])
  
  // Detect sentiment based on content
  useEffect(() => {
    if (!content) return
    
    // Simple sentiment analysis (could be replaced with actual API)
    const text = content.toLowerCase()
    const positiveWords = ['great', 'good', 'excellent', 'awesome', 'happy', 'love', 'success', 'best']
    const negativeWords = ['bad', 'issue', 'problem', 'difficult', 'sad', 'hate', 'fail', 'worst']
    
    let positiveCount = positiveWords.filter(word => text.includes(word)).length
    let negativeCount = negativeWords.filter(word => text.includes(word)).length
    
    if (positiveCount > negativeCount) {
      setSentiment('positive')
    } else if (negativeCount > positiveCount) {
      setSentiment('negative')
    } else {
      setSentiment('neutral')
    }
  }, [content])
  
  const handleSave = () => {
    if (!title.trim()) {
      alert('Please add a title for your note')
      return
    }
    
    onSave({
      title,
      content,
      sentiment,
      tags
    })
  }
  
  const handleGenerateNotes = async () => {
    if (!content.trim()) {
      toast.error('Please add some content first!')
      return
    }
    
    setIsGenerating(true)
    
    // Create a ripple effect on the note container based on sentiment
    const sentimentColors = {
      positive: 'rgba(134, 239, 172, 0.3)', // green
      neutral: 'rgba(147, 197, 253, 0.3)',  // blue
      negative: 'rgba(252, 165, 165, 0.3)'  // red
    };
    
    // Apply pulsing effect to the note container during generation
    const noteContainer = document.querySelector('.note-container');
    if (noteContainer) {
      noteContainer.classList.add('generating-pulse');
    }
    
    try {
      // Mock generation - in a real app, you'd call your API here
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate title if empty
      if (!title.trim()) {
        const lines = content.trim().split('\n')
        setTitle(lines[0].substring(0, 50))
      }
      
      // Generate some sample tags based on content
      const commonWords = content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .reduce((acc, word) => {
          acc[word] = (acc[word] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      
      const topWords = Object.entries(commonWords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word)
      
      if (topWords.length > 0) {
        setTags(Array.from(new Set([...tags, ...topWords])))
      }
      
      toast.success('Notes generated successfully!', {
        icon: '✨',
        style: { background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', color: 'white' }
      })
    } catch (error) {
      console.error('Error generating notes:', error)
      toast.error('Failed to generate notes')
    } finally {
      setIsGenerating(false)
      
      // Remove the pulsing effect
      if (noteContainer) {
        noteContainer.classList.remove('generating-pulse');
      }
    }
  }
  
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  // Preview color based on sentiment
  const sentimentColor = {
    positive: 'bg-green-100 border-green-300 text-green-800',
    neutral: 'bg-blue-100 border-blue-300 text-blue-800',
    negative: 'bg-red-100 border-red-300 text-red-800',
  }[sentiment]
  
  const addRippleEffect = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isGenerating || !content.trim()) return;
    
    const button = buttonRef.current;
    if (!button) return;
    
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;
    
    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'absolute rounded-full bg-white/30 pointer-events-none';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 600ms linear';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 700);
  };
  
  return (
    <div className="space-y-4">
      <div className={`note-container p-3 rounded-lg border ${sentimentColor} shadow-sm group relative transition-colors duration-700`}>
        <div className="absolute right-2 top-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-1 opacity-0 group-hover:opacity-100"
          >
            <BookmarkIcon className="h-full w-full" />
          </Button>
        </div>
        <div className="absolute bottom-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
              >
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
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
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-md bg-white/50"
              placeholder="Note title"
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded-md min-h-[200px] bg-white/50"
              placeholder="Write your note here..."
            />
          </div>
          
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags
            </label>
            <div className="flex">
              <input
                id="tags"
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 p-2 border rounded-l-md bg-white/50"
                placeholder="Add a tag"
              />
              <Button 
                type="button" 
                onClick={addTag}
                className="rounded-l-none"
              >
                Add
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-white/50 px-1.5 py-0.5 rounded text-[10px] font-normal opacity-75"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-xs hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex gap-3 items-center justify-between">
        <Button 
          onClick={handleGenerateNotes}
          disabled={isGenerating || !content.trim()}
          className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl px-10 py-6 text-base font-medium rounded-full transition-all hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundSize: '200% 200%',
            animation: 'bg-shift 3s ease infinite'
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Generate Notes
              </>
            )}
          </span>
        </Button>
        
        <Button 
          onClick={handleSave}
          className="bg-black hover:bg-black/80 text-white"
        >
          Save Note
        </Button>
      </div>
    </div>
  )
} 