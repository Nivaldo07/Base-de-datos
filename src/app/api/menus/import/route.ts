import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPreparationName } from '@/lib/cleaners';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { csvData, grupo_etario_id, numero_dia } = data;

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json({ error: 'Falta csvData o no es un arreglo' }, { status: 400 });
    }

    const prepsMap = new Map();
    let currentTiempo = 'ALMUERZO';
    let currentPrepNombre = '';

    // Load all alimentos to match TCAC codes
    const alimentos = await prisma.alimentoTCAC.findMany();
    const tcacToId = new Map(alimentos.map(a => [a.codigo_icbf, a.id]));
    const alimMap = new Map(alimentos.map(a => [a.id, a]));

    // Hardcode some fallbacks exactly like our seed script
    const fallbacks: any = {
      'D012': 'D013', 'F085': 'F082', 'A027': 'A024', 'C010': 'C008',
      'C032': 'C031', 'G017': 'G016', 'P046': 'P045', 'B074': 'B073',
      'B035': 'B034', 'B052': 'B051', 'B110': 'B109'
    };

    const parsedPreps: any[] = [];
    let activePrep: any = null;
    let colIdx = { tiempo: -1, prep: -1, tcac: -1, bruto: -1, neto: -1, costo: -1, sodio: -1, costo_unitario: -1 };
    let headerFound = false;

    // Helper de normalización profunda de encabezados
    const cleanText = (str: any): string => {
      if (str == null) return '';
      return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remueve acentos
        .replace(/[\r\n\t]+/g, ' ')      // convierte saltos de línea en espacios
        .replace(/\s+/g, ' ')            // colapsa espacios múltiples
        .toUpperCase()
        .trim();
    };

    // Helper de parsing numérico tolerante a monedas y formatos latinos
    const parseNumeric = (val: any): number => {
      if (val == null) return NaN;
      if (typeof val === 'number') return val;
      const cleaned = String(val)
        .replace(/[$]/g, '')
        .replace(/\s+/g, '')
        .replace(',', '.');
      return parseFloat(cleaned);
    };

    // Predicados de detección
    const isTiempo = (s: string) => s.includes('TIEMPO DE COMIDA') || s.includes('TIEMPO COMIDA') || s === 'TIEMPO';
    const isPrep = (s: string) => s.includes('NOMBRE DE LA PREPARACION') || s.includes('PREPARACION') || s.includes('NOMBRE DE LA PREP');
    const isTcac = (s: string) => s.includes('CODIGO ICBF') || s.includes('CODIGO TCAC') || s.includes('TCAC') || s === 'CODIGO';
    const isBruto = (s: string) => s.includes('PESO BRUTO') || (s.includes('BRUTO') && !s.includes('NETO'));
    const isNeto = (s: string) => s.includes('PESO NETO') || (s.includes('NETO') && !s.includes('BRUTO'));
    const isSodio = (s: string) => s.includes('SODIO');
    const isCostoUnitario = (s: string) => s.includes('COSTO UNITARIO') || s.includes('VALOR UNITARIO') || s.includes('COSTO UNIT');
    const isCostoUnidadCompra = (s: string) => 
      !isCostoUnitario(s) && (
        s.includes('COSTO UNIDAD DE COMPRA') ||
        s.includes('COSTO UNIDAD') ||
        (s.includes('COSTO') && s.includes('COMPRA')) ||
        s.includes('PRECIO UNIDAD') ||
        s.includes('VALOR COMPRA')
      );

    for (let r = 0; r < csvData.length; r++) {
      const row = csvData[r];
      if (!Array.isArray(row)) continue;

      if (!headerFound) {
        const nextRow = (r + 1 < csvData.length && Array.isArray(csvData[r + 1])) ? csvData[r + 1] : [];
        const maxCols = Math.max(row.length, nextRow.length);

        let tIdx = -1, pIdx = -1, tcacIdx = -1, bIdx = -1, nIdx = -1, cIdx = -1, sodIdx = -1, cuIdx = -1;

        for (let c = 0; c < maxCols; c++) {
          const cell1 = cleanText(row[c]);
          const cell2 = cleanText(nextRow[c]);
          const combined = cleanText(cell1 + ' ' + cell2);

          const match = (predicate: (s: string) => boolean) => predicate(cell1) || predicate(combined);

          if (tIdx === -1 && match(isTiempo)) tIdx = c;
          if (pIdx === -1 && match(isPrep)) pIdx = c;
          if (tcacIdx === -1 && match(isTcac)) tcacIdx = c;
          if (bIdx === -1 && match(isBruto)) bIdx = c;
          if (nIdx === -1 && match(isNeto)) nIdx = c;
          if (sodIdx === -1 && match(isSodio)) sodIdx = c;
          if (cuIdx === -1 && match(isCostoUnitario)) cuIdx = c;
          if (cIdx === -1 && match(isCostoUnidadCompra)) cIdx = c;
        }

        if (tIdx !== -1 || pIdx !== -1 || tcacIdx !== -1) {
          const base = tIdx !== -1 ? tIdx : (pIdx !== -1 ? pIdx - 1 : 0);
          colIdx.tiempo = tIdx !== -1 ? tIdx : base;
          colIdx.prep = pIdx !== -1 ? pIdx : base + 1;
          colIdx.tcac = tcacIdx !== -1 ? tcacIdx : base + 2;
          colIdx.bruto = bIdx !== -1 ? bIdx : base + 4;
          colIdx.neto = nIdx !== -1 ? nIdx : base + 5;
          colIdx.sodio = sodIdx;
          colIdx.costo = cIdx;
          colIdx.costo_unitario = cuIdx;
          headerFound = true;

          // Si nextRow fue una fila de sub-encabezados (unidades sin código TCAC), saltarla:
          const hasFoodCodeInNextRow = nextRow.some((cell: any) => {
            const val = cleanText(cell);
            return /^[A-Z][0-9]{3}$/.test(val) || /^[A-Z0-9]{4}$/.test(val);
          });
          if (!hasFoodCodeInNextRow && nextRow.length > 0) {
            r++;
          }
          continue;
        }

        // Try checking if it's a legacy row format by detecting a TCAC code anyway
        const possibleTcac = row.findIndex(c => typeof c === 'string' && c.match(/^[A-Z0-9]{4}$/));
        if (possibleTcac !== -1 && possibleTcac >= 2) {
          const base = possibleTcac - 2;
          colIdx = { tiempo: base, prep: base + 1, tcac: possibleTcac, bruto: base + 4, neto: base + 5, costo: -1, sodio: -1, costo_unitario: -1 };
          headerFound = true;
        } else {
          continue;
        }
      }

      const colTiempo = cleanText(row[colIdx.tiempo]); 
      const colPrep = cleanText(row[colIdx.prep]); 
      let colTCAC = cleanText(row[colIdx.tcac]); 
      const pesoBruto = colIdx.bruto !== -1 ? parseNumeric(row[colIdx.bruto]) : NaN;
      const pesoNeto = colIdx.neto !== -1 ? parseNumeric(row[colIdx.neto]) : NaN;
      const costoUnidadCompra = colIdx.costo !== -1 ? parseNumeric(row[colIdx.costo]) : NaN;
      const sodioExcel = colIdx.sodio !== -1 ? parseNumeric(row[colIdx.sodio]) : NaN;
      const costoUnitarioExcel = colIdx.costo_unitario !== -1 ? parseNumeric(row[colIdx.costo_unitario]) : NaN;

      // Detect Time
      if (colTiempo && !colTiempo.includes('TIEMPO DE COMIDA') && !colTiempo.includes('APORTE TOTAL') && !colTiempo.includes('ANALISIS') && !colTiempo.includes('MENU')) {
        currentTiempo = colTiempo;
      }

      // Detect Preparation
      if (colPrep && !colPrep.includes('NOMBRE DE LA PREPARACION') && !colPrep.includes('APORTE DE LA MINUTA PATRON')) {
        currentPrepNombre = cleanPreparationName(row[colIdx.prep]?.toString()); // Keep clean name
        activePrep = {
          nombre: currentPrepNombre,
          tiempo_comida: currentTiempo,
          ingredientes: []
        };
        parsedPreps.push(activePrep);
      }

      // Detect Ingredient
      if (colTCAC && activePrep) {
        // Fix typos in OCR/Excel
        if (colTCAC === '1015') colTCAC = 'L015';
        if (colTCAC === '1004') colTCAC = 'J004';
        if (colTCAC === '8004') colTCAC = 'R004';

        let alimId = tcacToId.get(colTCAC);
        
        if (!alimId && fallbacks[colTCAC]) {
           alimId = tcacToId.get(fallbacks[colTCAC]);
        }

        // Fuzzy match by name if code still unmapped
        if (!alimId) {
          const rawName = row[colIdx.tcac + 1] || row[3];
          const ingNombre = cleanText(rawName);
          if (ingNombre) {
            const matchedAlim = alimentos.find(a =>
              cleanText(a.nombre).includes(ingNombre) ||
              ingNombre.includes(cleanText(a.nombre))
            );
            if (matchedAlim) {
              alimId = matchedAlim.id;
            }
          }
        }

        if (alimId && !isNaN(pesoBruto) && !isNaN(pesoNeto)) {
          const alimObj = alimMap.get(alimId);
          const finalCostoCompra = !isNaN(costoUnidadCompra) && costoUnidadCompra > 0
            ? costoUnidadCompra
            : (alimObj?.costo_unidad_compra || 0);

          activePrep.ingredientes.push({
            alimento_id: alimId,
            peso_bruto: pesoBruto,
            peso_neto: pesoNeto,
            costo_unidad_compra: finalCostoCompra,
            sodio_mg_excel: isNaN(sodioExcel) ? null : sodioExcel,
            costo_unitario_excel: isNaN(costoUnitarioExcel) ? null : costoUnitarioExcel
          });
        }
      }
    }

    // Filter out preps with no ingredients
    const validPreps = parsedPreps.filter(p => p.ingredientes.length > 0);

    // Get the grupo
    const grupo = await prisma.grupoEtario.findUnique({ where: { id: Number(grupo_etario_id) } });
    if (!grupo) throw new Error("Grupo Etario no encontrado");

    // Replace menu
    const existingMenu = await prisma.menu.findFirst({
      where: { numero_dia: Number(numero_dia), grupo_etario_id: grupo.id }
    });

    if (existingMenu) {
      await prisma.menu.delete({ where: { id: existingMenu.id } });
    }

    const newMenu = await prisma.menu.create({
      data: {
        numero_dia: Number(numero_dia),
        grupo_etario_id: grupo.id,
        preparaciones: {
          create: validPreps.map(prep => ({
            nombre: prep.nombre,
            tiempo_comida: prep.tiempo_comida,
            ingredientes: {
              create: prep.ingredientes
            }
          }))
        }
      },
      include: {
        preparaciones: {
          include: {
            ingredientes: {
              include: {
                alimento: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(newMenu);
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json({ error: 'Error al importar CSV' }, { status: 500 });
  }
}
