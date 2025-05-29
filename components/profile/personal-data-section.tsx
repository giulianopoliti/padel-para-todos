import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { User } from 'lucide-react'

interface PersonalDataSectionProps {
  defaultValues: any
}

export function PersonalDataSection({ defaultValues }: PersonalDataSectionProps) {
  console.log("[PersonalDataSection DEBUG] defaultValues received:", defaultValues);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaultValues.avatar_url || null);
  console.log("[PersonalDataSection DEBUG] initial avatarPreview state:", avatarPreview);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!avatarFile && defaultValues.avatar_url !== avatarPreview) {
      console.log("[PersonalDataSection DEBUG] useEffect updating avatarPreview from:", avatarPreview, "to:", defaultValues.avatar_url || null);
      setAvatarPreview(defaultValues.avatar_url || null);
    }
  }, [defaultValues.avatar_url, avatarFile, avatarPreview]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file is selected, reset to the original avatar or null
      // And clear the staged file
      setAvatarFile(null);
      setAvatarPreview(defaultValues.avatar_url || null);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null); // Clear preview
    // The hidden input will now send an empty string for avatar_url_existing,
    // signaling the backend to remove the avatar.
  };

  return (
    <Card className="shadow-md border-0 rounded-xl overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">
              Datos Personales
            </CardTitle>
            <p className="text-white/90 text-sm">
              Información básica de tu perfil
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8 bg-white">
        <div className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="avatar_file" className="text-slate-700 font-medium">Foto de Perfil</Label>
            <div className="flex items-center space-x-4">
              {avatarPreview ? (
                <img 
                  src={avatarPreview}
                  alt="Avatar Preview" 
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-200" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                  <User className="w-10 h-10" />
                </div>
              )}
              <div className="flex flex-col space-y-2">
                <Input 
                  id="avatar_file" 
                  name="avatar_file" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange}
                  className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                {avatarPreview && (
                    <button 
                        type="button" 
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    >
                        Eliminar Foto
                    </button>
                )}
                 <p className="text-xs text-slate-500">JPG, PNG, GIF. Máximo 2MB.</p>
              </div>
            </div>
            {/* Hidden input to track current avatar URL or signal removal */}
            <input type="hidden" name="avatar_url_existing" value={avatarPreview === null ? '' : (avatarFile ? defaultValues.avatar_url || '' : avatarPreview || '')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-slate-700 font-medium">Nombre</Label>
              <Input 
                id="first_name" 
                name="first_name" 
                defaultValue={defaultValues.first_name} 
                required 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-slate-700 font-medium">Apellido</Label>
              <Input 
                id="last_name" 
                name="last_name" 
                defaultValue={defaultValues.last_name} 
                required 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni" className="text-slate-700 font-medium">DNI</Label>
              <Input 
                id="dni" 
                name="dni" 
                defaultValue={defaultValues.dni} 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 font-medium">Teléfono</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                defaultValue={defaultValues.phone} 
                className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="text-slate-700 font-medium">Fecha de Nacimiento</Label>
            <Input 
              id="date_of_birth" 
              name="date_of_birth" 
              type="date" 
              defaultValue={defaultValues.date_of_birth} 
              className="border-slate-300 rounded-xl focus:border-teal-500 focus:ring-teal-500 bg-white text-slate-700"
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-slate-700 font-medium">Género (No se puede cambiar)</Label>
            <RadioGroup name="gender" defaultValue={defaultValues.gender} className="flex flex-col space-y-2" disabled>
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <RadioGroupItem value="MALE" id="gender-male" className="text-teal-600 border-slate-300" disabled />
                <Label htmlFor="gender-male" className="text-slate-600">Masculino</Label>
              </div>
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <RadioGroupItem value="FEMALE" id="gender-female" className="text-teal-600 border-slate-300" disabled />
                <Label htmlFor="gender-female" className="text-slate-600">Femenino</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}