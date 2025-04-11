// app/layout.tsx
import { createClient } from '@/utils/supabase/server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

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
  
  // Obtener la sesión inicial del servidor
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const initialUser = session?.user || null

  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <SupabaseProvider initialUser={initialUser}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}