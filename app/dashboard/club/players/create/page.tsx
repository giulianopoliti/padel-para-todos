"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/navbar"

export default function CreatePlayer() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dominantHand, setDominantHand] = useState<"left" | "right" | "">("")
  const [paddle, setPaddle] = useState("")
  const [preferredSide, setPreferredSide] = useState<"forehand" | "backhand" | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login?role=CLUB")
        return
      }

      const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (error || !userData || userData.role !== "CLUB") {
        await supabase.auth.signOut()
        router.push("/login?role=CLUB")
        return
      }

      setUser(userData)
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!firstName || !lastName) {
        throw new Error("Por favor, completa los campos obligatorios")
      }

      // Initial score for new players
      const initialScore = 0

      // Determine category based on score (this is a simplified example)
      const categoryId = "1" // Default to lowest category for new players

      const { data, error } = await supabase
        .from("players")
        .insert([
          {
            firstName,
            lastName,
            score: initialScore,
            category: categoryId,
            dominantHand: dominantHand || null,
            paddle: paddle || null,
            preferredSide: preferredSide || null,
            createdAt: new Date().toISOString(),
            createdBy: user.id,
          },
        ])
        .select()

      if (error) throw error

      router.push("/dashboard/club/players")
    } catch (error) {
      console.error("Error creating player:", error)
      setError(error instanceof Error ? error.message : "Error al crear el jugador")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          Volver
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Crear Nuevo Jugador</CardTitle>
            <CardDescription>Completa el formulario para registrar un nuevo jugador</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Apellido <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dominantHand">Mano Hábil</Label>
                <Select value={dominantHand} onValueChange={(value) => setDominantHand(value as "left" | "right")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la mano hábil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Derecha</SelectItem>
                    <SelectItem value="left">Izquierda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paddle">Paleta</Label>
                <Input
                  id="paddle"
                  value={paddle}
                  onChange={(e) => setPaddle(e.target.value)}
                  placeholder="Marca y modelo de la paleta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredSide">Lado Preferido</Label>
                <Select
                  value={preferredSide}
                  onValueChange={(value) => setPreferredSide(value as "forehand" | "backhand")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el lado preferido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forehand">Derecha (Drive)</SelectItem>
                    <SelectItem value="backhand">Izquierda (Revés)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="text-destructive text-sm">{error}</div>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear Jugador"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

