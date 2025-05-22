import React from 'react';
// We might not need all these icons directly here if TournamentsClient handles them,
// but keeping them for now to match the player page structure.
import { ClipboardList, Search, Trophy, ChevronRight, UserCircle } from 'lucide-react';
import TournamentsClient from './tournaments-client'; // Adjusted path
import { getTournaments, getCategories } from '@/app/api/tournaments';

// This page will now be an async server component to fetch data
export default async function TournamentsPage() {
  const tournaments = await getTournaments();
  const categories = await getCategories();
  
  // Render the same client component used by players
  return (
    <TournamentsClient initialTournaments={tournaments} initialCategories={categories} />
  );
} 