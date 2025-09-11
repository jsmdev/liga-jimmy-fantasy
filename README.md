
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

## Incluye
- Tema oscuro con toggle y persistencia en localStorage
- Cabecera con gradiente y efecto glass
- Tarjetas con “float hover”
- Confeti (botón y easter egg Konami)
- Carrusel de fotos (usa `participants.photo_url`)
- Tabla responsive con scroll horizontal
