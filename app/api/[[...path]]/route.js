import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '@/lib/db'
import { callLLM } from '@/lib/llm'
import { computeRealism } from '@/lib/realismEngine'
import { buildSeed, estValue, estWage } from '@/lib/seedData'

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}
function json(data, status = 200) { return cors(NextResponse.json(data, { status })) }
export async function OPTIONS() { return cors(new NextResponse(null, { status: 200 })) }

const uid = () => crypto.randomUUID()
const clean = (d) => { if (!d) return d; const { _id, ...rest } = d; return rest }
const cleanArr = (a) => (a || []).map(clean)

function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex')
  const h = crypto.scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${h}`
}
function verifyPw(pw, stored) {
  try { const [salt, h] = stored.split(':'); return crypto.scryptSync(pw, salt, 64).toString('hex') === h } catch { return false }
}

async function ensureSeed(db) {
  const c = await db.collection('clubs').countDocuments()
  if (c === 0) {
    const { clubs, players } = buildSeed()
    await db.collection('clubs').insertMany(clubs)
    await db.collection('players').insertMany(players)
    await db.collection('clubs').createIndex({ name: 1 })
    await db.collection('players').createIndex({ clubId: 1 })
    await db.collection('players').createIndex({ ovr: -1 })
  }
}

async function getUser(db, request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const s = await db.collection('sessions').findOne({ token })
  if (!s) return null
  return await db.collection('users').findOne({ id: s.userId })
}

// ---------- hierarquia do elenco ----------
function assignHierarchy(squad) {
  const sorted = [...squad].sort((a, b) => b.ovr - a.ovr)
  const avg = squad.reduce((s, p) => s + p.ovr, 0) / Math.max(1, squad.length)
  const rankMap = {}
  sorted.forEach((p, i) => { rankMap[p.id] = i })
  return squad.map(p => {
    const rank = rankMap[p.id]
    let role = 'SQUAD'
    if (rank < 3 && p.ovr >= avg + 2) role = 'STAR'
    else if (p.age <= 21 && (p.pot - p.ovr) >= 4) role = 'PROSPECT'
    else if (rank < 11) role = 'IMPORTANT'
    else if (p.ovr >= avg - 4) role = 'ROTATION'
    return { ...p, role, morale: p.morale ?? 70 + Math.floor(Math.random() * 20), form: p.form ?? 60 + Math.floor(Math.random() * 30) }
  })
}

function posBucket(pos) {
  if (pos === 'GK') return 'GK'
  if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(pos)) return 'DEF'
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID'
  return 'ATT'
}

function positionNeed(squad, pos) {
  const bucket = posBucket(pos)
  const inBucket = squad.filter(p => posBucket(p.position) === bucket)
  if (inBucket.length <= 2) return 0.9
  const strong = inBucket.filter(p => p.role === 'STAR' || p.role === 'IMPORTANT').length
  if (strong >= 4) return 0.2
  if (strong >= 3) return 0.4
  if (strong <= 1) return 0.8
  return 0.55
}

function initStandings(clubs, careerClubId) {
  return clubs.map(c => ({ clubId: c.id, name: c.name, color: c.color, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0, isUser: c.id === careerClubId }))
}

function makeNextMatch(career, leagueClubs) {
  const others = leagueClubs.filter(c => c.id !== career.clubId)
  const opp = others[Math.floor(Math.random() * others.length)]
  const home = Math.random() < 0.5
  return { opponentClubId: opp.id, opponentName: opp.name, opponentColor: opp.color, competition: career.club.league, homeAway: home ? 'home' : 'away' }
}

// ---------------- MAIN ----------------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = '/' + path.join('/')
  const method = request.method
  let body = {}
  if (['POST', 'PUT', 'PATCH'].includes(method)) { try { body = await request.json() } catch { body = {} } }

  try {
    const db = await getDb()
    await ensureSeed(db)

    // ---------------- AUTH ----------------
    if (route === '/auth/register' && method === 'POST') {
      const { email, password, name } = body
      if (!email || !password) return json({ error: 'Email e senha obrigat\u00f3rios' }, 400)
      const exists = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (exists) return json({ error: 'Email j\u00e1 cadastrado' }, 400)
      const u = { id: uid(), email: email.toLowerCase(), name: name || email.split('@')[0], password: hashPw(password), plan: 'FREE', createdAt: new Date() }
      await db.collection('users').insertOne(u)
      const token = uid() + uid()
      await db.collection('sessions').insertOne({ token, userId: u.id, createdAt: new Date() })
      return json({ token, user: { id: u.id, email: u.email, name: u.name, plan: u.plan } })
    }

    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = body
      const u = await db.collection('users').findOne({ email: (email || '').toLowerCase() })
      if (!u || !verifyPw(password, u.password)) return json({ error: 'Credenciais inv\u00e1lidas' }, 401)
      const token = uid() + uid()
      await db.collection('sessions').insertOne({ token, userId: u.id, createdAt: new Date() })
      return json({ token, user: { id: u.id, email: u.email, name: u.name, plan: u.plan } })
    }

    // ---------------- PUBLIC DATA ----------------
    if (route === '/clubs' && method === 'GET') {
      const clubs = await db.collection('clubs').find({}).sort({ reputation: -1 }).toArray()
      return json(cleanArr(clubs))
    }

    // ---------------- AUTH REQUIRED ----------------
    const user = await getUser(db, request)
    const needAuth = route.startsWith('/me') || route.startsWith('/careers')
    if (needAuth && !user) return json({ error: 'N\u00e3o autenticado' }, 401)

    if (route === '/me' && method === 'GET') {
      const careers = await db.collection('careers').find({ userId: user.id }).sort({ createdAt: -1 }).toArray()
      return json({ user: { id: user.id, email: user.email, name: user.name, plan: user.plan }, careers: cleanArr(careers).map(summarizeCareer) })
    }

    if (route === '/careers' && method === 'POST') {
      const { clubId, managerName, universeMode = 'REALISTA', budget, season = '2026/27', difficulty = 'Legend', currency = 'EUR' } = body
      const club = await db.collection('clubs').findOne({ id: clubId })
      if (!club) return json({ error: 'Clube n\u00e3o encontrado' }, 400)
      const rawSquad = await db.collection('players').find({ clubId }).toArray()
      const squad = assignHierarchy(cleanArr(rawSquad))
      const leagueClubs = cleanArr(await db.collection('clubs').find({ league: club.league }).toArray())

      const wageWeekly = squad.reduce((s, p) => s + (p.wage || 0), 0)
      const transferBudget = budget != null ? Number(budget) : Math.round(club.budget)
      const clubSnap = { id: club.id, name: club.name, league: club.league, country: club.country, color: club.color, reputation: club.reputation, stadium: club.stadium, rivals: club.rivals, budget: club.budget }

      const career = {
        id: uid(), userId: user.id, clubId, club: clubSnap, managerName: managerName || user.name,
        universeMode, season, difficulty, currency, createdAt: new Date(), squad,
        finances: {
          transferBudget, wageWeekly, wageBudgetWeekly: Math.round(wageWeekly * 1.2), balance: Math.round(club.budget * 0.4),
          income: { tv: Math.round(club.reputation * 1.6), matchday: Math.round(club.reputation * 0.9), commercial: Math.round(club.reputation * 1.2), sales: 0, prize: 0 },
          expenses: { wages: Math.round(wageWeekly * 52 / 1000), transfers: 0, other: Math.round(club.reputation * 0.5) },
          ffpStatus: 'GREEN',
        },
        standings: initStandings(leagueClubs, clubId),
        managerTrust: 65, boardConfidence: 70, fanSentiment: 68, mediaPressure: 'MEDIUM',
        objectives: [], stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 },
      }
      career.nextMatch = makeNextMatch(career, leagueClubs)
      career.objectives = await generateObjectives(club, season).catch(() => fallbackObjectives(club))

      await db.collection('careers').insertOne(career)
      await addNews(db, career.id, {
        headline: `${career.managerName} assume o comando do ${club.name}`,
        body: `In\u00edcio de uma nova era no ${club.stadium}. A diretoria e a torcida acompanham com expectativa a temporada ${season}.`,
        tag: 'CLUBE', source: 'Career News Network',
      })
      await addEvent(db, career.id, { type: 'career_started', title: `Carreira iniciada no ${club.name}`, season })
      return json(clean(career))
    }

    if (route === '/careers' && method === 'GET') {
      const careers = await db.collection('careers').find({ userId: user.id }).sort({ createdAt: -1 }).toArray()
      return json(cleanArr(careers).map(summarizeCareer))
    }

    const cmatch = route.match(/^\/careers\/([^/]+)(\/.*)?$/)
    if (cmatch) {
      const careerId = cmatch[1]
      const sub = cmatch[2] || ''
      const career = await db.collection('careers').findOne({ id: careerId, userId: user.id })
      if (!career) return json({ error: 'Carreira n\u00e3o encontrada' }, 404)

      if (sub === '' && method === 'GET') {
        const news = cleanArr(await db.collection('news').find({ careerId }).sort({ createdAt: -1 }).limit(30).toArray())
        const events = cleanArr(await db.collection('events').find({ careerId }).sort({ createdAt: -1 }).limit(50).toArray())
        const transfers = cleanArr(await db.collection('transfers').find({ careerId }).sort({ createdAt: -1 }).limit(50).toArray())
        return json({ ...clean(career), news, events, transfers })
      }

      if (sub === '' && method === 'DELETE') {
        await db.collection('careers').deleteOne({ id: careerId })
        for (const col of ['news', 'events', 'transfers', 'ai_messages', 'matches']) await db.collection(col).deleteMany({ careerId })
        return json({ ok: true })
      }

      if (sub === '/scout' && method === 'POST') {
        const q = (body.query || '').slice(0, 500)
        const filters = await parseScoutQuery(q, career).catch(() => heuristicParse(q))
        const results = await runScout(db, career, filters)
        return json({ filters, results })
      }

      if (sub === '/scout-report' && method === 'POST') {
        const raw = await db.collection('players').findOne({ id: body.playerId })
        if (!raw) return json({ error: 'Jogador n\u00e3o encontrado' }, 404)
        const p = clean(raw)
        const fromClub = clean(await db.collection('clubs').findOne({ id: p.clubId })) || null
        const need = positionNeed(career.squad, p.position)
        const fee = Math.round(p.value * 1.15 * 10) / 10
        const realism = computeRealism({ player: p, fromClub, toClub: career.club, fee, wage: Math.round(p.wage * 1.1), positionNeed: need })
        const report = await generateScoutReport(p, fromClub, career, realism, fee).catch(() => fallbackReport(p, realism, fee))
        return json({ player: p, fromClub, realism, expectedFee: fee, expectedWage: Math.round(p.wage * 1.1), report })
      }

      if (sub === '/ai-chat' && method === 'POST') {
        const sessionId = body.sessionId || 'default'
        const message = (body.message || '').slice(0, 2000)
        const prev = cleanArr(await db.collection('ai_messages').find({ careerId, sessionId }).sort({ createdAt: 1 }).limit(20).toArray())
        const history = prev.map(m => ({ role: m.role, content: m.content }))
        const answer = await sportingDirectorReply(career, history, message).catch((e) => { console.error('AI chat', e); return 'No momento n\u00e3o consegui acessar a intelig\u00eancia. Tente novamente em instantes.' })
        const now = new Date()
        await db.collection('ai_messages').insertMany([
          { careerId, sessionId, role: 'user', content: message, createdAt: now },
          { careerId, sessionId, role: 'assistant', content: answer, createdAt: new Date(now.getTime() + 1) },
        ])
        return json({ answer })
      }
      if (sub === '/ai-chat' && method === 'GET') {
        const msgs = cleanArr(await db.collection('ai_messages').find({ careerId, sessionId: 'default' }).sort({ createdAt: 1 }).limit(40).toArray())
        return json({ messages: msgs.map(m => ({ role: m.role, content: m.content })) })
      }

      if (sub === '/matches' && method === 'POST') { return json(await recordMatch(db, career, body)) }
      if (sub === '/transfers' && method === 'POST') { return json(await doTransfer(db, career, body)) }

      if (sub === '/news/generate' && method === 'POST') {
        const art = await generateContextNews(db, career).catch(() => null)
        if (art) await addNews(db, career.id, art)
        const news = cleanArr(await db.collection('news').find({ careerId }).sort({ createdAt: -1 }).limit(30).toArray())
        return json({ news })
      }
    }

    return json({ error: `Rota ${route} n\u00e3o encontrada` }, 404)
  } catch (err) {
    console.error('API Error:', err)
    return json({ error: 'Erro interno: ' + (err.message || 'desconhecido') }, 500)
  }
}

// ================= helpers de dominio =================
function summarizeCareer(c) {
  return {
    id: c.id, clubName: c.club?.name, clubColor: c.club?.color, league: c.club?.league,
    managerName: c.managerName, season: c.season, universeMode: c.universeMode,
    squadSize: c.squad?.length || 0, managerTrust: c.managerTrust,
    played: c.stats?.played || 0, won: c.stats?.won || 0, createdAt: c.createdAt,
  }
}
async function addNews(db, careerId, art) { await db.collection('news').insertOne({ id: uid(), careerId, createdAt: new Date(), ...art }) }
async function addEvent(db, careerId, ev) { await db.collection('events').insertOne({ id: uid(), careerId, createdAt: new Date(), ...ev }) }

async function recordMatch(db, career, body) {
  const { opponentName, opponentClubId, competition, homeAway = 'home', goalsFor = 0, goalsAgainst = 0, scorers = [], date } = body
  const gf = Number(goalsFor), ga = Number(goalsAgainst)
  const result = gf > ga ? 'W' : gf === ga ? 'D' : 'L'

  const squad = career.squad.map(p => ({ ...p }))
  for (const s of scorers) {
    const idx = squad.findIndex(p => p.id === s.playerId)
    if (idx >= 0) {
      squad[idx].goals = (squad[idx].goals || 0) + (Number(s.goals) || 1)
      squad[idx].assists = (squad[idx].assists || 0) + (Number(s.assists) || 0)
      squad[idx].apps = (squad[idx].apps || 0) + 1
    }
  }

  const standings = (career.standings || []).map(row => {
    if (row.clubId === career.clubId) return applyRow(row, gf, ga, result)
    if (opponentClubId && row.clubId === opponentClubId) return applyRow(row, ga, gf, result === 'W' ? 'L' : result === 'L' ? 'W' : 'D')
    return row
  }).sort(sortStandings)

  const stats = career.stats || { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 }
  stats.played++; stats.gf += gf; stats.ga += ga
  if (result === 'W') stats.won++; else if (result === 'D') stats.drawn++; else stats.lost++

  let mt = career.managerTrust, fs = career.fanSentiment, bc = career.boardConfidence
  if (result === 'W') { mt = clampN(mt + 3); fs = clampN(fs + 4); bc = clampN(bc + 2) }
  else if (result === 'D') { mt = clampN(mt - 1); fs = clampN(fs - 1) }
  else { mt = clampN(mt - 4); fs = clampN(fs - 5); bc = clampN(bc - 3) }

  const leagueClubs = cleanArr(await db.collection('clubs').find({ league: career.club.league }).toArray())
  const nextMatch = makeNextMatch(career, leagueClubs)

  const matchDoc = { id: uid(), careerId: career.id, opponentName, competition, homeAway, gf, ga, result, scorers, date: date || null, season: career.season, createdAt: new Date() }
  await db.collection('matches').insertOne(matchDoc)
  await db.collection('careers').updateOne({ id: career.id }, { $set: { squad, standings, stats, managerTrust: mt, fanSentiment: fs, boardConfidence: bc, nextMatch } })
  await addEvent(db, career.id, { type: 'match_result', title: `${homeAway === 'home' ? career.club.name : opponentName} ${gf}-${ga} ${homeAway === 'home' ? opponentName : career.club.name}`, competition, result })

  try { const art = await matchNews(career, { opponentName, competition, gf, ga, result, scorers, homeAway }); if (art) await addNews(db, career.id, art) } catch (e) { console.error('matchNews', e) }
  return { match: matchDoc, standings, stats, managerTrust: mt, fanSentiment: fs, boardConfidence: bc, nextMatch }
}
function applyRow(row, gf, ga, res) {
  const r = { ...row }; r.P++; r.GF += gf; r.GA += ga
  if (res === 'W') { r.W++; r.Pts += 3 } else if (res === 'D') { r.D++; r.Pts += 1 } else { r.L++ }
  return r
}
function sortStandings(a, b) { return b.Pts - a.Pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF }
function clampN(n) { return Math.max(0, Math.min(100, Math.round(n))) }

async function doTransfer(db, career, body) {
  const { type = 'buy', playerId, fee = 0, wage, contractYears = 4 } = body
  const feeN = Number(fee) || 0
  const fin = { ...career.finances }
  let squad = [...career.squad]
  let transferDoc

  if (type === 'buy') {
    const raw = await db.collection('players').findOne({ id: playerId })
    if (!raw) return { error: 'Jogador n\u00e3o encontrado' }
    const p = clean(raw)
    const fromClub = clean(await db.collection('clubs').findOne({ id: p.clubId }))
    const newP = { ...p, clubId: career.clubId, club: career.club.name, wage: wage != null ? Number(wage) : p.wage, contractUntil: 2026 + Number(contractYears), goals: 0, assists: 0, apps: 0 }
    squad = assignHierarchy([...squad, newP])
    fin.transferBudget = Math.round((fin.transferBudget - feeN) * 10) / 10
    fin.wageWeekly = squad.reduce((s, x) => s + (x.wage || 0), 0)
    fin.expenses = { ...fin.expenses, transfers: (fin.expenses.transfers || 0) + feeN }
    transferDoc = { id: uid(), careerId: career.id, type, playerName: p.name, playerId: p.id, fromClub: fromClub?.name, toClub: career.club.name, fee: feeN, season: career.season, createdAt: new Date() }
    await addNews(db, career.id, { headline: `${career.club.name} contrata ${p.name} por \u20ac${feeN}M`, body: `${p.name} (${p.position}, ${p.age} anos, OVR ${p.ovr}) chega vindo do ${fromClub?.name || 'mercado'} para refor\u00e7ar o elenco.`, tag: 'MERCADO', source: 'Transfer Desk' })
    await addEvent(db, career.id, { type: 'transfer_completed', title: `Contratou ${p.name} (\u20ac${feeN}M)` })
  } else if (type === 'sell') {
    const idx = squad.findIndex(p => p.id === playerId)
    if (idx < 0) return { error: 'Jogador n\u00e3o est\u00e1 no elenco' }
    const p = squad[idx]
    squad.splice(idx, 1)
    squad = assignHierarchy(squad)
    fin.transferBudget = Math.round((fin.transferBudget + feeN) * 10) / 10
    fin.wageWeekly = squad.reduce((s, x) => s + (x.wage || 0), 0)
    fin.income = { ...fin.income, sales: (fin.income.sales || 0) + feeN }
    transferDoc = { id: uid(), careerId: career.id, type, playerName: p.name, playerId: p.id, fromClub: career.club.name, toClub: body.toClub || 'Mercado', fee: feeN, season: career.season, createdAt: new Date() }
    await addNews(db, career.id, { headline: `${p.name} deixa o ${career.club.name} por \u20ac${feeN}M`, body: `Ap\u00f3s ${p.apps || 0} partidas, ${p.name} \u00e9 negociado. A diretoria refor\u00e7a o caixa em \u20ac${feeN}M.`, tag: 'MERCADO', source: 'Transfer Desk' })
    await addEvent(db, career.id, { type: 'player_sold', title: `Vendeu ${p.name} (\u20ac${feeN}M)` })
  }

  await db.collection('careers').updateOne({ id: career.id }, { $set: { squad, finances: fin } })
  await db.collection('transfers').insertOne(transferDoc)
  return { squad, finances: fin, transfer: transferDoc }
}

// ================= SCOUTING =================
function heuristicParse(q) {
  const t = (q || '').toLowerCase()
  const f = { maxAge: null, maxValue: null, minOvr: null, minPot: null, position: null, nationality: null }
  const posMap = { volante: 'CDM', 'meio-campo': 'CM', meia: 'CAM', meio: 'CM', zagueiro: 'CB', 'lateral esquerdo': 'LB', 'lateral direito': 'RB', lateral: 'RB', atacante: 'ST', centroavante: 'ST', ponta: 'RW', goleiro: 'GK' }
  for (const k of Object.keys(posMap)) if (t.includes(k)) { f.position = posMap[k]; break }
  if (t.includes('jovem') || t.includes('jovens') || t.includes('promessa')) f.maxAge = 23
  const mv = t.match(/(\d+)\s*(m|mi|milh|milhao|milhoes|milhões)/)
  if (mv) f.maxValue = Number(mv[1])
  const ov = t.match(/ovr\s*(\d+)/)
  if (ov) f.minOvr = Number(ov[1])
  return f
}

async function parseScoutQuery(q, career) {
  return await callLLM({
    system: `Voce converte pedidos de scouting de futebol em filtros JSON. Responda SOMENTE JSON.
