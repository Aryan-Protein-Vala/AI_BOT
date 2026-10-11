'use client'

import { Menu, MoreHorizontal, Sparkles } from 'lucide-react'
import { BackendHealth } from '@/lib/types'
import { cn } from '@/lib/utils'

interface WorkspaceHeaderProps {
  onMenu: () => void
  activeView: string
  health: BackendHealth
  saveStatus: string
}

export function WorkspaceHeader({ onMenu, activeView, health, saveStatus }: WorkspaceHeaderProps) {
  return (
    <header className="flex min-h-[78px] items-center justify-between border-b border-[#e7e5de] px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-md p-1.5 text-[#77776f] hover:bg-[#f1f0eb] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#9a988e]">
            <span>Workspace</span>
            <span>/</span>
            <span>{activeView}</span>
          </div>
          <h1 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-[#242520]">
            Building your brand strategy
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend AG-UI Connection Status Indicator */}
        <div className="hidden items-center gap-2 rounded-full border border-[#e7e5de] bg-[#f7f6f2] px-2.5 py-1 text-[11px] sm:flex">
          <span
            className={cn(
              'size-1.5 rounded-full',
              health.status === 'healthy'
                ? 'bg-[#66745a]'
                : health.status === 'needs_configuration'
                ? 'bg-[#d9822b]'
                : 'bg-[#d9482b]'
            )}
          />
          <span className="text-[#65665e]">
            {health.status === 'healthy' ? (
              <span className="flex items-center gap-1">
                <Sparkles className="size-3 text-[#66745a]" /> Pydantic AI Active
              </span>
            ) : health.status === 'needs_configuration' ? (
              'Needs API Key'
            ) : (
              'Connecting...'
            )}
          </span>
        </div>

        <span className="hidden items-center gap-1.5 text-[11px] text-[#8c8b82] sm:flex">
          <span className="size-1.5 rounded-full bg-[#789068]" />
          {saveStatus}
        </span>

        <button
          className="rounded-md p-1.5 text-[#77776f] hover:bg-[#f1f0eb]"
          aria-label="More conversation options"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </div>
    </header>
  )
}
