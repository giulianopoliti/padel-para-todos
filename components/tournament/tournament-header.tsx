import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Trophy, MapPin } from "lucide-react"
import type { Tournament, Category } from "@/types"
import { formatDate } from "./utils"
import { Button } from "@/components/ui/button"

interface TournamentHeaderProps {
  tournament: Tournament
  category: Category | null
  type: "AMERICAN" | "ELIMINATION"
  isClubOwner?: boolean
  isTournamentActive?: boolean
  onStartTournament?: () => void
}

export default function TournamentHeader({
  tournament,
  category,
  type,
  isClubOwner = false,
  isTournamentActive = false,
  onStartTournament
}: TournamentHeaderProps) {
  const typeLabel = type === "AMERICAN" ? "Torneo Americano (1 set)" : "Torneo de Eliminación"

  return (
    <Card className="border-slate-100 shadow-sm hover:border-teal-100 transition-all duration-300 overflow-hidden">
      <div className="h-2 bg-teal-500"></div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-light text-teal-700">{tournament.name}</CardTitle>
            <CardDescription className="flex items-center mt-2 text-slate-500">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm px-3 py-1 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-100">
              {typeLabel}
            </span>
            {isClubOwner && !isTournamentActive && onStartTournament && (
              <Button 
                onClick={onStartTournament} 
                className="bg-blue-600 hover:bg-blue-700 rounded-full text-white font-normal mt-2"
              >
                Comenzar Torneo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="bg-teal-50 w-10 h-10 rounded-full flex items-center justify-center mr-3 border border-teal-100">
              <MapPin className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Organizador</p>
              <p className="font-medium text-slate-700">Club: {tournament.club?.name || 'No especificado'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-teal-50 w-10 h-10 rounded-full flex items-center justify-center mr-3 border border-teal-100">
              <Trophy className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Categoría</p>
              <p className="font-medium text-slate-700">{category?.name || tournament.category}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 