Campos: position (GK,RB,LB,CB,CDM,CM,CAM,LM,RM,LW,RW,ST), maxAge (int), minAge (int), maxValue (milhoes EUR int), minOvr (int), minPot (int), nationality (string), keywords (string). Use null quando nao aplicavel.
Contexto do clube: ${career.club.name} (${career.club.league}), reputacao ${career.club.reputation}.`,
    messages: [{ role: 'user', content: q }],
    json: true, maxTokens: 300, temperature: 0.2,
  })
}

async function runScout(db, career, filters) {
  const query = { clubId: { $ne: career.clubId } }
  if (filters.position) {
    const bucketPos = { GK: ['GK'], CB: ['CB'], RB: ['RB', 'RWB'], LB: ['LB', 'LWB'], CDM: ['CDM', 'CM'], CM: ['CM', 'CDM', 'CAM'], CAM: ['CAM', 'CM'], RW: ['RW', 'RM'], LW: ['LW', 'LM'], RM: ['RM', 'RW'], LM: ['LM', 'LW'], ST: ['ST', 'CF'] }
    query.position = { $in: bucketPos[filters.position] || [filters.position] }
  }
  if (filters.maxAge) query.age = { ...(query.age || {}), $lte: filters.maxAge }
  if (filters.minAge) query.age = { ...(query.age || {}), $gte: filters.minAge }
  if (filters.maxValue) query.value = { $lte: filters.maxValue }
  if (filters.minOvr) query.ovr = { ...(query.ovr || {}), $gte: filters.minOvr }
  if (filters.minPot) query.pot = { $gte: filters.minPot }
  if (filters.nationality) query.nationality = new RegExp(filters.nationality, 'i')

  const candidates = cleanArr(await db.collection('players').find(query).sort({ ovr: -1 }).limit(80).toArray())
  const clubIds = [...new Set(candidates.map(c => c.clubId))]
  const clubs = cleanArr(await db.collection('clubs').find({ id: { $in: clubIds } }).toArray())
  const clubMap = {}; clubs.forEach(c => clubMap[c.id] = c)

  const scored = candidates.map(p => {
    const fromClub = clubMap[p.clubId] || null
    const need = positionNeed(career.squad, p.position)
    const fee = Math.round(p.value * 1.15 * 10) / 10
    const realism = computeRealism({ player: p, fromClub, toClub: career.club, fee, wage: Math.round(p.wage * 1.1), positionNeed: need })
    return { ...p, fromClubName: fromClub?.name, expectedFee: fee, realismScore: realism.score, realismVerdict: realism.verdict, difficulty: realism.difficulty, topFactor: realism.factors[0]?.label }
  })
  scored.sort((a, b) => (b.realismScore * 0.6 + b.ovr * 0.4) - (a.realismScore * 0.6 + a.ovr * 0.4))
  return scored.slice(0, 12)
}

// ================= IA (Claude) =================
async function generateObjectives(club, season) {
  const arr = await callLLM({
    system: `Voce e a diretoria de um clube de futebol. Gere objetivos realistas para a temporada, coerentes com o porte do clube. Responda SOMENTE um array JSON.`,
    messages: [{ role: 'user', content: `Clube: ${club.name} (${club.league}, ${club.country}). Reputacao: ${club.reputation}/100. Orcamento: ~${club.budget}M EUR. Temporada: ${season}.
