"use client"

import React from 'react'
import { Building, Shield, ListChecks, ImageIcon } from 'lucide-react' // Using Building for legal, ListChecks for services, ImageIcon for gallery

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
        <h2 className="text-sm font-medium text-slate-500 mb-2">
          Configuración del Club
        </h2>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeSection === item.id 
                  ? 'text-teal-700 bg-gradient-to-r from-teal-50 to-blue-50' 
                  : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
} 