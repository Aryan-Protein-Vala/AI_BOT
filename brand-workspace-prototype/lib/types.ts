export type BriefKey =
  | 'brandName'
  | 'industry'
  | 'targetAudience'
  | 'painPoints'
  | 'positioning'
  | 'personality'
  | 'valueProposition'
  | 'differentiators'
  | 'tone'
  | 'launchObjective'

export type BrandBrief = Record<BriefKey, string>

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  time: string
  status?: 'sending' | 'streaming' | 'complete' | 'error'
  toolActivity?: string
  updatedFields?: string[]
}

export interface ActivityItem {
  id: string
  label: string
  detail: string
  timeAgo: string
  source: 'agent' | 'user'
}

export interface BackendHealth {
  status: 'healthy' | 'needs_configuration' | 'offline'
  model?: string
  configured?: boolean
  protocol?: string
  message?: string
}

export interface AgUiEvent {
  type: string
  timestamp?: number
  messageId?: string
  toolCallId?: string
  toolCallName?: string
  delta?: string
  content?: string
  snapshot?: Record<string, unknown>
  error?: string
}
