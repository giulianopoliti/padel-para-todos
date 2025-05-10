"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { registerNewPlayerForTournament } from "@/app/api/tournaments/actions"
import { useUser } from "@/contexts/user-context"

// Esquema de validación
const playerFormSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres"),
  dni: z.string().min(7, "El DNI debe tener al menos 7 caracteres"),
})

type PlayerFormValues = z.infer<typeof playerFormSchema>

interface RegisterPlayerFormProps {
  tournamentId: string
  onComplete: (success: boolean) => void
}

export default function RegisterPlayerForm({ tournamentId, onComplete }: RegisterPlayerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user: contextUser, userDetails } = useUser()

  // Valores por defecto si el usuario ya tiene un perfil
  const defaultValues: Partial<PlayerFormValues> = {
    firstName: userDetails?.first_name || "",
    lastName: userDetails?.last_name || "",
    phone: userDetails?.phone || "",
    dni: userDetails?.dni || "",
  }

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues,
  })

  const onSubmit = async (data: PlayerFormValues) => {
    if (!contextUser) {
      alert("Debe iniciar sesión para registrarse")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await registerNewPlayerForTournament(tournamentId, data.firstName, data.lastName, data.phone, data.dni)

      if (result.success) {
        alert("Jugador registrado correctamente")
        onComplete(true)
      } else {
        alert("Ocurrió un error al procesar su solicitud")
        onComplete(false)
      }
    } catch (error) {
      console.error("Error al registrar jugador:", error)
      alert("Ocurrió un error al procesar su solicitud")
      onComplete(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su apellido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su teléfono" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DNI</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese su DNI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onComplete(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
            {isSubmitting ? "Procesando..." : "Inscribirme"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
