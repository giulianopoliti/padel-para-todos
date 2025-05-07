'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, UserPlus, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DefaultTournamentsPage() {
  const router = useRouter();
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-light text-teal-700 mb-6">Descubre Torneos de Pádel</h2>
      
      <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-teal-600" />
            ¿Quieres participar o crear torneos?
          </CardTitle>
          <CardDescription>Inicia sesión o regístrate para acceder a más funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            Como visitante, puedes ver los torneos disponibles, pero necesitas una cuenta para inscribirte o crear torneos.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 bg-slate-50 border-t border-slate-100 p-4">
          <Button 
            onClick={() => router.push('/login')}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-normal"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Button>
          <Button 
            onClick={() => router.push('/register')}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-teal-700 hover:text-teal-800 border border-slate-200 rounded-full font-normal"
            variant="outline"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Registrarse
          </Button>
        </CardFooter>
      </Card>
      
      <p className="text-sm text-slate-500 text-center">
        Explora todos los torneos disponibles como visitante. ¡Regístrate para vivir la experiencia completa!
      </p>
    </div>
  );
} 
