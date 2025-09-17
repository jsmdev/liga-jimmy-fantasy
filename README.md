
# ⚽ Liga Jimmy Fantasy – Versión atractiva (dark mode + confeti + carrusel)

## Requisitos
- Node 18+
- Variables `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Instalar y ejecutar
```bash
npm install
npm run dev
```

## Despliegue (Vercel)
- Añade las env vars en Vercel (Production & Preview).
- `npm run build` genera `dist` automáticamente.

## Flujo de contribución (ramas y PR)
- Trabaja siempre en ramas a partir de `main` (por ejemplo, `feat/<breve-descripcion>` o `fix/<breve-descripcion>`).
- Usa Conventional Commits en los mensajes de commit.
- Abre un Pull Request hacia `main` usando la plantilla del repositorio.
- Revisa el documento de contribución para más detalles: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Incluye
- Tema oscuro con toggle y persistencia en localStorage
- Cabecera con gradiente y efecto glass
- Tarjetas con “float hover”
- Confeti (botón y easter egg Konami)
- Carrusel de fotos (usa `participants.photo_url`)
- Tabla responsive con scroll horizontal

## Variables de entorno
Añade estas variables en `.env` (local) y en Vercel (Production & Preview):

```env
VITE_SUPABASE_URL=<url_del_proyecto_supabase>
VITE_SUPABASE_ANON_KEY=<anon_key_supabase>
# Opcional: URL pública del PDF de normativa para botón de descarga en `Rules`
VITE_RULES_PDF_URL=<url_pdf_normativa_opcional>
```

## Arquitectura
```mermaid
flowchart LR
  subgraph Browser["Navegador (SPA React 18)"]
    App["App.jsx<br/>- UI (framer-motion, lucide-react)<br/>- Estado (useState/useMemo)<br/>- Componentes UI (Card/Badge/Avatar/Select)<br/>- Carrusel (embla) y confeti"]
    CSS["Tailwind CSS 3<br/>@tailwind base/components/utilities<br/>+ estilos locales"]
  end

  Vite["Vite 5 + @vitejs/plugin-react<br/>Dev server / Build"]
  Vercel["Vercel (Hosting estático)<br/>vercel.json: rewrite SPA /(.*) -> /"]

  subgraph Supabase["Supabase (BaaS)"]
    API["@supabase/supabase-js v2<br/>Auth (anon key) + PostgREST"]
    DB(("Postgres"))
    Storage["(Opcional) Storage / CDN<br/>Imágenes"]
    V1["Tabla: participants"]
    V2["Tabla: penalties"]
    V3["Tabla: carousel_photos"]
    VW1["Vista: v_ranking_current"]
    VW2["Vista: v_stats_naughty_day"]
  end

  Browser <-- build estático --> Vercel
  Vite -->|build| Vercel

  App -->|import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY| API
  API --> DB
  API --> Storage

  App -->|SELECT| V1
  App -->|SELECT| V2
  App -->|SELECT| V3
  App -->|SELECT| VW1
  App -->|SELECT| VW2
```

## Secuencia de carga de datos
```mermaid
sequenceDiagram
  participant U as Usuario (Browser)
  participant A as App.jsx
  participant S as Supabase JS (cliente)
  participant PG as Postgres (Supabase)

  U->>A: Abre SPA en Vercel
  A->>A: setLoading(true)
  A->>S: from('participants').select(...).order('name')
  S->>PG: SELECT participants...
  PG-->>S: rows
  S-->>A: participants

  A->>S: from('penalties').select(...).order('date desc')
  S->>PG: SELECT penalties...
  PG-->>S: rows
  S-->>A: penalties

  A->>S: from('carousel_photos').select(...).eq('is_active', true).order('position')
  S->>PG: SELECT carousel_photos...
  PG-->>S: rows
  S-->>A: photos (mapeadas)

  A->>S: from('v_ranking_current').select(...).order('rank asc')
  S->>PG: SELECT v_ranking_current...
  PG-->>S: rows
  S-->>A: rankingRows

  A->>S: from('v_stats_naughty_day').select(...).order('day desc')
  S->>PG: SELECT v_stats_naughty_day...
  PG-->>S: rows
  S-->>A: naughtyDays

  A->>A: setParticipants/penalties/carousel/rankingRows/naughtyDays
  A->>A: setLoading(false)
  A-->>U: Render UI (Ranking, Historial, Estadísticas, Galería)
```
