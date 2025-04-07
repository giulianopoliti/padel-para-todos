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
import type { Category } from "@/types"

export default function CreateTournament() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
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

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (!categoriesError && categoriesData) {
        setCategories(categoriesData as Category[])
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id)
        }
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!name || !startDate || !endDate || !categoryId) {
        throw new Error("Por favor, completa todos los campos")
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error("La fecha de inicio debe ser anterior a la fecha de finalización")
      }

      const { data, error } = await supabase
        .from("tournaments")
        .insert([
          {
            name,
            startDate,
            endDate,
            category: categoryId,
            clubId: user.id,
            status: "not_started",
          },
        ])
        .select()

      if (error) throw error

      router.push("/dashboard/club")
    } catch (error) {
      console.error("Error creating tournament:", error)
      setError(error instanceof Error ? error.message : "Error al crear el torneo")
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
            <CardTitle>Crear Nuevo Torneo</CardTitle>
            <CardDescription>Completa el formulario para crear un nuevo torneo</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Torneo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Torneo de Verano 2023"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Finalización</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="text-destructive text-sm">{error}</div>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear Torneo"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

