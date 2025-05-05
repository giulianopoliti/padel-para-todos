import { createClient } from '@/utils/supabase/server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'
import { UserProvider } from '@/contexts/user-context'
// import AuthProvider from '@/components/auth-provider' // Eliminamos la importación
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/navbar' // 👈 Asegurate de importar la navbar

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
              <Navbar /> {/* ✅ Navbar se muestra en todas las páginas */}
              {children}
              <Toaster />
             </UserProvider> 
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
