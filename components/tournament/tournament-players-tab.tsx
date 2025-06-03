"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UserPlus, Search, Users, Loader2, CheckCircle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import RegisterPlayerForm from "./club/register-player-form"
import { pairIndividualPlayers, removePlayerFromTournament } from "@/app/api/tournaments/actions"

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
  const [pairPlayersDialogOpen, setPairPlayersDialogOpen] = useState(false)
  const [deletePlayerDialogOpen, setDeletePlayerDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<PlayerInfo | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<{
    player1: PlayerInfo | null;
    player2: PlayerInfo | null;
  }>({
    player1: null,
    player2: null
  })
  const [isPairing, setIsPairing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { toast } = useToast()

  const isTournamentActive = tournamentStatus !== "NOT_STARTED"
  const currentPlayers = individualInscriptions.length
  const isMaxPlayersReached = currentPlayers >= maxPlayers
  const canPairPlayers = !isTournamentActive && currentPlayers >= 2

  const handleRegisterSuccess = () => {
    setRegisterPlayerDialogOpen(false)
    window.location.reload()
  }

  const handleSelectPlayer = (player: PlayerInfo, slot: 'player1' | 'player2') => {
    const otherSlot = slot === 'player1' ? 'player2' : 'player1'
    
    // Evitar seleccionar el mismo jugador en ambos slots
    if (selectedPlayers[otherSlot]?.id === player.id) {
      setSelectedPlayers(prev => ({
        ...prev,
        [otherSlot]: null,
        [slot]: player
      }))
    } else {
      setSelectedPlayers(prev => ({
        ...prev,
        [slot]: player
      }))
    }
  }

  const handleRemovePlayer = (slot: 'player1' | 'player2') => {
    setSelectedPlayers(prev => ({
      ...prev,
      [slot]: null
    }))
  }

  const handlePairPlayers = async () => {
    if (!selectedPlayers.player1 || !selectedPlayers.player2) {
      toast({
        title: "Selección incompleta",
        description: "Debe seleccionar ambos jugadores para formar la pareja.",
        variant: "destructive"
      })
      return
    }

    setIsPairing(true)
    try {
      const result = await pairIndividualPlayers(
        tournamentId,
        selectedPlayers.player1.id,
        selectedPlayers.player2.id
      )

      if (result.success) {
        toast({
          title: "Pareja creada",
          description: result.message || "Los jugadores han sido emparejados exitosamente.",
          variant: "default"
        })
        setPairPlayersDialogOpen(false)
        setSelectedPlayers({ player1: null, player2: null })
        window.location.reload()
      } else {
        toast({
          title: "Error al emparejar",
          description: result.error || "No se pudo crear la pareja.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error pairing players:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al emparejar los jugadores.",
        variant: "destructive"
      })
    } finally {
      setIsPairing(false)
    }
  }

  const handleDeletePlayerClick = (player: PlayerInfo) => {
    setPlayerToDelete(player)
    setDeletePlayerDialogOpen(true)
  }

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return

    setIsDeleting(true)
    try {
      const result = await removePlayerFromTournament(tournamentId, playerToDelete.id)

      if (result.success) {
        toast({
          title: "Jugador eliminado",
          description: result.message,
          variant: "default"
        })
        setDeletePlayerDialogOpen(false)
        setPlayerToDelete(null)
        window.location.reload()
      } else {
        toast({
          title: "Error al eliminar",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting player:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar el jugador.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getPlayerDisplayName = (player: PlayerInfo) => {
    const firstName = player.first_name || ""
    const lastName = player.last_name || ""
    return `${firstName} ${lastName}`.trim() || "Jugador sin nombre"
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

          <div className="flex gap-2">
            {canPairPlayers && (
              <Button
                onClick={() => setPairPlayersDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Users className="mr-2 h-4 w-4" />
                Emparejar Jugadores
              </Button>
            )}
            
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
                  {!isTournamentActive && (
                    <TableHead className="font-semibold text-slate-700 text-center">Acciones</TableHead>
                  )}
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
                    {!isTournamentActive && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlayerClick(player)}
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

      {/* Diálogo para emparejar jugadores */}
      <Dialog open={pairPlayersDialogOpen} onOpenChange={setPairPlayersDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Emparejar Jugadores Individuales
            </DialogTitle>
            <DialogDescription>
              Seleccione dos jugadores para formar una pareja. Una vez emparejados, las inscripciones individuales se eliminarán y se creará una inscripción de pareja.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jugador 1 */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Primer Jugador</h4>
                {selectedPlayers.player1 ? (
                  <Card className="border border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">
                            {getPlayerDisplayName(selectedPlayers.player1)}
                          </p>
                          <p className="text-sm text-slate-600">
                            DNI: {selectedPlayers.player1.dni || "No especificado"}
                          </p>
                          <p className="text-sm text-slate-600">
                            Puntaje: {selectedPlayers.player1.score ?? "No especificado"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer('player1')}
                        >
                          ×
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {individualInscriptions.map((player) => (
                      <Button
                        key={player.id}
                        variant="outline"
                        className="justify-start h-auto p-3"
                        onClick={() => handleSelectPlayer(player, 'player1')}
                        disabled={selectedPlayers.player2?.id === player.id}
                      >
                        <div className="text-left">
                          <p className="font-medium">{getPlayerDisplayName(player)}</p>
                          <p className="text-xs text-slate-500">
                            DNI: {player.dni || "N/A"} | Puntaje: {player.score ?? "N/A"}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Jugador 2 */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Segundo Jugador</h4>
                {selectedPlayers.player2 ? (
                  <Card className="border border-green-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">
                            {getPlayerDisplayName(selectedPlayers.player2)}
                          </p>
                          <p className="text-sm text-slate-600">
                            DNI: {selectedPlayers.player2.dni || "No especificado"}
                          </p>
                          <p className="text-sm text-slate-600">
                            Puntaje: {selectedPlayers.player2.score ?? "No especificado"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer('player2')}
                        >
                          ×
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {individualInscriptions.map((player) => (
                      <Button
                        key={player.id}
                        variant="outline"
                        className="justify-start h-auto p-3"
                        onClick={() => handleSelectPlayer(player, 'player2')}
                        disabled={selectedPlayers.player1?.id === player.id}
                      >
                        <div className="text-left">
                          <p className="font-medium">{getPlayerDisplayName(player)}</p>
                          <p className="text-xs text-slate-500">
                            DNI: {player.dni || "N/A"} | Puntaje: {player.score ?? "N/A"}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa de la pareja */}
            {selectedPlayers.player1 && selectedPlayers.player2 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <p className="font-medium">Pareja lista para crear:</p>
                </div>
                <p className="text-sm text-green-700">
                  <strong>{getPlayerDisplayName(selectedPlayers.player1)}</strong> + <strong>{getPlayerDisplayName(selectedPlayers.player2)}</strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPairPlayersDialogOpen(false)
                setSelectedPlayers({ player1: null, player2: null })
              }}
              disabled={isPairing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePairPlayers}
              disabled={!selectedPlayers.player1 || !selectedPlayers.player2 || isPairing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPairing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Emparejando...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Crear Pareja
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar jugador */}
      <Dialog open={deletePlayerDialogOpen} onOpenChange={setDeletePlayerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              ¿Eliminar jugador del torneo?
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente al jugador del torneo. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {playerToDelete && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-900 mb-2">Datos del jugador a eliminar:</h4>
              <div className="space-y-1 text-sm text-red-800">
                <p><strong>Nombre:</strong> {getPlayerDisplayName(playerToDelete)}</p>
                <p><strong>DNI:</strong> {playerToDelete.dni || "No especificado"}</p>
                <p><strong>Teléfono:</strong> {playerToDelete.phone || "No especificado"}</p>
                <p><strong>Puntaje:</strong> {playerToDelete.score ?? "No especificado"}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeletePlayerDialogOpen(false)
                setPlayerToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeletePlayer}
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
    </>
  )
}
