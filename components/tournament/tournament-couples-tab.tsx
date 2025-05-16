"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Users, PlusCircle } from "lucide-react"
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
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="text-sm text-slate-600">
          <span>
            <span className="font-medium text-emerald-700">{currentCouples}</span> parejas inscritas
          </span>
        </div>

        {!isTournamentActive && (
          <Button
            onClick={() => setRegisterCoupleDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:opacity-90 text-white"
            size="sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Inscribir Pareja
          </Button>
        )}
      </div>

      <div className="p-6">
        {coupleInscriptions.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-medium text-slate-500">Jugador 1</TableHead>
                <TableHead className="font-medium text-slate-500 text-center">Puntaje</TableHead>
                <TableHead className="font-medium text-slate-500">Jugador 2</TableHead>
                <TableHead className="font-medium text-slate-500 text-center">Puntaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupleInscriptions.map((couple) => (
                <TableRow key={couple.id} className="hover:bg-slate-50 border-b border-slate-100">
                  <TableCell className="text-left font-medium text-slate-700">
                    {couple.player_1_info
                      ? `${couple.player_1_info.first_name || ""} ${couple.player_1_info.last_name || ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {couple.player_1_info?.score !== null && couple.player_1_info?.score !== undefined ? (
                      <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-medium rounded-full h-9 w-9 border border-emerald-200">
                        {couple.player_1_info.score}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left font-medium text-slate-700">
                    {couple.player_2_info
                      ? `${couple.player_2_info.first_name || ""} ${couple.player_2_info.last_name || ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {couple.player_2_info?.score !== null && couple.player_2_info?.score !== undefined ? (
                      <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-medium rounded-full h-9 w-9 border border-emerald-200">
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
        ) : (
          <div className="text-center py-8">
            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-medium text-emerald-700 mb-2">No hay parejas inscritas</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">Aún no hay parejas inscritas en este torneo.</p>
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
