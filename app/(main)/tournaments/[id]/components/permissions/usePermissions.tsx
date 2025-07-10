import { useMemo } from 'react';
import { useUser } from '@/contexts/user-context';
import { useTournamentEditable } from '@/hooks/use-tournament-editable';
import { Database } from '@/database.types';
import type { 
  UserRole, 
  TournamentAccess, 
  TournamentPermission 
} from './types';

type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];

/**
 * Hook centralizado para gestionar permisos de torneos
 * Implementa la lógica de acceso basada en roles y ownership
 */
export const usePermissions = (tournament: Tournament | null) => {
  const { user, userDetails } = useUser();
  const isEditable = useTournamentEditable(tournament);

  return useMemo((): TournamentAccess => {
    // Usuario no autenticado = GUEST
    if (!user || !userDetails) {
      return {
        role: 'GUEST',
        isOwner: false,
        isParticipant: false,
        permissions: ['view_public']
      };
    }

    const role = userDetails.role as UserRole;
    const isOwner = isEditable; // Ya tiene la lógica de ownership
    
    // TODO: Implementar lógica para verificar si es participante
    const isParticipant = false; // Por ahora false, después implementar

    // Definir permisos por rol
    const permissions: TournamentPermission[] = [];

    // Permisos base para todos los usuarios autenticados
    permissions.push('view_public');

    // Permisos específicos por rol
    switch (role) {
      case 'PLAYER':
        permissions.push('register_individual', 'register_couple');
        break;
        
      case 'CLUB':
        if (isOwner) {
          permissions.push(
            'manage_tournament',
            'update_results', 
            'manage_inscriptions',
            'upload_images',
            'start_tournament',
            'cancel_tournament'
          );
        }
        break;
        
      case 'COACH':
        permissions.push('register_individual', 'register_couple');
        // Los coaches pueden registrar jugadores
        break;
        
      case 'ADMIN':
        permissions.push(
          'manage_tournament',
          'update_results',
          'manage_inscriptions', 
          'upload_images',
          'start_tournament',
          'cancel_tournament'
        );
        break;
    }

    return {
      role,
      isOwner,
      isParticipant,
      permissions
    };
  }, [user, userDetails, isEditable, tournament]);
};

/**
 * Hook para verificar permisos específicos
 */
export const useHasPermission = (
  tournament: Tournament | null,
  permission: TournamentPermission
): boolean => {
  const access = usePermissions(tournament);
  return access.permissions.includes(permission);
};

/**
 * Hook para verificar múltiples permisos
 */
export const useHasAnyPermission = (
  tournament: Tournament | null,
  permissions: TournamentPermission[]
): boolean => {
  const access = usePermissions(tournament);
  return permissions.some(permission => 
    access.permissions.includes(permission)
  );
}; 