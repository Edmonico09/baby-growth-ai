import React from 'react'
import { Lightbulb, ArrowUpRight } from 'lucide-react'

interface QuickPromptsProps {
  prompts: Array<{
    id: string
    text: string
  }>
  onSelect: (text: string) => void
  hideTitle?: boolean
}

export function QuickPrompts({ prompts, onSelect, hideTitle }: QuickPromptsProps) {
  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <p className="text-sm font-semibold text-foreground">Quick Questions</p>
        </div>
      )}
      
      <div className="flex space-y-2 gap-3">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt.text)}
            className="group flex items-start h-20 justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
          >
            <span className="leading-relaxed">{prompt.text}</span>
            <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  )
}