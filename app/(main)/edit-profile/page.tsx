"use client"

import React, { useState, useEffect, useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { PersonalDataSection } from "@/components/profile/personal-data-section"
import { GameDataSection } from "@/components/profile/game-data-section"
import { SecuritySection } from "@/components/profile/security-section"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { getPlayerProfile, completeUserProfile, FormState } from './actions'

interface Club {
  id: string
  name: string | null
}

// Define a type for the user profile data we expect
interface UserProfile {
  id?: string
  email?: string
  role?: string
  avatar_url?: string | null
  first_name?: string
  last_name?: string
  dni?: string | null
  phone?: string | null
  date_of_birth?: string | null
  category_name?: string | null
  score?: number | null
  preferred_hand?: string | null
  racket?: string | null
  gender?: string | null
  preferred_side?: string | null
  club_id?: string | null
  // Add any other fields that might come from users or players table
}

const initialFormState: FormState = {
  message: "",
  errors: null,
  success: false,
}

export default function EditProfilePage() {
  const [activeSection, setActiveSection] = useState<string>('personal')
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null)
  const [allClubsData, setAllClubsData] = useState<Club[]>([])
  const [isFetchingData, setIsFetchingData] = useState(true)
  const { toast } = useToast()

  // useActionState for form handling
  const [formState, formAction, isPending] = useActionState<FormState, FormData>(
    completeUserProfile,
    initialFormState
  )

  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingData(true)
      try {
        const result = await getPlayerProfile()
        if (result.success && result.userProfile) {
          setUserProfileData(result.userProfile as UserProfile) // Cast to ensure type compatibility
          setAllClubsData(result.allClubs || [])
          if (result.message !== "Datos obtenidos con éxito.") { // Show non-default success messages
            toast({ title: "Información", description: result.message })
          }
        } else {
          toast({
            title: "Error al cargar el perfil",
            description: result.message || "No se pudieron obtener los datos del perfil.",
            variant: "destructive",
          })
          setUserProfileData({}) // Set to empty object to prevent render errors with defaultValues
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
        toast({
          title: "Error Crítico",
          description: "Ocurrió un error inesperado al cargar tus datos.",
          variant: "destructive",
        })
        setUserProfileData({})
      } finally {
        setIsFetchingData(false)
      }
    }
    fetchData()
  }, [toast])

  useEffect(() => {
    if (formState?.message && formState.message !== "") {
      toast({
        title: formState.success ? "¡Éxito!" : "Error",
        description: formState.message,
        variant: formState.success ? "default" : "destructive",
      })
    }
  }, [formState, toast])

  const renderActiveSection = () => {
    if (isFetchingData || !userProfileData) {
      return <div className="text-center p-10">Cargando datos del perfil...</div>
    }
    // Convert score to string for input defaultValue, handle null/undefined
    const defaultsForSections = {
      ...userProfileData,
      score: userProfileData.score?.toString() ?? '',
    }

    switch (activeSection) {
      case 'personal':
        return <PersonalDataSection defaultValues={defaultsForSections} />
      case 'game':
        return <GameDataSection defaultValues={defaultsForSections} allClubs={allClubsData} />
      case 'security':
        return <SecuritySection userEmail={userProfileData.email} />
      default:
        return <PersonalDataSection defaultValues={defaultsForSections} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Top navigation spacing */}
      <div className="h-14"></div>
      
      <div className="container mx-auto">
        <div className="flex min-h-screen">
          {/* Left sidebar */}
          <div className="w-64 border-r border-slate-200 pt-8 pr-8">
            <ProfileSidebar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          </div>

          {/* Main content */}
          <div className="flex-1 pt-8 px-8">
            <div className="mb-8">
              <Badge className="mb-3 px-4 py-1.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white border-0 rounded-full">
                {activeSection === 'personal' && 'Datos Personales'}
                {activeSection === 'game' && 'Datos de Juego'}
                {activeSection === 'security' && 'Seguridad'}
              </Badge>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {activeSection === 'personal' && 'Información Personal'}
                {activeSection === 'game' && 'Preferencias de Juego'}
                {activeSection === 'security' && 'Configuración de Seguridad'}
              </h1>
              <p className="text-slate-600">
                {activeSection === 'personal' && 'Gestiona tu información personal y detalles de contacto'}
                {activeSection === 'game' && 'Configura tus preferencias de juego y club'}
                {activeSection === 'security' && 'Administra la seguridad de tu cuenta'}
              </p>
            </div>

            <form action={formAction} className="max-w-3xl">
              {/* Hidden input for role is no longer strictly necessary if actions.ts doesn't rely on it from form for players,
                  but can be kept for clarity or if other logic uses it. User profile data already has role. */}
              {userProfileData?.role && <input type="hidden" name="role" value={userProfileData.role} />}
              
              {renderActiveSection()}
              
              <div className="mt-8 sticky bottom-8 bg-white/80 backdrop-blur-sm p-4 -mx-4 border-t border-slate-200">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200" 
                  disabled={isPending || isFetchingData}
                >
                  {isPending ? 'Actualizando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  )
}