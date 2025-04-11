// components/supabase-provider.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/utils/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
  userDetails: any | null
  loading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ 
  children,
  initialUser
}: { 
  children: React.ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [userDetails, setUserDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const getUserDetails = async () => {
      if (user) {
        // Obtener detalles del usuario de la tabla users
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setUserDetails(data)
        }
      }
      setLoading(false)
    }

    getUserDetails()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
          getUserDetails()
        } else {
          setUser(null)
          setUserDetails(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, user])

  return (
    <Context.Provider value={{ supabase, user, userDetails, loading }}>
      {children}
    </Context.Provider>
  )
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase debe usarse dentro de un SupabaseProvider')
  }
  return context
}