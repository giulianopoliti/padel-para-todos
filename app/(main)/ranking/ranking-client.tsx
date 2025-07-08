"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Trophy,
  Medal,
  Search,
  Filter,
  Users,
  ChevronUp,
  ChevronDown,
  Star,
  MapPin,
  Shield,
  TrendingUp,
  Award,
  Zap,
  Info,
  Crown,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import PlayerAvatar from "@/components/player-avatar"
import { Pagination } from "@/components/ui/pagination"
import { PaginationControl } from "@/components/ui/pagination"

interface Player {
  id: string
  firstName: string
  lastName: string
  category: string
  score: number
  club_name?: string
  club?: string
  trend?: number
  winRate?: number
  matchesPlayed?: number
  profileImage?: string
}

interface Category {
  name: string
}

interface RankingClientProps {
  initialPlayers: Player[]
  initialCategories: Category[]
  totalPlayers: number
  currentPage: number
  currentCategory: string | null
  currentClubId: string | null
  pageSize?: number
  totalPages?: number
  error?: string
}

export default function RankingClient({ 
  initialPlayers, 
  initialCategories, 
  totalPlayers,
  currentPage,
  currentCategory,
  currentClubId,
  pageSize = 50,
  totalPages,
  error
}: RankingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState("")
  const [localPlayers, setLocalPlayers] = useState(initialPlayers)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Efecto para inicializar el estado del Select después del montaje
  useEffect(() => {
    setSelectedCategory(currentCategory || "all")
  }, [currentCategory])

  // Efecto para actualizar jugadores locales
  useEffect(() => {
    setLocalPlayers(initialPlayers)
    setIsLoading(false)
  }, [initialPlayers])

  /**
   * Actualiza la URL con los nuevos parámetros de filtro
   * @param newParams - Nuevos parámetros a aplicar
   */
  const updateFilters = (newParams: { 
    page?: number; 
    category?: string | null; 
    clubId?: string | null 
  }) => {
    setIsLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    
    // Actualizar parámetros
    if (newParams.page) {
      params.set("page", newParams.page.toString())
    } else if (newParams.page === undefined && (newParams.category !== undefined || newParams.clubId !== undefined)) {
      // Si cambiamos filtros pero no página, volver a página 1
      params.set("page", "1")
    }

    if (newParams.category !== undefined) {
      if (newParams.category) {
        params.set("category", newParams.category)
      } else {
        params.delete("category")
      }
    }

    if (newParams.clubId !== undefined) {
      if (newParams.clubId) {
        params.set("clubId", newParams.clubId)
      } else {
        params.delete("clubId")
      }
    }

    // Actualizar la URL y esperar la navegación
    router.push(`/ranking?${params.toString()}`)
  }

  // Manejadores de eventos
  const handlePageChange = (page: number) => {
    updateFilters({ page })
  }

  const handleCategoryChange = (category: string) => {
    // Limpiar búsqueda al cambiar filtros
    setSearchTerm("")
    updateFilters({ 
      category: category === "all" ? null : category,
      page: undefined // Esto forzará volver a página 1
    })
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    // Filtrar jugadores localmente por nombre o club
    if (term) {
      const filtered = initialPlayers.filter(
        (player) =>
          `${player.firstName} ${player.lastName}`.toLowerCase().includes(term.toLowerCase()) ||
          (player.club_name && player.club_name.toLowerCase().includes(term.toLowerCase()))
      )
      setLocalPlayers(filtered)
    } else {
      setLocalPlayers(initialPlayers)
    }
  }

  // Funciones auxiliares para la UI
  const getCategoryName = (categoryName: string) => {
    return categoryName
  }

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case "1ª":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "2ª":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "3ª":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "4ª":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "5ª":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200">
            <Trophy className="h-4 w-4" />
          </div>
        )
      case 1:
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-200">
            <Trophy className="h-4 w-4" />
          </div>
        )
      case 2:
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-100">
            <Trophy className="h-4 w-4" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold text-sm">
            {index + 1}
          </div>
        )
    }
  }

  // Calcular el índice base para la numeración
  const baseIndex = (currentPage - 1) * pageSize

  return (
    <div className="container mx-auto py-8 space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Ranking de Jugadores</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar jugador o club..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <Select 
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {initialCategories.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {getCategoryName(category.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {localPlayers.map((player, index) => (
          <Link key={player.id} href={`/ranking/${player.id}`}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getMedalIcon(baseIndex + index)}
                    
                    <PlayerAvatar
                      src={player.profileImage}
                      alt={`${player.firstName} ${player.lastName}`}
                      className={`w-10 h-10 ${index < 3 ? "ring-2 ring-blue-200" : ""}`}
                    />

                    <div>
                      <div className="font-semibold">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge 
                          variant="outline" 
                          className={`${getCategoryColor(player.category)}`}
                        >
                          {player.category}
                        </Badge>
                        {player.club_name && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {player.club_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg">{player.score}</div>
                    <div className="text-sm text-gray-600">puntos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {localPlayers.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron jugadores que coincidan con los criterios de búsqueda
          </div>
        )}
      </div>

      {!searchTerm && (
        <div className="flex justify-center mt-8">
          <PaginationControl
            total={totalPlayers}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  )
}
