"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Calendar, Search, Filter, ArrowRight, MapPin, Archive, Users } from 'lucide-react'
import { motion } from "framer-motion"

// Tipos
interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  category: string
  club?: {
    name: string
  }
}

interface Category {
  id: string
  name: string
}

export default function TournamentsClient({
  initialTournaments,
  initialCategories,
}: {
  initialTournaments?: Tournament[]
  initialCategories?: Category[]
}) {
  const router = useRouter()
  const [tournaments] = useState<Tournament[]>(initialTournaments || [])
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(initialTournaments || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    applyFilters(term, categoryFilter)
  }

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category)
    applyFilters(searchTerm, category)
  }

  const applyFilters = (term: string, category: string) => {
    let filtered = tournaments

    if (term) {
      filtered = filtered.filter((tournament) => tournament.name.toLowerCase().includes(term.toLowerCase()))
    }

    if (category !== "all") {
      filtered = filtered.filter((tournament) => tournament.category === category)
    }

    setFilteredTournaments(filtered)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Torneos de Pádel
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Descubre todos los torneos disponibles, filtra por categoría y encuentra el torneo perfecto para ti.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Buscar torneos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
              />
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="pl-10 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {initialCategories?.map((category) => (
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
            defaultValue="upcoming"
            className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
          >
            <TabsList className="w-full border-b border-slate-200 bg-slate-50 p-1">
              <TabsTrigger
                value="upcoming"
                className="flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Próximos Torneos
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Torneos Activos
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
              >
                <Archive className="mr-2 h-5 w-5" />
                Torneos Pasados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="p-6">
              {filteredTournaments.filter((t) => t.status === "NOT_STARTED").length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTournaments
                    .filter((t) => t.status === "NOT_STARTED")
                    .map((tournament, index) => (
                      <motion.div
                        key={tournament.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <TournamentCard
                          tournament={tournament}
                          categories={initialCategories || []}
                          onView={() => router.push(`/tournaments/${tournament.id}`)}
                          colorScheme="teal"
                        />
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                    <Calendar className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-medium text-teal-700 mb-2">No hay próximos torneos</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm">
                    No hay próximos torneos disponibles en este momento. Vuelve a consultar más tarde.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="p-6">
              {filteredTournaments.filter((t) => t.status === "IN_PROGRESS").length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTournaments
                    .filter((t) => t.status === "IN_PROGRESS")
                    .map((tournament, index) => (
                      <motion.div
                        key={tournament.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <TournamentCard
                          tournament={tournament}
                          categories={initialCategories || []}
                          onView={() => router.push(`/tournaments/${tournament.id}`)}
                          colorScheme="blue"
                        />
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <Trophy className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-medium text-blue-700 mb-2">No hay torneos activos</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm">
                    No hay torneos en curso en este momento. Consulta los próximos torneos para inscribirte.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="p-6">
              {filteredTournaments.filter((t) => t.status === "FINISHED").length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTournaments
                    .filter((t) => t.status === "FINISHED")
                    .map((tournament, index) => (
                      <motion.div
                        key={tournament.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <TournamentCard
                          tournament={tournament}
                          categories={initialCategories || []}
                          onView={() => router.push(`/tournaments/${tournament.id}`)}
                          colorScheme="slate"
                        />
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                    <Archive className="h-8 w-8 text-slate-700" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-800 mb-2">No hay torneos pasados</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm">
                    No hay torneos finalizados en el sistema. Los torneos completados aparecerán aquí.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}

function TournamentCard({
  tournament,
  categories,
  onView,
  colorScheme = "teal",
}: {
  tournament: Tournament
  categories: Category[]
  onView: () => void
  colorScheme?: "teal" | "blue" | "slate"
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : categoryId
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
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-amber-50 text-amber-700 border border-amber-200"
      case "IN_PROGRESS":
        return "bg-teal-50 text-teal-700 border border-teal-200"
      case "FINISHED":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "PAIRING":
        return "bg-purple-50 text-purple-700 border border-purple-200"
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200"
    }
  }

  const getColorStyles = () => {
    switch (colorScheme) {
      case "teal":
        return {
          header: "bg-teal-500",
          title: "text-teal-700",
          badge: "bg-teal-50 text-teal-700 border border-teal-100",
          button: "bg-gradient-to-r from-teal-600 to-teal-500 hover:opacity-90",
        }
      case "blue":
        return {
          header: "bg-blue-500",
          title: "text-blue-700",
          badge: "bg-blue-50 text-blue-700 border border-blue-100",
          button: "bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90",
        }
      case "slate":
        return {
          header: "bg-slate-500",
          title: "text-slate-700",
          badge: "bg-slate-50 text-slate-700 border border-slate-200",
          button: "bg-gradient-to-r from-slate-600 to-slate-500 hover:opacity-90",
        }
      default:
        return {
          header: "bg-teal-500",
          title: "text-teal-700",
          badge: "bg-teal-50 text-teal-700 border border-teal-100",
          button: "bg-gradient-to-r from-teal-600 to-teal-500 hover:opacity-90",
        }
    }
  }

  const colorStyles = getColorStyles()

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-100 hover:border-teal-100 group h-full flex flex-col">
      <div className={`h-2 ${colorStyles.header} group-hover:opacity-90 transition-colors duration-300`}></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`font-medium ${colorStyles.title}`}>{tournament.name}</CardTitle>
            <CardDescription className="flex items-center mt-1 text-slate-500">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </CardDescription>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(tournament.status)}`}>
            {getStatusText(tournament.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-slate-600 mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Club: {tournament.club?.name || "No especificado"}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1 text-slate-500" />
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colorStyles.badge}`}>
            {getCategoryName(tournament.category)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t border-slate-100">
        <Button
          onClick={onView}
          className={`w-full ${colorStyles.button} text-white rounded-xl font-normal transition-all duration-300 group-hover:shadow-sm`}
        >
          Ver Detalles
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </CardFooter>
    </Card>
  )
}
