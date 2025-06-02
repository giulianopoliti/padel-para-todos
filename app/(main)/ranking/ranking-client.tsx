"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import Link from "next/link"

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
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
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
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="bg-gray-400 w-9 h-9 rounded-full flex items-center justify-center shadow-md">
            <Medal className="h-5 w-5 text-white" />
          </div>
        )
      case 2:
        return (
          <div className="bg-gray-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
            <Medal className="h-4 w-4 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm border border-gray-200">
            {index + 1}
          </div>
        )
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <span className="text-blue-500 flex items-center">
          <ChevronUp className="h-4 w-4" />
          {trend}
        </span>
      )
    } else if (trend < 0) {
      return (
        <span className="text-gray-500 flex items-center">
          <ChevronDown className="h-4 w-4" />
          {Math.abs(trend)}
        </span>
      )
    } else {
      return <span className="text-gray-400">-</span>
    }
  }

  const togglePlayerExpand = (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null)
    } else {
      setExpandedPlayer(playerId)
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
                <div className="grid grid-cols-1 divide-y divide-gray-100">
                  {/* Sistema de puntuación */}
                  <div className="bg-gray-50 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-700 flex items-center">Sistema de puntuación</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowScoreInfo(!showScoreInfo)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        {showScoreInfo ? "Ocultar información" : "Ver información"}
                      </Button>
                    </div>

                    {showScoreInfo && (
                      <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg mb-3">
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

                    {/* Encabezados de columna */}
                    <div className="grid grid-cols-12 text-sm font-medium text-gray-500">
                      <div className="col-span-1 text-center">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => requestSort("score")}>
                          Pos
                          {sortConfig.key === "score" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </Button>
                      </div>
                      <div className="col-span-4 sm:col-span-3">Jugador</div>
                      <div className="col-span-3 sm:col-span-3 hidden sm:block">Club</div>
                      <div className="col-span-2 text-center">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => requestSort("category")}>
                          Cat.
                          {sortConfig.key === "category" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </Button>
                      </div>
                      <div className="col-span-5 sm:col-span-3 text-center">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => requestSort("score")}>
                          Puntos
                          {sortConfig.key === "score" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {filteredPlayers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {filteredPlayers.map((player, index) => (
                        <div key={player.id}>
                          <Link
                            href={`/ranking/${player.id}`}
                            className="block"
                            onMouseEnter={() => setHoveredPlayer(player.id)}
                            onMouseLeave={() => setHoveredPlayer(null)}
                            onClick={(e) => {
                              // Prevenir navegación si se hace clic en el botón de expandir
                              if ((e.target as HTMLElement).closest(".expand-button")) {
                                e.preventDefault()
                              }
                            }}
                          >
                            <div
                              className={`p-4 grid grid-cols-12 gap-2 items-center ${
                                hoveredPlayer === player.id ? "bg-gray-50" : "bg-white"
                              } transition-colors duration-200`}
                            >
                              {/* Posición */}
                              <div className="col-span-1 flex justify-center">{getMedalIcon(index)}</div>

                              {/* Jugador */}
                              <div className="col-span-4 sm:col-span-3">
                                <div className="flex items-center">
                                  <div className="font-semibold text-gray-800">
                                    {player.firstName} {player.lastName}
                                  </div>
                                  {index < 10 && (
                                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                                      <Star className="h-3 w-3 mr-1 fill-blue-500 text-blue-500" />
                                      Top 10
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center sm:hidden mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {player.club}
                                </div>
                              </div>

                              {/* Club */}
                              <div className="col-span-3 sm:col-span-3 hidden sm:flex items-center">
                                <div className="flex items-center text-gray-600">
                                  <Shield className="h-4 w-4 mr-1.5 text-gray-400" />
                                  <span className="truncate">{player.club}</span>
                                </div>
                              </div>

                              {/* Categoría */}
                              <div className="col-span-2 flex justify-center">
                                <Badge className={`${getCategoryColor(player.category)} px-2.5 py-1`}>
                                  {getCategoryName(player.category)}
                                </Badge>
                              </div>

                              {/* Puntuación */}
                              <div className="col-span-5 sm:col-span-3 flex items-center justify-center pr-8">
                                <div className="font-bold text-2xl text-blue-600">{player.score}</div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="expand-button h-8 w-8 p-0 ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    togglePlayerExpand(player.id)
                                  }}
                                >
                                  {expandedPlayer === player.id ? (
                                    <ChevronUp className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Link>

                          {expandedPlayer === player.id && (
                            <div className="bg-gray-50 px-6 py-4 overflow-hidden">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <Trophy className="h-5 w-5 text-blue-500 mr-2" />
                                    <h3 className="font-semibold text-gray-700">Estadísticas</h3>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500">Victorias:</span>
                                      <span className="font-medium text-blue-600">
                                        {Math.round((player.matchesPlayed || 0) * ((player.winRate || 0) / 100))}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500">Derrotas:</span>
                                      <span className="font-medium text-gray-600">
                                        {(player.matchesPlayed || 0) -
                                          Math.round((player.matchesPlayed || 0) * ((player.winRate || 0) / 100))}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-500">% Victorias:</span>
                                      <span className="font-medium text-gray-700">{player.winRate}%</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <Award className="h-5 w-5 text-blue-500 mr-2" />
                                    <h3 className="font-semibold text-gray-700">Logros</h3>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                        <Star className="h-3 w-3 mr-1" />
                                        {index < 3 ? "Top 3 Ranking" : "Jugador Destacado"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center">
                                      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {(player.winRate || 0) > 80 ? "Alta Efectividad" : "Jugador Constante"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <Zap className="h-5 w-5 text-blue-500 mr-2" />
                                    <h3 className="font-semibold text-gray-700">Información</h3>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-gray-600">{player.club}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Shield className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-gray-600">
                                        Categoría {getCategoryName(player.category)}
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <Button asChild size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                                        <Link href={`/ranking/${player.id}`}>Ver perfil completo</Link>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
