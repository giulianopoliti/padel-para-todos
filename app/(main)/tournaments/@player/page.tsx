import React from 'react';
import { ClipboardList, Search, Trophy, ChevronRight, UserCircle } from 'lucide-react';
import TournamentsClient from '../tournaments-client';
import { getTournaments, getCategories } from '@/app/api/tournaments';

export default async function PlayerTournamentsPage() {
  const tournaments = await getTournaments();
  const categories = await getCategories();
  
  return (
    <TournamentsClient initialTournaments={tournaments} initialCategories={categories} />
  );
} 