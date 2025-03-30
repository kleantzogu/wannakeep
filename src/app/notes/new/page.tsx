'use client'

import NoteEditor from '@/components/NoteEditor'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useNotes } from '@/providers/NotesProvider'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FileText, FolderIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Bucket {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default function NewNotePage() {
  const { addNote, addProject } = useNotes()
  const router = useRouter()
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
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
  
  const handleSaveNote = async (note: any) => {
    try {
      setIsLoading(true);
      
      let projectId;
      
      try {
        // First create a new project
        const project = await addProject({
          title: note.title || 'Untitled Project',
          sourceText: note.content || ''
        });
        projectId = project.id;
      } catch (projectError) {
        console.error('Error creating project:', projectError);
        toast.error('Could not create project, but will still try to save the note');
        // Generate a fallback project ID
        projectId = crypto.randomUUID();
      }
      
      // Then add the note to that project
      await addNote({
        title: note.title,
        content: note.content,
        sentiment: note.sentiment || 'neutral',
        tags: note.tags || [],
        bucketId: selectedBucketId,
        projectId: projectId,
        textPosition: { start: 0, end: 0 },
        isBookmarked: false,
      });
      
      toast.success('Note created successfully');
      
      // Redirect back to notes list
      router.push('/notes');
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="h-screen bg-white border-r border-zinc-200 w-72 flex flex-col shrink-0">
        <div className="p-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-zinc-100 text-zinc-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-medium text-sm">New Note</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bucket (Optional)</label>
              <Select
                value={selectedBucketId || ''}
                onValueChange={(value) => setSelectedBucketId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bucket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Bucket</SelectItem>
                  {buckets.map(bucket => (
                    <SelectItem key={bucket.id} value={bucket.id}>
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" />
                        {bucket.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/notes')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex bg-zinc-50 min-w-0">
        <div className="w-full max-w-2xl mx-auto p-6">
          <NoteEditor onSave={handleSaveNote} />
        </div>
      </div>
    </div>
  )
} 