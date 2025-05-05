'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/user-context';
import { getClubTournaments } from './actions';
import { Tournament } from '@/types';

export default function MyTournamentsPage() {
  const router = useRouter();
  const { user, userDetails } = useUser();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTournaments() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const result = await getClubTournaments();
        
        if (result.success) {
          setTournaments(result.tournaments || []);
        } else {
          setError(result.message || "Error al cargar torneos");
        }
      } catch (error) {
        console.error("Error loading tournaments:", error);
        setError("Error inesperado al cargar torneos");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTournaments();
  }, [user]);

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Torneos</h1>
        <Button 
          onClick={() => router.push('/tournaments/create')}
          className="bg-green-600 hover:bg-green-700"
        >
          Crear Nuevo Torneo
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Cargando torneos...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="font-medium text-xl mb-2">No has creado torneos aún</h3>
              <p className="mb-4 text-gray-500">Comienza creando tu primer torneo</p>
              <Button 
                onClick={() => router.push('/tournaments/create')}
                className="bg-padel-green-600 hover:bg-padel-green-700"
              >
                Crear Torneo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id}>
              <CardHeader>
                <CardTitle>{tournament.name}</CardTitle>
                <CardDescription>
                  {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Tipo: {tournament.type}</span>
                  <span>Estado: {tournament.status}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/tournaments/${tournament.id}`)}
                >
                  Ver Detalles
                </Button>
                <Button 
                  onClick={() => router.push(`/tournaments/${tournament.id}/edit`)}
                >
                  Editar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 