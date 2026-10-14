import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const q = searchParams.get('q');

    if (id) {
      const hogar = await prisma.unidadAtencion.findUnique({
        where: { id: Number(id) },
        include: {
          beneficiarios: {
            orderBy: { nombre_completo: 'asc' },
          },
        },
      });
      if (!hogar) return NextResponse.json({ error: 'Hogar no encontrado' }, { status: 404 });
      return NextResponse.json(hogar);
    }

    const whereClause: any = {};
    if (q) {
      whereClause.OR = [
        { nombre: { contains: q } },
        { madre_comunitaria: { contains: q } },
        { direccion: { contains: q } },
        { codigo_uds: { contains: q } },
      ];
    }

    const hogares = await prisma.unidadAtencion.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { beneficiarios: true },
        },
        beneficiarios: {
          select: { id: true, estado: true, alergias: true, fecha_nacimiento: true },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json(hogares);
  } catch (error) {
    console.error('Error fetching hogares:', error);
    return NextResponse.json({ error: 'Error al obtener hogares' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, madre_comunitaria, telefono, direccion, barrio, regional, centro_zonal, cupo_aprobado, codigo_uds } = body;

    if (!nombre || !madre_comunitaria) {
      return NextResponse.json({ error: 'Nombre de la UDS y de la Madre Comunitaria son obligatorios' }, { status: 400 });
    }

    const nuevoHogar = await prisma.unidadAtencion.create({
      data: {
        nombre: nombre.trim(),
        madre_comunitaria: madre_comunitaria.trim(),
        telefono: telefono ? telefono.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        barrio: barrio ? barrio.trim() : null,
        codigo_uds: codigo_uds ? codigo_uds.trim() : null,
        regional: regional || 'Antioquia',
        centro_zonal: centro_zonal || 'Centro Zonal 1',
        cupo_aprobado: Number(cupo_aprobado) || 14,
        numero_beneficiarios: Number(cupo_aprobado) || 14,
      },
    });

    return NextResponse.json(nuevoHogar, { status: 201 });
  } catch (error) {
    console.error('Error creando hogar:', error);
    return NextResponse.json({ error: 'Error al registrar hogar' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, madre_comunitaria, telefono, direccion, barrio, regional, centro_zonal, cupo_aprobado, codigo_uds } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID del hogar es requerido' }, { status: 400 });
    }

    const hogarActualizado = await prisma.unidadAtencion.update({
      where: { id: Number(id) },
      data: {
        nombre: nombre?.trim(),
        madre_comunitaria: madre_comunitaria?.trim(),
        telefono: telefono !== undefined ? (telefono ? telefono.trim() : null) : undefined,
        direccion: direccion !== undefined ? (direccion ? direccion.trim() : null) : undefined,
        barrio: barrio !== undefined ? (barrio ? barrio.trim() : null) : undefined,
        codigo_uds: codigo_uds !== undefined ? (codigo_uds ? codigo_uds.trim() : null) : undefined,
        regional: regional || undefined,
        centro_zonal: centro_zonal || undefined,
        cupo_aprobado: cupo_aprobado ? Number(cupo_aprobado) : undefined,
        numero_beneficiarios: cupo_aprobado ? Number(cupo_aprobado) : undefined,
      },
      include: {
        _count: {
          select: { beneficiarios: true },
        },
        beneficiarios: {
          select: {
            id: true,
            estado: true,
            alergias: true,
            fecha_nacimiento: true,
          },
        },
      },
    });

    return NextResponse.json(hogarActualizado);
  } catch (error: any) {
    console.error('Error actualizando hogar:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una UDS con ese nombre o código' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar hogar' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID del hogar requerido' }, { status: 400 });
    }

    await prisma.unidadAtencion.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: 'Hogar eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando hogar:', error);
    return NextResponse.json({ error: 'Error al eliminar hogar' }, { status: 500 });
  }
}
