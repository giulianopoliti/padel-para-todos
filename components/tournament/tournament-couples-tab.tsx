"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import CoupleRegistrationAdvanced from "@/components/tournament/couple-registration-advanced"
import RegisterCoupleForm from "@/components/tournament/player/register-couple-form"
import { removeCoupleFromTournament } from "@/app/api/tournaments/actions"
import { useUser } from "@/contexts/user-context"
import AuthRequiredDialog from "@/components/tournament/auth-required-dialog"

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
  const [deleteCoupleDialogOpen, setDeleteCoupleDialogOpen] = useState(false)
  const [coupleToDelete, setCoupleToDelete] = useState<CoupleInfo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const { user, userDetails } = useUser()

  const isTournamentActive = tournamentStatus !== "NOT_STARTED"
  const isPlayer = userDetails?.role === 'PLAYER' && userDetails?.player_id
  const isClub = userDetails?.role === 'CLUB' && userDetails?.club_id
  const currentCouples = coupleInscriptions.length
  const isLoggedIn = !!user

  const handleRegisterSuccess = () => {
    setRegisterCoupleDialogOpen(false)
    window.location.reload()
  }

  const handleDeleteCoupleClick = (couple: CoupleInfo) => {
    setCoupleToDelete(couple)
    setDeleteCoupleDialogOpen(true)
  }

  const handleDeleteCouple = async () => {
    if (!coupleToDelete) return

    setIsDeleting(true)
    try {
      const result = await removeCoupleFromTournament(tournamentId, coupleToDelete.id)

      if (result.success) {
        toast({
          title: "Pareja eliminada",
          description: result.message,
          variant: "default"
        })
        setDeleteCoupleDialogOpen(false)
        setCoupleToDelete(null)
        window.location.reload()
      } else {
        toast({
          title: "Error al eliminar",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting couple:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar la pareja.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getPlayerDisplayName = (playerInfo: PlayerInfo | null) => {
    if (!playerInfo) return "—"
    const firstName = playerInfo.first_name || ""
    const lastName = playerInfo.last_name || ""
    return `${firstName} ${lastName}`.trim() || "—"
  }

  const handleRegisterCoupleClick = () => {
    if (!isLoggedIn) {
      setAuthDialogOpen(true)
      return
    }
    
    if (!isPlayer && !isClub) {
      toast({
        title: "Sin permisos para inscripción",
        description: "Solo los jugadores y clubes pueden inscribir parejas.",
        variant: "destructive"
      })
      return
    }
    
    setRegisterCoupleDialogOpen(true)
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
              onClick={handleRegisterCoupleClick}
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
                  {!isTournamentActive && (
                    <TableHead className="font-semibold text-slate-700 text-center">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupleInscriptions.map((couple) => (
                  <TableRow key={couple.id} className="hover:bg-slate-50 border-b border-gray-100">
                    <TableCell className="font-medium text-slate-900">
                      {getPlayerDisplayName(couple.player_1_info)}
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
                      {getPlayerDisplayName(couple.player_2_info)}
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
                    {!isTournamentActive && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCoupleClick(couple)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
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
                onClick={handleRegisterCoupleClick}
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
        <DialogContent className={isPlayer ? "sm:max-w-[800px] max-h-[90vh] overflow-y-auto" : "sm:max-w-[1000px] max-h-[95vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle>
              {isPlayer ? "Inscripción en Pareja" : "Sistema Avanzado de Inscripción de Parejas"}
            </DialogTitle>
            <DialogDescription>
              {isPlayer 
                ? "Registra una pareja para el torneo" 
                : "Registre parejas de manera flexible: combine jugadores nuevos y existentes según sus necesidades"
              }
            </DialogDescription>
          </DialogHeader>
          
          {isPlayer ? (
            <RegisterCoupleForm
              tournamentId={tournamentId}
              onComplete={handleRegisterSuccess}
              players={allPlayers}
            />
          ) : (
            <CoupleRegistrationAdvanced
              tournamentId={tournamentId}
              onComplete={handleRegisterSuccess}
              players={allPlayers}
              isClubMode={true}
              userPlayerId={null}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar pareja */}
      <Dialog open={deleteCoupleDialogOpen} onOpenChange={setDeleteCoupleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              ¿Eliminar pareja del torneo?
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente a la pareja del torneo. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {coupleToDelete && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-900 mb-2">Datos de la pareja a eliminar:</h4>
              <div className="space-y-2 text-sm text-red-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Jugador 1:</p>
                    <p>{getPlayerDisplayName(coupleToDelete.player_1_info)}</p>
                    <p className="text-xs">
                      Puntaje: {coupleToDelete.player_1_info?.score ?? "No especificado"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Jugador 2:</p>
                    <p>{getPlayerDisplayName(coupleToDelete.player_2_info)}</p>
                    <p className="text-xs">
                      Puntaje: {coupleToDelete.player_2_info?.score ?? "No especificado"}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-red-300">
                  <p><strong>Pareja formada:</strong> {getPlayerDisplayName(coupleToDelete.player_1_info)} + {getPlayerDisplayName(coupleToDelete.player_2_info)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteCoupleDialogOpen(false)
                setCoupleToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCouple}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de autenticación requerida */}
      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title="Necesitas iniciar sesión"
        description="Para inscribir una pareja en el torneo necesitas tener una cuenta activa."
        actionText="inscribir una pareja"
      />
    </>
  )
}
