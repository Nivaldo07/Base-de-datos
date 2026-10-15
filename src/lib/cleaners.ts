/**
 * Utilidades de limpieza y normalización para minutas institucionales ICBF
 */

/**
 * Limpia cualquier palabra clave de tiempo de comida que se haya colado
 * dentro o al final del nombre de una preparación
 * (ej: "ENSALADA DE REPOLLO Y ALMUERZO ZANAHORIA" -> "ENSALADA DE REPOLLO Y ZANAHORIA",
 *      "ENSALADA DE TOMATE CON PEPINO ALMUERZO" -> "ENSALADA DE TOMATE CON PEPINO",
 *      "HUEVO COCIDO REFRIGERIO MAÑANA" -> "HUEVO COCIDO").
 */
export function cleanPreparationName(raw: string | null | undefined, fallback: string = 'PREPARACIÓN'): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/\b(REFRIGERIO\s+MAÑANA|REFRIGERIO\s+TARDE|ALMUERZO|DESAYUNO|CENA|REFRIGERIO)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned : fallback;
}

/**
 * Verifica si un texto es exactamente una palabra clave de tiempo de comida
 */
export function isMealKeyword(text: string | null | undefined): boolean {
  if (!text) return false;
  const u = text.trim().toUpperCase();
  return /^(REFRIGERIO(\s+MAÑANA|\s+TARDE)?|ALMUERZO|DESAYUNO|CENA)$/i.test(u);
}
