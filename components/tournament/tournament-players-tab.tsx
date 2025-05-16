"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
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
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="text-sm text-slate-600">
          <span>
            <span className="font-medium text-violet-700">{currentPlayers}</span> de{" "}
            <span className="font-medium text-violet-700">{maxPlayers}</span> jugadores inscritos
          </span>
        </div>

        {!isTournamentActive && (
          <Button
            onClick={() => setRegisterPlayerDialogOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-violet-800 hover:opacity-90 text-white"
            size="sm"
            disabled={isMaxPlayersReached}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Inscribir Jugador
          </Button>
        )}
      </div>

      <div className="p-6">
        {individualInscriptions.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-medium text-slate-500">Nombre</TableHead>
                <TableHead className="font-medium text-slate-500">Apellido</TableHead>
                <TableHead className="font-medium text-slate-500">DNI</TableHead>
                <TableHead className="font-medium text-slate-500">Teléfono</TableHead>
                <TableHead className="font-medium text-slate-500 text-center">Puntaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {individualInscriptions.map((player) => (
                <TableRow key={player.id} className="hover:bg-slate-50 border-b border-slate-100">
                  <TableCell className="text-left font-medium text-slate-700">{player.first_name || "—"}</TableCell>
                  <TableCell className="text-left text-slate-700">{player.last_name || "—"}</TableCell>
                  <TableCell className="text-left text-slate-700">{player.dni || "—"}</TableCell>
                  <TableCell className="text-left text-slate-700">{player.phone || "—"}</TableCell>
                  <TableCell className="text-center">
                    {player.score !== null ? (
                      <div className="inline-flex items-center justify-center bg-violet-50 text-violet-700 font-medium rounded-full h-10 w-10 border border-violet-200">
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
        ) : (
          <div className="text-center py-8">
            <div className="bg-violet-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-100">
              <UserPlus className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-xl font-medium text-violet-700 mb-2">No hay jugadores inscritos</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              Aún no hay jugadores individuales inscritos en este torneo.
            </p>
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
