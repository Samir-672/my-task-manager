import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

function isPublicSupabaseKey(key) {
  if (key.startsWith('sb_publishable_')) {
    return true
  }

  const payload = key.split('.')[1]
  if (!payload) {
    return false
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(base64))
    return claims.role === 'anon'
  } catch {
    return false
  }
}

export const supabaseConfigMissing = !supabaseUrl || !supabaseAnonKey
export const supabaseKeyInvalid =
  !supabaseConfigMissing && !isPublicSupabaseKey(supabaseAnonKey)
export const supabase = supabaseConfigMissing || supabaseKeyInvalid
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)
