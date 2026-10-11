import { BrandBrief, BriefKey, ChatMessage } from './types'

export const INITIAL_BRIEF: BrandBrief = {
  brandName: 'Lumen House',
  industry: 'Independent hospitality',
  targetAudience: 'Design-conscious travelers who want a slower, more personal stay.',
  painPoints: 'Hotels feel interchangeable; planning a thoughtful trip takes too many tabs and too much guesswork.',
  positioning: 'A collection of intimate stays for people who travel to feel somewhere, not simply see it.',
  personality: 'Warm, curious, quietly confident',
  valueProposition: 'Lumen makes meaningful travel feel easy to find and remember.',
  differentiators: 'Local hosts, considered spaces, and itineraries shaped by people who live there.',
  tone: 'Observant, inviting, specific, never salesy.',
  launchObjective: 'Build an early waitlist of 500 design-minded travelers in 30 days.',
}

/**
 * Normalizes raw state snapshot from AG-UI protocol into typed BrandBrief.
 * Handles both snake_case and camelCase field naming conventions.
 */
export function normalizeBriefSnapshot(raw: Record<string, unknown>, current: BrandBrief): { brief: BrandBrief; changedKeys: BriefKey[] } {
  const updated: BrandBrief = { ...current }
  const changedKeys: BriefKey[] = []

  const mappings: Array<{ key: BriefKey; candidates: string[] }> = [
    { key: 'brandName', candidates: ['brandName', 'brand_name'] },
    { key: 'industry', candidates: ['industry'] },
    { key: 'targetAudience', candidates: ['targetAudience', 'target_audience'] },
    { key: 'painPoints', candidates: ['painPoints', 'audience_pain_points', 'pain_points'] },
    { key: 'positioning', candidates: ['positioning'] },
    { key: 'personality', candidates: ['personality'] },
    { key: 'valueProposition', candidates: ['valueProposition', 'value_proposition'] },
    { key: 'differentiators', candidates: ['differentiators'] },
    { key: 'tone', candidates: ['tone', 'tone_of_voice'] },
    { key: 'launchObjective', candidates: ['launchObjective', 'launch_objective'] },
  ]

  for (const { key, candidates } of mappings) {
    for (const cand of candidates) {
      if (cand in raw && typeof raw[cand] === 'string' && raw[cand]) {
        const val = (raw[cand] as string).trim()
        if (val && val !== current[key]) {
          updated[key] = val
          changedKeys.push(key)
        }
        break
      }
    }
  }

  return { brief: updated, changedKeys }
}

export interface SendAgUiParams {
  threadId: string
  messages: ChatMessage[]
  state: BrandBrief
  endpoint?: string
  onTextChunk: (chunk: string) => void
  onToolCall: (name: string, status: 'start' | 'end') => void
  onStateSnapshot: (snapshot: Record<string, unknown>) => void
  onError: (error: string) => void
  onFinish: () => void
}

/**
 * Stream an AG-UI protocol request to the agent backend and parse Server-Sent Events.
 */
export async function streamAgUiRun(params: SendAgUiParams): Promise<void> {
  const {
    threadId,
    messages,
    state,
    endpoint = '/api/agent',
    onTextChunk,
    onToolCall,
    onStateSnapshot,
    onError,
    onFinish,
  } = params

  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  // Format messages according to AG-UI schema (developer, system, assistant, user)
  const agUiMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }))

  const payload = {
    threadId,
    runId,
    messages: agUiMessages,
    state,
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      let errorMsg = `Server returned ${response.status} ${response.statusText}`
      try {
        const errJson = await response.json()
        if (errJson?.detail) {
          errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
        }
      } catch {
        // use fallback text
      }
      onError(errorMsg)
      onFinish()
      return
    }

    if (!response.body) {
      onError('Response body is empty')
      onFinish()
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const dataStr = trimmed.slice(6).trim()
        if (dataStr === '[DONE]') continue

        try {
          const event = JSON.parse(dataStr)

          switch (event.type) {
            case 'TEXT_MESSAGE_CONTENT':
              if (event.delta) onTextChunk(event.delta)
              else if (event.content) onTextChunk(event.content)
              break

            case 'TEXT_MESSAGE_CHUNK':
              if (event.delta) onTextChunk(event.delta)
              break

            case 'TOOL_CALL_START':
              if (event.toolCallName) {
                onToolCall(event.toolCallName, 'start')
              }
              break

            case 'TOOL_CALL_END':
              onToolCall(event.toolCallName || '', 'end')
              break

            case 'STATE_SNAPSHOT':
              if (event.snapshot) {
                onStateSnapshot(event.snapshot as Record<string, unknown>)
              }
              break

            case 'RUN_ERROR':
              onError(event.error || 'Agent encountered an error')
              break

            case 'RUN_FINISHED':
              break

            default:
              break
          }
        } catch {
          // ignore individual event parsing failures
        }
      }
    }

    onFinish()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed'
    onError(message)
    onFinish()
  }
}
