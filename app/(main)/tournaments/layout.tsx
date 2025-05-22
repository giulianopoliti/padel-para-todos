import React from 'react';
import { getUserRole } from '@/app/api/users'; // o tu método para obtener el rol

export default async function TournamentsLayout({
  children,
  player,
  club,
  coach,
}: {
  children: React.ReactNode;
  player: React.ReactNode;
  club: React.ReactNode;
  coach: React.ReactNode;
}) {
  const userRole = await getUserRole();

  return (
    <div className="container py-6">
      {children}
      {userRole === 'PLAYER' && player}
      {userRole === 'CLUB' && club}
      {userRole === 'COACH' && coach}
    </div>
  );
} 