import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test function to verify connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key exists:', !!supabaseAnonKey)

    // Test the database connection
    const { data, error } = await supabase
      .from('projects')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return false
    }

    console.log('Supabase connection successful!')
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}

// Test function to verify connection and bucket table access
export async function testBucketAccess() {
  try {
    console.log('Testing bucket table access...')
    
    // Test the database connection
    const { data, error } = await supabase
      .from('buckets')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Bucket table access error:', error)
      return false
    }

    console.log('Bucket table access successful!')
    return true
  } catch (error) {
    console.error('Bucket table access failed:', error)
    return false
  }
} 