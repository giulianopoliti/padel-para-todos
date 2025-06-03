"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
} from "lucide-react"
import Link from "next/link"
import EnhancedBracketDemo from "@/components/home/enhance-bracket-demo"

export default function HomePage() {
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

  const topPlayers = [
    { name: "Carlos Martínez", points: 1250, trend: "+15", category: "1ª" },
    { name: "Laura Sánchez", points: 1180, trend: "+8", category: "1ª" },
    { name: "Miguel López", points: 1145, trend: "+12", category: "1ª" },
    { name: "Ana García", points: 1120, trend: "+5", category: "2ª" },
    { name: "Javier Torres", points: 1095, trend: "+3", category: "2ª" },
  ]

  const upcomingTournaments = [
    {
      name: "Buenos Aires Open",
      date: "15-17 Dic",
      location: "Club Central",
      participants: "24/32",
      category: "Todas",
    },
    {
      name: "Córdoba Championship",
      date: "22-24 Dic",
      location: "Padel Córdoba",
      participants: "18/24",
      category: "1ª y 2ª",
    },
    {
      name: "Rosario Cup",
      date: "29 Dic - 1 Ene",
      location: "Rosario Padel",
      participants: "28/32",
      category: "Todas",
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
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
              >
                <Link href="/register?role=club">
                  <Building2 className="mr-2 h-5 w-5" />
                  Soy Club
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

      {/* Para Jugadores */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">🎾 Para Jugadores</Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Tu Carrera Deportiva, Profesionalizada</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Seguí tu progreso, competí en serio y conectá con la comunidad más grande de pádel del país
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

      {/* Torneos Disponibles */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Torneos Disponibles</h2>
            <p className="text-slate-600">Inscribite online en segundos, sin grupos de WhatsApp</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {upcomingTournaments.map((tournament, index) => (
              <Card key={index} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      <Calendar className="h-3 w-3 mr-2" />
                      {tournament.date}
                    </Badge>
                    <Badge variant="outline" className="text-slate-600">
                      {tournament.category}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-3">{tournament.name}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-slate-600 text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                      {tournament.location}
                    </div>
                    <div className="flex items-center text-slate-600 text-sm">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      {tournament.participants} duplas
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Inscribir Dupla
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
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
                    <div
                      key={index}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0
                              ? "bg-amber-500"
                              : index === 1
                                ? "bg-slate-400"
                                : index === 2
                                  ? "bg-amber-600"
                                  : "bg-slate-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{player.name}</div>
                          <Badge variant="outline" className="text-xs">
                            Categoría {player.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{player.points}</div>
                          <div className="text-xs text-slate-500">puntos</div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {player.trend}
                        </Badge>
                      </div>
                    </div>
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

      {/* Sistema de Brackets Demo */}
      <EnhancedBracketDemo />

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
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-slate-400 text-sm mt-4">
              Aunque hoy no tengas clubes clientes, si los jugadores participan, generarás presión positiva sobre los
              clubes
            </p>
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
              Unite a la revolución del pádel competitivo. Ranking nacional, torneos profesionales y la comunidad más
              activa del país te esperan.
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
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-6 text-lg"
              >
                <Link href="/register?role=club">
                  <Building2 className="mr-2 h-5 w-5" />
                  Registrar Mi Club
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-blue-100">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Gratis para siempre</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Sin permanencia</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
