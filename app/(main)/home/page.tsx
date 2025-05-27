"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import TopPlayersSection from "@/components/home/top-players-section"
import FeaturedClubs from "@/components/home/featured-clubs"
import UpcomingTournaments from "@/components/home/upcoming-tournaments"
import EnhancedBracketDemo from "@/components/home/enhance-bracket-demo"
import { Trophy, Users, Calendar, Shield, ChevronRight, Zap, BarChart3, Award } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900">
      {/* Hero Section con diseño más dramático */}
      <section className="relative overflow-hidden">
        {/* Imagen de fondo con overlay mejorado */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: "url('/placeholder.svg?height=800&width=1600')",
            filter: "brightness(0.3) contrast(1.2)",
          }}
        ></div>

        {/* Overlay con gradiente más complejo */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 via-blue-900/80 to-purple-900/90 z-10"></div>

        {/* Efectos de partículas decorativas */}
        <div className="absolute inset-0 z-15">
          <div className="absolute top-20 left-20 w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-blue-300 rounded-full animate-ping"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse"></div>
        </div>

        {/* Contenido */}
        <div className="relative z-20 container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white border-white/30 backdrop-blur-md">
              <Trophy className="mr-2 h-4 w-4" />
              Plataforma de pádel profesional
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 bg-gradient-to-r from-white via-teal-100 to-blue-100 bg-clip-text text-transparent">
              Revoluciona tu pádel
            </h1>
            <p className="text-white/90 text-xl md:text-2xl font-light mb-8 max-w-3xl mx-auto leading-relaxed">
              La plataforma más avanzada para organizar torneos, gestionar clubes y elevar tu nivel de juego.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-2xl shadow-2xl border-0 px-8 py-4">
                <Link href="/tournaments">
                  <Trophy className="mr-3 h-5 w-5" />
                  Explorar Torneos
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-2xl backdrop-blur-md px-8 py-4"
              >
                <Link href="/ranking">
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Ver Ranking
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Forma decorativa en la parte inferior con animación */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 z-10 transform rotate-1"></div>
      </section>

      {/* Enhanced Bracket Demo con zonas */}
      <EnhancedBracketDemo />

      {/* Upcoming Tournaments Section */}
      <UpcomingTournaments />

      {/* Features Section rediseñada */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100/50 via-transparent to-blue-100/50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-teal-100 to-blue-100 text-teal-800 border-teal-200">
              Funcionalidades completas
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6">Todo lo que necesitas</h2>
            <p className="text-slate-600 text-xl max-w-3xl mx-auto leading-relaxed">
              Nuestra plataforma ofrece todas las herramientas necesarias para transformar tu experiencia en el pádel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Features con diseño más atractivo */}
            <div className="group bg-white p-8 rounded-3xl border border-teal-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Gestión de Torneos</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Crea y gestiona torneos profesionales con sistemas avanzados de bracket y seguimiento en tiempo real.
              </p>
              <Link
                href="/tournaments"
                className="text-teal-600 font-semibold flex items-center hover:text-teal-700 group-hover:translate-x-2 transition-all"
              >
                Ver torneos
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-blue-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Ranking Inteligente</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Sistema de ranking avanzado con análisis detallado de rendimiento y estadísticas predictivas.
              </p>
              <Link href="/ranking" className="text-blue-600 font-semibold flex items-center hover:text-blue-700 group-hover:translate-x-2 transition-all">
                Ver ranking
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-purple-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Clubes Premium</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Red exclusiva de clubes con instalaciones de última generación y servicios premium.
              </p>
              <Link href="/clubes" className="text-purple-600 font-semibold flex items-center hover:text-purple-700 group-hover:translate-x-2 transition-all">
                Explorar clubes
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Parejas Dinámicas</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Sistema inteligente de formación de parejas basado en nivel, estilo de juego y compatibilidad.
              </p>
              <Link href="/teams" className="text-emerald-600 font-semibold flex items-center hover:text-emerald-700 group-hover:translate-x-2 transition-all">
                Formar parejas
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-orange-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Calendario Inteligente</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Agenda personalizada con notificaciones automáticas y sincronización multi-dispositivo.
              </p>
              <Link
                href="/calendar"
                className="text-orange-600 font-semibold flex items-center hover:text-orange-700 group-hover:translate-x-2 transition-all"
              >
                Ver calendario
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-rose-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Analytics Pro</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Análisis avanzado con IA para mejorar tu técnica y estrategia de juego personalizada.
              </p>
              <Link href="/stats" className="text-rose-600 font-semibold flex items-center hover:text-rose-700 group-hover:translate-x-2 transition-all">
                Ver analytics
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Top Players Section */}
      <TopPlayersSection />

      {/* Clubs Section */}
      <FeaturedClubs />

      {/* CTA Section rediseñada */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-blue-500/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-xl">
            <div className="px-8 py-12 md:p-16 text-center text-white">
              <Badge className="mb-6 px-4 py-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Zap className="mr-2 h-4 w-4" />
                Únete ahora
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-teal-100 to-blue-100 bg-clip-text text-transparent">
                ¿Listo para el siguiente nivel?
              </h2>
              <p className="text-white/90 text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
                Únete a la revolución del pádel y descubre una nueva forma de vivir este deporte.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-2xl shadow-2xl border-0 px-10 py-5">
                  <Link href="/register">
                    <Zap className="mr-3 h-6 w-6" />
                    Crear cuenta
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-2xl backdrop-blur-md px-10 py-5"
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
