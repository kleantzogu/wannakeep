require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local file')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  try {
    console.log('Applying exact_text migration...')

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'migrations',
      'add_exact_text_to_notes.sql',
    )
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')

    // Execute the SQL statement using the Supabase REST API
    console.log('Migration SQL:')
    console.log(migrationSql)
    console.log('\nTo apply this migration:')
    console.log('1. Go to your Supabase project dashboard')
    console.log('2. Navigate to the SQL Editor')
    console.log('3. Create a new query')
    console.log('4. Paste the SQL above')
    console.log('5. Run the query')

    console.log(
      '\nAlternatively, if you have access to the pg_admin role, you can uncomment the code below:',
    )
    /*
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      throw new Error(`Failed to apply migration: ${error.message}`);
    }
    
    console.log('Migration successfully applied!');
    */
  } catch (error) {
    console.error('Error applying migration:', error)
  }
}

applyMigration()
