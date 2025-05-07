"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { registerCoupleForTournament } from "@/app/api/couples/actions";
import { useRouter } from "next/navigation";
import PlayerSearch, { PlayerInfo } from "./player-search";

interface ClubRegisterCoupleProps {
  tournamentId: string;
  isClubOwner: boolean;
  isTournamentActive: boolean;
  onCoupleRegistered: () => void;
}

export default function ClubRegisterCouple({ 
  tournamentId, 
  isClubOwner, 
  isTournamentActive,
  onCoupleRegistered 
}: ClubRegisterCoupleProps) {
  // Estado para jugadores seleccionados
  const [selectedPlayers, setSelectedPlayers] = useState<{
    player1: PlayerInfo | null;
    player2: PlayerInfo | null;
  }>({
    player1: null,
    player2: null
  });
  
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Si no es dueño del club o el torneo ya comenzó, no mostrar esta funcionalidad
  if (!isClubOwner || isTournamentActive) {
    return null;
  }

  const handleSelectPlayer1 = (player: PlayerInfo) => {
    // Evitar seleccionar el mismo jugador dos veces
    if (selectedPlayers.player2 && selectedPlayers.player2.id === player.id) {
      toast({
        title: "Error de selección",
        description: "Este jugador ya está seleccionado como Jugador 2.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPlayers(prev => ({
      ...prev,
      player1: player
    }));
  };

  const handleSelectPlayer2 = (player: PlayerInfo) => {
    // Evitar seleccionar el mismo jugador dos veces
    if (selectedPlayers.player1 && selectedPlayers.player1.id === player.id) {
      toast({
        title: "Error de selección",
        description: "Este jugador ya está seleccionado como Jugador 1.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPlayers(prev => ({
      ...prev,
      player2: player
    }));
  };

  const handleRemovePlayer = (playerKey: 'player1' | 'player2') => {
    setSelectedPlayers(prev => ({
      ...prev,
      [playerKey]: null
    }));
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
    
    setIsRegistering(true);
    try {
      await registerCoupleForTournament({
        player1Id: selectedPlayers.player1.id,
        player2Id: selectedPlayers.player2.id,
        tournamentId
      });
      
      toast({
        title: "Pareja inscrita",
        description: "La pareja ha sido inscrita exitosamente al torneo.",
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
    } catch (error) {
      console.error("Error registrando pareja:", error);
      toast({
        title: "Error de inscripción",
        description: "No se pudo inscribir la pareja. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
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
              <div className="p-4 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedPlayers.player1.first_name} {selectedPlayers.player1.last_name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedPlayers.player1.dni ? `DNI: ${selectedPlayers.player1.dni}` : "Sin DNI registrado"}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemovePlayer('player1')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
              <div className="p-4 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedPlayers.player2.first_name} {selectedPlayers.player2.last_name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedPlayers.player2.dni ? `DNI: ${selectedPlayers.player2.dni}` : "Sin DNI registrado"}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemovePlayer('player2')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <PlayerSearch 
                onPlayerSelect={handleSelectPlayer2} 
                buttonLabel="Seleccionar"
                placeholder="Buscar jugador 2..."
              />
            )}
          </div>
        </div>
        
        {/* Botón para inscribir la pareja */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleRegisterCouple}
            disabled={!selectedPlayers.player1 || !selectedPlayers.player2 || isRegistering}
            className="bg-green-600 hover:bg-green-700"
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