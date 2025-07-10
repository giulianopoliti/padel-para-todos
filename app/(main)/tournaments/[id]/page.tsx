import React from 'react';
import { TournamentProvider } from './providers/TournamentProvider';
import TournamentView from './components/TournamentView';

interface TournamentPageProps {
  params: { id: string };
}

/**
 * 🎯 PUNTO DE ENTRADA ÚNICO PARA TODOS LOS TORNEOS
 * 
 * Esta página reemplaza toda la duplicación anterior y maneja:
 * - Vista pública para usuarios no autenticados
 * - Vista de jugador para PLAYER rol
 * - Vista de gestión para CLUB propietarios
 * - Vista de entrenador para COACH rol
 * - Vista de administrador para ADMIN rol
 * 
 * Implementa los patrones:
 * - Provider Pattern: TournamentProvider centraliza estado
 * - Strategy Pattern: TournamentView decide qué vista mostrar
 * - Composition Pattern: Componentes reutilizables compartidos
 */
export default async function TournamentPage({ params }: TournamentPageProps) {
  const resolvedParams = await params;
  const tournamentId = resolvedParams.id;

  return (
    <TournamentProvider tournamentId={tournamentId}>
      <TournamentView />
    </TournamentProvider>
  );
} 