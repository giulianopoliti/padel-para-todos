// app/login/page.tsx
'use client'

import { useState } from 'react'
import { login } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import Navbar from '@/components/navbar'

export default function LoginPage() {
  const { toast } = useToast()
  const [role, setRole] = useState<'JUGADOR' | 'CLUB' | 'ENTRENADOR'>('JUGADOR')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin(formData: FormData) {
    setIsSubmitting(true)
    formData.append('role', role)
    
    const result = await login(formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-padel-green-50">
      <Navbar />
      
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-padel-green-700">
              Acceso para {role === 'JUGADOR' ? 'Jugadores' : role === 'CLUB' ? 'Clubes' : 'Entrenadores'}
            </CardTitle>
            <CardDescription className="text-center">
              Ingresa a tu cuenta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-padel-green-600 hover:bg-padel-green-700" disabled={isSubmitting}>
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
              <div className="text-center">
                <Link
                  href="/register"
                  className="text-sm font-medium text-padel-green-600 hover:underline"
                >
                  ¿No tienes una cuenta? Regístrate
                </Link>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">Selecciona tu tipo de usuario:</div>
            <div className="flex justify-center space-x-2">
              <Button 
                variant={role === 'CLUB' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setRole('CLUB')}
                className={role === 'CLUB' ? 'bg-padel-green-600 hover:bg-padel-green-700' : ''}
              >
                Club
              </Button>
              <Button 
                variant={role === 'JUGADOR' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setRole('JUGADOR')}
                className={role === 'JUGADOR' ? 'bg-padel-green-600 hover:bg-padel-green-700' : ''}
              >
                Jugador
              </Button>
              <Button
                variant={role === 'ENTRENADOR' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRole('ENTRENADOR')}
                className={role === 'ENTRENADOR' ? 'bg-padel-green-600 hover:bg-padel-green-700' : ''}
              >
                Entrenador
              </Button>
            </div>
            <div className="text-center">
              <Link href="/" className="text-sm text-padel-green-600 hover:underline">
                Volver al inicio
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}