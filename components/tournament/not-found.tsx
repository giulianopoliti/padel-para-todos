import { Button } from "@/components/ui/button"
import { Trophy, ArrowLeft } from "lucide-react"

interface NotFoundProps {
  onBackToTournaments: () => void
}

export default function TournamentNotFound({ onBackToTournaments }: NotFoundProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 text-center">
        <Trophy className="h-16 w-16 text-padel-green-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-padel-green-700 mb-4">Torneo no encontrado</h1>
        <p className="text-gray-600 mb-8">El torneo que estás buscando no existe o ha sido eliminado.</p>
        <Button onClick={onBackToTournaments} className="bg-padel-green-600 hover:bg-padel-green-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Torneos
        </Button>
      </div>
    </div>
  )
} 