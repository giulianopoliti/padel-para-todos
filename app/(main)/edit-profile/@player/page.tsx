"use client"

import { useState, useEffect, useActionState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { PersonalDataSection } from "@/components/profile/personal-data-section"
import { GameDataSection } from "@/components/profile/game-data-section"
import { SecuritySection } from "@/components/profile/security-section"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { getPlayerProfile, completeUserProfile, type FormState } from "@/app/(main)/edit-profile/actions"
import { Card } from "@/components/ui/card"
import { User } from "lucide-react"

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
  description?: string | null
  gender?: string | null
  preferred_side?: string | null
  club_id?: string | null
  profile_image_url?: string | null
}

const initialFormState: FormState = {
  message: "",
  errors: null,
  success: false,
}

export default function EditProfilePage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>("personal")
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null)
  const [allClubsData, setAllClubsData] = useState<Club[]>([])
  const [isFetchingData, setIsFetchingData] = useState(true)
  const { toast } = useToast()

  // useActionState for form handling
  const [formState, formAction, isPending] = useActionState<FormState, FormData>(completeUserProfile, initialFormState)

  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingData(true)
      try {
        const result = await getPlayerProfile()
        if (result.success && result.userProfile) {
          setUserProfileData(result.userProfile as UserProfile)
          setAllClubsData(result.allClubs || [])
          if (result.message !== "Datos obtenidos con éxito.") {
            toast({ title: "Información", description: result.message })
          }
        } else {
          toast({
            title: "Error al cargar el perfil",
            description: result.message || "No se pudieron obtener los datos del perfil.",
            variant: "destructive",
          })
          setUserProfileData({})
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
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
      
      // Redirect to dashboard on successful update
      if (formState.success) {
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500) // Wait 1.5 seconds to show the success message
      }
    }
  }, [formState, toast, router])

  const renderActiveSection = () => {
    if (isFetchingData || !userProfileData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-200"></div>
            <div className="h-5 w-48 bg-blue-100 rounded"></div>
          </div>
        </div>
      )
    }
    const defaultsForSections = {
      ...userProfileData,
      score: userProfileData.score?.toString() ?? "",
    }

    return (
      <>
        <div style={{ display: activeSection === "personal" ? "block" : "none" }}>
          <PersonalDataSection defaultValues={defaultsForSections} />
        </div>
        <div style={{ display: activeSection === "game" ? "block" : "none" }}>
          <GameDataSection defaultValues={defaultsForSections} allClubs={allClubsData} />
        </div>
        <div style={{ display: activeSection === "security" ? "block" : "none" }}>
          <SecuritySection userEmail={userProfileData.email} />
        </div>
      </>
    )
  }

  const getSectionInfo = () => {
    switch (activeSection) {
      case "personal":
        return {
          title: "Información Personal",
          description: "Gestiona tu información personal y detalles de contacto",
          badge: "Datos Personales",
        }
      case "game":
        return {
          title: "Preferencias de Juego",
          description: "Configura tus preferencias de juego y club",
          badge: "Datos de Juego",
        }
      case "security":
        return {
          title: "Configuración de Seguridad",
          description: "Administra la seguridad de tu cuenta",
          badge: "Seguridad",
        }
      default:
        return {
          title: "Perfil",
          description: "Gestiona tu perfil",
          badge: "Perfil",
        }
    }
  }

  const sectionInfo = getSectionInfo()

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)]">
          {/* Sidebar */}
          <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Mi Perfil</h1>
                  <p className="text-sm text-gray-600">Configuración de cuenta</p>
                </div>
              </div>

              <ProfileSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="p-6 lg:p-8">
              <div className="mb-8">
                <Badge className="mb-3 px-3 py-1 bg-blue-100 text-blue-800 border-0">{sectionInfo.badge}</Badge>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{sectionInfo.title}</h2>
                <p className="text-gray-600 max-w-2xl">{sectionInfo.description}</p>
              </div>

              <form action={formAction} className="max-w-3xl space-y-6">
                {userProfileData?.role && <input type="hidden" name="role" value={userProfileData.role} />}

                {renderActiveSection()}

                <div className="sticky bottom-0 pt-6 pb-4 -mx-4 px-4 bg-gradient-to-t from-white via-white to-transparent">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    disabled={isPending || isFetchingData}
                  >
                    {isPending ? "Actualizando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Card>

      <Toaster />
    </div>
  )
}
