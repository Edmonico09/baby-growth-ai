'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
// import { Navbar } from '@/components/navbar'
import { useAuthStore } from '@/store/auth'

const publicPaths = ['/login', '/register']

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, initialized, initialize } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (initialized && !user && !publicPaths.includes(pathname)) {
      router.push('/login')
    }
  }, [initialized, user, pathname, router])

  if (!initialized || (!user && !publicPaths.includes(pathname))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (publicPaths.includes(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-card p-2">
        <main className="flex-1 overflow-y-auto rounded-2xl p-6 bg-background shadow-sm sticky top-24">
          {children}
        </main>
      </div>
    </div>
  )
}
