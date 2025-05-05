"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import type { User as AuthUser } from "@supabase/supabase-js";

interface NavbarUserProfileProps {
  isMobile?: boolean;
}

export default function NavbarUserProfile({ isMobile = false }: NavbarUserProfileProps) {
  const { user, logout } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
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
    if (!user?.email) return "?";
    return user.email.substring(0, 2).toUpperCase();
  };

  const userEmail = user.email || "No email available";
  const userIdShort = user.id.substring(0, 8);

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center p-2 rounded-md bg-gray-50">
          <Avatar className="h-10 w-10 mr-4">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{userEmail}</p>
            <p className="text-sm text-gray-500">ID: {userIdShort}</p>
          </div>
        </div>
        
        <Link href="/profile" className="flex items-center p-2 rounded-md hover:bg-gray-100">
          <UserIcon className="mr-3 h-5 w-5 text-gray-500" />
          <span>Mi Perfil</span>
        </Link>
        
        <Link href="/settings" className="flex items-center p-2 rounded-md hover:bg-gray-100">
          <Settings className="mr-3 h-5 w-5 text-gray-500" />
          <span>Configuración</span>
        </Link>
        
        <Button 
          variant="destructive" 
          className="w-full mt-2" 
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative bg-white text-padel-green-600 rounded-full p-0 h-10 w-10 hover:bg-gray-100">
          <Avatar>
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userEmail}</p>
            <p className="text-xs leading-none text-muted-foreground">
              ID: {userIdShort}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive cursor-pointer flex items-center"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 