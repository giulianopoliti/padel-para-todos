"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, CheckCircle, XCircle, Edit, Trophy } from "lucide-react";
import { Database } from "@/database.types";
import StartMatchDialog from "./start-match-dialog";

type MatchStatus = Database["public"]["Enums"]["match_status"];

interface MatchActionsMenuProps {
  matchId: string;
  status: MatchStatus;
  court?: string | null;
  matchInfo?: {
    couple1?: string;
    couple2?: string;
  };
  onUpdateMatch: (matchId: string, data: { status?: MatchStatus; court?: string }) => Promise<void>;
  isOwner: boolean;
  onOpenResultDialog: () => void;
}

export default function MatchActionsMenu({
  matchId,
  status,
  court,
  matchInfo,
  onUpdateMatch,
  isOwner,
  onOpenResultDialog
}: MatchActionsMenuProps) {
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  // Si no es propietario, no mostrar el menú
  if (!isOwner) {
    return null;
  }

  const handleStartMatch = async (courtNumber: string) => {
    await onUpdateMatch(matchId, {
      status: "IN_PROGRESS",
      court: courtNumber
    });
  };

  const handleFinishMatch = async () => {
    await onUpdateMatch(matchId, {
      status: "FINISHED"
    });
  };

  const handleCancelMatch = async () => {
    await onUpdateMatch(matchId, {
      status: "CANCELED"
    });
  };

  const handleEditCourt = async () => {
    // Para simplificar, vamos a usar un prompt por ahora
    // En una implementación más completa, se podría usar un dialog
    const newCourt = prompt("Ingresa el nuevo número de cancha:", court || "");
    if (newCourt !== null && newCourt.trim() !== "") {
      await onUpdateMatch(matchId, {
        court: newCourt.trim()
      });
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (status) {
      case "PENDING":
        actions.push(
          {
            label: "Iniciar Partido",
            icon: Play,
            onClick: () => setStartDialogOpen(true),
            className: "text-blue-600 hover:text-blue-700"
          },
          {
            label: "Cancelar Partido",
            icon: XCircle,
            onClick: handleCancelMatch,
            className: "text-red-600 hover:text-red-700"
          }
        );
        break;

      case "IN_PROGRESS":
        actions.push(
          {
            label: "Cargar Resultado",
            icon: Trophy,
            onClick: onOpenResultDialog,
            className: "text-emerald-600 hover:text-emerald-700"
          },
          {
            label: "Finalizar Partido",
            icon: CheckCircle,
            onClick: handleFinishMatch,
            className: "text-green-600 hover:text-green-700"
          },
          {
            label: "Cambiar Cancha",
            icon: Edit,
            onClick: handleEditCourt,
            className: "text-blue-600 hover:text-blue-700"
          }
        );
        break;

      case "FINISHED":
        actions.push(
          {
            label: "Editar Resultado",
            icon: Edit,
            onClick: onOpenResultDialog,
            className: "text-emerald-600 hover:text-emerald-700"
          },
          {
            label: "Reactivar Partido",
            icon: Play,
            onClick: () => onUpdateMatch(matchId, { status: "IN_PROGRESS" }),
            className: "text-blue-600 hover:text-blue-700"
          }
        );
        break;

      case "CANCELED":
        actions.push(
          {
            label: "Reactivar Partido",
            icon: Play,
            onClick: () => onUpdateMatch(matchId, { status: "PENDING" }),
            className: "text-blue-600 hover:text-blue-700"
          }
        );
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action, index) => (
            <div key={action.label}>
              <DropdownMenuItem
                onClick={action.onClick}
                className={`cursor-pointer ${action.className}`}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
              {index < actions.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <StartMatchDialog
        isOpen={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        onConfirm={handleStartMatch}
        matchInfo={matchInfo}
      />
    </>
  );
} 