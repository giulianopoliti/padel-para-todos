"use client"

import React, { useState, useEffect, useActionState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { ClubProfileSidebar } from '@/components/profile/club/club-profile-sidebar'
import { ClubLegalDataSection } from '@/components/profile/club/club-legal-data-section'
import { ClubServicesSection, Service } from '@/components/profile/club/club-services-section'
import { ClubGallerySection } from '@/components/profile/club/club-gallery-section'
import { ClubSecuritySection } from '@/components/profile/club/club-security-section'
import { getClubProfile, completeClubProfile, ClubFormState } from '@/app/(main)/edit-profile/actions'

// Define a type for the club profile data we expect
interface ClubProfileData {
  id?: string // club's own id from 'clubes' table
  user_id?: string // user id from auth
  email?: string // from 'users' table
  role?: string // from 'users' table
  avatar_url?: string | null // from 'users' table
  name?: string | null // from 'clubes' table
  address?: string | null // from 'clubes' table
  instagram?: string | null // from 'clubes' table
  cover_image_url?: string | null // from 'clubes' table
  gallery_images?: string[] // from 'clubes' table
  // services will be an array of IDs, handled separately
}

const initialClubFormState: ClubFormState = {
  message: "",
  errors: null,
  success: false,
  clubProfile: {},
  allServices: [],
  clubServices: [],
}

export default function EditClubProfilePage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>('legal')
  const [clubProfileData, setClubProfileData] = useState<ClubProfileData | null>(null)
  const [allServices, setAllServices] = useState<Service[]>([])
  const [clubSelectedServices, setClubSelectedServices] = useState<string[]>([])
  const [isFetchingData, setIsFetchingData] = useState(true)
  const { toast } = useToast()

  const [formState, formAction, isPending] = useActionState<ClubFormState, FormData>(
    completeClubProfile,
    initialClubFormState
  )

  // Memoize fetchData
  const fetchData = useCallback(async () => {
    setIsFetchingData(true)
    try {
      const result = await getClubProfile()
      if (result.success && result.clubProfile) {
        setClubProfileData(result.clubProfile as ClubProfileData)
        setAllServices(result.allServices || [])
        setClubSelectedServices(result.clubServices || [])
      } else {
        toast({
          title: "Error al cargar el perfil del Club",
          description: result.message || "No se pudieron obtener los datos del club.",
          variant: "destructive",
        })
        setClubProfileData({})
      }
    } catch (error) {
      console.error('Error fetching club profile data:', error)
      toast({
        title: "Error Crítico",
        description: "Ocurrió un error inesperado al cargar los datos del club.",
        variant: "destructive",
      })
      setClubProfileData({})
    } finally {
      setIsFetchingData(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData() // Initial data load
  }, [fetchData])

  useEffect(() => {
    if (formState?.message && formState.message !== "") {
      toast({
        title: formState.success ? "¡Éxito!" : "Error",
        description: formState.message,
        variant: formState.success ? "default" : "destructive",
      })
      if (formState.success) {
        router.refresh() // Step 1: Tell Next.js to refresh server data
        fetchData()      // Step 2: Explicitly re-fetch and update client state
      }
    }
  }, [formState, toast, router, fetchData])

  const renderActiveSection = () => {
    if (isFetchingData || !clubProfileData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-200 to-blue-200"></div>
            <div className="h-5 w-48 bg-gradient-to-r from-teal-100 to-blue-100 rounded"></div>
          </div>
        </div>
      )
    }

    const defaultsForLegalSection = {
      name: clubProfileData.name,
      address: clubProfileData.address,
      email: clubProfileData.email,
      instagram: clubProfileData.instagram,
      avatar_url: clubProfileData.avatar_url,
    }

    const defaultsForGallerySection = {
      coverImage: clubProfileData.cover_image_url,
      galleryImages: clubProfileData.gallery_images || [],
    }

    return (
      <>
        <div style={{ display: activeSection === 'legal' ? 'block' : 'none' }}>
          <ClubLegalDataSection defaultValues={defaultsForLegalSection} />
        </div>
        <div style={{ display: activeSection === 'services' ? 'block' : 'none' }}>
          <ClubServicesSection 
            allServices={allServices} 
            clubServices={clubSelectedServices} 
          />
        </div>
        <div style={{ display: activeSection === 'gallery' ? 'block' : 'none' }}>
          <ClubGallerySection defaultValues={defaultsForGallerySection} />
        </div>
        <div style={{ display: activeSection === 'security' ? 'block' : 'none' }}>
          <ClubSecuritySection userEmail={clubProfileData.email} />
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50">
      {/* Header space */}
      <div className="h-14"></div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-50 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[calc(100vh-7rem)]">
            {/* Sidebar */}
            <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-gradient-to-b from-teal-50/50 to-blue-50/50">
              <div className="p-6">
                <Badge className="mb-4 px-3 py-1 bg-gradient-to-r from-teal-600/10 to-blue-600/10 text-teal-800 border-0">
                  Panel de Control
                </Badge>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Perfil del Club</h1>
                <p className="text-sm text-slate-500 mb-6">Actualiza la información de tu club</p>
              
                <ClubProfileSidebar 
                  activeSection={activeSection} 
                  onSectionChange={setActiveSection} 
                />
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
              <div className="p-6 md:p-8">
                <div className="mb-8">
                  <Badge className="mb-3 px-4 py-1.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white border-0 rounded-full">
                    {activeSection === 'legal' && 'Datos Legales y Contacto'}
                    {activeSection === 'services' && 'Servicios Ofrecidos'}
                    {activeSection === 'gallery' && 'Galería de Imágenes'}
                    {activeSection === 'security' && 'Seguridad de la Cuenta'}
                  </Badge>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {activeSection === 'legal' && 'Información del Club'}
                    {activeSection === 'services' && 'Gestión de Servicios'}
                    {activeSection === 'gallery' && 'Gestión de Imágenes'}
                    {activeSection === 'security' && 'Configuración de Seguridad'}
                  </h2>
                  <p className="text-slate-600 max-w-2xl">
                    {activeSection === 'legal' && 'Actualiza la información legal, de contacto y general de tu club.'}
                    {activeSection === 'services' && 'Selecciona y gestiona los servicios que tu club ofrece a los usuarios.'}
                    {activeSection === 'gallery' && 'Administra la imagen de portada y galería de fotos de tu club.'}
                    {activeSection === 'security' && 'Administra la seguridad de la cuenta de tu club.'}
                  </p>
                </div>

                {/* Only show form for non-gallery sections since gallery handles its own uploads */}
                {activeSection !== 'gallery' ? (
                  <form action={formAction} className="max-w-3xl space-y-6">
                    {clubProfileData?.role && <input type="hidden" name="role" defaultValue={clubProfileData.role} />}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all duration-200">
                      {renderActiveSection()}
                    </div>
                    
                    <div className="sticky bottom-0 mt-8 pt-4 pb-6 -mx-4 px-4 bg-gradient-to-t from-white via-white to-transparent">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 py-6" 
                        disabled={isPending || isFetchingData}
                      >
                        {isPending ? 'Actualizando Club...' : 'Guardar Cambios del Club'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="max-w-3xl space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all duration-200">
                      {renderActiveSection()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  )
}