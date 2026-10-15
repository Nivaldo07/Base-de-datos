import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseMinutaPDF } from '@/lib/pdfMinutaParser';
import { cleanPreparationName } from '@/lib/cleaners';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const grupoEtarioId = formData.get('grupo_etario_id') as string | null;
    const numeroDia = formData.get('numero_dia') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract structured menu data from PDF (6 essential columns: Meal, Prep, TCAC, Name, Gross, Net)
    const parsedData = await parseMinutaPDF(buffer);

    // Determine target day: prioritize user selection from UI, then header detected from PDF ("MENÚ Nº X" / "MENÚ X"), fallback to 1
    const formDia = numeroDia ? parseInt(numeroDia, 10) : null;
    const dia = (formDia && !isNaN(formDia) && formDia > 0)
      ? formDia
      : (parsedData.numero_dia && !isNaN(parsedData.numero_dia) && parsedData.numero_dia > 0
          ? parsedData.numero_dia
          : 1);

    // Determine target age group
    let grupo = null;
    if (grupoEtarioId) {
      grupo = await prisma.grupoEtario.findUnique({ where: { id: parseInt(grupoEtarioId, 10) } });
    }

    if (!grupo) {
      const allGrupos = await prisma.grupoEtario.findMany();
      if (parsedData.grupo_etario) {
        const cleanTarget = parsedData.grupo_etario.toLowerCase();
        grupo = allGrupos.find(g => {
          const gName = g.nombre.toLowerCase();
          return cleanTarget.includes(gName) || gName.includes(cleanTarget) ||
                 (cleanTarget.includes('1') && gName.includes('1'));
        }) || allGrupos[0];
      } else {
        grupo = allGrupos[0];
      }
    }

    if (!grupo) {
      return NextResponse.json({ error: 'No se encontró un Grupo Etario para asociar la minuta' }, { status: 400 });
    }

    // Load existing alimentos
    let alimentos = await prisma.alimentoTCAC.findMany();
    let tcacToId = new Map(alimentos.filter(a => a.codigo_icbf).map(a => [a.codigo_icbf!.toUpperCase(), a.id]));

    // Known fallback codes
    const fallbacks: Record<string, string> = {
      'D012': 'D013', 'F085': 'F082', 'A027': 'A024', 'C010': 'C008',
      'C032': 'C031', 'G017': 'G016', 'P046': 'P045', 'B074': 'B073',
      'B035': 'B034', 'B052': 'B051', 'B110': 'B109', 'A040': 'A038'
    };

    // Ensure common essential items exist if not present in TCAC catalog
    if (!tcacToId.has('L015')) {
      const createdSal = await prisma.alimentoTCAC.create({
        data: {
          codigo_icbf: 'L015',
          nombre: 'Sal común',
          grupo_alimento: 'Condimentos y Especias',
          porcentaje_comestible: 100,
          energia_kcal: 0,
          proteina_g: 0,
          grasa_g: 0,
          carbohidratos_g: 0,
          hierro_mg: 0.3,
          calcio_mg: 24,
          zinc_mg: 0.1,
          sodio_mg: 38781,
          vitamina_a_rae: 0,
          presentacion_comercial_gramos: 1000,
          tipo_empaque: 'bolsa 1000g',
          costo_unidad_compra: 1200
        }
      });
      tcacToId.set('L015', createdSal.id);
      alimentos.push(createdSal);
    }

    if (!tcacToId.has('P046') && !tcacToId.has('P045')) {
      const createdCorozo = await prisma.alimentoTCAC.create({
        data: {
          codigo_icbf: 'P046',
          nombre: 'Corozo, crudo',
          grupo_alimento: 'Frutas',
          porcentaje_comestible: 47.6,
          energia_kcal: 81,
          proteina_g: 0.1,
          grasa_g: 1.5,
          carbohidratos_g: 29,
          hierro_mg: 1.0,
          calcio_mg: 30,
          zinc_mg: 0,
          sodio_mg: 0,
          vitamina_a_rae: 0,
          presentacion_comercial_gramos: 1000,
          tipo_empaque: 'kg',
          costo_unidad_compra: 5000
        }
      });
      tcacToId.set('P046', createdCorozo.id);
      alimentos.push(createdCorozo);
    }

    // Map foods by id for rapid attribute lookup
    const alimMap = new Map(alimentos.map(a => [a.id, a]));

    // Prepare preparaciones with mapped database IDs
    const validPreps = [];

    for (const prep of parsedData.preparaciones) {
      const resolvedIngredientes = [];

      for (const ing of prep.ingredientes) {
        const codeUpper = (ing.codigo_tcac || '').toUpperCase().trim();
        let alimId = codeUpper ? tcacToId.get(codeUpper) : undefined;

        // Try known fallback code
        if (!alimId && codeUpper && fallbacks[codeUpper]) {
          alimId = tcacToId.get(fallbacks[codeUpper]);
        }

        // Fuzzy match by name if code still unmapped
        if (!alimId && ing.nombre) {
          const cleanIngName = ing.nombre.toLowerCase().trim();
          const matchedAlim = alimentos.find(a => {
            const aName = a.nombre.toLowerCase().trim();
            return aName.includes(cleanIngName) || cleanIngName.includes(aName);
          });
          if (matchedAlim) {
            alimId = matchedAlim.id;
          }
        }

        // Auto-create in AlimentoTCAC if still missing (Guarantees NO food is ever discarded)
        if (!alimId) {
          const targetCode = codeUpper || `AUT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

          // Check if already in DB under this code
          const existingAlim = await prisma.alimentoTCAC.findFirst({
            where: { codigo_icbf: targetCode }
          });

          if (existingAlim) {
            alimId = existingAlim.id;
            tcacToId.set(targetCode, alimId);
            alimMap.set(alimId, existingAlim);
          } else {
            const pct = (ing.peso_bruto > 0 && ing.peso_neto > 0)
              ? Math.min(100, Math.max(10, Math.round((ing.peso_neto / ing.peso_bruto) * 100)))
              : 100;

            let grupoAlimento = 'Otros Alimentos';
            const prefix = targetCode.charAt(0).toUpperCase();
            if (prefix === 'A') grupoAlimento = 'Cereales y Productos Derivados';
            else if (prefix === 'B') grupoAlimento = 'Verduras, Hortalizas y Leguminosas Verdes';
            else if (prefix === 'C' || prefix === 'P') grupoAlimento = 'Frutas';
            else if (prefix === 'D') grupoAlimento = 'Grasas y Aceites';
            else if (prefix === 'F') grupoAlimento = 'Carnes, Aves, Pescados y Mariscos';
            else if (prefix === 'G') grupoAlimento = 'Leche y Productos Lácteos';
            else if (prefix === 'J') grupoAlimento = 'Huevos';
            else if (prefix === 'K') grupoAlimento = 'Azúcares, Mieles y Dulces';
            else if (prefix === 'L') grupoAlimento = 'Condimentos y Especias';
            else if (prefix === 'R') grupoAlimento = 'Bienestarina y Alimentos Complementarios';
            else if (prefix === 'T') grupoAlimento = 'Leguminosas Secas';

            try {
              const createdAlim = await prisma.alimentoTCAC.create({
                data: {
                  codigo_icbf: targetCode,
                  nombre: ing.nombre || `Alimento ${targetCode}`,
                  grupo_alimento: grupoAlimento,
                  porcentaje_comestible: pct,
                  energia_kcal: 100,
                  proteina_g: 2.0,
                  grasa_g: 1.0,
                  carbohidratos_g: 15.0,
                  hierro_mg: 0.5,
                  calcio_mg: 10.0,
                  zinc_mg: 0.2,
                  sodio_mg: 50.0,
                  vitamina_a_rae: 0,
                  presentacion_comercial_gramos: 1000,
                  tipo_empaque: 'kg / unidad',
                  costo_unidad_compra: 3000
                }
              });
              alimId = createdAlim.id;
              tcacToId.set(targetCode, alimId);
              alimentos.push(createdAlim);
              alimMap.set(alimId, createdAlim);
            } catch (createErr) {
              console.warn(`Could not auto-create alimento ${targetCode}:`, createErr);
              if (alimentos.length > 0) {
                alimId = alimentos[0].id;
              }
            }
          }
        }

        if (alimId && !isNaN(ing.peso_bruto) && !isNaN(ing.peso_neto)) {
          const alimento = alimMap.get(alimId);
          resolvedIngredientes.push({
            alimento_id: alimId,
            peso_bruto: ing.peso_bruto,
            peso_neto: ing.peso_neto,
            costo_unidad_compra: alimento?.costo_unidad_compra || 0,
            sodio_mg_excel: null,
            costo_unitario_excel: null
          });
        }
      }

      if (resolvedIngredientes.length > 0) {
        validPreps.push({
          nombre: cleanPreparationName(prep.nombre),
          tiempo_comida: prep.tiempo_comida,
          ingredientes: resolvedIngredientes
        });
      }
    }

    if (validPreps.length === 0) {
      return NextResponse.json({
        error: 'No se pudieron extraer preparaciones válidas del archivo PDF. Verifica que sea el formato oficial ICBF.'
      }, { status: 422 });
    }

    // Delete existing menu for this day and group if present
    const existingMenu = await prisma.menu.findFirst({
      where: { numero_dia: dia, grupo_etario_id: grupo.id }
    });

    if (existingMenu) {
      await prisma.menu.delete({ where: { id: existingMenu.id } });
    }

    // Persist new menu with all preparaciones and ingredientes
    const newMenu = await prisma.menu.create({
      data: {
        numero_dia: dia,
        grupo_etario_id: grupo.id,
        preparaciones: {
          create: validPreps.map(p => ({
            nombre: p.nombre,
            tiempo_comida: p.tiempo_comida,
            ingredientes: {
              create: p.ingredientes
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

    return NextResponse.json({
      ...newMenu,
      detected_dia: dia,
      detected_grupo: parsedData.grupo_etario,
      parser_used: parsedData.parser_used
    });
  } catch (error: any) {
    console.error('Error importing PDF menu:', error);
    return NextResponse.json({ error: error?.message || 'Error al procesar minuta en PDF' }, { status: 500 });
  }
}
