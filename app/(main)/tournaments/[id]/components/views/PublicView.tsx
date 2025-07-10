"use client";

import React from 'react';
import { useTournament } from '../../providers/TournamentProvider';
import TournamentFullLayout from '@/components/tournament/tournament-full-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

/**
 * Vista pública para usuarios no autenticados
 * Implementa la estrategia de visualización sin permisos de edición
 */
const PublicView: React.FC = () => {
  const { 
    tournament, 
    individualInscriptions, 
    coupleInscriptions, 
    maxPlayers,
    allPlayers 
  } = useTournament();

  if (!tournament) return null;

  // Formatear datos del torneo para el layout
  const tournamentData = {
    id: tournament.id,
    name: tournament.name || '',
    status: tournament.status || 'NOT_STARTED',
    start_date: tournament.start_date || undefined,
    end_date: tournament.end_date || undefined,
    clubes: tournament.clubes ? {
      name: tournament.clubes.name || undefined,
      phone: tournament.clubes.phone || undefined,
      phone2: tournament.clubes.phone2 || undefined,
      address: tournament.clubes.address || undefined,
    } : undefined,
  };

  // Crear status badge
  const statusBadge = (
    <Badge variant="outline" className="text-xs">
      {getStatusText(tournament.status)}
    </Badge>
  );

  return (
    <TournamentFullLayout
      tournament={tournamentData}
      individualInscriptions={individualInscriptions}
      coupleInscriptions={coupleInscriptions}
      maxPlayers={maxPlayers}
      allPlayers={allPlayers}
      backUrl="/tournaments"
      backLabel="Volver a Torneos"
      statusBadge={statusBadge}
      isPublicView={true} // ← Clave: Vista de solo lectura
    />
  );
};

/**
 * Obtener texto del estado del torneo
 */
function getStatusText(status: string | null): string {
  switch (status) {
    case "NOT_STARTED":
      return "Próximamente";
    case "PAIRING":
      return "Emparejamiento";
    case "IN_PROGRESS":
      return "En curso";
    case "FINISHED":
      return "Finalizado";
    case "CANCELED":
      return "Cancelado";
    default:
      return status || "Desconocido";
  }
}

export default PublicView; 