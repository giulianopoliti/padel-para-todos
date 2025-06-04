"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { UserPlus, Loader2 } from 'lucide-react'

import { NewPlayerData } from '../types'

const newPlayerSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  dni: z.string().min(7, 'El DNI debe tener al menos 7 caracteres'),
  phone: z.string().optional()
})

interface NewPlayerFormProps {
  onSubmit: (data: NewPlayerData) => void
  playerNumber: 1 | 2
}

export default function NewPlayerForm({ onSubmit, playerNumber }: NewPlayerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof newPlayerSchema>>({
    resolver: zodResolver(newPlayerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      dni: '',
      phone: ''
    }
  })

  const handleSubmit = async (values: z.infer<typeof newPlayerSchema>) => {
    setIsSubmitting(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onSubmit({
        first_name: values.first_name,
        last_name: values.last_name,
        dni: values.dni,
        phone: values.phone || undefined
      })
      
      // Reset form after successful submission
      form.reset()
    } catch (error) {
      console.error('Error creating player:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Complete los datos del nuevo jugador {playerNumber}
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese el nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese el apellido" {...field} />
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
                  <Input placeholder="Ingrese el DNI" {...field} />
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
                <FormLabel>Teléfono (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese el teléfono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando jugador...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Jugador {playerNumber}
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
} 