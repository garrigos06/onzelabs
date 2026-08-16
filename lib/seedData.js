import crypto from 'crypto'

// ---------- CLUBS (reputacao 40-95, orcamento em milhoes de EUR) ----------
export const CLUBS = [
  // Premier League
  { name: 'Arsenal', country: 'Inglaterra', league: 'Premier League', reputation: 87, budget: 180, color: '#EF0107', stadium: 'Emirates Stadium', rivals: ['Tottenham Hotspur', 'Chelsea', 'Manchester United'] },
  { name: 'Manchester City', country: 'Inglaterra', league: 'Premier League', reputation: 93, budget: 260, color: '#6CABDD', stadium: 'Etihad Stadium', rivals: ['Manchester United', 'Liverpool'] },
  { name: 'Liverpool', country: 'Inglaterra', league: 'Premier League', reputation: 91, budget: 190, color: '#C8102E', stadium: 'Anfield', rivals: ['Manchester United', 'Everton', 'Manchester City'] },
  { name: 'Manchester United', country: 'Inglaterra', league: 'Premier League', reputation: 88, budget: 200, color: '#DA291C', stadium: 'Old Trafford', rivals: ['Liverpool', 'Manchester City', 'Arsenal'] },
  { name: 'Chelsea', country: 'Inglaterra', league: 'Premier League', reputation: 85, budget: 210, color: '#034694', stadium: 'Stamford Bridge', rivals: ['Arsenal', 'Tottenham Hotspur'] },
  { name: 'Tottenham Hotspur', country: 'Inglaterra', league: 'Premier League', reputation: 83, budget: 130, color: '#132257', stadium: 'Tottenham Hotspur Stadium', rivals: ['Arsenal', 'Chelsea'] },
  { name: 'Newcastle United', country: 'Inglaterra', league: 'Premier League', reputation: 81, budget: 150, color: '#241F20', stadium: "St James' Park", rivals: ['Sunderland'] },
  { name: 'Aston Villa', country: 'Inglaterra', league: 'Premier League', reputation: 77, budget: 90, color: '#95BFE5', stadium: 'Villa Park', rivals: ['Birmingham City'] },
  // La Liga
  { name: 'Real Madrid', country: 'Espanha', league: 'La Liga', reputation: 95, budget: 300, color: '#FEBE10', stadium: 'Santiago Bernabeu', rivals: ['FC Barcelona', 'Atletico Madrid'] },
  { name: 'FC Barcelona', country: 'Espanha', league: 'La Liga', reputation: 92, budget: 150, color: '#A50044', stadium: 'Spotify Camp Nou', rivals: ['Real Madrid', 'Espanyol'] },
  { name: 'Atletico Madrid', country: 'Espanha', league: 'La Liga', reputation: 85, budget: 120, color: '#CB3524', stadium: 'Riyadh Air Metropolitano', rivals: ['Real Madrid'] },
  { name: 'Athletic Bilbao', country: 'Espanha', league: 'La Liga', reputation: 76, budget: 70, color: '#EE2523', stadium: 'San Mames', rivals: ['Real Sociedad'] },
  // Serie A
  { name: 'Inter', country: 'Italia', league: 'Serie A', reputation: 86, budget: 110, color: '#010E80', stadium: 'San Siro', rivals: ['AC Milan', 'Juventus'] },
  { name: 'AC Milan', country: 'Italia', league: 'Serie A', reputation: 85, budget: 110, color: '#FB090B', stadium: 'San Siro', rivals: ['Inter', 'Juventus'] },
  { name: 'Juventus', country: 'Italia', league: 'Serie A', reputation: 86, budget: 130, color: '#000000', stadium: 'Allianz Stadium', rivals: ['Inter', 'AC Milan', 'Torino'] },
  { name: 'Napoli', country: 'Italia', league: 'Serie A', reputation: 83, budget: 95, color: '#12A0D7', stadium: 'Diego Armando Maradona', rivals: ['AS Roma', 'Juventus'] },
  // Bundesliga
  { name: 'Bayern Munchen', country: 'Alemanha', league: 'Bundesliga', reputation: 92, budget: 200, color: '#DC052D', stadium: 'Allianz Arena', rivals: ['Borussia Dortmund'] },
  { name: 'Borussia Dortmund', country: 'Alemanha', league: 'Bundesliga', reputation: 84, budget: 120, color: '#FDE100', stadium: 'Signal Iduna Park', rivals: ['Bayern Munchen', 'Schalke 04'] },
  { name: 'Bayer Leverkusen', country: 'Alemanha', league: 'Bundesliga', reputation: 83, budget: 100, color: '#E32221', stadium: 'BayArena', rivals: ['FC Koln'] },
  // Ligue 1\n
  { name: 'Paris Saint-Germain', country: 'Franca', league: 'Ligue 1', reputation: 90, budget: 260, color: '#004170', stadium: 'Parc des Princes', rivals: ['Marseille'] },
  { name: 'Monaco', country: 'Franca', league: 'Ligue 1', reputation: 78, budget: 90, color: '#E63946', stadium: 'Stade Louis II', rivals: ['Nice'] },
  // Brasileirao
  { name: 'Palmeiras', country: 'Brasil', league: 'Brasileirao', reputation: 76, budget: 45, color: '#006437', stadium: 'Allianz Parque', rivals: ['Corinthians', 'Sao Paulo'] },
  { name: 'Flamengo', country: 'Brasil', league: 'Brasileirao', reputation: 77, budget: 50, color: '#C52613', stadium: 'Maracana', rivals: ['Fluminense', 'Vasco da Gama'] },
  { name: 'Corinthians', country: 'Brasil', league: 'Brasileirao', reputation: 73, budget: 35, color: '#000000', stadium: 'Neo Quimica Arena', rivals: ['Palmeiras', 'Sao Paulo'] },
]

