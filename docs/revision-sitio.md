# Revisión del sitio — osmanventures.io

> Fecha: 2026-06-03
> Estado del build: `next build` ✅ compila correctamente
> Estado del lint: `npm run lint` ❌ **13 errores, 1 warning**

Este documento registra lo que **no funciona** o representa un riesgo en el sitio, y propone un **plan de acción priorizado** para resolverlo.

---

## 1. Problema principal: el formulario "Get in Touch" no envía mensajes

### Síntoma
Al enviar el formulario de contacto, la consola del navegador muestra:

```
POST https://formspree.io/f/xyzaqnnq 404 (Not Found)
```

El botón cambia a **"Error — try again"** y el mensaje nunca llega.

### Causa raíz
El componente `src/components/Contact.tsx` (línea 22) envía el formulario a un
endpoint de Formspree que **no existe**:

```ts
const response = await fetch("https://formspree.io/f/xyzaqnnq", { ... });
```

El identificador `xyzaqnnq` es un **valor de marcador de posición (placeholder)**,
no un formulario real creado en una cuenta de Formspree. Por eso Formspree
responde `404 Not Found`: no hay ningún formulario asociado a ese ID. El código
del front-end está bien escrito (maneja estados `loading`/`success`/`error`),
pero apunta a un destino inexistente.

### Opciones de solución

