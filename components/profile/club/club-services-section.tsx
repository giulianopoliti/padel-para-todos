"use client"

import React from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface Service {
  id: string
  name: string
}

interface ClubServicesSectionProps {
  allServices: Service[]
  clubServices: string[]
  defaultValues?: {}
}

export function ClubServicesSection({ allServices, clubServices, defaultValues }: ClubServicesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-700">Servicios del Club</h3>
        <p className="text-sm text-slate-500 mb-6">Selecciona los servicios que ofrece tu club.</p>
      </div>
      <Separator className="bg-slate-100" />

      <div className="pt-4">
        {allServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-2">
            {allServices.map((service) => (
              <div 
                key={service.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                  clubServices.includes(service.id) 
                    ? 'bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <Checkbox 
                  id={`service-${service.id}`}
                  name="services"
                  value={service.id}
                  defaultChecked={clubServices.includes(service.id)}
                  className={`h-5 w-5 rounded-md ${
                    clubServices.includes(service.id)
                      ? 'border-teal-400 data-[state=checked]:bg-gradient-to-r from-teal-600 to-blue-600'
                      : 'border-slate-300'
                  }`}
                />
                <Label 
                  htmlFor={`service-${service.id}`} 
                  className={`font-medium ${
                    clubServices.includes(service.id) ? 'text-teal-800' : 'text-slate-700'
                  }`}
                >
                  {service.name}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
            <p className="text-slate-500">No hay servicios disponibles para seleccionar. Contacta al administrador.</p>
          </div>
        )}
      </div>

      <div className="mt-2 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Consejo:</span> Los servicios ayudan a los usuarios a encontrar clubes que se adapten a sus necesidades específicas.
        </p>
      </div>
    </div>
  )
}