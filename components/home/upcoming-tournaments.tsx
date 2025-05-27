"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, ChevronRight, Trophy, Users, Clock, Zap } from 'lucide-react'

export default function UpcomingTournaments() {
  const [hoveredTournament, setHoveredTournament] = useState<string | null>(null)

  const upcomingTournaments = [
    {
      id: "1",
      name: "Torneo Apertura Madrid",
      startDate: "2025-05-20",
      endDate: "2025-05-22",
      location: "Club Padel Madrid",
      category: "1ª",
      registeredPlayers: 24,
      maxPlayers: 32,
      prize: "€5,000",
      image: "/placeholder.svg?height=120&width=240",
      status: "NOT_STARTED",
    },
    {
      id: "2",
      name: "Copa Barcelona Premium",
      startDate: "2025-05-25",
      endDate: "2025-05-27",
      location: "Padel Indoor Barcelona",
      category: "2ª",
      registeredPlayers: 16,
      maxPlayers: 24,
      prize: "€3,000",
      image: "/placeholder.svg?height=120&width=240",
      status: "NOT_STARTED",
    },
    {
      id: "3",
      name: "Torneo Valencia Open",
      startDate: "2025-06-01",
      endDate: "2025-06-03",
      location: "Club Padel Valencia",
      category: "1ª",
      registeredPlayers: 28,
      maxPlayers: 32,
      prize: "€8,000",
      image: "/placeholder.svg?height=120&width=240",
      status: "NOT_STARTED",
    },
    {
      id: "4",
      name: "Sevilla Championship",
      startDate: "2025-06-08",
      endDate: "2025-06-10",
      location: "Padel Club Sevilla",
      category: "3ª",
      registeredPlayers: 12,
      maxPlayers: 16,
      prize: "€2,000",
      image: "/placeholder.svg?height=120&width=240",
      status: "NOT_STARTED",
    },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long" })
  }

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case "1ª":
        return "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
      case "2ª":
        return "bg-gradient-to-r from-teal-400 to-teal-500 text-white"
      case "3ª":
        return "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
      default:
        return "bg-gradient-to-r from-slate-400 to-slate-500 text-white"
    }
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 relative overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white border-white/20 backdrop-blur-sm">
            <Clock className="mr-2 h-4 w-4" />
            Próximos eventos
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Torneos Épicos te Esperan
          </h2>
          <p className="text-white/80 text-xl max-w-3xl mx-auto leading-relaxed">
            Descubre los torneos más emocionantes y asegura tu lugar en la historia del pádel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {upcomingTournaments.map((tournament, index) => (
            <div
              key={tournament.id}
              className="h-full group"
              onMouseEnter={() => setHoveredTournament(tournament.id)}
              onMouseLeave={() => setHoveredTournament(null)}
            >
              <Link href={`/tournaments/${tournament.id}`} className="block h-full">
                <div
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-500 h-full flex flex-col group-hover:bg-white group-hover:shadow-3xl ${
                    hoveredTournament === tournament.id ? "transform -translate-y-2 scale-105" : ""
                  }`}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={tournament.image || "/placeholder.svg"}
                      alt={tournament.name}
                      className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getCategoryColor(tournament.category)} shadow-lg`}>
                        {tournament.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">
                        <Trophy className="h-3 w-3 mr-1" />
                        {tournament.prize}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-teal-700 transition-colors">
                      {tournament.name}
                    </h3>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-slate-600 text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-teal-500 flex-shrink-0" />
                        <span className="font-medium">
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-600 text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{tournament.location}</span>
                      </div>
                      <div className="flex items-center text-slate-600 text-sm">
                        <Users className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                        <span className="font-medium">
                          {tournament.registeredPlayers}/{tournament.maxPlayers} participantes
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-slate-500 font-medium">Inscripciones</span>
                        <span className="font-bold text-teal-600">
                          {Math.round((tournament.registeredPlayers / tournament.maxPlayers) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{
                            width: `${(tournament.registeredPlayers / tournament.maxPlayers) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:from-teal-50 hover:to-blue-50 hover:border-teal-200 text-slate-700 hover:text-teal-700 rounded-xl group-hover:shadow-md transition-all duration-300"
                      >
                        <span className="font-semibold">Inscribirse</span>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-2xl shadow-2xl px-8 py-4"
          >
            <Link href="/tournaments" className="flex items-center">
              <Trophy className="mr-3 h-5 w-5" />
              Explorar Todos los Torneos
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
