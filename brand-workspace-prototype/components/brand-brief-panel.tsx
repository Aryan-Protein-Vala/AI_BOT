'use client'

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ActivityItem, BrandBrief, BriefKey } from '@/lib/types'
import { INITIAL_BRIEF } from '@/lib/ag-ui-client'
import { cn } from '@/lib/utils'
import { EditableBriefField } from './editable-brief-field'

interface BrandBriefPanelProps {
  brief: BrandBrief
  setBrief: (brief: BrandBrief) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  activities: ActivityItem[]
  onUserEdit: (key: BriefKey, val: string) => void
}

const fieldGroups: {
  label: string
  fields: { key: BriefKey; label: string; hint?: string }[]
}[] = [
  {
    label: 'Foundation',
    fields: [
      { key: 'brandName', label: 'Brand name' },
      { key: 'industry', label: 'Industry' },
    ],
  },
  {
    label: 'Audience',
    fields: [
      { key: 'targetAudience', label: 'Target audience' },
      { key: 'painPoints', label: 'Audience pain points' },
    ],
  },
  {
    label: 'Positioning',
    fields: [
      { key: 'positioning', label: 'Brand positioning' },
      { key: 'personality', label: 'Brand personality' },
      { key: 'valueProposition', label: 'Primary value proposition' },
      { key: 'differentiators', label: 'Key differentiators' },
    ],
  },
  {
    label: 'Expression',
    fields: [
      { key: 'tone', label: 'Tone of voice' },
      { key: 'launchObjective', label: 'Launch objective' },
    ],
  },
]

export function BrandBriefPanel({
  brief,
  setBrief,
  collapsed,
  setCollapsed,
  activities,
  onUserEdit,
}: BrandBriefPanelProps) {
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  const completed = useMemo(
    () => Object.values(brief).filter((val) => typeof val === 'string' && val.trim().length > 0).length,
    [brief]
  )

  const update = (key: BriefKey, value: string) => {
    setBrief({ ...brief, [key]: value })
    onUserEdit(key, value)
    setDirty(true)
    setSaved(false)
  }

  const save = () => {
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const reset = () => {
    setBrief(INITIAL_BRIEF)
    setDirty(false)
    setSaved(false)
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="hidden w-12 shrink-0 border-l border-[#e7e5de] bg-white text-[#77776f] transition hover:bg-[#fbfaf7] lg:flex lg:items-center lg:justify-center"
        aria-label="Expand brand brief"
        title="Expand brand brief"
      >
        <ChevronLeft className="size-4" />
      </button>
    )
  }

  return (
    <aside className="hidden w-[350px] shrink-0 overflow-y-auto border-l border-[#e7e5de] bg-white px-6 py-6 lg:block">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-[#242520]">
              Brand brief
            </h2>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-medium',
                completed === 10
                  ? 'bg-[#dfe4d8] text-[#53604a]'
                  : 'bg-[#eef1ea] text-[#64715b]'
              )}
            >
              {completed === 10 ? 'Complete' : 'In progress'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#9a988e]">
            A shared working document with the AI agent
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1 text-[#aaa79d] hover:bg-[#f1f0eb] hover:text-[#65665e]"
          aria-label="Collapse brand brief"
          title="Collapse panel"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Completeness meter */}
      <div className="mt-6 rounded-md bg-[#f7f6f2] p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-[#65665e]">Strategy completeness</span>
          <span className="text-[#77776f] font-mono">{completed}/10</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e2e3dc]">
          <div
            className="h-full rounded-full bg-[#7d8d70] transition-all duration-300"
            style={{ width: `${completed * 10}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-[#9a988e]">
          {completed === 10
            ? 'All core strategy dimensions defined.'
            : 'Ask Sorsiri or edit directly to refine any dimension.'}
        </p>
      </div>

      {/* Structured Fields */}
      <div className="mt-5">
        {fieldGroups.map((group) => (
          <section key={group.label} className="mb-5">
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a988e]">
              {group.label}
            </h3>
            {group.fields.map((field) => (
              <EditableBriefField
                key={field.key}
                label={field.label}
                value={brief[field.key]}
                onChange={(value) => update(field.key, value)}
                onSave={() => setDirty(true)}
              />
            ))}
          </section>
        ))}
      </div>

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 -mx-6 border-t border-[#e7e5de] bg-white px-6 pb-1 pt-4">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-[10px]',
              dirty ? 'text-[#9b7049]' : 'text-[#aaa79d]'
            )}
          >
            {dirty ? 'Unsaved edits' : saved ? 'Changes saved' : 'All changes synchronized'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="rounded-md p-1.5 text-[#aaa79d] hover:bg-[#f1f0eb] hover:text-[#65665e]"
              aria-label="Reset brief"
              title="Reset to default brief"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              className="rounded-md bg-[#66745a] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#536248] disabled:cursor-not-allowed disabled:bg-[#d5d9cc]"
            >
              Save brief
            </button>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="mt-7 border-t border-[#e7e5de] pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#77776f]">
            Shared Activity Feed
          </h3>
          <span className="text-[10px] text-[#aaa79d]">Live</span>
        </div>
        <div className="flex flex-col gap-3 text-[11px] text-[#8c8b82]">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex gap-2 items-start">
              <span
                className={cn(
                  'mt-1.5 size-1.5 shrink-0 rounded-full',
                  activity.source === 'agent' ? 'bg-[#789068]' : 'bg-[#d9822b]'
                )}
              />
              <div>
                <span className="font-medium text-[#65665e]">{activity.label}</span>{' '}
                <span className="text-[#8c8b82]">{activity.detail}</span>{' '}
                <span className="text-[10px] text-[#aaa79d]">({activity.timeAgo})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
