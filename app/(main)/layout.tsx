import { createClient } from '@/utils/supabase/server'
import { SupabaseProvider } from '@/components/supabase-provider'
import { ThemeProvider } from '@/components/theme-provider'
import '../globals.css'
import { UserProvider } from '@/contexts/user-context'
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

  // 🚀 OPTIMIZACIÓN FASE 1.1: Usar solo getUser() en lugar de doble autenticación
  // 
  // ANTES: Hacíamos 2 llamadas costosas:
  // 1. await supabase.auth.getUser() (500-1000ms)
  // 2. await supabase.auth.getSession() (500-1000ms)
  // 
  // DESPUÉS: Solo getUser() es suficiente porque:
  // - getUser() devuelve el usuario actual si hay sesión válida
  // - Es más eficiente que getSession() para verificar autenticación
  // - El middleware ya se encarga de validar sesiones
  // 
  // IMPACTO ESPERADO: Reducción de 500-1000ms en carga inicial
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  // 🔧 OPTIMIZACIÓN FASE 1.1: Manejo de errores simplificado
  // 
  // ANTES: Validábamos user && session && !userError && !sessionError
  // DESPUÉS: Solo validamos user && !authError
  // 
  // JUSTIFICACIÓN:
  // - Si getUser() devuelve user, la sesión es válida
  // - Si hay error de autenticación, user será null
  // - Eliminamos complejidad innecesaria
  const initialUser = (user && !authError) ? user : null

  // 📝 LOGGING MEJORADO: Más claro y específico
  if (authError) {
    // Solo loggear errores reales, no ausencia de sesión
    if (authError.message !== 'Auth session missing!') {
      console.log("[Layout] Auth error detected:", authError.message)
    }
  }

  // 🎯 DEBUGGING: Información útil para diagnóstico
  console.log("[Layout] Auth Status:", {
    hasUser: !!user,
    userId: user?.id?.substring(0, 8) || 'none',
    hasError: !!authError,
    errorType: authError?.message || 'none',
    passedToProvider: !!initialUser
  })

  return (
    <SupabaseProvider initialUser={initialUser}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <UserProvider> 
          <Navbar />
          {children}
          <Toaster />
          <SpeedInsights />
        </UserProvider> 
      </ThemeProvider>
    </SupabaseProvider>
  )
}
