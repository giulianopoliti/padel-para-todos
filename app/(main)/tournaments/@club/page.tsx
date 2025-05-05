'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';

export default function ClubTournamentsPage() {
  const router = useRouter();
  const { userDetails } = useUser();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Panel de Club</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Crear Torneo</CardTitle>
            <CardDescription>
              Crea un nuevo torneo para tu club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Configure todos los detalles del torneo, incluyendo tipo, fechas, formato y más.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push('/tournaments/create')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Crear Nuevo Torneo
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Mis Torneos</CardTitle>
            <CardDescription>
              Administra tus torneos creados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Gestiona los torneos de tu club, visualiza inscripciones, actualiza resultados.</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push('/tournaments/my-tournaments')}
              className="w-full"
            >
              Ver Mis Torneos
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 