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
  Trophy,
  Instagram,
} from "lucide-react"
import { getClubDetails } from "@/app/api/users"
import { notFound } from "next/navigation"

const ClubGallery = ({ images }: { images: string[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {images.map((image, index) => (
      <div key={index} className="aspect-square rounded-xl overflow-hidden border border-slate-200">
        <img
          src={image || "/placeholder.svg"}
          alt={`Imagen ${index + 1}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
    ))}
  </div>
)



export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const club = await getClubDetails(id)

  if (!club) {
    notFound()
  }

  const defaultImages = [
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
    "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=400&width=600",
  ]

  const galleryImages = club.galleryImages && club.galleryImages.length > 0 ? club.galleryImages : defaultImages



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/clubes"
            className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors group"
          >
            <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Volver a clubes
          </Link>
        </div>

        {/* Main Club Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            <img
              src={club.coverImage || defaultImages[0]}
              alt={club.name || "Club"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <Badge className="mb-3 bg-white/90 text-slate-700 backdrop-blur-sm shadow-md border-0">
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
                <p className="text-slate-600 mb-8 leading-relaxed">{club.description || "Descripción del club por completar"}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center text-slate-600 mb-2">
                      <Users className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Pistas</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800">{club.courts || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center text-slate-600 mb-2">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Horario</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {club.opens_at && club.closes_at
                        ? `${club.opens_at.slice(0, 5)} - ${club.closes_at.slice(0, 5)}`
                        : "8:00 - 22:00"}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center text-slate-600 mb-2">
                      <Phone className="h-5 w-5 mr-2" />
                      <span className="font-semibold">Teléfono</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{club.phone}</p>
                  </div>
                  {club.instagram && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center text-slate-600 mb-2">
                        <Instagram className="h-5 w-5 mr-2" />
                        <span className="font-semibold">Instagram</span>
                      </div>
                      <a
                        href={`https://instagram.com/${club.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        @{club.instagram}
                      </a>
                    </div>
                  )}
                </div>

                {/* Services */}
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Servicios y características</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                  {club.services && club.services.length > 0 ? (
                    club.services.map((service: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100"
                      >
                        <CheckCircle className="h-5 w-5 mr-3 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium">{service.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                      No hay servicios especificados para este club
                    </div>
                  )}
                </div>

                {/* Gallery */}
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Galería de fotos</h2>
                <ClubGallery images={galleryImages} />
              </div>

              {/* Sidebar */}
              <div>
                <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Información de contacto</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-slate-500 flex-shrink-0 mt-1" />
                      <span className="text-slate-600 font-medium">{club.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-slate-500" />
                      <span className="text-slate-600 font-medium">{club.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-slate-500" />
                      <span className="text-slate-600 font-medium">{club.email}</span>
                    </div>
                    {club.website && (
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 mr-3 text-slate-500" />
                        <a
                          href={`https://${club.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-800 font-medium hover:underline transition-colors"
                        >
                          {club.website}
                        </a>
                      </div>
                    )}
                    {club.instagram && (
                      <div className="flex items-center">
                        <Instagram className="h-5 w-5 mr-3 text-slate-500" />
                        <a
                          href={`https://instagram.com/${club.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-slate-800 font-medium hover:underline transition-colors"
                        >
                          @{club.instagram}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Button className="w-full bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white rounded-xl shadow-lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Contactar
                    </Button>
                  </div>
                </div>

                {/* Upcoming Tournaments */}
                {club.upcomingTournaments && club.upcomingTournaments.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Próximos torneos</h3>
                    <div className="space-y-3">
                      {club.upcomingTournaments.map((tournament: any) => (
                        <div
                          key={tournament.id}
                          className="block bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-300 group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-slate-800 group-hover:text-slate-600 transition-colors">
                                {tournament.name}
                              </h4>
                              <div className="flex items-center text-slate-500 text-sm mt-2">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{tournament.date}</span>
                              </div>
                            </div>
                            <Badge className="bg-gradient-to-r from-slate-600 to-slate-800 text-white">
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



        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Opiniones de usuarios</h2>
            <Badge className="bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg">
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
                      <div className="bg-gradient-to-r from-slate-600 to-slate-800 rounded-full w-10 h-10 flex items-center justify-center mr-4">
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
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg">No hay opiniones aún. ¡Sé el primero en dejar una reseña!</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white rounded-xl shadow-lg px-8">
              <MessageSquare className="h-4 w-4 mr-2" />
              Escribir una opinión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