| Opción | Qué implica | Pros | Contras |
|--------|-------------|------|---------|
| **A. Formspree real (rápida)** | Crear un formulario gratis en [formspree.io](https://formspree.io), copiar el ID real (ej. `mwpevabc`) y reemplazar `xyzaqnnq` en `Contact.tsx`. | 5 min, sin backend, gratis hasta 50 envíos/mes. | Dependes de un tercero; límite en plan free; marca Formspree en correos. |
| **B. Route Handler + Resend** | Crear `src/app/api/contact/route.ts` que reciba el POST y envíe el correo con [Resend](https://resend.com) (o Nodemailer). El form apunta a `/api/contact`. | Control total, sin marca de terceros, dominio propio. | Requiere API key de Resend + verificar dominio; un poco más de código. |
| **C. Guardar en Supabase** | El form inserta el mensaje en una tabla de Supabase (`contact_messages`) vía Route Handler. | Ya usas Supabase en otros proyectos; historial consultable. | No te avisa por correo (salvo trigger/Edge Function adicional). |

**Recomendación:** Opción **A** para restaurar el servicio **hoy mismo**, y migrar
a **B** cuando quieras correos con tu propio dominio (`osman@osmanventures.io`).

> ✅ **Implementado en este PR (Opción B — Route Handler + Resend).**
> Ver `src/app/api/contact/route.ts` y los cambios en `Contact.tsx`. Para que
> funcione en producción debes configurar en Vercel:
>
> 1. Crear una cuenta y API key en [resend.com](https://resend.com) y verificar
>    tu dominio `osmanventures.io`.
> 2. En **Vercel → Project → Settings → Environment Variables** añadir:
>    - `RESEND_API_KEY` (obligatoria)
>    - `CONTACT_FROM_EMAIL` (ej. `Osman Ventures <hello@osmanventures.io>`, debe
>      estar en el dominio verificado)
>    - `CONTACT_TO_EMAIL` (opcional, por defecto `osman@osmanventures.io`)
> 3. Mientras pruebas, puedes usar el remitente compartido de Resend
>    `onboarding@resend.dev` sin verificar dominio.
>
> Ver `.env.example` para la lista completa. El endpoint valida los campos,
> incluye un honeypot anti-spam y usa `replyTo` para que puedas responder
> directamente al remitente.

### Mejoras adicionales al formulario (independientes de la opción elegida)
- Falta el header `Accept: application/json` en el `fetch`; Formspree lo
  recomienda para devolver JSON en vez de una redirección.
- El estado `"error"` se queda fijo: no hay `setTimeout` para volver a `"idle"`
  como sí ocurre en el caso de éxito. El usuario debe reintentar a ciegas.
- No hay protección anti-spam (honeypot / reCAPTCHA), lo que con un endpoint
  público puede llenar tu bandeja de basura.
- No se muestra al usuario el mensaje de error real (solo el texto del botón).

---

## 2. `npm run lint` falla con 13 errores (rompe CI)

`next build` pasa, pero **`npm run lint` falla**. Si tu pipeline de CI/CD (o
Vercel con lint activado) ejecuta el lint, los despliegues se bloquearán.

### 2.1 Hydration mismatch en `Hero.tsx` (bug real)
`src/components/Hero.tsx` (líneas ~38-46) usa `Math.random()` directamente
durante el render para posicionar las partículas:

```tsx
{[...Array(20)].map((_, i) => (
  <div style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, ... }} />
))}
```

- ESLint lo marca como **error** (`react-hooks/purity`: "Cannot call impure
  function during render").
- Más importante: provoca un **desajuste de hidratación** (hydration mismatch),
  porque el HTML que genera el servidor usa valores aleatorios distintos a los
  que genera el cliente. Esto produce warnings de React en consola y un parpadeo
  al cargar.

**Fix sugerido:** generar las posiciones una sola vez en un `useState`/`useMemo`
inicializado dentro de `useEffect` (solo cliente), o precomputar un array fijo de
posiciones. Así el render es determinista.

### 2.2 Etiquetas decorativas `// Sección` tratadas como comentarios
Los encabezados decorativos tipo `<p>// Projects</p>` disparan la regla
`react/jsx-no-comment-textnodes` porque el texto empieza con `//` y parece un
comentario de JS. Afecta a:

- `src/components/Projects.tsx:140` → `// Projects`
- `src/components/Services.tsx:71` → `// Services`
- `src/components/Skills.tsx:85` → `// Skills`
- (y el mismo patrón en `About.tsx`, `Experience.tsx`, `Contact.tsx`)

**Fix sugerido:** envolver el texto en una expresión para que no se interprete
como comentario, p. ej. `<p>{"// Projects"}</p>`.

### 2.3 `<img>` en lugar de `next/image` (warning)
`src/components/Projects.tsx:167` usa `<img>` para las capturas de proyectos.
ESLint avisa que `<img>` empeora el LCP y el ancho de banda.

**Fix sugerido:** migrar a `<Image>` de `next/image` (recordando que esta versión
de Next puede tener una API distinta — revisar `node_modules/next/dist/docs/`
antes de cambiar, según indica `AGENTS.md`).

---

## 3. Observaciones menores (no bloquean, pero conviene atender)

- **SEO/Open Graph:** `src/app/layout.tsx` define `openGraph` y `twitter` con
  `summary_large_image`, pero **no hay imagen OG** ni `metadataBase`. Al
  compartir el enlace no se mostrará una vista previa con imagen.
- **Datos de contacto duplicados:** el correo `osman@osmanventures.io` y el
  GitHub `18041987op` están repetidos en `Contact.tsx` y `Footer.tsx`. Conviene
  centralizarlos en una constante para evitar inconsistencias futuras.
- **README genérico:** sigue siendo la plantilla por defecto de `create-next-app`;
  no describe el proyecto real.

---

## 4. Plan de acción priorizado

| # | Prioridad | Tarea | Archivo(s) | Esfuerzo |
|---|-----------|-------|------------|----------|
| 1 | 🔴 Alta | ✅ **Hecho** — Formulario migrado a Route Handler + Resend (`/api/contact`), reemplazando el endpoint roto de Formspree. *(Falta configurar las env vars en Vercel.)* | `src/app/api/contact/route.ts`, `src/components/Contact.tsx` | — |
| 2 | 🔴 Alta | ✅ **Hecho** — `Accept: application/json`, reset del estado `error` con timeout y honeypot anti-spam. | `src/components/Contact.tsx` | — |
| 3 | 🟠 Media | Corregir el hydration mismatch de las partículas (`Math.random` fuera del render). | `src/components/Hero.tsx` | 20 min |
| 4 | 🟠 Media | Corregir los errores de lint `jsx-no-comment-textnodes` en las etiquetas `// Sección`. | `Projects/Services/Skills/About/Experience/Contact.tsx` | 10 min |
| 5 | 🟡 Baja | Migrar `<img>` a `next/image` en las tarjetas de proyectos. | `src/components/Projects.tsx` | 20 min |
| 6 | 🟡 Baja | Añadir imagen OG + `metadataBase` para vistas previas al compartir. | `src/app/layout.tsx`, `public/` | 30 min |
| 7 | — | ✅ **Hecho** — Backend del formulario implementado con Route Handler + Resend (Opción B). | `src/app/api/contact/route.ts` | — |
| 8 | 🟢 Opcional | Centralizar datos de contacto y actualizar el README. | varios | 30 min |

### Orden recomendado
1. **Hoy:** tareas 1 y 2 → el formulario vuelve a funcionar.
2. **Esta semana:** tareas 3 y 4 → `npm run lint` pasa en verde y se elimina el
   parpadeo de hidratación.
3. **Cuando haya tiempo:** tareas 5-8 → pulido de rendimiento, SEO y robustez.

---

## Anexo: cómo reproducir y verificar

```bash
npm install
npm run build   # debe pasar ✅
npm run lint    # actualmente falla con 13 errores ❌ (objetivo: 0)
npm run dev     # probar el formulario en http://localhost:3000/#contact
```
