import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { Footer } from '@/components/dashboard/footer'

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="kt-app">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="kt-app__main">
          <Header />
          
          {/* Page Content */}
          <main className="kt-app__content">
            {children}
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  )
}
