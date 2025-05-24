"use client"

import React from 'react'
import { User, Shield, Trophy } from 'lucide-react'

interface ProfileSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  {
    id: 'personal',
    title: 'Datos Personales',
    icon: User,
  },
  {
    id: 'game',
    title: 'Datos de Juego',
    icon: Trophy,
  },
  {
    id: 'security',
    title: 'Seguridad',
    icon: Shield,
  },
]

export function ProfileSidebar({ activeSection, onSectionChange }: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-slate-500 mb-2">
          Configuración
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