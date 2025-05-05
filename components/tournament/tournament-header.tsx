import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Trophy, MapPin } from "lucide-react"
import type { Tournament, Category } from "@/types"
import { formatDate } from "./utils"

interface TournamentHeaderProps {
  tournament: Tournament
  category: Category | null
  type: "AMERICAN" | "ELIMINATION"
}

export default function TournamentHeader({
  tournament,
  category,
  type
}: TournamentHeaderProps) {
  const typeLabel = type === "AMERICAN" ? "Torneo Americano (1 set)" : "Torneo de Eliminación"

  return (
    <Card className="border-padel-green-100 overflow-hidden">
      <div className="h-2 bg-padel-green-600"></div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl text-padel-green-700">{tournament.name}</CardTitle>
            <CardDescription className="flex items-center mt-2">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
              {typeLabel}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-padel-green-600 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Organizador</p>
              <p className="font-medium">Club: {tournament.club}</p>
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
      </CardContent>
    </Card>
  )
} 