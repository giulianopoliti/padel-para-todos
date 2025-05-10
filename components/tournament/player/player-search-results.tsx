"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

interface PlayerSearchResultsProps {
  results: any[]
  onSelectPlayer: (playerId: string) => void
  selectedPlayerId: string | null
}

export default function PlayerSearchResults({ results, onSelectPlayer, selectedPlayerId }: PlayerSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500">
        No se encontraron resultados. Intente con otra búsqueda o registre un nuevo jugador.
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="border-b border-slate-200">
            <TableHead className="font-medium text-slate-500">Nombre</TableHead>
            <TableHead className="font-medium text-slate-500">Apellido</TableHead>
            <TableHead className="font-medium text-slate-500">DNI</TableHead>
            <TableHead className="font-medium text-slate-500 w-[100px]">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((player) => (
            <TableRow
              key={player.id}
              className={`hover:bg-slate-50 border-b border-slate-100 ${
                selectedPlayerId === player.id ? "bg-teal-50" : ""
              }`}
            >
              <TableCell className="text-left font-medium text-slate-700">{player.first_name || "—"}</TableCell>
              <TableCell className="text-left text-slate-700">{player.last_name || "—"}</TableCell>
              <TableCell className="text-left text-slate-700">{player.dni || "—"}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={selectedPlayerId === player.id ? "default" : "outline"}
                  className={selectedPlayerId === player.id ? "bg-teal-600 hover:bg-teal-700 w-full" : "w-full"}
                  onClick={() => onSelectPlayer(player.id)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  {selectedPlayerId === player.id ? "Seleccionado" : "Seleccionar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