// ---------- REAL EA FC 26 STARS (dados FUTWIZ) ----------
// club = nome exato do clube acima; nat = nacionalidade
const REAL = [
  // Man City
  ['Erling Haaland', 'Manchester City', 'ST', 25, 91, 93, 'Noruega', 145, 210],
  ['Rodri', 'Manchester City', 'CDM', 29, 89, 89, 'Espanha', 79, 145],
  ['Gianluigi Donnarumma', 'Manchester City', 'GK', 27, 89, 91, 'Italia', 84, 115],
  ['Phil Foden', 'Manchester City', 'CAM', 25, 87, 90, 'Inglaterra', 96, 160],
  ['Bernardo Silva', 'Manchester City', 'CM', 31, 86, 86, 'Portugal', 52, 150],
  ['Josko Gvardiol', 'Manchester City', 'CB', 24, 86, 90, 'Croacia', 82, 110],
  // Real Madrid
  ['Kylian Mbappe', 'Real Madrid', 'ST', 27, 91, 92, 'Franca', 138, 330],
  ['Vini Jr.', 'Real Madrid', 'LW', 25, 89, 92, 'Brasil', 123, 240],
  ['Jude Bellingham', 'Real Madrid', 'CAM', 22, 89, 93, 'Inglaterra', 135, 200],
  ['Federico Valverde', 'Real Madrid', 'CM', 27, 89, 90, 'Uruguai', 106, 230],
  ['Thibaut Courtois', 'Real Madrid', 'GK', 33, 90, 90, 'Belgica', 57, 180],
  ['Aurelien Tchouameni', 'Real Madrid', 'CDM', 25, 86, 90, 'Franca', 85, 150],
  ['Rodrygo', 'Real Madrid', 'RW', 24, 86, 90, 'Brasil', 92, 180],
  // Barcelona
  ['Lamine Yamal', 'FC Barcelona', 'RW', 18, 89, 95, 'Espanha', 136, 125],
  ['Pedri', 'FC Barcelona', 'CM', 23, 90, 93, 'Espanha', 146, 260],
  ['Raphinha', 'FC Barcelona', 'LW', 29, 89, 89, 'Brasil', 91, 330],
  ['Robert Lewandowski', 'FC Barcelona', 'ST', 37, 86, 86, 'Polonia', 22, 190],
  ['Gavi', 'FC Barcelona', 'CM', 21, 85, 92, 'Espanha', 90, 120],
  ['Frenkie de Jong', 'FC Barcelona', 'CM', 28, 87, 88, 'Holanda', 78, 200],
  // PSG
  ['Ousmane Dembele', 'Paris Saint-Germain', 'ST', 28, 90, 90, 'Franca', 110, 78],
  ['Vitinha', 'Paris Saint-Germain', 'CM', 26, 90, 92, 'Portugal', 132, 69],
  ['Achraf Hakimi', 'Paris Saint-Germain', 'RB', 27, 89, 90, 'Marrocos', 97, 60],
  ['Joao Neves', 'Paris Saint-Germain', 'CM', 21, 86, 93, 'Portugal', 110, 65],
  ['Nuno Mendes', 'Paris Saint-Germain', 'LB', 23, 86, 90, 'Portugal', 82, 60],
  // Bayern
  ['Harry Kane', 'Bayern Munchen', 'ST', 32, 90, 90, 'Inglaterra', 87, 220],
  ['Joshua Kimmich', 'Bayern Munchen', 'CDM', 31, 89, 89, 'Alemanha', 65, 175],
  ['Jamal Musiala', 'Bayern Munchen', 'CAM', 22, 87, 93, 'Alemanha', 130, 130],
  ['Michael Olise', 'Bayern Munchen', 'RW', 24, 86, 90, 'Franca', 92, 95],
  // Liverpool
  ['Mohamed Salah', 'Liverpool', 'RW', 33, 89, 89, 'Egito', 58, 350],
  ['Virgil van Dijk', 'Liverpool', 'CB', 34, 88, 88, 'Holanda', 30, 220],
  ['Alexis Mac Allister', 'Liverpool', 'CM', 27, 86, 88, 'Argentina', 85, 150],
  ['Alisson', 'Liverpool', 'GK', 33, 88, 88, 'Brasil', 40, 150],
  ['Florian Wirtz', 'Liverpool', 'CAM', 22, 88, 93, 'Alemanha', 140, 180],
  // Arsenal (default demo club - elenco mais completo)\n
  ['Bukayo Saka', 'Arsenal', 'RW', 24, 88, 91, 'Inglaterra', 130, 195],
  ['Martin Odegaard', 'Arsenal', 'CAM', 27, 88, 89, 'Noruega', 100, 200],
  ['Declan Rice', 'Arsenal', 'CDM', 27, 89, 91, 'Inglaterra', 118, 240],
  ['William Saliba', 'Arsenal', 'CB', 24, 87, 91, 'Franca', 95, 190],
  ['Gabriel', 'Arsenal', 'CB', 28, 89, 90, 'Brasil', 88, 145],
  ['Viktor Gyokeres', 'Arsenal', 'ST', 27, 86, 88, 'Suecia', 82, 150],
  ['Kai Havertz', 'Arsenal', 'ST', 26, 84, 86, 'Alemanha', 60, 280],
  ['Gabriel Martinelli', 'Arsenal', 'LW', 24, 83, 87, 'Brasil', 62, 180],
  ['David Raya', 'Arsenal', 'GK', 30, 85, 86, 'Espanha', 45, 120],
  ['Jurrien Timber', 'Arsenal', 'RB', 24, 83, 87, 'Holanda', 55, 120],
  ['Riccardo Calafiori', 'Arsenal', 'LB', 23, 81, 87, 'Italia', 48, 110],
  ['Martin Zubimendi', 'Arsenal', 'CDM', 26, 85, 88, 'Espanha', 70, 130],
  // Inter
  ['Lautaro Martinez', 'Inter', 'ST', 28, 88, 88, 'Argentina', 92, 160],
  ['Nicolo Barella', 'Inter', 'CM', 28, 87, 88, 'Italia', 85, 140],
  // Milan
  ['Rafael Leao', 'AC Milan', 'LW', 26, 86, 89, 'Portugal', 95, 170],
  ['Christian Pulisic', 'AC Milan', 'RW', 27, 84, 85, 'EUA', 55, 120],
  // Juventus
  ['Kenan Yildiz', 'Juventus', 'CAM', 20, 83, 91, 'Turquia', 75, 90],
  ['Dusan Vlahovic', 'Juventus', 'ST', 25, 85, 88, 'Servia', 78, 200],
  // Napoli
  ['Kevin De Bruyne', 'Napoli', 'CAM', 34, 87, 87, 'Belgica', 35, 200],
  ['Scott McTominay', 'Napoli', 'CM', 29, 83, 84, 'Escocia', 45, 110],
  // Dortmund
  ['Serhou Guirassy', 'Borussia Dortmund', 'ST', 29, 84, 85, 'Guine', 55, 110],
  // Leverkusen
  ['Alejandro Grimaldo', 'Bayer Leverkusen', 'LB', 30, 85, 85, 'Espanha', 55, 90],
  // Newcastle
  ['Alexander Isak', 'Newcastle United', 'ST', 26, 86, 89, 'Suecia', 105, 130],
  ['Bruno Guimaraes', 'Newcastle United', 'CM', 28, 86, 87, 'Brasil', 85, 140],
  // Man United
  ['Bruno Fernandes', 'Manchester United', 'CAM', 31, 87, 87, 'Portugal', 65, 260],
  // Chelsea
  ['Cole Palmer', 'Chelsea', 'CAM', 23, 87, 92, 'Inglaterra', 140, 150],
  ['Moises Caicedo', 'Chelsea', 'CDM', 24, 86, 90, 'Equador', 100, 130],
  // Atletico
  ['Julian Alvarez', 'Atletico Madrid', 'ST', 25, 87, 90, 'Argentina', 110, 150],
  // Aston Villa
  ['Emiliano Martinez', 'Aston Villa', 'GK', 33, 85, 85, 'Argentina', 30, 120],
  // Brasileirao stars
  ['Estevao', 'Palmeiras', 'RW', 18, 80, 91, 'Brasil', 55, 20],
  ['Pedro', 'Flamengo', 'ST', 28, 80, 82, 'Brasil', 30, 25],
  ['Gerson', 'Flamengo', 'CM', 28, 80, 81, 'Brasil', 25, 22],
]

