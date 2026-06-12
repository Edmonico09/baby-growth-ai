'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, Home, MessageCircle, User,
  ChevronLeft, ChevronRight, Plus, Trash2, MessageSquare,
  LogOut, Sun, Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/app/providers'
import { useChatStore } from '@/store/chat'
import { useChildStore } from '@/store/child'
import { useAuthStore } from '@/store/auth'
import { useTheme } from '@/components/theme-provider'

export function Sidebar() {
  const { isOpen, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const {
    conversations, activeConversationId,
    listConversations, createConversation, switchConversation, deleteConversation,
  } = useChatStore()
  const { child } = useChildStore()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    if (pathname === '/assistant' && child) {
      listConversations(child.id)
    }
  }, [pathname, child, listConversations])

  const links = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/profile', label: 'Child Profile', icon: User },
    { href: '/growth', label: 'Growth', icon: BarChart3 },
    { href: '/assistant', label: 'AI Assistant', icon: MessageCircle },
  ]

  const handleNewChat = async () => {
    if (!child) return
    const id = await createConversation(child.id)
    router.push('/assistant')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleDeleteConv = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    if (!child) return
    if (confirm('Delete this conversation?')) {
      await deleteConversation(convId, child.id)
    }
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 md:relative',
      isOpen ? 'w-64' : 'w-20'
    )}>
      <div className="flex h-full flex-col px-3 py-4">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className={cn(
            'flex items-center gap-2.5 transition-opacity duration-300',
            !isOpen && 'opacity-0 hidden'
          )}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
              BG
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground leading-tight">BabyGrowth</h1>
              <p className="text-xs text-muted-foreground leading-tight">AI Powered</p>
            </div>
          </div>
          {!isOpen && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm flex-shrink-0 mx-auto">
              BG
            </div>
          )}

          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSidebar()}
              className="h-7 w-7 rounded-full hover:bg-sidebar-accent"
              title="Close sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
            </Button>
          )}
        </div>

        {!isOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSidebar()}
            className="h-7 w-7 rounded-full hover:bg-sidebar-accent mx-auto mb-4"
            title="Open sidebar"
          >
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          </Button>
        )}

        {child && (
          <button
            onClick={handleNewChat}
            title="New Chat"
            className={cn(
              'mb-3 flex items-center gap-3 rounded-xl border border-border bg-background transition-colors hover:bg-sidebar-accent/60',
              isOpen ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center mx-auto w-full'
            )}
          >
            <Plus className="h-4 w-4 flex-shrink-0 text-foreground" />
            {isOpen && <span className="text-sm font-medium text-foreground">New Chat</span>}
          </button>
        )}

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                title={isOpen ? '' : link.label}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-colors',
                  isOpen ? 'px-3 py-2' : 'px-2 py-2 justify-center',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {isOpen && (
                  <span className="text-sm">{link.label}</span>
                )}
              </Link>
            )
          })}

          {/* Conversations section - only on /assistant */}
          {pathname === '/assistant' && isOpen && child && (
            <>
              <div className="pt-5 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">
                  Conversations
                </span>
              </div>
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => switchConversation(conv.id)}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left text-sm transition-colors group',
                      activeConversationId === conv.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                    )}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">
                      {conv.title || 'New Chat'}
                    </span>
                    <Trash2
                      className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={(e) => handleDeleteConv(e, conv.id)}
                    />
                  </button>
                ))}
                {conversations.length === 0 && (
                  <p className="px-3 text-xs text-muted-foreground">
                    No conversations yet
                  </p>
                )}
              </div>
            </>
          )}

          {/* Mini conversations when sidebar collapsed */}
          {pathname === '/assistant' && !isOpen && child && (
            <div className="space-y-1 px-1 pt-2">
              {conversations.slice(0, 5).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => switchConversation(conv.id)}
                  title={conv.title || 'New Chat'}
                  className={cn(
                    'flex items-center justify-center w-full rounded-xl p-2 transition-colors',
                    activeConversationId === conv.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="mt-2 pt-3 border-t border-sidebar-border/60 px-1">
          {isOpen ? (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-muted-foreground truncate">
                {user?.name || user?.email}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} className="h-7 w-7 rounded-full">
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="h-7 w-7 rounded-full">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} className="h-7 w-7 rounded-full">
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="h-7 w-7 rounded-full">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
