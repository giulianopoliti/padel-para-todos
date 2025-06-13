import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, TrendingUp, BarChart3, Bell, ArrowRight } from "lucide-react"
import Link from "next/link"

export function PlayerFeaturesSection() {
  const playerFeatures = [
    {
      icon: Trophy,
      title: "Ranking Nacional",
      description: "Seguí tu posición en tiempo real y competí con los mejores",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: TrendingUp,
      title: "Sumá Puntos",
      description: "Cada torneo suma puntos para subir de categoría automáticamente",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: BarChart3,
      title: "Perfil Deportivo",
      description: "Estadísticas completas, historial y logros en un solo lugar",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: Bell,
      title: "Notificaciones",
      description: "Enteráte de nuevos torneos cerca tuyo al instante",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">🎾 Para Jugadores</Badge>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Tu Carrera Deportiva, Profesionalizada</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">Seguí tu progreso, competí y conectá</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {playerFeatures.map((feature, index) => (
            <Card
              key={index}
              className="border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white"
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                >
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
            <Link href="/register">
              <Trophy className="mr-2 h-5 w-5" />
              Empezar a Competir
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
} 