Gere 5 a 6 objetivos. Cada item: {"category":"DIRETORIA"|"ESPORTIVO"|"FINANCEIRO","text":"...","priority":"ALTA"|"MEDIA"|"BAIXA"}.
Sejam especificos e plausiveis.` }],
    json: true, maxTokens: 600, temperature: 0.6,
  })
  return arr.map(o => ({ id: uid(), status: 'IN_PROGRESS', ...o }))
}
function fallbackObjectives(club) {
  const big = club.reputation >= 87
  return [
    { id: uid(), category: 'DIRETORIA', text: big ? `Disputar o t\u00edtulo da ${club.league}` : `Terminar entre os 6 primeiros da ${club.league}`, priority: 'ALTA', status: 'IN_PROGRESS' },
    { id: uid(), category: 'DIRETORIA', text: big ? 'Avan\u00e7ar \u00e0s quartas de final continental' : 'Classificar para competi\u00e7\u00e3o continental', priority: 'MEDIA', status: 'IN_PROGRESS' },
    { id: uid(), category: 'ESPORTIVO', text: 'Reduzir a idade m\u00e9dia do elenco', priority: 'MEDIA', status: 'IN_PROGRESS' },
    { id: uid(), category: 'ESPORTIVO', text: 'Promover um jogador da base', priority: 'BAIXA', status: 'IN_PROGRESS' },
    { id: uid(), category: 'FINANCEIRO', text: 'Manter a folha salarial dentro do or\u00e7amento', priority: 'ALTA', status: 'IN_PROGRESS' },
  ]
}

async function generateScoutReport(p, fromClub, career, realism, fee) {
  return await callLLM({
    system: `Voce e um olheiro profissional. Analise o alvo usando SOMENTE os dados fornecidos. Nunca invente atributos, valores ou estatisticas. Responda SOMENTE JSON.`,
    messages: [{ role: 'user', content: `Clube interessado: ${career.club.name} (${career.club.league}, rep ${career.club.reputation}).
