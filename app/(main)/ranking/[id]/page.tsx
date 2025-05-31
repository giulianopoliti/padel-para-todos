import React from 'react'
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Calendar,
  MapPin,
  Phone,
  Instagram,
  User,
  Clock,
  Award,
  Swords,
  Activity,
  Hand,
  CircleUser,
  ChevronLeft,
} from "lucide-react"
import { getPlayerProfile } from "@/app/api/users"
import { notFound } from "next/navigation"

export default async function PlayerProfilePage({ params }: { params: { id: string } }) {
  const playerData = await getPlayerProfile(params.id)

  if (!playerData) {
    notFound()
  }

  // Default gallery images for fallback
  const defaultGallery = [
    "https://images.pexels.com/photos/8224691/pexels-photo-8224691.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/8224695/pexels-photo-8224695.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    "https://images.pexels.com/photos/8224797/pexels-photo-8224797.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  ]

  const galleryImages = playerData.gallery && playerData.gallery.length > 0 
    ? playerData.gallery 
    : defaultGallery

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header space */}
      <div className="h-4"></div>
      
      <div className="container mx-auto px-4 py-2">
        <div className="mb-6">
          <Link
            href="/ranking"
            className="inline-flex items-center text-slate-600 hover:text-violet-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver al ranking
          </Link>
        </div>

        {/* Player Header */}
        <div className="relative mb-8 items-center justify-center">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <img
                src={playerData.profileImage || "https://images.pexels.com/photos/5952647/pexels-photo-5952647.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"}
                alt={playerData.name}
                className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white"
              />
              <Badge className={`absolute -top-3 -right-3 ${
                playerData.status === "active" 
                  ? "bg-green-500" 
                  : "bg-slate-500"
              }`}>
                {playerData.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="px-3 py-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white">
                  Ranking #{playerData.ranking.current}
                </Badge>
                <Badge className={`px-3 py-1 ${
                  playerData.ranking.isPositive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {playerData.ranking.isPositive ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(playerData.ranking.variation)} posiciones
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{playerData.name}</h1>
              <div className="flex flex-wrap gap-4 text-slate-600">
                {playerData.age && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {playerData.age} años
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Hand className="h-4 w-4" />
                  {playerData.dominantHand}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Desde {new Date(playerData.circuitJoinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Stats Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-teal-50 border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-2 rounded-lg">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Torneos</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Disputados</span>
                    <span className="font-semibold text-slate-800">{playerData.stats.tournamentsPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Finales jugadas</span>
                    <span className="font-semibold text-slate-800">{playerData.stats.finals.played}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Finales ganadas</span>
                    <span className="font-semibold text-slate-800">{playerData.stats.finals.won}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white p-2 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Rendimiento</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Partidos jugados</span>
                    <span className="font-semibold text-slate-800">{playerData.stats.matchesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">% Victorias</span>
                    <span className="font-semibold text-slate-800">{playerData.stats.winRate}%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Last Tournament */}
            {playerData.lastTournament && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-800">Último Torneo</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-slate-800">{playerData.lastTournament.name}</p>
                  <p className="text-slate-600">{new Date(playerData.lastTournament.date).toLocaleDateString()}</p>
                </div>
              </Card>
            )}

            {/* Head to Head Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Swords className="h-5 w-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800">Head to Head</h3>
              </div>
              <Card className="p-6">
                <p className="text-slate-600">Historial contra otros jugadores próximamente...</p>
              </Card>
            </div>
          </div>

          {/* Side Column */}
          <div className="space-y-8">
            {/* Contact Information */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CircleUser className="h-5 w-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800">Información de Contacto</h3>
              </div>
              <div className="space-y-4">
                {playerData.contact.instagram && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Instagram className="h-4 w-4" />
                    <span>{playerData.contact.instagram}</span>
                  </div>
                )}
                {playerData.contact.phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="h-4 w-4" />
                    <span>{playerData.contact.phone}</span>
                  </div>
                )}
                {playerData.contact.address && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="h-4 w-4" />
                    <span>{playerData.contact.address}</span>
                  </div>
                )}
                {playerData.club && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Trophy className="h-4 w-4" />
                    <span>Club: {playerData.club.name}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Gallery Preview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Galería</h3>
                <Button variant="ghost" className="text-teal-600 hover:text-teal-700">
                  Ver todas
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.slice(0, 3).map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Galería ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}