# Resumen

- Tipo de cambio: (marca con una X)
  - [ ] feat (nueva funcionalidad)
  - [ ] fix (corrección de bug)
  - [ ] docs (documentación)
  - [ ] style (formato, estilos, sin cambios de lógica)
  - [ ] refactor (cambios internos sin cambio de comportamiento)
  - [ ] perf (mejora de rendimiento)
  - [ ] test (añade/actualiza tests)
  - [ ] chore (tareas de build, tooling, etc.)

## Descripción

Breve descripción del cambio y su motivación.

## Issue relacionada

Closes #<número>

## Capturas / Notas visuales (si aplica)

Adjunta imágenes o GIFs si ayuda a revisar el cambio.

## Checklist

- [ ] El título del PR sigue Conventional Commits (por ejemplo, `feat(ui): ...`)
- [ ] Los commits siguen Conventional Commits
- [ ] He probado localmente (`npm run dev` / `npm run build`)
- [ ] He comprobado que no rompo el modo oscuro/claro
- [ ] He revisado estados vacíos y errores de red
- [ ] He actualizado la documentación (README/CONTRIBUTING) si aplica
- [ ] He actualizado variables de entorno o anotado cambios necesarios (si aplica)

## Riesgos y mitigaciones

- Riesgos:
- Mitigaciones:

## Notas de despliegue

- [ ] No hay cambios de infraestructura
- [ ] Requiere nuevas variables de entorno
- [ ] Requiere migraciones de base de datos (Supabase)

## Checklist Supabase (si aplica)

- [ ] Tablas/vistas usadas: `participants`, `penalties`, `carousel_photos`, `v_ranking_current`, `v_stats_naughty_day`
- [ ] Reglas RLS revisadas
- [ ] Seeds/datos de demo actualizados (si procede)