Alvo: ${p.name}, ${p.position}, ${p.age} anos, OVR ${p.ovr}, POT ${p.pot}, ${p.nationality}, clube atual ${fromClub?.name || 'desconhecido'}, valor ~${p.value}M, salario ~${p.wage}K/sem.
Realism Score: ${realism.score}/100 (${realism.verdict}). Fatores: ${realism.factors.slice(0, 4).map(f => f.label + ' (' + f.impact + ')').join('; ')}. Custo estimado: ${fee}M.
Retorne {"summary":"2-3 frases","pros":["..."],"cons":["..."],"risks":["..."],"role":"papel esperado","confidence":"HIGH|MEDIUM|LOW"}.` }],
    json: true, maxTokens: 700, temperature: 0.5,
  })
}
function fallbackReport(p, realism, fee) {
  return { summary: `${p.name} (${p.position}, ${p.age}) com OVR ${p.ovr} e potencial ${p.pot}. Realism Score ${realism.score}/100 (${realism.verdict}).`, pros: [p.pot > p.ovr ? 'Margem de evolu\u00e7\u00e3o' : 'Pronto para jogar', 'Perfil compat\u00edvel'], cons: realism.factors.filter(f => f.impact < 0).slice(0, 2).map(f => f.label), risks: ['An\u00e1lise de IA indispon\u00edvel no momento'], role: 'A definir', confidence: 'LOW' }
}

async function sportingDirectorReply(career, history, message) {
  const squad = career.squad
  const order = ['GK', 'RB', 'LB', 'CB', 'RWB', 'LWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF']
  const byPos = {}
  squad.forEach(p => { (byPos[p.position] = byPos[p.position] || []).push(p) })
  const squadTxt = order.filter(pos => byPos[pos]).map(pos => {
    const list = byPos[pos].sort((a, b) => b.ovr - a.ovr).map(p => `${p.name} ${p.ovr}/${p.pot} ${p.age}a`).join(', ')
    return `${pos}: ${list}`
  }).join('\n')
  const ctx = `CONTEXTO DO SAVE (use somente estes dados, nunca invente numeros):
