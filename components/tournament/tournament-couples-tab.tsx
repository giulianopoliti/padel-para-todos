"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import RegisterCoupleForm from "./player/register-couple-form"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score: number | null
  dni?: string | null
  phone?: string | null
}

interface CoupleInfo {
  id: string
  tournament_id: string
  player_1_id: string | null
  player_2_id: string | null
  created_at: string
  player_1_info: PlayerInfo | null
  player_2_info: PlayerInfo | null
}

interface TournamentCouplesTabProps {
  coupleInscriptions: CoupleInfo[]
  tournamentId: string
  tournamentStatus: string
  allPlayers?: PlayerInfo[]
}

export default function TournamentCouplesTab({
  coupleInscriptions,
  tournamentId,
  tournamentStatus,
  allPlayers = [],
}: TournamentCouplesTabProps) {
  const [registerCoupleDialogOpen, setRegisterCoupleDialogOpen] = useState(false)

  const isTournamentActive = tournamentStatus !== "NOT_STARTED"
  const currentCouples = coupleInscriptions.length

  const handleRegisterSuccess = () => {
    setRegisterCoupleDialogOpen(false)
    window.location.reload()
  }

  return (
    <>
      <div className="p-6 border-b border-gray-200 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Parejas Inscritas</h3>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{currentCouples}</span> parejas inscritas en el torneo
            </p>
          </div>

          {!isTournamentActive && (
            <Button
              onClick={() => setRegisterCoupleDialogOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Inscribir Pareja
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {coupleInscriptions.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-slate-700">Jugador 1</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Puntaje</TableHead>
                  <TableHead className="font-semibold text-slate-700">Jugador 2</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupleInscriptions.map((couple) => (
                  <TableRow key={couple.id} className="hover:bg-slate-50 border-b border-gray-100">
                    <TableCell className="font-medium text-slate-900">
                      {couple.player_1_info
                        ? `${couple.player_1_info.first_name || ""} ${couple.player_1_info.last_name || ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {couple.player_1_info?.score !== null && couple.player_1_info?.score !== undefined ? (
                        <div className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-semibold rounded-full h-8 w-8 border border-slate-200">
                          {couple.player_1_info.score}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {couple.player_2_info
                        ? `${couple.player_2_info.first_name || ""} ${couple.player_2_info.last_name || ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {couple.player_2_info?.score !== null && couple.player_2_info?.score !== undefined ? (
                        <div className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-semibold rounded-full h-8 w-8 border border-slate-200">
                          {couple.player_2_info.score}
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
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay parejas inscritas</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Aún no hay parejas inscritas en este torneo. Comienza agregando la primera pareja.
            </p>
            {!isTournamentActive && (
              <Button
                onClick={() => setRegisterCoupleDialogOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Inscribir Primera Pareja
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Diálogo para inscribir pareja */}
      <Dialog open={registerCoupleDialogOpen} onOpenChange={setRegisterCoupleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inscribir Pareja</DialogTitle>
            <DialogDescription>Seleccione o registre dos jugadores para formar una pareja</DialogDescription>
          </DialogHeader>
          <RegisterCoupleForm tournamentId={tournamentId} onComplete={handleRegisterSuccess} players={allPlayers} />
        </DialogContent>
      </Dialog>
    </>
  )
}
