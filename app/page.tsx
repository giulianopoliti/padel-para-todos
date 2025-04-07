import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import { Trophy, Calendar, Users, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <section className="hero-section py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-padel-green-700">
              Sistema de Torneos de Pádel Amateur
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-700">
              Organiza torneos, gestiona rankings y encuentra parejas para jugar al pádel.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Button asChild size="lg" className="bg-padel-green-600 hover:bg-padel-green-700">
                <Link href="/tournaments">
                  <Trophy className="mr-2 h-5 w-5" />
                  Ver Torneos
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-padel-green-600 text-padel-green-600 hover:bg-padel-green-50"
              >
                <Link href="/ranking">
                  <Users className="mr-2 h-5 w-5" />
                  Ver Ranking
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-padel-green-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center text-padel-green-700">¿Qué puedes hacer?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="bg-padel-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-padel-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-padel-green-700">Participar en Torneos</h3>
                <p className="text-gray-600 mb-4">
                  Inscríbete en torneos de tu categoría y compite con otros jugadores.
                </p>
                <Button asChild variant="link" className="text-padel-green-600">
                  <Link href="/tournaments" className="flex items-center">
                    Ver torneos
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="bg-padel-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-padel-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-padel-green-700">Consultar Rankings</h3>
                <p className="text-gray-600 mb-4">
                  Revisa tu posición en el ranking y la de otros jugadores por categoría.
                </p>
                <Button asChild variant="link" className="text-padel-green-600">
                  <Link href="/ranking" className="flex items-center">
                    Ver ranking
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="bg-padel-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-padel-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-padel-green-700">Organizar Torneos</h3>
                <p className="text-gray-600 mb-4">Si eres un club, puedes crear y gestionar tus propios torneos.</p>
                <Button asChild variant="link" className="text-padel-green-600">
                  <Link href="/login?role=CLUB" className="flex items-center">
                    Acceso para clubes
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 court-pattern">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center text-padel-green-700">Próximos Torneos</h2>

            <div className="bg-white rounded-lg p-6 shadow-md max-w-3xl mx-auto">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Descubre los próximos torneos disponibles y regístrate para participar.
                </p>
                <Button asChild className="bg-padel-green-600 hover:bg-padel-green-700">
                  <Link href="/tournaments">Ver todos los torneos</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-padel-green-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Torneos de Pádel
              </h3>
              <p className="text-padel-green-200 mt-1">Sistema para organizar torneos de pádel amateurs</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <Link href="/tournaments" className="text-white hover:text-padel-green-200">
                Torneos
              </Link>
              <Link href="/ranking" className="text-white hover:text-padel-green-200">
                Ranking
              </Link>
              <Link href="/login" className="text-white hover:text-padel-green-200">
                Iniciar Sesión
              </Link>
            </div>
          </div>

          <div className="border-t border-padel-green-700 mt-6 pt-6 text-center text-padel-green-200">
            <p>© {new Date().getFullYear()} Sistema de Torneos de Pádel Amateur</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

