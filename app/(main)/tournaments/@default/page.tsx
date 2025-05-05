'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function DefaultTournamentsPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Descubre Torneos de Pádel</h2>
      
      <div className="bg-padel-green-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">¿Quieres participar o crear torneos?</h3>
        <p className="mb-4">Inicia sesión o regístrate para acceder a más funcionalidades:</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => router.push('/login')}
            className="flex-1"
          >
            Iniciar Sesión
          </Button>
          <Button 
            onClick={() => router.push('/register')}
            className="flex-1 bg-padel-green-600 hover:bg-padel-green-700"
          >
            Registrarse
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Como visitante, puedes ver los torneos disponibles, pero necesitas una cuenta para inscribirte o crear torneos.</p>
      </div>
    </div>
  );
} 