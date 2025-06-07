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
import PlayerAvatar from "@/components/player-avatar"

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
}

export default function RankingClient({ initialPlayers, initialCategories }: RankingClientProps) {
  // Añadimos club a los jugadores para la demo
  const playersWithClub = initialPlayers.map((player) => ({
    ...player,
    club: player.club_name || "Club de Pádel Madrid",
    trend: Math.floor(Math.random() * 5) - 2, // Tendencia aleatoria entre -2 y 2
    winRate: Math.floor(Math.random() * 30) + 70, // Porcentaje de victorias entre 70% y 100%
    matchesPlayed: Math.floor(Math.random() * 50) + 10, // Partidos jugados entre 10 y 60
  }))

  const [players] = useState(playersWithClub)
  const [filteredPlayers, setFilteredPlayers] = useState(playersWithClub)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState({ key: "score", direction: "desc" })
  const [showScoreInfo, setShowScoreInfo] = useState(false)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    applyFilters(term, categoryFilter)
  }

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category)
    applyFilters(searchTerm, category)
  }

  const applyFilters = (term: string, category: string) => {
    let filtered = players

    if (term) {
      filtered = filtered.filter(
        (player) =>
          `${player.firstName} ${player.lastName}`.toLowerCase().includes(term.toLowerCase()) ||
          (player.club && player.club.toLowerCase().includes(term.toLowerCase())),
      )
    }

    if (category !== "all") {
      filtered = filtered.filter((player) => player.category === category)
    }

    // Apply current sorting
    const sortedData = [...filtered].sort((a, b) => {
      if ((a as any)[sortConfig.key] < (b as any)[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if ((a as any)[sortConfig.key] > (b as any)[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

    setFilteredPlayers(sortedData)
  }

  const requestSort = (key: string) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  useEffect(() => {
    // Re-sort when sortConfig changes
    const sortedData = [...filteredPlayers].sort((a, b) => {
      if ((a as any)[sortConfig.key] < (b as any)[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if ((a as any)[sortConfig.key] > (b as any)[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
    setFilteredPlayers(sortedData)
  }, [sortConfig])

  const getCategoryName = (categoryName: string) => {
    return categoryName
  }

  const getCategoryColor = (categoryName: string) => {
    // Asignar colores según la categoría
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
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200"
          >
            <Trophy className="h-4 w-4" />
          </div>
        )
      case 1:
        return (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-200"
          >
            <Trophy className="h-4 w-4" />
          </div>
        )
      case 2:
        return (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-100"
          >
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

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{trend}
        </Badge>
      )
    } else if (trend < 0) {
      return (
        <Badge className="bg-red-100 text-red-700 border-0">
          <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
          {trend}
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-700 border-0">
          <TrendingUp className="h-3 w-3 mr-1" />
          0
        </Badge>
      )
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Ranking de Jugadores</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Descubre a los mejores jugadores y su posición en el ranking oficial
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar por nombre o club..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200 text-gray-600 placeholder:text-gray-400"
              />
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200 text-gray-600 placeholder:text-gray-400">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {initialCategories.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Tabs
            defaultValue="individual"
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <TabsList className="w-full border-b border-gray-200 bg-gray-50 p-1">
              <TabsTrigger
                value="individual"
                className="flex-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Ranking Individual
              </TabsTrigger>
              <TabsTrigger
                value="pairs"
                className="flex-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Users className="mr-2 h-5 w-5" />
                Ranking de Parejas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="p-0">
              <div className="overflow-hidden">
                <Card className="border-slate-200 shadow-lg">
                  <CardContent className="p-0">
                    <div className="bg-slate-900 text-white p-4 rounded-t-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold flex items-center">
                          <Trophy className="mr-2 h-5 w-5 text-amber-400" />
                          Ranking Nacional Completo
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowScoreInfo(!showScoreInfo)}
                          className="text-white hover:text-blue-200 hover:bg-slate-800"
                        >
                          <Info className="h-4 w-4 mr-1" />
                          {showScoreInfo ? "Ocultar info" : "Ver info"}
                        </Button>
                      </div>

                      {showScoreInfo && (
                        <div className="text-sm text-slate-300 bg-slate-800 p-3 rounded-lg mb-3">
                          <p>El sistema de puntuación se basa en los resultados obtenidos en torneos oficiales:</p>
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Victorias en torneos: 10-25 puntos</li>
                            <li>Semifinales: 5-15 puntos</li>
                            <li>Cuartos de final: 3-8 puntos</li>
                            <li>Participación: 1-3 puntos</li>
                          </ul>
                          <p className="mt-2">Los puntos varían según la categoría y nivel del torneo.</p>
                        </div>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredPlayers.length > 0 ? (
                        filteredPlayers.map((player, index) => (
                          <div key={player.id}>
                            <div
                              className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 cursor-pointer ${
                                index < 3 ? "hover:shadow-md" : ""
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                {/* Posición */}
                                {getMedalIcon(index)}

                                {/* Avatar del jugador */}
                                <Link href={`/ranking/${player.id}`}>
                                  <PlayerAvatar
                                    src={player.profileImage}
                                    alt={`${player.firstName} ${player.lastName}`}
                                    className={`w-10 h-10 hover:ring-2 hover:ring-blue-200 transition-all ${index < 3 ? "ring-2 ring-blue-200" : ""}`}
                                  />
                                </Link>

                                                                 {/* Información del jugador */}
                                 <div>
                                   <Link href={`/ranking/${player.id}`} className="hover:text-blue-600 transition-colors">
                                     <div className="font-semibold text-slate-900">{player.firstName} {player.lastName}</div>
                                   </Link>
                                   <div className="flex items-center space-x-2">
                                     <Badge variant="outline" className="text-xs">
                                       Categoría {getCategoryName(player.category)}
                                     </Badge>
                                     <Link href={`/clubes/${player.id}`} className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
                                       {player.club}
                                     </Link>
                                   </div>
                                 </div>
                              </div>

                                                             <div className="flex items-center space-x-4">
                                 <div className="text-right">
                                   <div className="font-bold text-slate-900">{player.score}</div>
                                   <div className="text-xs text-slate-500">puntos</div>
                                 </div>
                               </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center">
                          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-medium text-gray-700 mb-2">No se encontraron jugadores</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            No hay jugadores que coincidan con los filtros seleccionados. Intenta con otros criterios de
                            búsqueda.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t">
                      <div className="text-center text-sm text-slate-600">
                        Mostrando {filteredPlayers.length} de {players.length} jugadores
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pairs">
              <div className="p-6 text-center">
                <div className="py-16 px-4">
                  <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                    <Trophy className="h-12 w-12 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Próximamente</h3>
                  <p className="text-gray-600 max-w-md mx-auto text-lg">
                    El ranking de parejas estará disponible próximamente. ¡Mantente atento a las actualizaciones!
                  </p>
                  <div className="mt-8">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2">
                      Recibir notificaciones
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
