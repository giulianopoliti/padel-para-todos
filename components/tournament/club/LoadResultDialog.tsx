"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
  team1Score: z.coerce.number().min(0).max(100),
  team2Score: z.coerce.number().min(0).max(100),
})

interface LoadResultDialogProps {
  tournamentId: string
  clubId: string
}

export function LoadResultDialog({ tournamentId, clubId }: LoadResultDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team1Score: 0,
      team2Score: 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // updateTournamentResult({ tournamentId, clubId, team1Score: values.team1Score, team2Score: values.team2Score })
    //   .then(() => {
    //     toast.success("Resultado cargado exitosamente!")
    //     setOpen(false)
    //   })
    //   .catch((error: any) => {
    //     toast.error("Error al cargar el resultado.")
    //   })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Cargar Resultado</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Cargar Resultado</DialogTitle>
          <DialogDescription className="text-slate-600">Ingresa el resultado del partido.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="team1Score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-600">Puntaje Equipo 1</FormLabel>
                  <FormControl>
                    <Input placeholder="Puntaje" type="number" {...field} className="text-slate-600" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="team2Score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-600">Puntaje Equipo 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Puntaje" type="number" {...field} className="text-slate-600" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Cargar</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
