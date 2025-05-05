'use client'

// Verificar que esta importación es correcta
import { register } from './actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Esta función es un wrapper para la acción del servidor
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Obtener el formulario y crear un nuevo FormData
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      console.log("Enviando datos al servidor:", {
        email: formData.get('email'),
        password: formData.get('password') ? '******' : 'no password' // No mostrar la contraseña real
      });
      
      // Llamar directamente a la acción del servidor
      const result = await register(formData);
      console.log("Resultado del servidor:", result);
      
      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        setIsSubmitting(false);
      } else if (result?.success) {
        toast({
          title: 'Éxito',
          description: result.message,
        });
        
        // Si hay una URL de redirección, redirigir después de mostrar el mensaje
        if (result.redirectUrl) {
          setTimeout(() => {
            router.push(result.redirectUrl);
          }, 1500); // Dar tiempo para que se muestre el toast
        } else {
          setIsSubmitting(false);
        }
      }
    } catch (error) {
      console.error("Error al procesar el registro:", error);
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-padel-green-50">
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-2">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-padel-green-700">
              Crear una cuenta
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ingresa tus datos para comenzar
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-padel-green-600 sm:text-sm sm:leading-6"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-padel-green-600 sm:text-sm sm:leading-6"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative flex w-full justify-center rounded-md bg-padel-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-padel-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-padel-green-600"
              >
                {isSubmitting ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-padel-green-600 hover:underline"
              >
                ¿Ya tienes una cuenta? Inicia sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 