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
import { User, Building2, GraduationCap, ArrowLeft, Eye, EyeOff } from "lucide-react"
import CPALogo from "@/components/ui/cpa-logo"

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [role, setRole] = useState<"PLAYER" | "CLUB" | "COACH">("PLAYER")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const MAX_RETRIES = 2
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
        toast({
          title: "Error de acceso",
          description: result.error,
          variant: "destructive",
        })
        setError(result.error)
        setRetryCount((prev) => prev + 1)
      } else if (result?.success) {
        toast({
          title: "Acceso exitoso",
          description: "Redirigiendo al panel de control...",
        })
        router.push("/dashboard")
      }
    } catch (e) {
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

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-slate-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-300 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-slate-100 rounded-full blur-2xl opacity-40"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-slate-600 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>

          <div className="opacity-60">
            <CPALogo />
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-slate-600 to-slate-800"></div>

              <CardHeader className="pt-8 pb-6 text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-slate-600 to-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                    <div className="text-white font-black text-lg">CPA</div>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Iniciar Sesión</CardTitle>
                <CardDescription className="text-slate-600 text-base mt-2">
                  Accede como {role === "PLAYER" ? "Jugador" : role === "CLUB" ? "Club" : "Entrenador"}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <form action={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      className="border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-medium">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl h-12 text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-slate-600 hover:text-slate-800 text-sm font-medium">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white rounded-xl h-12 text-base font-medium shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
                <div>
                  <div className="text-center text-slate-500 mb-4 text-sm">Selecciona tu tipo de usuario:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("PLAYER")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                        role === "PLAYER"
                          ? "bg-slate-100 border-2 border-slate-300 shadow-sm"
                          : "bg-white border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                          role === "PLAYER"
                            ? "bg-gradient-to-r from-slate-600 to-slate-800 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <User className="h-5 w-5" />
                      </div>
                      <span
                        className={`font-medium text-xs ${role === "PLAYER" ? "text-slate-800" : "text-slate-600"}`}
                      >
                        Jugador
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("CLUB")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                        role === "CLUB"
                          ? "bg-slate-100 border-2 border-slate-300 shadow-sm"
                          : "bg-white border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                          role === "CLUB"
                            ? "bg-gradient-to-r from-slate-600 to-slate-800 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className={`font-medium text-xs ${role === "CLUB" ? "text-slate-800" : "text-slate-600"}`}>
                        Club
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("COACH")}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                        role === "COACH"
                          ? "bg-slate-100 border-2 border-slate-300 shadow-sm"
                          : "bg-white border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                          role === "COACH"
                            ? "bg-gradient-to-r from-slate-600 to-slate-800 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <span className={`font-medium text-xs ${role === "COACH" ? "text-slate-800" : "text-slate-600"}`}>
                        Entrenador
                      </span>
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-slate-500 text-sm">¿No tienes una cuenta? </span>
                  <Link href="/register" className="font-medium text-slate-700 hover:text-slate-900 text-sm">
                    Regístrate
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
