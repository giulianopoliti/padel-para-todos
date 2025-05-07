"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { searchPlayer } from "@/app/api/players/actions";

// Definir tipos
export interface PlayerInfo { 
  id: string; 
  first_name: string | null; 
  last_name: string | null;
  dni?: string | null;
}

interface PlayerSearchProps {
  onPlayerSelect: (player: PlayerInfo) => void;
  buttonLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function PlayerSearch({ 
  onPlayerSelect,
  buttonLabel = "Seleccionar",
  placeholder = "Buscar jugador por nombre, apellido o DNI...",
  disabled = false
}: PlayerSearchProps) {
  // Estado para la búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim() || disabled) return;
    
    console.log("Iniciando búsqueda de jugador:", searchTerm);
    setIsSearching(true);
    try {
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

  const handleSelectPlayer = (player: PlayerInfo) => {
    onPlayerSelect(player);
    // Limpiar búsqueda después de seleccionar
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex-1 relative">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          disabled={disabled}
        />
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim() || disabled}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
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
                  {player.dni && (
                    <span className="text-xs text-gray-500 ml-2">DNI: {player.dni}</span>
                  )}
                </div>
                <Button 
                  onClick={() => handleSelectPlayer(player)}
                  size="sm"
                  disabled={disabled}
                >
                  {buttonLabel}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {searchTerm && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No se encontraron jugadores. Intente buscar con otro término.
        </div>
      )}
    </div>
  );
} 