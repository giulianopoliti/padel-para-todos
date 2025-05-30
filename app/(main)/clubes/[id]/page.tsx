import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Star,
  ChevronLeft,
  Users,
  Clock,
  Phone,
  Globe,
  Mail,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
} from "lucide-react"
import ClubGallery from "@/components/clubes/club-gallery"
import ClubInstructors from "@/components/clubes/club-instructors"
import { getClubDetails } from "@/app/api/users"
import { notFound } from "next/navigation"

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const club = await getClubDetails(params.id)

  if (!club) {
    notFound()
  }

  // Default images for fallback
  const defaultImages = [
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
  ]

  // Use real gallery images or fallback to default
  const galleryImages = club.galleryImages && club.galleryImages.length > 0 
    ? club.galleryImages 
    : defaultImages

  // Default instructors for now (will need separate implementation)
  const defaultInstructors = [
    {
      id: "1",
      name: "Carlos Rodríguez",
      image: "/placeholder.svg?height=200&width=200",
      role: "Director Técnico",
      experience: "15 años",
      specialties: ["Técnica avanzada", "Táctica de competición"],
      availability: "Lunes a Viernes",
    },
    {
      id: "2",
      name: "Laura Martínez",
      image: "/placeholder.svg?height=200&width=200",
      role: "Entrenadora",
      experience: "8 años",
      specialties: ["Iniciación", "Clases grupales"],
      availability: "Lunes a Sábado",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/clubes"
            className="inline-flex items-center text-slate-600 hover:text-violet-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver a clubes
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            <img 
              src={club.coverImage || defaultImages[0]} 
              alt={club.name || "Club"} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <Badge className="mb-2 bg-white/90 text-slate-700 backdrop-blur-sm">
                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                {club.rating > 0 ? club.rating : "Nuevo"} ({club.reviewCount} opiniones)
              </Badge>
              <h1 className="text-3xl font-bold text-white mb-2">{club.name}</h1>
              <div className="flex items-center text-white/90">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{club.address}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Sobre el club</h2>
                <p className="text-slate-600 mb-6">{club.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center text-slate-600 mb-1">
                      <Users className="h-4 w-4 mr-2 text-violet-500" />
                      <span className="font-medium">Pistas</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{club.courts || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center text-slate-600 mb-1">
                      <Clock className="h-4 w-4 mr-2 text-violet-500" />
                      <span className="font-medium">Horario</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {club.opens_at && club.closes_at 
                        ? `${club.opens_at.slice(0, 5)} - ${club.closes_at.slice(0, 5)}`
                        : "8:00 - 22:00"
                      }
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center text-slate-600 mb-1">
                      <Phone className="h-4 w-4 mr-2 text-violet-500" />
                      <span className="font-medium">Teléfono</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{club.phone}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center text-slate-600 mb-1">
                      <Globe className="h-4 w-4 mr-2 text-violet-500" />
                      <span className="font-medium">Web</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{club.website}</p>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-800 mb-4">Servicios y características</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {club.services && club.services.length > 0 ? (
                    club.services.map((service: any, index: number) => (
                      <div key={index} className="flex items-center text-slate-600">
                        <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                        <span>{service.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-slate-500 text-center py-4">
                      No hay servicios especificados para este club
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-800 mb-4">Galería de fotos</h2>
                <ClubGallery images={galleryImages} />
              </div>

              <div>
                <div className="bg-slate-50 rounded-xl p-5 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Información de contacto</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{club.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-violet-500" />
                      <span className="text-slate-600">{club.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-violet-500" />
                      <span className="text-slate-600">{club.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-3 text-violet-500" />
                      <a
                        href={`https://${club.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 hover:underline"
                      >
                        {club.website}
                      </a>
                    </div>
                    {club.instagram && (
                      <div className="flex items-center">
                        <div className="h-5 w-5 mr-3 text-violet-500 flex items-center justify-center">
                          <span className="text-sm">IG</span>
                        </div>
                        <a
                          href={`https://instagram.com/${club.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 hover:underline"
                        >
                          @{club.instagram}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-5">
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-emerald-500 hover:opacity-90 text-white">
                      Contactar
                    </Button>
                  </div>
                </div>

                {club.upcomingTournaments && club.upcomingTournaments.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-5 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Próximos torneos</h3>
                    <div className="space-y-3">
                      {club.upcomingTournaments.map((tournament: any) => (
                        <Link
                          key={tournament.id}
                          href={`/tournaments/${tournament.id}`}
                          className="block bg-white p-3 rounded-lg border border-slate-100 hover:border-violet-200 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-800">{tournament.name}</h4>
                              <div className="flex items-center text-slate-500 text-sm mt-1">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>{tournament.date}</span>
                              </div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              {tournament.category}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                      >
                        <Link href="/tournaments" className="flex items-center justify-center">
                          Ver todos los torneos
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ClubInstructors instructors={defaultInstructors} />

        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Opiniones de usuarios</h2>
            <Badge className="bg-white text-slate-700 border border-slate-200">
              <Star className="h-3.5 w-3.5 mr-1 fill-amber-400 text-amber-400" />
              {club.rating > 0 ? club.rating : "Sin calificar"} ({club.reviewCount})
            </Badge>
          </div>

          <div className="space-y-4 mb-6">
            {club.reviews && club.reviews.length > 0 ? (
              club.reviews.map((review: any, index: number) => (
                <div key={index} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="bg-violet-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-violet-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{review.playerName}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(review.date).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.score ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600">{review.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No hay opiniones aún. ¡Sé el primero en dejar una reseña!
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button className="bg-gradient-to-r from-violet-600 to-emerald-500 hover:opacity-90 text-white">
              <MessageSquare className="h-4 w-4 mr-2" />
              Escribir una opinión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
