// Deterministic REALISM SCORE engine. IA apenas explica depois.
// Mapeia reputacao de clube (40-95) para OVR alvo tipico do elenco.
function targetOvrForRep(rep) {
  return 0.78 * rep + 17
}

export function clamp(n, a, b) { return Math.max(a, Math.min(b, n)) }

// player: { ovr, pot, age, value, wage, position }
// fromClub / toClub: { name, reputation, budget, transferBudget?, rivals:[names] }
// opts: { fee (M), wage (K/wk), positionNeed: 0..1, wageCeiling (K) }
export function computeRealism({ player, fromClub, toClub, fee, wage, positionNeed = 0.5, wageCeiling }) {
  const factors = []
  let score = 55

  const targetOvr = targetOvrForRep(toClub.reputation)
  const diff = player.ovr - targetOvr

  // 1. Nivel tecnico vs clube destino
  if (diff >= -3 && diff <= 2) { score += 16; factors.push({ label: 'Nível técnico ideal para o clube', impact: 16 }) }
  else if (diff > 2 && diff <= 4) { score += 6; factors.push({ label: 'Reforço acima da média — ambicioso mas plausível', impact: 6 }) }
  else if (diff > 4) {
    const pen = clamp(Math.round((diff - 4) * 6), 8, 45)
    score -= pen
    factors.push({ label: `Craque muito acima do nível do elenco (não desceria de nível)`, impact: -pen })
  } else if (diff < -3 && diff >= -7) { score -= 8; factors.push({ label: 'Abaixo do nível ideal do elenco', impact: -8 }) }
  else { const pen = clamp(Math.round((-diff - 7) * 3), 6, 22); score -= pen; factors.push({ label: 'Muito abaixo do nível do clube', impact: -pen }) }

  // 2. Salto de reputacao (clube atual -> destino)
  if (fromClub) {
    const step = toClub.reputation - fromClub.reputation
    if (step >= 3) { score += 10; factors.push({ label: `Passo à frente na carreira (${fromClub.name} → ${toClub.name})`, impact: 10 }) }
    else if (step <= -12) { const pen = clamp(Math.round((-step) * 0.8), 8, 30); score -= pen; factors.push({ label: 'Queda grande de patamar de clube', impact: -pen }) }
    else if (step < 0) { score -= 4; factors.push({ label: 'Leve queda de patamar', impact: -4 }) }
    else { score += 3; factors.push({ label: 'Movimento lateral coerente', impact: 3 }) }
  }

  // 3. Capacidade financeira (fee)
  const budget = (toClub.transferBudget ?? toClub.budget) || 0
  if (fee != null) {
    if (fee > budget) { const pen = clamp(Math.round(((fee - budget) / Math.max(budget, 1)) * 40) + 15, 15, 50); score -= pen; factors.push({ label: `Acima do orçamento (€${fee}M vs €${Math.round(budget)}M disponível)`, impact: -pen }) }
    else if (fee > budget * 0.7) { score -= 6; factors.push({ label: 'Investimento pesado para o orçamento', impact: -6 }) }
    else { score += 6; factors.push({ label: 'Custo dentro da realidade financeira', impact: 6 }) }
  }

  // 4. Salario
  const ceiling = wageCeiling ?? Math.round(80 * (toClub.reputation / 85) + 40)
  if (wage != null) {
    if (wage > ceiling * 1.25) { const pen = clamp(Math.round((wage / ceiling - 1) * 30), 8, 30); score -= pen; factors.push({ label: 'Salário acima da estrutura salarial do clube', impact: -pen }) }
    else if (wage <= ceiling) { score += 4; factors.push({ label: 'Salário compatível', impact: 4 }) }
  }

  // 5. Idade
  if (player.age <= 23) { score += 8; factors.push({ label: 'Jovem com margem de evolução', impact: 8 }) }
  else if (player.age <= 28) { score += 3; factors.push({ label: 'Idade de auge', impact: 3 }) }
  else if (player.age >= 33 && (fee || 0) > 25) { score -= 12; factors.push({ label: 'Veterano por valor alto (baixa revenda)', impact: -12 }) }
  else if (player.age >= 31) { score -= 4; factors.push({ label: 'Idade avançada', impact: -4 }) }

  // 6. Necessidade de posicao
  if (positionNeed >= 0.7) { score += 10; factors.push({ label: 'Posição prioritária no elenco', impact: 10 }) }
  else if (positionNeed <= 0.2) { score -= 6; factors.push({ label: 'Posição já bem servida', impact: -6 }) }

  // 7. Rivalidade
  const rivals = (toClub.rivals || []).map(r => r.toLowerCase())
  if (fromClub && rivals.includes((fromClub.name || '').toLowerCase())) {
    score -= 30
    factors.push({ label: `Transferência entre rivais (${fromClub.name} → ${toClub.name})`, impact: -30 })
  }

  score = Math.round(clamp(score, 1, 99))
  let verdict = 'PLAUSÍVEL'
  if (score >= 80) verdict = 'MUITO REALISTA'
  else if (score >= 60) verdict = 'REALISTA'
  else if (score >= 40) verdict = 'ARRISCADO'
  else if (score >= 20) verdict = 'IMPROVÁVEL'
  else verdict = 'IRREALISTA'

  let difficulty = 'MÉDIA'
  const gap = player.ovr - targetOvr
  if (gap > 3 || (fee || 0) > budget * 0.6) difficulty = 'ALTA'
  else if (gap < -2 && (fee || 0) < budget * 0.25) difficulty = 'BAIXA'

  factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
  return { score, verdict, difficulty, factors }
}
