import React from 'react';
import { getUserRole } from '@/app/api/users';
import { getTournaments, getCategories } from '@/app/api/tournaments';
import TournamentsClient from './tournaments-client';
import ClubTournamentsPage from './@club/page';

// This page will handle the parallel routes logic
export default async function TournamentsPage() {
  const [tournaments, categories, userRole] = await Promise.all([
    getTournaments(),
    getCategories(),
    getUserRole()
  ]);

  // Apply the same logic that was in the layout
  if (userRole === 'CLUB') {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <ClubTournamentsPage />
        </div>
      </div>
    );
  }
  
  // For other roles (PLAYER, COACH, or default), show the regular tournaments page
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <TournamentsClient initialTournaments={tournaments} initialCategories={categories} />
      </div>
    </div>
  );
} 