// ---------- Helpers de valor / salario ----------
export function estValue(ovr, age, pot) {
  const bp = [[92, 150], [90, 110], [88, 78], [86, 55], [84, 40], [82, 28], [80, 20], [78, 13], [76, 8.5], [74, 5.5], [72, 3.5], [70, 2.2], [68, 1.3], [66, 0.8], [64, 0.5]]
  let base = 0.3
  for (const [o, v] of bp) { if (ovr >= o) { base = v; break } }
  const ageF = age <= 20 ? 1.55 : age <= 23 ? 1.4 : age <= 26 ? 1.2 : age <= 29 ? 1.0 : age <= 31 ? 0.7 : age <= 33 ? 0.45 : 0.25
  const potF = 1 + Math.max(0, pot - ovr) * 0.05
  return Math.max(0.3, Math.round(base * ageF * potF * 10) / 10)
}

export function estWage(ovr, clubRep) {
  const w = Math.pow(Math.max(ovr - 55, 3), 1.85) / 6 * (clubRep / 85)
  return Math.max(2, Math.round(w))
}

// ---------- Gerador de profundidade de elenco (jogadores ficticios DEMO) ----------
const NAMES = {
  Inglaterra: [['Jack', 'Tom', 'Harry', 'Ollie', 'Charlie', 'George', 'Lewis', 'Callum'], ['Wright', 'Hughes', 'Barnes', 'Cole', 'Reid', 'Turner', 'Doyle', 'Mills']],
  Espanha: [['Alvaro', 'Sergio', 'Marc', 'Pablo', 'Hugo', 'Diego', 'Iker', 'Mateo'], ['Ruiz', 'Serrano', 'Navarro', 'Vidal', 'Castro', 'Ortega', 'Blanco', 'Reyes']],
  Italia: [['Marco', 'Luca', 'Matteo', 'Andrea', 'Simone', 'Nicolo', 'Davide', 'Gianluca'], ['Rossi', 'Bianchi', 'Conti', 'Greco', 'Marino', 'Costa', 'Ferrari', 'Gatti']],
  Alemanha: [['Leon', 'Max', 'Finn', 'Jonas', 'Tim', 'Nico', 'Luca', 'Paul'], ['Wagner', 'Krause', 'Fischer', 'Weber', 'Neumann', 'Bauer', 'Hofmann', 'Braun']],
  Franca: [['Lucas', 'Hugo', 'Theo', 'Enzo', 'Nathan', 'Kylian', 'Matteo', 'Noah'], ['Bernard', 'Moreau', 'Girard', 'Lefevre', 'Roux', 'Faure', 'Dumas', 'Perrin']],
  Brasil: [['Gabriel', 'Lucas', 'Matheus', 'Joao', 'Bruno', 'Rafael', 'Felipe', 'Vitor'], ['Silva', 'Souza', 'Oliveira', 'Santos', 'Lima', 'Costa', 'Rocha', 'Alves']],
  Portugal: [['Joao', 'Diogo', 'Rui', 'Tiago', 'Andre', 'Bruno', 'Nuno', 'Pedro'], ['Ferreira', 'Costa', 'Pereira', 'Sousa', 'Fonseca', 'Cardoso', 'Lopes', 'Pinto']],
}
const NAT_BY_LEAGUE = {
  'Premier League': ['Inglaterra', 'Inglaterra', 'Franca', 'Brasil', 'Espanha'],
  'La Liga': ['Espanha', 'Espanha', 'Brasil', 'Argentina', 'Franca'],
  'Serie A': ['Italia', 'Italia', 'Brasil', 'Franca', 'Espanha'],
  'Bundesliga': ['Alemanha', 'Alemanha', 'Franca', 'Brasil', 'Portugal'],
  'Ligue 1': ['Franca', 'Franca', 'Brasil', 'Portugal', 'Espanha'],
  'Brasileirao': ['Brasil', 'Brasil', 'Brasil', 'Argentina'],
}
function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function genName(nat) {
  const pool = NAMES[nat] || NAMES.Espanha
  return pick(pool[0]) + ' ' + pick(pool[1])
}
const HEIGHTS = { GK: [188, 197], CB: [185, 194], ST: [178, 190], default: [172, 186] }

