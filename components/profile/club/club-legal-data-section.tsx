"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface ClubLegalDataSectionProps {
  defaultValues?: {
    name?: string | null
    address?: string | null
    email?: string | null // Assuming club has an email field in its table or user table
    instagram?: string | null
    // Add other legal data fields as needed
  }
}

export function ClubLegalDataSection({ defaultValues }: ClubLegalDataSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-700">Información de Contacto y Legal</h3>
        <p className="text-sm text-slate-500 mb-6">Actualiza los datos principales de tu club.</p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Club</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name ?? ''} placeholder="Nombre oficial del club" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" defaultValue={defaultValues?.address ?? ''} placeholder="Calle, Número, Ciudad" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email de Contacto</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ''} placeholder="contacto@tuclub.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram (opcional)</Label>
          <Input id="instagram" name="instagram" defaultValue={defaultValues?.instagram ?? ''} placeholder="@tuclubdeportivo" />
        </div>
        {/* Add more fields here, e.g., phone, CUIT/CIF, etc. */}
      </div>
    </div>
  )
} 