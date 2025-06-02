"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UserPlus, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import RegisterPlayerForm from "./club/register-player-form"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score: number | null
  dni?: string | null
  phone?: string | null
}

interface TournamentPlayersTabProps {
  individualInscriptions: PlayerInfo[]
  tournamentId: string
  tournamentStatus: string
  maxPlayers?: number
  allPlayers?: PlayerInfo[]
}

export default function TournamentPlayersTab({
  individualInscriptions,
  tournamentId,
  tournamentStatus,
  maxPlayers = 32,
  allPlayers = [],
}: TournamentPlayersTabProps) {
  const [registerPlayerDialogOpen, setRegisterPlayerDialogOpen] = useState(false)

  const isTournamentActive = tournamentStatus !== "NOT_STARTED"
  const currentPlayers = individualInscriptions.length
  const isMaxPlayersReached = currentPlayers >= maxPlayers

  const handleRegisterSuccess = () => {
    setRegisterPlayerDialogOpen(false)
    window.location.reload()
  }

  return (
    <>
      <div className="p-6 border-b border-gray-200 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Jugadores Individuales</h3>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{currentPlayers}</span> de{" "}
              <span className="font-semibold text-slate-900">{maxPlayers}</span> jugadores inscritos
            </p>
          </div>

          {!isTournamentActive && (
            <Button
              onClick={() => setRegisterPlayerDialogOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white"
              disabled={isMaxPlayersReached}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Inscribir Jugador
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {individualInscriptions.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-slate-700">Nombre</TableHead>
                  <TableHead className="font-semibold text-slate-700">Apellido</TableHead>
                  <TableHead className="font-semibold text-slate-700">DNI</TableHead>
                  <TableHead className="font-semibold text-slate-700">Teléfono</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {individualInscriptions.map((player) => (
                  <TableRow key={player.id} className="hover:bg-slate-50 border-b border-gray-100">
                    <TableCell className="font-medium text-slate-900">{player.first_name || "—"}</TableCell>
                    <TableCell className="text-slate-700">{player.last_name || "—"}</TableCell>
                    <TableCell className="text-slate-700">{player.dni || "—"}</TableCell>
                    <TableCell className="text-slate-700">{player.phone || "—"}</TableCell>
                    <TableCell className="text-center">
                      {player.score !== null ? (
                        <div className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-semibold rounded-full h-8 w-8 border border-slate-200">
                          {player.score}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay jugadores inscritos</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Aún no hay jugadores individuales inscritos en este torneo. Comienza agregando el primer jugador.
            </p>
            {!isTournamentActive && (
              <Button
                onClick={() => setRegisterPlayerDialogOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white"
                disabled={isMaxPlayersReached}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Inscribir Primer Jugador
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Diálogo para inscribir jugador */}
      <Dialog open={registerPlayerDialogOpen} onOpenChange={setRegisterPlayerDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inscribir Jugador</DialogTitle>
            <DialogDescription>
              Busque un jugador existente o registre uno nuevo para inscribirlo en el torneo
            </DialogDescription>
          </DialogHeader>
          <RegisterPlayerForm
            tournamentId={tournamentId}
            onSuccess={handleRegisterSuccess}
            existingPlayers={allPlayers}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
