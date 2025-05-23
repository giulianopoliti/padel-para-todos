'use client'

// Verificar que esta importación es correcta
import { register } from './actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

type Role = 'PLAYER' | 'CLUB' | 'COACH' | '';

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('');
  
  // State for dynamic fields, explicitly define all possible fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // Club fields
    clubName: '',
    address: '',
    // Player fields
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    // Coach fields (firstName, lastName already covered for Player)
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'role') {
      setSelectedRole(value as Role);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  

  // Esta función es un wrapper para la acción del servidor
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona un rol.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    
    const dataToSubmit = new FormData();
    dataToSubmit.append('email', formData.email);
    dataToSubmit.append('password', formData.password);
    dataToSubmit.append('role', selectedRole);

    if (selectedRole === 'CLUB') {
      dataToSubmit.append('clubName', formData.clubName);
      dataToSubmit.append('address', formData.address);
    } else if (selectedRole === 'PLAYER') {
      dataToSubmit.append('firstName', formData.firstName);
      dataToSubmit.append('lastName', formData.lastName);
      dataToSubmit.append('dni', formData.dni);
      dataToSubmit.append('phone', formData.phone);
      dataToSubmit.append('gender', formData.gender);
      dataToSubmit.append('dateOfBirth', formData.dateOfBirth);
    } else if (selectedRole === 'COACH') {
      dataToSubmit.append('firstName', formData.firstName); // Assuming coaches also have first/last names
      dataToSubmit.append('lastName', formData.lastName);
    }
    
    console.log("Enviando datos al servidor:", Object.fromEntries(dataToSubmit));
      
    try {
      const result = await register(dataToSubmit);
      console.log("Resultado del servidor:", result);
      
      if (result?.error) {
        toast({
          title: 'Error de Registro',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result?.success) {
        toast({
          title: 'Registro Exitoso',
          description: result.message || '¡Bienvenido!',
        });
        
        if (result.redirectUrl) {
          setTimeout(() => {
            router.push(result.redirectUrl);
          }, 1500); 
        }
      }
    } catch (error) {
      console.error("Error al procesar el registro:", error);
      toast({
        title: 'Error Inesperado',
        description: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500">
            Crear Nueva Cuenta
          </CardTitle>
          <CardDescription className="mt-2 text-md text-gray-600">
            Elige tu rol y completa tus datos para comenzar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="role" className="text-gray-700 font-medium">Soy un</Label>
              <Select
                name="role"
                onValueChange={(value) => handleSelectChange('role', value)}
                value={selectedRole}
                required
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Selecciona tu rol..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAYER">Jugador</SelectItem>
                  <SelectItem value="CLUB">Club</SelectItem>
                  <SelectItem value="COACH">Entrenador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mt-1"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="mt-1"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {selectedRole === 'CLUB' && (
              <>
                <div>
                  <Label htmlFor="clubName" className="text-gray-700 font-medium">Nombre del Club</Label>
                  <Input id="clubName" name="clubName" value={formData.clubName} onChange={handleInputChange} required className="mt-1" placeholder="Nombre de tu club" />
                </div>
                <div>
                  <Label htmlFor="address" className="text-gray-700 font-medium">Dirección del Club</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleInputChange} className="mt-1" placeholder="Ej: Calle Falsa 123, Ciudad" />
                </div>
              </>
            )}

            {(selectedRole === 'PLAYER' || selectedRole === 'COACH') && (
              <>
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">Nombre</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="mt-1" placeholder="Tu nombre" />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Apellido</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="mt-1" placeholder="Tu apellido" />
                </div>
              </>
            )}

            {selectedRole === 'PLAYER' && (
              <>
                <div>
                  <Label htmlFor="dni" className="text-gray-700 font-medium">DNI</Label>
                  <Input id="dni" name="dni" value={formData.dni} onChange={handleInputChange} className="mt-1" placeholder="Tu número de DNI" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Teléfono</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="mt-1" placeholder="+54 9 11 12345678" />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-gray-700 font-medium">Género</Label>
                   <Select name="gender" onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Selecciona tu género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Masculino</SelectItem>
                      <SelectItem value="SHEMALE">Femenino</SelectItem>
                      <SelectItem value="MIXED">Otro / Prefiero no decirlo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-gray-700 font-medium">Fecha de Nacimiento</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} className="mt-1" />
                </div>
              </>
            )}
            <CardFooter className="px-0 pt-8">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedRole}
                className="w-full bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white text-lg py-3 transition-all duration-150 ease-in-out"
              >
                {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
        <div className="text-center pb-8">
          <Link
            href="/login"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </Card>
    </div>
  )
} 