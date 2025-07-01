import { useUser } from "@/contexts/user-context";
import { Database } from "@/database.types";

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

export const useTournamentEditable = (tournament?: Tournament | null) => {
  const { user, userDetails } = useUser();

  if (!tournament || !user || !userDetails) {
    return false;
  }

  const isClub = userDetails.role === "CLUB";
  const isOwner = tournament.club_id === userDetails.club_id;

  return isClub && isOwner;
}; 