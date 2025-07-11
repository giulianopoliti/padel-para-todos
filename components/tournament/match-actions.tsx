'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, Save, X, CircleOff } from 'lucide-react';
import type { BaseMatch } from '@/types';

type MatchStatus = BaseMatch['status'];

interface MatchActionsProps {
  match: {
    id: string;
    status: MatchStatus;
    court?: string;
  };
  isOwner: boolean;
  onUpdateMatch: (matchId: string, data: { status?: MatchStatus; court?: string }) => Promise<void>;
}

export default function MatchActions({ match, isOwner, onUpdateMatch }: MatchActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [court, setCourt] = useState(match.court || '');
  const [status, setStatus] = useState<MatchStatus>(match.status);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOwner) {
    return (
      <div className="flex items-center gap-2">
        {match.court && (
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <CircleOff className="h-4 w-4" />
            <span>{match.court}</span>
          </div>
        )}
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            match.status === "PENDING"
              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
              : match.status === "IN_PROGRESS"
                ? "bg-teal-50 text-teal-700 border border-teal-200"
                : match.status === "COMPLETED"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : match.status === "CANCELED"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          {match.status === "PENDING"
            ? "Programado"
            : match.status === "IN_PROGRESS"
              ? "En curso"
              : match.status === "COMPLETED"
                ? "Completado"
                : match.status === "CANCELED"
                  ? "Cancelado"
                  : match.status}
        </span>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onUpdateMatch(match.id, {
        status,
        court: court.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={court}
          onChange={(e) => setCourt(e.target.value)}
          placeholder="Pista"
          className="w-24 h-8 text-sm"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as MatchStatus)}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Programado</SelectItem>
            <SelectItem value="IN_PROGRESS">En curso</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="CANCELED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCourt(match.court || '');
            setStatus(match.status);
            setIsEditing(false);
          }}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {match.court && (
        <div className="flex items-center gap-1 text-sm text-slate-600">
          <CircleOff className="h-4 w-4" />
          <span>{match.court}</span>
        </div>
      )}
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          match.status === "PENDING"
            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
            : match.status === "IN_PROGRESS"
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : match.status === "COMPLETED"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : match.status === "CANCELED"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
        }`}
      >
        {match.status === "PENDING"
          ? "Programado"
          : match.status === "IN_PROGRESS"
            ? "En curso"
            : match.status === "COMPLETED"
              ? "Completado"
              : match.status === "CANCELED"
                ? "Cancelado"
                : match.status}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-8 px-2 ml-2"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
} 