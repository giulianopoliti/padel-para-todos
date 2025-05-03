// app/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'
import { UserProvider } from '@/contexts/user-context'
import AuthProvider from '@/components/auth-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Sistema de Torneos de Pádel',
  description: 'Sistema para organizar torneos de pádel amateurs',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Get authenticated user instead of just session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const initialUser = user || null

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <SupabaseProvider initialUser={initialUser}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <UserProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </UserProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}