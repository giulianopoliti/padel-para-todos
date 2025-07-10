Estoy desarrollando una aplicación Next.js para gestionar torneos de pádel usando Supabase para la autenticación y la base de datos.

Actualmente, tengo esta estructura de carpetas:
- `/tournaments`: Página pública para ver todos los torneos.
- `/tournaments/[id]`: Detalles del torneo (públicos).
- `/tournaments/MyTournaments`: Para que los clubes gestionen sus propios torneos.

El problema es que si un club ha iniciado sesión y quiere editar su propio torneo, debe ir a `MyTournaments/[id]`. Quiero **fusionar todo en una ruta unificada** como `/tournaments/[id]` y, según el rol y la propiedad del usuario, mostrar la vista correcta.

### Requisitos:
- Si el usuario **no ha iniciado sesión**, mostrar la vista pública y una solicitud para iniciar sesión antes de registrarse.
- Si el usuario es un **club** y **es el propietario del torneo**, mostrar una vista de edición. - Si el usuario es **jugador**, mostrar una vista de registro.
- Si el usuario **no está relacionado con el torneo**, mostrar una vista pública de solo lectura.
- Usar la sesión de Supabase para determinar la información y el acceso del usuario.
- Mantener el código escalable, limpio y modular (considerar un patrón de diseño si resulta útil).
- Sugerir una estructura de carpetas para `/tournaments/[id]` con una separación clara entre la lógica y la interfaz de usuario.
- Idealmente, sugerir una forma de encapsular la lógica de acceso de forma clara (por ejemplo, en un asistente o middleware).

Ayuda:
1. Refactorizar las carpetas en `/tournaments/[id]`
2. Implementar el control de acceso y la representación de vistas de forma limpia.
3. Hacer que el código sea más fácil de mantener y legible, evitando la lógica espagueti.