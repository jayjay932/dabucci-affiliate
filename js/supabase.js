// Placeholder: client Supabase + clés (ne rien ajouter ici).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
const SUPABASE_URL      = 'https://uagoergowlhsjhglchry.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZ29lcmdvd2xoc2poZ2xjaHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMzMxNDMsImV4cCI6MjA5NDcwOTE0M30.Cqn91lvzkWcrAyuEbIr-CCqQwbdzvP6SCvI6nFi5QWY'
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)