import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Usar la misma definición de PlayerInfo que se usa en el componente del torneo
interface PlayerInfo { 
  id: string; 
  first_name: string | null; 
  last_name: string | null;
}

interface RegisteredPlayersProps {
  singlePlayers: PlayerInfo[];
  isLoading?: boolean;
}

export default function RegisteredPlayers({ singlePlayers, isLoading = false }: RegisteredPlayersProps) {
  console.log("RegisteredPlayers render with", { singlePlayers, count: singlePlayers?.length });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Jugadores Inscritos ({singlePlayers?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">Cargando jugadores...</div>
        ) : !singlePlayers || singlePlayers.length === 0 ? (
          <Alert>
            <AlertTitle>No hay jugadores inscritos</AlertTitle>
            <AlertDescription>
              Aún no hay jugadores inscritos en este torneo. Si eres jugador, puedes inscribirte usando el botón en la parte superior.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {singlePlayers.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{player.first_name || '—'}</TableCell>
                    <TableCell>{player.last_name || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-xs text-muted-foreground">
              Total: {singlePlayers.length} jugador(es) inscrito(s)
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 