import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface DiaProyeccionExcel {
  diaSemana: string;
  numeroDiaCiclo: number;
  activo: boolean;
  motivoAnulacion?: string;
  items: Array<{
    nombre: string;
    gMenor: number;
    gMayor: number;
    totalMenor: number;
    totalMayor: number;
    totalDia: number;
    tiempo?: string;
  }>;
}

export interface ItemPlanillaExcel {
  producto: string;
  totalGramos: number;
  unidad?: string;
  presentacionGramos?: number;
  empaquesSugeridos?: number;
}

export interface MetadatosPlanillaExcel {
  eas: string;
  nit: string;
  contrato: string;
  municipio: string;
  nombreUds: string;
  madreComunitaria: string;
  codigoUds?: string;
  fechaEntrega: string;
  diasCicloTexto: string;
  fechaInicio: string;
  fechaFin: string;
  menores3: number;
  mayores3: number;
  totalNinos: number;
  logoBase64?: string;
}

export interface SemanaProyeccionExcel {
  numeroSemana: number;
  dias: DiaProyeccionExcel[];
  consolidado: ItemPlanillaExcel[];
  meta: MetadatosPlanillaExcel;
}

/**
 * Genera la estructura de filas para una hoja diaria de menú (idéntica a la plantilla ICBF)
 */
