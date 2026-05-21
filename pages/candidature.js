// Placeholder: logique d'insertion des candidatures.
// pages/candidature.js
import { supabase }    from '../js/supabase.js'
import { signUp }      from '../js/auth.js'
import { requireGuest } from '../js/guards.js'
import { toast }       from '../js/toast.js'

await requireGuest()

let step = 1

// ── Utilitaires ──────────────────────────────────────────────
function $(id)       { return document.getElementById(id) }
function txt(id,val) { const el=$(id); if(el) el.textContent = val||'—' }
function val(id)     { return $(id)?.value?.trim()||'' }

function setErr(inputId, show, errId) {
  $(inputId)?.classList.toggle('form-input--error', show)
  const e = $(errId)
  if (e) e.style.display = show ? 'block' : 'none'
}

// ── Toggle mot de passe ───────────────────────────────────────
window.togglePwd = function(id, btn) {
  const el = $(id)
  el.type = el.type === 'password' ? 'text' : 'password'
  btn.textContent = el.type === 'password' ? '👁' : '🙈'
}

// ── Navigation étapes ─────────────────────────────────────────
window.goToStep = function(n) {
  $(`step-${step}`)?.classList.add('hidden')
  $(`step-${n}`)?.classList.remove('hidden')
  document.querySelectorAll('.progress-dot').forEach((d, i) => {
    d.classList.remove('progress-dot--active', 'progress-dot--done')
    if (i + 1 < n)      d.classList.add('progress-dot--done')
    else if (i + 1 === n) d.classList.add('progress-dot--active')
  })
  step = n
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── Étape 1 → 2 ───────────────────────────────────────────────
window.goToStep2 = function() {
  const nom     = val('nom')
  const prenom  = val('prenom')
  const email   = val('email')
  const pwd     = $('password')?.value || ''
  const age     = parseInt($('age')?.value)
  const niche   = $('niche')?.value
  const tiktok  = val('tiktok')

  let ok = true
  setErr('nom',     !nom,    'err-nom');    if (!nom)    ok = false
  setErr('prenom',  !prenom, 'err-prenom'); if (!prenom) ok = false

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  setErr('email',   !emailOk, 'err-email'); if (!emailOk) ok = false

  setErr('password', pwd.length < 8, 'err-password'); if (pwd.length < 8) ok = false
  setErr('age',  !age || age < 18, 'err-age');  if (!age || age < 18) ok = false
  setErr('niche', !niche, 'err-niche');           if (!niche) ok = false

  if (tiktok && !tiktok.includes('tiktok.com')) {
    setErr('tiktok', true, 'err-tiktok'); ok = false
  } else { setErr('tiktok', false, 'err-tiktok') }

  if (!ok) return

  txt('recap-nom',    `${prenom} ${nom}`)
  txt('recap-email',  email)
  txt('recap-tiktok', tiktok || '—')
  txt('recap-niche',  niche)
  window.goToStep(2)
}

// ── Soumission finale ─────────────────────────────────────────
window.handleSubmit = async function() {
  const btn = $('btn-submit')
  btn.classList.add('btn--loading'); btn.disabled = true

  try {
    const nom        = val('nom')
    const prenom     = val('prenom')
    const email      = val('email')
    const password   = $('password').value
    const tiktok     = val('tiktok')
    const age        = parseInt($('age').value)
    const niche      = $('niche').value
    const motivation = val('motivation')

    // 1. Créer le compte Supabase Auth + profil (via trigger)
    const { user, session } = await signUp({ email, password, nom, prenom })
    if (!user) throw new Error('Erreur création du compte.')

    // 2. Insérer la candidature
    const { error } = await supabase.from('applications').insert({
      user_id:            user.id,
      tiktok_url:         tiktok || null,
      age,
      niche,
      message_motivation: motivation || null,
    })
    if (error) throw error

    // 3. Redirection vers page de confirmation
    window.location.replace('/pages/confirmation.html')

  } catch(e) {
    toast.error(e.message || 'Une erreur est survenue.')
    btn.classList.remove('btn--loading')
    btn.disabled = false
  }
}

// ── Compteur motivation ────────────────────────────────────────
$('motivation')?.addEventListener('input', function() {
  txt('count', this.value.length)
})