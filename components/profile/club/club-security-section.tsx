"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
// import { Button } from '@/components/ui/button' // If you have a separate action for password change

interface ClubSecuritySectionProps {
  userEmail?: string | null // To display the email if needed
}

export function ClubSecuritySection({ userEmail }: ClubSecuritySectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-700">Seguridad de la Cuenta</h3>
        <p className="text-sm text-slate-500 mb-6">
          Administra la configuración de seguridad de tu club.
        </p>
      </div>
      <Separator />

      {userEmail && (
        <div className="pt-4">
          <Label>Email Registrado</Label>
          <p className="text-sm text-slate-600 py-2">{userEmail}</p>
          <p className="text-xs text-slate-500">
            Este es el email asociado a la cuenta de tu club. Para cambiarlo, contacta con soporte.
          </p>
        </div>
      )}

      <div className="pt-4 space-y-4">
        <h4 className="text-md font-medium text-slate-700">Cambiar Contraseña</h4>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Contraseña Actual</Label>
          <Input id="currentPassword" name="currentPassword" type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva Contraseña</Label>
          <Input id="newPassword" name="newPassword" type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</Label>
          <Input id="confirmNewPassword" name="confirmNewPassword" type="password" placeholder="••••••••" />
        </div>
        {/* 
          If password change is a separate action, you might have a button here.
          Otherwise, these fields will be part of the main form handled by completeClubProfile.
          <Button variant="outline" className="mt-2">Actualizar Contraseña</Button> 
        */}
      </div>
    </div>
  )
} 