'use client';

import type { BaseMatch } from '@/types';
import MatchStatusBadge from './match-status-badge';
import MatchActionsMenu from './match-actions-menu';

type MatchStatus = BaseMatch['status'];

interface MatchActionsProps {
  match: {
    id: string;
    status: MatchStatus;
    court?: string;
  };
  isOwner: boolean;
  onUpdateMatch: (matchId: string, data: { status?: MatchStatus; court?: string }) => Promise<void>;
  onOpenResultDialog: () => void;
}

export default function MatchActions({ match, isOwner, onUpdateMatch, onOpenResultDialog }: MatchActionsProps) {
  // Para espectadores, solo mostrar el estado
  if (!isOwner) {
    return (
      <MatchStatusBadge 
        status={match.status} 
        court={match.court}
      />
    );
  }

  // Para el club propietario, mostrar solo el menú de acciones (sin duplicar el estado)
  return (
    <MatchActionsMenu
      matchId={match.id}
      status={match.status}
      court={match.court}
      onUpdateMatch={onUpdateMatch}
      isOwner={isOwner}
      onOpenResultDialog={onOpenResultDialog}
    />
  );
} 