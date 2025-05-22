import React from 'react';
import { getUserRole } from '@/app/api/users'; // o tu método para obtener el rol

interface TournamentIdLayoutProps {
  default: React.ReactNode; // Corrected from defaultSlot
  player: React.ReactNode;
  club: React.ReactNode;
  coach: React.ReactNode;
}

export default async function TournamentIdLayout({
  default: defaultSlot, // Aliasing to defaultSlot for internal use, prop is 'default'
  player,
  club,
  coach,
}: TournamentIdLayoutProps) {
  const userRole = await getUserRole();
  console.log('[TournamentIdLayout] User Role:', userRole);

  let content;
  switch (userRole) {
    case 'PLAYER':
      content = player;
      break;
    case 'CLUB':
      content = club;
      break;
    case 'COACH':
      content = coach;
      break;
    default:
      content = defaultSlot;
      break;
  }

  return <>{content}</>;
} 