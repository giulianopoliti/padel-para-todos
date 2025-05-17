"use client"
import { startTournament2 } from "@/app/api/tournaments/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Play } from "lucide-react";
import React from "react";

export default function StartTournamentButton({ tournamentId }: { tournamentId: string }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();
  
    const handleStartTournament = async () => {
      if (!confirm("¿Estás seguro de que deseas iniciar este torneo? Una vez iniciado, no se podrán agregar más inscripciones.")) {
        return;
      }
  
      setIsLoading(true);
      try {
        const result = await startTournament2(tournamentId);
        if (result.success) {
          toast({
            title: "Torneo iniciado",
            description: "El torneo ha sido iniciado con éxito"
          });
          window.location.reload();
        } else {
          toast({
            title: "Error",
            description: "No se pudo iniciar el torneo",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error al iniciar torneo:", error);
        toast({
          title: "Error",
          description: "Ocurrió un error al iniciar el torneo",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <Button
        onClick={handleStartTournament}
        disabled={isLoading}
        className="mr-3 bg-emerald-200 text-emerald-700 border border-emerald-200 hover:bg-emerald-400 hover:text-white hover:border-emerald-400"
      >
        <Play className="mr-2 h-4 w-4" />
        {isLoading ? "Iniciando..." : "Iniciar Torneo"}
      </Button>
    );
  }