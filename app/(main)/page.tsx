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
} from "lucide-react"
import Link from "next/link"
import { getTournaments, getCategories } from "@/app/api/tournaments"
import { getPlayersMale, getClubesWithServices } from "@/app/api/users"
import type React from "react"
import TournamentCard from "@/components/tournament-card"
import PlayerAvatar from "@/components/player-avatar"

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
  // Fetch real tournament, player and clubs data
  const [allTournaments, categories, allPlayers, allClubs] = await Promise.all([
    getTournaments(),
    getCategories(),
    getPlayersMale(),
    getClubesWithServices()
  ])
  
  // Filter for upcoming tournaments (NOT_STARTED status) and limit to 3
  const upcomingTournaments = allTournaments
    .filter((tournament) => tournament.status === "NOT_STARTED")
    .slice(0, 3)

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
      position: index + 1
    }))

  // Get top 3 clubs by rating
  const topClubs = allClubs
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3)

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

  const clubFeatures = [
    {
      icon: Users,
      title: "Más Jugadores",
      description: "Publicá tus torneos y llegá a toda la comunidad",
      color: "text-blue-600",
    },
    {
      icon: Target,
      title: "Gestión Simple",
      description: "Manejo automático de inscriptos, categorías y fixtures",
      color: "text-emerald-600",
    },
    {
      icon: Eye,
      title: "Visibilidad",
      description: "Ganá presencia en la comunidad padelera nacional",
      color: "text-amber-600",
    },
  ]

  const testimonials = [
    {
      name: "María González",
      role: "Jugadora Recreativa",
      quote: "Nunca había sido tan fácil anotarme a un torneo. Ahora juego mucho más seguido.",
      location: "Buenos Aires",
      rating: 5,
    },
    {
      name: "Carlos Martínez",
      role: "Jugador Competitivo",
      quote: "Ahora puedo seguir mi progreso y competir más en serio. El ranking me motiva a mejorar.",
      location: "Córdoba",
      rating: 5,
    },
    {
      name: "Club Elite Rosario",
      role: "Club Organizador",
      quote: "Triplicamos la participación en nuestros torneos desde que usamos la plataforma.",
      location: "Rosario",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]"></div>

        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-8 bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">
              <Trophy className="mr-2 h-4 w-4" />
              El futuro del pádel competitivo
            </Badge>

            <h1 className="text-4xl lg:text-7xl font-black mb-8 tracking-tight text-slate-900">
              El ecosistema donde el pádel
              <span className="block text-blue-600">compite, crece y se conecta</span>
            </h1>

            <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Ranking nacional en tiempo real, inscripciones online y gestión profesional de torneos. Todo lo que
              necesitás para llevar tu pádel al siguiente nivel.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                <Link href="/tournaments">
                  <Calendar className="mr-2 h-5 w-5" />
                  Ver Torneos Disponibles
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-6 text-lg"
              >
                <Link href="/register">Registrate Gratis</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              >
                <Link href="/register?role=club">
                  <Building2 className="mr-2 h-5 w-5" />
                  Registrar Mi Club
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">1,250+</div>
                <div className="text-sm text-slate-500">Jugadores Activos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">150+</div>
                <div className="text-sm text-slate-500">Torneos Realizados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">45+</div>
                <div className="text-sm text-slate-500">Clubes Afiliados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">8,500+</div>
                <div className="text-sm text-slate-500">Partidos Jugados</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking en Tiempo Real */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ranking Nacional en Tiempo Real</h2>
            <p className="text-slate-600">Seguí a los mejores y tu progreso en la tabla de posiciones</p>
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
                    <Link 
                      key={player.id} 
                      href={`/ranking/${player.id}`}
                      className="block"
                    >
                      <div className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 cursor-pointer ${
                        index < 3 ? 'hover:shadow-md' : ''
                      }`}>
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
                            {index < 3 ? (
                              <Trophy className="h-4 w-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          
                          {/* Player Avatar */}
                          <PlayerAvatar
                            src={allPlayers.find(p => p.id === player.id)?.profileImage}
                            alt={player.name}
                            className={`w-10 h-10 ${index < 3 ? 'ring-2 ring-blue-200' : ''}`}
                          />
                          
                          <div>
                            <div className="font-semibold text-slate-900">{player.name}</div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                Categoría {player.category}
                              </Badge>
                              <span className="text-xs text-slate-500">{player.club}</span>
                              {index < 3 && (
                                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                                  <Star className="h-3 w-3 mr-1 fill-amber-500" />
                                  Top 3
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-bold text-slate-900">{player.points}</div>
                            <div className="text-xs text-slate-500">puntos</div>
                          </div>
                          <Badge className={`${player.trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0`}>
                            <TrendingUp className={`h-3 w-3 mr-1 ${player.trend < 0 ? 'rotate-180' : ''}`} />
                            {player.trend >= 0 ? '+' : ''}{player.trend}
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
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">🎾 Para Jugadores</Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Tu Carrera Deportiva, Profesionalizada</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Seguí tu progreso, competí y conectá
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {playerFeatures.map((feature, index) => (
              <Card
                key={index}
                className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Clubes Destacados</h2>
            <p className="text-slate-600">Más que instalaciones, son el corazón de la comunidad del pádel</p>
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
                        "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=250&width=400"
                      }
                      alt={club.name || "Club de pádel"}
                      className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm shadow-sm border-0">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                        {club.rating > 0 ? club.rating : "Nuevo"}
                      </Badge>
                    </div>

                    {/* Premium Badge */}
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

                    {/* Stats Grid */}
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
                <p className="text-gray-500 max-w-md mx-auto">
                  Próximamente tendremos los mejores clubes de pádel.
                </p>
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

      {/* Para Clubes */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-600 text-white border-blue-500 px-4 py-2">🏟️ Para Clubes</Badge>
            <h2 className="text-4xl font-bold mb-4">Potenciá Tu Club</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Llegá a más jugadores, simplificá la gestión y ganá visibilidad en la comunidad padelera
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {clubFeatures.map((feature, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
              <Link href="/register?role=club">
                <Building2 className="mr-2 h-5 w-5" />
                Registrar Mi Club
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Torneos Disponibles */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Torneos Disponibles</h2>
            <p className="text-slate-600">Inscribite online en segundos, sin grupos de WhatsApp</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  categories={categories}
                />
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
            <Button asChild variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3">
              <Link href="/tournaments">
                Ver Todos los Torneos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Lo Que Dice Nuestra Comunidad</h2>
            <p className="text-slate-600">Experiencias reales de jugadores y clubes que ya forman parte</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-slate-700 italic mb-4 leading-relaxed">"{testimonial.quote}"</p>

                  <div className="border-t border-slate-100 pt-4">
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-xs text-slate-500 mt-1">{testimonial.location}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              <Button
                asChild
                size="lg"
                className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-6 text-lg"
              >
                <Link href="/register?role=club">
                  <Building2 className="mr-2 h-5 w-5" />
                  Registrarme como Club
                </Link>
              </Button>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
