'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Loader2, XCircle, Lightbulb, ChevronDown, ChevronUp, ArrowUp, Info, Bot,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore } from '@/store/chat'

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

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

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scroll-smooth">
        {!hasMessages && !loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">AI Health Assistant</h2>
              <p className="text-base text-muted-foreground max-w-sm">
                Your conversation is ready. Ask a question or choose a suggestion below.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="px-1">
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl bg-primary/10 px-4 py-3 text-primary shadow-sm">
                      <p className="text-base leading-relaxed whitespace-pre-wrap font-heading">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
                            ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
                            li: ({ children }) => <li className="text-base leading-relaxed text-foreground font-heading">{children}</li>,
                            p: ({ children }) => <p className="text-base leading-relaxed text-foreground mb-2 last:mb-0 font-heading">{children}</p>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.contextUsed && msg.contextUsed.length > 0 && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
                          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground leading-relaxed font-heading">
                            Based on: {msg.contextUsed.join(' \u00B7 ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 px-1">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <div className="flex items-center gap-1.5 pt-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mx-2 mb-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
          <p className="flex-1 text-base text-destructive font-heading">{error}</p>
          <button
            onClick={clearError}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="px-2 pb-4 pt-2 space-y-2">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowPrompts((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2 text-base font-medium text-foreground font-heading">
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
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptSelect(prompt.text)}
                    className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/10 hover:text-primary font-heading"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={loading || !childId || !conversationId}
            rows={1}
            className="flex-1 bg-transparent px-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none resize-none disabled:opacity-50 font-heading"
          />
          <button
            onClick={handleSend}
            disabled={loading || !childId || !conversationId || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
