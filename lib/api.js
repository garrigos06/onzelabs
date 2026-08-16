'use client'

export function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('fcu_token') : null }
export function setToken(t) { localStorage.setItem('fcu_token', t) }
export function clearToken() { localStorage.removeItem('fcu_token') }

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const t = getToken()
  if (t) headers.Authorization = 'Bearer ' + t
  const res = await fetch('/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Erro na requisi\u00e7\u00e3o')
  return data
}

export const eur = (m) => {
  if (m == null) return '\u2014'
  if (m >= 1) return `\u20ac${m % 1 === 0 ? m : m.toFixed(1)}M`
  return `\u20ac${Math.round(m * 1000)}K`
}
export const wageFmt = (w) => (w == null ? '\u2014' : `\u20ac${w}K/sem`)

export function realismColor(score) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-lime-400'
  if (score >= 40) return 'text-amber-400'
  if (score >= 20) return 'text-orange-400'
  return 'text-red-400'
}
export function realismBg(score) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-lime-500'
  if (score >= 40) return 'bg-amber-500'
  if (score >= 20) return 'bg-orange-500'
  return 'bg-red-500'
}
export const roleColors = {
  STAR: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  IMPORTANT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ROTATION: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  SQUAD: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  PROSPECT: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
}
export function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase()
}
