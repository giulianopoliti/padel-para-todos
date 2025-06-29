# 🎯 Objetivo

Estoy trabajando en una aplicación de torneos de pádel. La UI de tournament/id tiene un estilo que me gusta: líneas bien generadas, simétricas, con cards de partidos conectadas visualmente. Sin embargo, la distribución general no es óptima: hay que hacer demasiado scroll, incluso en pantallas de computadora grandes, y en el celular es aún peor.
NO QUIERO QUE CAMBIES FUNCIONALIDAD, DEBE SER LA MISMA.

---

## ✅ Lo que quiero que mejores

1. **Distribución general del contenido**:
   - Que la aplicación **ocupe casi toda la pantalla en computadora (pantallas grandes)** sin necesidad de scrollear en la mayoría de los casos.
   - Que la UI se **redistribuya automáticamente** si hay más partidos, pero manteniendo **una buena proporción y legibilidad**.

2. **Diseño responsive**:
   - En dispositivos móviles, quiero que la experiencia sea mucho más legible.
   - El bracket debe adaptarse bien, incluso si se hace scroll horizontal o vertical.

3. **Sidebar de navegación**:
   - Agregá una sidebar fija (en desktop, y colapsable o hamburguesa en mobile) con los siguientes accesos:
     - 👫 Parejas
     - 🏓 Partidos
     - 🧩 Zonas
     - 🏆 Llaves (Bracket)

4. **Estilos y apariencia**:
   - ⚠️ **No modifiques el estilo visual actual.** Me gusta el diseño, los colores, las líneas, las cards, los bordes, etc.
   - Usá lo que ya hay, pero reorganizá **mejor la estructura y distribución** para que sea más intuitiva.

---

## 💡 Esperado de vos (como experto frontend)

- Que reestructures el `layout` general con componentes como `<main>`, `<aside>`, `<section>` para mayor claridad.
- Que uses `flex`, `grid`, `gap`, `overflow-auto`, `vh`, `vw`, etc., para lograr un diseño fluido, sin scroll innecesario.
- Que asegures una **experiencia de usuario limpia, clara y responsiva** en todos los tamaños de pantalla.
- Que uses buenas prácticas de accesibilidad (por ejemplo, `aria-labels`, navegación por teclado).
- Que los componentes principales estén modularizados (ej: `Sidebar.tsx`, `Bracket.tsx`, `Layout.tsx`, etc.)

---

## 🧪 Recomendaciones

- Si querés usar `TailwindCSS`, podés usar `h-[100vh]` o `min-h-screen` para altura total.
- Podés considerar usar un `Drawer` o `SlideOver` para mobile si querés una sidebar colapsable.
- Mantené la simetría del bracket y su estética: solo reorganizá cómo se presenta, no el cómo se ve.

---

## 📦 Tech stack actual (por si hace falta)

- Framework: Next.js + React
- Estilos: Tailwind CSS
- Base de datos: Supabase
- Estás libre de usar librerías modernas para UI si facilitan el layout (ej: `headlessui`, `shadcn/ui`, `radix`, etc.)

---

## 📌 Resultado esperado

- Una aplicación más **usable, sin scroll innecesario**, y perfectamente distribuida tanto en desktop como en mobile.
- Una **sidebar navegable y clara**, con acceso rápido a las secciones clave.
- Un **diseño que se mantenga limpio y escalable** si agrego más zonas, partidos o datos.