function makePlayer(club, position, minOvr, maxOvr) {
  const nat = pick(NAT_BY_LEAGUE[club.league] || ['Espanha'])
  const ovr = clampInt(rand(minOvr, maxOvr), 58, club.reputation - 1)
  const young = Math.random() < 0.35
  const age = young ? rand(17, 22) : rand(23, 34)
  const pot = young ? clampInt(ovr + rand(3, 12), ovr, 94) : clampInt(ovr + rand(0, 3), ovr, 92)
  const foot = Math.random() < 0.75 ? 'Direito' : 'Esquerdo'
  const hr = HEIGHTS[position] || HEIGHTS.default
  return basePlayer({
    name: genName(nat), club: club.name, position, age, ovr, pot, nat,
    value: estValue(ovr, age, pot), wage: estWage(ovr, club.reputation), foot,
    height: rand(hr[0], hr[1]), demo: true,
  })
}
function clampInt(n, a, b) { return Math.max(a, Math.min(b, n)) }

// atributos PAC/SHO/PAS/DRI/DEF/PHY derivados por posicao/ovr
function attrsFor(position, ovr) {
  const v = (base, spread) => clampInt(base + rand(-spread, spread), 40, 99)
  const o = ovr
  switch (position) {
    case 'GK': return { pace: v(o - 15, 6), shooting: v(o - 20, 5), passing: v(o - 5, 6), dribbling: v(o - 10, 6), defending: v(o - 25, 6), physical: v(o, 5) }
    case 'CB': return { pace: v(o - 8, 8), shooting: v(o - 30, 6), passing: v(o - 12, 8), dribbling: v(o - 15, 8), defending: v(o + 3, 4), physical: v(o + 2, 5) }
    case 'RB': case 'LB': return { pace: v(o + 3, 5), shooting: v(o - 18, 8), passing: v(o - 4, 6), dribbling: v(o - 2, 6), defending: v(o, 5), physical: v(o - 4, 6) }
    case 'CDM': return { pace: v(o - 6, 7), shooting: v(o - 12, 8), passing: v(o - 2, 6), dribbling: v(o - 4, 6), defending: v(o + 2, 4), physical: v(o + 1, 5) }
    case 'CM': return { pace: v(o - 4, 7), shooting: v(o - 8, 8), passing: v(o + 2, 4), dribbling: v(o + 1, 5), defending: v(o - 8, 8), physical: v(o - 4, 6) }
    case 'CAM': return { pace: v(o - 2, 7), shooting: v(o - 2, 6), passing: v(o + 2, 4), dribbling: v(o + 3, 4), defending: v(o - 18, 8), physical: v(o - 8, 7) }
    case 'GK2': return {}
    default: return { pace: v(o + 3, 5), shooting: v(o + 1, 5), passing: v(o - 4, 6), dribbling: v(o + 2, 5), defending: v(o - 22, 8), physical: v(o - 6, 7) }
  }
}

