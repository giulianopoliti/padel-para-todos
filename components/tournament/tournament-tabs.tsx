"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  Award,
  Tag,
  UserCheck,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

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
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "PAIRING":
        return <PauseCircle className="h-5 w-5 text-purple-500" />
      case "IN_PROGRESS":
        return <Trophy className="h-5 w-5 text-teal-500" />
      case "FINISHED":
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case "CANCELED":
        return <Ban className="h-5 w-5 text-red-500" />
      default:
        return <Trophy className="h-5 w-5 text-teal-500" />
    }
  }

  // Obtener color según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "PAIRING":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "IN_PROGRESS":
        return "bg-teal-50 text-teal-700 border-teal-200"
      case "FINISHED":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "CANCELED":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
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
    let progressColor = "bg-teal-500"
    if (registrationPercentage > 90) progressColor = "bg-red-500"
    else if (registrationPercentage > 75) progressColor = "bg-orange-500"
    else if (registrationPercentage > 50) progressColor = "bg-yellow-500"

    return (
      <Card
        key={tournament.id}
        className="overflow-hidden hover:shadow-md transition-all duration-300 border-slate-200 hover:border-teal-200 group max-w-2xl mx-auto"
      >
        <div className="h-3 bg-teal-500 group-hover:bg-teal-600 transition-colors duration-300"></div>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <CardTitle className="text-2xl text-teal-700 font-medium">{tournament.name}</CardTitle>
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(tournament.status)} flex items-center gap-1 self-start`}
            >
              {getStatusIcon(tournament.status)}
              {getStatusText(tournament.status)}
            </span>
          </div>
          <CardDescription className="flex items-center mt-2 text-slate-500 text-base">
            <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>
              {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-4 space-y-4">
          {/* Información principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" />
                <span className="font-medium">Categoría: </span>
                <span className="ml-1 inline-block bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium border border-teal-100">
                  {tournament.category?.name || "No especificada"}
                </span>
              </div>

              <div className="flex items-center">
                <Tag className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" />
                <span className="font-medium">Tipo: </span>
                <span className="ml-1">{tournament.tournament_type || "Estándar"}</span>
              </div>

              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" />
                <span className="font-medium">Ubicación: </span>
                <span className="ml-1">{clubAddress || tournament.address || "Dirección no especificada"}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center">
                <Timer className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" />
                <span className="font-medium">Horario: </span>
                <span className="ml-1">
                  {formatTime(tournament.start_time || "")} - {formatTime(tournament.end_time || "")}
                </span>
              </div>

              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" />
                <span className="font-medium">Premio: </span>
                <span className="ml-1">{tournament.prize || "No especificado"}</span>
              </div>

              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-slate-400 flex-shrink-0" />
                <span className="font-medium">Estado de inscripción: </span>
                <span className="ml-1">{tournament.registration_status || "Abierta"}</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso de inscripciones */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-slate-400" />
                <span className="font-medium text-slate-700">Inscripciones: </span>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {currentRegistrations} / {maxRegistrations > 0 ? maxRegistrations : "∞"}
                <span className="ml-2 text-xs text-slate-500">({registrationPercentage}%)</span>
              </span>
            </div>

            {maxRegistrations > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`${progressColor} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${registrationPercentage}%` }}
                ></div>
              </div>
            )}

            {tournament.status !== "CANCELED" && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Parejas: {tournament.couplesCount || 0}</span>
                <span>Inscripciones totales: {tournament.inscriptionsCount || 0}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-200 p-4">
          <Button
            asChild
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full font-medium py-6 transition-all duration-300 group-hover:shadow-md text-base"
          >
            <Link href={`/my-tournaments/${tournament.id}`}>
              Ver detalles
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Renderizar sección de torneos
  const renderTournamentsSection = (title: string, tournaments: any[], icon: React.ReactNode) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-2xl font-medium text-teal-700">{title}</h2>
        <span className="bg-teal-100 text-teal-700 text-sm font-medium px-3 py-1 rounded-full">
          {tournaments.length}
        </span>
      </div>

      {tournaments.length > 0 ? (
        <div className="space-y-8">{tournaments.map(renderTournamentCard)}</div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 max-w-2xl mx-auto">
          <p className="text-slate-500">No hay torneos en esta categoría.</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      <Tabs defaultValue="all" className="space-y-8">
        <TabsList className="w-full max-w-3xl mx-auto bg-slate-100 p-1 rounded-full">
          <TabsTrigger
            value="all"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            <Clock className="mr-2 h-4 w-4" />
            Próximos
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Activos
          </TabsTrigger>
          <TabsTrigger
            value="finished"
            className="rounded-full data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-12">
          {renderTournamentsSection(
            "Torneos Próximos",
            notStartedTournaments,
            <Clock className="h-7 w-7 text-yellow-500" />,
          )}
          {renderTournamentsSection(
            "Torneos en Emparejamiento",
            pairingTournaments,
            <PauseCircle className="h-7 w-7 text-purple-500" />,
          )}
          {renderTournamentsSection(
            "Torneos en Curso",
            inProgressTournaments,
            <Trophy className="h-7 w-7 text-teal-500" />,
          )}
          {renderTournamentsSection(
            "Torneos Finalizados",
            finishedTournaments,
            <CheckCircle className="h-7 w-7 text-blue-500" />,
          )}
          {renderTournamentsSection(
            "Torneos Cancelados",
            canceledTournaments,
            <Ban className="h-7 w-7 text-red-500" />,
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-8">
          {renderTournamentsSection(
            "Torneos Próximos",
            notStartedTournaments,
            <Clock className="h-7 w-7 text-yellow-500" />,
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-12">
          <div className="space-y-12">
            {renderTournamentsSection(
              "Torneos en Emparejamiento",
              pairingTournaments,
              <PauseCircle className="h-7 w-7 text-purple-500" />,
            )}
            {renderTournamentsSection(
              "Torneos en Curso",
              inProgressTournaments,
              <Trophy className="h-7 w-7 text-teal-500" />,
            )}
          </div>
        </TabsContent>

        <TabsContent value="finished" className="space-y-8">
          {renderTournamentsSection(
            "Torneos Finalizados",
            finishedTournaments,
            <CheckCircle className="h-7 w-7 text-blue-500" />,
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-10">
        <Button
          asChild
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-full font-medium py-6 px-8 text-base"
        >
          <Link href="/tournaments/create">
            <Trophy className="mr-2 h-5 w-5" />
            Crear Nuevo Torneo
          </Link>
        </Button>
      </div>
    </>
  )
}
