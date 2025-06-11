import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Trophy,
  TrendingUp,
  Users,
  Bell,
  Calendar,
  BarChart3,
  Target,
  Building2,
  Eye,
  Star,
  ArrowRight,
  CheckCircle,
  MapPin,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Info,
  User,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LOGOS } from "@/lib/supabase-storage"
import { getTournaments, getCategories, getWeeklyWinners } from "@/app/api/tournaments"
import { getPlayersMale, getClubesWithServices } from "@/app/api/users"
import type React from "react"
import TournamentCard from "@/components/tournament-card"
import PlayerAvatar from "@/components/player-avatar"
import WeeklyWinnersCarousel from "@/components/weekly-winners-carousel"
import EnhancedBracketDemo from "@/components/home/enhance-bracket-demo"

// Types
interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
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
    address?: string
    image?: string
  }
}

interface Category {
  name: string
  lower_range: number
  upper_range: number
}

export default async function HomePage() {
  // Fetch real tournament, player, clubs and weekly winners data
  const [allTournaments, categories, allPlayers, allClubs, weeklyWinners] = await Promise.all([
    getTournaments(),
    getCategories(),
    getPlayersMale(),
    getClubesWithServices(),
    getWeeklyWinners(),
  ])

  // Filter for upcoming tournaments (NOT_STARTED status) and limit to 3
  const upcomingTournaments = allTournaments.filter((tournament) => tournament.status === "NOT_STARTED").slice(0, 3)

  // Get top 5 players by score
  const topPlayers = allPlayers
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((player, index) => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      points: player.score,
      category: player.category,
      club: player.club_name || "Sin Club",
      trend: Math.floor(Math.random() * 10) - 2, // Random trend for demo
      position: index + 1,
    }))

  // Get top 3 clubs by rating
  const topClubs = allClubs.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3)

  const playerFeatures = [
    {
      icon: Trophy,
      title: "Ranking Nacional",
      description: "Seguí tu posición en tiempo real y competí con los mejores",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: TrendingUp,
      title: "Sumá Puntos",
      description: "Cada torneo suma puntos para subir de categoría automáticamente",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: BarChart3,
      title: "Perfil Deportivo",
      description: "Estadísticas completas, historial y logros en un solo lugar",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: Bell,
      title: "Notificaciones",
      description: "Enteráte de nuevos torneos cerca tuyo al instante",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 overflow-hidden pt-6 text-white h-dvh">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]"></div>

        <div className="relative container mx-auto px-6 py-12 lg:py-20 h-full flex items-center">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo Figma */}
            <div className="mb-12 flex justify-center">
              <Image
                src={LOGOS.home}
                alt="Circuito de Pádel Amateur - Logo Principal"
                width={450}
                height={170}
                className="h-36 w-auto drop-shadow-2xl"
                priority
              />
            </div>

            <h1 className="text-4xl lg:text-7xl font-black mb-8 tracking-tight text-white">
              Competi, sumá puntos, 
              <span className="block text-blue-400">subí de categoría</span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            El Circuito de Pádel Amateur organiza el juego. <br />
            Clasificaciones reales, torneos por nivel, y un sistema de puntos que te motiva a mejorar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                <Link href="/ranking">
                  <Calendar className="mr-2 h-5 w-5" />
                  Ver Ranking de jugadores
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                <Link href="/register?role=club">
                  <Building2 className="mr-2 h-5 w-5" />
                  Organizá un torneo como club
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking en Tiempo Real */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ranking Nacional en Tiempo Real</h2>
            <p className="text-slate-600">Registrate, participá de torneos y empezá a sumar puntos para subir de categoría.
            Competí con jugadores de tu nivel y seguí tu progreso en el ranking.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-0">
                <div className="bg-slate-900 text-white p-4 rounded-t-lg">
                  <h3 className="text-lg font-bold flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-amber-400" />
                    Top 5 Nacional
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {topPlayers.map((player, index) => (
                    <Link key={player.id} href={`/ranking/${player.id}`} className="block">
                      <div
                        className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 cursor-pointer ${
                          index < 3 ? "hover:shadow-md" : ""
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                              index === 0
                                ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-200"
                                : index === 1
                                  ? "bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-200"
                                  : index === 2
                                    ? "bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-100"
                                    : "bg-slate-300"
                            }`}
                          >
                            {index < 3 ? <Trophy className="h-4 w-4" /> : index + 1}
                          </div>

                          <PlayerAvatar
                            src={allPlayers.find((p) => p.id === player.id)?.profileImage}
                            alt={player.name}
                            className={`w-10 h-10 ${index < 3 ? "ring-2 ring-blue-200" : ""}`}
                          />

                          <div>
                            <div className="font-semibold text-slate-900">{player.name}</div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {player.category && player.category !== "Sin categoría" 
                                  ? `${player.category}` 
                                  : "Sin categoría"
                                }
                              </Badge>
                              <span className="text-xs text-slate-500">{player.club}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-bold text-slate-900">{player.points}</div>
                            <div className="text-xs text-slate-500">puntos</div>
                          </div>
                          <Badge
                            className={`${player.trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"} border-0`}
                          >
                            <TrendingUp className={`h-3 w-3 mr-1 ${player.trend < 0 ? "rotate-180" : ""}`} />
                            {player.trend >= 0 ? "+" : ""}
                            {player.trend}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border-t">
                  <Button asChild variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Link href="/ranking">
                      Ver Ranking Completo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Para Jugadores */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">🎾 Para Jugadores</Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Tu Carrera Deportiva, Profesionalizada</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">Seguí tu progreso, competí y conectá</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {playerFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                  >
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
              <Link href="/register">
                <Trophy className="mr-2 h-5 w-5" />
                Empezar a Competir
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Clubes Destacados */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Clubes que ya son parte del circuito</h2>
            <p className="text-slate-600">Estos clubes no solo organizan torneos: construyen comunidad y promueven el pádel amateur.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {topClubs.length > 0 ? (
              topClubs.map((club) => (
                <Card
                  key={club.id}
                  className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={
                        club.coverImage ||
                        "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=250&width=400" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={club.name || "Club de pádel"}
                      className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm shadow-sm border-0">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                        {club.rating > 0 ? club.rating : "Nuevo"}
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-sm border-0">
                        <Award className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 hover:text-slate-600 transition-colors">
                      {club.name || "Club sin nombre"}
                    </h3>

                    <div className="flex items-center text-slate-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-slate-400" />
                      <span className="font-medium truncate">{club.address || "Dirección no disponible"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center text-slate-600 text-sm bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <Users className="h-4 w-4 mr-2 text-slate-500" />
                        <div>
                          <span className="block font-bold text-lg text-slate-800">{club.courts || 0}</span>
                          <span className="text-xs text-slate-500">pistas</span>
                        </div>
                      </div>
                      <div className="flex items-center text-slate-600 text-sm bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <Clock className="h-4 w-4 mr-2 text-slate-500" />
                        <div>
                          <span className="block font-bold text-sm text-slate-800">
                            {club.opens_at && club.closes_at ? `${club.opens_at.slice(0, 5)}` : "8:00"}
                          </span>
                          <span className="text-xs text-slate-500">apertura</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 mt-auto"
                    >
                      <Link href={`/clubes/${club.id}`}>
                        Ver detalles
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No hay clubes registrados</h3>
                <p className="text-gray-500 max-w-md mx-auto">Próximamente tendremos los mejores clubes de pádel.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3">
              <Link href="/clubes">
                Ver Todos los Clubes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sistema de Gestión Profesional - Bracket Demo */}
      <EnhancedBracketDemo />

      {/* Información para Nuevos Usuarios */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">¿Nuevo en el Circuito de Pádel Amateur?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Conocé todo lo que necesitás saber para empezar a competir, sumar puntos y subir de categoría
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Sistema de Categorías</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  8 categorías automáticas basadas en puntos. Desde 8va (0-299 pts) hasta 1ra (1500+ pts). 
                  Tu categoría se actualiza automáticamente.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/info/categorias">
                    <Info className="mr-2 h-4 w-4" />
                    Ver Categorías
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Tipos de Torneos</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Torneos American (1 día) y Long (1-2 meses). Cada tipo tiene un formato único. 
                  Ganar suma puntos, perder también.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/info/tournaments">
                    <Trophy className="mr-2 h-4 w-4" />
                    Ver Torneos
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Para Clubes</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Si tenés un club, podés organizar torneos, gestionar inscripciones automáticamente 
                  y ganar visibilidad en la plataforma.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/info/clubes">
                    <Building2 className="mr-2 h-4 w-4" />
                    Ver Beneficios
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Badge className="mb-4 bg-blue-100 text-blue-800 px-4 py-2">
              <BookOpen className="mr-2 h-4 w-4" />
              Guía Completa Disponible
            </Badge>
            <p className="text-slate-600 mb-6">
              ¿Querés conocer todos los detalles del sistema? Tenemos una guía completa para vos.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/info">
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Guía Completa
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Próximamente: Entrenadores */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-purple-500 rounded-full px-4 py-2 mb-6">
              <Lightbulb className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Próximamente</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Sección de Entrenadores</h2>
            <p className="text-xl text-purple-100 mb-8 leading-relaxed">
              Estamos trabajando en una nueva sección donde vas a poder encontrar entrenadores especializados, 
              clases grupales e individuales, y entrenamientos personalizados para mejorar tu juego.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-3"
              >
                <Link href="/register?role=coach">
                  <User className="mr-2 h-5 w-5" />
                  Soy Entrenador - Registrarme
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-purple-600 px-6 py-3"
              >
                <Link href="/register">
                  <Bell className="mr-2 h-5 w-5" />
                  Notificarme cuando esté listo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Torneos Disponibles */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Torneos Disponibles</h2>
            <p className="text-slate-600">Inscribite online en segundos, sin grupos de WhatsApp</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} categories={categories} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No hay próximos torneos</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No hay próximos torneos disponibles en este momento. Vuelve a consultar más tarde.
                </p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Button asChild variant="outline" className="border-gray-400 text-gray-700 hover:bg-gray-200 px-6 py-3">
              <Link href="/tournaments">
                Ver Todos los Torneos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Ganadores de la Semana */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200 px-4 py-2">
              <Trophy className="mr-2 h-4 w-4" />
              Ganadores de la Semana
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">¡Felicitaciones a Nuestros Campeones!</h2>
            <p className="text-slate-600">
              Conocé a las parejas que se coronaron esta semana en los torneos más competitivos
            </p>
          </div>

          {weeklyWinners.length > 0 ? (
            <WeeklyWinnersCarousel weeklyWinners={weeklyWinners} />
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No hay ganadores esta semana</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No se han completado torneos con fotos de ganadores en los últimos 7 días. ¡Vuelve pronto para ver a los
                nuevos campeones!
              </p>
            </div>
          )}

          {weeklyWinners.length > 6 && (
            <div className="text-center mt-12">
              <Button asChild variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 px-6 py-3">
                <Link href="/ganadores">
                  Ver Todos los Ganadores
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Creá tu cuenta y empezá a competir</h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Unite a la revolución del pádel amateur. Ranking, torneos y comunidad activa te esperan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
                <Link href="/register">
                  <Trophy className="mr-2 h-5 w-5" />
                  Registrarme como Jugador
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-6 text-lg">
                <Link href="/register?role=club">
                  <Building2 className="mr-2 h-5 w-5" />
                  Registrarme como Club
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer con Enlaces de Información */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <div className="mb-6">
                <Image
                  src={LOGOS.home}
                  alt="Circuito de Pádel Amateur - Logo"
                  width={300}
                  height={100}
                  className="h-24 w-auto"
                />
              </div>
              <p className="text-slate-300 leading-relaxed max-w-md">
                La plataforma que revoluciona el pádel amateur en Argentina. 
                Ranking nacional, torneos organizados y un sistema de puntos que te motiva a mejorar.
              </p>
            </div>

            {/* Información */}
            <div>
              <h3 className="text-lg font-bold mb-4">Información</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/info/categorias" 
                    className="text-slate-300 hover:text-white transition-colors flex items-center"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Sistema de Categorías
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/info/tournaments" 
                    className="text-slate-300 hover:text-white transition-colors flex items-center"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Tipos de Torneos
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/info/clubes" 
                    className="text-slate-300 hover:text-white transition-colors flex items-center"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Beneficios para Clubes
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/info" 
                    className="text-slate-300 hover:text-white transition-colors flex items-center"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Guía Completa
                  </Link>
                </li>
              </ul>
            </div>

            {/* Accesos Rápidos */}
            <div>
              <h3 className="text-lg font-bold mb-4">Accesos Rápidos</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/ranking" 
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Ranking Nacional
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/tournaments" 
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Torneos Disponibles
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/clubes" 
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Encontrar Clubes
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/register" 
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    Registrarse
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 Circuito de Pádel Amateur. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
