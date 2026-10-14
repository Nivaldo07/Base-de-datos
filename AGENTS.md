<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas Generales del Proyecto - NutriICBF

## Uso Obligatorio de Sub-Agentes (Workers)
- **Delegación activa**: Para tareas de análisis exhaustivo, investigación, lectura de archivos extensos, procesamiento de datos, depuración o refactorización, **SIEMPRE** se deben lanzar workers (sub-agentes) para evitar agotar el contexto y los tokens de la sesión principal. La sesión principal coordina y sintetiza.
- **Persistencia de Nutrientes y Costos**: En la importación y persistencia de minutas ICBF (`xlsx`), asegurar que campos como `sodio_mg_excel`, `costo_unidad_compra` y `costo_unitario_excel` no se pierdan ni se sobreescriban con ceros debido a saltos de línea (`\n`) en encabezados de Excel.

