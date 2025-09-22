# WARP.md

Este archivo proporciona orientación a WARP (warp.dev) cuando trabaje con código en este repositorio.

## Comandos de desarrollo

### Flujo de trabajo básico de desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (Vite)
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

### Configuración del entorno
La aplicación requiere estas variables de entorno en `.env`:
- `VITE_SUPABASE_URL` - URL del proyecto de Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `VITE_RULES_PDF_URL` - URL del documento PDF de reglas (opcional)

## Visión general de la arquitectura

### Stack tecnológico
- **Frontend**: React 18 con JSX
- **Herramienta de build**: Vite 5
- **Estilado**: TailwindCSS con soporte para modo oscuro (`darkMode: 'class'`)
- **Base de datos**: Supabase (PostgreSQL con suscripciones en tiempo real)
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Despliegue**: Vercel

### Estructura de la aplicación
Esta es una aplicación React de página única (SPA) para un sistema de gestión de liga de fútbol fantasy llamada "Liga Jimmy Fantasy". La app muestra clasificaciones, estadísticas de participantes, sanciones/bonificaciones y reglas.

#### Estructura de componentes clave
```
src/
├── App.jsx              # Componente principal de la aplicación con toda la lógica
├── main.jsx             # Renderizado raíz de React
├── Rules.jsx            # Componente para mostrar las reglas
├── index.css            # Estilos globales e importaciones de TailwindCSS
└── components/
    ├── ConfettiButton.jsx     # Efectos de celebración
    ├── KonamiEasterEgg.jsx    # Función oculta del código Konami
    ├── PhotoCarousel.jsx      # Carrusel de imágenes para la galería
    └── ThemeToggle.jsx        # Interruptor de modo oscuro/claro
```

#### Arquitectura de datos
- **Tablas de Supabase**:
  - `participants` - Miembros de la liga con fotos e información del equipo
  - `penalties` - Bonificaciones y sanciones con cantidades y razones
  - `carousel_photos` - Imágenes de la galería para el carrusel
  - `v_ranking_official` - Vista SQL para la clasificación oficial
  - `v_stats_naughty_day` - Vista SQL para estadísticas

#### Patrones de componentes UI
- **Secciones plegables**: Cada sección principal puede expandirse/contraerse con animaciones suaves
- **Sistema de modales**: Detalles de participantes mostrados en modales responsivos
- **Diseño responsivo**: Mobile-first con breakpoints específicos
- **Modo oscuro**: Modo oscuro basado en clases con persistencia en localStorage
- **Glass Morphism**: Uso consistente de la clase `glass` para tarjetas y contenedores

### Gestión del estado
La aplicación utiliza la gestión de estado integrada de React con varias variables de estado clave:
- `participants`, `penalties`, `ranking` - Datos principales de Supabase
- Estados de secciones plegables (`collapsedRanking`, `collapsedSummary`, etc.)
- Estados de filtro y ordenación para la tabla de historial
- Estados de modales (`detailParticipant`, `lightboxUrl`)

### Características principales
1. **Sistema de clasificación en tiempo real** - Muestra podio (top 3) y "escarnio público" (últimos 2)
2. **Panel de estadísticas** - Top 2 de rendimiento en varias categorías con sistema de medallas
3. **Seguimiento de sanciones/bonificaciones** - Historial completo con filtrado y ordenación
4. **Galería de fotos** - Carrusel con fotos de participantes
5. **Modo oscuro** - Cambio de tema persistente
6. **Efectos de celebración** - Animaciones de confeti y easter eggs
7. **Modales responsivos** - Información detallada de participantes

## Directrices de desarrollo

### Arquitectura de componentes
- El `App.jsx` principal contiene la mayoría de la lógica y el estado (enfoque monolítico)
- Componentes más pequeños y reutilizables en el directorio `/components/`
- Uso de hooks de React (`useState`, `useEffect`, `useMemo`) para estado y efectos secundarios
- Framer Motion para animaciones y transiciones suaves

### Convenciones de estilado
- Clases de utilidad de TailwindCSS en toda la aplicación
- Clases CSS personalizadas definidas en `index.css`:
  - `.glass` - Efecto glass morphism para tarjetas
  - `.card-float` - Efectos hover para tarjetas
  - `.gradient-title` y `.gradient-bar` - Estilado de marca
- Diseño responsivo con breakpoints `sm:`, `md:`, `lg:`
- Clases de modo oscuro con prefijo `dark:`

### Obtención de datos
- Una sola función `load()` obtiene todos los datos al montar el componente
- Utiliza el cliente de Supabase para consultas de base de datos
- El manejo de errores envuelve todas las llamadas a la base de datos
- La transformación de datos ocurre en hooks `useMemo` de React

### Idioma español
Todo el texto dirigido al usuario, comentarios y contenido están en español. Esto incluye:
- Etiquetas de componentes y texto de la interfaz
- Nombres de campos de base de datos y contenido
- Comentarios y nombres de variables (mezcla de español e inglés)

## Ubicaciones de archivos

### Archivos de configuración
- `vite.config.js` - Configuración de Vite con alias de rutas (`@` apunta a `src/`)
- `tailwind.config.js` - Configuración de TailwindCSS con modo oscuro y plugin de tipografía
- `package.json` - Dependencias y scripts de build
- `vercel.json` - Configuración de despliegue en Vercel

### Archivos importantes
- `src/content/rules.md` - Archivo Markdown que contiene las reglas de la liga
- `src/Rules.jsx` - Componente que renderiza el markdown de reglas
- `.env` - Variables de entorno (no comprometido en git)

## Integración con Supabase

La aplicación se integra intensamente con Supabase para:
- **Datos en tiempo real** desde la base de datos PostgreSQL
- **Almacenamiento de archivos** para fotos de participantes y documentos
- **Autenticación** (aunque actualmente utiliza acceso anónimo)

Patrones clave de base de datos:
- Uso de vistas SQL (`v_ranking_official`, `v_stats_naughty_day`) para consultas complejas
- Almacenar URLs de fotos en lugar de blobs
- Mantener relaciones de datos a través de claves foráneas

## Despliegue

La aplicación está configurada para despliegue en Vercel:
- Builds automáticos desde `npm run build`
- Las variables de entorno deben configurarse en el panel de Vercel
- Servicio de archivos estáticos para la aplicación React compilada
