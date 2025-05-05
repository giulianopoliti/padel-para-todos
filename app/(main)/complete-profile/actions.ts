'use server'

import { z } from 'zod';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database, TablesInsert } from '@/database.types'; // Assuming types are generated

type Role = Database["public"]["Enums"]["ROLE"];

// --- Zod Schemas for Validation ---

const baseSchema = z.object({
  role: z.enum(["PLAYER", "CLUB", "COACH"], { required_error: "Debes seleccionar un rol." }),
});

const playerSchema = baseSchema.extend({
  role: z.literal("PLAYER"),
  first_name: z.string().min(1, "El nombre es requerido."),
  last_name: z.string().min(1, "El apellido es requerido."),
  // Add other player fields (dni, birth_date, etc.) with validation
});

const clubSchema = baseSchema.extend({
  role: z.literal("CLUB"),
  club_name: z.string().min(1, "El nombre del club es requerido."),
  address: z.string().min(1, "La dirección es requerida."),
  // Add other club fields with validation
});

const coachSchema = baseSchema.extend({
  role: z.literal("COACH"),
  first_name: z.string().min(1, "El nombre es requerido."),
  last_name: z.string().min(1, "El apellido es requerido."),
  // Add other coach fields with validation
});

// Discriminated union for validation based on role
const profileSchema = z.discriminatedUnion("role", [
  playerSchema,
  clubSchema,
  coachSchema,
]);

// Type for the form state
export type FormState = {
  message: string;
  errors?: {
    role?: string[];
    first_name?: string[];
    last_name?: string[];
    club_name?: string[];
    address?: string[];
    general?: string[]; // For errors not specific to a field
    // Add other potential field errors
  } | null;
  success: boolean;
};

export async function completeUserProfile(prevState: FormState, formData: FormData): Promise<FormState> {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Error de autenticación. Intenta iniciar sesión de nuevo.", errors: null };
  }

  const rawData = Object.fromEntries(formData.entries());

  // Validate form data
  const validation = profileSchema.safeParse(rawData);

  if (!validation.success) {
    console.log("Validation Errors:", validation.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Error de validación. Revisa los campos.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const validatedData = validation.data;
  const selectedRole = validatedData.role;

  try {
    // Use a transaction to update users table and insert into role-specific table
    // Note: Supabase doesn't directly support multi-table transactions in JS like SQL transactions.
    // We perform operations sequentially and handle potential partial failures.

    // 1. Update the 'users' table with the selected role
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ role: selectedRole }) // Only update the role
      .eq('id', user.id);

    if (userUpdateError) {
      console.error("Error updating user role:", userUpdateError);
      return { success: false, message: `Error al actualizar el rol: ${userUpdateError.message}`, errors: null };
    }

    // 2. Insert into the role-specific table
    let insertData: any = { user_id: user.id }; // Common field
    let tableName: string = '';

    if (validatedData.role === 'PLAYER') {
      tableName = 'players';
      insertData = { 
        ...insertData, 
        first_name: validatedData.first_name, 
        last_name: validatedData.last_name,
        // Add other validated player fields
      };
    } else if (validatedData.role === 'CLUB') {
      tableName = 'clubes'; // Ensure table name is correct
      insertData = { 
        ...insertData, 
        name: validatedData.club_name, // Map form field to table column
        address: validatedData.address,
        // Add other validated club fields
      };
    } else if (validatedData.role === 'COACH') {
      tableName = 'coaches';
      insertData = { 
        ...insertData, 
        name: validatedData.first_name, // Map form field to table column
        last_name: validatedData.last_name,
        // Add other validated coach fields
      };
    }

    if (tableName) {
      const { error: roleInsertError } = await supabase
        .from(tableName as keyof Database["public"]["Tables"]) // Type assertion needed
        .insert(insertData as any); // Adjust type as per specific table insert needs

      if (roleInsertError) {
        console.error(`Error inserting into ${tableName}:`, roleInsertError);
        // Attempt to rollback user role update
        await supabase.from('users').update({ role: null }).eq('id', user.id); // Attempt rollback
        return { success: false, message: `Error al guardar detalles de ${selectedRole}: ${roleInsertError.message}. Intenta de nuevo.`, errors: null };
      }
    } else {
        // Should not happen due to validation, but handle defensively
         return { success: false, message: "Rol inválido seleccionado.", errors: null };
    }

    // Success!
    return { success: true, message: "Perfil completado con éxito.", errors: null };

  } catch (error: any) {
    console.error("Unexpected error completing profile:", error);
    return { success: false, message: `Error inesperado: ${error.message || 'Ocurrió un problema'}`, errors: null };
  }
} 