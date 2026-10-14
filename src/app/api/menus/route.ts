import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
            nombre: prep.nombre,
            tiempo_comida: prep.tiempo_comida,
            ingredientes: {
              create: prep.ingredientes.map((ing: any) => ({
                alimento_id: ing.alimento_id,
                peso_bruto: ing.peso_bruto,
                peso_neto: ing.peso_neto
              }))
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

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json({ error: 'Error creating menu' }, { status: 500 });
  }
}
