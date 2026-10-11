'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import {
  ActivityItem,
  BackendHealth,
  BrandBrief,
  BriefKey,
  ChatMessage,
} from '@/lib/types'
import {
  INITIAL_BRIEF,
  normalizeBriefSnapshot,
  streamAgUiRun,
} from '@/lib/ag-ui-client'
import { Sidebar } from './sidebar'
import { WorkspaceHeader } from './workspace-header'
import { ChatMessageItem } from './chat-message-item'
import { ChatComposer } from './chat-composer'
import { BrandBriefPanel } from './brand-brief-panel'
import { StatusBanner } from './status-banner'

const starterMessages: ChatMessage[] = [
  {
    id: 'starter-1',
    role: 'assistant',
    content:
      'Let’s make Lumen House feel as considered as the stays you want to create. I’ll help you shape a clear strategy, then turn it into language your audience can recognize.',
    time: '9:41 AM',
    status: 'complete',
  },
  {
    id: 'starter-2',
    role: 'user',
    content:
      'We are building a collection of small, design-led places to stay. The idea is that travel should feel more human and less like optimizing an itinerary.',
    time: '9:42 AM',
    status: 'complete',
  },
  {
    id: 'starter-3',
    role: 'assistant',
    content:
      'That is a strong starting point. There is a useful tension here: the ease people expect from a modern booking experience, with the texture and serendipity of a local recommendation. I’ve captured that in your positioning and audience notes.',
    time: '9:43 AM',
    status: 'complete',
    toolActivity: 'Synced with Brand Brief (Positioning & Audience)',
  },
]

const initialActivities: ActivityItem[] = [
  {
    id: 'act-1',
    label: 'Positioning',
    detail: 'synchronized from initial brief',
    timeAgo: 'Just now',
    source: 'agent',
  },
  {
    id: 'act-2',
    label: 'Audience notes',
    detail: 'captured in strategy session',
    timeAgo: '12m ago',
    source: 'agent',
  },
  {
    id: 'act-3',
    label: 'Brand brief',
    detail: 'workspace initialized',
    timeAgo: 'Today',
    source: 'user',
  },
]

const suggestions = [
  'Help me define our ideal customer.',
  'Develop our brand positioning.',
  'Create a launch messaging strategy.',
  'Audit our brand brief for gaps.',
]

