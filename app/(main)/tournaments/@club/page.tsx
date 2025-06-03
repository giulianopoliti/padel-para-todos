'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowRight } from 'lucide-react';
import { getTournaments, getCategories } from '@/app/api/tournaments';
import TournamentsClient from '../tournaments-client';
import { useEffect, useState } from 'react';

interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  category: string
  type?: string
  maxParticipants?: number
  currentParticipants?: number
  address?: string
  time?: string
  prize?: string
  description?: string
  price?: number | null
  club?: {
    id: string
    name: string
    image?: string
  }
}

interface Category {
  name: string
  lower_range: number
  upper_range: number
}

export default function ClubTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsData, categoriesData] = await Promise.all([
          getTournaments(),
          getCategories()
        ]);
        setTournaments(tournamentsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with button */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-end">
            <Button
              onClick={() => router.push('/my-tournaments')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl shadow-sm"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Ir a Mis Torneos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main tournaments content */}
      <TournamentsClient initialTournaments={tournaments} initialCategories={categories} />
    </div>
  );
} 