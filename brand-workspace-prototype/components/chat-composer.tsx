'use client'

import { Send } from 'lucide-react'
import { KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface ChatComposerProps {
  value: string
  setValue: (value: string) => void
  onSend: () => void
  disabled: boolean
}

export function ChatComposer({ value, setValue, onSend, disabled }: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229
    ) {
      event.preventDefault()
      if (!disabled && value.trim()) {
        onSend()
      }
    }
  }

  return (
    <div className="border-t border-[#e7e5de] bg-[#fbfaf7] px-5 pb-5 pt-4 sm:px-8">
      <div className="mx-auto max-w-[740px]">
        <div
          className={cn(
            'rounded-lg border bg-white transition-colors',
            disabled
              ? 'border-[#e7e5de] opacity-70'
              : 'border-[#d9d7cf] focus-within:border-[#9ba794] focus-within:ring-2 focus-within:ring-[#dfe4d8]'
          )}
        >
          <textarea
            value={value}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Describe what you'd like to work on (e.g. define positioning, sharpen audience, or plan launch messaging)..."
            className="w-full resize-none bg-transparent px-4 pt-3 text-[13px] leading-6 text-[#242520] outline-none placeholder:text-[#aaa79d]"
            aria-label="Message composer"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[10px] text-[#aaa79d]">
              Enter to send · Shift + Enter for a new line
            </span>
            <button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className="flex size-8 items-center justify-center rounded-md bg-[#66745a] text-white transition-colors hover:bg-[#536248] disabled:cursor-not-allowed disabled:bg-[#d5d9cc]"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-[#aaa79d]">
          Sorsiri collaborates in real-time. Edits you make to the Brand Brief are shared with the agent.
        </p>
      </div>
    </div>
  )
}
