// session.js — gestion centrale des sessions DABUCCI
import { supabase } from './supabase.js'

// ─── Helpers navigation ───────────────────────────────────────
export function goTo(path) {
  window.location.href = path
}

// ─── Récupérer la session ─────────────────────────────────────
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ─── Récupérer le profil ──────────────────────────────────────
export async function getProfile() {
  // Utiliser getSession() (local, pas d'appel réseau) plutôt que getUser()
  const session = await getSession()
  if (!session?.user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()
  if (error) { console.error('getProfile error:', error.message); return null }
  return data || null
}

// ─── Connexion ────────────────────────────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── Inscription ──────────────────────────────────────────────
export async function signUp(email, password, nom, prenom) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { nom, prenom } }
  })
  if (error) throw error
  return data
}

// ─── Déconnexion — ULTRA SIMPLE ──────────────────────────────
export async function logout(redirectTo) {
  await supabase.auth.signOut()
  goTo(redirectTo || '/dashboard/login.html')
}

// ─── Mise à jour profil ───────────────────────────────────────
export async function updateProfile(fields) {
  const session = await getSession()
  const user = session?.user
  if (!user) throw new Error('Non connecté')
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', user.id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Guards ──────────────────────────────────────────────────
// Vérifie que l'utilisateur est connecté, sinon redirige
export async function requireLogin(loginPath) {
  const session = await getSession()
  if (!session) {
    goTo(loginPath || '/dashboard/login.html')
    return null
  }
  const profile = await getProfile()
  if (!profile) {
    goTo(loginPath || '/dashboard/login.html')
    return null
  }
  return profile
}

// Vérifie que c'est un admin
export async function requireAdmin() {
  const profile = await requireLogin('/admin/login.html')
  if (!profile) return null
  if (!['admin', 'superadmin'].includes(profile.role)) {
    goTo('/admin/login.html')
    return null
  }
  return profile
}

// Vérifie que c'est un user du dashboard (candidate ou ambassadrice)
export async function requireDashboard() {
  const profile = await requireLogin('/dashboard/login.html')
  if (!profile) return null
  if (['admin', 'superadmin'].includes(profile.role)) {
    goTo('/admin/dashboard.html')
    return null
  }
  return profile
}

// Redirige si déjà connecté (pour les pages login)
export async function redirectIfLoggedIn() {
  const session = await getSession()
  if (!session) return
  const profile = await getProfile()
  if (!profile) return
  if (['admin', 'superadmin'].includes(profile.role)) {
    goTo('/admin/dashboard.html')
  } else {
    goTo('/dashboard/index.html')
  }
}