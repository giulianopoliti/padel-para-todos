import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Users } from "lucide-react";

// Usar la misma definición de PlayerInfo que se usa en el componente del torneo
interface PlayerInfo { 
  id: string; 
  first_name: string | null; 
  last_name: string | null;
  dni?: string | null; // Agregar campo de DNI como opcional para compatibilidad
}

interface RegisteredPlayersProps {
  singlePlayers: PlayerInfo[];
  isLoading?: boolean;
}

export default function RegisteredPlayers({ singlePlayers, isLoading = false }: RegisteredPlayersProps) {
  console.log("RegisteredPlayers render with", { singlePlayers, count: singlePlayers?.length });
  
  return (
    <Card className="border-slate-100 shadow-sm hover:border-teal-100 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <div className="bg-teal-50 w-8 h-8 rounded-full flex items-center justify-center mr-3 border border-teal-100">
            <Users className="h-4 w-4 text-teal-600" />
          </div>
          <CardTitle className="text-lg font-medium text-teal-700">Jugadores Inscritos ({singlePlayers?.length || 0})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-slate-500">
            <div className="animate-pulse flex justify-center">
              <div className="h-2 w-24 bg-slate-200 rounded"></div>
            </div>
            <div className="mt-2">Cargando jugadores...</div>
          </div>
        ) : !singlePlayers || singlePlayers.length === 0 ? (
          <Alert className="bg-teal-50 text-teal-700 border border-teal-100">
            <AlertTitle className="font-medium">No hay jugadores inscritos</AlertTitle>
            <AlertDescription className="text-teal-600 text-sm mt-1">
              Aún no hay jugadores inscritos en este torneo. Si eres jugador, puedes inscribirte usando el botón en la parte superior.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-slate-500 font-medium">#</TableHead>
                  <TableHead className="text-slate-500 font-medium">Nombre</TableHead>
                  <TableHead className="text-slate-500 font-medium">Apellido</TableHead>
                  <TableHead className="text-slate-500 font-medium">DNI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {singlePlayers.map((player, index) => (
                  <TableRow key={player.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <TableCell className="text-slate-700">{index + 1}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{player.first_name || '—'}</TableCell>
                    <TableCell className="text-slate-700">{player.last_name || '—'}</TableCell>
                    <TableCell className="text-slate-700">{player.dni || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-xs text-slate-500">
              Total: {singlePlayers.length} jugador(es) inscrito(s)
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 