'use client'

import { Check, Copy, RefreshCw, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { ChatMessage } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MessageItemProps {
  message: ChatMessage
  onCopy: (content: string) => void
  onRetry: () => void
}

export function ChatMessageItem({ message, onCopy, onRetry }: MessageItemProps) {
  const isUser = message.role === 'user'
  const isStreaming = message.status === 'streaming'
  const isError = message.status === 'error'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <article className={cn('group flex gap-3 py-5', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[680px] gap-3', isUser && 'flex-row-reverse')}>
        {/* Avatar */}
        <div
          className={cn(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            isUser ? 'bg-[#242520] text-white' : 'bg-[#dfe4d8] text-[#57624f]'
          )}
        >
          {isUser ? 'AM' : 'S'}
        </div>

        {/* Message body */}
        <div className={cn('min-w-0 flex-1', isUser && 'text-right')}>
          <div className="mb-1.5 flex items-center gap-2 text-[10px] text-[#9a988e]">
            <span>{isUser ? 'You' : 'Sorsiri Agent'}</span>
            <span>·</span>
            <span>{message.time}</span>
            {isStreaming && (
              <span className="flex items-center gap-1 rounded-full bg-[#eef1ea] px-1.5 py-0.5 text-[9px] font-medium text-[#64715b]">
                <RefreshCw className="size-2.5 animate-spin" /> Streaming
              </span>
            )}
            {isError && (
              <span className="rounded-full bg-[#fdeeed] px-1.5 py-0.5 text-[9px] font-medium text-[#c53929]">
                Error
              </span>
            )}
          </div>

          {/* Tool execution badge if agent performed shared state action */}
          {message.toolActivity && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-[#dfe4d8] bg-[#f7f9f5] px-2.5 py-1 text-[11px] text-[#57624f]">
              <Sparkles className="size-3 text-[#66745a]" />
              <span>{message.toolActivity}</span>
            </div>
          )}

          {/* Message content */}
          <div
            className={cn(
              'text-[14px] leading-7 text-[#45463f]',
              isUser && 'rounded-lg bg-white px-4 py-2.5 text-left shadow-[0_1px_2px_rgba(36,37,32,0.05)]',
              isError && 'rounded-lg border border-[#f5c6cb] bg-[#fff5f5] px-4 py-2.5 text-left text-[#721c24]'
            )}
          >
            {message.content.split('\n').map((paragraph, index) => (
              paragraph ? (
                <p key={index} className={cn(index > 0 && 'mt-2')}>
                  {paragraph}
                </p>
              ) : (
                <div key={index} className="h-2" />
              )
            ))}
            {isStreaming && (
              <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-[#66745a] align-middle" />
            )}
          </div>

          {/* Actions */}
          <div
            className={cn(
              'mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <button
              onClick={handleCopy}
              className="rounded p-1 text-[#aaa79d] hover:bg-[#f1f0eb] hover:text-[#65665e]"
              aria-label="Copy message"
              title="Copy message"
            >
              {copied ? <Check className="size-3.5 text-[#66745a]" /> : <Copy className="size-3.5" />}
            </button>
            {!isUser && !isStreaming && (
              <button
                onClick={onRetry}
                className="rounded p-1 text-[#aaa79d] hover:bg-[#f1f0eb] hover:text-[#65665e]"
                aria-label="Retry response"
                title="Retry response"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
