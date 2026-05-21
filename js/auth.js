import { supabase } from './supabase.js'

// ── Inscription ───────────────────────────────────────────────
export async function signUp({ email, password, nom, prenom }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { nom, prenom } }
  })
  if (error) throw error
  return data
}

// ── Connexion ─────────────────────────────────────────────────
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ── Déconnexion — SIMPLE et direct ───────────────────────────
export async function signOut() {
  await supabase.auth.signOut()
  // Forcer la redirection selon le contexte
  const path = window.location.pathname
  if (path.startsWith('/admin')) {
    window.location.href = '/admin/login.html'
  } else {
    window.location.href = '/dashboard/login.html'
  }
}

// ── Session courante ──────────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Profil complet ────────────────────────────────────────────
export async function getProfile() {
  const session = await getSession()
  if (!session) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  if (error) return null
  return data
}

// ── Mise à jour profil ────────────────────────────────────────
export async function updateProfile(fields) {
  const session = await getSession()
  if (!session) throw new Error('Non connecté')
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', session.user.id)
    .select()
    .single()
  if (error) throw error
  return data
}