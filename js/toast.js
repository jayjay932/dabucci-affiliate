// Placeholder: notifications UI (toast).
function show(msg, type='success') {
  let c = document.querySelector('.toast-container')
  if (!c) { c=document.createElement('div'); c.className='toast-container'; document.body.appendChild(c) }
  const t = document.createElement('div')
  t.className = `toast toast--${type}`
  t.innerHTML = `<span>${msg}</span><button class="toast__close" onclick="this.parentElement.remove()">✕</button>`
  c.appendChild(t)
  setTimeout(()=>{ t.classList.add('toast--out'); setTimeout(()=>t.remove(),300) },4000)
}
export const toast = {
  success: m=>show(m,'success'),
  error:   m=>show(m,'error'),
  info:    m=>show(m),
  warning: m=>show(m,'warning')
}