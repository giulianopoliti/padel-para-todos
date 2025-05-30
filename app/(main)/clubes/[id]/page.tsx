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
  Award,
  Zap,
  Trophy,
} from "lucide-react"
import { getClubDetails } from "@/app/api/users"
import { notFound } from "next/navigation"

const ClubGallery = ({ images }: { images: string[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {images.map((image, index) => (
      <div key={index} className="aspect-square rounded-xl overflow-hidden">
        <img src={image} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
      </div>
    ))}
  </div>
)

const ClubInstructors = ({ instructors }: { instructors: any[] }) => (
  <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
    <h2 className="text-2xl font-bold text-slate-800 mb-6">Nuestros Instructores</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {instructors.map((instructor) => (
        <div key={instructor.id} className="bg-slate-50 rounded-2xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{instructor.name}</h3>
              <p className="text-slate-600">{instructor.role}</p>
            </div>
          </div>
          <p className="text-slate-600 mb-2"><strong>Experiencia:</strong> {instructor.experience}</p>
          <p className="text-slate-600 mb-2"><strong>Especialidades:</strong> {instructor.specialties.join(", ")}</p>
          <p className="text-slate-600"><strong>Disponibilidad:</strong> {instructor.availability}</p>
        </div>
      ))}
    </div>
  </div>
)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute top-32 left-32 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-32 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <Link
            href="/clubes"
            className="inline-flex items-center text-white/80 hover:text-teal-400 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver a clubes
          </Link>
        </div>

        
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            <img 
              src={club.coverImage || defaultImages[0]} 
              alt={club.name || "Club"} 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <Badge className="mb-3 bg-white/90 text-slate-700 backdrop-blur-sm shadow-md">
                <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                {club.rating > 0 ? club.rating : "Nuevo"} ({club.reviewCount} opiniones)
              </Badge>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{club.name}</h1>
              <div className="flex items-center text-white/90">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="font-medium">{club.address}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Sobre el club</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">{club.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                    <div className="flex items-center text-teal-600 mb-2">
                      <Users className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Pistas</span>
                    </div>
                    <p className="text-2xl font-black text-teal-800">{club.courts || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center text-blue-600 mb-2">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Horario</span>
                    </div>
                    <p className="text-lg font-bold text-blue-800">
                      {club.opens_at && club.closes_at 
                        ? `${club.opens_at.slice(0, 5)} - ${club.closes_at.slice(0, 5)}`
                        : "8:00 - 22:00"
                      }
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center text-purple-600 mb-2">
                      <Phone className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Teléfono</span>
                    </div>
                    <p className="text-lg font-bold text-purple-800">{club.phone}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center text-emerald-600 mb-2">
                      <Globe className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Web</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-800">{club.website}</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-6">Servicios y características</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                  {club.services && club.services.length > 0 ? (
                    club.services.map((service: any, index: number) => (
                      <div key={index} className="flex items-center text-slate-600 bg-slate-50 p-3 rounded-xl">
                        <CheckCircle className="h-5 w-5 mr-3 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium">{service.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-slate-500 text-center py-8 bg-slate-50 rounded-xl">
                      No hay servicios especificados para este club
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-6">Galería de fotos</h2>
                <ClubGallery images={galleryImages} />
              </div>

              <div>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6 border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Información de contacto</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-teal-500 flex-shrink-0 mt-1" />
                      <span className="text-slate-600 font-medium">{club.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-blue-500" />
                      <span className="text-slate-600 font-medium">{club.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-purple-500" />
                      <span className="text-slate-600 font-medium">{club.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-3 text-emerald-500" />
                      <a
                        href={`https://${club.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
                      >
                        {club.website}
                      </a>
                    </div>
                    {club.instagram && (
                      <div className="flex items-center">
                        <div className="h-5 w-5 mr-3 text-pink-500 flex items-center justify-center">
                          <span className="text-sm font-bold">IG</span>
                        </div>
                        <a
                          href={`https://instagram.com/${club.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700 font-medium hover:underline transition-colors"
                        >
                          @{club.instagram}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Button className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl shadow-lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Contactar
                    </Button>
                  </div>
                </div>

                {club.upcomingTournaments && club.upcomingTournaments.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6 border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Próximos torneos</h3>
                    <div className="space-y-3">
                      {club.upcomingTournaments.map((tournament: any) => (
                        <div
                          key={tournament.id}
                          className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">{tournament.name}</h4>
                              <div className="flex items-center text-slate-500 text-sm mt-2">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{tournament.date}</span>
                              </div>
                            </div>
                            <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white">
                              {tournament.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Button
                        variant="outline"
                        className="w-full border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Ver todos los torneos
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ClubInstructors instructors={defaultInstructors} />

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Opiniones de usuarios</h2>
            <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg">
              <Star className="h-4 w-4 mr-1 fill-white" />
              {club.rating > 0 ? club.rating : "Sin calificar"} ({club.reviewCount})
            </Badge>
          </div>

          <div className="space-y-6 mb-8">
            {club.reviews && club.reviews.length > 0 ? (
              club.reviews.map((review: any, index: number) => (
                <div key={index} className="border-b border-slate-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-4">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{review.playerName}</div>
                        <div className="text-sm text-slate-500">
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
                          className={`h-4 w-4 ${i < review.score ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{review.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg">No hay opiniones aún. ¡Sé el primero en dejar una reseña!</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl shadow-lg px-8">
              <MessageSquare className="h-4 w-4 mr-2" />
              Escribir una opinión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
