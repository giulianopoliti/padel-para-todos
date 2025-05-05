'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTournament, getCategories, Category } from './actions';
import { useToast } from '@/components/ui/use-toast';

export default function CreateTournamentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Cargar categorías al iniciar el componente
  useEffect(() => {
    async function fetchCategories() {
      try {
        const result = await getCategories();
        if (result.success && result.categories) {
          setCategories(result.categories);
        } else {
          toast({
            title: "Error",
            description: result.message || "No se pudieron cargar las categorías",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar las categorías",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    }

    fetchCategories();
  }, [toast]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      const result = await createTournament(formData);
      
      if (result.success) {
        toast({
          title: "Torneo creado con éxito",
          description: "Tu torneo ha sido creado. Redirigiendo...",
        });
        // Redireccionar al torneo creado
        setTimeout(() => {
          router.push(`/tournaments/${result.tournamentId}`);
        }, 1500);
      } else {
        toast({
          title: "Error al crear torneo",
          description: result.message || "Ocurrió un error al crear el torneo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al crear torneo:", error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al crear el torneo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Torneo</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Información del Torneo</CardTitle>
          <CardDescription>
            Completa los detalles para crear un nuevo torneo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Torneo</Label>
                <Input id="name" name="name" placeholder="Ej: Torneo Primavera 2025" required />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Describe el torneo, reglas especiales, premios, etc."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Fecha de Finalización</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Torneo</Label>
                  <Select name="type" defaultValue="AMERICAN">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AMERICAN">Americano</SelectItem>
                      <SelectItem value="ELIMINATION">Eliminación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <div className="relative rounded-md border border-input">
                    <select 
                      id="category"
                      name="category"
                      className="w-full py-2 px-3 bg-transparent focus:outline-none"
                      required
                      disabled={isLoadingCategories}
                    >
                      {isLoadingCategories ? (
                        <option value="">Cargando categorías...</option>
                      ) : (
                        <>
                          <option value="">Selecciona una categoría</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                  <Input id="maxParticipants" name="maxParticipants" type="number" min="4" placeholder="16" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-padel-green-600 hover:bg-padel-green-700"
                disabled={isSubmitting || isLoadingCategories}
              >
                {isSubmitting ? 'Creando...' : 'Crear Torneo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 