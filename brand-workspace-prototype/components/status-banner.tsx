'use client'

import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { BackendHealth } from '@/lib/types'

interface StatusBannerProps {
  health: BackendHealth
  onCheck: () => void
}

export function StatusBanner({ health, onCheck }: StatusBannerProps) {
  if (health.status === 'healthy') return null

  return (
    <div className="border-b border-[#eeddd0] bg-[#fbf5ee] px-5 py-2.5 sm:px-8 text-[12px] text-[#7d4824]">
      <div className="mx-auto flex max-w-[740px] items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {health.status === 'offline' ? (
            <AlertCircle className="size-4 shrink-0 text-[#c53929]" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-[#d9822b]" />
          )}
          <span>
            {health.status === 'offline'
              ? 'Python AG-UI backend is currently offline on port 8000. Start it using: `uvicorn app.main:app --port 8000`'
              : 'OpenRouter API key is not configured in backend .env. Real AI generation will require setting OPENROUTER_API_KEY.'}
          </span>
        </div>
        <button
          onClick={onCheck}
          className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-[#7d4824] shadow-xs hover:bg-[#f5ede5]"
        >
          <RefreshCw className="size-3" /> Recheck
        </button>
      </div>
    </div>
  )
}
