"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Calendar, MapPin, Users, ArrowRight, Clock, CheckCircle, Ban, PauseCircle } from "lucide-react"
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
  const renderTournamentCard = (tournament: any) => (
    <Card
      key={tournament.id}
      className="overflow-hidden hover:shadow-sm transition-shadow duration-300 border-slate-100 hover:border-teal-100 group"
    >
      <div className="h-2 bg-teal-500 group-hover:bg-teal-600 transition-colors duration-300"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-teal-700 font-medium">{tournament.name}</CardTitle>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(tournament.status)} flex items-center gap-1`}
          >
            {getStatusIcon(tournament.status)}
            {getStatusText(tournament.status)}
          </span>
        </div>
        <CardDescription className="flex items-center mt-1 text-slate-500">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-slate-400" />
            <span>Categoría: </span>
            <span className="ml-1 inline-block bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium border border-teal-100">
              {tournament.category?.name || "No especificada"}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-slate-400" />
            <span>{clubAddress || tournament.address || "Dirección no especificada"}</span>
          </div>
          {(tournament.status === "PAIRING" ||
            tournament.status === "IN_PROGRESS" ||
            tournament.status === "FINISHED") && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-slate-400" />
              <span>
                {tournament.couplesCount} parejas ({tournament.inscriptionsCount} inscripciones)
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t border-slate-100">
        <Button
          asChild
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal transition-all duration-300 group-hover:shadow-sm"
        >
          <Link href={`/my-tournaments/${tournament.id}`}>
            Ver detalles
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )

  // Renderizar sección de torneos
  const renderTournamentsSection = (title: string, tournaments: any[], icon: React.ReactNode) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-medium text-teal-700">{title}</h2>
        <span className="bg-teal-100 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {tournaments.length}
        </span>
      </div>

      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(renderTournamentCard)}
        </div>
      ) : (
        <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-slate-500">No hay torneos en esta categoría.</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      <Tabs defaultValue="all" className="space-y-6">
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

        <TabsContent value="all" className="space-y-10">
          {renderTournamentsSection(
            "Torneos Próximos",
            notStartedTournaments,
            <Clock className="h-6 w-6 text-yellow-500" />,
          )}
          {renderTournamentsSection(
            "Torneos en Emparejamiento",
            pairingTournaments,
            <PauseCircle className="h-6 w-6 text-purple-500" />,
          )}
          {renderTournamentsSection(
            "Torneos en Curso",
            inProgressTournaments,
            <Trophy className="h-6 w-6 text-teal-500" />,
          )}
          {renderTournamentsSection(
            "Torneos Finalizados",
            finishedTournaments,
            <CheckCircle className="h-6 w-6 text-blue-500" />,
          )}
          {renderTournamentsSection(
            "Torneos Cancelados",
            canceledTournaments,
            <Ban className="h-6 w-6 text-red-500" />,
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          {renderTournamentsSection(
            "Torneos Próximos",
            notStartedTournaments,
            <Clock className="h-6 w-6 text-yellow-500" />,
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="space-y-10">
            {renderTournamentsSection(
              "Torneos en Emparejamiento",
              pairingTournaments,
              <PauseCircle className="h-6 w-6 text-purple-500" />,
            )}
            {renderTournamentsSection(
              "Torneos en Curso",
              inProgressTournaments,
              <Trophy className="h-6 w-6 text-teal-500" />,
            )}
          </div>
        </TabsContent>

        <TabsContent value="finished" className="space-y-6">
          {renderTournamentsSection(
            "Torneos Finalizados",
            finishedTournaments,
            <CheckCircle className="h-6 w-6 text-blue-500" />,
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-8">
        <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal">
          <Link href="/tournaments/create">
            <Trophy className="mr-2 h-4 w-4" />
            Crear Nuevo Torneo
          </Link>
        </Button>
      </div>
    </>
  )
}
