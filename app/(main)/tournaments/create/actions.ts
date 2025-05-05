'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUser } from '@/app/api/users';

export type CreateTournamentResult = {
  success: boolean;
  message?: string;
  tournamentId?: string;
};

export async function createTournament(formData: FormData): Promise<CreateTournamentResult> {
  // Get the authenticated user
  const user = await getUser();
  
  if (!user) {
    return {
      success: false,
      message: "No estás autenticado. Por favor, inicia sesión nuevamente."
    };
  }
  
  // Create Supabase client
  const supabase = await createClient();
  
  // Find the club ID associated with the user
  const { data: clubData, error: clubError } = await supabase
    .from('clubes')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (clubError || !clubData) {
    console.error("Error fetching club data:", clubError);
    return {
      success: false,
      message: "No se encontró información de club para tu usuario."
    };
  }
  
  // Extract the form data
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const type = formData.get('type') as string;
  const categoryName = formData.get('category') as string;
  const maxParticipants = formData.get('maxParticipants') as string;
  
  // Validate form data
  if (!name || !startDate || !endDate || !type) {
    return {
      success: false,
      message: "Faltan campos obligatorios."
    };
  }
  
  try {
    // Insert the tournament into the database
    const { data: tournamentData, error: insertError } = await supabase
      .from('tournaments')
      .insert({
        name,
        description,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        type,
        category_name: categoryName || null,
        club_id: clubData.id,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error("Error inserting tournament:", insertError);
      return {
        success: false,
        message: `Error al crear el torneo: ${insertError.message}`
      };
    }
    
    if (!tournamentData) {
      return {
        success: false,
        message: "Error: No se recibió confirmación de la creación del torneo."
      };
    }
    
    // Get category data
    const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name')
        .eq('name', categoryName)
        .single();  
        
    if (categoriesError) {
        console.error("Error fetching category data:", categoriesError);
        return {
            success: false,
            message: `Error al obtener la categoría: ${categoriesError.message}`
        };
    }

    // Revalidate the tournaments path
    revalidatePath('/tournaments');
    
    return {
      success: true,
      message: "Torneo creado exitosamente.",
      tournamentId: tournamentData.id
    };
    
  } catch (error: any) {
    console.error("Unexpected error creating tournament:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`
    };
  }
}

export type Category = {
  id: string;
  name: string;
  lower_range?: number;
  upper_range?: number | null;
};

export type GetCategoriesResult = {
  success: boolean;
  message?: string;
  categories?: Category[];
};

export async function getCategories(): Promise<GetCategoriesResult> {
  const supabase = await createClient();
  
  try {
    const { data: categoriesData, error } = await supabase
      .from('categories')
      .select('*')
      .order('lower_range', { ascending: true });
    
    if (error) {
      console.error("Error obteniendo categorías:", error);
      return {
        success: false,
        message: `Error al obtener categorías: ${error.message}`
      };
    }
    
    return {
      success: true,
      categories: categoriesData as Category[]
    };
  } catch (error: any) {
    console.error("Error inesperado al obtener categorías:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`
    };
  }
} 