"use client"

import type React from "react"
import { useState, useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Camera, Upload, Trash2, ImageIcon, Info } from "lucide-react"
import {
  uploadClubCoverAction,
  uploadClubGalleryAction,
  removeClubGalleryAction,
} from "@/app/(main)/edit-profile/actions"
import { useToast } from "@/hooks/use-toast"

interface ClubGallerySectionProps {
  defaultValues?: {
    coverImage?: string | null
    galleryImages?: string[]
  }
}

export function ClubGallerySection({ defaultValues }: ClubGallerySectionProps) {
  const { toast } = useToast()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [coverImage, setCoverImage] = useState(defaultValues?.coverImage || null)
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultValues?.galleryImages || [])
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Use transitions for handling actions
  const [isPending, startTransition] = useTransition()
  const [uploadType, setUploadType] = useState<"cover" | "gallery" | "remove" | null>(null)

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive",
        })
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload automatically
      const formData = new FormData()
      formData.append("file", file)

      setUploadType("cover")
      startTransition(async () => {
        try {
          const result = await uploadClubCoverAction(formData)

          if (result.success && result.url) {
            setCoverImage(result.url)
            setCoverPreview(null)
            toast({
              title: "¡Imagen de portada actualizada!",
              description: "La imagen de portada se ha subido correctamente.",
            })
          } else {
            toast({
              title: "Error al subir imagen de portada",
              description: result.message,
              variant: "destructive",
            })
          }
        } catch (error) {
          toast({
            title: "Error inesperado",
            description: "No se pudo subir la imagen de portada.",
            variant: "destructive",
          })
        } finally {
          setUploadType(null)
        }
      })
    }
  }

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Archivo no válido",
          description: "Por favor selecciona un archivo de imagen válido.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive",
        })
        return
      }

      // Upload automatically
      const formData = new FormData()
      formData.append("file", file)

      setUploadType("gallery")
      startTransition(async () => {
        try {
          const result = await uploadClubGalleryAction(formData)

          if (result.success && result.galleryImages) {
            setGalleryImages(result.galleryImages)
            toast({
              title: "¡Imagen agregada a la galería!",
              description: "La imagen se ha añadido correctamente a tu galería.",
            })
          } else {
            toast({
              title: "Error al subir imagen a galería",
              description: result.message,
              variant: "destructive",
            })
          }
        } catch (error) {
          toast({
            title: "Error inesperado",
            description: "No se pudo subir la imagen a la galería.",
            variant: "destructive",
          })
        } finally {
          setUploadType(null)
        }
      })
    }
    // Reset input
    e.target.value = ""
  }

  const handleRemoveGalleryImage = (imageUrl: string) => {
    const formData = new FormData()
    formData.append("imageUrl", imageUrl)

    setUploadType("remove")
    startTransition(async () => {
      try {
        const result = await removeClubGalleryAction(formData)

        if (result.success && result.galleryImages) {
          setGalleryImages(result.galleryImages)
          toast({
            title: "¡Imagen eliminada!",
            description: "La imagen se ha eliminado correctamente de la galería.",
          })
        } else {
          toast({
            title: "Error al eliminar imagen",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error inesperado",
          description: "No se pudo eliminar la imagen.",
          variant: "destructive",
        })
      } finally {
        setUploadType(null)
      }
    })
  }

  const isCoverPending = isPending && uploadType === "cover"
  const isGalleryPending = isPending && uploadType === "gallery"
  const isRemovePending = isPending && uploadType === "remove"

  return (
    <div className="space-y-8">
      {/* Cover Image Section */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
            <Camera className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Imagen de Portada</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Esta imagen aparecerá como portada principal de tu club. Recomendamos una imagen de alta calidad que
          represente tu club.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cover-image" className="text-sm font-medium text-gray-700">
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

              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                {coverPreview || coverImage ? (
                  <div className="relative group">
                    <img
                      src={coverPreview || coverImage || ""}
                      alt="Imagen de portada"
                      className="w-full h-60 object-cover rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center p-6">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isCoverPending}
                        className="bg-white text-gray-700 hover:bg-gray-100"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {isCoverPending ? "Subiendo..." : "Cambiar imagen"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isCoverPending}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isCoverPending ? "Subiendo..." : "Subir imagen de portada"}
                      </Button>
                      <p className="text-sm text-gray-500">JPG, PNG o WEBP hasta 5MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Images Section */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gray-100 w-10 h-10 rounded-lg flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Galería de Imágenes</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Agrega múltiples imágenes para mostrar las instalaciones, pistas y servicios de tu club.
        </p>

        <div className="space-y-6">
          <div className="flex justify-center md:justify-start">
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
              onClick={() => galleryInputRef.current?.click()}
              disabled={isGalleryPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isGalleryPending ? "Subiendo..." : "Agregar imagen a galería"}
            </Button>
          </div>

          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((imageUrl, index) => (
                <div key={index} className="relative group overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={`Imagen de galería ${index + 1}`}
                    className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveGalleryImage(imageUrl)}
                      disabled={isRemovePending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No hay imágenes en la galería</p>
              <p className="text-sm text-gray-500 mt-1">Las imágenes que subas aparecerán aquí</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Consejos para mejores imágenes</h4>
            <ul className="text-sm text-gray-700 space-y-1.5">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2"></span>
                Usa imágenes de alta resolución para mejor calidad
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2"></span>
                La imagen de portada debe representar bien tu club
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2"></span>
                Agrega fotos de las pistas, instalaciones y servicios
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2"></span>
                Las imágenes ayudan a atraer más jugadores
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
