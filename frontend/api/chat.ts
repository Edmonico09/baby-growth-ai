import { apiClient } from './client'

export interface ChatMessage {
  id: string
  childId: string
  userMessage: string
  assistantMessage: string
  createdAt: string
  contextUsed?: string[]
}

export interface GrowthAnalysisResponse {
  conversationId: string
  analysis: string
  id: string
  userMessage: string
  assistantMessage: string
  createdAt: string
}

export interface ChatHistoryItem {
  id: string
  userMessage: string
  assistantMessage: string
  createdAt: string
}

export interface Conversation {
  id: string
  childId: string
  title: string | null
  summary: string | null
  messageCount: number
  createdAt: string
  updatedAt: string
}

export const chatApi = {
  send: (data: { childId: string; conversationId: string; message: string }) =>
    apiClient.post<ChatMessage>('/api/chat', data).then((r) => r.data),

  history: (conversationId: string) =>
    apiClient.get<ChatHistoryItem[]>('/api/chat/history', { params: { conversationId } }).then((r) => r.data),

  listConversations: (childId: string) =>
    apiClient.get<Conversation[]>('/api/chat/conversations', { params: { childId } }).then((r) => r.data),

  createConversation: (childId: string) =>
    apiClient.post<Conversation>('/api/chat/conversations', { childId }).then((r) => r.data),

  renameConversation: (id: string, title: string) =>
    apiClient.put<Conversation>(`/api/chat/conversations/${id}`, { title }).then((r) => r.data),

  deleteConversation: (id: string) =>
    apiClient.delete(`/api/chat/conversations/${id}`).then((r) => r.data),

  generateTitle: (id: string) =>
    apiClient.post<Conversation>(`/api/chat/conversations/${id}/generate-title`).then((r) => r.data),

  analyzeGrowth: (childId: string) =>
    apiClient.post<GrowthAnalysisResponse>('/api/chat/analyze-growth', { childId }).then((r) => r.data),
}
