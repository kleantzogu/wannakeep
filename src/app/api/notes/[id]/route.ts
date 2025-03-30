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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const note = mockNotes.find(note => note.id === id)
  
  if (!note) {
    return NextResponse.json(
      { error: 'Note not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(note)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const updatedData = await request.json()
  
  // In a real app, this would update the note in Supabase
  // Example: const { data, error } = await supabase.from('notes').update(updatedData).eq('id', id)
  
  // For mock purposes, we'll just return the updated data with the ID
  const updatedNote = {
    ...updatedData,
    id,
    updatedAt: new Date().toISOString(),
  }
  
  return NextResponse.json(updatedNote)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  // In a real app, this would delete the note from Supabase
  // Example: const { data, error } = await supabase.from('notes').delete().eq('id', id)
  
  return NextResponse.json({ success: true })
} 