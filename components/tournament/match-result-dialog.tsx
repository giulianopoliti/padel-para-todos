"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { updateMatchResult } from "@/app/api/tournaments/actions"

interface MatchResultDialogProps {
  isOpen: boolean
  onClose: () => void
  match: any
  onSave: () => void
}

export default function MatchResultDialog({ isOpen, onClose, match, onSave }: MatchResultDialogProps) {
  const [score1, setScore1] = useState<number>(match.score_couple1 || 0)
  const [score2, setScore2] = useState<number>(match.score_couple2 || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (score1 === score2) {
      toast({
        title: "Error",
        description: "El resultado no puede ser un empate",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateMatchResult({
        matchId: match.id,
        score1,
        score2,
        winnerId: score1 > score2 ? match.couple1_id : match.couple2_id,
      })

      if (result.success) {
        toast({
          title: "Resultado guardado",
          description: "El resultado del partido ha sido guardado correctamente",
        })
        onSave()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar el resultado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al guardar resultado:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cargar Resultado</DialogTitle>
          <DialogDescription>Ingresa el resultado del partido entre las parejas.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="col-span-2">
              <Label htmlFor="score1" className="text-right block mb-2">
                {match.couple1_player1_name} / {match.couple1_player2_name}
              </Label>
              <Input
                id="score1"
                type="number"
                min="0"
                max="99"
                value={score1}
                onChange={(e) => setScore1(Number.parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>

            <div className="col-span-1 flex justify-center items-center">
              <span className="text-2xl font-bold text-slate-400">-</span>
            </div>

            <div className="col-span-2">
              <Label htmlFor="score2" className="block mb-2">
                {match.couple2_player1_name} / {match.couple2_player2_name}
              </Label>
              <Input
                id="score2"
                type="number"
                min="0"
                max="99"
                value={score2}
                onChange={(e) => setScore2(Number.parseInt(e.target.value) || 0)}
                className="text-center"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Resultado
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
