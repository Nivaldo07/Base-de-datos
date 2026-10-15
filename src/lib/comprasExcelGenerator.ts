import * as XLSX from 'xlsx';

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

/**
 * Genera el archivo Excel oficial multi-pestaña para la Proyección de Compras y Pedidos Semanales
 * Estructura idéntica a la plantilla ICBF:
 * - Pestañas 1 a 5: Detalle por día (Menú 21 al 25 o Día 1 al 5) con columnas Menor de 3, Mayor de 3 y Totales
 * - Pestaña Final: "PLANILLA DE ENTREGA DE ALIMENTOS" con encabezado legal, tabla de productos de los 5 días y firmas.
 */
export function generarExcelProyeccionYPlanilla(
  dias: DiaProyeccionExcel[],
  consolidado: ItemPlanillaExcel[],
  meta: MetadatosPlanillaExcel
) {
  const wb = XLSX.utils.book_new();

  // 1. GENERAR PESTAÑAS DIARIAS (Día 1 a Día 5)
  dias.forEach((dia, idx) => {
    const sheetName = `Menú ${dia.numeroDiaCiclo}`;
    const wsData: any[][] = [];

    // Fila 1: Título del menú
    wsData.push(['', `MENU ${dia.numeroDiaCiclo}`, '', '', '', '', '', '', '', '']);

    // Fila 2: Sub-encabezados de grupos y totales
    wsData.push([
      '',
      'NIÑOS MENORES DE 3 AÑOS',
      '',
      '',
      'NIÑO MENOR DE 5 AÑOS',
      '',
      '',
      'MENOR DE 3',
      'MAYOR DE 3',
      'TOTAL'
    ]);

    if (!dia.activo) {
      wsData.push([
        '',
        `DÍA ANULADO: ${dia.motivoAnulacion || 'Festivo / No Laboral'}`,
        0,
        '',
        `DÍA ANULADO: ${dia.motivoAnulacion || 'Festivo / No Laboral'}`,
        0,
        '',
        0,
        0,
        0
      ]);
    } else {
      // Filas de ingredientes
      dia.items.forEach((item) => {
        wsData.push([
          '',
          item.nombre,
          item.gMenor,
          '',
          item.nombre,
          item.gMayor,
          '',
          item.totalMenor,
          item.totalMayor,
          item.totalDia
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ancho de columnas para excelente visualización
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
      { wch: 14 }  // Col J: Total día
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  });

  // 2. GENERAR HOJA FINAL: "PLANILLA DE ENTREGA"
  const planillaRows: any[][] = [];

  // Filas del encabezado institucional (cada línea en su propia fila centrada)
  planillaRows.push(['', 'PLANILLA DE ENTREGA DE ALIMENTOS']);
  planillaRows.push(['', `ENTIDAD ADMINISTRADORA DEL SERVICIO: ${meta.eas || 'ASOCIACION DE FAMILIA DE HCB DE CAIMITO-SUCRE'}`]);
  planillaRows.push(['', `NIT: ${meta.nit || '8230002828 - 6'}`]);
  planillaRows.push(['', `CONTRATO N°: ${meta.contrato || '70005732024'}`]);
  planillaRows.push(['', `MUNICIPIO: ${meta.municipio || 'CAIMITO-SUCRE'}`]);
  planillaRows.push(['', `NOMBRE DEL HCB: ${meta.nombreUds || 'Travesuras Infantiles'}`]);
  planillaRows.push(['', `NOMBRE DE LA MADRE COMUNITARIA: ${meta.madreComunitaria || 'Ana Acevedo'}`]);
  planillaRows.push([]);

  // Párrafo de declaración legal oficial
  const textoLegal = `El día ${meta.fechaEntrega || '26 del mes 09 del año 2026'} se hizo la entrega a la madre comunitaria los productos alimenticos establecidos en la minuta patrón y lista de compra, para la preparación de los alimentos de los niños y niñas beneficiarios de la modalidad HCB; los cuales se relacionan a continuación: menú ${meta.diasCicloTexto || '21 - 25'}, semana del ${meta.fechaInicio || '28 de septiembre'} hasta el ${meta.fechaFin || '2 de octubre de 2026'}`;
  planillaRows.push(['', textoLegal]);
  planillaRows.push([]);

  // Encabezados de la tabla oficial de entrega
  planillaRows.push(['', 'PRODUCTO', 'UNIDAD DE MEDIDA ( GRAMOS- ML)', 'EQUIVALENTE (KG)']);

  // Filas de productos ordenados y totalizados sin duplicados
  consolidado.forEach((prod) => {
    planillaRows.push([
      '',
      prod.producto,
      prod.totalGramos,
      Number((prod.totalGramos / 1000).toFixed(2))
    ]);
  });

  // Fila de total consolidado
  const totalGramosExcel = consolidado.reduce((acc, p) => acc + (p.totalGramos || 0), 0);
  planillaRows.push([
    '',
    `TOTAL CONSOLIDADO SEMANAL (${consolidado.length} PRODUCTOS):`,
    totalGramosExcel,
    Number((totalGramosExcel / 1000).toFixed(2))
  ]);

  // Espacio de firmas oficiales
  planillaRows.push([]);
  planillaRows.push([]);
  planillaRows.push(['', 'RECIBIO A SATISFACCION', '', 'ENTREGO']);
  planillaRows.push([
    '',
    `Madre Comunitaria: ${meta.madreComunitaria || 'Ana Acevedo'}`,
    '',
    'Nutricionista / Supervisor ICBF / EAS'
  ]);
  planillaRows.push([
    '',
    'C.C. ________________________________',
    '',
    'T.P. / C.C. ________________________________'
  ]);

  const wsPlanilla = XLSX.utils.aoa_to_sheet(planillaRows);

  wsPlanilla['!cols'] = [
    { wch: 4 },
    { wch: 55 },
    { wch: 35 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, wsPlanilla, 'PLANILLA DE ENTREGA');

  // 3. DESCARGAR ARCHIVO EXCEL
  const safeName = (meta.nombreUds || 'UDS').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Proyeccion_Compras_Semanal_${safeName}_Menus_${meta.diasCicloTexto.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;

  XLSX.writeFile(wb, filename);
}
