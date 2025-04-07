import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata = {
  title: "Sistema de Torneos de Pádel",
  description: "Sistema para organizar torneos de pádel amateurs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'