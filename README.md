# Liga Jimmy Fantasy – Penalizaciones (Vercel + Supabase)

Aplicación React (Vite + Tailwind) con autenticación real de Supabase y almacenamiento en Postgres.
Permite listar participantes, crear/editar/borrar penalizaciones (solo admin), ver totales y filtrar.

## Requisitos
- Node.js 18+
- Cuenta en Supabase (con proyecto y tablas configuradas)
- Variables de entorno en local y en Vercel

## Variables de entorno
Crea un archivo `.env` en la raíz con:

```
VITE_SUPABASE_URL=TU_URL_SUPABASE
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

## Desarrollo en local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Despliegue en Vercel
1. Sube el repo a GitHub.
2. En Vercel: New Project → Importa el repo.
3. En Settings → Environment Variables, añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Build command: `npm run build`, Output: `dist`.
5. (Opcional) Crea `vercel.json` con rewrites SPA.

## Notas
- El login usa Supabase Auth (email/contraseña).
- Roles en `public.profiles` (`admin`/`viewer`) controlan permisos (RLS en BD).
- El motivo de penalización es multilínea y se ajusta a varias filas.
- Los importes muestran color según signo: verde (+), negro (0), rojo (−).
