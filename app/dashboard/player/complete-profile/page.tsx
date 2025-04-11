// app/dashboard/player/complete-profile/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/utils/supabase/client'

export default function CompleteProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  async function handleProfileCompletion(formData: FormData) {
    setIsSubmitting(true)

    try {
      // 1. Obtener datos del usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener información del usuario. Por favor, inicia sesión nuevamente.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // 2. Obtener datos del formulario
      const nombre = formData.get('nombre') as string
      const apellido = formData.get('apellido') as string
      const telefono = formData.get('telefono') as string
      const fechaNacimiento = formData.get('fechaNacimiento') as string

      // 3. Crear registro en la tabla players
      const { error: playerError } = await supabase.from('players').insert([
        {
          user_id: user.id,
          nombre,
          apellido,
          telefono,
          fecha_nacimiento: fechaNacimiento,
        }
      ])

      if (playerError) {
        toast({
          title: 'Error',
          description: `Error al guardar el perfil: ${playerError.message}`,
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // 4. Actualizar el estado de registro en la tabla users (opcional)
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error al actualizar estado de perfil:', updateError)
      }

      // Mostrar mensaje de éxito y redirigir
      toast({
        title: 'Perfil completado',
        description: 'Tu perfil ha sido completado exitosamente.'
      })

      // Redirigir al dashboard del jugador
      setTimeout(() => {
        router.push('/dashboard/player')
      }, 1500)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-padel-green-50">
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-padel-green-700">
                Completa tu perfil
              </CardTitle>
              <CardDescription className="text-center">
                Necesitamos algunos datos adicionales para completar tu registro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleProfileCompletion} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    type="text"
                    required
                    placeholder="Tu apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    required
                    placeholder="Tu número de teléfono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                  <Input
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    type="date"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-padel-green-600 hover:bg-padel-green-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Completar perfil'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}