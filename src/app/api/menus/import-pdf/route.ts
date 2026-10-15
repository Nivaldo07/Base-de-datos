import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseMinutaPDF } from '@/lib/pdfMinutaParser';

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

    // Extract structured menu data from PDF
    const parsedData = await parseMinutaPDF(buffer);

    // Determine target day: detected from PDF header ("MENÚ Nº X") or from form input
    const dia = parsedData.numero_dia || (numeroDia ? parseInt(numeroDia, 10) : 1);

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
    let tcacToId = new Map(alimentos.map(a => [a.codigo_icbf, a.id]));

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
    }

    // Map foods by id for rapid attribute lookup
    const alimMap = new Map(alimentos.map(a => [a.id, a]));

    // Prepare preparaciones with mapped database IDs
    const validPreps = [];

    for (const prep of parsedData.preparaciones) {
      const resolvedIngredientes = [];

      for (const ing of prep.ingredientes) {
        let alimId = tcacToId.get(ing.codigo_tcac);

        if (!alimId && fallbacks[ing.codigo_tcac]) {
          alimId = tcacToId.get(fallbacks[ing.codigo_tcac]);
        }

        // Fuzzy match by name if code still unmapped
        if (!alimId && ing.nombre) {
          const matchedAlim = alimentos.find(a =>
            a.nombre.toLowerCase().includes(ing.nombre.toLowerCase()) ||
            ing.nombre.toLowerCase().includes(a.nombre.toLowerCase())
          );
          if (matchedAlim) {
            alimId = matchedAlim.id;
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
          nombre: prep.nombre,
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
