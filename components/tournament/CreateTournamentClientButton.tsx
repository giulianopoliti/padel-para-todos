"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CreateTournamentClientButton() {
  return (
    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm">
      <Link href="/my-tournaments/create" className="flex items-center gap-2">
        <Plus className="h-5 w-5" />
        Crear Nuevo Torneo
      </Link>
    </Button>
  )
}
