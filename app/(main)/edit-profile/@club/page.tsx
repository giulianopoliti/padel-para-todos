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
  }, [toast]) // toast is from useToast, generally stable

  useEffect(() => {
    fetchData() // Initial data load
  }, [fetchData]) // Now depends on the memoized fetchData

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
  }, [formState, toast, router, fetchData]) // Added fetchData to dependency array

  const renderActiveSection = () => {
    if (isFetchingData || !clubProfileData) {
      return <div className="text-center p-10">Cargando datos del club...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="h-14"></div>
      
      <div className="container mx-auto">
        <div className="flex min-h-screen">
          <div className="w-64 border-r border-slate-200 pt-8 pr-8">
            <ClubProfileSidebar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          </div>

          <div className="flex-1 pt-8 px-8">
            <div className="mb-8">
              <Badge className="mb-3 px-4 py-1.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white border-0 rounded-full">
                {activeSection === 'legal' && 'Datos Legales y Contacto'}
                {activeSection === 'services' && 'Servicios Ofrecidos'}
                {activeSection === 'gallery' && 'Galería de Imágenes'}
                {activeSection === 'security' && 'Seguridad de la Cuenta'}
              </Badge>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {activeSection === 'legal' && 'Información del Club'}
                {activeSection === 'services' && 'Gestión de Servicios'}
                {activeSection === 'gallery' && 'Gestión de Imágenes'}
                {activeSection === 'security' && 'Configuración de Seguridad'}
              </h1>
              <p className="text-slate-600">
                {activeSection === 'legal' && 'Actualiza la información legal, de contacto y general de tu club.'}
                {activeSection === 'services' && 'Selecciona y gestiona los servicios que tu club ofrece a los usuarios.'}
                {activeSection === 'gallery' && 'Administra la imagen de portada y galería de fotos de tu club.'}
                {activeSection === 'security' && 'Administra la seguridad de la cuenta de tu club.'}
              </p>
            </div>

            {/* Only show form for non-gallery sections since gallery handles its own uploads */}
            {activeSection !== 'gallery' ? (
              <form action={formAction} className="max-w-3xl">
                {clubProfileData?.role && <input type="hidden" name="role" value={clubProfileData.role} />}
                {renderActiveSection()}
                
                <div className="mt-8 sticky bottom-8 bg-white/80 backdrop-blur-sm p-4 -mx-4 border-t border-slate-200">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200" 
                    disabled={isPending || isFetchingData}
                  >
                    {isPending ? 'Actualizando Club...' : 'Guardar Cambios del Club'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="max-w-3xl">
                {renderActiveSection()}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  )
}