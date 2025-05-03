"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Tipo para el contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  userId: string | null
}

// Creamos un contexto con valores predeterminados
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userId: null
})

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext)

// Componente proveedor de autenticación
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[AuthProvider] Verificando autenticación...")
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("[AuthProvider] Error al verificar sesión:", error)
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
        const isValid = !!data.session?.user
        console.log("[AuthProvider] ¿Sesión válida?", isValid)
        
        setIsAuthenticated(isValid)
        setUserId(data.session?.user?.id || null)
      } catch (err) {
        console.error("[AuthProvider] Error inesperado:", err)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] Cambio de estado de autenticación:", event)
      setIsAuthenticated(!!session)
      setUserId(session?.user?.id || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userId }}>
      {children}
    </AuthContext.Provider>
  )
} 