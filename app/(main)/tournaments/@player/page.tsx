'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';

export default function PlayerTournamentsPage() {
  const router = useRouter();
  const { userDetails } = useUser();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Mis Torneos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Torneos Inscritos</CardTitle>
            <CardDescription>
              Visualiza los torneos en los que estás participando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Revisa información sobre tus próximos partidos, horarios y resultados.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push('/tournaments/my-inscriptions')}
              className="w-full"
            >
              Ver Mis Inscripciones
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Buscar Torneos</CardTitle>
            <CardDescription>
              Encuentra torneos para inscribirte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Explora torneos disponibles, filtra por fecha, ubicación o categoría.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push('/tournaments')}
              className="w-full bg-padel-green-600 hover:bg-padel-green-700"
            >
              Explorar Torneos
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 