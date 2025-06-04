import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, ArrowRight, MapPin, Archive, Users, Clock, Award } from "lucide-react"

// Types
interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  category: string
  type?: string
  maxParticipants?: number
  currentParticipants?: number
  address?: string
  time?: string
  prize?: string
  description?: string
  price?: number | null
  pre_tournament_image_url?: string | null
  club?: {
    id: string
    name: string
    address?: string
    image?: string
  }
}

interface Category {
  name: string
  lower_range: number
  upper_range: number
}

interface TournamentCardProps {
  tournament: Tournament
  categories: Category[]
  showViewButton?: boolean
}

export default function TournamentCard({
  tournament,
  categories,
  showViewButton = true,
}: TournamentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
  }

  const getCategoryName = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName)
    return category ? category.name : categoryName
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "Próximamente"
      case "IN_PROGRESS":
        return "En curso"
      case "FINISHED":
        return "Finalizado"
      case "PAIRING":
        return "En fase de emparejamiento"
      case "CANCELED":
        return "Cancelado"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800 border-green-200"
      case "FINISHED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "PAIRING":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "CANCELED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-gray-200 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            tournament.pre_tournament_image_url ||
            tournament.club?.image || 
            "/placeholder.svg?height=200&width=300"
          }
          alt={tournament.club?.name || tournament.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-4 right-4">
          <Badge className={`${getStatusColor(tournament.status)} px-3 py-1`}>{getStatusText(tournament.status)}</Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-bold text-lg line-clamp-1">{tournament.name}</h3>
          <p className="text-white/90 text-sm flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
          </p>
        </div>
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
            Categoría {getCategoryName(tournament.category)}
          </Badge>
          {tournament.prize && (
            <div className="flex items-center text-gray-700 text-sm">
              <Award className="h-4 w-4 mr-1 text-blue-600" />
              {tournament.prize}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1">{tournament.club?.address || tournament.address || "Dirección no especificada"}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span>{tournament.time || "Horario no especificado"}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span>
            {tournament.currentParticipants || 0}/{tournament.maxParticipants || "∞"} participantes
          </span>
        </div>

        {tournament.description && (
          <div className="pt-2">
            <p className="text-sm text-gray-600 line-clamp-2">{tournament.description}</p>
          </div>
        )}
      </CardContent>

      {showViewButton && (
        <CardFooter className="bg-gray-50 border-t border-gray-100 p-4">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/tournaments/${tournament.id}`}>
              Ver Detalles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 