'use client'

import {
  ArrowUp,
  FileText,
  LayoutGrid,
  Lightbulb,
  Plus,
  Settings,
  Target,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  active: string
  onNavigate: (label: string) => void
  onNew: () => void
  mobileOpen: boolean
  onClose: () => void
}

const navigation = [
  { label: 'Overview', icon: LayoutGrid },
  { label: 'Brand strategy', icon: Lightbulb },
  { label: 'Audience', icon: Target },
  { label: 'Messaging', icon: FileText },
  { label: 'Launch plan', icon: ArrowUp },
]

export function Sidebar({ active, onNavigate, onNew, mobileOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col border-r border-[#e7e5de] bg-[#f7f6f2] px-5 py-6 transition-transform duration-200 lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold tracking-[0.22em] text-[#242520]">SORSIRI</div>
          <div className="mt-1 text-[11px] text-[#8c8b82]">Brand Workspace</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[#77776f] hover:bg-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="size-4" />
        </button>
      </div>

      <Button
        onClick={onNew}
        variant="outline"
        className="mt-8 h-9 justify-start gap-2 border-[#dedcd4] bg-white text-xs font-medium text-[#4c5047] shadow-none hover:bg-[#efeee9]"
      >
        <Plus className="size-4" /> New brief
      </Button>

      <nav className="mt-8" aria-label="Workspace navigation">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a988e]">
          Workspace
        </p>
        <div className="flex flex-col gap-1">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                onNavigate(label)
                onClose()
              }}
              className={cn(
                'flex items-center gap-3 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
                active === label
                  ? 'bg-white font-medium text-[#242520] shadow-[0_1px_2px_rgba(36,37,32,0.04)]'
                  : 'text-[#77776f] hover:bg-white/70 hover:text-[#242520]'
              )}
            >
              <Icon className="size-[15px]" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-9 border-t border-[#e7e5de] pt-5">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a988e]">
          Recent conversations
        </p>
        <div className="flex flex-col gap-1">
          {['Finding our point of view', 'A name that feels like us', 'First launch ideas'].map((item, index) => (
            <button
              key={item}
              onClick={() => onNavigate('Brand strategy')}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] text-[#77776f] hover:bg-white/70 hover:text-[#242520]"
            >
              <span className={cn('size-1.5 rounded-full', index === 0 ? 'bg-[#66745a]' : 'bg-[#d2d0c8]')} />
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#e7e5de] pt-4">
        <button className="flex items-center gap-2 text-[12px] text-[#77776f] hover:text-[#242520]">
          <Settings className="size-4" /> Settings
        </button>
        <div className="flex items-center gap-2 rounded-md p-1.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#d5d9cc] text-[10px] font-semibold text-[#53604a]">
            AM
          </span>
        </div>
      </div>
    </aside>
  )
}
