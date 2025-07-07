import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { checkRoutePermission, getRedirectPath } from "@/config/permissions"

// Define user roles (ensure this matches config/permissions.ts and your user data)
type Role = "PLAYER" | "CLUB" | "COACH" | "ADMIN"

// Simple in-memory cache for session data (cleared on restart)
const sessionCache = new Map<string, { user: any; role: Role | null; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

// Protected routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/edit-profile", "/profile"]

export async function updateSession(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set("x-current-path", request.nextUrl.pathname)

  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const currentPath = request.nextUrl.pathname

    // First, try to get session (faster, no network call)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("[Middleware] Session error:", sessionError.message)
    }

    const user = session?.user
    
    // Early return for public routes when no user
    if (!user && !PROTECTED_ROUTES.some(route => currentPath.startsWith(route))) {
      return response
    }

    // If no user and trying to access protected route, redirect to login
    if (!user && PROTECTED_ROUTES.some(route => currentPath.startsWith(route))) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url, { headers })
    }

    // If user exists, check cache first for role
    let userRole: Role | null = null
    const userId = user?.id
    const cacheKey = userId || ""
    const now = Date.now()
    
    if (userId && sessionCache.has(cacheKey)) {
      const cached = sessionCache.get(cacheKey)!
      if (now - cached.timestamp < CACHE_DURATION) {
        userRole = cached.role
        console.log(`[Middleware] Using cached role for user ${userId}: ${userRole}`)
      } else {
        sessionCache.delete(cacheKey)
      }
    }

    // If not in cache or cache expired, fetch role
    if (userId && userRole === null) {
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle()

        if (!userError && userData) {
          userRole = userData.role as Role
          // Cache the result
          sessionCache.set(cacheKey, {
            user,
            role: userRole,
            timestamp: now
          })
          console.log(`[Middleware] Cached role for user ${userId}: ${userRole}`)
        } else if (userError) {
          console.error("[Middleware] Error fetching user role:", userError.message)
        }
      } catch (dbError) {
        console.error("[Middleware] Database error fetching role:", dbError)
      }
    }

    // Check route permission using existing function
    const hasPermission = checkRoutePermission(currentPath, userRole)
    const isAuthenticated = !!user

    console.log(`[Middleware] Path: ${currentPath}, User: ${userId || 'None'}, Role: ${userRole || 'None'}, HasPermission: ${hasPermission}`)

    // Redirect if user lacks permission or isn't authenticated for a protected route
    if (!hasPermission) {
      const redirectPath = getRedirectPath(currentPath, isAuthenticated, hasPermission)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = redirectPath
      console.log(`[Middleware] Redirecting to: ${redirectUrl.pathname}`)
      return NextResponse.redirect(redirectUrl, { headers })
    }

    // Redirect authenticated users away from auth pages
    if (
      user &&
      (currentPath === "/login" ||
        currentPath === "/register" ||
        currentPath === "/forgot-password")
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url, { headers })
    }

    return response
  } catch (error) {
    console.error("[Middleware] Critical error:", error)
    // On error, allow the request to continue rather than breaking the app
    return NextResponse.next({
      request: {
        headers,
      },
    })
  }
}