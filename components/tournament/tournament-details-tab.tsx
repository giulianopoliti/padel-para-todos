"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, PlusCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import RegisterPlayerForm from "./club/register-player-form"
import type { Tables } from "@/database.types"
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

interface TournamentDetailsTabsProps {
  individualInscriptions: PlayerInfo[]
  coupleInscriptions: CoupleInfo[]
  tournamentId: string
  tournamentStatus: string
  maxPlayers?: number
  allPlayers?: PlayerInfo[]
}

export default function TournamentDetailsTabs({
  individualInscriptions,
  coupleInscriptions,
  tournamentId,
  tournamentStatus,
  maxPlayers = 32, // Valor por defecto
  allPlayers = [],
}: TournamentDetailsTabsProps) {
  const [registerPlayerDialogOpen, setRegisterPlayerDialogOpen] = useState(false)
  const [registerCoupleDialogOpen, setRegisterCoupleDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("players")

  const isTournamentActive = tournamentStatus !== "NOT_STARTED"
  const currentPlayers = individualInscriptions.length
  const currentCouples = coupleInscriptions.length
  const isMaxPlayersReached = currentPlayers >= maxPlayers

  const handleRegisterSuccess = () => {
    // Cerrar diálogos y refrescar la página
    setRegisterPlayerDialogOpen(false)
    setRegisterCoupleDialogOpen(false)
    window.location.reload()
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 hover:border-violet-100 transition-all duration-300">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b border-slate-200 rounded-t-xl bg-slate-50">
          <TabsTrigger
            value="players"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-violet-500"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Jugadores Individuales
          </TabsTrigger>
          <TabsTrigger
            value="couples"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500"
          >
            <Users className="mr-2 h-4 w-4" />
            Parejas
          </TabsTrigger>
        </TabsList>

        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            {activeTab === "players" ? (
              <span>
                <span className="font-medium text-violet-700">{currentPlayers}</span> de{" "}
                <span className="font-medium text-violet-700">{maxPlayers}</span> jugadores inscritos
              </span>
            ) : (
              <span>
                <span className="font-medium text-emerald-700">{currentCouples}</span> parejas inscritas
              </span>
            )}
          </div>
          
          {!isTournamentActive && (
            <div className="flex gap-2">
              {activeTab === "players" && (
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
              
              {activeTab === "couples" && (
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
          )}
        </div>

        <TabsContent value="players" className="p-6">
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
        </TabsContent>

        <TabsContent value="couples" className="p-6">
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
        </TabsContent>
      </Tabs>

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

      {/* Diálogo para inscribir pareja */}
      <Dialog open={registerCoupleDialogOpen} onOpenChange={setRegisterCoupleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inscribir Pareja</DialogTitle>
            <DialogDescription>
              Seleccione o registre dos jugadores para formar una pareja
            </DialogDescription>
          </DialogHeader>
          <RegisterCoupleForm 
            tournamentId={tournamentId} 
            onComplete={handleRegisterSuccess} 
            players={allPlayers}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
