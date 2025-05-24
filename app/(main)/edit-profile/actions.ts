'use server'

import { z } from 'zod';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database, TablesInsert, TablesUpdate } from '@/database.types'; // Assuming types are generated

type Role = Database["public"]["Enums"]["ROLE"];

// --- Zod Schemas for Validation ---

const baseSchema = z.object({
  role: z.enum(["PLAYER", "CLUB", "COACH"], { required_error: "Debes seleccionar un rol." }),
  avatar_url: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')), // For users table
});

const playerSchema = baseSchema.extend({
  role: z.literal("PLAYER"),
  first_name: z.string().min(1, "El nombre es requerido."),
  last_name: z.string().min(1, "El apellido es requerido."),
  dni: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')), // Handle date string from form, can be yyyy-mm-dd
  category_name: z.string().optional().or(z.literal('')),
  score: z.preprocess(val => (val === '' || val === undefined || val === null) ? undefined : Number(val), z.number().optional()),
  preferred_hand: z.string().optional().or(z.literal('')),
  racket: z.string().optional().or(z.literal('')),
  gender: z.enum(["MALE", "SHEMALE", "MIXED"] as const).optional().or(z.literal('')),
  preferred_side: z.enum(["DRIVE", "REVES"] as const).optional().or(z.literal('')),
  club_id: z.string().uuid("ID de club inválido").optional().or(z.literal('')),
});

const clubSchema = baseSchema.extend({
  role: z.literal("CLUB"),
  club_name: z.string().min(1, "El nombre del club es requerido."), // Corresponds to 'name' in clubes table
  address: z.string().min(1, "La dirección es requerida."),
});

const coachSchema = baseSchema.extend({
  role: z.literal("COACH"),
  first_name: z.string().min(1, "El nombre es requerido."), // Corresponds to 'name' in coaches table
  last_name: z.string().min(1, "El apellido es requerido."),
});

const profileSchema = z.discriminatedUnion("role", [
  playerSchema,
  clubSchema,
  coachSchema,
]);

export type FormState = {
  message: string;
  errors?: {
    role?: string[];
    avatar_url?: string[];
    first_name?: string[];
    last_name?: string[];
    club_name?: string[];
    address?: string[];
    dni?: string[];
    phone?: string[];
    date_of_birth?: string[];
    category_name?: string[];
    score?: string[];
    preferred_hand?: string[];
    racket?: string[];
    gender?: string[];
    preferred_side?: string[];
    club_id?: string[];
    general?: string[];
  } | null;
  success: boolean;
};

export async function completeUserProfile(prevState: FormState, formData: FormData): Promise<FormState> {
  const cookieStore = cookies();
  const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Error de autenticación. Intenta iniciar sesión de nuevo.", errors: null };
  }

  const rawData = Object.fromEntries(formData.entries());
  
  // Pre-process specific fields: remove empty strings for optional fields so Zod treats them as undefined
  if (rawData.score === '') delete rawData.score;
  if (rawData.gender === '') delete rawData.gender;
  if (rawData.preferred_side === '') delete rawData.preferred_side;
  if (rawData.date_of_birth === '') delete rawData.date_of_birth;
  // Handle club_id placeholder for "No Club"
  if (rawData.club_id === 'NO_CLUB' || rawData.club_id === '') {
    delete rawData.club_id; // Treat as not selected, Zod will handle optional or convert to null later
  }
  if (rawData.avatar_url === '') rawData.avatar_url = ''; // Keep empty string for avatar_url if user clears it
  else if (!rawData.avatar_url) delete rawData.avatar_url; // If not present or null, delete for Zod optional

  // For other optional text fields, if they are empty, Zod's .or(z.literal('')) handles them.
  // If they should be truly optional (and not just empty string), delete them if empty.
  const optionalTextFields: (keyof typeof rawData)[] = ['dni', 'phone', 'category_name', 'preferred_hand', 'racket']; // club_id is handled separately now
  optionalTextFields.forEach(field => {
    if (rawData[field] === '') delete rawData[field];
  });

  const validation = profileSchema.safeParse(rawData);

  if (!validation.success) {
    console.error("Validation Errors:", validation.error.flatten().fieldErrors);
    return {
      success: false,
      message: "Error de validación. Revisa los campos.",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const validatedData = validation.data;
  const selectedRole = validatedData.role;

  try {
    const userUpdatePayload: Partial<TablesUpdate<'users'>> = { 
        role: selectedRole,
        ...(validatedData.avatar_url || validatedData.avatar_url === '' ? { avatar_url: validatedData.avatar_url || null } : {})
    };
    
    if (Object.keys(userUpdatePayload).length > 1 || userUpdatePayload.role !== undefined) { // only update if there is something to update
        const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdatePayload as any) 
        .eq('id', user.id);

        if (userUpdateError) {
        console.error("Error updating user role/avatar:", userUpdateError);
        return { success: false, message: `Error al actualizar datos de usuario: ${userUpdateError.message}`, errors: null };
        }
    }

    let upsertData: TablesInsert<'players'> | TablesInsert<'clubes'> | TablesInsert<'coaches'>;
    let tableName: 'players' | 'clubes' | 'coaches';
    const conflictColumn = 'user_id';

    if (validatedData.role === 'PLAYER') {
      tableName = 'players';
      upsertData = {
        user_id: user.id,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        dni: validatedData.dni || null,
        phone: validatedData.phone || null,
        date_of_birth: validatedData.date_of_birth || null,
        category_name: validatedData.category_name || null, 
        score: validatedData.score, 
        preferred_hand: validatedData.preferred_hand || null,
        racket: validatedData.racket || null,
        gender: (validatedData.gender as Database["public"]["Enums"]["GENDER"]) || null,
        preferred_side: (validatedData.preferred_side as Database["public"]["Enums"]["PREFERRED_SIDE"]) || null,
        club_id: validatedData.club_id || null,
      } as any;
    } else if (validatedData.role === 'CLUB') {
      tableName = 'clubes';
      upsertData = {
        user_id: user.id,
        name: validatedData.club_name,
        address: validatedData.address,
      };
    } else if (validatedData.role === 'COACH') {
      tableName = 'coaches';
      upsertData = {
        user_id: user.id,
        name: validatedData.first_name, 
        last_name: validatedData.last_name,
      };
    } else {
      return { success: false, message: "Rol inválido.", errors: null };
    }
    
    Object.keys(upsertData).forEach(key => {
        const k = key as keyof typeof upsertData;
        if (upsertData[k] === undefined) {
            (upsertData as any)[k] = null;
        }
    });

    const { error: roleUpsertError } = await supabase
      .from(tableName)
      .upsert(upsertData as any, { onConflict: conflictColumn });

    if (roleUpsertError) {
      console.error(`Error upserting into ${tableName}:`, roleUpsertError);
      return { success: false, message: `Error al guardar detalles de ${selectedRole}: ${roleUpsertError.message}. Intenta de nuevo.`, errors: null };
    }

    return { success: true, message: "Perfil actualizado con éxito.", errors: null };

  } catch (error: any) {
    console.error("Unexpected error updating profile:", error);
    return { success: false, message: `Error inesperado: ${error.message || 'Ocurrió un problema'}`, errors: null };
  }
} 