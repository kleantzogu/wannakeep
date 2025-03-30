import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API: Fetching bucket with ID:', params.id)
    
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    const { data: bucket, error } = await supabase
      .from('buckets')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('API: Error fetching bucket:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch bucket' },
        { status: 500 }
      )
    }

    if (!bucket) {
      console.error('API: Bucket not found:', params.id)
      return NextResponse.json(
        { error: 'Bucket not found' },
        { status: 404 }
      )
    }

    console.log('API: Successfully fetched bucket:', bucket)
    return NextResponse.json(bucket)
  } catch (error) {
    console.error('API: Error in bucket GET route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 