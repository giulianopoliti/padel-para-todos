// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/app/(login)/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import Navbar from '@/components/navbar'

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [role, setRole] = useState<'PLAYER' | 'CLUB' | 'COACH'>('PLAYER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 2

  // Use a debounce to prevent hammering the server
  useEffect(() => {
    if (isSubmitting && retryCount > 0) {
      const timer = setTimeout(() => {
        setIsSubmitting(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isSubmitting, retryCount])

  async function handleLogin(formData: FormData) {
    try {
      setError(null)
      setIsSubmitting(true)
      formData.append('role', role)
      
      console.log("Submitting login form with role:", role);

      if (retryCount >= MAX_RETRIES) {
        toast({
          title: 'Demasiados intentos',
          description: 'Por favor, intenta de nuevo más tarde.',
          variant: 'destructive',
        })
        setError('Demasiados intentos. Por favor, intenta de nuevo más tarde.')
        setIsSubmitting(false)
        return
      }

      const result = await login(formData)
      
      if (result?.error) {
        console.error("Login error from server:", result.error);
        toast({
          title: 'Error de acceso',
          description: result.error,
          variant: 'destructive',
        })
        setError(result.error)
        setRetryCount(prev => prev + 1)
      } else if (result?.success) {
        // Handle client-side redirection on success
        toast({
          title: 'Acceso exitoso',
          description: 'Redirigiendo al panel de control...',
        })
        router.push('/dashboard')
      }
    } catch (e) {
      // This will catch network errors
      console.error("Login network error:", e);
      const errorMessage = typeof e === 'object' && e !== null && 'message' in e 
        ? `Error de conexión: ${(e as Error).message}`
        : "Error de conexión. Por favor intenta de nuevo más tarde.";
      
      toast({
        title: 'Error de red',
        description: errorMessage,
        variant: 'destructive',
      })
      setError(errorMessage)
      setRetryCount(prev => prev + 1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-padel-green-50">
      
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-padel-green-700">
              Acceso para {role === 'PLAYER' ? 'Jugadores' : role === 'CLUB' ? 'Clubes' : 'Entrenadores'}
            </CardTitle>
            <CardDescription className="text-center">
              Ingresa a tu cuenta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
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
                variant={role === 'PLAYER' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setRole('PLAYER')}
                className={role === 'PLAYER' ? 'bg-padel-green-600 hover:bg-padel-green-700' : ''}
              >
                Jugador
              </Button>
              <Button
                variant={role === 'COACH' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRole('COACH')}
                className={role === 'COACH' ? 'bg-padel-green-600 hover:bg-padel-green-700' : ''}
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