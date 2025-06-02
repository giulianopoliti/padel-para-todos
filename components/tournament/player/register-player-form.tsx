"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { registerAuthenticatedPlayerForTournament } from "@/app/api/tournaments/actions"
import { useUser } from "@/contexts/user-context"
import { Phone, UserPlus, DollarSign, User, Trophy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Esquema de validación simplificado - solo teléfono
const phoneFormSchema = z.object({
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
})

type PhoneFormValues = z.infer<typeof phoneFormSchema>

interface Tournament {
  id: string
  name: string
  price?: number | null
}

interface RegisterPlayerFormProps {
  tournamentId: string
  tournament?: Tournament
  onComplete: (success: boolean) => void
}

export default function RegisterPlayerForm({ tournamentId, tournament, onComplete }: RegisterPlayerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: contextUser, userDetails } = useUser()

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phone: "",
    },
  })

  const onSubmit = async (data: PhoneFormValues) => {
    if (!contextUser) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para registrarte",
        variant: "destructive",
      })
      return
    }

    if (!userDetails?.player_id) {
      toast({
        title: "Error de perfil",
        description: "No se pudo obtener tu información de jugador. Verifica tu perfil.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await registerAuthenticatedPlayerForTournament(tournamentId, data.phone)

      if (result.success) {
        toast({
          title: "¡Registro exitoso!",
          description: "Te has registrado correctamente en el torneo",
        })
        onComplete(true)
      } else {
        toast({
          title: "Error en el registro",
          description: result.message || "No se pudo completar el registro",
          variant: "destructive",
        })
        onComplete(false)
      }
    } catch (error) {
      console.error("Error al registrar jugador:", error)
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al procesar tu solicitud",
        variant: "destructive",
      })
      onComplete(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Gratuito"
    return `$${price.toLocaleString()}`
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white border border-gray-200 shadow-sm">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <UserPlus className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">Registro Individual</CardTitle>
        {tournament && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Trophy className="h-4 w-4 mr-1" />
              {tournament.name}
            </div>
            <div className="flex items-center justify-center">
              <DollarSign className="h-4 w-4 mr-1 text-green-600" />
              <span className="text-lg font-medium text-green-600">
                {formatPrice(tournament.price)}
              </span>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-600 mt-3">
          Confirma tu registro con tu número de teléfono para que el club pueda contactarte
        </p>
      </CardHeader>

      <CardContent>
        {/* Información del usuario logueado */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <User className="h-4 w-4 mr-1" />
            Registrándose como:
          </div>
          <div className="font-medium text-gray-800">
            {userDetails?.email || contextUser?.email || "Usuario"}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Número de teléfono
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 1123456789"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500 mt-1">
                    El club utilizará este número para contactarte sobre el torneo
                  </p>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onComplete(false)}
                disabled={isSubmitting}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? "Registrando..." : "Confirmar registro"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
