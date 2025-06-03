// Define user roles - adjust as needed
type Role = "PLAYER" | "CLUB" | "COACH" | "ADMIN"; // Assuming ADMIN might be needed later

// Define icon names used in the navbar/sidebar
type IconName =
  | 'Home' 
  | 'Trophy' 
  | 'Users' 
  | 'Layers' // For Categories
  | 'MapPin' // For Club
  | 'Settings'
  | 'BarChart' // For Ranking
  | 'User'; // For Profile

// Structure for defining route permissions and navigation links
interface RouteConfig {
  path: string;
  label: string;
  icon: IconName;
  roles: Role[]; // Roles allowed to access this path
}

// Define the application's routes and their required permissions
const routePermissions: RouteConfig[] = [
  {
    path: "/",
    label: "Inicio", 
    icon: "Home", 
    roles: ["PLAYER", "CLUB", "COACH", "ADMIN"], // Accessible to all logged-in users
  },
  {
    path: "/ranking",
    label: "Ranking", 
    icon: "BarChart", 
    roles: ["PLAYER", "CLUB", "COACH", "ADMIN"], // Accessible to all logged-in users
  },
  { 
    path: "/tournaments", 
    label: "Torneos", 
    icon: "Trophy", 
    roles: ["PLAYER", "CLUB", "COACH", "ADMIN"], // Accessible to all logged-in users
  },
  {
    path: "/clubes",
    label: "Clubes",
    icon: "MapPin",
    roles: ["PLAYER", "CLUB", "COACH", "ADMIN"], // Accessible to all logged-in users
  },
  {path: "/my-tournaments",
    label: "Mis Torneos",
    icon: "Trophy",
    roles: ["CLUB"], // Accessible to all logged-in users
  },
  {
    path: "/coaches",
    label: "Entrenadores",
    icon: "User",
    roles: ["PLAYER", "CLUB", "COACH", "ADMIN"], // Mantenemos los roles para usuarios autenticados
  },
  // Example Admin/Specific Role Routes (Uncomment/modify as needed)
  // { 
  //   path: "/users", 
  //   label: "Usuarios", 
  //   icon: "Users", 
  //   roles: ["ADMIN"] // Only accessible to ADMIN
  // },
  // { 
  //   path: "/categories", 
  //   label: "Categorías", 
  //   icon: "Layers", 
  //   roles: ["ADMIN"] // Only accessible to ADMIN
  // },
  // { 
  //   path: "/club", 
  //   label: "Mi Club", 
  //   icon: "MapPin", 
  //   roles: ["CLUB", "ADMIN"] // Accessible to CLUB managers and ADMIN
  // },
  {
    path: "/edit-profile",
    label: "Editar perfil",
    icon: "User",
    roles: ["PLAYER", "CLUB", "COACH", "ADMIN"], // Accessible to all logged-in users
  },
  {
    path: "/settings",
    label: "Configuración",
    icon: "Settings",
    roles: ["PLAYER", "CLUB", "COACH", "ADMIN"], // Accessible to all logged-in users
  },
];

/**
 * Filters the routePermissions list to get navigation links
 * visible for a specific user role.
 */
export function getLinksForRole(role: Role) {
  return routePermissions
    .filter((permission) => permission.roles.includes(role))
    .map((permission) => ({
      label: permission.label,
      icon: permission.icon,
      path: permission.path,
    }));
}

/**
 * Checks if a given role has permission to access a specific path.
 * It checks for exact matches and parent paths (e.g., /tournaments allows /tournaments/123).
 */
export function checkRoutePermission(
  path: string,
  role?: Role | null // Role can be null/undefined if user is not logged in
): boolean {
  // Public routes accessible to everyone (even unauthenticated)
  const publicPaths = ["/", "/login", "/auth/callback", "/tournaments", "/ranking", "/register", "/clubes", "/coaches", "/players"];
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return true;
  }

  // If no role is provided (user not logged in), deny access to non-public routes
  if (!role) {
    return false;
  }

  // Check if the user's role grants access to the requested path or a parent path
  return routePermissions.some((route) => 
    route.roles.includes(role) && 
    (path === route.path || path.startsWith(`${route.path}/`))
  );
}

/**
 * Determines the redirect path based on authentication status and permissions.
 * For now, redirects unauthenticated users or users without permission to /login.
 */
export function getRedirectPath(
  path: string, // The path the user tried to access
  isAuthenticated: boolean,
  hasPermission: boolean 
): string {
   if (!isAuthenticated) {
    return "/login"; // Not logged in, go to login
  }
  if (!hasPermission) {
     // Logged in but no permission, redirect to home for now
     // Could redirect to an "/unauthorized" page in the future
    console.warn(`Redirecting user from ${path} due to lack of permissions.`);
    return "/"; 
  }
  // Should not happen if called correctly, but default to home
  return "/"; 
} 