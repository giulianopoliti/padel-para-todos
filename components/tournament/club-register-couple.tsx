"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, X, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { registerCoupleForTournament } from "@/app/api/couples/actions";
import { checkPlayerInscriptionStatus } from "@/app/api/tournaments/actions";
import { useRouter } from "next/navigation";
import PlayerSearch, { PlayerInfo } from "./player-search";

interface ClubRegisterCoupleProps {
  tournamentId: string;
  isClubOwner: boolean;
  isTournamentActive: boolean;
  onCoupleRegistered: () => void;
}

interface PlayerWithStatus extends PlayerInfo {
  isRegistered?: boolean;
  registrationType?: 'individual' | 'couple';
}

export default function ClubRegisterCouple({ 
  tournamentId, 
  isClubOwner, 
  isTournamentActive,
  onCoupleRegistered 
}: ClubRegisterCoupleProps) {
  // Estado para jugadores seleccionados
  const [selectedPlayers, setSelectedPlayers] = useState<{
    player1: PlayerWithStatus | null;
    player2: PlayerWithStatus | null;
  }>({
    player1: null,
    player2: null
  });
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingPlayer, setIsCheckingPlayer] = useState<{
    player1: boolean;
    player2: boolean;
  }>({
    player1: false,
    player2: false
  });
  
  const { toast } = useToast();
  const router = useRouter();

  // Si no es dueño del club o el torneo ya comenzó, no mostrar esta funcionalidad
  if (!isClubOwner || isTournamentActive) {
    return null;
  }

  const checkPlayerStatus = async (player: PlayerInfo, playerKey: 'player1' | 'player2'): Promise<PlayerWithStatus> => {
    setIsCheckingPlayer(prev => ({ ...prev, [playerKey]: true }));
    
    try {
      const result = await checkPlayerInscriptionStatus(tournamentId, player.id);
      
      if (result.success) {
        return {
          ...player,
          isRegistered: result.isRegistered,
          registrationType: result.registrationType
        };
      } else {
        toast({
          title: "Error de verificación",
          description: result.error || "No se pudo verificar el estado del jugador.",
          variant: "destructive"
        });
        return {
          ...player,
          isRegistered: false
        };
      }
    } catch (error) {
      console.error("Error checking player status:", error);
      toast({
        title: "Error de verificación",
        description: "Error inesperado al verificar el jugador.",
        variant: "destructive"
      });
      return {
        ...player,
        isRegistered: false
      };
    } finally {
      setIsCheckingPlayer(prev => ({ ...prev, [playerKey]: false }));
    }
  };

  const handleSelectPlayer1 = async (player: PlayerInfo) => {
    // Evitar seleccionar el mismo jugador dos veces
    if (selectedPlayers.player2 && selectedPlayers.player2.id === player.id) {
      toast({
        title: "Error de selección",
        description: "Este jugador ya está seleccionado como Jugador 2.",
        variant: "destructive"
      });
      return;
    }
    
    const playerWithStatus = await checkPlayerStatus(player, 'player1');
    
    if (playerWithStatus.isRegistered) {
      const registrationType = playerWithStatus.registrationType === 'individual' ? 'individualmente' : 'en una pareja';
      toast({
        title: "Jugador ya inscrito",
        description: `${player.first_name} ${player.last_name} ya está inscrito ${registrationType} en este torneo.`,
        variant: "destructive"
      });
    }
    
    setSelectedPlayers(prev => ({
      ...prev,
      player1: playerWithStatus
    }));
  };

  const handleSelectPlayer2 = async (player: PlayerInfo) => {
    // Evitar seleccionar el mismo jugador dos veces
    if (selectedPlayers.player1 && selectedPlayers.player1.id === player.id) {
      toast({
        title: "Error de selección",
        description: "Este jugador ya está seleccionado como Jugador 1.",
        variant: "destructive"
      });
      return;
    }
    
    const playerWithStatus = await checkPlayerStatus(player, 'player2');
    
    if (playerWithStatus.isRegistered) {
      const registrationType = playerWithStatus.registrationType === 'individual' ? 'individualmente' : 'en una pareja';
      toast({
        title: "Jugador ya inscrito",
        description: `${player.first_name} ${player.last_name} ya está inscrito ${registrationType} en este torneo.`,
        variant: "destructive"
      });
    }
    
    setSelectedPlayers(prev => ({
      ...prev,
      player2: playerWithStatus
    }));
  };

  const handleRemovePlayer = (playerKey: 'player1' | 'player2') => {
    setSelectedPlayers(prev => ({
      ...prev,
      [playerKey]: null
    }));
  };

  const canRegisterCouple = () => {
    if (!selectedPlayers.player1 || !selectedPlayers.player2) {
      return false;
    }
    
    // No permitir registro si algún jugador ya está inscrito
    if (selectedPlayers.player1.isRegistered || selectedPlayers.player2.isRegistered) {
      return false;
    }
    
    return true;
  };

  const handleRegisterCouple = async () => {
    if (!selectedPlayers.player1 || !selectedPlayers.player2) {
      toast({
        title: "Datos incompletos",
        description: "Por favor seleccione ambos jugadores para formar la pareja.",
        variant: "destructive"
      });
      return;
    }
    
    if (!canRegisterCouple()) {
      toast({
        title: "No se puede registrar",
        description: "Uno o ambos jugadores ya están inscritos en el torneo.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRegistering(true);
    try {
      const result = await registerCoupleForTournament({
        player1Id: selectedPlayers.player1.id,
        player2Id: selectedPlayers.player2.id,
        tournamentId
      });
      
      if (result.success) {
        toast({
          title: "Pareja inscrita",
          description: result.message || "La pareja ha sido inscrita exitosamente al torneo.",
          variant: "default"
        });
        
        // Limpiar selección
        setSelectedPlayers({
          player1: null,
          player2: null
        });
        
        // Actualizar UI
        onCoupleRegistered();
        
        // Refrescar datos después de un breve retraso
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        // Mostrar el error específico recibido del servidor
        toast({
          title: "Error de inscripción",
          description: result.error || "No se pudo inscribir la pareja. Intente nuevamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error registrando pareja:", error);
      toast({
        title: "Error de inscripción",
        description: "Ocurrió un error inesperado. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const renderPlayerCard = (player: PlayerWithStatus, playerKey: 'player1' | 'player2') => {
    const isChecking = isCheckingPlayer[playerKey];
    
    return (
      <div className={`p-4 border rounded-md ${player.isRegistered ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{player.first_name} {player.last_name}</p>
              {isChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
              {player.isRegistered && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </div>
            <p className="text-sm text-gray-500">
              {player.dni ? `DNI: ${player.dni}` : "Sin DNI registrado"}
            </p>
            {player.isRegistered && (
              <p className="text-sm text-red-600 font-medium mt-1">
                Ya inscrito {player.registrationType === 'individual' ? 'individualmente' : 'en una pareja'}
              </p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleRemovePlayer(playerKey)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Inscribir Parejas (Solo clubes)</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección Jugador 1 */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Jugador 1
            </h3>
            
            {selectedPlayers.player1 ? (
              renderPlayerCard(selectedPlayers.player1, 'player1')
            ) : (
              <PlayerSearch 
                onPlayerSelect={handleSelectPlayer1} 
                buttonLabel="Seleccionar"
                placeholder="Buscar jugador 1..."
              />
            )}
          </div>
          
          {/* Sección Jugador 2 */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Jugador 2
            </h3>
            
            {selectedPlayers.player2 ? (
              renderPlayerCard(selectedPlayers.player2, 'player2')
            ) : (
              <PlayerSearch 
                onPlayerSelect={handleSelectPlayer2} 
                buttonLabel="Seleccionar"
                placeholder="Buscar jugador 2..."
              />
            )}
          </div>
        </div>
        
        {/* Advertencia si hay jugadores ya inscritos */}
        {(selectedPlayers.player1?.isRegistered || selectedPlayers.player2?.isRegistered) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">No se puede inscribir esta pareja</p>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Uno o ambos jugadores ya están inscritos en el torneo. Seleccione jugadores diferentes.
            </p>
          </div>
        )}
        
        {/* Botón para inscribir la pareja */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleRegisterCouple}
            disabled={!canRegisterCouple() || isRegistering || isCheckingPlayer.player1 || isCheckingPlayer.player2}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inscribiendo pareja...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Inscribir Pareja
              </>
            )}
          </Button>
        </div>
        
        {/* Instrucciones */}
        <div className="text-sm text-muted-foreground mt-4 p-4 bg-gray-50 rounded-md">
          <p>Para inscribir una pareja, busque y seleccione ambos jugadores. Si los jugadores no existen en el sistema, primero deberá registrarlos individualmente desde la sección "Inscribir Jugadores".</p>
        </div>
      </CardContent>
    </Card>
  );
} 