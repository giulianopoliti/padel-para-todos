"use client";

import { useUser } from "@/contexts/user-context";
import { useTournamentEditable } from "@/hooks/use-tournament-editable";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import TournamentFullLayout from "@/components/tournament/tournament-full-layout";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Database } from "@/database.types";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

interface TournamentData {
  id: string;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  clubes?: {
    name?: string;
  };
}

interface PlayerInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  score: number | null;
  dni?: string | null;
  phone?: string | null;
}

interface TournamentPageClientProps {
  tournamentId: string;
}

export default function TournamentPageClient({ tournamentId }: TournamentPageClientProps) {
  const [dbTournament, setDbTournament] = useState<Tournament | null>(null);
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [individualInscriptions, setIndividualInscriptions] = useState<PlayerInfo[]>([]);
  const [coupleInscriptions, setCoupleInscriptions] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [pendingInscriptions, setPendingInscriptions] = useState<any[]>([]);
  const isEditable = useTournamentEditable(dbTournament);

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        // Fetch tournament with club data
        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select(`
            *,
            clubes:club_id (
              name
            )
          `)
          .eq("id", tournamentId)
          .single();

        if (tournamentError) throw tournamentError;

        // Store raw tournament data for editable hook
        setDbTournament(tournamentData);

        // Transform data for the layout component
        setTournament({
          id: tournamentData.id,
          name: tournamentData.name || "",
          status: tournamentData.status || "NOT_STARTED",
          start_date: tournamentData.start_date,
          end_date: tournamentData.end_date,
          clubes: tournamentData.clubes,
        });

        // Fetch inscriptions
        type PlayerResponse = {
          player: {
            id: string;
            first_name: string | null;
            last_name: string | null;
            score: number | null;
            dni: string | null;
            phone: string | null;
          } | null;
        };

        const { data: inscriptions, error: inscriptionsError } = await supabase
          .from("inscriptions")
          .select(`
            player:player_id (
              id,
              first_name,
              last_name,
              score,
              dni,
              phone
            )
          `)
          .eq("tournament_id", tournamentId)
          .eq("is_pending", false);

        if (!inscriptionsError && inscriptions) {
          const players = (inscriptions as unknown as PlayerResponse[])
            .filter(i => i.player !== null)
            .map(i => i.player as NonNullable<PlayerResponse["player"]>);
          setIndividualInscriptions(players);
          setAllPlayers(players);
        }

        // TODO: Fetch couple inscriptions and pending inscriptions

      } catch (error) {
        console.error("Error fetching tournament data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournamentId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  const statusBadge = (
    <Badge variant="outline" className="text-xs">
      {tournament.status}
    </Badge>
  );

  const actionButtons = isEditable ? (
    <Link
      href={`/tournaments/my-tournaments/${tournament.id}`}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Settings size={16} />
      <span>Edit Tournament</span>
    </Link>
  ) : null;

  return (
    <TournamentFullLayout
      tournament={tournament}
      individualInscriptions={individualInscriptions}
      coupleInscriptions={coupleInscriptions}
      maxPlayers={32}
      allPlayers={allPlayers}
      pendingInscriptions={pendingInscriptions}
      statusBadge={statusBadge}
      actionButtons={actionButtons}
      isPublicView={!isEditable}
    />
  );
} 