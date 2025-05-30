"use client"

import React, { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Camera, Upload, Trash2, ImageIcon } from 'lucide-react'
import { uploadClubCoverAction, uploadClubGalleryAction, removeClubGalleryAction } from '@/app/(main)/edit-profile/actions'
import { useToast } from '@/hooks/use-toast'

interface ClubGallerySectionProps {
  defaultValues?: {
    coverImage?: string | null
    galleryImages?: string[]
  }
}

export function ClubGallerySection({ defaultValues }: ClubGallerySectionProps) {
  console.log('🎨 ClubGallerySection mounted with defaultValues:', defaultValues)
  
  const { toast } = useToast()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  
  const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || null)
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultValues?.galleryImages || [])
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  console.log('📊 Current state - coverImage:', coverImage)
  console.log('📊 Current state - galleryImages:', galleryImages)
  console.log('📊 Current state - coverPreview:', coverPreview)

  // Use transitions for handling actions
  const [isPending, startTransition] = useTransition()
  const [uploadType, setUploadType] = useState<'cover' | 'gallery' | 'remove' | null>(null)

  console.log('⏳ isPending:', isPending, 'uploadType:', uploadType)

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleCoverFileChange called')
    const file = e.target.files?.[0]
    console.log('📁 File selected:', file?.name, file?.size, file?.type)
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('❌ Invalid file type:', file.type)
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        console.log('❌ File too large:', file.size)
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive",
        })
        return
      }

      console.log('✅ File validation passed')

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        console.log('🖼️ Preview created')
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload automatically
      const formData = new FormData()
      formData.append('file', file)
      console.log('📤 Starting cover upload...')
      
      setUploadType('cover')
      startTransition(async () => {
        try {
          console.log('🚀 Calling uploadClubCoverAction...')
          const result = await uploadClubCoverAction(formData)
          console.log('📥 Upload result:', result)
          
          if (result.success && result.url) {
            console.log('✅ Cover upload successful, new URL:', result.url)
            setCoverImage(result.url)
            setCoverPreview(null)
            toast({
              title: "¡Imagen de portada actualizada!",
              description: "La imagen de portada se ha subido correctamente.",
            })
          } else {
            console.log('❌ Cover upload failed:', result.message)
            toast({
              title: "Error al subir imagen de portada",
              description: result.message,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('💥 Cover upload error:', error)
          toast({
            title: "Error inesperado",
            description: "No se pudo subir la imagen de portada.",
            variant: "destructive",
          })
        } finally {
          console.log('🏁 Cover upload finished, clearing uploadType')
          setUploadType(null)
        }
      })
    }
  }

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleGalleryFileChange called')
    const file = e.target.files?.[0]
    console.log('📁 Gallery file selected:', file?.name, file?.size, file?.type)
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('❌ Invalid file type:', file.type)
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        console.log('❌ File too large:', file.size)
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive",
        })
        return
      }

      console.log('✅ Gallery file validation passed')

      // Upload automatically
      const formData = new FormData()
      formData.append('file', file)
      console.log('📤 Starting gallery upload...')
      
      setUploadType('gallery')
      startTransition(async () => {
        try {
          console.log('🚀 Calling uploadClubGalleryAction...')
          const result = await uploadClubGalleryAction(formData)
          console.log('📥 Gallery upload result:', result)
          
          if (result.success && result.galleryImages) {
            console.log('✅ Gallery upload successful, new images:', result.galleryImages)
            setGalleryImages(result.galleryImages)
            toast({
              title: "¡Imagen agregada a la galería!",
              description: "La imagen se ha añadido correctamente a tu galería.",
            })
          } else {
            console.log('❌ Gallery upload failed:', result.message)
            toast({
              title: "Error al subir imagen a galería",
              description: result.message,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('💥 Gallery upload error:', error)
          toast({
            title: "Error inesperado",
            description: "No se pudo subir la imagen a la galería.",
            variant: "destructive",
          })
        } finally {
          console.log('🏁 Gallery upload finished, clearing uploadType')
          setUploadType(null)
        }
      })
    }
    // Reset input
    e.target.value = ''
  }

  const handleRemoveGalleryImage = (imageUrl: string) => {
    console.log('🎯 handleRemoveGalleryImage called for:', imageUrl)
    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    console.log('🗑️ Starting image removal...')
    
    setUploadType('remove')
    startTransition(async () => {
      try {
        console.log('🚀 Calling removeClubGalleryAction...')
        const result = await removeClubGalleryAction(formData)
        console.log('📥 Remove result:', result)
        
        if (result.success && result.galleryImages) {
          console.log('✅ Image removal successful, updated gallery:', result.galleryImages)
          setGalleryImages(result.galleryImages)
          toast({
            title: "¡Imagen eliminada!",
            description: "La imagen se ha eliminado correctamente de la galería.",
          })
        } else {
          console.log('❌ Image removal failed:', result.message)
          toast({
            title: "Error al eliminar imagen",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('💥 Remove image error:', error)
        toast({
          title: "Error inesperado",
          description: "No se pudo eliminar la imagen.",
          variant: "destructive",
        })
      } finally {
        console.log('🏁 Image removal finished, clearing uploadType')
        setUploadType(null)
      }
    })
  }

  const isCoverPending = isPending && uploadType === 'cover'
  const isGalleryPending = isPending && uploadType === 'gallery'
  const isRemovePending = isPending && uploadType === 'remove'

  return (
    <div className="space-y-8">
      {/* Cover Image Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-800">Imagen de Portada</h3>
        </div>
        <p className="text-slate-600 mb-4">
          Esta imagen aparecerá como portada principal de tu club. Recomendamos una imagen de alta calidad que represente tu club.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cover-image" className="text-sm font-medium text-slate-700">
              Imagen de Portada
            </Label>
            <div className="mt-2">
              <Input
                ref={coverInputRef}
                id="cover-image"
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                className="hidden"
                disabled={isCoverPending}
              />
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-teal-400 transition-colors">
                {coverPreview || coverImage ? (
                  <div className="relative">
                    <img
                      src={coverPreview || coverImage || ''}
                      alt="Imagen de portada"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isCoverPending}
                        className="bg-white/90 text-slate-700 hover:bg-white"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {isCoverPending ? 'Subiendo...' : 'Cambiar imagen'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isCoverPending}
                        className="border-teal-200 text-teal-700 hover:bg-teal-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isCoverPending ? 'Subiendo...' : 'Subir imagen de portada'}
                      </Button>
                      <p className="text-sm text-slate-500">
                        JPG, PNG o WEBP hasta 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Images Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-slate-800">Galería de Imágenes</h3>
        </div>
        <p className="text-slate-600 mb-4">
          Agrega múltiples imágenes para mostrar las instalaciones, pistas y servicios de tu club.
        </p>

        <div className="space-y-4">
          <div>
            <Input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryFileChange}
              className="hidden"
              disabled={isGalleryPending}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isGalleryPending}
              className="border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isGalleryPending ? 'Subiendo...' : 'Agregar imagen a galería'}
            </Button>
          </div>

          {galleryImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Imagen de galería ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveGalleryImage(imageUrl)}
                      disabled={isRemovePending}
                      className="bg-red-500/90 hover:bg-red-600/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {galleryImages.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
              <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">No hay imágenes en la galería</p>
              <p className="text-sm text-slate-400">Las imágenes que subas aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Consejos para mejores imágenes</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Usa imágenes de alta resolución para mejor calidad</li>
              <li>• La imagen de portada debe representar bien tu club</li>
              <li>• Agrega fotos de las pistas, instalaciones y servicios</li>
              <li>• Las imágenes ayudan a atraer más jugadores</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 