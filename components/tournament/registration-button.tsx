import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Trophy, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { RegistrationButtonProps } from "./tournament-types"
import { useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

export default function RegistrationButton({ 
  tournament, 
  category, 
  user, 
  isRegistered, 
  loading, 
  router, 
  onRegister,
  formatDate,
  isRegistering = false 
}: RegistrationButtonProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Añadir logs para depuración
  useEffect(() => {
    console.log("[RegistrationButton] Estado:", {
      user: !!user,
      loading,
      isRegistered,
      isRegistering,
      isAuthenticated,
      authLoading
    })
    // Si hay usuario, mostrar su ID
    if (user) {
      console.log("[RegistrationButton] User ID:", user.id)
    }
  }, [user, loading, isRegistered, isRegistering, isAuthenticated, authLoading])
  
  // Lógica simplificada: si está autenticado según el nuevo provider, y tenemos el user cargado correctamente
  const isLoggedIn = isAuthenticated && !!user
  
  // Mostrar botón cargando si el contexto de usuario está cargando
  if (loading || authLoading) {
    return (
      <div>
        <Button disabled className="bg-padel-green-600 opacity-70">
          Cargando...
        </Button>
        <div className="mt-2 text-xs text-gray-500">Verificando estado de autenticación...</div>
      </div>
    )
  }

  // Si no está logueado según nuestra nueva lógica
  if (!isLoggedIn) {
    return (
      <div>
        <Button onClick={() => router.push('/login')} className="bg-padel-green-600 hover:bg-padel-green-700">
          Inicia sesión para inscribirte
        </Button>
        <div className="mt-2 text-xs text-gray-500">
          Estado Auth: {isAuthenticated ? "Autenticado" : "No autenticado"}, 
          User: {user ? "Cargado" : "No disponible"}
        </div>
      </div>
    )
  }

  // Si el usuario ya está registrado, mostrar mensaje de confirmación
  if (isRegistered) {
    return (
      <div>
        <div className="flex items-center text-padel-green-600">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>Ya estás inscrito en este torneo</span>
        </div>
        <div className="mt-2 text-xs text-gray-500">Usuario ID: {user.id}</div>
      </div>
    )
  }

  // En caso contrario, mostrar botón para registrarse
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-padel-green-600 hover:bg-padel-green-700">
            Quiero inscribirme
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Inscripción al torneo</DialogTitle>
            <DialogDescription>
              Confirma tu inscripción al torneo "{tournament.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-padel-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Torneo</p>
                  <p className="font-medium">{tournament.name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-padel-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Fechas</p>
                  <p className="font-medium">{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-padel-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Club</p>
                  <p className="font-medium">{tournament.club.name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-padel-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Categoría</p>
                  <p className="font-medium">{category?.name || tournament.category}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-padel-green-600 hover:bg-padel-green-700"
              onClick={onRegister}
              disabled={isRegistering}
            >
              {isRegistering ? "Procesando..." : "Confirmar inscripción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mt-2 text-xs text-gray-500">Usuario ID: {user.id}</div>
    </div>
  )
} 