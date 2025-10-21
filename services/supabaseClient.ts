import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mdavprbhfhcunvulwphf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error(`
    Missing Supabase key. Please:
    1. Create a .env file in the project root
    2. Add VITE_SUPABASE_ANON_KEY=your-anon-key-here
    3. Get your anon key from: https://supabase.com/dashboard/project/mdavprbhfhcunvulwphf/settings/api
  `)
}

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please set VITE_SUPABASE_URL in your environment variables.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }
