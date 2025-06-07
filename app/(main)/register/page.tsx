"use client"

import type React from "react"

import { register, confirmPlayerLinking, rejectPlayerLinking, checkDNIConflictBeforeRegistration, registerAndLinkToExistingPlayer } from "./actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ArrowLeft, User, Building2, GraduationCap, Eye, EyeOff, UserCheck, Trophy, AlertTriangle } from "lucide-react"
import CPALogo from "@/components/ui/cpa-logo"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Role = "PLAYER" | "CLUB" | "COACH" | ""

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>("")
  const [confirmationData, setConfirmationData] = useState<any>(null)
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    clubName: "",
    address: "",
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "role") {
      setSelectedRole(value as Role)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleConfirmLinking = async () => {
    if (!confirmationData || !confirmationData.existingPlayer || !originalFormData) return
    
    setIsSubmitting(true)
    try {
      // Use the new function that creates user and links in one step
      const result = await registerAndLinkToExistingPlayer(originalFormData, confirmationData.existingPlayer.id)
      
      // Clear confirmation data
      setConfirmationData(null)
      
      if (result?.error) {
        toast({
          title: "Error al Crear Cuenta",
          description: result.error,
          variant: "destructive",
        })
      } else if (result?.success) {
        toast({
          title: "¡Cuenta Creada y Vinculada!",
          description: `${result.message} Puntaje actual: ${result.playerData?.score || 0} puntos.`,
          duration: 5000,
        })
        if (result.redirectUrl) {
          setTimeout(() => {
            router.push(result.redirectUrl || "/")
          }, 3000)
        }
      }
    } catch (error) {
      toast({
        title: "Error Inesperado",
        description: "Ha ocurrido un error al crear y vincular la cuenta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectLinking = async () => {
    if (!originalFormData || !confirmationData?.existingPlayer) return
    
    setIsSubmitting(true)
    
    // Clear confirmation data immediately
    const conflictData = {
      dni: originalFormData.get('dni') as string || '',
      existingPlayerId: confirmationData.existingPlayer.id,
      newPlayerId: 'blocked'
    }
    setConfirmationData(null)
    
    try {
      // Register conflict in database for admin review
      const { checkDNIConflictBeforeRegistration } = await import('./actions')
      
      // This will log the conflict with status 'blocked_before_registration'
      await checkDNIConflictBeforeRegistration(originalFormData)
      
      // Show error message with WhatsApp report option
      toast({
        title: "❌ Registro Bloqueado",
        description: (
          <div className="space-y-3">
            <p className="text-sm">Registro bloqueado por conflicto de datos. Contacta al administrador para resolver este problema.</p>
            <p className="text-xs text-gray-600">
              Este conflicto necesita ser resuelto manualmente por el administrador.
            </p>
            <button
              onClick={() => handleReportConflict(conflictData)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              📱 Contactar por WhatsApp
            </button>
          </div>
        ),
        variant: "destructive",
        duration: 15000, // Show for longer
      })
      
    } catch (error) {
      toast({
        title: "Error Inesperado",
        description: (
          <div className="space-y-3">
            <p className="text-sm">Ha ocurrido un error al procesar el rechazo.</p>
            <button
              onClick={() => handleReportConflict({
                dni: originalFormData?.get('dni') as string || '',
                existingPlayerId: confirmationData?.existingPlayer?.id || '',
                newPlayerId: 'error'
              })}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              📱 Contactar por WhatsApp
            </button>
          </div>
        ),
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReportConflict = (conflictData: { dni: string | null; existingPlayerId: string; newPlayerId: string }) => {
    const isBlocked = conflictData.newPlayerId === 'blocked' || conflictData.newPlayerId === 'error';
    
    const message = `🚨 *CONFLICTO DNI - REGISTRO BLOQUEADO*

📋 *Detalles del conflicto:*
• DNI: ${conflictData.dni}
• ID del perfil existente: ${conflictData.existingPlayerId}
• Estado: ${isBlocked ? 'Registro bloqueado por el usuario' : 'Conflicto reportado'}

⚠️ *Descripción del problema:* 
El usuario intentó registrarse con un DNI que ya existe en el sistema, pero indica que el perfil encontrado NO le corresponde.

🔍 *Posibles causas:*
- Error en los datos del perfil existente
- DNI ingresado incorrectamente en registros anteriores
- Documento duplicado por error de carga
- Necesita verificación manual de identidad

👤 *Acción del usuario:* RECHAZÓ la vinculación con el perfil existente

⏰ *Fecha y hora:* ${new Date().toLocaleString('es-AR')}

🔧 *Acción requerida:*
Revisar manualmente los datos del perfil ID ${conflictData.existingPlayerId} y resolver el conflicto. El usuario no puede completar su registro hasta que se solucione este problema.

📧 *Email del usuario:* ${formData.email || 'No disponible'}
📱 *Teléfono del usuario:* ${formData.phone || 'No proporcionado'}`

    const whatsappUrl = `https://wa.me/+5491169405063?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    
    toast({
      title: "✅ Reporte Enviado",
      description: "Se abrió WhatsApp con el reporte detallado. El administrador revisará el conflicto lo antes posible.",
      duration: 4000,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un rol.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)

    const dataToSubmit = new FormData()
    dataToSubmit.append("email", formData.email)
    dataToSubmit.append("password", formData.password)
    dataToSubmit.append("role", selectedRole)

    if (selectedRole === "CLUB") {
      dataToSubmit.append("clubName", formData.clubName)
      dataToSubmit.append("address", formData.address)
    } else if (selectedRole === "PLAYER") {
      dataToSubmit.append("firstName", formData.firstName)
      dataToSubmit.append("lastName", formData.lastName)
      dataToSubmit.append("dni", formData.dni)
      dataToSubmit.append("phone", formData.phone)
      dataToSubmit.append("gender", formData.gender)
      dataToSubmit.append("dateOfBirth", formData.dateOfBirth)
    } else if (selectedRole === "COACH") {
      dataToSubmit.append("firstName", formData.firstName)
      dataToSubmit.append("lastName", formData.lastName)
    }

    try {
      // First, check for DNI conflicts BEFORE creating auth user
      if (selectedRole === "PLAYER") {
        const conflictCheckResult = await checkDNIConflictBeforeRegistration(dataToSubmit)
        
        if (!conflictCheckResult.success) {
          if (conflictCheckResult.requiresConfirmation && conflictCheckResult.existingPlayer) {
            // Show confirmation modal
            setConfirmationData(conflictCheckResult)
            setOriginalFormData(dataToSubmit)
            toast({
              title: "Jugador Encontrado",
              description: "Se encontró un jugador con tu DNI. Verifica si es tu perfil.",
              duration: 3000,
            })
            setIsSubmitting(false)
            return
          } else if (conflictCheckResult.showConflictReport) {
            // Blocked due to name mismatch
            toast({
              title: "❌ Registro Bloqueado",
              description: conflictCheckResult.error,
              variant: "destructive",
              duration: 6000,
            })
            
            // Show WhatsApp report button
            if (conflictCheckResult.conflictData) {
              setTimeout(() => {
                handleReportConflict(conflictCheckResult.conflictData!)
              }, 1000)
            }
            
            setIsSubmitting(false)
            return
          } else {
            // Other error
            toast({
              title: "Error",
              description: conflictCheckResult.error,
              variant: "destructive",
            })
            setIsSubmitting(false)
            return
          }
        }
      }
      
      // No conflicts, proceed with normal registration
      const result = await register(dataToSubmit)

      if (result?.error) {
        toast({
          title: "Error de Registro",
          description: result.error,
          variant: "destructive",
        })
      } else if (result?.success) {
        // Check if this requires confirmation
        if (result.requiresConfirmation && result.existingPlayer) {
          setConfirmationData(result)
          setOriginalFormData(dataToSubmit)
          toast({
            title: "Jugador Encontrado",
            description: result.message,
            duration: 3000,
          })
        } else if (result.matched && result.playerData) {
          // Direct match (shouldn't happen with new flow, but keeping for safety)
          toast({
            title: "¡Cuenta Vinculada!",
            description: `${result.message} Puntaje actual: ${result.playerData.score} puntos.`,
            duration: 5000,
          })
          if (result.redirectUrl) {
            setTimeout(() => {
              router.push(result.redirectUrl || "/")
            }, 3000)
          }
        } else {
          // Normal registration
          toast({
            title: "Registro Exitoso",
            description: result.message || "¡Bienvenido!",
          })
          if (result.redirectUrl) {
            setTimeout(() => {
              router.push(result.redirectUrl || "/")
            }, 1500)
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error Inesperado",
        description: "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-slate-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-300 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-slate-100 rounded-full blur-2xl opacity-40"></div>
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
          <Card className="w-full max-w-lg border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-slate-600 to-slate-800"></div>

            {/* Player Confirmation Modal */}
            {confirmationData && confirmationData.existingPlayer && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center">
                        <UserCheck className="text-orange-600 w-8 h-8" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800">
                      ¿Es este tu perfil?
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Encontramos un jugador registrado con tu DNI
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Verifica que los datos coincidan con tu información antes de confirmar
                      </AlertDescription>
                    </Alert>

                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Nombre:</span>
                        <span className="font-semibold text-slate-800">{confirmationData.existingPlayer.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">DNI:</span>
                        <span className="font-semibold text-slate-800">{confirmationData.existingPlayer.dni}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Puntaje:</span>
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-semibold text-slate-800">{confirmationData.existingPlayer.score} puntos</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Categoría:</span>
                        <span className="font-semibold text-slate-800">{confirmationData.existingPlayer.category}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <Button
                        onClick={handleRejectLinking}
                        disabled={isSubmitting}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                      >
                        {isSubmitting ? "Procesando..." : "❌ No es mi perfil"}
                      </Button>
                      <Button
                        onClick={handleConfirmLinking}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                      >
                        {isSubmitting ? "Vinculando..." : "✅ Sí, es mi perfil"}
                      </Button>
                    </div>

                    <div className="space-y-2 pt-4">
                      <p className="text-xs text-slate-500 text-center">
                        ✅ Al confirmar: Tu cuenta se vinculará con este perfil y conservarás tu historial de torneos.
                      </p>
                      <p className="text-xs text-red-500 text-center">
                        ❌ Al rechazar: El registro se bloqueará hasta resolver el conflicto con el administrador.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <CardHeader className="text-center pt-8 pb-6">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-slate-600 to-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="text-white font-black text-lg">CPA</div>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Crear Nueva Cuenta</CardTitle>
              <CardDescription className="mt-2 text-base text-slate-600">
                Únete al Circuito de Pádel Amateur
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="role" className="text-slate-700 font-medium">
                    Tipo de usuario
                  </Label>
                  <Select
                    name="role"
                    onValueChange={(value) => handleSelectChange("role", value)}
                    value={selectedRole}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl">
                      <SelectValue placeholder="Selecciona tu rol..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLAYER">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Jugador
                        </div>
                      </SelectItem>
                      <SelectItem value="CLUB">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Club
                        </div>
                      </SelectItem>
                      <SelectItem value="COACH">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Entrenador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Contraseña
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl pr-12"
                      placeholder="Mínimo 6 caracteres"
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

                {selectedRole === "CLUB" && (
                  <>
                    <div>
                      <Label htmlFor="clubName" className="text-slate-700 font-medium">
                        Nombre del Club
                      </Label>
                      <Input
                        id="clubName"
                        name="clubName"
                        value={formData.clubName}
                        onChange={handleInputChange}
                        required
                        className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                        placeholder="Nombre de tu club"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-slate-700 font-medium">
                        Dirección del Club
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                        placeholder="Ej: Calle Falsa 123, Ciudad"
                      />
                    </div>
                  </>
                )}

                {(selectedRole === "PLAYER" || selectedRole === "COACH") && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-slate-700 font-medium">
                          Nombre
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-slate-700 font-medium">
                          Apellido
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                          placeholder="Tu apellido"
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedRole === "PLAYER" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dni" className="text-slate-700 font-medium">
                          DNI
                        </Label>
                        <Input
                          id="dni"
                          name="dni"
                          value={formData.dni}
                          onChange={handleInputChange}
                          className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                          placeholder="Tu número de DNI"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-slate-700 font-medium">
                          Teléfono
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                          placeholder="+54 9 11 12345678"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="gender" className="text-slate-700 font-medium">
                          Género
                        </Label>
                        <Select
                          name="gender"
                          onValueChange={(value) => handleSelectChange("gender", value)}
                          value={formData.gender}
                        >
                          <SelectTrigger className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl">
                            <SelectValue placeholder="Selecciona tu género" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Masculino</SelectItem>
                            <SelectItem value="FEMALE">Femenino</SelectItem>
                            <SelectItem value="OTHER">Otro / Prefiero no decirlo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-slate-700 font-medium">
                          Fecha de Nacimiento
                        </Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className="mt-2 h-12 border-slate-200 focus:border-slate-500 focus:ring-slate-500 rounded-xl"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedRole}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white h-12 text-base font-medium shadow-lg rounded-xl mt-8"
                >
                  {isSubmitting ? "Registrando..." : "Crear Cuenta"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="text-center pb-8">
              <div className="w-full">
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800">
                  ¿Ya tienes una cuenta? Inicia sesión
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
