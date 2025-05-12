import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import TopPlayersSection from "@/components/home/top-players-section"
import FeaturedClubs from "@/components/home/featured-clubs"
import UpcomingTournaments from "@/components/home/upcoming-tournaments"
import { Trophy, Users, Calendar, Shield, ChevronRight, Zap, BarChart3, Award } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Hero Section con espacio para imagen de fondo */}
      <section className="relative overflow-hidden">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: "url('/placeholder.svg?height=600&width=1200')",
            filter: "brightness(0.4)",
          }}
        ></div>

        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-blue-900/80 z-10"></div>

        {/* Contenido */}
        <div className="relative z-20 container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-3 px-3 py-1 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              Plataforma de pádel
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Tu plataforma de pádel</h1>
            <p className="text-white/80 text-lg md:text-xl font-light mb-6 max-w-2xl mx-auto">
              Organiza torneos, gestiona clubes y sigue el rendimiento de los mejores jugadores.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="default" className="bg-white text-teal-800 hover:bg-white/90 rounded-xl">
                <Link href="/tournaments">
                  <Trophy className="mr-2 h-4 w-4" />
                  Explorar Torneos
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="default"
                className="bg-transparent border-white text-white hover:bg-white/10 rounded-xl"
              >
                <Link href="/ranking">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver Ranking
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Forma decorativa en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-br from-teal-50 via-white to-blue-50 clip-wave z-10"></div>
      </section>

      {/* Upcoming Tournaments Section */}
      <UpcomingTournaments />

      {/* Features Section - Más compacto */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Todo lo que necesitas</h2>
            <p className="text-slate-600 text-base max-w-2xl mx-auto">
              Nuestra plataforma ofrece todas las herramientas necesarias para jugadores, organizadores y clubes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-xl border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-teal-100 text-teal-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Gestión de Torneos</h3>
              <p className="text-slate-600 mb-3 text-sm">
                Crea y gestiona torneos de pádel con facilidad. Configura categorías, inscripciones y seguimiento.
              </p>
              <Link
                href="/tournaments"
                className="text-teal-600 font-medium flex items-center hover:text-teal-700 text-sm"
              >
                Ver torneos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Ranking de Jugadores</h3>
              <p className="text-slate-600 mb-3 text-sm">
                Consulta el ranking actualizado de jugadores por categorías. Estadísticas detalladas y seguimiento.
              </p>
              <Link href="/ranking" className="text-blue-600 font-medium flex items-center hover:text-blue-700 text-sm">
                Ver ranking
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-slate-100 to-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Clubes de Pádel</h3>
              <p className="text-slate-600 mb-3 text-sm">
                Encuentra los mejores clubes de pádel. Información detallada, pistas disponibles y reservas online.
              </p>
              <Link href="/clubes" className="text-black font-medium flex items-center hover:text-slate-700 text-sm">
                Explorar clubes
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Parejas y Equipos</h3>
              <p className="text-slate-600 mb-3 text-sm">
                Gestiona tus parejas de juego, forma equipos y coordina participaciones en torneos de manera sencilla.
              </p>
              <Link href="/teams" className="text-blue-600 font-medium flex items-center hover:text-blue-700 text-sm">
                Gestionar equipos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-xl border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-teal-100 text-teal-600 w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Calendario de Eventos</h3>
              <p className="text-slate-600 mb-3 text-sm">
                Mantente al día con todos los torneos y eventos. Calendario personalizado con notificaciones.
              </p>
              <Link
                href="/calendar"
                className="text-teal-600 font-medium flex items-center hover:text-teal-700 text-sm"
              >
                Ver calendario
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-slate-100 to-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Estadísticas Avanzadas</h3>
              <p className="text-slate-600 mb-3 text-sm">
                Analiza tu rendimiento con estadísticas detalladas. Mejora tu juego con datos precisos y comparativas.
              </p>
              <Link href="/stats" className="text-black font-medium flex items-center hover:text-slate-700 text-sm">
                Ver estadísticas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Top Players Section */}
      <TopPlayersSection />

      {/* Clubs Section */}
      <FeaturedClubs />

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-6 py-8 md:p-10 text-center text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Listo para mejorar tu experiencia?</h2>
              <p className="text-white/80 text-base mb-6 max-w-2xl mx-auto">
                Únete a nuestra comunidad y disfruta de todas las ventajas que ofrecemos para jugadores y clubes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="default" className="bg-white text-teal-600 hover:bg-white/90 rounded-xl">
                  <Link href="/register">
                    <Zap className="mr-2 h-4 w-4" />
                    Crear cuenta
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="default"
                  className="bg-transparent border-white text-white hover:bg-white/10 rounded-xl"
                >
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
