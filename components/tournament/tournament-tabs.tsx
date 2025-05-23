"use client"

import type React from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Trophy,
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle,
  Ban,
  PauseCircle,
  Timer,
  Users,
  Award,
  Plus,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

// Tipos para las props
interface TournamentsTabsProps {
  notStartedTournaments: any[]
  pairingTournaments: any[]
  inProgressTournaments: any[]
  finishedTournaments: any[]
  canceledTournaments: any[]
  clubAddress?: string
}

export default function TournamentsTabs({
  notStartedTournaments,
  pairingTournaments,
  inProgressTournaments,
  finishedTournaments,
  canceledTournaments,
  clubAddress,
}: TournamentsTabsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  }

  // Formatear hora
  const formatTime = (timeString: string) => {
    if (!timeString) return "No especificado"

    try {
      // Si es una fecha ISO completa, extraer solo la parte de la hora
      if (timeString.includes("T")) {
        const date = new Date(timeString)
        return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      }

      // Si ya es solo una hora (formato HH:MM:SS)
      return timeString.substring(0, 5) // Tomar solo HH:MM
    } catch (error) {
      return timeString || "No especificado"
    }
  }

  // Obtener icono según el estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return <Clock className="h-5 w-5" />
      case "PAIRING":
        return <PauseCircle className="h-5 w-5" />
      case "IN_PROGRESS":
        return <Trophy className="h-5 w-5" />
      case "FINISHED":
        return <CheckCircle className="h-5 w-5" />
      case "CANCELED":
        return <Ban className="h-5 w-5" />
      default:
        return <Trophy className="h-5 w-5" />
    }
  }

  // Obtener color según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-100" }
      case "PAIRING":
        return { bg: "bg-violet-500", text: "text-violet-500", light: "bg-violet-100" }
      case "IN_PROGRESS":
        return { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-100" }
      case "FINISHED":
        return { bg: "bg-blue-500", text: "text-blue-500", light: "bg-blue-100" }
      case "CANCELED":
        return { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-100" }
      default:
        return { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-100" }
    }
  }

  // Obtener texto según el estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "Próximamente"
      case "PAIRING":
        return "Emparejamiento"
      case "IN_PROGRESS":
        return "En curso"
      case "FINISHED":
        return "Finalizado"
      case "CANCELED":
        return "Cancelado"
      default:
        return status
    }
  }

  // Renderizar tarjeta de torneo
  const renderTournamentCard = (tournament: any) => {
    // Calcular porcentaje de inscripciones
    const maxRegistrations = tournament.max_couples || tournament.max_inscriptions || 0
    const currentRegistrations = tournament.couplesCount || 0
    const registrationPercentage =
      maxRegistrations > 0 ? Math.min(Math.round((currentRegistrations / maxRegistrations) * 100), 100) : 0

    // Determinar color de la barra de progreso
    let progressColor = "bg-emerald-500"
    if (registrationPercentage > 90) progressColor = "bg-rose-500"
    else if (registrationPercentage > 75) progressColor = "bg-amber-500"
    else if (registrationPercentage > 50) progressColor = "bg-violet-500"

    const statusColor = getStatusColor(tournament.status)
    const isHovered = hoveredCard === tournament.id

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
        onMouseEnter={() => setHoveredCard(tournament.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 h-full flex flex-col">
          {/* Cabecera con estado */}
          <div className={`${statusColor.bg} h-3 w-full`}></div>

          {/* Contenido principal */}
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {tournament.name}
              </h3>
              <div
                className={`${statusColor.light} ${statusColor.text} text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1`}
              >
                {getStatusIcon(tournament.status)}
                <span>{getStatusText(tournament.status)}</span>
              </div>
            </div>

            <div className="flex items-center text-slate-500 mb-6">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">
                {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
              </span>
            </div>

            {/* Información en grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className={`${statusColor.light} rounded-xl p-4 flex flex-col items-center justify-center text-center`}
              >
                <Users className={`h-6 w-6 mb-2 ${statusColor.text}`} />
                <div className="text-sm text-slate-700">
                  <span className="block font-bold text-lg">{currentRegistrations}</span>
                  <span className="text-xs text-slate-500">
                    de {maxRegistrations > 0 ? maxRegistrations : "∞"} inscripciones
                  </span>
                </div>
              </div>

              <div className={`bg-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center`}>
                <Trophy className="h-6 w-6 mb-2 text-slate-500" />
                <div className="text-sm text-slate-700">
                  <span className="block font-bold text-lg">{tournament.category?.name || "General"}</span>
                  <span className="text-xs text-slate-500">{tournament.tournament_type || "Estándar"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate">
                  {clubAddress || tournament.address || "No especificada"}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <Timer className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600">
                  {formatTime(tournament.start_time || "")} - {formatTime(tournament.end_time || "")}
                </span>
              </div>

              {tournament.prize && (
                <div className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600">{tournament.prize}</span>
                </div>
              )}
            </div>

            {/* Barra de progreso */}
            {maxRegistrations > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-500">Ocupación</span>
                  <span className={`font-medium ${statusColor.text}`}>{registrationPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${progressColor} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${registrationPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Botón de acción */}
          <div className="p-4 mt-auto">
            <Button
              asChild
              className={`w-full rounded-xl ${isHovered ? "bg-gradient-to-r from-violet-600 to-emerald-500" : statusColor.bg} hover:opacity-90 text-white transition-all duration-300`}
              size="lg"
            >
              <Link href={`/my-tournaments/${tournament.id}`} className="flex items-center justify-center">
                {isHovered ? <Sparkles className="mr-2 h-4 w-4" /> : null}
                Ver detalles
                <ArrowRight
                  className={`ml-2 h-4 w-4 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
                />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Renderizar sección de torneos
  const renderTournamentsSection = (title: string, tournaments: any[], icon: React.ReactNode, color: string) => (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <span className="bg-white text-slate-700 text-sm font-medium px-3 py-1 rounded-full shadow-sm border border-slate-100">
          {tournaments.length}
        </span>
      </div>

      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tournaments.map((tournament) => (
            <div key={tournament.id}>{renderTournamentCard(tournament)}</div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 max-w-3xl mx-auto shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-full ${color}`}>{icon}</div>
            <p className="text-slate-500 font-medium">No hay torneos en esta categoría.</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <Tabs defaultValue="all" className="mb-12">
        <TabsList className="w-full max-w-2xl mx-auto bg-white p-1.5 rounded-full shadow-md border border-slate-100 mb-10">
          <TabsTrigger
            value="all"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 px-4"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 px-4"
          >
            <Clock className="mr-2 h-4 w-4" />
            Próximos
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 px-4"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Activos
          </TabsTrigger>
          <TabsTrigger
            value="finished"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 px-4"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderTournamentsSection(
            "Torneos Próximos",
            notStartedTournaments,
            <Clock className="h-6 w-6 text-white" />,
            "bg-amber-100 text-amber-500",
          )}
          {renderTournamentsSection(
            "Torneos en Emparejamiento",
            pairingTournaments,
            <PauseCircle className="h-6 w-6 text-white" />,
            "bg-violet-100 text-violet-500",
          )}
          {renderTournamentsSection(
            "Torneos en Curso",
            inProgressTournaments,
            <Trophy className="h-6 w-6 text-white" />,
            "bg-emerald-100 text-emerald-500",
          )}
          {renderTournamentsSection(
            "Torneos Finalizados",
            finishedTournaments,
            <CheckCircle className="h-6 w-6 text-white" />,
            "bg-blue-100 text-blue-500",
          )}
          {renderTournamentsSection(
            "Torneos Cancelados",
            canceledTournaments,
            <Ban className="h-6 w-6 text-white" />,
            "bg-rose-100 text-rose-500",
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {renderTournamentsSection(
            "Torneos Próximos",
            notStartedTournaments,
            <Clock className="h-6 w-6 text-white" />,
            "bg-amber-100 text-amber-500",
          )}
        </TabsContent>

        <TabsContent value="active">
          {renderTournamentsSection(
            "Torneos en Emparejamiento",
            pairingTournaments,
            <PauseCircle className="h-6 w-6 text-white" />,
            "bg-violet-100 text-violet-500",
          )}
          {renderTournamentsSection(
            "Torneos en Curso",
            inProgressTournaments,
            <Trophy className="h-6 w-6 text-white" />,
            "bg-emerald-100 text-emerald-500",
          )}
        </TabsContent>

        <TabsContent value="finished">
          {renderTournamentsSection(
            "Torneos Finalizados",
            finishedTournaments,
            <CheckCircle className="h-6 w-6 text-white" />,
            "bg-blue-100 text-blue-500",
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
