import { NextRequest } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const MODEL_NAME = process.env.MODEL_NAME || 'openrouter/free'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

const AGENT_SYSTEM_PROMPT = `
You are Sorsiri Brand Strategist, an expert AI partner who collaborates with founders and marketing leaders to develop rigorous, distinctive brand briefs.

Your purpose is to transform raw ideas into coherent, differentiated brand strategies with real-time shared state synchronization.

Operating Principles:
1. Help users develop coherent, actionable brand strategies.
2. Ask concise, pointed clarifying questions when essential context or strategic tension is missing.
3. Prefer sharp, distinctive recommendations over generic marketing buzzwords (avoid clichés like "innovative solution", "game changer", "seamless experience").
4. Keep the structured BrandBrief state synchronized with the conversation: whenever you propose, agree on, or refine strategic elements (brand name, positioning, audience, differentiators, value proposition, tone, launch goal), call the \`update_brand_brief\` tool.
5. Explain your strategic reasoning clearly in refined, user-facing language.
6. Never fabricate customer research or claim to have conducted external empirical studies.
7. Treat user-supplied facts as facts, and label your strategic suggestions as recommendations until confirmed.
8. Distinguish sharp positioning choices from broad appeal: good positioning makes a clear choice about who it is NOT for.
`

const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'update_brand_brief',
      description: 'Update one or more structured fields in the shared brand brief panel.',
      parameters: {
        type: 'object',
        properties: {
          brandName: { type: 'string', description: 'Brand name' },
          industry: { type: 'string', description: 'Industry or market category' },
          targetAudience: { type: 'string', description: 'Target customer segment & psychographics' },
          painPoints: { type: 'string', description: 'Audience pain points and unmet needs' },
          positioning: { type: 'string', description: 'Core strategic positioning statement' },
          personality: { type: 'string', description: 'Brand personality traits' },
          valueProposition: { type: 'string', description: 'Primary value proposition' },
          differentiators: { type: 'string', description: 'Key defensible differentiators' },
          tone: { type: 'string', description: 'Tone of voice guidelines' },
          launchObjective: { type: 'string', description: 'Measurable launch milestone' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_positioning_options',
      description: 'Propose a strategic positioning direction with rationale.',
      parameters: {
        type: 'object',
        properties: {
          angle: { type: 'string', description: 'Strategic angle name' },
          positioning: { type: 'string', description: 'Positioning statement' },
          rationale: { type: 'string', description: 'Strategic rationale' },
        },
        required: ['angle', 'positioning', 'rationale'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'develop_launch_strategy',
      description: 'Set a launch objective and milestones for the brand.',
      parameters: {
        type: 'object',
        properties: {
          launchObjective: { type: 'string', description: 'Quantifiable launch goal' },
          pillars: { type: 'array', items: { type: 'string' }, description: 'Messaging pillars' },
        },
        required: ['launchObjective'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'audit_brand_brief',
      description: 'Audit the current brand brief for missing dimensions.',
      parameters: {
        type: 'object',
        properties: {
          focusArea: { type: 'string', description: 'Specific area to audit' },
        },
      },
    },
  },
]

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ detail: 'Invalid JSON payload' }), { status: 400 })
  }

  // 1. If a local or remote Python FastAPI backend is reachable on BACKEND_URL, proxy to it!
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const backendRes = await fetch(`${BACKEND_URL}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (backendRes.ok) {
      return new Response(backendRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    }
  } catch {
    // Backend offline / not directly reachable on this host (e.g. running on Vercel Cloud)
    // Seamlessly execute via direct OpenRouter engine below!
  }

  // 2. Direct OpenRouter AI Execution (runs live on Vercel & anywhere)
  const messages = (body.messages as Array<{ role: string; content: string }>) || []
  const currentState = (body.state as Record<string, string>) || {}
  const threadId = (body.threadId as string) || `thread_${Date.now()}`
  const runId = (body.runId as string) || `run_${Date.now()}`

  // Format state into prompt
  const stateContext = `
[Current Live Brand Brief State in Session]
- Brand Name: ${currentState.brandName || '(not set)'}
- Industry: ${currentState.industry || '(not set)'}
- Target Audience: ${currentState.targetAudience || '(not set)'}
- Audience Pain Points: ${currentState.painPoints || '(not set)'}
- Positioning: ${currentState.positioning || '(not set)'}
- Personality: ${currentState.personality || '(not set)'}
- Value Proposition: ${currentState.valueProposition || '(not set)'}
- Key Differentiators: ${currentState.differentiators || '(not set)'}
- Tone of Voice: ${currentState.tone || '(not set)'}
- Launch Objective: ${currentState.launchObjective || '(not set)'}

Important: The user can edit any field directly in the UI. If any field was edited, respect those edits as the authoritative source of truth. Whenever you formulate or refine a brand element, always execute the \`update_brand_brief\` tool so the live UI synchronizes immediately.
`

  const openAiMessages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT + '\n' + stateContext },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ]

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const sendEvent = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      sendEvent({ type: 'RUN_STARTED', timestamp: Date.now(), threadId, runId })

      let updatedState = { ...currentState }

      try {
        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://sorsiri.com',
            'X-Title': 'Sorsiri Brand Workspace',
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: openAiMessages,
            tools: AGENT_TOOLS,
            tool_choice: 'auto',
          }),
        })

        if (!openRouterRes.ok) {
          const errText = await openRouterRes.text()
          sendEvent({
            type: 'TEXT_MESSAGE_CONTENT',
            delta: `Error communicating with AI model: ${errText.slice(0, 200)}`,
          })
          sendEvent({ type: 'RUN_FINISHED', timestamp: Date.now() })
          controller.close()
          return
        }

        const completion = await openRouterRes.json()
        const choice = completion.choices?.[0]
        const choiceMessage = choice?.message

        // Process Tool Calls
        if (choiceMessage?.tool_calls && choiceMessage.tool_calls.length > 0) {
          for (const tc of choiceMessage.tool_calls) {
            const fnName = tc.function.name
            let args: Record<string, string> = {}
            try {
              args = JSON.parse(tc.function.arguments)
            } catch {
              // ignore json parse error
            }

            sendEvent({ type: 'TOOL_CALL_START', timestamp: Date.now(), toolCallName: fnName })

            if (fnName === 'update_brand_brief') {
              for (const [k, v] of Object.entries(args)) {
                if (v && typeof v === 'string') {
                  updatedState[k] = v
                }
              }
              sendEvent({ type: 'STATE_SNAPSHOT', timestamp: Date.now(), snapshot: updatedState })
            } else if (fnName === 'propose_positioning_options' && args.positioning) {
              updatedState.positioning = args.positioning
              sendEvent({ type: 'STATE_SNAPSHOT', timestamp: Date.now(), snapshot: updatedState })
            } else if (fnName === 'develop_launch_strategy' && args.launchObjective) {
              updatedState.launchObjective = args.launchObjective
              sendEvent({ type: 'STATE_SNAPSHOT', timestamp: Date.now(), snapshot: updatedState })
            }

            sendEvent({ type: 'TOOL_CALL_END', timestamp: Date.now(), toolCallName: fnName })
          }
        }

        // Output content text
        let contentText = choiceMessage?.content || ''
        if (!contentText && choiceMessage?.tool_calls?.length > 0) {
          // If model only called tools without text, provide a concise follow-up
          contentText = 'I have updated your Brand Brief with those strategic dimensions. What would you like to refine next?'
        }

        if (contentText) {
          // Stream tokens smoothly to client
          const words = contentText.split(' ')
          for (let i = 0; i < words.length; i++) {
            sendEvent({
              type: 'TEXT_MESSAGE_CONTENT',
              delta: (i > 0 ? ' ' : '') + words[i],
            })
            // slight pacing
            if (i % 4 === 0) {
              await new Promise((r) => setTimeout(r, 15))
            }
          }
        }

        sendEvent({ type: 'RUN_FINISHED', timestamp: Date.now() })
        controller.close()
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown AI execution error'
        sendEvent({
          type: 'TEXT_MESSAGE_CONTENT',
          delta: `Sorsiri Agent encountered an error: ${errorMsg}`,
        })
        sendEvent({ type: 'RUN_FINISHED', timestamp: Date.now() })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
