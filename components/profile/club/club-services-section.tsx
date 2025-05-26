"use client"

import React from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface Service {
  id: string // Assuming service ID is a string (e.g., UUID)
  name: string
}

interface ClubServicesSectionProps {
  allServices: Service[] // All available services from the database
  clubServices: string[] // Array of service IDs that the club currently offers
  defaultValues?: { // To maintain consistency with other sections if needed, though services are handled differently
    // any other non-service related default values for this section
  }
}

export function ClubServicesSection({ allServices, clubServices, defaultValues }: ClubServicesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-700">Servicios del Club</h3>
        <p className="text-sm text-slate-500 mb-6">Selecciona los servicios que ofrece tu club.</p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4">
        {allServices.map((service) => (
          <div key={service.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`service-${service.id}`}
              name="services" // Use the same name for all checkboxes in a group
              value={service.id} // The value sent on form submission
              defaultChecked={clubServices.includes(service.id)}
              className="h-5 w-5 border-slate-300 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white dark:border-slate-700 dark:data-[state=checked]:bg-teal-500 dark:data-[state=checked]:text-slate-900"
            />
            <Label htmlFor={`service-${service.id}`} className="font-normal text-slate-700">
              {service.name}
            </Label>
          </div>
        ))}
      </div>
      {allServices.length === 0 && (
        <p className="text-sm text-slate-500">No hay servicios disponibles para seleccionar. Contacta al administrador.</p>
      )}
    </div>
  )
} 