export default function BrandWorkspace() {
  const [activeView, setActiveView] = useState('Brand strategy')
  const [brief, setBrief] = useState<BrandBrief>(INITIAL_BRIEF)
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities)
  const [saveStatus, setSaveStatus] = useState('Saved just now')
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({ status: 'healthy' })

  const threadIdRef = useRef<string>('')
  const messageEndRef = useRef<HTMLDivElement>(null)

  // Initialize or restore session ID
  useEffect(() => {
    if (!threadIdRef.current) {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('sorsiri_thread_id')
        if (stored) {
          threadIdRef.current = stored
        } else {
          const newId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
          threadIdRef.current = newId
          sessionStorage.setItem('sorsiri_thread_id', newId)
        }
      }
    }
  }, [])

  // Check backend health on mount
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setBackendHealth(data)
      } else {
        setBackendHealth({ status: 'offline' })
      }
    } catch {
      setBackendHealth({ status: 'offline' })
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  // Scroll to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2000)
  }

  const handleCopy = (content: string) => {
    navigator.clipboard?.writeText(content)
    showToast('Message copied to clipboard')
  }

  // Handle user manual editing of brief field
  const handleUserEdit = (key: BriefKey, val: string) => {
    setSaveStatus('Saving edits...')
    setActivities((prev) => [
      {
        id: `act_${Date.now()}`,
        label: key,
        detail: `edited to "${val.slice(0, 32)}${val.length > 32 ? '...' : ''}"`,
        timeAgo: 'Just now',
        source: 'user',
      },
      ...prev.slice(0, 9),
    ])
    window.setTimeout(() => setSaveStatus('Changes synchronized'), 800)
  }

  // Reset or start fresh brief
  const handleNewBrief = () => {
    setBrief(INITIAL_BRIEF)
    setActiveView('Brand strategy')
    const newThread = `thread_${Date.now()}`
    threadIdRef.current = newThread
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sorsiri_thread_id', newThread)
    }
    showToast('New strategy brief initialized')
  }

  // Send message through real AG-UI protocol
  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input
    const trimmed = textToSend.trim()
    if (!trimmed || loading) return

    const userMessageId = `user_${Date.now()}`
    const assistantMessageId = `asst_${Date.now()}`

    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'complete',
    }

    const initialAsstMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'streaming',
    }

    const nextMessages = [...messages, userMsg]
    setMessages([...nextMessages, initialAsstMsg])
    setInput('')
    setLoading(true)
    setSaveStatus('Agent processing...')

    let streamedContent = ''
    let activeToolName = ''
    const updatedFieldsList: string[] = []

    await streamAgUiRun({
      threadId: threadIdRef.current || 'thread_default',
      messages: nextMessages,
      state: brief,
      onTextChunk: (chunk) => {
        streamedContent += chunk
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: streamedContent, status: 'streaming' }
              : m
          )
        )
      },
      onToolCall: (toolName, eventStatus) => {
        if (eventStatus === 'start') {
          activeToolName = toolName
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    toolActivity: `Calling ${toolName.replace(/_/g, ' ')}...`,
                  }
                : m
            )
          )
        }
      },
      onStateSnapshot: (snapshot) => {
        setBrief((current) => {
          const { brief: updated, changedKeys } = normalizeBriefSnapshot(snapshot, current)
          if (changedKeys.length > 0) {
            updatedFieldsList.push(...changedKeys)
            // Log to activity feed
            setActivities((prevActs) => [
              {
                id: `act_${Date.now()}_${Math.random()}`,
                label: changedKeys.join(', '),
                detail: 'updated by agent in shared brief',
                timeAgo: 'Just now',
                source: 'agent',
              },
              ...prevActs.slice(0, 9),
            ])
            setSaveStatus('Brief updated by agent')
          }
          return updated
        })
      },
      onError: (errMsg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content:
                    streamedContent ||
                    `Sorsiri was unable to complete the request: ${errMsg}`,
                  status: 'error',
                }
              : m
          )
        )
        setSaveStatus('Request error')
      },
      onFinish: () => {
        setLoading(false)
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === assistantMessageId) {
              const toolLabel =
                updatedFieldsList.length > 0
                  ? `Updated Brand Brief (${updatedFieldsList.join(', ')})`
                  : activeToolName
                  ? `Completed ${activeToolName.replace(/_/g, ' ')}`
                  : undefined

              return {
                ...m,
                status: m.status === 'error' ? 'error' : 'complete',
                toolActivity: toolLabel,
                updatedFields: updatedFieldsList,
              }
            }
            return m
          })
        )
        setSaveStatus('Saved just now')
      },
    })
  }

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion)
    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>('textarea')?.focus()
    }, 50)
  }

  const handleRetryLast = () => {
    handleSend('Can you revisit your last recommendation with a sharper point of view?')
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-[#fbfaf7] text-[#242520]">
      {/* Sidebar Navigation */}
      <Sidebar
        active={activeView}
        onNavigate={setActiveView}
        onNew={handleNewBrief}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-20 bg-[#242520]/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Center Conversation View */}
      <section className="flex min-w-0 flex-1 flex-col bg-[#fbfaf7]">
        <WorkspaceHeader
          onMenu={() => setMobileOpen(true)}
          activeView={activeView}
          health={backendHealth}
          saveStatus={saveStatus}
        />

        <StatusBanner health={backendHealth} onCheck={checkHealth} />

        {/* Scrollable Conversation Stream */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 sm:px-8">
          <div className="mx-auto w-full max-w-[740px] flex-1 pb-8">
            {/* Header intro hero */}
            <div className="border-b border-[#e7e5de] py-8">
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-[#dfe4d8] text-[#53604a]">
                <Sparkles className="size-4" />
              </div>
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#242520]">
                A clear point of view starts here.
              </h2>
              <p className="mt-2 max-w-[520px] text-[13px] leading-6 text-[#77776f]">
                I collaborate with you to define positioning, target audiences, and launch plans with real-time shared state. Tell me what you’re working through or edit the brief directly.
              </p>

              {/* Suggestions */}
              <div className="mt-5 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => useSuggestion(suggestion)}
                    className="rounded-md border border-[#e2e0d8] bg-white px-3 py-2 text-left text-[11px] text-[#65665e] transition hover:border-[#b9c1b0] hover:text-[#3f473a]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Non-default view badge */}
            {activeView !== 'Brand strategy' && (
              <div className="my-5 rounded-lg border border-[#e7e5de] bg-white p-4 text-[12px] text-[#77776f]">
                You’re exploring the <span className="font-medium text-[#242520]">{activeView}</span> section. The shared brand brief on the right reflects your current strategy.
              </div>
            )}

            {/* Conversation Messages */}
            <div className="divide-y divide-[#efeee9]">
              {messages.map((message) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  onCopy={handleCopy}
                  onRetry={handleRetryLast}
                />
              ))}

              {/* Loading thinking indicator */}
              {loading && !messages.some((m) => m.status === 'streaming' && m.content) && (
                <div className="flex items-center gap-3 py-5">
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#dfe4d8] text-[10px] font-semibold text-[#57624f]">
                    S
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#9a988e]">
                    <span className="size-1.5 animate-pulse rounded-full bg-[#9ba794]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-[#9ba794] [animation-delay:150ms]" />
                    <span className="size-1.5 animate-pulse rounded-full bg-[#9ba794] [animation-delay:300ms]" />
                    <span className="ml-1">Thinking through this with Pydantic AI...</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Multiline Chat Composer */}
        <ChatComposer
          value={input}
          setValue={setInput}
          onSend={() => handleSend()}
          disabled={loading}
        />
      </section>

      {/* Contextual Brand Brief Panel */}
      <BrandBriefPanel
        brief={brief}
        setBrief={setBrief}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activities={activities}
        onUserEdit={handleUserEdit}
      />

      {/* Global Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#242520] px-3.5 py-2 text-xs text-white shadow-lg">
          <Check className="size-3.5 text-[#dfe4d8]" />
          <span>{toast}</span>
        </div>
      )}
    </main>
  )
}
