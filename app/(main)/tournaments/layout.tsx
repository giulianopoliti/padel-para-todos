import React from 'react';
// import { getUserRole } from '@/app/api/users'; // No longer needed here

export default async function TournamentsLayout({
  children,
  // Los siguientes props de slots ya no se usarán directamente en este layout
  // club,
  // player,
  // coach,
  // default: defaultContent,
}: {
  children: React.ReactNode;
  // club: React.ReactNode; // Tipo removido
  // player: React.ReactNode; // Tipo removido
  // coach: React.ReactNode; // Tipo removido
  // default: React.ReactNode; // Tipo removido
}) {
  // const userRole = await getUserRole(); // Ya no se determina el rol aquí para estos slots
  
  return (
    <div className="container py-6">
      {children} 
      {/* La lógica de mostrar contenido basado en roles para la lista general de torneos
          o para un torneo específico se manejará dentro de sus respectivas páginas/layouts.
          Este layout padre ya no inyectará los paneles de @club, @player, etc., de forma global.
       */}
    </div>
  );
} 