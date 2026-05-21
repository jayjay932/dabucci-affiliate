// Placeholder: utilitaires JS (formatEuro, formatDate...).
export function formatEuro(n) {
  return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n??0)
}
export function formatDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(d))
}
export function formatMois(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'}).format(new Date(d))
}
export function formatDateShort(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short'}).format(new Date(d))
}
export function daysUntil(d) {
  if (!d) return null
  return Math.ceil((new Date(d)-new Date())/86400000)
}
export function initials(nom, prenom) {
  return ((prenom?.[0]||'')+(nom?.[0]||'')).toUpperCase()||'?'
}
export async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true }
  catch { return false }
}
export function debounce(fn, ms=300) {
  let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms) }
}