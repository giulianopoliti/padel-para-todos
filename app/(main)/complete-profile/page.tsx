'use client'

import React, { useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { completeUserProfile, FormState } from '@/app/(main)/complete-profile/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';

const initialState: FormState = {
  message: '',
  errors: null,
  success: false,
};

// Define role options
const roles = [
  { id: 'PLAYER', label: 'Jugador' },
  { id: 'CLUB', label: 'Club' },
  { id: 'COACH', label: 'Entrenador' },
];

// Submit Button component using useFormStatus
function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full mt-6" disabled={disabled || pending}>
      {pending ? 'Guardando...' : 'Guardar Perfil'}
    </Button>
  );
}

export default function CompleteProfilePage() {
  const [state, formAction] = useFormState(completeUserProfile, initialState);
  const { user } = useUser();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Redirect if profile completion succeeds
  React.useEffect(() => {
    if (state.success) {
      alert(state.message || 'Perfil completado con éxito'); 
      router.push('/home');
    }
  }, [state.success, state.message, router]);

  if (!user) {
    return <div>Cargando usuario...</div>; 
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completa tu Perfil</CardTitle>
          <CardDescription>Elige tu rol principal y completa los datos necesarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Selecciona tu Rol</Label>
                 <RadioGroup 
                    name="role"
                    required 
                    onValueChange={setSelectedRole}
                    value={selectedRole ?? undefined}
                    className="flex flex-col space-y-1"
                  >
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={role.id} id={`role-${role.id}`} />
                        <Label htmlFor={`role-${role.id}`}>{role.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                {state.errors?.role && <p className="text-red-500 text-xs mt-1">{state.errors.role.join(', ')}</p>}
              </div>

              {/* --- Conditional Fields based on Role --- */}
              {selectedRole === 'PLAYER' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input id="first_name" name="first_name" required />
                    {state.errors?.first_name && <p className="text-red-500 text-xs mt-1">{state.errors.first_name.join(', ')}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input id="last_name" name="last_name" required />
                     {state.errors?.last_name && <p className="text-red-500 text-xs mt-1">{state.errors.last_name.join(', ')}</p>}
                 </div>
                </>
              )}

              {selectedRole === 'CLUB' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="club_name">Nombre del Club</Label>
                    <Input id="club_name" name="club_name" required />
                     {state.errors?.club_name && <p className="text-red-500 text-xs mt-1">{state.errors.club_name.join(', ')}</p>}
                 </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" name="address" required />
                    {state.errors?.address && <p className="text-red-500 text-xs mt-1">{state.errors.address.join(', ')}</p>}
                  </div>
                </>
              )}
              
              {selectedRole === 'COACH' && (
                 <>
                   <div className="space-y-2">
                     <Label htmlFor="first_name">Nombre</Label>
                     <Input id="first_name" name="first_name" required />
                     {state.errors?.first_name && <p className="text-red-500 text-xs mt-1">{state.errors.first_name.join(', ')}</p>}
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="last_name">Apellido</Label>
                     <Input id="last_name" name="last_name" required />
                     {state.errors?.last_name && <p className="text-red-500 text-xs mt-1">{state.errors.last_name.join(', ')}</p>}
                   </div>
                 </>
               )}
              
              {/* --- End Conditional Fields --- */}

            </div>
            
            {state.errors?.general && <p className="text-red-500 text-sm mt-4">{state.errors.general.join(', ')}</p>}
            {state.message && !state.success && !state.errors && <p className="text-red-500 text-sm mt-4">{state.message}</p>}
            
            <SubmitButton disabled={!selectedRole} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
