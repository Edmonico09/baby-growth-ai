'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User, Menu, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { useSidebar } from '@/app/providers'
import { useTheme } from '@/components/theme-provider'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => toggleSidebar()}>
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold text-foreground">BabyGrowth AI</h2>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user && (
            <>
              <span className="hidden md:block text-sm text-muted-foreground">
                {user.name || user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
