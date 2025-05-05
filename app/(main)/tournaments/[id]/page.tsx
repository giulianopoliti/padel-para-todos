import { createClient } from '@/utils/supabase/server'
import TournamentDetailsClient from './tournament-details-client'
import type { Tournament, Match, Category, Couple } from '@/types'

// Define el tipo para las props, incluyendo params
type TournamentDetailsPageProps = {
  params: { id: string };
};

// Asegúrate de que la función acepte las props con params
export default async function TournamentDetailsPage({ params }: TournamentDetailsPageProps) {
  // Accede a id a través de params.id
  const tournamentId = params.id;
  console.log(` Server   Fetching data for tournament ID: ${tournamentId}`);

  if (!tournamentId) {
    // Considera mostrar un error o redirigir si no hay ID
    return <div>Error: ID de torneo no proporcionado.</div>;
  }

  const supabase = await createClient();

  // Fetch tournament details
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  // Fetch category details (assuming a relation or separate query needed)
  // Placeholder: Adjust query based on your actual schema
  const categoryId = tournamentData?.category; // Example: get category_id from tournament
  let categoryData: Category | null = null;
  if (categoryId) {
      const { data: catData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', categoryId)
          .single();
      if (categoryError) console.error(" Server   Error fetching category:", categoryError);
      else categoryData = catData as Category;
  }

  // Fetch matches
  const { data: matchesData, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId);
  console.log(' Server  matchesData', matchesData)

    // Fetch couples (adjust based on your schema - how are couples linked to tournament?)
    // Example: Assuming couples register *for* a tournament via an inscription table
    const { data: inscriptionsData, error: inscriptionsError } = await supabase
        .from('inscriptions')
        .select(`
            couples (*)
        `)
        .eq('tournament_id', tournamentId)

    let couplesData: Couple[] = [];
    if (inscriptionsData && !inscriptionsError) {
        // Extract unique couples from inscriptions
        const coupleMap = new Map<string, Couple>();
        inscriptionsData.forEach(inscription => {
            // Ensure 'couples' is not null and has an id
            if (inscription.couples && typeof inscription.couples === 'object' && inscription.couples.id) {
                 coupleMap.set(inscription.couples.id, inscription.couples as Couple);
            }
        });
        couplesData = Array.from(coupleMap.values());
    } else if (inscriptionsError) {
        console.error(" Server   Error fetching inscriptions/couples:", inscriptionsError);
    }

  // Handle potential errors during data fetching
  if (tournamentError) {
    console.error(" Server   Error fetching tournament:", tournamentError);
    // Decide how to handle error: show error message, redirect, etc.
    return <div>Error al cargar el torneo.</div>;
  }
    if (matchesError) {
        console.error(" Server   Error fetching matches:", matchesError);
        // Potentially return an error or default matches
    }


  return (
    <TournamentDetailsClient
      initialTournament={tournamentData as Tournament | null}
      initialCategory={categoryData}
      initialMatches={(matchesData as Match[]) || []}
      initialCouples={couplesData || []}
    />
  );
}

