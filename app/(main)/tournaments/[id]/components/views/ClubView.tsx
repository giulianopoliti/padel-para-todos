"use client";

import React from 'react';
import { useTournament } from '../../providers/TournamentProvider';
import TournamentFullLayout from '@/components/tournament/tournament-full-layout';
import { Badge } from '@/components/ui/badge';
import StartTournamentButton from '@/components/tournament/club/start-tournament';
import CancelTournamentButton from '@/components/tournament/club/cancel-tournament';
import WinnerImageSection from '@/components/tournament/winner-image-section';
import PreTournamentImageSection from '@/components/tournament/pre-tournament-image-section';

/**
 * Vista para clubes propietarios del torneo
 * Incluye todos los permisos de gestión y administración
 */
const ClubView: React.FC = () => {
  const { 
    tournament, 
    individualInscriptions, 
    coupleInscriptions, 
    pendingInscriptions,
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

  // Status badge con estilos específicos para club
  const statusBadge = (
    <Badge 
      variant={getStatusVariant(tournament.status)} 
      className="text-sm px-3 py-1"
    >
      {getStatusText(tournament.status)}
    </Badge>
  );

  // Transformar tournament para los botones
  const tournamentForButtons = tournament as any;

  // Action buttons específicos para gestión del club
  const actionButtons = (
    <>
      {tournament.status === "NOT_STARTED" && (
        <>
          <StartTournamentButton 
            tournamentId={tournament.id}
            tournament={tournamentForButtons}
            couplesCount={coupleInscriptions.length}
            playersCount={individualInscriptions.length}
          />
          <CancelTournamentButton
            tournamentId={tournament.id}
            tournament={tournamentForButtons}
            couplesCount={coupleInscriptions.length}
            playersCount={individualInscriptions.length}
          />
        </>
      )}
      {(tournament.status === "IN_PROGRESS" || tournament.status === "PAIRING") && (
        <CancelTournamentButton
          tournamentId={tournament.id}
          tournament={tournamentForButtons}
          couplesCount={coupleInscriptions.length}
          playersCount={individualInscriptions.length}
        />
      )}
    </>
  );

  return (
    <>
      <TournamentFullLayout
        tournament={tournamentData}
        individualInscriptions={individualInscriptions}
        coupleInscriptions={coupleInscriptions}
        pendingInscriptions={pendingInscriptions} // ← Solo clubes ven inscripciones pendientes
        maxPlayers={maxPlayers}
        allPlayers={allPlayers}
        backUrl="/tournaments"
        backLabel="Volver a Torneos"
        statusBadge={statusBadge}
        actionButtons={actionButtons}
        isPublicView={false} // ← Vista completa de gestión
      />

      {/* Secciones adicionales para gestión del club */}
      {tournament.status === "NOT_STARTED" && (
        <div className="mt-6">
          <PreTournamentImageSection
            tournament={tournament}
            tournamentId={tournament.id}
            clubCoverImageUrl={tournament.clubes?.cover_image_url}
          />
        </div>
      )}
      
      {tournament.status === "FINISHED" && (
        <div className="mt-6">
          <WinnerImageSection
            tournament={tournament}
            tournamentId={tournament.id}
          />
        </div>
      )}
    </>
  );
};

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

function getStatusVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "NOT_STARTED":
      return "outline";
    case "PAIRING":
      return "secondary";
    case "IN_PROGRESS":
      return "default";
    case "FINISHED":
      return "secondary";
    case "CANCELED":
      return "destructive";
    default:
      return "outline";
  }
}

export default ClubView; 