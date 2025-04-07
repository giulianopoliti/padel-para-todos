"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import type { Role } from "@/types"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get("role") as Role) || "JUGADOR"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [role, setRole] = useState<Role>(defaultRole)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user has the correct role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (userError) throw userError

      if (userData.role !== role) {
        throw new Error(`Esta cuenta no tiene permisos de ${getRoleName(role)}`)
      }

      // Redirect based on role
      if (role === "CLUB") {
        router.push("/dashboard/club")
      } else if (role === "JUGADOR") {
        router.push("/dashboard/player")
      } else if (role === "ENTRENADOR") {
        router.push("/dashboard/coach")
      }
    } catch (error) {
      console.error("Error logging in:", error)
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
        },
      })

      if (error) throw error

      // Create user record in users table
      const { error: userError } = await supabase.from("users").insert([
        {
          id: data.user?.id,
          email,
          role,
        },
      ])

      if (userError) throw userError

      // Show success message or redirect
      alert("Registro exitoso. Por favor, verifica tu correo electrónico para confirmar tu cuenta.")
      setActiveTab("login")
    } catch (error) {
      console.error("Error registering:", error)
      setError(error instanceof Error ? error.message : "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (role: Role): string => {
    switch (role) {
      case "CLUB":
        return "Club"
      case "JUGADOR":
        return "Jugador"
      case "ENTRENADOR":
        return "Entrenador"
      default:
        return role
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Acceso para {getRoleName(role)}</CardTitle>
          <CardDescription className="text-center">Ingresa a tu cuenta o regístrate para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-destructive text-sm">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Correo Electrónico</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-destructive text-sm">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrando..." : "Registrarse"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">Selecciona tu tipo de usuario:</div>
          <div className="flex justify-center space-x-2">
            <Button variant={role === "CLUB" ? "default" : "outline"} size="sm" onClick={() => setRole("CLUB")}>
              Club
            </Button>
            <Button variant={role === "JUGADOR" ? "default" : "outline"} size="sm" onClick={() => setRole("JUGADOR")}>
              Jugador
            </Button>
            <Button
              variant={role === "ENTRENADOR" ? "default" : "outline"}
              size="sm"
              onClick={() => setRole("ENTRENADOR")}
            >
              Entrenador
            </Button>
          </div>
          <div className="text-center">
            <Link href="/" className="text-sm text-primary hover:underline">
              Volver al inicio
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

