import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"
import type { ReactNode } from "react"

interface TournamentLayoutProps {
  children: ReactNode
  onBack: () => void
}

export default function TournamentLayout({ children, onBack }: TournamentLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-6 border-padel-green-200 text-padel-green-700 hover:bg-padel-green-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        {children}
      </div>
    </div>
  )
} 