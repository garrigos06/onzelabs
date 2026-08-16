# FC UNIVERSE — Companion SaaS para EA SPORTS FC (não oficial)

## Visão
Transformar o save de Modo Carreira do EA FC em um universo de gestão com dados reais (FC26), Realism Score determinístico + IA (Claude Sonnet 4.5), scouting inteligente, diretoria, finanças, imprensa e narrativa.

## Stack
- Next.js 15 (App Router), MongoDB, shadcn/ui, Tailwind (dark premium).
- IA: Claude Sonnet 4.5 via Emergent LLM proxy (OpenAI-compatible).
- Dados: seed baseado em EA FC 26 (FUTWIZ) — estrelas reais + profundidade de elenco DEMO.

## MVP (Fase 1 + partes 2/3)
- Auth (registro/login por token de sessão).
- Wizard de criação de carreira (clube real, modo de universo, orçamento, temporada).
- Career Dashboard (próxima partida, tabela, objetivos, finanças, moral, notícias).
- Squad Hub (elenco completo, hierarquia STAR/IMPORTANT/ROTATION/SQUAD/PROSPECT, filtros).
- REALISM SCORE™ Engine (determinístico) + explicação IA.
- AI Scout™ (busca em linguagem natural -> filtros -> candidatos -> realismo -> IA).
- Scouting Report por jogador (prós/contras/riscos/preço/salário/papel).
- AI Sporting Director (chat com memória e contexto do save).
- Career News (IA a partir de eventos reais da carreira).
- Match Center / Quick Result (atualiza tabela + estatísticas + memória).
- Transfers (compra/venda atualiza elenco + finanças + histórico).
- Board/Objetivos gerados por IA; Manager Trust / Fan Sentiment / Media Pressure.
- Multi-carreira por usuário.

## Princípios
- IA nunca inventa OVR/POT/idade/valor/salário/resultados — só interpreta dados do banco.
- Realismo = algoritmo determinístico primeiro, IA explica depois.
- Nada de API falsa: se provider indisponível, mostrar estado claro. Dataset DEMO separado.

## Próximas fases
- Tournament Universe (grupos, mata-mata, sorteio, artilharia, awards).
- History/Wrapped/Hall of Fame/Share cards; Admin; Import CSV/JSON.