Clube: ${career.club.name} (${career.club.league}), reputacao ${career.club.reputation}/100. Temporada: ${career.season}. Modo: ${career.universeMode}.
Financas: orcamento de transferencias EUR ${career.finances.transferBudget}M; folha semanal EUR ${career.finances.wageWeekly}K; FFP ${career.finances.ffpStatus}.
Confianca diretoria ${career.boardConfidence}; trust ${career.managerTrust}; torcida ${career.fanSentiment}.
Registro: ${career.stats.played}J ${career.stats.won}V ${career.stats.drawn}E ${career.stats.lost}D.
ELENCO COMPLETO POR POSICAO (nome OVR/POT idade):\n${squadTxt}
Objetivos: ${(career.objectives || []).map(o => o.text).join(' | ')}.`
  return await callLLM({
    system: `Voce e o Diretor Esportivo virtual do ${career.club.name}, especialista em Modo Carreira do EA FC. Responda em portugues do Brasil, direto e pratico. Baseie-se SOMENTE no contexto do save. Se faltar dado, diga que precisa da informacao. Nunca invente OVR, valores, resultados ou transferencias. Considere realismo (financas, reputacao, idade, necessidade de posicao). ${ctx}`,
    messages: [...history, { role: 'user', content: message }],
    maxTokens: 700, temperature: 0.6,
  })
}

async function matchNews(career, m) {
  const scorersTxt = (m.scorers || []).map(s => s.name).filter(Boolean).join(', ')
  const out = await callLLM({
    system: `Voce escreve materias curtas de futebol para a Career News Network. Use SOMENTE os fatos fornecidos. Nunca invente placar, gols ou nomes. Responda SOMENTE JSON {"headline":"...","body":"2-3 frases"}.`,
    messages: [{ role: 'user', content: `Resultado: ${career.club.name} ${m.homeAway === 'home' ? m.gf + '-' + m.ga : m.ga + '-' + m.gf} ${m.opponentName} (${m.competition}). Para ${career.club.name}: ${m.result === 'W' ? 'vitoria' : m.result === 'D' ? 'empate' : 'derrota'}. Marcadores: ${scorersTxt || 'nao informado'}.` }],
    json: true, maxTokens: 300, temperature: 0.7,
  })
  return { ...out, tag: 'PARTIDA', source: 'Career News Network' }
}

async function generateContextNews(db, career) {
  const events = cleanArr(await db.collection('events').find({ careerId: career.id }).sort({ createdAt: -1 }).limit(6).toArray())
  const out = await callLLM({
    system: `Voce e um jornalista esportivo. Escreva uma materia curta baseada SOMENTE nos eventos recentes fornecidos. Nunca invente fatos. Responda SOMENTE JSON {"headline":"...","body":"2-4 frases"}.`,
    messages: [{ role: 'user', content: `Clube: ${career.club.name}. Eventos recentes: ${events.map(e => e.title).join(' | ') || 'inicio de carreira'}. Situacao: diretoria ${career.boardConfidence}/100, torcida ${career.fanSentiment}/100.` }],
    json: true, maxTokens: 350, temperature: 0.8,
  })
  return { ...out, tag: 'ANALISE', source: 'Career News Network' }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
