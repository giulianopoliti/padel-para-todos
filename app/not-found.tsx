import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 border border-teal-100">
          <AlertTriangle className="h-10 w-10 text-teal-600" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl font-light text-teal-700">404</h1>
          <h2 className="text-2xl font-light text-slate-700">Página no encontrada</h2>
          <p className="text-slate-500">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>
        
        <div className="pt-8">
          <Link href="/">
            <Button className="bg-teal-500/90 hover:bg-teal-600/90 border-none shadow-sm transition-all duration-300 hover:shadow rounded-full text-white font-normal px-6">
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
        
        <div className="pt-8 text-sm text-slate-500">
          <p>
            Si crees que esto es un error, por favor contacta al administrador
            o vuelve a la página anterior.
          </p>
        </div>
      </div>
    </div>
  );
} 