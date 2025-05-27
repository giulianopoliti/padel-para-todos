"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ChevronRight, Users, Clock, Wifi, Car, Coffee, Dumbbell, Award, Zap, Trophy } from 'lucide-react'

export default function FeaturedClubs() {
  const [hoveredClub, setHoveredClub] = useState<string | null>(null)

  const clubs = [
    {
      id: "1",
      name: "Club Padel Madrid Elite",
      location: "Madrid, España",
      rating: 4.8,
      reviewCount: 124,
      courts: 12,
      image: "/placeholder.svg?height=250&width=400",
      features: ["Parking gratuito", "Cafetería Premium", "Tienda Pro", "Academia"],
      openingHours: "7:00 - 23:00",
      specialties: ["Pistas panorámicas", "Iluminación LED", "Superficie premium"],
      price: "€25/hora",
      promoted: true
    },
    {
      id: "2",
      name: "Padel Indoor Barcelona",
      location: "Barcelona, España",
      rating: 4.7,
      reviewCount: 98,
      courts: 8,
      image: "/placeholder.svg?height=250&width=400",
      features: ["Pistas cubiertas", "Vestuarios VIP", "Bar deportivo", "Torneos"],
      openingHours: "8:00 - 22:00",
      specialties: ["Climatización", "Pistas cristal", "Streaming matches"],
      price: "€22/hora",
      promoted: false
    },
    {
      id: "3",
      name: "Club Padel Valencia Pro",
      location: "Valencia, España",
      rating: 4.6,
      reviewCount: 87,
      courts: 10,
      image: "/placeholder.svg?height=250&width=400",
      features: ["Pistas panorámicas", "Gimnasio", "Restaurante", "Fisioterapia"],
      openingHours: "7:30 - 23:30",
      specialties: ["Vista al mar", "Césped artificial", "Centro wellness"],
      price: "€20/hora",
      promoted: false
    },
    {
      id: "4",
      name: "Padel Club Sevilla Premier",
      location: "Sevilla, España",
      rating: 4.5,
      reviewCount: 76,
      courts: 6,
      image: "/placeholder.svg?height=250&width=400",
      features: ["Pistas exteriores", "Piscina", "Escuela", "Eventos"],
      openingHours: "8:00 - 22:00",
      specialties: ["Ambiente andaluz", "Terraza chill-out", "BBQ área"],
      price: "€18/hora",
      promoted: true
    },
  ]

  const getFeatureIcon = (feature: string) => {
    const iconMap: { [key: string]: any } = {
      "Parking gratuito": Car,
      "Cafetería Premium": Coffee,
      "Tienda Pro": Award,
      "Academia": Users,
      "Pistas cubiertas": Dumbbell,
      "Vestuarios VIP": Star,
      "Bar deportivo": Coffee,
      "Torneos": Trophy,
      "Pistas panorámicas": Wifi,
      "Gimnasio": Dumbbell,
      "Restaurante": Coffee,
      "Fisioterapia": Users,
      "Pistas exteriores": Wifi,
      "Piscina": Wifi,
      "Escuela": Users,
      "Eventos": Award
    }
    const IconComponent = iconMap[feature] || Wifi
    return <IconComponent className="h-3 w-3" />
  }

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 relative overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute top-32 left-32 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-32 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white border-white/20 backdrop-blur-sm">
            <Award className="mr-2 h-4 w-4" />
            Clubes Premium
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Experiencias de Lujo
          </h2>
          <p className="text-white/80 text-xl max-w-3xl mx-auto leading-relaxed">
            Descubre los clubes más exclusivos con instalaciones de última generación y servicios premium.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-8xl mx-auto">
          {clubs.map((club, index) => (
            <div
              key={club.id}
              className="h-full group relative"
              onMouseEnter={() => setHoveredClub(club.id)}
              onMouseLeave={() => setHoveredClub(null)}
            >
              {club.promoted && (
                <div className="absolute -top-3 -right-3 z-20">
                  <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg animate-pulse">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Premium
                  </Badge>
                </div>
              )}
              
              <Link href={`/clubs/${club.id}`} className="block h-full">
                <div
                  className={`bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-500 h-full flex flex-col group-hover:bg-white group-hover:shadow-3xl ${
                    hoveredClub === club.id ? "transform -translate-y-3 scale-105" : ""
                  }`}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={club.image || "/placeholder.svg"} 
                      alt={club.name} 
                      className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm shadow-md">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                        {club.rating}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">
                        {club.price}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-700 transition-colors">
                      {club.name}
                    </h3>
                    <div className="flex items-center text-slate-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-teal-500" />
                      <span className="font-medium">{club.location}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center text-slate-600 text-sm bg-slate-50 rounded-lg p-2">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium">{club.courts} pistas</span>
                      </div>
                      <div className="flex items-center text-slate-600 text-sm bg-slate-50 rounded-lg p-2">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="font-medium text-xs">{club.openingHours}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Especialidades</h4>
                      <div className="flex flex-wrap gap-1">
                        {club.specialties.slice(0, 2).map((specialty, i) => (
                          <Badge key={i} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs font-normal">
                            {specialty}
                          </Badge>
                        ))}
                        {club.specialties.length > 2 && (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-normal">
                            +{club.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Servicios</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {club.features.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center text-xs text-slate-600">
                            {getFeatureIcon(feature)}
                            <span className="ml-1 truncate">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="text-sm text-slate-500 mb-3 flex items-center justify-between">
                        <span>{club.reviewCount} opiniones</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < Math.floor(club.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-between bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:from-teal-50 hover:to-blue-50 hover:border-teal-200 text-slate-700 hover:text-teal-700 rounded-xl group-hover:shadow-lg transition-all duration-300"
                      >
                        <span className="font-semibold">Reservar ahora</span>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-2xl shadow-2xl px-8 py-4"
          >
            <Link href="/clubs" className="flex items-center">
              <Award className="mr-3 h-5 w-5" />
              Explorar Todos los Clubes
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
