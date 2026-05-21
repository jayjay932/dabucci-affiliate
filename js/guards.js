import { getSession, getProfile } from './auth.js'

// ── Page réservée aux connectés ───────────────────────────────
export async function requireAuth(loginPath) {
  const session = await getSession()
  if (!session) {
    window.location.href = loginPath
    return null
  }
  return session
}

// ── Page admin ────────────────────────────────────────────────
export async function requireAdmin() {
  const session = await requireAuth('/admin/login.html')
  if (!session) return null
  const profile = await getProfile()
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    window.location.href = '/admin/login.html'
    return null
  }
  return profile
}

// ── Page dashboard (candidat + ambassadrice, pas admin) ───────
export async function requireDashboard() {
  const session = await requireAuth('/dashboard/login.html')
  if (!session) return null
  const profile = await getProfile()
  if (!profile) {
    window.location.href = '/dashboard/login.html'
    return null
  }
  if (['admin', 'superadmin'].includes(profile.role)) {
    window.location.href = '/admin/dashboard.html'
    return null
  }
  return profile
}

// ── Page login — redirige si déjà connecté ────────────────────
export async function requireGuest() {
  const session = await getSession()
  if (!session) return  // pas connecté → OK rester sur login
  const profile = await getProfile()
  if (!profile) return
  if (['admin', 'superadmin'].includes(profile.role)) {
    window.location.href = '/admin/dashboard.html'
  } else {
    window.location.href = '/dashboard/index.html'
  }
}