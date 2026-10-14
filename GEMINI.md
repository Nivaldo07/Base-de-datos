# Reglas Generales del Proyecto - NutriICBF

## 1. Uso Obligatorio de Sub-Agentes (Workers)
- **Delegación activa**: Para cualquier tarea intensiva de análisis, investigación, lectura o búsqueda en archivos extensos, procesamiento de datos, depuración o refactorización profunda, **SIEMPRE** se deben lanzar workers (sub-agentes mediante `invoke_subagent`).
- **Conservación de contexto**: La sesión principal debe actuar como coordinadora y sintetizadora para evitar agotar la ventana de contexto y el presupuesto de tokens.
- **Reportes estructurados**: Los workers deben devolver resúmenes técnicos precisos con hallazgos clave, causas raíz y propuestas de solución.

## 2. Arquitectura y Stack
- **Framework**: Next.js (App Router), React 19, TypeScript, Tailwind CSS v4.
- **Base de Datos**: Prisma ORM con SQLite (`prisma/dev.db`).
- **Formatos y Reportes**: Ingesta de planillas Excel (`xlsx`) y exportación oficial de minutas en PDF (`jspdf`, `jspdf-autotable`).

## 3. Manejo de Minutas ICBF y Normalización de Datos
- **Parser de Excel flexible**: Los encabezados en las plantillas oficiales del ICBF pueden contener saltos de línea internos (`\n`), espacios múltiples o dividirse en filas adyacentes (p. ej. fila 15/16). Toda normalización debe limpiar espacios en blanco (`\s+`) y realizar búsquedas insensibles a mayúsculas/acentos.
- **Persistencia de Nutrientes y Costos**: Mantener siempre la integridad de los datos de compra y nutrientes (`sodio_mg_excel`, `costo_unidad_compra`, `costo_unitario_excel`), asegurando que tanto el importador como las rutas de guardado (`POST /api/menus`) persistan estos valores sin sobreescribirlos con ceros.
