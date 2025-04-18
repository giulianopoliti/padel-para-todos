"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/navbar"
import type { Tournament, Category } from "@/types"
import { Trophy, Calendar, Search, Filter, ArrowRight, MapPin, Archive } from "lucide-react"

interface TournamentsClientProps {
  initialTournaments: Tournament[]
  initialCategories: Category[]
}

export default function TournamentsClient({ initialTournaments, initialCategories }: TournamentsClientProps) {
  const router = useRouter()
  const [tournaments] = useState<Tournament[]>(initialTournaments)
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(initialTournaments)
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
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-padel-green-700 mb-2">Torneos de Pádel</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descubre todos los torneos disponibles, filtra por categoría y encuentra el torneo perfecto para ti.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar torneos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-padel-green-200 focus:border-padel-green-500 focus:ring-padel-green-500"
              />
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="pl-10 border-padel-green-200 focus:border-padel-green-500 focus:ring-padel-green-500">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {initialCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="bg-white rounded-lg shadow-md">
          <TabsList className="w-full border-b border-gray-200 rounded-t-lg bg-padel-green-50">
            <TabsTrigger
              value="upcoming"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Próximos Torneos
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Torneos Activos
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Archive className="mr-2 h-4 w-4" />
              Torneos Pasados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="p-6">
            {filteredTournaments.filter((t) => t.status === "NOT_STARTED").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTournaments
                    .filter((t) => t.status === "NOT_STARTED")
                  .map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      categories={initialCategories}
                      onView={() => router.push(`/tournaments/${tournament.id}`)}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-padel-green-700 mb-2">No hay próximos torneos</h3>
                <p className="text-gray-600 max-w-md mx-auto">
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
                  .map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      categories={initialCategories}
                      onView={() => router.push(`/tournaments/${tournament.id}`)}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-padel-green-700 mb-2">No hay torneos activos</h3>
                <p className="text-gray-600 max-w-md mx-auto">
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
                  .map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      categories={initialCategories}
                      onView={() => router.push(`/tournaments/${tournament.id}`)}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Archive className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-padel-green-700 mb-2">No hay torneos pasados</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  No hay torneos finalizados en el sistema. Los torneos completados aparecerán aquí.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function TournamentCard({
  tournament,
  categories,
  onView,
}: {
  tournament: Tournament
  categories: Category[]
  onView: () => void
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
      case "not_started":
        return "Próximamente"
      case "in_progress":
        return "En curso"
      case "finished":
        return "Finalizado"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-yellow-100 text-yellow-800"
      case "in_progress":
        return "bg-padel-green-100 text-padel-green-800"
      case "finished":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-padel-green-100">
      <div className="h-2 bg-padel-green-600"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-padel-green-700">{tournament.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </CardDescription>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(tournament.status)}`}>
            {getStatusText(tournament.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Club: {tournament.club.name}</span>
        </div>
        <div className="inline-block bg-padel-green-50 text-padel-green-700 px-3 py-1 rounded-full text-sm font-medium">
          {getCategoryName(tournament.category)}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-100">
        <Button onClick={onView} className="w-full bg-padel-green-600 hover:bg-padel-green-700">
          Ver Detalles
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
} 