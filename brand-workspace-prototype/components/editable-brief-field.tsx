'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface EditableBriefFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  onSave: () => void
}

export function EditableBriefField({
  label,
  value,
  onChange,
  onSave,
}: EditableBriefFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const begin = () => {
    setDraft(value)
    setEditing(true)
  }

  const save = () => {
    onChange(draft)
    onSave()
    setEditing(false)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  return (
    <div className="group border-b border-[#efeee9] py-3 last:border-0">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9a988e]">
          {label}
        </label>
        {!editing && (
          <button
            onClick={begin}
            className="rounded p-1 text-[#b0ada3] opacity-0 transition group-hover:opacity-100 hover:bg-[#f1f0eb] hover:text-[#66745a]"
            aria-label={`Edit ${label}`}
            title={`Edit ${label}`}
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={Math.max(2, Math.ceil(draft.length / 45))}
            className="w-full resize-none rounded-md border border-[#b9c1b0] bg-white px-2.5 py-2 text-[12px] leading-5 text-[#45463f] outline-none ring-2 ring-[#dfe4d8]"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-md bg-[#66745a] px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#536248]"
            >
              Save
            </button>
            <button
              onClick={cancel}
              className="rounded-md px-2.5 py-1.5 text-[11px] text-[#77776f] transition hover:bg-[#f1f0eb]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          className={cn(
            'text-[12px] leading-5',
            value ? 'text-[#4e4f48]' : 'italic text-[#aaa79d]'
          )}
        >
          {value || 'Not defined yet'}
        </p>
      )}
    </div>
  )
}
