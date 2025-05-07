'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { Plus, ListChecks, ChevronRight, BarChart3 } from 'lucide-react';

export default function ClubTournamentsPage() {
  const router = useRouter();
  const { userDetails } = useUser();
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-light text-teal-700 mb-6">Panel de Club</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <Plus className="mr-2 h-5 w-5 text-teal-600" />
              Crear Torneo
            </CardTitle>
            <CardDescription>Organiza un nuevo torneo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">Configura todos los detalles: fechas, categorías, precios y formato.</p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button 
              onClick={() => router.push('/tournaments/create')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
            >
              Crear Torneo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <ListChecks className="mr-2 h-5 w-5 text-teal-600" />
              Mis Torneos
            </CardTitle>
            <CardDescription>Administra tus torneos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">Gestiona inscripciones, actualiza resultados y supervisa el progreso.</p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button 
              onClick={() => router.push('/tournaments/my-tournaments')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
            >
              Ver Mis Torneos
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-teal-600" />
              Estadísticas
            </CardTitle>
            <CardDescription>Analiza el rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">Visualiza datos sobre participación, ingresos y satisfacción.</p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button 
              onClick={() => router.push('/tournaments/stats')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-teal-700 hover:text-teal-800 border border-slate-200 rounded-full font-normal"
              variant="outline"
            >
              Ver Estadísticas
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 