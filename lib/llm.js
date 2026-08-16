// Emergent LLM proxy (OpenAI-compatible) -> Claude Sonnet 4.5
const MODEL = 'claude-sonnet-4-5-20250929'

export async function callLLM({ system, messages = [], maxTokens = 1000, temperature = 0.7, json = false }) {
  const base = process.env.EMERGENT_LLM_BASE_URL
  const key = process.env.EMERGENT_LLM_KEY
  if (!base || !key) throw new Error('LLM not configured')

  const msgs = []
  if (system) msgs.push({ role: 'system', content: system })
  for (const m of messages) msgs.push(m)

  const res = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages: msgs, max_tokens: maxTokens, temperature }),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error('LLM error ' + res.status + ' ' + t.slice(0, 200))
  }
  const data = await res.json()
  let text = data?.choices?.[0]?.message?.content || ''
  if (typeof text !== 'string') text = String(text || '')

  if (json) {
    let t = text.trim()
    if (t.startsWith('```')) t = t.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()
    const start = t.indexOf('{')
    const startArr = t.indexOf('[')
    // pick JSON body
    if (startArr !== -1 && (startArr < start || start === -1)) t = t.slice(startArr)
    else if (start !== -1) t = t.slice(start)
    // trim trailing text after last bracket
    const lastObj = t.lastIndexOf('}')
    const lastArr = t.lastIndexOf(']')
    const last = Math.max(lastObj, lastArr)
    if (last !== -1) t = t.slice(0, last + 1)
    return JSON.parse(t)
  }
  return text
}