function basePlayer(p) {
  return {
    name: p.name, fullName: p.name, club: p.club, position: p.position,
    age: p.age, ovr: p.ovr, pot: p.pot, nationality: p.nat,
    value: p.value, wage: p.wage, preferredFoot: p.foot, height: p.height || rand(175, 188),
    weakFoot: rand(2, 5), skillMoves: p.position === 'GK' ? 1 : rand(2, 5),
    attributes: attrsFor(p.position, p.ovr),
    contractUntil: 2026 + rand(1, 4), demo: !!p.demo,
  }
}

// composicao alvo do elenco (24)
const TEMPLATE = ['GK', 'GK', 'GK', 'RB', 'RB', 'LB', 'LB', 'CB', 'CB', 'CB', 'CB', 'CDM', 'CDM', 'CM', 'CM', 'CM', 'CAM', 'RW', 'LW', 'RM', 'LM', 'ST', 'ST', 'ST']

export function buildSeed() {
  const clubs = CLUBS.map(c => ({ id: crypto.randomUUID(), ...c }))
  const clubByName = {}
  clubs.forEach(c => { clubByName[c.name] = c })

  const players = []
  const realByClub = {}
  for (const r of REAL) {
    const [name, club, position, age, ovr, pot, nat, value, wage] = r
    realByClub[club] = realByClub[club] || []
    realByClub[club].push(basePlayer({ name, club, position, age, ovr, pot, nat, value, wage, demo: false }))
  }

  for (const club of clubs) {
    const reals = realByClub[club.name] || []
    // contagem por posicao ja existente
    const countPos = {}
    reals.forEach(p => { countPos[p.position] = (countPos[p.position] || 0) + 1 })
    const squad = [...reals]
    // gerar preenchimento conforme template
    const need = {}
    TEMPLATE.forEach(pos => { need[pos] = (need[pos] || 0) + 1 })
    for (const pos of Object.keys(need)) {
      const have = countPos[pos] || 0
      let toMake = Math.max(0, need[pos] - have)
      // posicoes de asa: agrupa RW/LW/RM/LM/ST se ja tem estrela
      for (let i = 0; i < toMake && squad.length < 25; i++) {
        // faixa de OVR do preenchimento em funcao da reputacao
        const top = club.reputation - 2
        const lo = Math.max(60, club.reputation - 16)
        squad.push(makePlayer(club, pos, lo, top))
      }
    }
    // garante minimo 22
    while (squad.length < 22) {
      squad.push(makePlayer(club, pick(['CM', 'CB', 'ST', 'RB']), Math.max(60, club.reputation - 16), club.reputation - 3))
    }
    squad.forEach(p => {
      players.push({ id: crypto.randomUUID(), clubId: club.id, league: club.league, ...p })
    })
  }

  return { clubs, players }
}
