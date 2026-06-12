'use client'

import { useEffect, useState, useCallback } from 'react'
import { MessageCircle, Loader2, ArrowUp } from 'lucide-react'
import { ChatInterface } from '@/components/chat-interface'
import { useChildStore } from '@/store/child'
import { useChatStore } from '@/store/chat'

const PROMPTS = [
  { id: '1', text: 'My baby eats very little, what should I do?' },
  { id: '2', text: 'What foods are rich in iron for babies?' },
  { id: '3', text: 'My 2-year-old is sleeping poorly.' },
  { id: '4', text: 'Is my child\'s growth normal?' },
]

export default function AssistantPage() {
  const { child, fetch: fetchChild } = useChildStore()
  const {
    activeConversationId,
    createConversation, sendMessage, listConversations,
  } = useChatStore()
  const [initialized, setInitialized] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchChild()
  }, [fetchChild])

  useEffect(() => {
    if (!child || initialized) return
    setInitialized(true)
    listConversations(child.id)
  }, [child, initialized, listConversations])

  const startConversation = useCallback(async (text?: string) => {
    if (!child || sending) return
    setSending(true)
    try {
      const convId = await createConversation(child.id)
      if (text) {
        await sendMessage(child.id, text)
      }
    } finally {
      setSending(false)
    }
  }, [child, sending, createConversation, sendMessage])

  const handlePrompt = useCallback((text: string) => {
    startConversation(text)
  }, [startConversation])

  const handleSend = useCallback(() => {
    if (!input.trim() || sending) return
    startConversation(input.trim())
    setInput('')
  }, [input, sending, startConversation])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!child) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">AI Health Assistant</h1>
          <p className="text-sm text-muted-foreground">Please set up a child profile first</p>
        </div>
      </div>
    )
  }

  if (!activeConversationId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="max-w-xl w-full space-y-8">
            <div className="space-y-4 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                <MessageCircle className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">How can I help you today?</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ask anything about your child&apos;s health, growth, nutrition, or development.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handlePrompt(prompt.text)}
                  disabled={sending}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left text-sm transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm disabled:opacity-50"
                >
                  <span className="leading-relaxed text-foreground">{prompt.text}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Ask now &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={sending}
                rows={1}
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <ChatInterface childId={child.id} conversationId={activeConversationId} handlePromptSelect={handlePrompt} />
}
