# Contribución

Este proyecto sigue un flujo basado en ramas y Pull Requests. Usa Conventional Commits, ramas por feature/fix y PRs con revisión.

## Requisitos previos
- Node 18+
- npm
- Variables de entorno necesarias (ver README)

## Flujo de trabajo
1. Crea una rama desde `main`:
   - `feat/<breve-descripcion>` para nuevas funcionalidades
   - `fix/<breve-descripcion>` para correcciones
   - `docs/<breve-descripcion>` para documentación
   - `chore/<breve-descripcion>` para tareas de tooling
2. Implementa los cambios en tu rama.
3. Asegúrate de que los commits siguen Conventional Commits.
4. Abre un Pull Request hacia `main` usando la plantilla predefinida.
5. Pasa las revisiones y resuelve comentarios.
6. Squash & merge (manteniendo un mensaje de conventional commit en el merge).

## Conventional Commits
Formato: `tipo(scope opcional): descripción breve`

Tipos comunes:
- `feat`: nueva funcionalidad
- `fix`: corrección de bug
- `docs`: solo documentación
- `style`: formato/estilo sin lógica
- `refactor`: cambios internos sin alterar comportamiento
- `perf`: mejoras de rendimiento
- `test`: tests añadidos/actualizados
- `chore`: mantenimiento, tooling, build

Ejemplos:
- `feat(ui): añade carrusel de fotos con autoplay`
- `fix(data): corrige orden de ranking por fecha`
- `docs(readme): documenta variables de entorno`

## Reglas para PRs
- Título siguiendo Conventional Commits.
- Describe claramente el cambio, motivación y alcance.
- Añade capturas/GIFs si hay cambios visuales.
- Marca la checklist de la plantilla.
- Relaciona issues con `Closes #<id>` si aplica.

## Calidad y pruebas
- Ejecuta `npm run dev` y verifica que no hay errores en consola.
- Prueba modo oscuro y responsive.
- Comprueba casos vacíos y errores de red (Supabase caído, sin datos, etc.).

## Despliegue
- Los cambios en `main` se despliegan en Vercel.
- Si se requieren nuevas variables de entorno o migraciones en Supabase, documenta en el PR en la sección "Notas de despliegue".
