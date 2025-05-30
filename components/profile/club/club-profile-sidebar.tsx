"use client"

import React from 'react'
import { Building, Shield, ListChecks, ImageIcon } from 'lucide-react'

interface ClubProfileSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  {
    id: 'legal',
    title: 'Datos Legales',
    icon: Building,
  },
  {
    id: 'services',
    title: 'Servicios',
    icon: ListChecks,
  },
  {
    id: 'gallery',
    title: 'Galería de Imágenes',
    icon: ImageIcon,
  },
  {
    id: 'security',
    title: 'Seguridad',
    icon: Shield,
  },
]

export function ClubProfileSidebar({ activeSection, onSectionChange }: ClubProfileSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-slate-500 mb-3">
          Configuración del Club
        </h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${activeSection === item.id 
                  ? 'text-white bg-gradient-to-r from-teal-600 to-blue-600 shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <item.icon className={`h-4 w-4 ${activeSection === item.id ? 'text-white' : 'text-slate-500'}`} />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}