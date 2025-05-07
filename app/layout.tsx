import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sistema de Torneos de Pádel',
  description: 'Sistema para organizar torneos de pádel amateurs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-slate-50">
        {children}
      </body>
    </html>
  )
} 