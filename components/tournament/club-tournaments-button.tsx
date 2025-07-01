'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClubTournamentsButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push('/tournaments/my-tournaments')}
      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl shadow-sm"
    >
      <Trophy className="mr-2 h-5 w-5" />
      Ir a Mis Torneos
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );
} 