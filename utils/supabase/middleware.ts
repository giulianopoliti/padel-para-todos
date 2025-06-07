import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { checkRoutePermission, getRedirectPath } from "@/config/permissions"

// Define user roles (ensure this matches config/permissions.ts and your user data)
type Role = "PLAYER" | "CLUB" | "COACH" | "ADMIN"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const currentPath = request.nextUrl.pathname

  let userRole: Role | null = null

  // If user is logged in, try to fetch their role from your database
  if (user) {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users") // Make sure 'users' is your user table name
        .select("role") // Make sure 'role' is the column name for the user's role
        .eq("id", user.id)
        .maybeSingle()

      if (userError) {
        console.error("[Middleware] Error fetching user role:", userError.message)
      } else if (userData) {
        userRole = userData.role as Role // Cast to Role type
      } else {
        console.log("[Middleware] User exists in auth but not in users table - treating as unauthenticated")
        // User exists in auth but not in users table - redirect to login
        userRole = null
      }
    } catch (dbError) {
      console.error("[Middleware] Database error fetching role:", dbError)
    }
  }

  console.log(`[Middleware] Path: ${currentPath}, User: ${user?.id || 'None'}, Role: ${userRole || 'None'}`)

  // Check permission based on the fetched role
  const hasPermission = checkRoutePermission(currentPath, userRole)
  const isAuthenticated = !!user

  console.log(`[Middleware] IsAuthenticated: ${isAuthenticated}, HasPermission: ${hasPermission}`)

  // Redirect if user lacks permission or isn't authenticated for a protected route
  if (!hasPermission) {
    const redirectPath = getRedirectPath(currentPath, isAuthenticated, hasPermission)
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = redirectPath
    console.log(`[Middleware] Redirecting to: ${redirectUrl.pathname}`)
    return NextResponse.redirect(redirectUrl)
  }

  // Return the original response with updated cookies
  return supabaseResponse
}