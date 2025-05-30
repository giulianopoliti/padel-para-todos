import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ChevronRight, Users, Clock, Search, Filter } from "lucide-react"
import { getClubesWithServices } from "@/app/api/users"

export default async function ClubesPage() {
  const clubes = await getClubesWithServices()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent mb-4">
            Clubes de Pádel
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Encuentra los mejores clubes de pádel con instalaciones de primera calidad.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-4 mb-8 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o ubicación..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div className="w-full md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <select className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white">
                  <option value="">Todas las ciudades</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Rosario">Rosario</option>
                  <option value="Mendoza">Mendoza</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {clubes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No hay clubes registrados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {clubes.map((club) => (
              <Link key={club.id} href={`/clubes/${club.id}`} className="block h-full">
                <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                  <div className="relative">
                    <img 
                      src={club.coverImage || "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=200&width=400"} 
                      alt={club.name || "Club de pádel"} 
                      className="w-full h-40 object-cover" 
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm">
                        <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                        {club.rating > 0 ? club.rating : "Nuevo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{club.name || "Club sin nombre"}</h3>
                    <div className="flex items-center text-slate-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{club.address || "Dirección no disponible"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center text-slate-600 text-sm">
                        <Users className="h-4 w-4 mr-1 text-slate-400" />
                        <span>{club.courts || 0} pistas</span>
                      </div>
                      <div className="flex items-center text-slate-600 text-sm">
                        <Clock className="h-4 w-4 mr-1 text-slate-400" />
                        <span>
                          {club.opens_at && club.closes_at 
                            ? `${club.opens_at.slice(0, 5)} - ${club.closes_at.slice(0, 5)}`
                            : "8:00 - 22:00"
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {club.services && club.services.length > 0 ? (
                        <>
                          {club.services.slice(0, 2).map((service: any, i: number) => (
                            <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                              {service.name}
                            </Badge>
                          ))}
                          {club.services.length > 2 && (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                              +{club.services.length - 2}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-500 font-normal">
                          Sin servicios especificados
                        </Badge>
                      )}
                    </div>

                    <div className="mt-auto">
                      <div className="text-sm text-slate-500 mb-2">
                        {club.reviewCount > 0 ? `${club.reviewCount} opiniones` : "Sin opiniones aún"}
                      </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
