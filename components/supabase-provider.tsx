// components/supabase-provider.tsx
'use client'

import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  // Create the client only once using useMemo to prevent multiple instances
  const supabase = useMemo(() => createClient(), [])
  
  const [user, setUser] = useState<User | null>(initialUser)
  const [userDetails, setUserDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(!!initialUser) // Start loading if we have an initial user

  // Use a flag to prevent race conditions and multiple state updates
  const fetchingUserDetails = useRef(false)

  const getUserDetails = async (userId: string) => {
    if (!userId || fetchingUserDetails.current) return
    
    try {
      fetchingUserDetails.current = true
      
      // Fetch minimal data and use caching
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, avatar_url')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setUserDetails(data)
      } else if (error) {
        console.error('Error fetching user details:', error.message)
      }
    } catch (e) {
      console.error('Unexpected error in getUserDetails:', e)
    } finally {
      fetchingUserDetails.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    // If we already have a user from SSR, fetch their details
    if (initialUser?.id && !userDetails) {
      getUserDetails(initialUser.id)
    } else {
      setLoading(false)
    }

    // Listen for auth changes using the secure approach
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only use getUser() for security validation when state changes
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const { data: { user: authUser }, error } = await supabase.auth.getUser()
            
            if (error) {
              console.error('Auth error during state change:', error.message)
              setUser(null)
              setLoading(false)
              return
            }
            
            if (authUser) {
              setUser(authUser)
              getUserDetails(authUser.id)
            }
          } catch (e) {
            console.error('Error during auth state change:', e)
            setLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserDetails(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, initialUser])

  const value = useMemo(() => ({
    supabase,
    user,
    userDetails,
    loading
  }), [supabase, user, userDetails, loading])

  return (
    <Context.Provider value={value}>
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