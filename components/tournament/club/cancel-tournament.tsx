"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Ban, Calendar, MapPin, Users, Building, Clock } from "lucide-react";
import { cancelTournament } from "@/app/api/tournaments/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  type: string;
  gender: string;
  max_participants?: number;
  clubes?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  categories?: {
    name?: string;
  };
}

interface CancelTournamentButtonProps {
  tournamentId: string;
  tournament: Tournament;
  couplesCount: number;
  playersCount: number;
}

function formatDate(dateString?: string) {
  if (!dateString) return "Fecha no especificada";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", { 
    day: "numeric", 
    month: "long", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function CancelTournamentButton({
  tournamentId,
  tournament,
  couplesCount,
  playersCount,
}: CancelTournamentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCancelTournament = async () => {
    setIsLoading(true);
    
    try {
      const result = await cancelTournament(tournamentId);
      
      if (result.success) {
        toast.success("Torneo cancelado exitosamente");
        setIsModalOpen(false);
        router.refresh(); // Refresh the page to show updated status
      }
    } catch (error: any) {
      console.error("Error canceling tournament:", error);
      toast.error(error.message || "Error al cancelar el torneo");
    } finally {
      setIsLoading(false);
    }
  };

  const totalParticipants = playersCount + (couplesCount * 2);

  return (
    <>
      <Button
        variant="destructive"
        size="lg"
        onClick={() => setIsModalOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg"
      >
        <Ban className="h-5 w-5 mr-2" />
        Cancelar Torneo
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              Cancelar Torneo
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium text-center">
                ¿Estás seguro de que quieres cancelar este torneo?
              </p>
              <p className="text-red-600 text-sm text-center mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Tournament Information */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Tournament Name and Club */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tournament.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>{tournament.clubes?.name || "Club no especificado"}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Fechas del torneo</p>
                      <p className="text-gray-600 text-sm">
                        Inicio: {formatDate(tournament.start_date)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        Fin: {formatDate(tournament.end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Ubicación</p>
                      <p className="text-gray-600 text-sm">
                        {tournament.clubes?.address || "Dirección no especificada"}
                      </p>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Participantes inscritos</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• {playersCount} jugadores individuales</p>
                        <p>• {couplesCount} parejas ({couplesCount * 2} jugadores)</p>
                        <p className="font-medium">Total: {totalParticipants} participantes</p>
                      </div>
                    </div>
                  </div>

                  {/* Tournament Type and Category */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Detalles del torneo</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• Categoría: {tournament.categories?.name || "No especificada"}</p>
                        <p>• Tipo: {tournament.type === "AMERICAN" ? "Torneo Americano" : "Eliminación Directa"}</p>
                        <p>• Género: {tournament.gender}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTournament}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cancelando...
                </div>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Aceptar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 