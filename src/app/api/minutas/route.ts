import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const minutas = await prisma.minuta.findMany({
      include: {
        metaRien: true,
        detalles: {
          include: {
            alimento: true,
          },
        },
      },
      orderBy: { actualizado_en: 'desc' },
    });
    return NextResponse.json(minutas);
  } catch (error) {
    console.error('Error fetching minutas:', error);
    return NextResponse.json({ error: 'Error al obtener minutas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, meta_rien_id, modalidad, detalles } = body;

    if (!nombre || !meta_rien_id || !modalidad || !Array.isArray(detalles)) {
      return NextResponse.json(
        { error: 'Datos incompletos para guardar la minuta' },
        { status: 400 }
      );
    }

    const minuta = await prisma.minuta.create({
      data: {
        nombre,
        meta_rien_id: Number(meta_rien_id),
        modalidad,
        detalles: {
          create: detalles.map((d: { alimento_id: number; gramaje_neto: number }) => ({
            alimento_id: Number(d.alimento_id),
            gramaje_neto: Number(d.gramaje_neto),
          })),
        },
      },
      include: {
        metaRien: true,
        detalles: {
          include: {
            alimento: true,
          },
        },
      },
    });

    return NextResponse.json(minuta, { status: 201 });
  } catch (error) {
    console.error('Error saving minuta:', error);
    return NextResponse.json({ error: 'Error al guardar minuta' }, { status: 500 });
  }
}
