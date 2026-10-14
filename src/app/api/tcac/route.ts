import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const grupo = searchParams.get('grupo') || '';

    const foods = await prisma.alimentoTCAC.findMany({
      where: {
        AND: [
          query ? { nombre: { contains: query } } : {},
          grupo ? { grupo_alimento: grupo } : {},
        ],
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(foods);
  } catch (error) {
    console.error('Error fetching TCAC foods:', error);
    return NextResponse.json({ error: 'Error al obtener alimentos TCAC' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      codigo_icbf,
      nombre,
      grupo_alimento,
      porcentaje_comestible,
      energia_kcal,
      proteina_g,
      grasa_g,
      carbohidratos_g,
      hierro_mg,
      calcio_mg,
      zinc_mg,
      vitamina_a_rae,
      presentacion_comercial_gramos,
      tipo_empaque,
    } = body;

    if (!nombre || !grupo_alimento || porcentaje_comestible == null) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes (nombre, grupo_alimento, porcentaje_comestible)' },
        { status: 400 }
      );
    }

    const newFood = await prisma.alimentoTCAC.create({
      data: {
        codigo_icbf: codigo_icbf || null,
        nombre,
        grupo_alimento,
        porcentaje_comestible: Number(porcentaje_comestible),
        energia_kcal: Number(energia_kcal || 0),
        proteina_g: Number(proteina_g || 0),
        grasa_g: Number(grasa_g || 0),
        carbohidratos_g: Number(carbohidratos_g || 0),
        hierro_mg: Number(hierro_mg || 0),
        calcio_mg: Number(calcio_mg || 0),
        zinc_mg: Number(zinc_mg || 0),
        vitamina_a_rae: Number(vitamina_a_rae || 0),
        presentacion_comercial_gramos: Number(presentacion_comercial_gramos || 1000),
        tipo_empaque: tipo_empaque || 'kg',
      },
    });

    return NextResponse.json(newFood, { status: 201 });
  } catch (error) {
    console.error('Error creating TCAC food:', error);
    return NextResponse.json({ error: 'Error al registrar alimento TCAC' }, { status: 500 });
  }
}
