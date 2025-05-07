"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react'
import { useEffect, useState } from "react"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Subtle animation for cards on page load
    const cards = document.querySelectorAll(".feature-card")
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("animate-in")
      }, 100 * index)
    })
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-700">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="hero-section py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1600')] bg-cover bg-center opacity-5"></div>

          {/* Subtle court lines */}
          <div className="absolute inset-0 flex justify-center items-center opacity-5">
            <div className="w-[80%] h-[70%] border border-teal-300 rounded-md"></div>
            <div className="absolute h-full w-[1px] bg-teal-300"></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-light mb-6 text-teal-700 tracking-wide">
              Sistema de Torneos de Pádel Amateur
            </h1>
            <p className="text-lg mb-10 max-w-2xl mx-auto text-slate-600 font-light">
              Organiza torneos, gestiona rankings y encuentra parejas para jugar al pádel.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <Button
                asChild
                size="lg"
                className="bg-teal-500/90 hover:bg-teal-600/90 border-none shadow-sm transition-all duration-300 hover:shadow rounded-full text-white font-normal"
              >
                <Link href="/tournaments" className="flex items-center px-6">
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Torneos
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-teal-300 text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition-all duration-300 rounded-full backdrop-blur-sm font-normal"
              >
                <Link href="/ranking" className="flex items-center px-6">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Ranking
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-teal-50/50"></div>
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-2xl md:text-3xl font-light mb-16 text-center text-teal-700">
              ¿Qué puedes hacer?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="feature-card opacity-0 transition-all duration-500 bg-white rounded-lg p-8 shadow-sm border border-slate-100 hover:border-teal-100 hover:shadow group">
                <div className="bg-teal-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-100 group-hover:bg-teal-100/50 transition-all duration-300">
                  <Trophy className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-teal-700 text-center">Participar en Torneos</h3>
                <p className="text-slate-500 mb-6 text-center text-sm">
                  Inscríbete en torneos de tu categoría y compite con otros jugadores.
                </p>
                <div className="text-center">
                  <Button
                    asChild
                    variant="link"
                    className="text-teal-600 hover:text-teal-700 p-0 transition-all duration-300"
                  >
                    <Link href="/tournaments" className="flex items-center justify-center text-sm">
                      Ver torneos
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="feature-card opacity-0 transition-all duration-500 bg-white rounded-lg p-8 shadow-sm border border-slate-100 hover:border-teal-100 hover:shadow group">
                <div className="bg-teal-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-100 group-hover:bg-teal-100/50 transition-all duration-300">
                  <Users className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-teal-700 text-center">Consultar Rankings</h3>
                <p className="text-slate-500 mb-6 text-center text-sm">
                  Revisa tu posición en el ranking y la de otros jugadores por categoría.
                </p>
                <div className="text-center">
                  <Button
                    asChild
                    variant="link"
                    className="text-teal-600 hover:text-teal-700 p-0 transition-all duration-300"
                  >
                    <Link href="/ranking" className="flex items-center justify-center text-sm">
                      Ver ranking
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="feature-card opacity-0 transition-all duration-500 bg-white rounded-lg p-8 shadow-sm border border-slate-100 hover:border-teal-100 hover:shadow group">
                <div className="bg-teal-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-100 group-hover:bg-teal-100/50 transition-all duration-300">
                  <Calendar className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-medium mb-3 text-teal-700 text-center">Organizar Torneos</h3>
                <p className="text-slate-500 mb-6 text-center text-sm">
                  Si eres un club, puedes crear y gestionar tus propios torneos.
                </p>
                <div className="text-center">
                  <Button
                    asChild
                    variant="link"
                    className="text-teal-600 hover:text-teal-700 p-0 transition-all duration-300"
                  >
                    <Link href="/login?role=CLUB" className="flex items-center justify-center text-sm">
                      Acceso para clubes
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Tournaments Section */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-5"></div>

          {/* Court pattern overlay - very subtle */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_#f8fafc_20%,_#f8fafc_80%,_transparent_80%,_transparent),radial-gradient(circle,_transparent_20%,_#f8fafc_20%,_#f8fafc_80%,_transparent_80%,_transparent)_25px_25px,linear-gradient(#0d9488_1px,_transparent_1px)_0_-1px,linear-gradient(90deg,_#0d9488_1px,_#f8fafc_1px)_-1px_0] bg-[length:50px_50px,_50px_50px,_25px_25px,_25px_25px] opacity-[0.02]"></div>

          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-2xl md:text-3xl font-light mb-10 text-center text-teal-700">
              Próximos Torneos
            </h2>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto hover:border-teal-100 hover:shadow transition-all duration-300">
              <div className="text-center">
                <p className="text-slate-500 mb-6 text-sm">
                  Descubre los próximos torneos disponibles y regístrate para participar.
                </p>
                <Button
                  asChild
                  className="bg-teal-500/90 hover:bg-teal-600/90 border-none shadow-sm transition-all duration-300 hover:shadow rounded-full text-white font-normal"
                >
                  <Link href="/tournaments" className="px-6 py-2 text-sm">
                    Ver todos los torneos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-medium flex items-center text-teal-700">
                <Trophy className="h-4 w-4 mr-2 text-teal-500" />
                Torneos de Pádel
              </h3>
              <p className="text-slate-500 mt-1 text-sm">Sistema para organizar torneos de pádel amateurs</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-10">
              <Link href="/tournaments" className="text-slate-600 hover:text-teal-600 transition-colors duration-300 text-sm">
                Torneos
              </Link>
              <Link href="/ranking" className="text-slate-600 hover:text-teal-600 transition-colors duration-300 text-sm">
                Ranking
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-teal-600 transition-colors duration-300 text-sm">
                Iniciar Sesión
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-6 pt-6 text-center text-slate-400 text-sm">
            <p>© {new Date().getFullYear()} Sistema de Torneos de Pádel Amateur</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
