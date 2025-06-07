# Instrucciones para subir logos a Supabase Storage

## URLs de destino

Los logos deben subirse a las siguientes rutas en Supabase Storage:

- **Bucket**: `assets`
- **Logo Navbar**: `logos/logo-navbar.svg`
- **Logo Home**: `logos/logo-home.svg`

## URLs finales

Una vez subidos, los logos estarán disponibles en:

- Navbar: `https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/assets/logos/logo-navbar.svg`
- Home: `https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/assets/logos/logo-home.svg`

## Pasos para subir manualmente

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/vulusxqgknaejdxnhiex/storage/buckets/assets)

2. Navega al bucket `assets`

3. Crea la carpeta `logos` si no existe

4. Sube los archivos:
   - `public/logo navbar.svg` → como `logos/logo-navbar.svg`
   - `public/LOGO HOME.svg` → como `logos/logo-home.svg`

## Verificación

Una vez subidos, puedes verificar que funcionan visitando las URLs en el navegador:

- [Logo Navbar](https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/assets/logos/logo-navbar.svg)
- [Logo Home](https://vulusxqgknaejdxnhiex.supabase.co/storage/v1/object/public/assets/logos/logo-home.svg)

## Código actualizado

El código ya está actualizado para usar las URLs de Supabase Storage:

- ✅ `components/ui/cpa-logo.tsx`
- ✅ `app/(main)/page.tsx`  
- ✅ `lib/supabase-storage.ts` (helper creado)

## ¿Por qué usar Supabase Storage?

1. **Confiabilidad**: Los archivos están siempre disponibles, incluso en producción
2. **CDN**: Mejor rendimiento con distribución global
3. **Escalabilidad**: No depende de la configuración del hosting
4. **Gestión centralizada**: Fácil de mantener y actualizar

## Alternativa automática (futuro)

Para automatizar esto en el futuro, se puede usar la clave de servicio (service role key) en lugar de la anon key, o configurar un workflow de CI/CD que suba los assets automáticamente. 