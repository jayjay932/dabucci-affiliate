// Placeholder: logique admin.
// admin/admin.js
// Logique partagée pour toutes les pages admin
import { requireAdmin }  from '../js/guards.js'
import { supabase }      from '../js/supabase.js'
import { signOut }       from '../js/auth.js'
import { toast }         from '../js/toast.js'
import { formatEuro, formatDate, formatMois, initials } from '../js/utils.js'

// ── Init commune admin ────────────────────────────────────────
export async function initAdmin() {
  const profile = await requireAdmin()
  if (!profile) return null

  // Nom admin dans sidebar
  const nameEl = document.getElementById('admin-name')
  if (nameEl) nameEl.textContent = `${profile.prenom||''} ${profile.nom||''}`.trim()

  // Bouton déconnexion
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (confirm('Se déconnecter ?')) await signOut()
  })

  // Fermer les modals en cliquant l'overlay
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.add('hidden') })
  })

  return profile
}

// ── Accepter une candidature ──────────────────────────────────
export async function accepterCandidature(appId, adminId, code, taux) {
  const { error } = await supabase.rpc('accepter_candidature', {
    p_application_id: appId,
    p_admin_id:       adminId,
    p_code_affilie:   code.toLowerCase().replace(/[^a-z0-9]/g, ''),
    p_taux:           taux,
  })
  if (error) throw error
}

// ── Refuser une candidature ───────────────────────────────────
export async function refuserCandidature(appId, adminId, note = null) {
  const { error } = await supabase.rpc('refuser_candidature', {
    p_application_id: appId,
    p_admin_id:       adminId,
    p_note:           note,
  })
  if (error) throw error
}

// ── Marquer un paiement comme payé ───────────────────────────
export async function marquerPaye(payId, reference, note = null) {
  const { error } = await supabase.from('paiements').update({
    statut:             'paye',
    date_effectuee:     new Date().toISOString(),
    reference_virement: reference,
    notes_admin:        note || null,
  }).eq('id', payId)
  if (error) throw error
}

// ── Toggle statut ambassadrice ────────────────────────────────
export async function toggleStatutAmba(ambaId, currentStatut) {
  const newStatut = currentStatut === 'active' ? 'suspendue' : 'active'
  const { error } = await supabase.from('ambassadrices').update({ statut: newStatut }).eq('id', ambaId)
  if (error) throw error
  return newStatut
}

// ── Charger les KPIs du dashboard ────────────────────────────
export async function loadKPIs() {
  const [ambaRes, pendingRes, commsRes] = await Promise.all([
    supabase.from('ambassadrices').select('id', { count: 'exact', head: true }).eq('statut', 'active'),
    supabase.from('v_candidatures').select('*').eq('statut', 'en_attente').order('submitted_at', { ascending: false }),
    supabase.from('commissions').select('montant_commission').eq('statut', 'validee'),
  ])

  return {
    ambasActives: ambaRes.count || 0,
    pending:      pendingRes.data || [],
    totalGains:   commsRes.data?.reduce((s,c) => s + c.montant_commission, 0) || 0,
    totalVentes:  commsRes.data?.length || 0,
  }
}

// ── Rendre la sidebar badge (candidatures en attente) ─────────
export function updateSidebarBadge(count) {
  const badge = document.getElementById('sidebar-badge')
  if (!badge) return
  if (count > 0) { badge.textContent = count; badge.classList.remove('hidden') }
  else { badge.classList.add('hidden') }
}

// ── Générer un code affilié depuis un prénom ──────────────────
export function generateCode(prenom) {
  return (prenom + Math.floor(Math.random() * 90 + 10)).toLowerCase().replace(/[^a-z0-9]/g, '')
}

// ── Rendre le tableau des paiements à effectuer ───────────────
export function renderPayTable(tbody, pays) {
  tbody.innerHTML = ''
  if (!pays?.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:var(--space-8)">Aucun paiement à effectuer</td></tr>'
    return
  }
  pays.forEach(p => {
    const pr   = p.ambassadrices?.profiles
    const name = `${pr?.prenom||''} ${pr?.nom||''}`.trim() || '—'
    const tr   = document.createElement('tr')
    tr.innerHTML = `
      <td><strong>${name}</strong></td>
      <td style="font-weight:700;color:var(--color-primary)">${formatEuro(p.montant)}</td>
      <td>${p.methode === 'paypal' ? 'PayPal' : 'Virement'}</td>
      <td>${formatDate(p.date_prevue)}</td>
      <td><span class="badge badge--warning">À venir</span></td>
      <td></td>`
    const btn = document.createElement('button')
    btn.className   = 'btn btn--primary btn--sm'
    btn.textContent = 'Marquer payé'
    btn.addEventListener('click', () => openPayModal(p.id, name, p.montant, p.ambassadrices?.payment_info?.methode || '', ''))
    tr.querySelector('td:last-child').appendChild(btn)
    tbody.appendChild(tr)
  })
}

