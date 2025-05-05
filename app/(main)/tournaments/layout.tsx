import React from 'react';
import { getUserRole } from '@/app/api/users';

export default async function TournamentsLayout({
  children,
  club,
  player,
  default: defaultContent,
}: {
  children: React.ReactNode;
  club: React.ReactNode;
  player: React.ReactNode;
  default: React.ReactNode;
}) {
  // Obtener el rol del usuario
  const userRole = await getUserRole();
  
  return (
    <div className="container py-6">
      {children}
      
      {/* Renderizar basado en el rol */}
      {userRole === 'CLUB' ? (
        <div>{club}</div>
      ) : userRole === 'PLAYER' ? (
        <div>{player}</div>
      ) : (
        <div>{defaultContent}</div>
      )}
    </div>
  );
} 