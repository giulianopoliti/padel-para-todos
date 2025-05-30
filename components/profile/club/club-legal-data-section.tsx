"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Building, Mail, MapPin, Instagram } from 'lucide-react'

interface ClubLegalDataSectionProps {
  defaultValues?: {
    name?: string | null
    address?: string | null
    email?: string | null
    instagram?: string | null
  }
}

export function ClubLegalDataSection({ defaultValues }: ClubLegalDataSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-700">Información de Contacto y Legal</h3>
        <p className="text-sm text-slate-500 mb-6">Actualiza los datos principales de tu club.</p>
      </div>
      <Separator className="bg-slate-100" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-slate-700">
            <Building className="h-4 w-4 text-teal-600" /> Nombre del Club
          </Label>
          <Input 
            id="name" 
            name="name" 
            defaultValue={defaultValues?.name ?? ''} 
            placeholder="Nombre oficial del club" 
            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2 text-slate-700">
            <MapPin className="h-4 w-4 text-teal-600" /> Dirección
          </Label>
          <Input 
            id="address" 
            name="address" 
            defaultValue={defaultValues?.address ?? ''} 
            placeholder="Calle, Número, Ciudad" 
            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-slate-700">
            <Mail className="h-4 w-4 text-teal-600" /> Email de Contacto
          </Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            defaultValue={defaultValues?.email ?? ''} 
            placeholder="contacto@tuclub.com" 
            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2 text-slate-700">
            <Instagram className="h-4 w-4 text-teal-600" /> Instagram (opcional)
          </Label>
          <Input 
            id="instagram" 
            name="instagram" 
            defaultValue={defaultValues?.instagram ?? ''} 
            placeholder="@tuclubdeportivo" 
            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
          />
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Importante:</span> Asegúrate de que la información proporcionada sea correcta y actualizada para una mejor experiencia de los usuarios.
        </p>
      </div>
    </div>
  )
}