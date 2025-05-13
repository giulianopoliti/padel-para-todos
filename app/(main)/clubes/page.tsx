import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ChevronRight, Users, Clock, Search, Filter } from "lucide-react"

// Datos de ejemplo para los clubes
const clubs = [
  {
    id: "1",
    name: "Alvear Club",
    location: "Parque Avellaneda, Ciudad Autónoma de Buenos Aires",
    rating: 4.8,
    reviewCount: 124,
    courts: 12,
    image: "https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/imagenes/prueba/cancha%20prueba.jpg?height=200&width=400",
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
  {
    id: "5",
    name: "Málaga Padel Center",
    location: "Málaga, España",
    rating: 4.4,
    reviewCount: 65,
    courts: 8,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Pistas de cristal", "Cafetería", "Tienda", "Parking"],
    openingHours: "8:30 - 22:30",
  },
  {
    id: "6",
    name: "Zaragoza Padel Club",
    location: "Zaragoza, España",
    rating: 4.3,
    reviewCount: 54,
    courts: 6,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Pistas indoor", "Bar", "Vestuarios", "Clases particulares"],
    openingHours: "9:00 - 22:00",
  },
  {
    id: "7",
    name: "Bilbao Padel Indoor",
    location: "Bilbao, España",
    rating: 4.6,
    reviewCount: 89,
    courts: 10,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Pistas cubiertas", "Cafetería", "Gimnasio", "Parking"],
    openingHours: "7:00 - 23:00",
  },
  {
    id: "8",
    name: "Alicante Padel Club",
    location: "Alicante, España",
    rating: 4.2,
    reviewCount: 45,
    courts: 6,
    image: "/placeholder.svg?height=200&width=400",
    features: ["Pistas exteriores", "Bar", "Vestuarios", "Torneos"],
    openingHours: "8:00 - 21:00",
  },
]

export default function ClubesPage() {
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
                  <option value="Madrid">Madrid</option>
                  <option value="Barcelona">Barcelona</option>
                  <option value="Valencia">Valencia</option>
                  <option value="Sevilla">Sevilla</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {clubs.map((club) => (
            <Link key={club.id} href={`/clubes/${club.id}`} className="block h-full">
              <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                <div className="relative">
                  <img src={club.image || "/placeholder.svg"} alt={club.name} className="w-full h-40 object-cover" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-slate-700 backdrop-blur-sm">
                      <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                      {club.rating}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col">
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
          ))}
        </div>
      </div>
    </div>
  )
}
