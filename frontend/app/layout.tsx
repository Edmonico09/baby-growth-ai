import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Poppins } from 'next/font/google'
import { SidebarProvider } from '@/app/providers'
import { AppLayout } from '@/components/app-layout'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'BabyGrowth AI - Child Development Tracking',
  description: 'Track your child\'s growth with AI-powered insights and recommendations for parents',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <SidebarProvider>
          <ErrorBoundary>
            <AppLayout>{children}</AppLayout>
          </ErrorBoundary>
        </SidebarProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
