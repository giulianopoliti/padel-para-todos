import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { User } from 'lucide-react'

interface PersonalDataSectionProps {
  defaultValues: any
}

export function PersonalDataSection({ defaultValues }: PersonalDataSectionProps) {
  return (
    <Card className="shadow-md border-0 rounded-xl overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">
              Datos Personales
            </CardTitle>
            <p className="text-white/90 text-sm">
              Información básica de tu perfil
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8 bg-white">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-slate-700 font-medium">Nombre</Label>
              <Input 
                id="first_name" 
                name="first_name" 
                defaultValue={defaultValues.first_name} 
                required 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-slate-700 font-medium">Apellido</Label>
              <Input 
                id="last_name" 
                name="last_name" 
                defaultValue={defaultValues.last_name} 
                required 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni" className="text-slate-700 font-medium">DNI</Label>
              <Input 
                id="dni" 
                name="dni" 
                defaultValue={defaultValues.dni} 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 font-medium">Teléfono</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                defaultValue={defaultValues.phone} 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="text-slate-700 font-medium">Fecha de Nacimiento</Label>
            <Input 
              id="date_of_birth" 
              name="date_of_birth" 
              type="date" 
              defaultValue={defaultValues.date_of_birth} 
              className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-slate-700 font-medium">Género (No se puede cambiar)</Label>
            <RadioGroup name="gender" defaultValue={defaultValues.gender} className="flex flex-col space-y-2" disabled>
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <RadioGroupItem value="MALE" id="gender-male" className="text-teal-600 border-slate-300" disabled />
                <Label htmlFor="gender-male" className="text-slate-600">Masculino</Label>
              </div>
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <RadioGroupItem value="FEMALE" id="gender-female" className="text-teal-600 border-slate-300" disabled />
                <Label htmlFor="gender-female" className="text-slate-600">Femenino</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}