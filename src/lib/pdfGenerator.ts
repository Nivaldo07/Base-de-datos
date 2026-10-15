import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AlimentoTCAC {
  id: number;
  codigo_icbf: string | null;
  nombre: string;
  grupo_alimento: string;
  porcentaje_comestible: number;
  energia_kcal: number;
  proteina_g: number;
  grasa_g: number;
  carbohidratos_g: number;
  hierro_mg: number;
  calcio_mg: number;
  zinc_mg: number;
  vitamina_a_rae: number;
  presentacion_comercial_gramos: number;
  tipo_empaque: string;
}

interface MetaRIEN {
  id: number;
  grupo_poblacional: string;
  tiempo_comida: string;
  kcal_meta: number;
  proteina_meta: number;
  hierro_meta: number;
  vitamina_a_meta: number;
}

interface CalculatedItem {
  alim: AlimentoTCAC;
  gramosNetos: number;
  pesoBruto: number;
  factorDesecho: string;
  kcal: number;
  proteina: number;
  hierro: number;
  vitaminaA: number;
}

/**
 * GENERADOR 1: Minuta Patrón Oficial para Interventoría ICBF
 */
export function generarPDFMinutaPatron(
  nombreMinuta: string,
  modalidad: string,
  meta: MetaRIEN,
  items: CalculatedItem[],
  totales: { kcal: number; proteina: number; hierro: number; vitaminaA: number },
  adecuacion: {
    kcal: { pct: number; label: string };
    proteina: { pct: number; label: string };
    hierro: { pct: number; label: string };
    vitaminaA: { pct: number; label: string };
  }
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Encabezado institucional ICBF
  doc.setFillColor(4, 120, 87); // Emerald 700
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTITUTO COLOMBIANO DE BIENESTAR FAMILIAR', 105, 11, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('FORMATO OFICIAL DE MINUTA PATRÓN E INTERVENTORÍA NUTRIONAL (TCAC / RIEN)', 105, 18, { align: 'center' });

  // Metadatos de la minuta
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Minuta: ${nombreMinuta}`, 14, 33);

  autoTable(doc, {
    startY: 37,
    head: [['Modalidad ICBF', 'Grupo Poblacional Target', 'Tiempo de Comida / Ración', 'Fecha de Emisión']],
    body: [[modalidad, meta.grupo_poblacional, meta.tiempo_comida, new Date().toLocaleDateString('es-CO')]],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  // Tabla de Semáforo de Adecuación Nutricional (RIEN)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const lastY = (doc as any).lastAutoTable.finalY || 55;
  doc.text('1. Evaluación de Adecuación Nutricional (Semáforo ICBF 90% - 110%)', 14, lastY + 8);

  autoTable(doc, {
    startY: lastY + 11,
    head: [['Nutriente Crítico', 'Aporte Obtenido', 'Meta RIEN', '% Adecuación', 'Dictamen ICBF']],
    body: [
      ['Energía (Kcal)', `${totales.kcal.toFixed(1)} kcal`, `${meta.kcal_meta} kcal`, `${adecuacion.kcal.pct}%`, adecuacion.kcal.label],
      ['Proteína (g)', `${totales.proteina.toFixed(1)} g`, `${meta.proteina_meta} g`, `${adecuacion.proteina.pct}%`, adecuacion.proteina.label],
      ['Hierro (mg)', `${totales.hierro.toFixed(2)} mg`, `${meta.hierro_meta} mg`, `${adecuacion.hierro.pct}%`, adecuacion.hierro.label],
      ['Vitamina A (µg RAE)', `${totales.vitaminaA.toFixed(1)} µg`, `${meta.vitamina_a_meta} µg`, `${adecuacion.vitaminaA.pct}%`, adecuacion.vitaminaA.label],
    ],
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5 },
  });

  // Tabla de Detalle Bromatológico por Ingrediente
  const lastY2 = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Desglose Bromatológico e Ingredientes del Plato (TCAC)', 14, lastY2 + 8);

  const tableBody = items.map((i) => [
    i.alim.codigo_icbf || `#${i.alim.id}`,
    i.alim.nombre,
    i.alim.grupo_alimento,
    `${i.gramosNetos} g`,
    `${i.alim.porcentaje_comestible}%`,
    `${i.pesoBruto} g`,
    `${i.kcal.toFixed(1)}`,
    `${i.proteina.toFixed(1)} g`,
    `${i.hierro.toFixed(2)} mg`,
    `${i.vitaminaA.toFixed(1)} µg`,
  ]);

  autoTable(doc, {
    startY: lastY2 + 11,
    head: [['Cód TCAC', 'Ingrediente', 'Grupo', 'Neto', '% Comest', 'Bruto', 'Kcal', 'Prot', 'Fe', 'Vit A']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // Sección de Firmas Oficiales de Interventoría
  const lastY3 = (doc as any).lastAutoTable.finalY || 200;
  const signatureY = Math.max(lastY3 + 25, 240);

  doc.setLineWidth(0.5);
  doc.setDrawColor(100, 116, 139);

  // Firma 1: Nutricionista
  doc.line(15, signatureY, 65, signatureY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Nutricionista Formulador(a)', 40, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('T.P. / Registro Profesional', 40, signatureY + 8, { align: 'center' });

  // Firma 2: Coordinador Operativo EAS
  doc.line(80, signatureY, 130, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text('Coordinador Operativo EAS', 105, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Operador de Servicios ICBF', 105, signatureY + 8, { align: 'center' });

  // Firma 3: Supervisor / Interventor ICBF
  doc.line(145, signatureY, 195, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text('Supervisor / Interventor ICBF', 170, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Centro Zonal ICBF', 170, signatureY + 8, { align: 'center' });

  // Descargar archivo PDF
  doc.save(`Minuta_Patron_${nombreMinuta.replace(/\s+/g, '_')}.pdf`);
}

/**
 * GENERADOR 2: Lista Consolidada de Compras a Proveedores (Empaques Comerciales)
 */
export function generarPDFListaCompras(
  nombreMinuta: string,
  numNinos: number,
  numDias: number,
  items: CalculatedItem[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Encabezado
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE COMPRA Y CONSOLIDADO LOGÍSTICO ICBF', 105, 11, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CÁLCULO DE REQUERIMIENTOS BRUTOS Y PRESENTACIONES COMERCIALES REDONDEADAS', 105, 18, { align: 'center' });

  // Parámetros de la orden
  autoTable(doc, {
    startY: 30,
    head: [['Minuta Referencia', 'Censo Beneficiarios', 'Días de Atención', 'Total Raciones Mes']],
    body: [[nombreMinuta, `${numNinos} niños/as`, `${numDias} días`, `${numNinos * numDias} raciones`]],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  // Tabla de compras
  const lastY = (doc as any).lastAutoTable.finalY || 50;

  const tableBody = items.map((i) => {
    const totalNetoGramos = i.gramosNetos * numNinos * numDias;
    const totalBrutoGramos = Math.round((totalNetoGramos / i.alim.porcentaje_comestible) * 100);
    const unidadesComerciales = Math.ceil(totalBrutoGramos / i.alim.presentacion_comercial_gramos);

    return [
      i.alim.codigo_icbf || `#${i.alim.id}`,
      i.alim.nombre,
      i.alim.grupo_alimento,
      `${(totalNetoGramos / 1000).toFixed(2)} kg`,
      `${(totalBrutoGramos / 1000).toFixed(2)} kg`,
      `${i.alim.presentacion_comercial_gramos}g (${i.alim.tipo_empaque})`,
      `${unidadesComerciales} ${i.alim.tipo_empaque}`,
    ];
  });

  autoTable(doc, {
    startY: lastY + 6,
    head: [['Código', 'Alimento', 'Grupo', 'Neto Total', 'Bruto a Comprar', 'Presentación Comercial', 'Unidades a Adquirir (Techo)']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
  });

  const lastY2 = (doc as any).lastAutoTable.finalY || 180;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('* Los cálculos de compra aplican la regla obligatoria de redondeo normativo superior (función techo ceil) para garantizar abastecimiento.', 14, lastY2 + 8);

  doc.save(`Orden_de_Compra_ICBF_${nombreMinuta.replace(/\s+/g, '_')}.pdf`);
}

/**
 * GENERADOR 3: Planilla de Entrega de Raciones con Espacio de Firmas de Acudientes
 */
export function generarPDFPlanillaEntrega(
  nombreMinuta: string,
  modalidad: string,
  numNinos: number
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Encabezado Institucional Horizontal
  doc.setFillColor(4, 120, 87);
  doc.rect(0, 0, 297, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PLANILLA DE ENTREGA Y CONTROL FÍSICO DE RACIONES ALIMENTARIAS (ICBF)', 148.5, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Modalidad: ${modalidad} — Minuta: ${nombreMinuta} — Periodo: ${new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`, 148.5, 17, { align: 'center' });

  // Filas de registro para firmas de acudientes
  const rows = [];
  const limit = Math.min(numNinos, 15); // 15 filas por planilla
  for (let i = 1; i <= limit; i++) {
    rows.push([
      `${i}`,
      '', // Nombre del niño/beneficiario
      '', // Documento ID
      nombreMinuta,
      new Date().toLocaleDateString('es-CO'),
      '', // Nombre del Acudiente
      '', // Espacio para Firma
    ]);
  }

  autoTable(doc, {
    startY: 26,
    head: [['N°', 'Nombre del Beneficiario (Niño/a)', 'Documento de Identidad', 'Ración / Minuta Entregada', 'Fecha de Entrega', 'Nombre del Acudiente / Responsable', 'Firma del Acudiente / Huella']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 3, minCellHeight: 9 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 50 },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 55 },
      6: { cellWidth: 40 },
    },
  });

  const lastY = (doc as any).lastAutoTable.finalY || 180;
  const signatureY = Math.min(lastY + 15, 190);

  // Verificación y firmas al pie de la planilla
  doc.setLineWidth(0.4);
  doc.setDrawColor(100, 116, 139);

  doc.line(30, signatureY, 110, signatureY);
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma y Cédula del Entregador (EAS / Agente Educativo)', 70, signatureY + 4, { align: 'center' });

  doc.line(185, signatureY, 265, signatureY);
  doc.text('Firma del Supervisor / Interventor ICBF', 225, signatureY + 4, { align: 'center' });

  doc.save(`Planilla_Entrega_Raciones_${modalidad}.pdf`);
}

/**
 * GENERADOR 4: Planilla Oficial de Entrega de Alimentos a la Madre Comunitaria (ICBF)
 * Formato oficial con datos de EAS, NIT, Contrato, Municipio, HCB, logo oficial en esquina superior derecha y tabla de productos con firmas.
 */
import { DEFAULT_LOGO_BASE64 } from './defaultLogoBase64';

export interface MetaPlanillaEntregaPDF {
  eas: string;
  nit: string;
  contrato: string;
  municipio: string;
  nombreUds: string;
  madreComunitaria: string;
  fechaEntrega: string;
  diasCicloTexto: string;
  fechaInicio: string;
  fechaFin: string;
  logoBase64?: string;
}

export interface ItemPlanillaEntregaPDF {
  producto: string;
  totalGramos: number;
  unidad?: string;
}

/**
 * Función auxiliar para dibujar una página completa de la Planilla Oficial de Entrega
 * Con márgenes estrictos de seguridad para que el texto centrado NUNCA choque con el logo oficial
 */
function dibujarPaginaPlanillaEntrega(
  doc: jsPDF,
  meta: MetaPlanillaEntregaPDF,
  items: ItemPlanillaEntregaPDF[]
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const headerX = 108;
  const maxHeaderWidth = 125;

  // 1. Dibujar Logo Oficial en la esquina superior derecha (x = 176, y = 8, w = 25, h = 25)
  const logoToUse = meta.logoBase64 || DEFAULT_LOGO_BASE64;
  if (logoToUse) {
    try {
      doc.addImage(logoToUse, 'JPEG', 176, 8, 25, 25);
    } catch (e) {
      console.warn('No se pudo incrustar el logo en el PDF:', e);
    }
  }

  // 2. Encabezado institucional estrictamente centrado y acotado a maxWidth: 125
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PLANILLA DE ENTREGA DE ALIMENTOS', headerX, 11, { align: 'center', maxWidth: maxHeaderWidth });

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  let currentY = 15.0;
  const lineGap = 3.2;

  const lineasEncabezado = [
    `ENTIDAD ADMINISTRADORA DEL SERVICIO: ${meta.eas || 'ASOCIACION DE FAMILIA DE HCB DE CAIMITO-SUCRE'}`,
    `NIT: ${meta.nit || '8230002828 - 6'}`,
    `CONTRATO N°: ${meta.contrato || '70005732024'}`,
    `MUNICIPIO: ${meta.municipio || 'CAIMITO-SUCRE'}`,
    `NOMBRE DEL HCB: ${meta.nombreUds || 'Travesuras Infantiles'}`,
    `NOMBRE DE LA MADRE COMUNITARIA: ${meta.madreComunitaria || 'Ana Acevedo'}`
  ];

  for (const linea of lineasEncabezado) {
    doc.text(linea, headerX, currentY, { align: 'center', maxWidth: maxHeaderWidth });
    const splitLines = doc.splitTextToSize(linea, maxHeaderWidth);
    currentY += splitLines.length > 1 ? lineGap * splitLines.length : lineGap;
  }

  // 3. Declaración Legal Oficial Dinámica
  // Recuadro legal compacto: y = 35, altura 9 mm, terminando en y ≈ 44.
  const legalY = 35;
  const legalHeight = 9;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, legalY, pageWidth - 28, legalHeight, 1.5, 1.5, 'F');
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const textoLegal = `El día ${meta.fechaEntrega || '26 del mes 09 del año 2026'} se hizo la entrega a la madre comunitaria los productos alimenticos establecidos en la minuta patrón y lista de compra, para la preparación de los alimentos de los niños y niñas beneficiarios de la modalidad HCB; los cuales se relacionan a continuación: menú ${meta.diasCicloTexto || '21 - 25'}, semana del ${meta.fechaInicio || '28 de septiembre'} hasta el ${meta.fechaFin || '2 de octubre de 2026'}`;
  doc.text(textoLegal, 16.5, legalY + 2.8, { maxWidth: pageWidth - 33, lineHeightFactor: 1.15 });

  // 4. Tabla de Productos Entregados (con encabezado verde #a9d08e oficial de la muestra ICBF)
  // Inicia en y = 46. Dimensionamiento dinámico según el número de ítems:
  const isDense = items.length > 25;
  const tableFontSize = isDense ? 6.5 : 7.2;
  const tableCellPadding = isDense ? 0.7 : 1.2;
  const tableMinCellHeight = isDense ? 3.5 : 4.2;

  const bodyRows = items.map((it, idx) => [
    `${idx + 1}`,
    it.producto,
    `${it.totalGramos.toLocaleString('es-CO')}`,
    it.totalGramos >= 1000 ? `${(it.totalGramos / 1000).toFixed(2)} kg` : `${it.totalGramos} g`,
    'Conforme'
  ]);

  const totalGramos = items.reduce((acc, it) => acc + (it.totalGramos || 0), 0);
  const footRows = [
    [
      '',
      `TOTAL CONSOLIDADO SEMANAL (${items.length} PRODUCTOS)`,
      `${totalGramos.toLocaleString('es-CO')}`,
      `${(totalGramos / 1000).toFixed(2)} kg`,
      '100% Entregado'
    ]
  ];

  autoTable(doc, {
    startY: 46,
    pageBreak: 'avoid',
    head: [['N°', 'PRODUCTO', 'UNIDAD DE MEDIDA ( GRAMOS- ML)', 'EQUIVALENTE', 'ESTADO']],
    body: bodyRows,
    foot: footRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [169, 208, 142], // Verde pastel oficial #a9d08e (idéntico a la muestra ICBF)
      textColor: [0, 0, 0], 
      fontStyle: 'bold', 
      fontSize: isDense ? 6.8 : 7.2,
      halign: 'center',
      minCellHeight: 4.5,
      cellPadding: isDense ? 0.8 : 1.2,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: isDense ? 6.8 : 7.2,
      minCellHeight: 4.5,
      cellPadding: isDense ? 0.8 : 1.2,
    },
    styles: {
      fontSize: tableFontSize,
      cellPadding: tableCellPadding,
      minCellHeight: tableMinCellHeight,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 95 },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: 14.45, right: 14.45 },
    tableWidth: 187,
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  // Bloque de firmas: fijado en signatureY = Math.max(finalY + 8, pageHeight - 34) (alrededor de y = 246-248 mm), con líneas y textos en fontSize = 7.5 pt.
  // Sin llamada a doc.addPage() para garantizar que quepa en 1 sola hoja de tamaño Carta.
  const signatureY = Math.max(finalY + 8, pageHeight - 34);

  // 5. Bloque de Firmas Oficiales
  doc.setLineWidth(0.4);
  doc.setDrawColor(100, 116, 139);

  doc.line(20, signatureY, 95, signatureY);
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBIO A SATISFACCION', 57, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Madre Comunitaria: ${meta.madreComunitaria || 'Ana Acevedo'}`, 57, signatureY + 8, { align: 'center' });
  doc.text('C.C. ________________________________', 57, signatureY + 12, { align: 'center' });

  doc.line(120, signatureY, 195, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTREGO', 157, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Nutricionista / Supervisor ICBF / EAS', 157, signatureY + 8, { align: 'center' });
  doc.text('T.P. / C.C. ________________________________', 157, signatureY + 12, { align: 'center' });
}

export function generarPDFPlanillaEntregaOficialUDS(
  meta: MetaPlanillaEntregaPDF,
  items: ItemPlanillaEntregaPDF[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  dibujarPaginaPlanillaEntrega(doc, meta, items);

  const safeName = (meta.nombreUds || 'UDS').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Planilla_Entrega_${safeName}_Menus_${meta.diasCicloTexto}.pdf`);
}

/**
 * Genera un único documento PDF con las planillas oficiales de TODAS las 5 semanas del ciclo
 */
export function generarPDFPlanillasTodasLasSemanas(
  semanas: Array<{
    meta: MetaPlanillaEntregaPDF;
    consolidado: ItemPlanillaEntregaPDF[];
    numeroSemana: number;
  }>
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  semanas.forEach((sem, idx) => {
    if (idx > 0) {
      doc.addPage();
    }
    dibujarPaginaPlanillaEntrega(doc, sem.meta, sem.consolidado);
  });

  const firstMeta = semanas[0]?.meta;
  const safeName = (firstMeta?.nombreUds || 'UDS').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Planillas_Entrega_CicloCompleto_5Semanas_${safeName}.pdf`);
}



