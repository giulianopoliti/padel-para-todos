"use client";

import { Badge } from "@/components/ui/badge";
import { Database } from "@/database.types";
import { Clock, Play, CheckCircle, XCircle } from "lucide-react";

type MatchStatus = Database["public"]["Enums"]["match_status"];

interface MatchStatusBadgeProps {
  status: MatchStatus;
  court?: string | null;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: "Pendiente",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-gray-100 text-gray-700 border-gray-300"
  },
  IN_PROGRESS: {
    label: "En Curso",
    variant: "default" as const,
    icon: Play,
    className: "bg-blue-100 text-blue-700 border-blue-300"
  },
  FINISHED: {
    label: "Finalizado",
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 border-green-300"
  },
  CANCELED: {
    label: "Cancelado",
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-300"
  }
};

export default function MatchStatusBadge({ 
  status, 
  court, 
  className = "" 
}: MatchStatusBadgeProps) {
  console.log('MatchStatusBadge props:', { status, court });
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1 text-xs font-medium`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
} 