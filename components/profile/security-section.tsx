import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, Mail, KeyRound } from 'lucide-react'

interface SecuritySectionProps {
  userEmail?: string
}

export function SecuritySection({ userEmail = "usuario@ejemplo.com" }: SecuritySectionProps) {
  return (
    <Card className="shadow-md border-0 rounded-xl overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">
              Seguridad
            </CardTitle>
            <p className="text-white/90 text-sm">
              Configuración de seguridad de tu cuenta
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8 bg-white">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-teal-600" />
                Correo Electrónico
              </div>
            </Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              defaultValue={userEmail} 
              readOnly 
              className="bg-slate-50 border-slate-200 rounded-xl text-slate-600"
            />
            <p className="text-sm text-slate-500">Tu correo electrónico no se puede cambiar desde aquí.</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">
              <div className="flex items-center">
                <KeyRound className="h-4 w-4 mr-2 text-teal-600" />
                Contraseña
              </div>
            </Label>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 rounded-xl bg-white" 
              onClick={() => alert('Funcionalidad de cambio de contraseña pendiente.')}
            >
              Cambiar Contraseña
            </Button>
            <p className="text-sm text-slate-500">Haz clic para cambiar tu contraseña actual.</p>
          </div>
          
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 mt-6">
            <h3 className="text-blue-800 font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Información de Seguridad
            </h3>
            <p className="text-blue-700 text-sm mt-2">
              Mantén tu cuenta segura utilizando una contraseña fuerte y cambiándola periódicamente.
              Nunca compartas tus credenciales de acceso con otros usuarios.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}