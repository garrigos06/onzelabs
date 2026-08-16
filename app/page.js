'use client'

import { useEffect, useState, useRef } from 'react'
import { api, getToken, setToken, clearToken, eur, wageFmt, realismColor, realismBg, roleColors, initials } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  LayoutDashboard, Users, Radar, Sparkles, ArrowLeftRight, Wallet, Trophy, ListOrdered,
  Newspaper, Building2, Plus, LogOut, Search, Loader2, Send, TrendingUp, Target, Shield,
  Zap, ChevronRight, Star, Trash2, Gauge, ArrowRight,
} from 'lucide-react'

const STADIUM = 'https://images.unsplash.com/photo-1611952053765-c677dedd78bb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600'
const TACTICS = 'https://images.unsplash.com/photo-1556056504-dc77ff4d11b0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600'

/* ============================= ROOT ============================= */
export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [careers, setCareers] = useState([])
  const [activeCareer, setActiveCareer] = useState(null)

  useEffect(() => {
    if (!getToken()) { setReady(true); return }
    api('/me').then(d => { setUser(d.user); setCareers(d.careers) }).catch(() => clearToken()).finally(() => setReady(true))
  }, [])

  const onAuthed = (u) => { setUser(u); api('/me').then(d => setCareers(d.careers)) }
  const logout = () => { clearToken(); setUser(null); setCareers([]); setActiveCareer(null) }

  const openCareer = async (id) => {
    try { const c = await api('/careers/' + id); setActiveCareer(c) }
    catch (e) { toast.error(e.message) }
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!user) return <AuthScreen onAuthed={onAuthed} />
  if (!activeCareer) return <CareerHub user={user} careers={careers} setCareers={setCareers} onOpen={openCareer} onLogout={logout} />
  return <CareerShell career={activeCareer} setCareer={setActiveCareer} onExit={() => { setActiveCareer(null); api('/me').then(d => setCareers(d.careers)) }} onLogout={logout} />
}

/* ============================= AUTH ============================= */
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const d = await api(path, { method: 'POST', body: form })
      setToken(d.token); onAuthed(d.user); toast.success('Bem-vindo, ' + d.user.name)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:block overflow-hidden">
        <img src={STADIUM} alt="Estádio" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full p-12">
          <Badge className="w-fit mb-4 bg-primary/15 text-primary border-primary/30">Companion não oficial para EA SPORTS FC</Badge>
          <h1 className="font-display text-5xl font-extrabold leading-tight">Seu save virou um<br /><span className="text-gradient">universo de futebol</span></h1>
          <p className="text-muted-foreground mt-4 max-w-md">Realism Score, scouting com IA, diretoria, finanças e narrativa ao redor do seu Modo Carreira. O jogo é no EA FC. O universo é aqui.</p>
          <div className="flex gap-6 mt-8 text-sm">
            <div><div className="font-display text-2xl font-bold text-primary">20K+</div><div className="text-muted-foreground">jogadores FC26</div></div>
            <div><div className="font-display text-2xl font-bold text-primary">IA</div><div className="text-muted-foreground">Claude Sonnet 4.5</div></div>
            <div><div className="font-display text-2xl font-bold text-primary">Realism™</div><div className="text-muted-foreground">engine determinístico</div></div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center glow-green"><Zap className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-display text-xl font-bold">FC Universe</span>
          </div>
          <h2 className="font-display text-2xl font-bold mb-1">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
          <p className="text-sm text-muted-foreground mb-6">Gerencie o universo ao redor do seu save.</p>
          <div className="space-y-3">
            {mode === 'register' && <Input placeholder="Nome do treinador" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
            <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Senha" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && submit()} />
            <Button className="w-full glow-green" onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === 'login' ? 'Entrar' : 'Criar conta e começar')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button className="text-primary font-medium" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Cadastre-se' : 'Entrar'}</button>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ============================= CAREER HUB ============================= */
