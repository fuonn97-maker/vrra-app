import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    const schemaPath = path.join(process.cwd(), 'scripts', '01-create-schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf-8')
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql })
    
    if (error) {
      console.error('Migration error:', error)
      process.exit(1)
    }
    
    console.log('Migration completed successfully')
    process.exit(0)
  } catch (err) {
    console.error('Failed to run migration:', err)
    process.exit(1)
  }
}

runMigration()
