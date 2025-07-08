import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { checkRoutePermission, getRedirectPath } from "@/config/permissions"

// Define user roles (ensure this matches config/permissions.ts and your user data)
type Role = "PLAYER" | "CLUB" | "COACH" | "ADMIN"

// Simple in-memory cache for session data (cleared on restart)
const sessionCache = new Map<string, { user: any; role: Role | null; isActive: boolean; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

// Function to clear cache for a specific user (for logout)
export function clearUserCache(userId: string) {
  if (sessionCache.has(userId)) {
    sessionCache.delete(userId)
    console.log(`[Middleware] Cleared cache for user: ${userId}`)
  }
}

// Function to clear all cache (for complete cleanup)
export function clearAllCache() {
  sessionCache.clear()
  console.log("[Middleware] Cleared all cache")
}

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
    const userId = user?.id
    
    // If no session/user, clear any cached data for this user
    if (!user && userId) {
      clearUserCache(userId)
    }
    
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

    // If user exists, check cache first for role and active status
    let userRole: Role | null = null
    let isActiveClub: boolean = true // Default to true for non-club users
    const cacheKey = userId || ""
    const now = Date.now()
    
    if (userId && sessionCache.has(cacheKey)) {
      const cached = sessionCache.get(cacheKey)!
      if (now - cached.timestamp < CACHE_DURATION) {
        userRole = cached.role
        isActiveClub = cached.isActive
        console.log(`[Middleware] Using cached role for user ${userId}: ${userRole}, isActive: ${isActiveClub}`)
      } else {
        sessionCache.delete(cacheKey)
        console.log(`[Middleware] Cache expired for user ${userId}, fetching fresh data`)
      }
    }

    // If not in cache or cache expired, fetch role and club status
    if (userId && userRole === null) {
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle()

        if (!userError && userData) {
          userRole = userData.role as Role
          isActiveClub = true // Default to true for non-club users
          
          // If user is a club, check if they are active
          if (userRole === "CLUB") {
            const { data: clubData, error: clubError } = await supabase
              .from("clubes")
              .select("is_active")
              .eq("user_id", userId)
              .maybeSingle()

            if (!clubError && clubData) {
              isActiveClub = clubData.is_active
              console.log(`[Middleware] Club active status for user ${userId}: ${isActiveClub}`)
            } else if (clubError) {
              console.error("[Middleware] Error fetching club active status:", clubError.message)
              isActiveClub = false // Default to false if error
            }
          }
          
          // Cache the result
          sessionCache.set(cacheKey, {
            user,
            role: userRole,
            isActive: isActiveClub,
            timestamp: now
          })
          console.log(`[Middleware] Cached role for user ${userId}: ${userRole}, isActive: ${isActiveClub}`)
        } else if (userError) {
          console.error("[Middleware] Error fetching user role:", userError.message)
        }
      } catch (dbError) {
        console.error("[Middleware] Database error fetching role:", dbError)
      }
    }

    // Check if club is inactive and redirect to pending approval page
    if (userRole === "CLUB" && !isActiveClub && currentPath !== "/pending-approval") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/pending-approval"
      console.log(`[Middleware] Redirecting inactive club to pending approval page`)
      return NextResponse.redirect(redirectUrl, { headers })
    }

    // Check route permission using existing function
    const hasPermission = checkRoutePermission(currentPath, userRole)
    const isAuthenticated = !!user

    console.log(`[Middleware] Path: ${currentPath}, User: ${userId || 'None'}, Role: ${userRole || 'None'}, IsActiveClub: ${isActiveClub}, HasPermission: ${hasPermission}`)

    // Redirect if user lacks permission or isn't authenticated for a protected route
    if (!hasPermission) {
      const redirectPath = getRedirectPath(currentPath, isAuthenticated, hasPermission)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = redirectPath
      console.log(`[Middleware] Redirecting to: ${redirectUrl.pathname}`)
      return NextResponse.redirect(redirectUrl, { headers })
    }

    // Redirect authenticated users away from auth pages (with extra safety check)
    if (
      user &&
      (currentPath === "/login" ||
        currentPath === "/register" ||
        currentPath === "/forgot-password")
    ) {
      // Double-check that user is actually authenticated by verifying session exists
      if (session) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        console.log(`[Middleware] Redirecting authenticated user from auth page to dashboard`)
        return NextResponse.redirect(url, { headers })
      }
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