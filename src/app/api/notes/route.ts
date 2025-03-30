import { NextResponse } from 'next/server'

// Mock data - this would be replaced with actual Supabase queries
const mockNotes = [
  {
    id: '1',
    title: 'Meeting Notes',
    content: 'Discussed project timeline and milestones. The team agreed to launch the MVP by the end of Q2.',
    sentiment: 'positive',
    tags: ['work', 'project'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Research Findings',
    content: 'Found interesting papers on note organization techniques. Need to follow up with more reading.',
    sentiment: 'neutral',
    tags: ['research', 'reading'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Project Blockers',
    content: 'Several issues identified in the last sprint. Need to address them before moving forward.',
    sentiment: 'negative',
    tags: ['work', 'issues'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET() {
  // In a real app, we would fetch from Supabase here
  // Example: const { data, error } = await supabase.from('notes').select('*')
  
  return NextResponse.json(mockNotes)
}

export async function POST(request: Request) {
  const newNote = await request.json()
  
  // In a real app, we would insert into Supabase here
  // Example: const { data, error } = await supabase.from('notes').insert([newNote])
  
  // Generate a fake ID and timestamps
  const note = {
    ...newNote,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  return NextResponse.json(note)
} 