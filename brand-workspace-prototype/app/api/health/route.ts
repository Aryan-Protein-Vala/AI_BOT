import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const MODEL_NAME = process.env.MODEL_NAME || 'openrouter/free'

export async function GET() {
  // Try Python backend first
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1200)

    const res = await fetch(`${BACKEND_URL}/health`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ ...data, frontend: 'healthy', provider: 'python-fastapi' })
    }
  } catch {
    // If Python local backend is offline (e.g. running on Vercel), the route directly powers the agent via OpenRouter
  }

  // Active AI Engine (OpenRouter)
  return NextResponse.json({
    status: 'healthy',
    model: MODEL_NAME,
    configured: Boolean(OPENROUTER_API_KEY),
    protocol: 'AG-UI',
    framework: 'Pydantic AI / OpenRouter',
    frontend: 'healthy',
    provider: 'cloud-agent',
    message: 'Sorsiri Agent is active and ready for conversation & shared state updates',
  })
}
