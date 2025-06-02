"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Handshake, Heart, Coffee } from "lucide-react"
import EnhancedBracketDemo from "@/components/home/enhance-bracket-demo"
import UpcomingTournaments from "@/components/home/upcoming-tournaments"
import TopPlayersSection from "@/components/home/top-players-section"
import FeaturedClubs from "@/components/home/featured-clubs"

export default function HomePage() {
  const communityStats = [
    { icon: Users, label: "Parejas activas", value: "1,250+", color: "text-blue-500" },
    { icon: Heart, label: "Partidos jugados", value: "15,000+", color: "text-blue-500" },
    { icon: Coffee, label: "Eventos sociales", value: "200+", color: "text-blue-500" },
    { icon: Handshake, label: "Nuevas amistades", value: "3,500+", color: "text-blue-500" },
  ]

  const testimonials = [
    {
      name: "María González",
      role: "Jugadora recreativa",
      quote:
        "Encontré mi pareja perfecta de pádel y ahora tenemos un grupo increíble de amigos. ¡Es más que un deporte!",
      location: "Madrid",
    },
    {
      name: "Carlos & Miguel",
      role: "Dupla competitiva",
      quote: "Empezamos como desconocidos y ahora somos mejores amigos. El pádel nos unió dentro y fuera de la pista.",
      location: "Barcelona",
    },
    {
      name: "Ana Rodríguez",
      role: "Organizadora de eventos",
      quote: "Los torneos aquí no son solo competencia, son celebraciones. Siempre terminamos cenando todos juntos.",
      location: "Valencia",
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50/50 to-white overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(123,157,207,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(123,157,207,0.08),transparent_50%)]"></div>

        <div className="relative container mx-auto px-6 py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-8 bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200">
              <Users className="mr-2 h-4 w-4" />
              Donde nacen las mejores duplas
            </Badge>

            <h1 className="text-5xl lg:text-7xl font-bold mb-8 tracking-tight text-gray-800">
              Más que pádel,
              <span className="block text-blue-600">es comunidad</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Conecta con jugadores, forma la dupla perfecta y vive la pasión del pádel en una comunidad que celebra
              cada punto.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                <Handshake className="mr-2 h-5 w-5" />
                Encontrar Pareja
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg"
              >
                Explorar Comunidad
              </Button>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {communityStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Bracket Demo */}
      <EnhancedBracketDemo />

      {/* Upcoming Tournaments */}
      <UpcomingTournaments />

      {/* Top Players Section */}
      <TopPlayersSection />

      {/* Community Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Historias de Nuestra Comunidad</h2>
            <p className="text-gray-600">El pádel nos une, las amistades nos quedan para siempre</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <Heart className="h-6 w-6 text-blue-500 mb-3" />
                    <p className="text-gray-700 italic leading-relaxed">"{testimonial.quote}"</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="font-medium text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500 mt-1">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clubs */}
      <FeaturedClubs />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50/50">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-800">¿Listo para tu primera dupla?</h2>
            <p className="text-gray-600 mb-12">
              Únete a miles de jugadores que ya encontraron su pareja perfecta de pádel. Aquí comienzan las mejores
              amistades.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                <Handshake className="mr-2 h-5 w-5" />
                Encontrar Pareja
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
              >
                <Users className="mr-2 h-5 w-5" />
                Explorar Comunidad
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
