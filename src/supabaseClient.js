import { createClient } from '@supabase/supabase-js'

// These come from Vite env vars set in .env (see .env.example).
// Only the PUBLISHABLE/anon key ever belongs here — never the secret/service_role key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
