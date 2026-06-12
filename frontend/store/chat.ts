import { create } from 'zustand'
import { chatApi, type Conversation, type GrowthAnalysisResponse } from '@/api/chat'

interface DisplayMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
  contextUsed?: string[]
}

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: DisplayMessage[]
  loading: boolean
  error: string | null
  analyzingGrowth: boolean

  listConversations: (childId: string) => Promise<void>
  createConversation: (childId: string) => Promise<string>
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string, childId: string) => Promise<void>
  sendMessage: (childId: string, message: string) => Promise<void>
  generateTitle: (convId: string) => Promise<void>
  analyzeGrowth: (childId: string) => Promise<GrowthAnalysisResponse>
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  loading: false,
  error: null,
  analyzingGrowth: false,

  listConversations: async (childId) => {
    try {
      const conversations = await chatApi.listConversations(childId)
      set({ conversations })
    } catch {
      set({ error: 'Failed to load conversations' })
    }
  },

  createConversation: async (childId) => {
    const conv = await chatApi.createConversation(childId)
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: conv.id,
      messages: [],
      error: null,
    }))
    localStorage.setItem('activeConversationId', conv.id)
    return conv.id
  },

  switchConversation: async (id) => {
    set({ activeConversationId: id, messages: [], loading: true, error: null })
    localStorage.setItem('activeConversationId', id)
    try {
      const history = await chatApi.history(id)
      const flat: DisplayMessage[] = []
      for (const item of history) {
        flat.push({
          id: `${item.id}-user`,
          content: item.userMessage,
          role: 'user',
          createdAt: new Date(item.createdAt),
        })
        flat.push({
          id: `${item.id}-assistant`,
          content: item.assistantMessage,
          role: 'assistant',
          createdAt: new Date(item.createdAt),
        })
      }
      set({ messages: flat, loading: false })
    } catch {
      set({ error: 'Failed to load messages', loading: false })
    }
  },

  deleteConversation: async (id, childId) => {
    await chatApi.deleteConversation(id)
    const state = get()
    const updated = state.conversations.filter((c) => c.id !== id)
    const wasActive = state.activeConversationId === id
    let nextId: string | null = null
    if (wasActive) {
      nextId = updated.length > 0 ? updated[0].id : null
      if (nextId) {
        localStorage.setItem('activeConversationId', nextId)
      } else {
        localStorage.removeItem('activeConversationId')
      }
    }
    set({
      conversations: updated,
      activeConversationId: wasActive ? nextId : state.activeConversationId,
      messages: wasActive && nextId ? [] : state.messages,
    })
    if (wasActive && nextId) {
      get().switchConversation(nextId)
    }
  },

  sendMessage: async (childId, message) => {
    const { activeConversationId } = get()
    if (!activeConversationId) return

    const tempId = `temp-${Date.now()}`
    const userMsg: DisplayMessage = {
      id: tempId,
      content: message,
      role: 'user',
      createdAt: new Date(),
    }
    set((state) => ({
      messages: [...state.messages, userMsg],
      loading: true,
      error: null,
    }))

    try {
      const res = await chatApi.send({ childId, conversationId: activeConversationId, message })
      set((state) => ({
        messages: [
          ...state.messages.filter((m) => m.id !== tempId),
          { id: `${res.id}-user`, content: res.userMessage, role: 'user', createdAt: new Date(res.createdAt) },
          { id: `${res.id}-assistant`, content: res.assistantMessage, role: 'assistant', createdAt: new Date(res.createdAt), contextUsed: res.contextUsed },
        ],
        loading: false,
      }))
      const conv = get().conversations.find((c) => c.id === activeConversationId)
      if (conv && conv.messageCount === 0) {
        get().generateTitle(activeConversationId)
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to send message'
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempId),
        error: msg,
        loading: false,
      }))
    }
  },

  clearError: () => set({ error: null }),

  analyzeGrowth: async (childId) => {
    set({ analyzingGrowth: true, error: null })
    try {
      const res = await chatApi.analyzeGrowth(childId)
      set((state) => ({
        conversations: [
          { id: res.conversationId, childId, title: null, summary: null, messageCount: 1, createdAt: res.createdAt, updatedAt: res.createdAt },
          ...state.conversations,
        ],
        analyzingGrowth: false,
      }))
      return res
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to analyze growth'
      set({ error: msg, analyzingGrowth: false })
      throw new Error(msg)
    }
  },

  generateTitle: async (convId) => {
    try {
      const updated = await chatApi.generateTitle(convId)
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === convId ? updated : c)),
      }))
    } catch {
      // silent
    }
  },
}))
