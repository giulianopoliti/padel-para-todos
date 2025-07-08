"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, Search, Filter, ArrowRight, MapPin, Archive, Users, Clock, Award, Plus, Settings } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import Link from "next/link"

// Tipos
interface Tournament {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
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
    image?: string
  }
}

interface Category {
  name: string
  lower_range: number
  upper_range: number
}

export default function TournamentsClient({
  initialTournaments,
  initialCategories,
}: {
  initialTournaments?: Tournament[]
  initialCategories?: Category[]
}) {
  const router = useRouter()
  const { user } = useUser()
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
      filtered = filtered.filter(
        (tournament) =>
          tournament.name.toLowerCase().includes(term.toLowerCase()) ||
          tournament.club?.name.toLowerCase().includes(term.toLowerCase()) ||
          tournament.address?.toLowerCase().includes(term.toLowerCase()),
      )
    }

    if (category !== "all") {
      filtered = filtered.filter((tournament) => tournament.category === category)
    }

    setFilteredTournaments(filtered)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Torneos de Pádel</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Descubre todos los torneos disponibles, filtra por categoría y encuentra el torneo perfecto para ti.
          </p>
        </div>

        {/* Sección especial para Clubes */}
        {user?.role === "CLUB" && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">
                  Panel de Gestión de Clubes
                </h2>
                <p className="text-blue-700 max-w-lg">
                  Gestiona tus torneos, visualiza inscripciones y organiza competencias de manera profesional.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/tournaments/my-tournaments">
                    <Settings className="mr-2 h-4 w-4" />
                    Gestionar Mis Torneos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Link href="/tournaments/my-tournaments/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Nuevo Torneo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar torneos..."
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
        </div>

        <div>
          <Tabs
            defaultValue="upcoming"
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <TabsList className="w-full border-b border-gray-200 bg-gray-50 p-1">
              <TabsTrigger
                value="upcoming"
                className="flex-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Próximos
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Activos
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="flex-1 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Archive className="mr-2 h-5 w-5" />
                Pasados
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
                        categories={initialCategories || []}
                        onView={() => router.push(`/tournaments/${tournament.id}`)}
                      />
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar className="h-8 w-8 text-gray-400" />}
                  title="No hay próximos torneos"
                  description="No hay próximos torneos disponibles en este momento. Vuelve a consultar más tarde."
                />
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
                        categories={initialCategories || []}
                        onView={() => router.push(`/tournaments/${tournament.id}`)}
                      />
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Trophy className="h-8 w-8 text-gray-400" />}
                  title="No hay torneos activos"
                  description="No hay torneos en curso en este momento. Consulta los próximos torneos para inscribirte."
                />
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
                        categories={initialCategories || []}
                        onView={() => router.push(`/tournaments/${tournament.id}`)}
                      />
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Archive className="h-8 w-8 text-gray-400" />}
                  title="No hay torneos pasados"
                  description="No hay torneos finalizados en el sistema. Los torneos completados aparecerán aquí."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
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
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Fecha no especificada"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires"
    })
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
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-gray-200 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={tournament.pre_tournament_image_url || tournament.club?.image || "/placeholder.svg?height=200&width=300"}
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
            {formatDate(tournament.startDate)} 
            {tournament.endDate && ` - ${formatDate(tournament.endDate)}`}
          </p>
        </div>
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
            Categoría {getCategoryName(tournament.category)}
          </Badge>
          {(tournament.prize || tournament.price) && (
            <div className="flex items-center text-gray-700 text-sm">
              <Award className="h-4 w-4 mr-1 text-blue-600" />
              {tournament.prize || `$${tournament.price}`}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span className="line-clamp-1">{tournament.address || tournament.club?.name || "Dirección no especificada"}</span>
        </div>

        {tournament.time && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>{tournament.time}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
          <span>
            {tournament.currentParticipants || 0}/{tournament.maxParticipants || "∞"} parejas
          </span>
        </div>

        {tournament.description && (
          <div className="pt-2">
            <p className="text-sm text-gray-600 line-clamp-2">{tournament.description}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50 border-t border-gray-100 p-4">
        <Button onClick={onView} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Ver Detalles
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>
      <h3 className="text-xl font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{description}</p>
    </div>
  )
}
