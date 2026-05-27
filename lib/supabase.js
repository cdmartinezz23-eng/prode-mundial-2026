import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  'https://nnsgxychykojvweokxaj.supabase.co'

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uc2d4eWNoeWtvanZ3ZW9reGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDEzODQsImV4cCI6MjA5NTQ3NzM4NH0.1ad4YLYRfLUlWgdA-lLiAygcEZ9-dBNF6281XiPCVJc'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)