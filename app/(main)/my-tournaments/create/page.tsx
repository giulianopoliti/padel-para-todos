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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createTournamentAction } from '@/app/api/tournaments/actions';

interface Category {
  name: string;
  // Add other category fields if needed, like lower_range, upper_range if they are relevant for display
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
  max_participants: number | string; // string for input, number for submission
}

export default function CreateTournamentPage() {
  const supabase = createClientComponentClient(); // Initialize Supabase client
  const router = useRouter(); // Added for redirect
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    category_name: '',
    type: '',
    gender: 'MALE', // Default gender
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    max_participants: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // For success message

  useEffect(() => {
    async function fetchDropdownData() {
      setIsLoading(true);
      setError(null); // Reset error on new fetch
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('name');
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      } catch (err: any) {
        console.error('Error fetching dropdown data:', err);
        setError('Failed to load data for dropdowns. ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDropdownData();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'max_participants' ? (value === '' ? '' : Number(value)) : value }));
  };

  const handleSelectChange = (name: keyof TournamentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    console.log('Form data to submit to server action:', formData);

    // Combine date and time for Supabase timestamp
    const formatDateTime = (date: string, time: string) => {
        if (!date || !time) return null;
        // Ensure time has seconds for full ISOString compatibility if backend expects it, otherwise HH:mm is fine for Date constructor
        const fullTime = time.length === 5 ? `${time}:00` : time;
        return new Date(`${date}T${fullTime}`).toISOString();
    };

    const dataForAction = {
        name: formData.name,
        description: formData.description,
        category_name: formData.category_name,
        type: formData.type,
        gender: formData.gender,
        start_date: formatDateTime(formData.start_date, formData.start_time),
        end_date: formatDateTime(formData.end_date, formData.end_time),
        max_participants: formData.max_participants === '' ? null : Number(formData.max_participants),
    };
    
    console.log('Data for Server Action:', dataForAction);

    try {
        const result = await createTournamentAction(dataForAction as any); // Cast to any for now, will match type later
        if (result.success && result.tournament) {
            setSuccessMessage('¡Torneo creado con éxito! Redirigiendo...');
            console.log('Tournament created:', result.tournament);
            // Redirect to the new tournament's page or a relevant listing page
            // For now, let's redirect to my-tournaments after a short delay
            setTimeout(() => {
                router.push('/my-tournaments'); 
            }, 2000);
        } else {
            setError(result.error || 'Error desconocido al crear el torneo.');
            console.error('Action error:', result.error);
        }
    } catch (err: any) {
        setError('Error al enviar el formulario: ' + err.message);
        console.error('Submission error:', err);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading form...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-blue-600">
              Crear Nuevo Torneo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-6">{error}</p>}
            {successMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md mb-6">{successMessage}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nombre del Torneo</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1" />
              </div>

              <div>
                <Label htmlFor="description">Descripción (Premios, etc.)</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category_name">Categoría</Label>
                  <Select name="category_name" onValueChange={(value) => handleSelectChange('category_name', value)} value={formData.category_name} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Torneo</Label>
                  <Select name="type" onValueChange={(value) => handleSelectChange('type', value as 'LONG' | 'AMERICAN')} value={formData.type} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LONG">Largo (Tradicional)</SelectItem>
                      <SelectItem value="AMERICAN">Americano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="gender">Género</Label>
                  <Select name="gender" onValueChange={(value) => handleSelectChange('gender', value as 'MALE' | 'SHEMALE' | 'MIXED')} value={formData.gender} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Masculino</SelectItem>
                      <SelectItem value="SHEMALE">Femenino</SelectItem> {/* Assuming SHEMALE maps to Femenino based on typical usage */}
                      <SelectItem value="MIXED">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} required className="mt-1" />
                </div>
                 <div>
                  <Label htmlFor="start_time">Hora de Inicio</Label>
                  <Input id="start_time" name="start_time" type="time" value={formData.start_time} onChange={handleChange} required className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="end_date">Fecha de Finalización</Label>
                  <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} required className="mt-1" />
                </div>
                 <div>
                  <Label htmlFor="end_time">Hora de Finalización</Label>
                  <Input id="end_time" name="end_time" type="time" value={formData.end_time} onChange={handleChange} required className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="max_participants">Máx. de Parejas/Participantes</Label>
                <Input id="max_participants" name="max_participants" type="number" value={formData.max_participants} onChange={handleChange} min="2" className="mt-1" />
              </div>

              <CardFooter className="px-0 pt-8">
                <Button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-lg py-3 rounded-xl shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando Torneo...' : 'Crear Torneo'}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}