function construirHojaDiariaMenu(dia: DiaProyeccionExcel): XLSX.WorkSheet {
  const wsData: any[][] = [];

  // Fila 1: Título del menú
  wsData.push([null, `MENU ${dia.numeroDiaCiclo}`]);

  // Fila 2: Sub-encabezados de grupos y totales
  wsData.push([
    null,
    'NIÑOS MENORES DE 3 AÑOS',
    null,
    null,
    'NIÑO MENOR DE 5 AÑOS',
    null,
    null,
    'MENOR DE 3',
    'MAYOR DE 3',
    'TOTAL',
  ]);

  if (!dia.activo) {
    wsData.push([
      null,
      `DÍA ANULADO: ${dia.motivoAnulacion || 'Festivo / No Laboral'}`,
      0,
      null,
      `DÍA ANULADO: ${dia.motivoAnulacion || 'Festivo / No Laboral'}`,
      0,
      null,
      0,
      0,
      0,
    ]);
  } else {
    // Filas de ingredientes (Col B a Col J)
    dia.items.forEach((item) => {
      wsData.push([
        null,
        item.nombre,
        item.gMenor,
        null,
        item.nombre,
        item.gMayor,
        null,
        item.totalMenor,
        item.totalMayor,
        item.totalDia,
      ]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 3 },  // Col A
    { wch: 42 }, // Col B: Nombre menor 3
    { wch: 12 }, // Col C: Gramos menor 3
    { wch: 3 },  // Col D: Separador
    { wch: 42 }, // Col E: Nombre mayor 3
    { wch: 12 }, // Col F: Gramos mayor 3
    { wch: 3 },  // Col G: Separador
    { wch: 14 }, // Col H: Total menor 3
    { wch: 14 }, // Col I: Total mayor 3
    { wch: 14 }, // Col J: Total día
  ];

  ws['!pageSetup'] = { paperSize: 1, orientation: 'landscape', fitToWidth: 1, fitToHeight: 1 };
  ws['!margins'] = { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };

  return ws;
}

/**
 * Genera la estructura de filas para la hoja final oficial de la Madre Comunitaria
 */
function construirHojaMadreComunitaria(
  consolidado: ItemPlanillaExcel[],
  meta: MetadatosPlanillaExcel
): XLSX.WorkSheet {
  const planillaRows: any[][] = [];

  // Fila 1 (A1 / B1): Encabezado institucional con saltos de línea oficiales idénticos a la muestra ICBF
  const textoLegalEncabezado =
    `PLANILLA DE ENTREGA DE ALIMENTOS\r\n` +
    `ENTIDAD ADMINISTRADORA DEL SERVICIO: ${meta.eas || 'ASOCIACION DE FAMILIA DE HCB DE CAIMITO-SUCRE'}\r\n` +
    `NIT: ${meta.nit || '8230002828 - 6'}\r\n` +
    `CONTRATO N°: ${meta.contrato || '70005732024'}\r\n` +
    `MUNICIPIO: ${meta.municipio || 'CAIMITO-SUCRE'}\r\n` +
    `NOMBRE DEL HCB: ${meta.nombreUds || 'Travesuras Infantiles'}\r\n` +
    `NOMBRE DE LA MADRE COMUNITARIA: ${meta.madreComunitaria || 'Ana Acevedo'}\r\n\r\n` +
    `El día ${meta.fechaEntrega || '26 del mes 09 del año 2026'} se hizo la entrega a la madre comunitaria los productos alimenticos establecidos en la minuta patrón y lista  de compra, para la preparación  de los alimentos de los niños y niñas beneficiarios de la modalidad HCB; los cuales se relacionan a continuación: menú ${meta.diasCicloTexto || '21 - 25'}, semana del ${meta.fechaInicio || '28 de septiembre'} hasta el ${meta.fechaFin || '2 de octubre de 2026'}`;

  // Fila 1
  planillaRows.push([null, textoLegalEncabezado]);

  // Fila vacía entre encabezado y tabla (reducido de 3 filas a 1 sola para que quepa en 1 hoja Carta)
  planillaRows.push([]);

  // Fila: Encabezados de productos oficiales
  planillaRows.push([null, 'PRODUCTO', 'UNIDAD DE MEDIDA ( GRAMOS- ML)']);

  // Filas de productos consolidados (sin duplicados)
  consolidado.forEach((prod) => {
    planillaRows.push([null, prod.producto, prod.totalGramos]);
  });

  // Fila de firmas al final (compacta, sin saltos de línea gigantes)
  planillaRows.push([]);
  planillaRows.push([
    null,
    'RECIBIO A SATISFACCION: ____________________________________',
    'ENTREGO: ____________________________________',
  ]);
  planillaRows.push([
    null,
    `Madre Comunitaria: ${meta.madreComunitaria || 'Ana Acevedo'}`,
    'Nutricionista / Supervisor ICBF / EAS',
  ]);

  const wsPlanilla = XLSX.utils.aoa_to_sheet(planillaRows);

  // Asegurar que tanto A1 como B1 contengan el texto legal completo
  wsPlanilla['A1'] = { t: 's', v: textoLegalEncabezado };
  wsPlanilla['B1'] = { t: 's', v: textoLegalEncabezado };

  wsPlanilla['!cols'] = [
    { wch: 4 },  // Col A
    { wch: 55 }, // Col B: Producto
    { wch: 35 }, // Col C: Unidad de Medida (Gramos - mL)
  ];

  wsPlanilla['!pageSetup'] = { paperSize: 1, orientation: 'portrait', fitToWidth: 1, fitToHeight: 1 };
  wsPlanilla['!margins'] = { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };

  return wsPlanilla;
}

/**
 * Parchea el XML de una hoja de cálculo para forzar ajuste a 1 página (Letter, fitToPage)
 * según el estándar OpenXML (ECMA-376).
 */
function patchSheetXml(xml: string, orientation: 'landscape' | 'portrait'): string {
  // 1. <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  // En OpenXML, sheetPr DEBE ir antes de dimension, sheetViews, etc.
  if (xml.includes('<sheetPr')) {
    if (!xml.includes('<pageSetUpPr')) {
      xml = xml.replace(/(<sheetPr[^>]*>)/, '$1<pageSetUpPr fitToPage="1"/>');
    } else {
      xml = xml.replace(/<pageSetUpPr[^>]*\/>/, '<pageSetUpPr fitToPage="1"/>');
    }
  } else {
    xml = xml.replace(/(<worksheet[^>]*>)/, '$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
  }

  // 2. Eliminar pageMargins y pageSetup previos si existen
  xml = xml.replace(/<pageMargins[^>]*\/>/g, '');
  xml = xml.replace(/<pageSetup[^>]*\/>/g, '');

  // 3. Insertar configuración de márgenes y tamaño Carta (paperSize: 1, fitToWidth: 1, fitToHeight: 1)
  const pageSetupTags = `<pageMargins left="0.4" right="0.4" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="1" orientation="${orientation}" fitToWidth="1" fitToHeight="1"/>`;

  const insertRegex = /(<headerFooter|<rowBreaks|<colBreaks|<customProperties|<cellWatches|<ignoredErrors|<smartTags|<drawing|<legacyDrawing|<\/worksheet)/;
  if (insertRegex.test(xml)) {
    xml = xml.replace(insertRegex, `${pageSetupTags}$1`);
  } else {
    xml = xml.replace('</worksheet>', `${pageSetupTags}</worksheet>`);
  }

  return xml;
}

/**
 * Empaqueta el workbook en XLSX, parchea los XML de cada hoja con JSZip para fitToPage (Letter)
 * y descarga el archivo resultante mediante Blob en el navegador.
 */
async function descargarWorkbookParcheado(wb: XLSX.WorkBook, filename: string): Promise<Uint8Array> {
  const rawData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const zip = await JSZip.loadAsync(rawData);

  // Leer mapeo de hojas en xl/workbook.xml y xl/_rels/workbook.xml.rels
  const wbXml = (await zip.file('xl/workbook.xml')?.async('text')) || '';
  const relsXml = (await zip.file('xl/_rels/workbook.xml.rels')?.async('text')) || '';

  const sheetRegex = /<sheet\s+[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/?>|<sheet\s+[^>]*r:id="([^"]+)"[^>]*name="([^"]+)"[^>]*\/?>/g;
  let match: RegExpExecArray | null;
  const sheetRIds = new Map<string, string>();
  while ((match = sheetRegex.exec(wbXml)) !== null) {
    const name = match[1] || match[4];
    const rId = match[2] || match[3];
    if (name && rId) {
      sheetRIds.set(rId, name);
    }
  }

  const relRegex = /<Relationship\s+[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  const sheetFiles = new Map<string, string>();
  while ((match = relRegex.exec(relsXml)) !== null) {
    const rId = match[1];
    const target = match[2];
    if (sheetRIds.has(rId)) {
      const sheetName = sheetRIds.get(rId)!;
      const zipPath = target.startsWith('xl/') ? target : `xl/${target}`;
      sheetFiles.set(sheetName, zipPath);
    }
  }

  // Fallback si alguna hoja no fue resuelta en rels
  wb.SheetNames.forEach((name, index) => {
    if (!sheetFiles.has(name)) {
      sheetFiles.set(name, `xl/worksheets/sheet${index + 1}.xml`);
    }
  });

  // Parchear cada hoja según su tipo
  for (const [sheetName, zipPath] of sheetFiles.entries()) {
    const file = zip.file(zipPath);
    if (!file) continue;

    let xml = await file.async('text');
    // Para hojas diarias (MENU X): orientation="landscape" (orientación horizontal)
    // Para hojas de entrega (ANA ACEVEDO, etc.): orientation="portrait" (orientación vertical)
    const isMenuDiario = sheetName.trim().toUpperCase().startsWith('MENU');
    const orientation = isMenuDiario ? 'landscape' : 'portrait';

    xml = patchSheetXml(xml, orientation);
    zip.file(zipPath, xml);
  }

  // Asegurar cualquier otro archivo sheet*.xml residual
  const worksheetFiles = zip.file(/^xl\/worksheets\/sheet\d+\.xml$/);
  for (const wsFile of worksheetFiles) {
    let xml = await wsFile.async('text');
    if (!xml.includes('pageSetup paperSize="1"')) {
      xml = patchSheetXml(xml, 'portrait');
      zip.file(wsFile.name, xml);
    }
  }

  const modifiedBytes = await zip.generateAsync({
    type: 'uint8array',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([modifiedBytes as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return modifiedBytes;
}

/**
 * Genera el archivo Excel oficial para una semana (5 días + Hoja de la Madre Comunitaria)
 * Estructura 100% idéntica a la plantilla oficial ICBF:
 * - Hojas 1 a 5: "MENU 21", "MENU 22", ... (Landscape, Letter, 1 página)
 * - Hoja final: Nombre de la Madre Comunitaria en MAYÚSCULAS (Portrait, Letter, 1 página)
 */
export async function generarExcelProyeccionYPlanilla(
  dias: DiaProyeccionExcel[],
  consolidado: ItemPlanillaExcel[],
  meta: MetadatosPlanillaExcel
): Promise<Uint8Array> {
  const wb = XLSX.utils.book_new();

  // 1. GENERAR PESTAÑAS DIARIAS (MENU 21 a MENU 25 o según corresponda)
  dias.forEach((dia) => {
    const sheetName = `MENU ${dia.numeroDiaCiclo}`.slice(0, 31);
    const ws = construirHojaDiariaMenu(dia);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // 2. GENERAR HOJA FINAL: Nombre de la Madre Comunitaria en MAYÚSCULAS
  const nombreHojaMadre = (meta.madreComunitaria || 'PLANILLA DE ENTREGA')
    .trim()
    .toUpperCase()
    .slice(0, 31);

  const wsPlanilla = construirHojaMadreComunitaria(consolidado, meta);
  XLSX.utils.book_append_sheet(wb, wsPlanilla, nombreHojaMadre);

  // 3. DESCARGAR ARCHIVO EXCEL PARCHEADO (Letter, fitToPage 1 página)
  const safeName = (meta.nombreUds || 'UDS').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeMadre = (meta.madreComunitaria || 'Madre').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Planilla_Entrega_${safeName}_${safeMadre}_Menus_${meta.diasCicloTexto.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;

  return await descargarWorkbookParcheado(wb, filename);
}

/**
 * Genera el archivo Excel oficial para el CICLO COMPLETO (5 Semanas)
 * Contiene todas las hojas diarias de los 25 días (MENU 1 a MENU 25)
 * y las 5 planillas oficiales de entrega de cada semana identificadas por semana.
 */
export async function generarExcelCicloCompleto(
  semanas: SemanaProyeccionExcel[],
  metaGlobal: MetadatosPlanillaExcel
): Promise<Uint8Array> {
  const wb = XLSX.utils.book_new();
  const nombreMadreUpper = (metaGlobal.madreComunitaria || 'MADRE COMUNITARIA')
    .trim()
    .toUpperCase();

  // 1. Recorrer cada una de las 5 semanas
  semanas.forEach((sem) => {
    // A. Agregar las hojas diarias de la semana (ej. MENU 1..5, MENU 6..10, etc.)
    sem.dias.forEach((dia) => {
      const sheetName = `MENU ${dia.numeroDiaCiclo}`.slice(0, 31);
      const ws = construirHojaDiariaMenu(dia);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // B. Agregar la hoja de planilla oficial para esta semana
    const nombreHojaSemana = `${nombreMadreUpper.slice(0, 20)} - S${sem.numeroSemana}`.slice(0, 31);
    const wsPlanilla = construirHojaMadreComunitaria(sem.consolidado, sem.meta);
    XLSX.utils.book_append_sheet(wb, wsPlanilla, nombreHojaSemana);
  });

  // 2. Consolidado Total del Ciclo Completo (5 Semanas)
  const mapaCicloCompleto = new Map<string, number>();
  semanas.forEach((sem) => {
    sem.consolidado.forEach((prod) => {
      const actual = mapaCicloCompleto.get(prod.producto) || 0;
      mapaCicloCompleto.set(prod.producto, actual + prod.totalGramos);
    });
  });

  const consolidadoCicloRows: any[][] = [];
  consolidadoCicloRows.push([
    null,
    `CONSOLIDADO TOTAL - CICLO COMPLETO DE MENÚS (5 SEMANAS / 25 DÍAS)`,
  ]);
  consolidadoCicloRows.push([null, `UDS: ${metaGlobal.nombreUds} - Madre: ${metaGlobal.madreComunitaria}`]);
  consolidadoCicloRows.push([]);
  consolidadoCicloRows.push([null, 'PRODUCTO', 'TOTAL GRAMOS (5 SEMANAS)', 'TOTAL KILOS']);

  const prodsOrdenados = Array.from(mapaCicloCompleto.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], 'es', { sensitivity: 'base' })
  );

  prodsOrdenados.forEach(([prod, gramos]) => {
    consolidadoCicloRows.push([
      null,
      prod,
      Math.round(gramos * 10) / 10,
      Number((gramos / 1000).toFixed(2)),
    ]);
  });

  const wsConsolidadoCiclo = XLSX.utils.aoa_to_sheet(consolidadoCicloRows);
  wsConsolidadoCiclo['!cols'] = [{ wch: 4 }, { wch: 55 }, { wch: 30 }, { wch: 20 }];
  wsConsolidadoCiclo['!pageSetup'] = { paperSize: 1, orientation: 'portrait', fitToWidth: 1, fitToHeight: 1 };
  wsConsolidadoCiclo['!margins'] = { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };
  XLSX.utils.book_append_sheet(wb, wsConsolidadoCiclo, 'CONSOLIDADO CICLO 5 SEM');

  // 3. Descargar archivo parcheado
  const safeName = (metaGlobal.nombreUds || 'UDS').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeMadre = (metaGlobal.madreComunitaria || 'Madre').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Proyeccion_Compras_CicloCompleto_5Semanas_${safeName}_${safeMadre}.xlsx`;

  return await descargarWorkbookParcheado(wb, filename);
}
