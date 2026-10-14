import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Helper to normalize strings (remove accents, uppercase, trim)
    const normalize = (str: any) => {
      if (typeof str !== 'string') return '';
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    };

    for (const row of csvData) {
      if (!Array.isArray(row)) continue;

      if (!headerFound) {
        // Attempt to find header columns using normalized text
        const tIdx = row.findIndex(c => normalize(c).includes('TIEMPO DE COMIDA'));
        const pIdx = row.findIndex(c => normalize(c).includes('PREPARACION') || normalize(c).includes('NOMBRE DE LA PREP'));
        const tcacIdx = row.findIndex(c => normalize(c).includes('TCAC'));
        const bIdx = row.findIndex(c => normalize(c).includes('PESO BRUTO'));
        const nIdx = row.findIndex(c => normalize(c).includes('PESO NETO'));
        const cIdx = row.findIndex(c => normalize(c).includes('COSTO UNIDAD DE COMPRA'));
        const sodIdx = row.findIndex(c => normalize(c) === 'SODIO (MG)' || normalize(c) === 'SODIO(MG)');
        const cuIdx = row.findIndex(c => normalize(c).includes('COSTO UNITARIO'));

        if (tIdx !== -1 || pIdx !== -1 || tcacIdx !== -1) {
          // Found headers!
          const base = tIdx !== -1 ? tIdx : (pIdx !== -1 ? pIdx - 1 : 0);
          colIdx.tiempo = tIdx !== -1 ? tIdx : base;
          colIdx.prep = pIdx !== -1 ? pIdx : base + 1;
          colIdx.tcac = tcacIdx !== -1 ? tcacIdx : base + 2;
          colIdx.bruto = bIdx !== -1 ? bIdx : base + 4;
          colIdx.neto = nIdx !== -1 ? nIdx : base + 5;
          colIdx.costo = cIdx !== -1 ? cIdx : base + 16;
          colIdx.sodio = sodIdx !== -1 ? sodIdx : base + 14;
          colIdx.costo_unitario = cuIdx !== -1 ? cuIdx : base + 17;
          headerFound = true;
          continue; // skip the header row
        }
      }

      if (!headerFound) {
         // Try checking if it's a legacy row format by detecting a TCAC code anyway
         const possibleTcac = row.findIndex(c => typeof c === 'string' && c.match(/^[A-Z0-9]{4}$/));
         if (possibleTcac !== -1 && possibleTcac >= 2) {
             const base = possibleTcac - 2;
             colIdx = { tiempo: base, prep: base + 1, tcac: possibleTcac, bruto: base + 4, neto: base + 5, costo: base + 16, sodio: base + 14, costo_unitario: base + 17 };
             headerFound = true;
         } else {
             continue; // No headers yet and not a clear data row
         }
      }

      const colTiempo = normalize(row[colIdx.tiempo]); 
      const colPrep = normalize(row[colIdx.prep]); 
      let colTCAC = normalize(row[colIdx.tcac]); 
      const pesoBrutoStr = row[colIdx.bruto]?.toString().replace(',', '.');
      const pesoNetoStr = row[colIdx.neto]?.toString().replace(',', '.');
      const costoUnidadCompraStr = row[colIdx.costo]?.toString().replace(',', '.');
      const sodioStr = row[colIdx.sodio]?.toString().replace(',', '.');
      const costoUnitarioStr = row[colIdx.costo_unitario]?.toString().replace(',', '.');

      const pesoBruto = parseFloat(pesoBrutoStr || '');
      const pesoNeto = parseFloat(pesoNetoStr || '');
      const costoUnidadCompra = parseFloat(costoUnidadCompraStr || '');
      const sodioExcel = parseFloat(sodioStr || '');
      const costoUnitarioExcel = parseFloat(costoUnitarioStr || '');

      // Detect Time
      if (colTiempo && !colTiempo.includes('TIEMPO DE COMIDA') && !colTiempo.includes('APORTE TOTAL') && !colTiempo.includes('ANALISIS') && !colTiempo.includes('MENU')) {
        currentTiempo = colTiempo;
      }

      // Detect Preparation
      if (colPrep && !colPrep.includes('NOMBRE DE LA PREPARACION') && !colPrep.includes('APORTE DE LA MINUTA PATRON')) {
        currentPrepNombre = row[colIdx.prep]?.toString().trim(); // Keep original casing for display
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

        // basic TCAC code detection A060, J004...
        if (colTCAC.match(/^[A-Z0-9]{4}$/)) {
          let alimId = tcacToId.get(colTCAC);
          
          if (!alimId && fallbacks[colTCAC]) {
             alimId = tcacToId.get(fallbacks[colTCAC]);
          }

          if (alimId && !isNaN(pesoBruto) && !isNaN(pesoNeto)) {
            activePrep.ingredientes.push({
              alimento_id: alimId,
              peso_bruto: pesoBruto,
              peso_neto: pesoNeto,
              costo_unidad_compra: isNaN(costoUnidadCompra) ? null : costoUnidadCompra,
              sodio_mg_excel: isNaN(sodioExcel) ? null : sodioExcel,
              costo_unitario_excel: isNaN(costoUnitarioExcel) ? null : costoUnitarioExcel
            });
          }
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
            ingredientes: true
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
