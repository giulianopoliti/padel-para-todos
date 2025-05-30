"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Shield, Mail, KeyRound, AlertCircle } from 'lucide-react'

interface ClubSecuritySectionProps {
  userEmail?: string | null
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
      <Separator className="bg-slate-100" />

      {userEmail && (
        <div className="pt-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-100">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Label className="text-slate-700 font-medium">Email Registrado</Label>
              <p className="text-sm text-slate-700 font-medium mt-1">{userEmail}</p>
              <p className="text-xs text-slate-500 mt-1">
                Este es el email asociado a la cuenta de tu club. Para cambiarlo, contacta con soporte.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 space-y-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white w-8 h-8 rounded-lg flex items-center justify-center">
            <KeyRound className="h-4 w-4" />
          </div>
          <h4 className="text-lg font-medium text-slate-700">Cambiar Contraseña</h4>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-slate-700">Contraseña Actual</Label>
          <Input 
            id="currentPassword" 
            name="currentPassword" 
            type="password" 
            placeholder="••••••••" 
            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-slate-700">Nueva Contraseña</Label>
          <Input 
            id="newPassword" 
            name="newPassword" 
            type="password" 
            placeholder="••••••••" 
            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword" className="text-slate-700">Confirmar Nueva Contraseña</Label>
          <Input 
            id="confirmNewPassword" 
            name="confirmNewPassword" 
            type="password" 
            placeholder="••••••••"
            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/10" 
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Recomendaciones de seguridad</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                Usa contraseñas de al menos 8 caracteres
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                Incluye letras, números y símbolos
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                No uses información personal fácilmente identificable
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}