import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Run the Supabase session update and auth check
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path, often public)
     * - /login (the login page)
     * - /auth/ (authentication routes)
     * Feel free to modify this pattern to include more public routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth).*)',
    // Apply middleware to specific protected top-level routes if needed
    // Example: Apply only to /home and /profile
    // '/home/:path*',
    // '/profile/:path*',
    // '/tournaments/:path*',
    // '/settings/:path*',
    // Add other protected paths here
  ],
}