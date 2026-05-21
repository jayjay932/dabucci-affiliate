// Placeholder: logique dashboard ambassadrice.
// dashboard/dashboard.js
// Logique partagée pour toutes les pages du dashboard ambassadrice
import { requireDashboard, getMyStatus } from '../js/guards.js'
import { supabase }                      from '../js/supabase.js'
import { signOut, updateProfile }        from '../js/auth.js'
import { toast }                         from '../js/toast.js'
import { formatEuro, formatDate, formatMois, daysUntil, initials } from '../js/utils.js'

// ── Initialisation commune ────────────────────────────────────
export async function initPage() {
  const profile = await requireDashboard()
  if (!profile) return null
  return profile
}

// ── Charger les données ambassadrice ──────────────────────────
export async function loadAmbaData(userId) {
  const { data, error } = await supabase
    .from('ambassadrices')
    .select(`
      id, statut, activated_at,
      affiliate_links ( id, code, taux_commission, url_complete ),
      payment_info ( * )
    `)
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

// ── Charger les stats commissions ────────────────────────────
export async function loadStats(linkId, ambaId) {
  const [commsRes, codesRes, nextPayRes] = await Promise.all([
    supabase.from('commissions').select('montant_commission, statut, created_at')
      .eq('affiliate_link_id', linkId),
    supabase.from('commissions').select('id', { count: 'exact', head: true })
      .eq('affiliate_link_id', linkId),
    supabase.from('paiements').select('montant, date_prevue')
      .eq('ambassadrice_id', ambaId).eq('statut', 'a_venir')
      .order('date_prevue', { ascending: true }).limit(1).single()
  ])

  const validees   = commsRes.data?.filter(c => c.statut === 'validee') || []
  const totalGains = validees.reduce((s, c) => s + c.montant_commission, 0)

  return {
    codes:      codesRes.count  || 0,
    ventes:     validees.length,
    totalGains,
    commissions: commsRes.data  || [],
    nextPay:    nextPayRes.data  || null,
  }
}

// ── Grouper commissions par mois ─────────────────────────────
export function groupByMonth(commissions) {
  const byMonth = {}
  commissions.filter(c => c.statut === 'validee').forEach(c => {
    const k = c.created_at.slice(0, 7)
    if (!byMonth[k]) byMonth[k] = { gains: 0, ventes: 0 }
    byMonth[k].gains  += c.montant_commission
    byMonth[k].ventes += 1
  })
  return Object.entries(byMonth).sort(([a],[b]) => b.localeCompare(a))
}

// ── Rendre une liste mois/gains ───────────────────────────────
export function renderMonthList(containerId, months) {
  const el = document.getElementById(containerId)
  if (!el) return
  el.innerHTML = ''
  if (!months.length) {
    el.innerHTML = '<div class="month-row" style="justify-content:center;color:var(--gray-400);font-size:var(--text-sm)">Aucune vente pour le moment</div>'
    return
  }
  months.forEach(([k, d]) => {
    const row = document.createElement('div')
    row.className = 'month-row'
    row.innerHTML = `
      <span class="month-row__label">${formatMois(k + '-01')}</span>
      <span class="month-row__right">
        <div style="text-align:right">
          <div class="month-row__value">${formatEuro(d.gains)}</div>
          <div class="month-row__unit">${d.ventes} vente${d.ventes > 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--gray-300);font-size:18px">›</span>
      </span>`
    el.appendChild(row)
  })
}

// ── Copier le lien affilié ────────────────────────────────────
export async function copyAffiliateLink(code) {
  try {
    await navigator.clipboard.writeText(`https://dabucci.com/${code}`)
    toast.success('Lien copié !')
    return true
  } catch {
    toast.error('Impossible de copier.')
    return false
  }
}

// ── Remplir les champs texte ──────────────────────────────────
export function set(id, val) {
  const el = document.getElementById(id)
  if (el) el.textContent = val || '—'
}

// ── Rendre la liste de paiements ─────────────────────────────
export function renderPayList(containerId, items, type) {
  const el = document.getElementById(containerId)
  if (!el) return
  el.innerHTML = ''
  if (!items.length) {
    el.innerHTML = `<div class="pay-row" style="justify-content:center;color:var(--gray-400);font-size:var(--text-sm)">Aucun paiement</div>`
    return
  }
  items.forEach(p => {
    const method = p.methode === 'paypal' ? 'PayPal' : 'Virement bancaire'
    const badge  = type === 'paye'
      ? '<span class="badge-paye">Payé</span>'
      : '<span class="badge-avenir">À venir</span>'
    const row = document.createElement('div')
    row.className = 'pay-row'
    row.innerHTML = `
      <span style="font-size:18px">${type === 'paye' ? '🏦' : '🕐'}</span>
      <div class="pay-row__info">
        <div class="pay-row__date">${formatDate(type === 'paye' ? (p.date_effectuee || p.date_prevue) : p.date_prevue)}</div>
        <div class="pay-row__method">${method}</div>
      </div>
      <div class="pay-row__right">
        <div class="pay-row__amount">${formatEuro(p.montant)}</div>
        <div style="margin-top:4px">${badge}</div>
      </div>`
    el.appendChild(row)
  })
}

// ── Formater jours restants ───────────────────────────────────
export function daysLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null) return '—'
  if (d === 0)   return "Aujourd'hui"
  if (d < 0)     return 'Dépassé'
  return `Dans ${d} jour${d > 1 ? 's' : ''}`
}

// ── Exporter les helpers pour usage inline ────────────────────
export { formatEuro, formatDate, formatMois, daysUntil, initials, supabase, signOut, updateProfile, toast }