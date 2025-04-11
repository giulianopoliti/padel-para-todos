// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession()
  
  // Obtener la ruta actual
  const path = req.nextUrl.pathname
  
  // Rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/profile']
  
  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  if (isProtectedRoute && !session) {
    // Redirigir a login si no está autenticado
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Si está autenticado, verificar permisos por rol
  if (session) {
    // Obtener el rol del usuario
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (userData) {
      const role = userData.role
      
      // Verificar acceso a rutas específicas por rol
      if (path.startsWith('/dashboard/player') && role !== 'JUGADOR') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, req.url))
      }
      
      if (path.startsWith('/dashboard/club') && role !== 'CLUB') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, req.url))
      }
      
      if (path.startsWith('/dashboard/coach') && role !== 'ENTRENADOR') {
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}`, req.url))
      }
    }
  }
  
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
  ],
}