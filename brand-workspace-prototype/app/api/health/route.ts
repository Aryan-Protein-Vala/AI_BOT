import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      return NextResponse.json(
        { status: 'error', code: res.status, message: 'Backend returned non-200' },
        { status: 502 }
      )
    }
    const data = await res.json()
    return NextResponse.json({ ...data, frontend: 'healthy' })
  } catch {
    return NextResponse.json(
      {
        status: 'offline',
        message: `Cannot connect to Python AG-UI backend at ${BACKEND_URL}`,
        frontend: 'healthy',
      },
      { status: 200 }
    )
  }
}
