"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Database } from '@/database.types';
import { getTournamentDetailsWithInscriptions } from '@/app/api/tournaments/actions';
import { getAllPlayersDTO } from '@/app/api/players/actions';
import { usePermissions } from '../components/permissions/usePermissions';
import type { TournamentAccess } from '../components/permissions/types';

// Types
type Tournament = Database["public"]["Tables"]["tournaments"]["Row"] & {
  clubes?: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    cover_image_url: string | null;
  };
};

interface PlayerInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  score: number | null;
  dni?: string | null;
  phone?: string | null;
}

interface CoupleInfo {
  id: string;
  tournament_id: string;
  player_1_id: string;
  player_2_id: string;
  created_at: string;
  player_1_info: PlayerInfo | null;
  player_2_info: PlayerInfo | null;
}

interface TournamentContextValue {
  // Estado básico
  loading: boolean;
  error: string | null;
  
  // Datos del torneo
  tournament: Tournament | null;
  access: TournamentAccess;
  
  // Inscripciones
  individualInscriptions: PlayerInfo[];
  coupleInscriptions: CoupleInfo[];
  pendingInscriptions: any[];
  
  // Metadatos
  allPlayers: PlayerInfo[];
  maxPlayers: number;
  
  // Acciones
  refreshData: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue | undefined>(undefined);

interface TournamentProviderProps {
  children: React.ReactNode;
  tournamentId: string;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ 
  children, 
  tournamentId 
}) => {
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [individualInscriptions, setIndividualInscriptions] = useState<PlayerInfo[]>([]);
  const [coupleInscriptions, setCoupleInscriptions] = useState<CoupleInfo[]>([]);
  const [pendingInscriptions, setPendingInscriptions] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);

  // Permisos basados en el torneo actual
  const access = usePermissions(tournament);

  // Función para cargar datos
  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos del torneo con inscripciones
      const { tournament: tournamentData, inscriptions } = await getTournamentDetailsWithInscriptions(tournamentId);
      
      if (!tournamentData) {
        notFound();
        return;
      }

      setTournament(tournamentData);

      // Procesar inscripciones individuales
      const individuals = inscriptions
        .filter((inscription: any) => inscription.player_id && !inscription.couple_id)
        .map((inscription: any) => {
          if (inscription.player && inscription.player.length > 0) {
            return inscription.player[0];
          }
          return {
            id: inscription.player_id,
            first_name: null,
            last_name: null,
            score: null,
            dni: null,
            phone: null,
          };
        });

      setIndividualInscriptions(individuals);

      // Procesar inscripciones de parejas
      const couples = inscriptions
        .filter((inscription: any) => inscription.couple_id)
        .map((inscription: any) => {
          if (inscription.couple && inscription.couple.length > 0) {
            const couple = inscription.couple[0];
            return {
              id: couple.id,
              tournament_id: tournamentId,
              player_1_id: couple.player1_id,
              player_2_id: couple.player2_id,
              created_at: couple.created_at || new Date().toISOString(),
              player_1_info: couple.player1 && couple.player1.length > 0 ? couple.player1[0] : null,
              player_2_info: couple.player2 && couple.player2.length > 0 ? couple.player2[0] : null,
            };
          }
          return {
            id: inscription.couple_id,
            tournament_id: tournamentId,
            player_1_id: null,
            player_2_id: null,
            created_at: inscription.created_at || new Date().toISOString(),
            player_1_info: null,
            player_2_info: null,
          };
        });

      setCoupleInscriptions(couples);

      // Procesar inscripciones pendientes
      const pending = inscriptions
        .filter((inscription: any) => inscription.is_pending)
        .map((inscription: any) => ({
          id: inscription.id,
          couple_id: inscription.couple_id,
          created_at: inscription.created_at,
          couple: inscription.couple && inscription.couple.length > 0 ? inscription.couple[0] : null,
        }));

      setPendingInscriptions(pending);

      // Obtener todos los jugadores para búsquedas
      const allPlayersData = await getAllPlayersDTO();
      setAllPlayers(allPlayersData);

    } catch (err) {
      console.error('Error fetching tournament data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  // Configurar max players (puede venir del torneo en el futuro)
  const maxPlayers = tournament?.max_participants || 32;

  const value: TournamentContextValue = {
    loading,
    error,
    tournament,
    access,
    individualInscriptions,
    coupleInscriptions,
    pendingInscriptions,
    allPlayers,
    maxPlayers,
    refreshData: fetchTournamentData,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

/**
 * Hook para usar el contexto del torneo
 */
export const useTournament = (): TournamentContextValue => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}; 