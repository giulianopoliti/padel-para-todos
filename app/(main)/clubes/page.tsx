import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ChevronRight, Users, Clock, Search, Filter, Award, Zap } from "lucide-react"
import { getClubesWithServices, getUserRole } from "@/app/api/users"

export default async function ClubesPage() {
  const clubes = await getClubesWithServices()
  
  // Handle userRole safely for public pages
  let userRole = null
  try {
    userRole = await getUserRole()
  } catch (error) {
    // User not authenticated - that's fine for public pages
    console.log("User not authenticated, showing public view")
    userRole = null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 relative overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute top-32 left-32 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-32 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-16">
          {/* <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 text-white border-white/20 backdrop-blur-sm">
            <Award className="mr-2 h-4 w-4" />
            Clubes Premium
          </Badge> */}
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Clubes de Pádel
          </h1>
          <p className="text-white/80 text-xl max-w-3xl mx-auto leading-relaxed">
            Encuentra los mejores clubes de pádel con instalaciones de primera calidad
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 mb-16 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o ubicación..."
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-700 font-medium"
                readOnly
              />
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <select 
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white text-slate-700 font-medium"
                  disabled
                >
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
          <div className="text-center py-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-12 max-w-2xl mx-auto">
              <Award className="h-16 w-16 text-slate-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-800 mb-4">No hay clubes registrados</h3>
              <p className="text-slate-600 text-lg">Próximamente tendremos los mejores clubes de pádel.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-8xl mx-auto">
            {clubes.map((club) => (
              <div
                key={club.id}
                className="h-full group"
              >
                <Link href={`/clubes/${club.id}`} className="block h-full">
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-500 h-full flex flex-col group-hover:bg-white group-hover:shadow-3xl group-hover:transform group-hover:-translate-y-3 group-hover:scale-105">
                    <div className="relative overflow-hidden">
                      <img 
                        src={club.coverImage || "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=250&width=400"} 
                        alt={club.name || "Club de pádel"} 
                        className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm shadow-md">
                          <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                          {club.rating > 0 ? club.rating : "Nuevo"}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg">
                          <Award className="h-3 w-3 mr-1" />
                          Elite
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-700 transition-colors">
                        {club.name || "Club sin nombre"}
                      </h3>
                      <div className="flex items-center text-slate-500 text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-teal-500" />
                        <span className="font-medium">{club.address || "Dirección no disponible"}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center text-slate-600 text-sm bg-slate-50 rounded-lg p-2">
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-medium">{club.courts || 0} pistas</span>
                        </div>
                        <div className="flex items-center text-slate-600 text-sm bg-slate-50 rounded-lg p-2">
                          <Clock className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="font-medium text-xs">
                            {club.opens_at && club.closes_at 
                              ? `${club.opens_at.slice(0, 5)} - ${club.closes_at.slice(0, 5)}`
                              : "8:00 - 22:00"
                            }
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Servicios</h4>
                        <div className="flex flex-wrap gap-1">
                          {club.services && club.services.length > 0 ? (
                            <>
                              {club.services.slice(0, 2).map((service: any, i: number) => (
                                <Badge key={i} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs font-normal">
                                  {service.name}
                                </Badge>
                              ))}
                              {club.services.length > 2 && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-normal">
                                  +{club.services.length - 2}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-xs font-normal">
                              Sin servicios especificados
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="text-sm text-slate-500 mb-3 flex items-center justify-between">
                          <span>{club.reviewCount > 0 ? `${club.reviewCount} opiniones` : "Sin opiniones aún"}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < Math.floor(club.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div className="w-full justify-between bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:from-teal-50 hover:to-blue-50 hover:border-teal-200 text-slate-700 hover:text-teal-700 rounded-xl group-hover:shadow-lg transition-all duration-300 p-3 flex items-center">
                          <span className="font-semibold">Ver detalles</span>
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {userRole && userRole != "CLUB" && (<div className="flex justify-center mt-16">
          <Link 
            href="/clubs/register"
            className="inline-flex items-center bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-2xl shadow-2xl px-8 py-4 font-medium transition-all duration-300"
          >
            <Award className="mr-3 h-5 w-5" />
            Registrar Mi Club
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>)}
      </div>
    </div>
  )
}
