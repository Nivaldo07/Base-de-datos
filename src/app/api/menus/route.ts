import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPreparationName } from '@/lib/cleaners';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grupoId = searchParams.get('grupoId');
  const dia = searchParams.get('dia');

  try {
    let whereClause: any = {};
    if (grupoId) {
      whereClause.grupo_etario_id = parseInt(grupoId);
    }
    if (dia) {
      whereClause.numero_dia = parseInt(dia);
    }

    const menus = await prisma.menu.findMany({
      where: whereClause,
      include: {
        grupoEtario: true,
        preparaciones: {
          include: {
            ingredientes: {
              include: {
                alimento: true
              }
            }
          }
        }
      },
      orderBy: { numero_dia: 'asc' }
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json({ error: 'Error fetching menus' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // We assume data contains { numero_dia, grupo_etario_id, preparaciones }
    const { numero_dia, grupo_etario_id, preparaciones } = data;

    // Check if the Grupo Etario exists, if not, create it or expect it to exist.
    // Let's ensure basic Grupos Etarios exist.
    let grupo = await prisma.grupoEtario.findUnique({ where: { id: grupo_etario_id } });
    if (!grupo) {
      // If passing name instead
      if (data.grupo_nombre) {
         grupo = await prisma.grupoEtario.create({ data: { nombre: data.grupo_nombre }});
      } else {
         return NextResponse.json({ error: 'Grupo Etario not found' }, { status: 400 });
      }
    }

    // Check if menu exists for this day and group
    let menu = await prisma.menu.findFirst({
      where: { numero_dia, grupo_etario_id: grupo.id }
    });

    if (menu) {
      // Update by deleting old preparaciones and creating new ones (or updating)
      // For simplicity, we can delete the menu and recreate it
      await prisma.menu.delete({ where: { id: menu.id } });
    }

    menu = await prisma.menu.create({
      data: {
        numero_dia,
        grupo_etario_id: grupo.id,
        preparaciones: {
          create: preparaciones.map((prep: any) => ({
            nombre: cleanPreparationName(prep.nombre),
            tiempo_comida: prep.tiempo_comida,
            ingredientes: {
              create: prep.ingredientes.map((ing: any) => ({
                alimento_id: Number(ing.alimento_id),
                peso_bruto: Number(ing.peso_bruto) || 0,
                peso_neto: Number(ing.peso_neto) || 0,
                costo_unidad_compra: ing.costo_unidad_compra != null && !isNaN(Number(ing.costo_unidad_compra))
                  ? Number(ing.costo_unidad_compra)
                  : null,
                sodio_mg_excel: ing.sodio_mg_excel != null && !isNaN(Number(ing.sodio_mg_excel))
                  ? Number(ing.sodio_mg_excel)
                  : null,
                costo_unitario_excel: ing.costo_unitario_excel != null && !isNaN(Number(ing.costo_unitario_excel))
                  ? Number(ing.costo_unitario_excel)
                  : null,
              }))
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

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json({ error: 'Error creating menu' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grupoId = searchParams.get('grupo_etario_id');
    const dia = searchParams.get('numero_dia');
    const menuId = searchParams.get('id');

    if (menuId) {
      await prisma.menu.delete({ where: { id: Number(menuId) } });
      return NextResponse.json({ success: true, message: 'Menú eliminado correctamente' });
    }

    if (grupoId && dia) {
      const existingMenu = await prisma.menu.findFirst({
        where: { numero_dia: Number(dia), grupo_etario_id: Number(grupoId) }
      });
      if (existingMenu) {
        await prisma.menu.delete({ where: { id: existingMenu.id } });
      }
      return NextResponse.json({ success: true, message: 'Menú eliminado correctamente' });
    }

    return NextResponse.json({ error: 'Faltan parámetros para eliminar el menú' }, { status: 400 });
  } catch (error) {
    console.error("Error deleting menu:", error);
    return NextResponse.json({ error: 'Error al eliminar menú' }, { status: 500 });
  }
}

