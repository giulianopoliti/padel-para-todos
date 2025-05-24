"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { PersonalDataSection } from "@/components/profile/personal-data-section"
import { GameDataSection } from "@/components/profile/game-data-section"
import { SecuritySection } from "@/components/profile/security-section"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

// Mock data and functions for demo purposes
const completeUserProfile = async (formData: FormData) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { message: 'Perfil actualizado correctamente', success: true, errors: null }
}

interface Club {
  id: string
  name: string | null
}

export default function EditProfilePage() {
  const [activeSection, setActiveSection] = useState<string>('personal')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const [allClubs] = useState<Club[]>([
    { id: '1', name: 'Club Deportivo Municipal' },
    { id: '2', name: 'Pádel Center Elite' },
    { id: '3', name: 'Club Raqueta Dorada' }
  ])

  // Mock user data
  const defaultValues = {
    role: 'PLAYER',
    avatar_url: '',
    first_name: 'Juan',
    last_name: 'Pérez',
    dni: '12345678',
    phone: '+34 666 777 888',
    date_of_birth: '1990-05-15',
    category_name: 'Avanzado',
    score: '1500',
    preferred_hand: 'Derecha',
    racket: 'Wilson Pro',
    gender: 'MALE',
    preferred_side: 'DRIVE',
    club_id: '1',
    club_name: 'Club Deportivo Municipal',
    address: 'Calle del Pádel 123, Madrid',
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    try {
      const result = await completeUserProfile(formData)
      if (result.success) {
        toast({
          title: "¡Perfil actualizado!",
          description: "Tus datos han sido actualizados correctamente",
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personal':
        return <PersonalDataSection defaultValues={defaultValues} />
      case 'game':
        return <GameDataSection defaultValues={defaultValues} allClubs={allClubs} />
      case 'security':
        return <SecuritySection />
      default:
        return <PersonalDataSection defaultValues={defaultValues} />
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

            <form onSubmit={handleSubmit} className="max-w-3xl">
              <input type="hidden" name="role" value="PLAYER" />
              {renderActiveSection()}
              
              <div className="mt-8 sticky bottom-8 bg-white/80 backdrop-blur-sm p-4 -mx-4 border-t border-slate-200">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : 'Guardar Cambios'}
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