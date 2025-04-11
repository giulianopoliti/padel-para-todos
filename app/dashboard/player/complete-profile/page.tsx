// app/dashboard/player/complete-profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/utils/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getClubes } from './actions'

// Interfaces
interface Club {
  id: string;
  name: string;
}

export default function CompleteProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [dominantHand, setDominantHand] = useState<'right' | 'left' | 'none'>('none')
  const [preferredSide, setPreferredSide] = useState<'forehand' | 'backhand' | 'none'>('none')
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClub, setSelectedClub] = useState<string>('none')
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Cargar lista de clubes
  useEffect(() => {
    async function loadClubs() {
      setIsLoadingClubs(true)
      try {
        const result = await getClubes()
        if (result.error) {
          console.error("Error cargando clubes:", result.error)
          toast({
            title: 'Error',
            description: 'No se pudieron cargar los clubes. ' + result.error,
            variant: 'destructive',
          })
        } else if (result.clubs) {
          setClubs(result.clubs)
        }
      } catch (error) {
        console.error("Error inesperado cargando clubes:", error)
      } finally {
        setIsLoadingClubs(false)
      }
    }

    loadClubs()
  }, [toast])

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
      const first_name = formData.get('nombre') as string
      const last_name = formData.get('apellido') as string
      const phone = formData.get('telefono') as string
      const date_of_birth = formData.get('fechaNacimiento') as string
      const dni = formData.get('dni') as string
      const club_id = formData.get('club') as string || null
      const dominant_hand = formData.get('mano_habil') as string || null
      const preferred_side = formData.get('lado_preferido') as string || null
      const racket = formData.get('paleta') as string || null

      // Verificar si el género es válido
      if (!gender) {
        toast({
          title: 'Error',
          description: 'El género es obligatorio',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // Procesar valores opcionales
      const clubValue = selectedClub === 'none' ? null : selectedClub
      const dominantHandValue = dominantHand === 'none' ? null : dominantHand
      const preferredSideValue = preferredSide === 'none' ? null : preferredSide

      // 3. Crear/actualizar registro en la tabla players
      const { error: playerError } = await supabase.from('players').update([
        {
          first_name,
          last_name,
          phone,
          date_of_birth,
          dni,
          gender,
          preferred_hand: dominantHandValue,
          preferred_side: preferredSideValue,
          club_id: clubValue,
          racket: racket
        }
      ]).eq('user_id', user.id)

      // Si no se pudo actualizar (porque no existe), intentamos insertar
      if (playerError) {
        console.log("Error actualizando jugador, intentando insertar:", playerError)
        const { error: insertError } = await supabase.from('players').insert([
          {
            user_id: user.id,
            first_name,
            last_name,
            phone,
            date_of_birth,
            dni,
            gender,
            preferred_hand: dominantHandValue,
            preferred_side: preferredSideValue,
            club_id: clubValue,
            racket: racket
          }
        ])

        if (insertError) {
          toast({
            title: 'Error',
            description: `Error al guardar el perfil: ${insertError.message}`,
            variant: 'destructive',
          })
          setIsSubmitting(false)
          return
        }
      }

      // 4. Actualizar el estado de registro en la tabla users
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido <span className="text-red-500">*</span></Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      type="text"
                      required
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">DNI <span className="text-red-500">*</span></Label>
                  <Input
                    id="dni"
                    name="dni"
                    type="text"
                    required
                    placeholder="Tu número de documento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género <span className="text-red-500">*</span></Label>
                  <RadioGroup 
                    value={gender} 
                    onValueChange={(value) => setGender(value as 'male' | 'female')}
                    className="flex space-x-4"
                    required
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Masculino</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Femenino</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono <span className="text-red-500">*</span></Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    required
                    placeholder="Tu número de teléfono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de nacimiento <span className="text-red-500">*</span></Label>
                  <Input
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    type="date"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="club">Club</Label>
                  <Select 
                    value={selectedClub} 
                    onValueChange={setSelectedClub}
                    name="club"
                    disabled={isLoadingClubs}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClubs ? "Cargando clubes..." : "Selecciona un club (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dominantHand">Mano hábil</Label>
                  <Select 
                    value={dominantHand} 
                    onValueChange={(value) => setDominantHand(value as 'right' | 'left' | 'none')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu mano hábil (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No especificar</SelectItem>
                      <SelectItem value="right">Derecha</SelectItem>
                      <SelectItem value="left">Izquierda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paleta">Modelo de paleta</Label>
                  <Input
                    id="paleta"
                    name="paleta"
                    type="text"
                    placeholder="Tu modelo de paleta (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredSide">Lado preferido</Label>
                  <Select 
                    value={preferredSide} 
                    onValueChange={(value) => setPreferredSide(value as 'forehand' | 'backhand' | 'none')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu lado preferido (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No especificar</SelectItem>
                      <SelectItem value="forehand">Derecha (Forehand)</SelectItem>
                      <SelectItem value="backhand">Revés (Backhand)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-6 bg-padel-green-600 hover:bg-padel-green-700" 
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