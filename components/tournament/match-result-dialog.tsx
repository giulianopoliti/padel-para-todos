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
  const [result_couple1, setResult_couple1] = useState<string>(match.result_couple1?.toString() || "")
  const [result_couple2, setResult_couple2] = useState<string>(match.result_couple2?.toString() || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const score1Num = parseInt(result_couple1, 10)
    const score2Num = parseInt(result_couple2, 10)

    if (isNaN(score1Num) || isNaN(score2Num)) {
      toast({
        title: "Error",
        description: "Los resultados deben ser números válidos.",
        variant: "destructive",
      })
      return
    }

    if (score1Num === score2Num) {
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
        result_couple1: result_couple1,
        result_couple2: result_couple2,
        winner_id: score1Num > score2Num ? match.couple1_id : match.couple2_id,
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
              <Label htmlFor="result_couple1" className="text-right block mb-2">
                {match.couple1_player1_name} / {match.couple1_player2_name}
              </Label>
              <Input
                id="result_couple1"
                type="text"
                value={result_couple1}
                onChange={(e) => setResult_couple1(e.target.value)}
                className="text-center"
              />
            </div>

            <div className="col-span-1 flex justify-center items-center">
              <span className="text-2xl font-bold text-slate-400">-</span>
            </div>

            <div className="col-span-2">
              <Label htmlFor="result_couple2" className="block mb-2">
                {match.couple2_player1_name} / {match.couple2_player2_name}
              </Label>
              <Input
                id="result_couple2"
                type="text"
                value={result_couple2}
                onChange={(e) => setResult_couple2(e.target.value)}
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
