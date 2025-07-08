# 🧪 **Guía de Pruebas - Control de Acceso de Clubes**

## **📋 Resumen**
Esta guía describe cómo testear el sistema de control de acceso basado en `is_active` para clubes.

---

## **🔧 Pre-requisitos**

### **Base de Datos**
- Campo `is_active` debe existir en tabla `clubes` (✅ confirmado)
- Valor por defecto: `false`
- Tipo: `boolean NOT NULL`

### **Sistema**
- Middleware actualizado con validación de `is_active`
- Consultas públicas filtradas por `is_active = true`
- Página `/pending-approval` disponible

---

## **🧪 Casos de Prueba**

### **1. Registro de Nuevo Club**

#### **Escenario**: Registro exitoso
1. Ir a `/register`
2. Seleccionar "Club" como tipo de usuario
3. Completar formulario con datos válidos
4. Enviar registro

#### **Resultado Esperado**:
- ✅ Club creado con `is_active = false`
- ✅ Usuario autenticado pero redirigido a `/pending-approval`
- ✅ Club NO aparece en listados públicos

#### **Verificación en Base de Datos**:
```sql
SELECT name, is_active FROM clubes WHERE user_id = 'USER_ID';
-- Debe mostrar: is_active = false
```

---

### **2. Acceso de Club Inactivo**

#### **Escenario**: Club inactivo intenta acceder al sistema
1. Iniciar sesión con credenciales de club inactivo
2. Intentar acceder a `/dashboard`
3. Intentar acceder a `/tournaments`
4. Intentar acceder a `/edit-profile`

#### **Resultado Esperado**:
- ✅ Todas las rutas protegidas redirigen a `/pending-approval`
- ✅ Usuario puede ver página de espera
- ✅ Mensaje claro sobre estado pendiente

#### **Verificación**:
- **URL final**: `/pending-approval`
- **Página muestra**: Información sobre proceso de aprobación
- **Botones de contacto**: WhatsApp y Email funcionan

---

### **3. Visibilidad Pública**

#### **Escenario**: Club inactivo no debe aparecer públicamente
1. Ir a `/clubes` (sin autenticación)
2. Ir a `/` (página de inicio)
3. Buscar club por nombre en listados públicos

#### **Resultado Esperado**:
- ❌ Club inactivo NO aparece en `/clubes`
- ❌ Club inactivo NO aparece en sección de clubes destacados
- ❌ Club inactivo NO es accesible directamente por ID

#### **Verificación**:
- **API `/api/clubes`**: No debe retornar clubes inactivos
- **Página inicio**: Sección "Clubes" no muestra clubes inactivos
- **Acceso directo**: `/clubes/[club-id]` retorna 404 para clubes inactivos

---

### **4. Activación de Club**

#### **Escenario**: Administrador activa un club
1. Actualizar `is_active = true` en base de datos
2. Club intenta acceder al sistema
3. Verificar visibilidad pública

#### **Comando SQL**:
```sql
UPDATE clubes SET is_active = true WHERE id = 'CLUB_ID';
```

#### **Resultado Esperado**:
- ✅ Club puede acceder a `/dashboard`
- ✅ Club puede crear torneos
- ✅ Club aparece en listados públicos
- ✅ Club puede usar todas las funcionalidades

#### **Verificación**:
- **Acceso**: `/dashboard` se carga correctamente
- **Funcionalidades**: Puede crear torneos, gestionar inscripciones
- **Visibilidad**: Aparece en `/clubes` y página de inicio

---

### **5. Página de Espera**

#### **Escenario**: Funcionalidad de página `/pending-approval`
1. Acceder como club inactivo
2. Verificar contenido de la página
3. Probar botones de contacto

#### **Resultado Esperado**:
- ✅ Información clara sobre proceso de aprobación
- ✅ Botón WhatsApp genera mensaje correcto
- ✅ Botón Email abre cliente de correo
- ✅ Proceso de aprobación explicado paso a paso

#### **Verificación**:
- **WhatsApp**: Mensaje pre-formateado con información relevante
- **Email**: Dirección correcta (info@cpa.com.ar)
- **Contenido**: Información actualizada sobre tiempos de aprobación

---

## **⚡ Pruebas Rápidas**

### **Script de Verificación Rápida**

```bash
# 1. Crear club de prueba inactivo
echo "1. Registrar club inactivo..."

# 2. Verificar redirección
echo "2. Verificar redirección a /pending-approval..."

# 3. Verificar invisibilidad pública
echo "3. Verificar que no aparece en /clubes..."

# 4. Activar club
echo "4. Activar club en BD..."

# 5. Verificar acceso completo
echo "5. Verificar acceso completo..."
```

---

## **🚨 Casos Edge**

### **Club Desactivado**
- **Escenario**: Club activo que se desactiva
- **Esperado**: Redirigido a `/pending-approval` en próximo acceso

### **Caché de Middleware**
- **Escenario**: Cambio de estado mientras usuario está logueado
- **Esperado**: Cambio toma efecto en 30 segundos (duración de caché)

### **Acceso Directo a URLs**
- **Escenario**: Club inactivo intenta acceder directamente a `/tournaments/create`
- **Esperado**: Redirigido a `/pending-approval`

---

## **📊 Métricas de Éxito**

### **Seguridad**
- ✅ 0 clubes inactivos con acceso a funcionalidades
- ✅ 0 clubes inactivos visibles públicamente
- ✅ 100% de redirecciones correctas

### **UX**
- ✅ Mensaje claro sobre estado pendiente
- ✅ Información útil sobre proceso de aprobación
- ✅ Canales de contacto funcionales

### **Performance**
- ✅ Consultas filtradas correctamente
- ✅ Caché de middleware funcionando
- ✅ Sin impacto en velocidad de carga

---

## **🔍 Debugging**

### **Logs del Middleware**
```bash
# Buscar en logs:
grep "Club active status" logs/middleware.log
grep "Redirecting inactive club" logs/middleware.log
```

### **Verificar Base de Datos**
```sql
-- Contar clubes activos vs inactivos
SELECT 
  is_active,
  COUNT(*) as count
FROM clubes 
GROUP BY is_active;

-- Verificar clubes específicos
SELECT 
  c.name,
  c.is_active,
  u.email
FROM clubes c
JOIN users u ON c.user_id = u.id
WHERE u.role = 'CLUB';
```

---

## **✅ Checklist Final**

### **Funcionalidades Implementadas**
- [ ] Campo `is_active` en database.types.ts
- [ ] Middleware valida estado de clubes
- [ ] Consultas públicas filtradas
- [ ] Página `/pending-approval` creada
- [ ] Permisos de ruta actualizados

### **Pruebas Completadas**
- [ ] Registro de club inactivo
- [ ] Redirección a página de espera
- [ ] Invisibilidad pública
- [ ] Activación de club
- [ ] Acceso completo post-activación

---

**🎯 El sistema está listo cuando todos los checkboxes estén marcados y las pruebas pasen exitosamente.** 