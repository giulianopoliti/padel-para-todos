"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import type { User as AuthUser } from "@supabase/supabase-js";
import { getIcon, IconName } from "@/components/icons";

interface NavLink {
  label: string;
  icon: string;
  path: string;
}
interface NavbarUserProfileProps {
  profileLinks?: NavLink[];
  params?: {
    id?: string;
  };
}
export default function NavbarUserProfile({ profileLinks = [], params }: NavbarUserProfileProps) {
  const { user, logout, userDetails } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.refresh();
    } catch (error) {
      console.error("[NavbarUserProfile] Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  if (!user) {
    return null;
  }
  const getInitials = () => {
    const UDetails = userDetails as any;
    if (UDetails && typeof UDetails.first_name === 'string' && UDetails.first_name && typeof UDetails.last_name === 'string' && UDetails.last_name) {
      return `${UDetails.first_name[0]}${UDetails.last_name[0]}`.toUpperCase();
    }
    if (UDetails && typeof UDetails.name === 'string' && UDetails.name) {
      return UDetails.name.substring(0, 2).toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return "U";
  };
  const displayName = 
    (userDetails && typeof (userDetails as any).first_name === 'string' && (userDetails as any).first_name) ||
    (userDetails && typeof (userDetails as any).name === 'string' && (userDetails as any).name) ||
    user.email?.split('@')[0] || 
    "Usuario";
  const userEmail = user.email || "No email available";
  const userIdShort = user.id.substring(0, 8);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full p-0 h-10 w-10 text-white hover:bg-gray-800 focus-visible:ring-white focus-visible:ring-offset-0 focus-visible:ring-offset-gray-900">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-blue-600 text-sm font-semibold text-white">{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white border-gray-200 shadow-lg rounded-md mt-1">
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold leading-none text-gray-800 truncate" title={displayName}>{displayName}</p>
            <p className="text-xs leading-none text-gray-500 truncate" title={userEmail}>
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-100" />
        
        {profileLinks.map(link => {
          const IconComponent = getIcon(link.icon as IconName);
          return (
            <DropdownMenuItem key={link.path} asChild>
              <Link href={link.path} className="cursor-pointer flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-sm focus:bg-gray-100 focus:text-gray-900">
                {IconComponent && <IconComponent className="mr-2.5 h-4 w-4 text-gray-500" />}
                <span>{link.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
        
        {profileLinks.length > 0 && <DropdownMenuSeparator className="bg-gray-100"/>}
        
        <DropdownMenuItem 
          className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer flex items-center px-3 py-2 text-sm rounded-sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 