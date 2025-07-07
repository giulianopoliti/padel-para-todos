import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Login - Sistema de Torneos de Pádel',
  description: 'Iniciar sesión en el Sistema de Torneos de Pádel',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {children}
      <Toaster />
    </div>
  )
}
