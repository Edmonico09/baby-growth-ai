'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Loader2, XCircle, Lightbulb, ChevronDown, ChevronUp, ArrowUp, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/store/chat'
import { QuickPrompts } from './quick-prompts'

interface ChatInterfaceProps {
  childId: string
  conversationId: string | null
  handlePromptSelect: (text: string) => void
}

const PROMPTS = [
  { id: '1', text: 'My baby eats very little, what should I do?' },
  { id: '2', text: 'What foods are rich in iron for babies?' },
  { id: '3', text: 'My 2-year-old is sleeping poorly.' },
  { id: '4', text: 'Is my child\'s growth normal?' },
]

export function ChatInterface({ childId, conversationId, handlePromptSelect }: ChatInterfaceProps) {
  const { messages, loading, error, sendMessage, clearError } = useChatStore()
  const [input, setInput] = useState('')
  const [showPrompts, setShowPrompts] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading || !childId || !conversationId) return
    const text = input.trim()
    setInput('')
    try {
      await sendMessage(childId, text)
    } catch {
      // error handled in store
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[600px] items-center flex-col relative">
      {/* Messages area - scrolls independently */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.length === 0 && !loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg font-semibold">
              AI
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Health Assistant</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Get expert advice about your child&apos;s health and development
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[70%] rounded-2xl bg-primary/10 px-4 py-2.5 text-primary">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      AI
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
                            ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
                            li: ({ children }) => <li className="text-sm leading-relaxed text-foreground">{children}</li>,
                            p: ({ children }) => <p className="text-sm leading-relaxed text-foreground mb-2 last:mb-0">{children}</p>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.contextUsed && msg.contextUsed.length > 0 && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
                          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Based on: {msg.contextUsed.join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  AI
                </div>
                <div className="pt-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-start gap-2 px-2 py-3 bg-destructive/5 rounded-lg mt-2">
          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
          <p className="flex-1 text-sm text-destructive">{error}</p>
          <button
            onClick={clearError}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bottom area - quick prompts (collapsible) + input, always visible */}
      <div className='fixed bottom-3 transform p-5'>
        <div className="pt-3 space-y-2">
          <div className="rounded-lg border border-border bg-card">
            <button
              onClick={() => setShowPrompts((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lightbulb className="h-4 w-4 text-primary" />
                Quick Questions
              </span>
              {showPrompts ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showPrompts && (
              <div className="px-4 pb-4">
                <QuickPrompts
                  prompts={PROMPTS}
                  onSelect={handlePromptSelect}
                  hideTitle
                />
              </div>
            )}
          </div>
  
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary transition-shadow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your child's health..."
              disabled={loading || !childId || !conversationId}
              rows={1}
              className="flex-1 h-20 resize-none bg-transparent px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={loading || !childId || !conversationId}
              className="rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}