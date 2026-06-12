'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'

interface SidebarContextType {
  isOpen: boolean
  toggleSidebar: (open?: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  const toggleSidebar = (open?: boolean) => {
    setIsOpen(open !== undefined ? open : !isOpen)
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
