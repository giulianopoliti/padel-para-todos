"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { searchPlayer, registerNewPlayer } from "@/app/api/players/actions";
import { useRouter } from "next/navigation";

// Definir tipos
interface PlayerInfo { 
  id: string; 
  first_name: string | null; 
  last_name: string | null;
}

interface ClubRegisterPlayerProps {
  tournamentId: string;
  isClubOwner: boolean;
  isTournamentActive: boolean;
  onPlayerRegistered: () => void;
}

export default function ClubRegisterPlayer({ 
  tournamentId, 
  isClubOwner, 
  isTournamentActive,
  onPlayerRegistered 
}: ClubRegisterPlayerProps) {
  // Estado para la búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estado para el nuevo jugador
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    first_name: "",
    last_name: "",
    gender: "MALE", // Valor por defecto
    dni: "" // Nuevo campo para DNI
  });

  const { toast } = useToast();
  const router = useRouter();

  // Si no es dueño del club o el torneo ya comenzó, no mostrar esta funcionalidad
  if (!isClubOwner || isTournamentActive) {
    return null;
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    console.log("Iniciando búsqueda de jugador:", searchTerm);
    setIsSearching(true);
    try {
      // Modificar para buscar también por DNI
      const results = await searchPlayer(searchTerm);
      console.log("Resultados de búsqueda:", results);
      setSearchResults(results);
      
      // Mostrar mensaje si no hay resultados
      if (results.length === 0) {
        toast({
          title: "Sin resultados",
          description: "No se encontraron jugadores con ese nombre, apellido o DNI.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error searching player:", error);
      toast({
        title: "Error de búsqueda",
        description: "No se pudo completar la búsqueda. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegisterExistingPlayer = async (playerId: string) => {
    setIsRegistering(true);
    try {
      await registerNewPlayer({
        playerId,
        tournamentId,
        isExistingPlayer: true
      });
      
      toast({
        title: "Jugador inscrito",
        description: "El jugador ha sido inscrito exitosamente al torneo.",
        variant: "default"
      });
      
      // Limpiar búsqueda
      setSearchTerm("");
      setSearchResults([]);
      
      // Actualizar la UI de múltiples formas para garantizar el refresco
      onPlayerRegistered(); // Callback para actualizar la lista de jugadores
      
      // Actualizar la UI usando el router (no navega, solo refresca)
      setTimeout(() => {
        router.refresh(); // Refrescar la ruta actual sin cambiar de página
      }, 500);
    } catch (error) {
      console.error("Error registering player:", error);
      toast({
        title: "Error de inscripción",
        description: "No se pudo inscribir al jugador. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPlayer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRadioChange = (value: string) => {
    setNewPlayer(prev => ({
      ...prev,
      gender: value
    }));
  };

  const handleSubmitNewPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlayer.first_name || !newPlayer.last_name || !newPlayer.dni) {
      toast({
        title: "Datos incompletos",
        description: "Por favor complete todos los campos requeridos, incluyendo DNI.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRegistering(true);
    try {
      await registerNewPlayer({
        playerData: newPlayer,
        tournamentId,
        isExistingPlayer: false
      });
      
      toast({
        title: "Jugador registrado",
        description: "El jugador ha sido registrado e inscrito exitosamente al torneo.",
        variant: "default"
      });
      
      // Limpiar formulario
      setNewPlayer({
        first_name: "",
        last_name: "",
        gender: "MALE",
        dni: ""
      });
      setShowForm(false);
      
      // Actualizar la UI de múltiples formas para garantizar el refresco
      onPlayerRegistered(); // Callback para actualizar la lista de jugadores
      
      // Actualizar la UI usando el router (no navega, solo refresca)
      setTimeout(() => {
        router.refresh(); // Refrescar la ruta actual sin cambiar de página
      }, 500);
    } catch (error) {
      console.error("Error registering new player:", error);
      toast({
        title: "Error de registro",
        description: "No se pudo registrar al nuevo jugador. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Inscribir Jugadores (Solo clubes)</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Buscar jugador por nombre, apellido o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setShowForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Jugador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Jugador</DialogTitle>
                <DialogDescription>
                  Complete la información del nuevo jugador para inscribirlo en el torneo.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmitNewPlayer} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={newPlayer.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={newPlayer.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    name="dni"
                    value={newPlayer.dni}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Género</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="male"
                        name="gender"
                        value="MALE"
                        checked={newPlayer.gender === "MALE"}
                        onChange={() => handleRadioChange("MALE")}
                        className="mr-2"
                      />
                      <Label htmlFor="male">Masculino</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="female"
                        name="gender"
                        value="FEMALE"
                        checked={newPlayer.gender === "FEMALE"}
                        onChange={() => handleRadioChange("FEMALE")}
                        className="mr-2"
                      />
                      <Label htmlFor="female">Femenino</Label>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isRegistering}
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar e Inscribir"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Resultados de búsqueda:</h3>
            <div className="space-y-2">
              {searchResults.map(player => (
                <div key={player.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium">{player.first_name} {player.last_name}</span>
                  </div>
                  <Button 
                    onClick={() => handleRegisterExistingPlayer(player.id)}
                    disabled={isRegistering}
                    size="sm"
                  >
                    {isRegistering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Inscribir"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {searchTerm && !isSearching && searchResults.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No se encontraron jugadores. Intente buscar con otro término o registre un nuevo jugador.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 