"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, ChevronRight, Trophy } from "lucide-react"
import { motion } from "framer-motion"

// Datos de ejemplo para los torneos
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
    image: "/placeholder.svg?height=120&width=240",
    status: "NOT_STARTED",
  },
]

export default function UpcomingTournaments() {
  const [hoveredTournament, setHoveredTournament] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long" })
  }

  const getCategoryColor = (categoryId: string) => {
    // Asignar colores según la categoría
    switch (categoryId) {
      case "1ª":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "2ª":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
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

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Próximos Torneos</h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto">
            Descubre los torneos que están por comenzar y asegura tu participación.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {upcomingTournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="h-full"
              onMouseEnter={() => setHoveredTournament(tournament.id)}
              onMouseLeave={() => setHoveredTournament(null)}
            >
              <Link href={`/tournaments/${tournament.id}`} className="block h-full">
                <div
                  className={`bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col ${
                    hoveredTournament === tournament.id ? "transform -translate-y-1" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={tournament.image || "/placeholder.svg"}
                      alt={tournament.name}
                      className="w-full h-28 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getCategoryColor(tournament.category)}`}>{tournament.category}</Badge>
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 mb-1 line-clamp-1">{tournament.name}</h3>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-slate-600 text-xs">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                        <span>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center text-slate-600 text-xs">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{tournament.location}</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-500">Inscripciones</span>
                        <span className="font-medium text-violet-600">
                          {tournament.registeredPlayers}/{tournament.maxPlayers}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-emerald-500 h-1.5 rounded-full"
                          style={{
                            width: `${(tournament.registeredPlayers / tournament.maxPlayers) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs rounded-lg"
                      >
                        Ver detalles
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Button
            asChild
            className="bg-gradient-to-r from-violet-600 to-emerald-500 hover:opacity-90 text-white rounded-lg"
          >
            <Link href="/tournaments" className="flex items-center">
              <Trophy className="mr-2 h-4 w-4" />
              Ver todos los torneos
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
