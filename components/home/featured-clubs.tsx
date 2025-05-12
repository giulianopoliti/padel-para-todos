"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ChevronRight, Users, Clock } from 'lucide-react'
import { motion } from "framer-motion"

// Datos de ejemplo para los clubes
const clubs = [
  {
    id: "1",
    name: "Club Padel Madrid",
    location: "Madrid, España",
    rating: 4.8,
    reviewCount: 124,
    courts: 12,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Parking gratuito", "Cafetería", "Tienda", "Clases"],
    openingHours: "7:00 - 23:00",
  },
  {
    id: "2",
    name: "Padel Indoor Barcelona",
    location: "Barcelona, España",
    rating: 4.7,
    reviewCount: 98,
    courts: 8,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Pistas cubiertas", "Vestuarios", "Bar", "Torneos"],
    openingHours: "8:00 - 22:00",
  },
  {
    id: "3",
    name: "Club Padel Valencia",
    location: "Valencia, España",
    rating: 4.6,
    reviewCount: 87,
    courts: 10,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Pistas panorámicas", "Gimnasio", "Restaurante", "Fisioterapia"],
    openingHours: "7:30 - 23:30",
  },
  {
    id: "4",
    name: "Padel Club Sevilla",
    location: "Sevilla, España",
    rating: 4.5,
    reviewCount: 76,
    courts: 6,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Pistas exteriores", "Piscina", "Escuela de pádel", "Eventos"],
    openingHours: "8:00 - 22:00",
  },
]

export default function FeaturedClubs() {
  const [hoveredClub, setHoveredClub] = useState<string | null>(null)

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Clubes Destacados</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Descubre los mejores clubes de pádel con instalaciones de primera calidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {clubs.map((club, index) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="h-full"
              onMouseEnter={() => setHoveredClub(club.id)}
              onMouseLeave={() => setHoveredClub(null)}
            >
              <Link href={`/clubs/${club.id}`} className="block h-full">
                <div
                  className={`bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col ${
                    hoveredClub === club.id ? "transform -translate-y-1" : ""
                  }`}
                >
                  <div className="relative">
                    <img src={club.image || "/placeholder.svg"} alt={club.name} className="w-full h-48 object-cover" />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                        {club.rating}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{club.name}</h3>
                    <div className="flex items-center text-slate-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{club.location}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center text-slate-600 text-sm">
                        <Users className="h-4 w-4 mr-1 text-slate-400" />
                        <span>{club.courts} pistas</span>
                      </div>
                      <div className="flex items-center text-slate-600 text-sm">
                        <Clock className="h-4 w-4 mr-1 text-slate-400" />
                        <span>{club.openingHours}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {club.features.slice(0, 2).map((feature, i) => (
                        <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                          {feature}
                        </Badge>
                      ))}
                      {club.features.length > 2 && (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                          +{club.features.length - 2}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-auto">
                      <div className="text-sm text-slate-500 mb-2">{club.reviewCount} opiniones</div>
                      <Button
                        variant="ghost"
                        className="w-full justify-between border border-slate-200 hover:bg-slate-50 text-slate-700"
                      >
                        Ver detalles
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Button
            asChild
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white rounded-xl"
          >
            <Link href="/clubs" className="flex items-center">
              Ver todos los clubes
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
