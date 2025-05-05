import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Trophy, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Tournament, Category, User } from "@/types" // Assuming types are here
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// Define the props interface
interface RegistrationButtonProps {
  tournament: Tournament;
  category: Category | null; // Allow category to be null initially
  user: User | null;
  isRegistered: boolean;
  loading: boolean;
  router: AppRouterInstance;
  onRegister: () => void; // Or more specific type if arguments are passed
  formatDate: (date: string | Date) => string; // Adjust based on actual formatDate signature
  isRegistering?: boolean; // Optional prop
  isAuthenticated: boolean;
}

export default function RegistrationButton({ 
  tournament, 
  category, 
  user, 
  isRegistered, 
  loading, 
  router, 
  onRegister,
  formatDate,
  isRegistering = false,
  isAuthenticated // Recibe el estado de autenticación
}: RegistrationButtonProps) {
  
  // Muestra cargando si el hook principal está cargando
  if (loading) {
    return (
      <div>
        <Button disabled className="bg-padel-green-600 opacity-70">
          Cargando...
        </Button>
        <div className="mt-2 text-xs text-gray-500">Verificando estado...</div>
      </div>
    )
  }

  // Si el hook indica que no está autenticado
  if (!isAuthenticated) {
    return (
      <div>
        <Button onClick={() => router.push('/login')} className="bg-padel-green-600 hover:bg-padel-green-700">
          Inicia sesión para inscribirte
        </Button>
      </div>
    )
  }

  // Si está autenticado pero el usuario no se cargó (problema potencial)
  if (!user) {
     return (
      <div>
        <Button disabled className="bg-padel-green-600 opacity-70">
          Obteniendo datos de usuario...
        </Button>
        <div className="mt-2 text-xs text-red-500">
          Error: Autenticado pero datos de usuario no disponibles.
        </div>
      </div>
    )
  }

  // Si el usuario ya está registrado
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

  // Si está autenticado, con datos y no registrado, mostrar botón
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