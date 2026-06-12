'use client'

import { useEffect, useRef } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { QuickPrompts } from '@/components/quick-prompts'
import { useChildStore } from '@/store/child'
import { useChatStore } from '@/store/chat'

// const PROMPTS = [
//   { id: '1', text: 'My baby eats very little, what should I do?' },
//   { id: '2', text: 'What foods are rich in iron for babies?' },
//   { id: '3', text: 'My 2-year-old is sleeping poorly.' },
//   { id: '4', text: 'Is my child\'s growth normal?' },
// ]

export default function AssistantPage() {
  const { child, fetch: fetchChild } = useChildStore()
  const {
    activeConversationId, loading, sendMessage,
    createConversation, switchConversation, listConversations,
  } = useChatStore()
  const initialized = useRef(false)

  useEffect(() => {
    fetchChild()
  }, [fetchChild])

  useEffect(() => {
    if (!child || initialized.current) return
    initialized.current = true

    const initConv = async () => {
      await listConversations(child.id)
      const savedId = localStorage.getItem('activeConversationId')
      const convExists = savedId ? useChatStore.getState().conversations.some((c) => c.id === savedId) : false
      if (savedId && convExists) {
        await switchConversation(savedId)
      } else {
        await createConversation(child.id)
      }
    }
    initConv()
  }, [child, listConversations, switchConversation, createConversation])

  const handlePromptSelect = (text: string) => {
    if (child && !loading && activeConversationId) {
      sendMessage(child.id, text)
    }
  }

  return (
    <main className="p-6 md:p-10 h-screen">
      <div className="max-w-5xl mx-auto space-y-6 h-full gap-3">
          <div className="w-full h-full">
            {child ? (
              <ChatInterface childId={child.id} conversationId={activeConversationId} handlePromptSelect={handlePromptSelect} />
            ) : (
              <div className="flex h-[600px] items-center justify-center rounded-2xl bg-card text-muted-foreground">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg font-semibold">
                  AI
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">AI Health Assistant</h1>
                  <p className="text-sm text-muted-foreground">
                    Get expert advice about your child&apos;s health and development
                  </p>
                </div>
              </div>
            )}
          </div>
      </div>
    </main>
  )
}