function CareerHub({ user, careers, setCareers, onOpen, onLogout }) {
  const [wizard, setWizard] = useState(false)
  const del = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Excluir esta carreira?')) return
    await api('/careers/' + id, { method: 'DELETE' })
    setCareers(careers.filter(c => c.id !== id)); toast.success('Carreira excluída')
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="relative border-b border-border overflow-hidden">
        <img src={TACTICS} className="absolute inset-0 h-full w-full object-cover opacity-15" alt="" />
        <div className="relative container py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center glow-green"><Zap className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-display text-xl font-bold">FC Universe</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block"><div className="text-sm font-medium">{user.name}</div><div className="text-xs text-muted-foreground">{user.plan}</div></div>
            <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-3xl font-bold">Suas Carreiras</h1><p className="text-muted-foreground">Cada carreira é um universo separado e persistente.</p></div>
          <Button className="glow-green" onClick={() => setWizard(true)}><Plus className="h-4 w-4 mr-1" /> Nova Carreira</Button>
        </div>
        {careers.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-semibold mb-1">Comece seu universo</h3>
            <p className="text-muted-foreground mb-4">Crie sua primeira carreira e deixe a IA gerar objetivos, notícias e recomendações.</p>
            <Button className="glow-green" onClick={() => setWizard(true)}><Plus className="h-4 w-4 mr-1" /> Criar Carreira</Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careers.map(c => (
              <Card key={c.id} onClick={() => onOpen(c.id)} className="p-5 cursor-pointer hover:border-primary/40 transition group relative overflow-hidden">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-30" style={{ background: c.clubColor }} />
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center font-display font-bold text-lg" style={{ background: (c.clubColor || '#333') + '22', color: c.clubColor }}>{initials(c.clubName)}</div>
                  <div className="min-w-0"><div className="font-display font-semibold truncate">{c.clubName}</div><div className="text-xs text-muted-foreground truncate">{c.league} • {c.season}</div></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.managerName}</span>
                  <Badge variant="secondary" className="text-[10px]">{c.universeMode}</Badge>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">{c.played} jogos • {c.won} vit.</div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => del(c.id, e)} className="text-muted-foreground hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {wizard && <CareerWizard onClose={() => setWizard(false)} onCreated={(c) => { setWizard(false); onOpen(c.id) }} defaultName={user.name} />}
    </div>
  )
}

/* ============================= WIZARD ============================= */
function CareerWizard({ onClose, onCreated, defaultName }) {
  const [step, setStep] = useState(1)
  const [clubs, setClubs] = useState([])
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [cfg, setCfg] = useState({ managerName: defaultName, universeMode: 'REALISTA', budget: '', season: '2026/27', difficulty: 'Legend' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { api('/clubs').then(setClubs) }, [])
  const filtered = clubs.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.league.toLowerCase().includes(q.toLowerCase()))

  const create = async () => {
    setCreating(true)
    try {
      const c = await api('/careers', { method: 'POST', body: { clubId: sel.id, managerName: cfg.managerName, universeMode: cfg.universeMode, budget: cfg.budget === '' ? undefined : Number(cfg.budget), season: cfg.season, difficulty: cfg.difficulty } })
      toast.success('Carreira criada! Objetivos gerados por IA.'); onCreated(c)
    } catch (e) { toast.error(e.message); setCreating(false) }
  }

  const modes = [
    { k: 'REALISTA', d: 'Recomendações equilibradas e coerentes.' },
    { k: 'HARDCORE REALISM', d: 'Realismo máximo, mercado exigente.' },
    { k: 'SEMI-REALISTA', d: 'Mais liberdade com bom senso.' },
    { k: 'LIVRE', d: 'Sem restrições de realismo.' },
  ]

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle className="font-display text-2xl">Nova Carreira — Passo {step} de 3</DialogTitle></DialogHeader>
        <div className="flex gap-1 mb-2">{[1, 2, 3].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />)}</div>

        {step === 1 && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Escolha o clube (dados EA FC 26).</p>
            <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar clube ou liga..." value={q} onChange={e => setQ(e.target.value)} /></div>
            <div className="grid sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto scrollbar-thin pr-1">
              {filtered.map(c => (
                <button key={c.id} onClick={() => setSel(c)} className={`flex items-center gap-3 p-3 rounded-lg border text-left transition ${sel?.id === c.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold" style={{ background: c.color + '22', color: c.color }}>{initials(c.name)}</div>
                  <div className="min-w-0 flex-1"><div className="font-medium truncate">{c.name}</div><div className="text-xs text-muted-foreground truncate">{c.league}</div></div>
                  <div className="text-right"><div className="text-xs text-muted-foreground">REP</div><div className="font-display font-bold text-primary">{c.reputation}</div></div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4"><Button disabled={!sel} onClick={() => { setCfg({ ...cfg, budget: String(Math.round(sel.budget)) }); setStep(2) }}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Configure o universo da carreira.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {modes.map(m => (
                <button key={m.k} onClick={() => setCfg({ ...cfg, universeMode: m.k })} className={`p-3 rounded-lg border text-left transition ${cfg.universeMode === m.k ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <div className="font-medium text-sm flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-primary" />{m.k}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.d}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button><Button onClick={() => setStep(3)}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button></div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Configurações do save.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome do treinador"><Input value={cfg.managerName} onChange={e => setCfg({ ...cfg, managerName: e.target.value })} /></Field>
              <Field label="Orçamento de transferências (€M)"><Input type="number" value={cfg.budget} onChange={e => setCfg({ ...cfg, budget: e.target.value })} /></Field>
              <Field label="Temporada inicial">
                <Select value={cfg.season} onValueChange={v => setCfg({ ...cfg, season: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['2026/27', '2027/28', '2025/26'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </Field>
              <Field label="Dificuldade">
                <Select value={cfg.difficulty} onValueChange={v => setCfg({ ...cfg, difficulty: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Semi-Pro', 'Professional', 'World Class', 'Legend', 'Ultimate'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </Field>
            </div>
            <Card className="p-4 bg-primary/5 border-primary/20 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold" style={{ background: sel.color + '22', color: sel.color }}>{initials(sel.name)}</div>
              <div className="text-sm"><span className="font-medium">{sel.name}</span> • {cfg.universeMode} • {eur(Number(cfg.budget || 0))} de orçamento</div>
            </Card>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button><Button className="glow-green" onClick={create} disabled={creating}>{creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando universo...</> : <><Sparkles className="h-4 w-4 mr-1" />Criar Carreira</>}</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
function Field({ label, children }) { return <div><label className="text-xs text-muted-foreground mb-1 block">{label}</label>{children}</div> }

/* ============================= SHELL ============================= */
const NAV = [
  { k: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { k: 'squad', label: 'Elenco', icon: Users },
  { k: 'scouting', label: 'AI Scout', icon: Radar },
  { k: 'ai', label: 'Diretor IA', icon: Sparkles },
  { k: 'transfers', label: 'Transferências', icon: ArrowLeftRight },
  { k: 'finances', label: 'Finanças', icon: Wallet },
  { k: 'matches', label: 'Partidas', icon: Trophy },
  { k: 'table', label: 'Classificação', icon: ListOrdered },
  { k: 'news', label: 'Notícias', icon: Newspaper },
  { k: 'board', label: 'Diretoria', icon: Building2 },
]

function CareerShell({ career, setCareer, onExit, onLogout }) {
  const [view, setView] = useState('overview')
  const reload = async () => { try { setCareer(await api('/careers/' + career.id)) } catch (e) { toast.error(e.message) } }
  const c = career

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-sidebar-border bg-sidebar shrink-0 h-screen sticky top-0">
        <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div>
          <span className="font-display font-bold">FC Universe</span>
        </div>
        <div className="p-3 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold" style={{ background: (c.club.color || '#333') + '22', color: c.club.color }}>{initials(c.club.name)}</div>
          <div className="min-w-0"><div className="font-medium text-sm truncate">{c.club.name}</div><div className="text-xs text-muted-foreground truncate">{c.season}</div></div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {NAV.map(n => (
            <button key={n.k} onClick={() => setView(n.k)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${view === n.k ? 'bg-sidebar-accent text-primary font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
              <n.icon className="h-4 w-4" />{n.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-sidebar-border space-y-0.5">
          <button onClick={onExit} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"><ArrowLeftRight className="h-4 w-4" />Trocar Carreira</button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"><LogOut className="h-4 w-4" />Sair</button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-sidebar/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-3 h-14">
          <button onClick={onExit} className="flex items-center gap-2"><div className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: (c.club.color || '#333') + '22', color: c.club.color }}>{initials(c.club.name)}</div><span className="font-display font-semibold text-sm">{c.club.name}</span></button>
          <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-thin px-2 pb-2">
          {NAV.map(n => <button key={n.k} onClick={() => setView(n.k)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${view === n.k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{n.label}</button>)}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 pt-28 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {view === 'overview' && <Overview c={c} go={setView} />}
          {view === 'squad' && <Squad c={c} />}
          {view === 'scouting' && <Scouting c={c} reload={reload} />}
          {view === 'ai' && <AIDirector c={c} />}
          {view === 'transfers' && <Transfers c={c} reload={reload} />}
          {view === 'finances' && <Finances c={c} />}
          {view === 'matches' && <Matches c={c} reload={reload} />}
          {view === 'table' && <StandingsView c={c} />}
          {view === 'news' && <News c={c} reload={reload} />}
          {view === 'board' && <Board c={c} />}
        </div>
      </main>
    </div>
  )
}

/* ============================= OVERVIEW ============================= */
function Stat({ label, value, sub, color }) {
  return <Card className="p-4"><div className="text-xs text-muted-foreground">{label}</div><div className={`font-display text-2xl font-bold mt-1 ${color || ''}`}>{value}</div>{sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}</Card>
}
function Meter({ label, value, icon: Icon }) {
  return <div><div className="flex items-center justify-between text-sm mb-1"><span className="flex items-center gap-1.5 text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</span><span className="font-medium">{value}</span></div><Progress value={value} className="h-1.5" /></div>
}
function Overview({ c, go }) {
  const nm = c.nextMatch
  const pos = (c.standings || []).findIndex(r => r.isUser) + 1
  const topScorer = [...c.squad].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0]
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div><div className="text-sm text-muted-foreground">{c.club.league} • {c.season}</div><h1 className="font-display text-3xl font-bold">Central de Comando</h1></div>
        <Badge className="bg-primary/15 text-primary border-primary/30">{c.universeMode}</Badge>
      </div>

      {/* Next match */}
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-20" style={{ background: c.club.color }} />
        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1"><Target className="h-3.5 w-3.5" /> PRÓXIMA PARTIDA</div>
        <div className="flex items-center justify-center gap-6">
          <TeamBadge name={c.club.name} color={c.club.color} home={nm?.homeAway === 'home'} />
          <div className="text-center"><div className="font-display text-2xl font-bold text-muted-foreground">VS</div><div className="text-xs text-muted-foreground mt-1">{nm?.competition}</div></div>
          <TeamBadge name={nm?.opponentName} color={nm?.opponentColor} home={nm?.homeAway === 'away'} />
        </div>
        <div className="flex justify-center mt-4"><Button size="sm" onClick={() => go('matches')}>Registrar Resultado <ArrowRight className="h-4 w-4 ml-1" /></Button></div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Posição na liga" value={pos + 'º'} sub={`${c.stats.played} jogos`} />
        <Stat label="Aproveitamento" value={c.stats.played ? Math.round((c.stats.won * 3 + c.stats.drawn) / (c.stats.played * 3) * 100) + '%' : '—'} sub={`${c.stats.won}V ${c.stats.drawn}E ${c.stats.lost}D`} />
        <Stat label="Orçamento" value={eur(c.finances.transferBudget)} sub="transferências" color="text-primary" />
        <Stat label="Folha semanal" value={eur(c.finances.wageWeekly / 1000)} sub={`FFP ${c.finances.ffpStatus}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-1">
          <div className="font-display font-semibold mb-4 flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" />Situação</div>
          <div className="space-y-3">
            <Meter label="Confiança da diretoria" value={c.boardConfidence} icon={Building2} />
            <Meter label="Manager Trust" value={c.managerTrust} icon={Shield} />
            <Meter label="Sentimento da torcida" value={c.fanSentiment} icon={Users} />
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm"><span className="text-muted-foreground">Pressão da imprensa</span><Badge variant="secondary">{c.mediaPressure}</Badge></div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><div className="font-display font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Objetivos da Diretoria</div><Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]"><Sparkles className="h-3 w-3 mr-1" />IA</Badge></div>
          <div className="space-y-2">
            {(c.objectives || []).map(o => (
              <div key={o.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40">
                <div className={`mt-0.5 h-2 w-2 rounded-full ${o.priority === 'ALTA' ? 'bg-red-400' : o.priority === 'MEDIA' ? 'bg-amber-400' : 'bg-sky-400'}`} />
                <div className="flex-1"><div className="text-sm">{o.text}</div><div className="text-xs text-muted-foreground">{o.category}</div></div>
                <Badge variant="secondary" className="text-[10px]">{o.priority}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="font-display font-semibold mb-3 flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" />Últimas Notícias</div>
          <div className="space-y-3">
            {(c.news || []).slice(0, 4).map(n => (
              <div key={n.id} className="border-l-2 border-primary/40 pl-3"><div className="text-[10px] text-muted-foreground uppercase">{n.tag} • {n.source}</div><div className="text-sm font-medium">{n.headline}</div></div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-display font-semibold mb-3 flex items-center gap-2"><Star className="h-4 w-4 text-primary" />Destaques do Elenco</div>
          <div className="space-y-2">
            {[...c.squad].sort((a, b) => b.ovr - a.ovr).slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3"><PlayerAvatar p={p} /><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-muted-foreground">{p.position} • {p.age} anos</div></div><div className="font-display font-bold text-primary">{p.ovr}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
function TeamBadge({ name, color, home }) {
  return <div className="text-center"><div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center font-display font-bold text-xl" style={{ background: (color || '#333') + '22', color: color || '#aaa' }}>{initials(name)}</div><div className="text-sm font-medium mt-2 max-w-[110px] truncate mx-auto">{name}</div><div className="text-[10px] text-muted-foreground">{home ? 'CASA' : 'FORA'}</div></div>
}
function PlayerAvatar({ p }) {
  return <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold shrink-0">{initials(p.name)}</div>
}

/* ============================= SQUAD ============================= */
function Squad({ c }) {
  const [filter, setFilter] = useState('ALL')
  const [sort, setSort] = useState('ovr')
  const buckets = { ALL: () => true, GK: p => p.position === 'GK', DEF: p => ['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(p.position), MID: p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position), ATT: p => ['ST', 'CF', 'LW', 'RW'].includes(p.position) }
  let list = c.squad.filter(buckets[filter])
  list = [...list].sort((a, b) => sort === 'ovr' ? b.ovr - a.ovr : sort === 'age' ? a.age - b.age : b.value - a.value)
  const avgOvr = Math.round(c.squad.reduce((s, p) => s + p.ovr, 0) / c.squad.length)
  const avgAge = (c.squad.reduce((s, p) => s + p.age, 0) / c.squad.length).toFixed(1)
  const totalVal = c.squad.reduce((s, p) => s + p.value, 0)

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold">Squad Hub</h1><p className="text-muted-foreground">{c.squad.length} jogadores • OVR médio {avgOvr} • idade média {avgAge} • valor {eur(totalVal)}</p></div>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1">{['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(b => <button key={b} onClick={() => setFilter(b)} className={`px-3 py-1.5 rounded-full text-xs ${filter === b ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{b === 'ALL' ? 'Todos' : b}</button>)}</div>
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ovr">Ordenar: OVR</SelectItem><SelectItem value="age">Ordenar: Idade</SelectItem><SelectItem value="value">Ordenar: Valor</SelectItem></SelectContent></Select>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border"><tr className="[&>th]:text-left [&>th]:p-3 [&>th]:font-medium"><th>Jogador</th><th>Pos</th><th>Idade</th><th>OVR</th><th>POT</th><th>Valor</th><th>Salário</th><th>Papel</th></tr></thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3"><div className="flex items-center gap-2"><PlayerAvatar p={p} /><div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.nationality}</div></div></div></td>
                  <td className="p-3 text-muted-foreground">{p.position}</td>
                  <td className="p-3">{p.age}</td>
                  <td className="p-3"><span className="font-display font-bold text-primary">{p.ovr}</span></td>
                  <td className="p-3 text-muted-foreground">{p.pot}</td>
                  <td className="p-3">{eur(p.value)}</td>
                  <td className="p-3 text-muted-foreground">{wageFmt(p.wage)}</td>
                  <td className="p-3"><Badge variant="outline" className={`text-[10px] ${roleColors[p.role] || ''}`}>{p.role}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ============================= SCOUTING ============================= */
function Scouting({ c, reload }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [detail, setDetail] = useState(null)
  const examples = ['Preciso de um volante jovem até €50M', 'Um zagueiro com potencial acima de 88', 'Atacante brasileiro para o ataque', 'Meia criativo jovem']

  const scout = async (query) => {
    const text = query || q
    if (!text.trim()) return
    setQ(text); setLoading(true); setResults(null)
    try { const d = await api('/careers/' + c.id + '/scout', { method: 'POST', body: { query: text } }); setResults(d.results) }
    catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold flex items-center gap-2">AI Scout<Badge className="bg-primary/15 text-primary border-primary/30"><Sparkles className="h-3 w-3 mr-1" />Realism™</Badge></h1><p className="text-muted-foreground">Descreva o que precisa. A IA busca no banco e o motor de realismo pontua cada alvo.</p></div>
      <Card className="p-4">
        <div className="flex gap-2"><Textarea rows={2} placeholder="Ex: Preciso de um volante jovem para o time com até €50 milhões..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); scout() } }} /><Button className="glow-green shrink-0" onClick={() => scout()} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button></div>
        <div className="flex flex-wrap gap-2 mt-3">{examples.map(e => <button key={e} onClick={() => scout(e)} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground">{e}</button>)}</div>
      </Card>

      {loading && <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>}

      {results && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">{results.length} alvos encontrados — ordenados por realismo + qualidade</div>
          {results.map(p => (
            <Card key={p.id} className="p-4 hover:border-primary/40 transition cursor-pointer" onClick={() => setDetail(p)}>
              <div className="flex items-center gap-3">
                <PlayerAvatar p={p} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">{p.name} <span className="text-xs text-muted-foreground">{p.position} • {p.age}a • {p.fromClubName}</span></div>
                  <div className="text-xs text-muted-foreground truncate">{p.topFactor}</div>
                </div>
                <div className="hidden sm:block text-center px-2"><div className="text-[10px] text-muted-foreground">OVR/POT</div><div className="font-display font-bold">{p.ovr}/{p.pot}</div></div>
                <div className="hidden sm:block text-center px-2"><div className="text-[10px] text-muted-foreground">CUSTO</div><div className="font-medium">{eur(p.expectedFee)}</div></div>
                <RealismRing score={p.realismScore} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && <ScoutReportDialog c={c} player={detail} onClose={() => setDetail(null)} reload={reload} />}
    </div>
  )
}
function RealismRing({ score }) {
  return (
    <div className="text-center shrink-0 w-16">
      <div className={`font-display text-2xl font-bold ${realismColor(score)}`}>{score}</div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden"><div className={`h-full ${realismBg(score)}`} style={{ width: score + '%' }} /></div>
      <div className="text-[9px] text-muted-foreground mt-0.5">REALISM</div>
    </div>
  )
}

function ScoutReportDialog({ c, player, onClose, reload }) {
  const [data, setData] = useState(null)
  const [buying, setBuying] = useState(false)
  const [fee, setFee] = useState('')
  useEffect(() => {
    api('/careers/' + c.id + '/scout-report', { method: 'POST', body: { playerId: player.id } })
      .then(d => { setData(d); setFee(String(d.expectedFee)) }).catch(e => toast.error(e.message))
  }, [player.id])

  const buy = async () => {
    setBuying(true)
    try {
      await api('/careers/' + c.id + '/transfers', { method: 'POST', body: { type: 'buy', playerId: player.id, fee: Number(fee), wage: data.expectedWage } })
      toast.success(`${player.name} contratado por ${eur(Number(fee))}!`); await reload(); onClose()
    } catch (e) { toast.error(e.message); setBuying(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle className="font-display text-2xl flex items-center gap-3"><PlayerAvatar p={player} />{player.name}</DialogTitle></DialogHeader>
        {!data ? <div className="space-y-3 py-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-32 w-full" /></div> : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {[['OVR', data.player.ovr], ['POT', data.player.pot], ['Idade', data.player.age], ['Valor', eur(data.player.value)], ['Custo', eur(data.expectedFee)], ['Sal', wageFmt(data.expectedWage)]].map(([l, v]) => <div key={l} className="p-2 rounded-lg bg-muted/40"><div className="text-[10px] text-muted-foreground">{l}</div><div className="font-display font-bold text-sm">{v}</div></div>)}
            </div>

            <Card className="p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display font-semibold">Realism Score™</div>
                <div className="flex items-center gap-2"><span className={`font-display text-3xl font-bold ${realismColor(data.realism.score)}`}>{data.realism.score}</span><Badge variant="outline" className={realismColor(data.realism.score)}>{data.realism.verdict}</Badge></div>
              </div>
              <div className="space-y-1.5">
                {data.realism.factors.slice(0, 6).map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs"><span className="text-muted-foreground flex-1 pr-2">{f.label}</span><span className={f.impact >= 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{f.impact >= 0 ? '+' : ''}{f.impact}</span></div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs"><span className="text-muted-foreground">Dificuldade de transferência</span><Badge variant="secondary">{data.realism.difficulty}</Badge></div>
            </Card>

            <div className="grid sm:grid-cols-2 gap-3">
              <ReportList title="Prós" items={data.report.pros} color="text-emerald-400" />
              <ReportList title="Contras" items={data.report.cons} color="text-amber-400" />
            </div>
            <ReportList title="Riscos" items={data.report.risks} color="text-red-400" />
            <Card className="p-3 bg-primary/5 border-primary/20 text-sm"><span className="font-medium flex items-center gap-1 mb-1"><Sparkles className="h-3.5 w-3.5 text-primary" />Relatório do Olheiro (IA)</span>{data.report.summary}<div className="text-xs text-muted-foreground mt-2">Papel: {data.report.role} • Confiança IA: {data.report.confidence}</div></Card>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <div className="flex-1"><label className="text-xs text-muted-foreground">Valor da oferta (€M)</label><Input type="number" value={fee} onChange={e => setFee(e.target.value)} /></div>
              <Button className="glow-green mt-4" onClick={buy} disabled={buying}>{buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowLeftRight className="h-4 w-4 mr-1" />Contratar</>}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
function ReportList({ title, items, color }) {
  if (!items || !items.length) return null
  return <div><div className={`text-xs font-semibold mb-1 ${color}`}>{title}</div><ul className="space-y-1">{items.map((it, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className={color}>•</span>{it}</li>)}</ul></div>
}

/* ============================= AI DIRECTOR ============================= */
function AIDirector({ c }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)
  const suggestions = ['Quem devo vender?', 'Precisamos reforçar alguma posição?', 'Quanto posso gastar com segurança?', 'Analise meu elenco']

  useEffect(() => { api('/careers/' + c.id + '/ai-chat').then(d => setMessages(d.messages || [])).catch(() => {}) }, [c.id])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text) => {
    const msg = text || input
    if (!msg.trim() || loading) return
    setInput(''); setMessages(m => [...m, { role: 'user', content: msg }]); setLoading(true)
    try { const d = await api('/careers/' + c.id + '/ai-chat', { method: 'POST', body: { message: msg } }); setMessages(m => [...m, { role: 'assistant', content: d.answer }]) }
    catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="mb-4"><h1 className="font-display text-3xl font-bold flex items-center gap-2"><Sparkles className="h-7 w-7 text-primary" />Diretor Esportivo IA</h1><p className="text-muted-foreground">Conhece o seu save. Baseado em dados reais, nunca inventa números.</p></div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3"><Sparkles className="h-7 w-7 text-primary" /></div>
              <div className="font-display font-semibold">Pergunte sobre a sua carreira no {c.club.name}</div>
              <div className="text-sm text-muted-foreground mb-4">Ele analisa elenco, finanças e objetivos do save.</div>
              <div className="flex flex-wrap gap-2 justify-center">{suggestions.map(s => <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground">{s}</button>)}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-primary" /></div>}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.content}</div>
            </div>
          ))}
          {loading && <div className="flex gap-2"><div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary animate-pulse" /></div><div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div></div>}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-border flex gap-2">
          <Input placeholder="Pergunte ao seu diretor esportivo..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <Button className="glow-green" onClick={() => send()} disabled={loading}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  )
}

/* ============================= TRANSFERS ============================= */
function Transfers({ c, reload }) {
  const [sellId, setSellId] = useState(null)
  const transfers = c.transfers || []
  const spent = transfers.filter(t => t.type === 'buy').reduce((s, t) => s + t.fee, 0)
  const earned = transfers.filter(t => t.type === 'sell').reduce((s, t) => s + t.fee, 0)
  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold">Janela de Transferências</h1><p className="text-muted-foreground">Registre negociações feitas no EA FC. Atualiza elenco e finanças.</p></div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Orçamento" value={eur(c.finances.transferBudget)} color="text-primary" />
        <Stat label="Gastos" value={eur(spent)} />
        <Stat label="Vendas" value={eur(earned)} />
      </div>
      <Card className="p-5">
        <div className="font-display font-semibold mb-3">Vender jogador</div>
        <p className="text-xs text-muted-foreground mb-3">Selecione um jogador do elenco para registrar uma venda.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto scrollbar-thin">
          {[...c.squad].sort((a, b) => b.value - a.value).map(p => (
            <button key={p.id} onClick={() => setSellId(p)} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/30 text-left"><PlayerAvatar p={p} /><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs text-muted-foreground">{p.position} • {eur(p.value)}</div></div></button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="font-display font-semibold mb-3">Histórico de Transferências</div>
        {transfers.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma transferência registrada.</p> : (
          <div className="space-y-2">{transfers.map(t => (
            <div key={t.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-border/40">
              <Badge variant="outline" className={t.type === 'buy' ? 'text-emerald-400 border-emerald-500/30' : 'text-sky-400 border-sky-500/30'}>{t.type === 'buy' ? 'COMPRA' : 'VENDA'}</Badge>
              <span className="font-medium">{t.playerName}</span>
              <span className="text-muted-foreground text-xs flex-1">{t.fromClub} → {t.toClub}</span>
              <span className="font-medium">{eur(t.fee)}</span>
            </div>
          ))}</div>
        )}
      </Card>
      {sellId && <SellDialog c={c} player={sellId} onClose={() => setSellId(null)} reload={reload} />}
    </div>
  )
}
function SellDialog({ c, player, onClose, reload }) {
  const [fee, setFee] = useState(String(Math.round(player.value * 1.1 * 10) / 10))
  const [toClub, setToClub] = useState('')
  const [loading, setLoading] = useState(false)
  const sell = async () => {
    setLoading(true)
    try { await api('/careers/' + c.id + '/transfers', { method: 'POST', body: { type: 'sell', playerId: player.id, fee: Number(fee), toClub: toClub || 'Mercado' } }); toast.success(`${player.name} vendido por ${eur(Number(fee))}`); await reload(); onClose() }
    catch (e) { toast.error(e.message); setLoading(false) }
  }
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent><DialogHeader><DialogTitle>Vender {player.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Valor da venda (€M)"><Input type="number" value={fee} onChange={e => setFee(e.target.value)} /></Field>
          <Field label="Clube comprador (opcional)"><Input value={toClub} onChange={e => setToClub(e.target.value)} placeholder="Ex: Real Madrid" /></Field>
          <Button className="w-full" onClick={sell} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Venda'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ============================= FINANCES ============================= */
function Finances({ c }) {
  const f = c.finances
  const income = Object.entries(f.income).filter(([, v]) => v)
  const totalIncome = income.reduce((s, [, v]) => s + v, 0)
  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold">Finanças</h1><p className="text-muted-foreground">Visão financeira mais profunda que o próprio jogo.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Orçamento transferências" value={eur(f.transferBudget)} color="text-primary" />
        <Stat label="Folha semanal" value={eur(f.wageWeekly / 1000)} />
        <Stat label="Folha anual" value={eur(f.expenses.wages)} />
        <Stat label="FFP Status" value={f.ffpStatus} color="text-emerald-400" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="font-display font-semibold mb-3 flex items-center gap-2 text-emerald-400"><TrendingUp className="h-4 w-4" />Receitas anuais (€M)</div>
          <div className="space-y-3">
            {[['Direitos de TV', f.income.tv], ['Bilheteria', f.income.matchday], ['Comercial / Patrocínios', f.income.commercial], ['Vendas de jogadores', f.income.sales]].map(([l, v]) => (
              <div key={l}><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">{l}</span><span className="font-medium">{eur(v || 0)}</span></div><Progress value={totalIncome ? (v / totalIncome) * 100 : 0} className="h-1.5" /></div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="font-display font-semibold mb-3 flex items-center gap-2 text-red-400"><Wallet className="h-4 w-4" />Despesas (€M)</div>
          <div className="space-y-3">
            {[['Salários (ano)', f.expenses.wages], ['Transferências', f.expenses.transfers], ['Outros', f.expenses.other]].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm py-2 border-b border-border/40"><span className="text-muted-foreground">{l}</span><span className="font-medium">{eur(v || 0)}</span></div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between"><span className="text-sm">Fair Play Financeiro</span><Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">{f.ffpStatus}</Badge></div>
        </Card>
      </div>
    </div>
  )
}

/* ============================= MATCHES ============================= */
function Matches({ c, reload }) {
  const nm = c.nextMatch
  const [form, setForm] = useState({ homeAway: nm?.homeAway || 'home', gf: '', ga: '', competition: nm?.competition || c.club.league })
  const [scorers, setScorers] = useState([])
  const [loading, setLoading] = useState(false)

  const addScorer = () => setScorers([...scorers, { playerId: '', goals: 1, assists: 0 }])
  const setScorer = (i, k, v) => setScorers(scorers.map((s, j) => j === i ? { ...s, [k]: v } : s))

  const submit = async () => {
    if (form.gf === '' || form.ga === '') { toast.error('Informe o placar'); return }
    setLoading(true)
    try {
      const enriched = scorers.filter(s => s.playerId).map(s => { const p = c.squad.find(x => x.id === s.playerId); return { ...s, name: p?.name } })
      await api('/careers/' + c.id + '/matches', { method: 'POST', body: { opponentName: nm.opponentName, opponentClubId: nm.opponentClubId, competition: form.competition, homeAway: form.homeAway, goalsFor: Number(form.gf), goalsAgainst: Number(form.ga), scorers: enriched } })
      toast.success('Resultado registrado! Tabela e narrativa atualizadas.')
      setForm({ homeAway: 'home', gf: '', ga: '', competition: c.club.league }); setScorers([]); await reload()
    } catch (e) { toast.error(e.message); setLoading(false) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold">Match Center</h1><p className="text-muted-foreground">Registre o resultado jogado no EA FC.</p></div>
      <Card className="p-6">
        <div className="text-xs text-muted-foreground mb-3">PRÓXIMO: {c.club.name} vs {nm?.opponentName} • {nm?.competition}</div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center flex-1"><div className="text-sm font-medium mb-2">{form.homeAway === 'home' ? c.club.name : nm?.opponentName}</div><Input type="number" className="text-center text-2xl h-14 font-display font-bold" value={form.homeAway === 'home' ? form.gf : form.ga} onChange={e => setForm({ ...form, [form.homeAway === 'home' ? 'gf' : 'ga']: e.target.value })} /></div>
          <div className="text-muted-foreground font-display text-xl">x</div>
          <div className="text-center flex-1"><div className="text-sm font-medium mb-2">{form.homeAway === 'home' ? nm?.opponentName : c.club.name}</div><Input type="number" className="text-center text-2xl h-14 font-display font-bold" value={form.homeAway === 'home' ? form.ga : form.gf} onChange={e => setForm({ ...form, [form.homeAway === 'home' ? 'ga' : 'gf']: e.target.value })} /></div>
        </div>
        <div className="flex gap-2 justify-center mb-4">
          {['home', 'away'].map(h => <button key={h} onClick={() => setForm({ ...form, homeAway: h })} className={`px-3 py-1.5 rounded-full text-xs ${form.homeAway === h ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{h === 'home' ? 'Jogando em casa' : 'Jogando fora'}</button>)}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">Marcadores ({c.club.name})</span><Button variant="outline" size="sm" onClick={addScorer}><Plus className="h-3 w-3 mr-1" />Adicionar</Button></div>
          {scorers.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Select value={s.playerId} onValueChange={v => setScorer(i, 'playerId', v)}><SelectTrigger className="flex-1"><SelectValue placeholder="Jogador" /></SelectTrigger><SelectContent>{c.squad.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
              <Input type="number" className="w-20" value={s.goals} onChange={e => setScorer(i, 'goals', Number(e.target.value))} placeholder="Gols" />
              <Input type="number" className="w-20" value={s.assists} onChange={e => setScorer(i, 'assists', Number(e.target.value))} placeholder="Assist" />
            </div>
          ))}
        </div>
        <Button className="w-full mt-4 glow-green" onClick={submit} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar Resultado'}</Button>
      </Card>
    </div>
  )
}

/* ============================= STANDINGS ============================= */
function StandingsView({ c }) {
  const rows = c.standings || []
  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold">Classificação</h1><p className="text-muted-foreground">{c.club.league} • {c.season}</p></div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border"><tr className="[&>th]:p-3 [&>th]:font-medium [&>th]:text-center"><th className="!text-left">#</th><th className="!text-left">Clube</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.clubId} className={`border-b border-border/40 [&>td]:p-3 [&>td]:text-center ${r.isUser ? 'bg-primary/10' : 'hover:bg-muted/30'}`}>
                  <td className="!text-left font-medium">{i + 1}</td>
                  <td className="!text-left"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: (r.color || '#333') + '22', color: r.color }}>{initials(r.name)}</div><span className={r.isUser ? 'font-semibold text-primary' : ''}>{r.name}</span></div></td>
                  <td className="font-bold">{r.Pts}</td><td>{r.P}</td><td>{r.W}</td><td>{r.D}</td><td>{r.L}</td><td>{r.GF}</td><td>{r.GA}</td><td>{r.GF - r.GA}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ============================= NEWS ============================= */
function News({ c, reload }) {
  const [gen, setGen] = useState(false)
  const news = c.news || []
  const generate = async () => { setGen(true); try { await api('/careers/' + c.id + '/news/generate', { method: 'POST' }); toast.success('Nova matéria gerada'); await reload() } catch (e) { toast.error(e.message) } finally { setGen(false) } }
  const tagColor = { PARTIDA: 'text-sky-400', MERCADO: 'text-emerald-400', CLUBE: 'text-amber-400', ANALISE: 'text-fuchsia-400' }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-3xl font-bold">Career News Network</h1><p className="text-muted-foreground">Narrativa gerada por IA a partir de eventos reais da sua carreira.</p></div><Button onClick={generate} disabled={gen} className="glow-green">{gen ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1" />Gerar matéria</>}</Button></div>
      <div className="grid gap-3">
        {news.map(n => (
          <Card key={n.id} className="p-5">
            <div className={`text-[10px] uppercase font-semibold mb-1 ${tagColor[n.tag] || 'text-muted-foreground'}`}>{n.tag} • {n.source}</div>
            <div className="font-display font-semibold text-lg">{n.headline}</div>
            {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ============================= BOARD ============================= */
function Board({ c }) {
  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-3xl font-bold">Boardroom</h1><p className="text-muted-foreground">Diretoria do {c.club.name}.</p></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-1 space-y-4">
          <Meter label="Confiança da diretoria" value={c.boardConfidence} icon={Building2} />
          <Meter label="Manager Trust" value={c.managerTrust} icon={Shield} />
          <Meter label="Sentimento da torcida" value={c.fanSentiment} icon={Users} />
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border"><span className="text-muted-foreground">Pressão da imprensa</span><Badge variant="secondary">{c.mediaPressure}</Badge></div>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Reputação do clube</span><span className="font-display font-bold text-primary">{c.club.reputation}</span></div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <div className="font-display font-semibold mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Expectativas & Objetivos</div>
          <div className="space-y-2">
            {(c.objectives || []).map(o => (
              <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                <Badge variant="outline" className="text-[10px]">{o.category}</Badge>
                <span className="text-sm flex-1">{o.text}</span>
                <div className={`h-2 w-2 rounded-full ${o.priority === 'ALTA' ? 'bg-red-400' : o.priority === 'MEDIA' ? 'bg-amber-400' : 'bg-sky-400'}`} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
