import { Metadata } from "next"
import CoachesSection from "@/components/coaches/coaches-section"

export const metadata: Metadata = {
  title: "Entrenadores | Padel Tournament System",
  description: "Encuentra los mejores entrenadores de pádel para mejorar tu juego. Entrenadores profesionales certificados con amplia experiencia.",
}

export default async function CoachesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Entrenadores de Pádel
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Descubre y reserva clases con los mejores entrenadores profesionales de pádel
          </p>
        </div>
        <CoachesSection />
      </div>
    </main>
  )
}

