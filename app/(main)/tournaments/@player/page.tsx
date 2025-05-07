'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { ClipboardList, Search, Trophy, ChevronRight, UserCircle } from 'lucide-react';

export default function PlayerTournamentsPage() {
  const router = useRouter();
  const { userDetails } = useUser();
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-light text-teal-700 mb-6">Panel de Jugador</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <ClipboardList className="mr-2 h-5 w-5 text-teal-600" />
              Mis Inscripciones
            </CardTitle>
            <CardDescription>Torneos en los que participas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">Revisa tus próximos partidos, horarios y resultados obtenidos.</p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button 
              onClick={() => router.push('/tournaments/my-inscriptions')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
            >
              Ver Mis Inscripciones
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <Search className="mr-2 h-5 w-5 text-teal-600" />
              Buscar Torneos
            </CardTitle>
            <CardDescription>Encuentra nuevos torneos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">Explora torneos disponibles, filtra por fecha, ubicación o categoría.</p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button 
              onClick={() => router.push('/tournaments')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
            >
              Explorar Torneos
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-teal-600" />
              Mi Historial
            </CardTitle>
            <CardDescription>Revisa tu trayectoria</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">Visualiza tu historial de partidos, victorias y estadísticas personales.</p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button 
              onClick={() => router.push('/profile/stats')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-teal-700 hover:text-teal-800 border border-slate-200 rounded-full font-normal"
              variant="outline"
            >
              Ver Historial
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 