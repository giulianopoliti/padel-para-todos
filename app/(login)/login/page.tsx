"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/(login)/login/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Trophy, User, Building2, GraduationCap, ArrowLeft } from 'lucide-react'
import { motion } from "framer-motion"

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [role, setRole] = useState<"PLAYER" | "CLUB" | "COACH">("PLAYER")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 2
  const [mounted, setMounted] = useState(false)

  // Only render the component on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use a debounce to prevent hammering the server
  useEffect(() => {
    if (isSubmitting && retryCount > 0) {
      const timer = setTimeout(() => {
        setIsSubmitting(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isSubmitting, retryCount])

  async function handleLogin(formData: FormData) {
    try {
      setError(null)
      setIsSubmitting(true)
      formData.append("role", role)

      console.log("Submitting login form with role:", role)

      if (retryCount >= MAX_RETRIES) {
        toast({
          title: "Demasiados intentos",
          description: "Por favor, intenta de nuevo más tarde.",
          variant: "destructive",
        })
        setError("Demasiados intentos. Por favor, intenta de nuevo más tarde.")
        setIsSubmitting(false)
        return
      }

      const result = await login(formData)

      if (result?.error) {
        console.error("Login error from server:", result.error)
        toast({
          title: "Error de acceso",
          description: result.error,
          variant: "destructive",
        })
        setError(result.error)
        setRetryCount((prev) => prev + 1)
      } else if (result?.success) {
        // Handle client-side redirection on success
        toast({
          title: "Acceso exitoso",
          description: "Redirigiendo al panel de control...",
        })
        router.push("/dashboard")
      }
    } catch (e) {
      // This will catch network errors
      console.error("Login network error:", e)
      const errorMessage =
        typeof e === "object" && e !== null && "message" in e
          ? `Error de conexión: ${(e as Error).message}`
          : "Error de conexión. Por favor intenta de nuevo más tarde."

      toast({
        title: "Error de red",
        description: errorMessage,
        variant: "destructive",
      })
      setError(errorMessage)
      setRetryCount((prev) => prev + 1)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render anything on the server or during first client render
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-50/80 via-white/60 to-blue-50/80"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8">
        <Link
          href="/home"
          className="inline-flex items-center text-slate-600 hover:text-teal-600 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al inicio
        </Link>

        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl"
          >
            <Card className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <div className="h-1.5 bg-gradient-to-r from-teal-600 to-blue-600"></div>
              <CardHeader className="pt-8 pb-4">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-teal-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center shadow-md">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-center text-slate-500 text-lg mt-2">
                  Accede como {role === "PLAYER" ? "Jugador" : role === "CLUB" ? "Club" : "Entrenador"}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8">
                {error && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form action={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 text-base">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      className="border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl py-6 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 text-base">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl py-6 text-base"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white rounded-xl py-6 text-lg font-medium shadow-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
                <div>
                  <div className="text-center text-slate-500 mb-4">Selecciona tu tipo de usuario:</div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setRole("PLAYER")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                        role === "PLAYER"
                          ? "bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 shadow-sm"
                          : "bg-white border border-slate-200 hover:border-teal-200"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          role === "PLAYER"
                            ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <User className="h-6 w-6" />
                      </div>
                      <span
                        className={`font-medium ${
                          role === "PLAYER"
                            ? "bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent"
                            : "text-slate-700"
                        }`}
                      >
                        Jugador
                      </span>
                    </button>

                    <button
                      onClick={() => setRole("CLUB")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                        role === "CLUB"
                          ? "bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 shadow-sm"
                          : "bg-white border border-slate-200 hover:border-teal-200"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          role === "CLUB"
                            ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Building2 className="h-6 w-6" />
                      </div>
                      <span
                        className={`font-medium ${
                          role === "CLUB"
                            ? "bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent"
                            : "text-slate-700"
                        }`}
                      >
                        Club
                      </span>
                    </button>

                    <button
                      onClick={() => setRole("COACH")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                        role === "COACH"
                          ? "bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 shadow-sm"
                          : "bg-white border border-slate-200 hover:border-teal-200"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          role === "COACH"
                            ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <span
                        className={`font-medium ${
                          role === "COACH"
                            ? "bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent"
                            : "text-slate-700"
                        }`}
                      >
                        Entrenador
                      </span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-slate-500">¿No tienes una cuenta? </span>
                  <Link href="/register" className="font-medium text-teal-600 hover:text-teal-700">
                    Regístrate
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
