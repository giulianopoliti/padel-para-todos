import React from 'react';
import { getUserRole } from '@/app/api/users';
import { getTournaments, getCategories } from '@/app/api/tournaments';
import TournamentsClient from './tournaments-client';
import ClubTournamentsButton from '@/components/tournament/club-tournaments-button';
import { Tournament } from '@/types';

// This page will handle the parallel routes logic
export default async function TournamentsPage() {
  const [tournamentsData, categories, userRole] = await Promise.all([
    getTournaments(),
    getCategories(),
    getUserRole()
  ]);


  // Serialize and transform tournaments data
  const tournaments = tournamentsData.map((t: any) => ({
    ...t,
    time: t.time || undefined, // Convert null to undefined
    club: t.club ? {
      id: t.club.id,
      name: t.club.name,
      image: t.club.image
    } : null,
    createdAt: t.createdAt?.toISOString?.() || t.createdAt,
    startDate: t.startDate?.toISOString?.() || t.startDate,
    endDate: t.endDate?.toISOString?.() || t.endDate,
  })) as Tournament[];

  // Apply the same logic that was in the layout
  if (userRole === 'CLUB') {
    return (
      <>
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-end">
            <ClubTournamentsButton />
          </div>
        </div>
      </div>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <TournamentsClient initialTournaments={tournaments} initialCategories={categories} />
        </div>
      </div>
      </>
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