// ── Rendre la liste de candidatures en attente ───────────────
export function renderPendingList(container, pending, onAccept, onRefuse) {
  container.innerHTML = ''
  if (!pending.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--gray-400);font-size:var(--text-sm);padding:var(--space-8)">Aucune candidature en attente</div>'
    return
  }
  pending.slice(0, 5).forEach(c => {
    const ini = ((c.prenom?.[0]||'') + (c.nom?.[0]||'')).toUpperCase()
    const row = document.createElement('div'); row.className = 'pending-row'
    row.innerHTML = `
      <div class="pending-row__avatar">${ini}</div>
      <div class="pending-row__info">
        <div class="pending-row__name">${c.prenom||''} ${c.nom||''}</div>
        <div class="pending-row__meta">${c.niche} · ${c.age} ans</div>
      </div>`
    const acts = document.createElement('div'); acts.className = 'pending-row__actions'
    const ba = document.createElement('button'); ba.className = 'btn-accept'; ba.textContent = '✓ Accepter'
    ba.addEventListener('click', () => onAccept(c.id, c.prenom||'', c.nom||''))
    const br = document.createElement('button'); br.className = 'btn-refuse'; br.textContent = '✕ Refuser'
    br.addEventListener('click', () => onRefuse(c.id, br))
    acts.append(ba, br); row.appendChild(acts); container.appendChild(row)
  })
}

// ── Rendre le top ambassadrices ───────────────────────────────
export function renderTopAmbas(container, tops) {
  container.innerHTML = ''
  if (!tops?.length) {
    container.innerHTML = '<div style="text-align:center;color:var(--gray-400);font-size:var(--text-sm);padding:var(--space-8)">Aucune ambassadrice</div>'
    return
  }
  const colors = ['#F59E0B', 'var(--gray-400)', '#B45309']
  tops.forEach((a, i) => {
    const ini = ((a.prenom?.[0]||'') + (a.nom?.[0]||'')).toUpperCase()
    const row = document.createElement('div'); row.className = 'pending-row'
    row.innerHTML = `
      <div style="width:24px;font-size:var(--text-sm);font-weight:700;color:${colors[i]||'var(--gray-300)'};text-align:center">${i+1}</div>
      <div class="pending-row__avatar">${ini}</div>
      <div class="pending-row__info">
        <div class="pending-row__name">${a.prenom||''} ${a.nom||''}</div>
        <div class="pending-row__meta">${a.ventes_total} ventes · ${a.code_affilie||''}</div>
      </div>
      <div style="font-size:var(--text-sm);font-weight:700;color:var(--color-primary)">${formatEuro(a.gains_total)}</div>`
    container.appendChild(row)
  })
}

// ── Modal accepter (réutilisable) ─────────────────────────────
export function openAcceptModal(appId, prenom, nom) {
  const modal = document.getElementById('modal-accept')
  if (!modal) return
  document.getElementById('accept-app-id').value = appId
  const code = generateCode(prenom)
  document.getElementById('accept-code').value = code
  const prev = document.getElementById('code-prev')
  if (prev) prev.textContent = code
  document.getElementById('accept-taux').value = '15'
  modal.classList.remove('hidden')
}

export function closeAcceptModal() {
  document.getElementById('modal-accept')?.classList.add('hidden')
}

// ── Ouvrir/fermer une modal générique ─────────────────────────
export function openModal(id)  { document.getElementById(id)?.classList.remove('hidden') }
export function closeModal(id) { document.getElementById(id)?.classList.add('hidden') }

// ── Ouvrir modal paiement (tableau de bord / paiements admin) ─
export function openPayModal(id, name, montant, methode, coord) {
  document.getElementById('pay-id').value = id
  document.getElementById('pay-ref').value = `VIR-${Date.now()}`
  const noteEl = document.getElementById('pay-note')
  if (noteEl) noteEl.value = ''
  const infoEl = document.getElementById('pay-info')
  if (infoEl) infoEl.innerHTML = `
    <div class="info-pill__label">Ambassadrice</div><div class="info-pill__value">${name}</div>
    <div style="margin-top:var(--space-2)"><div class="info-pill__label">Montant</div><div class="info-pill__value" style="color:var(--color-primary)">${parseFloat(montant).toFixed(2)} €</div></div>
    <div style="margin-top:var(--space-2)"><div class="info-pill__label">${methode === 'paypal' ? 'PayPal' : 'IBAN'}</div><div class="info-pill__value" style="font-family:var(--font-mono);font-size:var(--text-sm)">${coord}</div></div>`
  openModal('modal-pay')
}

// ── Exporter tout ce qu'il faut ───────────────────────────────
export { supabase, signOut, toast, formatEuro, formatDate, formatMois, initials }