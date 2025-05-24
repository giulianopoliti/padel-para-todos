import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy } from 'lucide-react'

interface GameDataSectionProps {
  defaultValues: any
  allClubs: any[]
}

export function GameDataSection({ defaultValues, allClubs }: GameDataSectionProps) {
  return (
    <Card className="shadow-md border-0 rounded-xl overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">
              Datos de Juego
            </CardTitle>
            <p className="text-white/90 text-sm">
              Información sobre tu juego y preferencias
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8 bg-white">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="club_id" className="text-slate-700 font-medium">Club</Label>
            <div className="bg-white rounded-xl">
              <Select name="club_id" defaultValue={defaultValues.club_id}>
                <SelectTrigger className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700">
                  <SelectValue placeholder="Selecciona un club" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl">
                  <SelectItem value="NO_CLUB" className="text-slate-700 hover:bg-teal-50">Sin club</SelectItem>
                  {allClubs.map(club => (
                    <SelectItem key={club.id} value={club.id} className="text-slate-700 hover:bg-teal-50">
                      {club.name || 'Club sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-slate-700 font-medium">Lado Preferido</Label>
            <RadioGroup name="preferred_side" defaultValue={defaultValues.preferred_side} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors">
                <RadioGroupItem value="DRIVE" id="side-drive" className="text-teal-600 border-slate-300" />
                <Label htmlFor="side-drive" className="text-slate-700">Drive</Label>
              </div>
              <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors">
                <RadioGroupItem value="REVES" id="side-reves" className="text-teal-600 border-slate-300" />
                <Label htmlFor="side-reves" className="text-slate-700">Revés</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="racket" className="text-slate-700 font-medium">Paleta</Label>
            <Input 
              id="racket" 
              name="racket" 
              defaultValue={defaultValues.racket} 
              className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_name" className="text-slate-700 font-medium">Categoría</Label>
              <Input 
                id="category_name" 
                name="category_name" 
                defaultValue={defaultValues.category_name} 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="score" className="text-slate-700 font-medium">Puntaje</Label>
              <Input 
                id="score" 
                name="score" 
                type="number" 
                step="0.01"
                defaultValue={defaultValues.score} 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}