"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Player, Category } from "@/types"
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
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

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
          player.club.toLowerCase().includes(term.toLowerCase()),
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

  const getCategoryName = (categoryId: string) => {
    const category = initialCategories.find((c) => c.name === categoryId)
    return category ? category.name : categoryId
  }

  const getCategoryColor = (categoryId: string) => {
    // Asignar colores según la categoría
    switch (categoryId) {
      case "1ª":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "2ª":
        return "bg-teal-100 text-teal-800 border-teal-200"
      case "3ª":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "4ª":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "5ª":
        return "bg-rose-100 text-rose-800 border-rose-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-5 w-5 text-white" />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="bg-gradient-to-r from-slate-300 to-slate-400 w-9 h-9 rounded-full flex items-center justify-center shadow-md">
            <Medal className="h-5 w-5 text-white" />
          </div>
        )
      case 2:
        return (
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
            <Medal className="h-4 w-4 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
            {index + 1}
          </div>
        )
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <span className="text-teal-500 flex items-center">
          <ChevronUp className="h-4 w-4" />
          {trend}
        </span>
      )
    } else if (trend < 0) {
      return (
        <span className="text-rose-500 flex items-center">
          <ChevronDown className="h-4 w-4" />
          {Math.abs(trend)}
        </span>
      )
    } else {
      return <span className="text-slate-400">-</span>
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Ranking de Jugadores
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Descubre a los mejores jugadores y su posición en el ranking oficial
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 mb-10"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Buscar por nombre o club..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-slate-100 focus:border-teal-200 focus:ring-teal-200 rounded-xl text-slate-500 placeholder:text-slate-400"
              />
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="pl-10 border-slate-100 focus:border-teal-200 focus:ring-teal-200 rounded-xl text-slate-500 placeholder:text-slate-400">
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs
            defaultValue="individual"
            className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <TabsList className="w-full border-b border-slate-200 bg-slate-50 p-1">
              <TabsTrigger
                value="individual"
                className="flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Ranking Individual
              </TabsTrigger>
              <TabsTrigger
                value="pairs"
                className="flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
              >
                <Users className="mr-2 h-5 w-5" />
                Ranking de Parejas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="p-0">
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-slate-100">
                  {/* Sistema de puntuación */}
                  <div className="bg-slate-50 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-slate-700 flex items-center">Sistema de puntuación</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowScoreInfo(!showScoreInfo)}
                        className="text-slate-500 hover:text-teal-600"
                      >
                        <Info className="h-4 w-4 mr-1" />
                        {showScoreInfo ? "Ocultar información" : "Ver información"}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showScoreInfo && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg mb-3"
                        >
                          <p>El sistema de puntuación se basa en los resultados obtenidos en torneos oficiales:</p>
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Victorias en torneos: 10-25 puntos</li>
                            <li>Semifinales: 5-15 puntos</li>
                            <li>Cuartos de final: 3-8 puntos</li>
                            <li>Participación: 1-3 puntos</li>
                          </ul>
                          <p className="mt-2">Los puntos varían según la categoría y nivel del torneo.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Encabezados de columna mejorados y separados */}
                    <div className="grid grid-cols-12 text-sm font-medium text-slate-500">
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
                    <div className="divide-y divide-slate-100">
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
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className={`p-4 grid grid-cols-12 gap-2 items-center ${hoveredPlayer === player.id ? "bg-slate-50" : "bg-white"} transition-colors duration-200`}
                            >
                              {/* Posición */}
                              <div className="col-span-1 flex justify-center">{getMedalIcon(index)}</div>

                              {/* Jugador */}
                              <div className="col-span-4 sm:col-span-3">
                                <div className="flex items-center">
                                  <div className="font-semibold text-slate-800">
                                    {player.firstName} {player.lastName}
                                  </div>
                                  {index < 10 && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 bg-amber-50 text-amber-700 border-amber-200"
                                    >
                                      <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                                      Top 10
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500 flex items-center sm:hidden mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {player.club}
                                </div>
                              </div>

                              {/* Club */}
                              <div className="col-span-3 sm:col-span-3 hidden sm:flex items-center">
                                <div className="flex items-center text-slate-600">
                                  <Shield className="h-4 w-4 mr-1.5 text-slate-400" />
                                  <span className="truncate">{player.club}</span>
                                </div>
                              </div>

                              {/* Categoría */}
                              <div className="col-span-2 flex justify-center">
                                <Badge className={`${getCategoryColor(player.category)} px-2.5 py-1`}>
                                  {getCategoryName(player.category)}
                                </Badge>
                              </div>

                              {/* Puntuación simplificada */}
                              <div className="col-span-5 sm:col-span-3 flex items-center justify-center pr-8">
                                <div className="font-bold text-2xl text-teal-600">{player.score}</div>
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
                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              </div>
                            </motion.div>
                          </Link>

                          <AnimatePresence>
                            {expandedPlayer === player.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-slate-50 px-6 py-4 overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                    <div className="flex items-center mb-2">
                                      <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                                      <h3 className="font-semibold text-slate-700">Estadísticas</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Victorias:</span>
                                        <span className="font-medium text-teal-600">
                                          {Math.round(player.matchesPlayed * (player.winRate / 100))}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Derrotas:</span>
                                        <span className="font-medium text-rose-600">
                                          {player.matchesPlayed -
                                            Math.round(player.matchesPlayed * (player.winRate / 100))}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-slate-500">% Victorias:</span>
                                        <span className="font-medium text-slate-700">{player.winRate}%</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                    <div className="flex items-center mb-2">
                                      <Award className="h-5 w-5 text-teal-500 mr-2" />
                                      <h3 className="font-semibold text-slate-700">Logros</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center">
                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                          <Star className="h-3 w-3 mr-1" />
                                          {index < 3 ? "Top 3 Ranking" : "Jugador Destacado"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center">
                                        <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                                          <TrendingUp className="h-3 w-3 mr-1" />
                                          {player.winRate > 80 ? "Alta Efectividad" : "Jugador Constante"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                    <div className="flex items-center mb-2">
                                      <Zap className="h-5 w-5 text-blue-500 mr-2" />
                                      <h3 className="font-semibold text-slate-700">Información</h3>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center">
                                        <MapPin className="h-4 w-4 text-slate-400 mr-2" />
                                        <span className="text-slate-600">{player.club}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Shield className="h-4 w-4 text-slate-400 mr-2" />
                                        <span className="text-slate-600">
                                          Categoría {getCategoryName(player.category)}
                                        </span>
                                      </div>
                                      <div className="mt-2">
                                        <Button
                                          asChild
                                          size="sm"
                                          className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90"
                                        >
                                          <Link href={`/ranking/${player.id}`}>Ver perfil completo</Link>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-medium text-slate-700 mb-2">No se encontraron jugadores</h3>
                      <p className="text-slate-500 max-w-md mx-auto">
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
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-teal-100 to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 shadow-inner"
                  >
                    <Trophy className="h-12 w-12 text-slate-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    Próximamente
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto text-lg">
                    El ranking de parejas estará disponible próximamente. ¡Mantente atento a las actualizaciones!
                  </p>
                  <div className="mt-8">
                    <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white rounded-xl px-6 py-2">
                      Recibir notificaciones
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
