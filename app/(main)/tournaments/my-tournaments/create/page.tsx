'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createTournamentAction } from '@/app/api/tournaments/actions';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Tag, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Category {
  name: string;
}

interface TournamentFormData {
  name: string;
  description: string;
  category_name: string;
  type: 'LONG' | 'AMERICAN' | '';
  gender: 'MALE' | 'SHEMALE' | 'MIXED' | '';
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  max_participants: number | string;
}

export default function CreateTournamentPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    category_name: '',
    type: '',
    gender: 'MALE',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    max_participants: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDropdownData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('name')
          .order('name');
          
        if (categoriesError) {
          throw new Error(`Error al cargar categorías: ${categoriesError.message}`);
        }
        
        setCategories(categoriesData || []);
      } catch (err: any) {
        console.error('Error fetching dropdown data:', err);
        setError(err.message || 'Error al cargar los datos del formulario');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDropdownData();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'max_participants' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleSelectChange = (name: keyof TournamentFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Si cambia a torneo americano, limpiar fecha de finalización
      if (name === 'type' && value === 'AMERICAN') {
        newData.end_date = '';
        newData.end_time = '';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      // Validaciones específicas
      if (!formData.name.trim()) {
        throw new Error('El nombre del torneo es obligatorio');
      }
      
      if (!formData.start_date || !formData.start_time) {
        throw new Error('La fecha y hora de inicio son obligatorias');
      }
      
      // Validar que se haya seleccionado un tipo de torneo
      if (!formData.type || (formData.type !== 'LONG' && formData.type !== 'AMERICAN')) {
        throw new Error('Debes seleccionar un tipo de torneo');
      }
      
      // Validar que se haya seleccionado un género
      if (!formData.gender || (formData.gender !== 'MALE' && formData.gender !== 'SHEMALE' && formData.gender !== 'MIXED')) {
        throw new Error('Debes seleccionar un género');
      }
      
      // Para torneos LONG, la fecha de fin es obligatoria
      if (formData.type === 'LONG' && (!formData.end_date || !formData.end_time)) {
        throw new Error('Para torneos largos, la fecha y hora de finalización son obligatorias');
      }

      const formatDateTime = (date: string, time: string) => {
        if (!date || !time) return null;
        const fullTime = time.length === 5 ? `${time}:00` : time;
        return new Date(`${date}T${fullTime}`).toISOString();
      };

      const dataForAction = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category_name: formData.category_name,
        type: formData.type as 'LONG' | 'AMERICAN',
        gender: formData.gender as 'MALE' | 'SHEMALE' | 'MIXED',
        start_date: formatDateTime(formData.start_date, formData.start_time),
        end_date: formData.type === 'AMERICAN' ? null : formatDateTime(formData.end_date, formData.end_time),
        max_participants: formData.max_participants === '' ? null : Number(formData.max_participants),
      };

      const result = await createTournamentAction(dataForAction);
      
      if (result.success) {
        setSuccessMessage('¡Torneo creado exitosamente!');
        setTimeout(() => {
          router.push('/tournaments/my-tournaments');
        }, 2000);
      } else {
        throw new Error(result.error || 'Error desconocido al crear el torneo');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear el torneo');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  const isAmericanTournament = formData.type === 'AMERICAN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm">
              <Link href="/tournaments/my-tournaments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Crear Nuevo Torneo</h1>
              <p className="text-slate-600">Configura tu torneo y empieza a recibir inscripciones</p>
            </div>
            <Trophy className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Alerts */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nombre del Torneo *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Torneo de Primavera 2024"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe tu torneo, premios, reglas especiales..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuración del Torneo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Tag className="h-5 w-5 mr-2 text-blue-600" />
                  Configuración del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category_name" className="text-sm font-medium">
                      Categoría *
                    </Label>
                    <Select 
                      name="category_name" 
                      onValueChange={(value) => handleSelectChange('category_name', value)} 
                      value={formData.category_name} 
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">
                      Tipo de Torneo *
                    </Label>
                    <Select 
                      name="type" 
                      onValueChange={(value) => handleSelectChange('type', value as 'LONG' | 'AMERICAN')} 
                      value={formData.type} 
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                                             <SelectContent>
                         <SelectItem value="LONG">
                           <div className="flex flex-col">
                             <span>Largo (Tradicional)</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="AMERICAN">
                           <span>Americano</span>
                         </SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium">
                      Género *
                    </Label>
                    <Select 
                      name="gender" 
                      onValueChange={(value) => handleSelectChange('gender', value as 'MALE' | 'SHEMALE' | 'MIXED')} 
                      value={formData.gender} 
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Masculino</SelectItem>
                        <SelectItem value="SHEMALE">Femenino</SelectItem>
                        <SelectItem value="MIXED">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="max_participants" className="text-sm font-medium">
                      <Users className="h-4 w-4 inline mr-1" />
                      Máximo de Parejas
                    </Label>
                    <Input
                      id="max_participants"
                      name="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={handleChange}
                      min="2"
                      max="64"
                      placeholder="Ej: 16"
                      className="mt-1"
                    />
                  </div>
                </div>

                {isAmericanTournament && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Torneo Americano</p>
                        <p className="text-sm text-blue-700">
                          Los torneos americanos se juegan en un solo día. No necesitas especificar fecha de finalización.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fechas y Horarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Fechas y Horarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="start_date" className="text-sm font-medium">
                      Fecha de Inicio *
                    </Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className="mt-1"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="start_time" className="text-sm font-medium">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Hora de Inicio *
                    </Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {!isAmericanTournament && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="end_date" className="text-sm font-medium">
                        Fecha de Finalización *
                      </Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required={!isAmericanTournament}
                        className="mt-1"
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end_time" className="text-sm font-medium">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Hora de Finalización *
                      </Label>
                      <Input
                        id="end_time"
                        name="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={handleChange}
                        required={!isAmericanTournament}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botón de Envío */}
            <div className="flex justify-end space-x-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/tournaments/my-tournaments">
                  Cancelar
                </Link>
              </Button>
              
              <Button 
                type="submit" 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando Torneo...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Crear Torneo
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 