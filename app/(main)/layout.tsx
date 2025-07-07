import { createClient } from '@/utils/supabase/server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { ThemeProvider } from '@/components/theme-provider'
import '../globals.css'
import { UserProvider } from '@/contexts/user-context'
// import AuthProvider from '@/components/auth-provider' // Eliminamos la importación
import { Toaster } from '@/components/ui/toaster'
import Navbar from '@/components/navbar'
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
  title: 'Sistema de Torneos de Pádel',
  description: 'Sistema para organizar torneos de pádel amateurs',
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get user session with additional verification
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  // Double-check session validity
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Only pass user if both user exists and session is valid
  const initialUser = (user && session && !userError && !sessionError) ? user : null

  if (userError || sessionError) {
    console.log("[Layout] Auth error detected, not passing initialUser:", userError?.message || sessionError?.message)
  }

  return (
    <SupabaseProvider initialUser={initialUser}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <UserProvider> 
          <Navbar /> {/* ✅ Navbar se muestra en todas las páginas */}
          {children}
          <Toaster />
          <SpeedInsights />
        </UserProvider> 
      </ThemeProvider>
    </SupabaseProvider>
  )
}
