import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ReduxProvider } from '@/providers/ReduxProvider'
import { AuthProvider } from '@/contexts/auth-context'
import { PendingCountProvider } from '@/contexts/pending-count-context'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Guest blog service',
  description: 'A comprehensive guest blog service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <AuthProvider>
              <PendingCountProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    className: 'toast-with-progress',
                    success: {
                      className: 'toast-with-progress toast-success',
                    },
                    error: {
                      className: 'toast-with-progress toast-error',
                    },
                  }}
                />
              </PendingCountProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
