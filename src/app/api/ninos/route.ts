import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const unidadId = searchParams.get('unidad_id') || searchParams.get('hogar_id');
    const q = searchParams.get('q');
    const estado = searchParams.get('estado');

    if (id) {
      const nino = await prisma.beneficiarioNino.findUnique({
        where: { id: Number(id) },
        include: { unidad: true },
      });
      if (!nino) return NextResponse.json({ error: 'Niño no encontrado' }, { status: 404 });
      return NextResponse.json(nino);
    }

    const whereClause: any = {};
    if (unidadId) {
      whereClause.unidad_id = Number(unidadId);
    }
    if (estado) {
      whereClause.estado = estado;
    }
    if (q) {
      whereClause.OR = [
        { nombre_completo: { contains: q } },
        { numero_documento: { contains: q } },
        { acudiente: { contains: q } },
      ];
    }

    const ninos = await prisma.beneficiarioNino.findMany({
      where: whereClause,
      include: {
        unidad: {
          select: { id: true, nombre: true, madre_comunitaria: true, telefono: true, direccion: true },
        },
      },
      orderBy: { nombre_completo: 'asc' },
    });

    return NextResponse.json(ninos);
  } catch (error) {
    console.error('Error fetching niños:', error);
    return NextResponse.json({ error: 'Error al obtener beneficiarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nombre_completo,
      tipo_documento,
      numero_documento,
      fecha_nacimiento,
      genero,
      acudiente,
      contacto_acudiente,
      parentesco,
      eps,
      rh,
      alergias,
      peso_actual_kg,
      talla_actual_cm,
      unidad_id,
      hogar_id,
    } = body;

    const targetUnidadId = unidad_id || hogar_id;

    if (!nombre_completo || !numero_documento || !fecha_nacimiento || !genero || !acudiente || !contacto_acudiente || !targetUnidadId) {
      return NextResponse.json({ error: 'Todos los campos obligatorios deben ser diligenciados' }, { status: 400 });
    }

    const nuevoNino = await prisma.beneficiarioNino.create({
      data: {
        nombre_completo: nombre_completo.trim(),
        tipo_documento: tipo_documento || 'RC',
        numero_documento: numero_documento.trim(),
        fecha_nacimiento: new Date(fecha_nacimiento),
        genero: genero.toUpperCase(),
        acudiente: acudiente.trim(),
        contacto_acudiente: contacto_acudiente.trim(),
        parentesco: parentesco ? parentesco.trim() : 'Madre',
        eps: eps ? eps.trim() : null,
        rh: rh ? rh.trim().toUpperCase() : null,
        alergias: alergias ? alergias.trim() : null,
        peso_actual_kg: peso_actual_kg ? parseFloat(peso_actual_kg) : null,
        talla_actual_cm: talla_actual_cm ? parseFloat(talla_actual_cm) : null,
        unidad_id: Number(targetUnidadId),
      },
      include: {
        unidad: true,
      },
    });

    return NextResponse.json(nuevoNino, { status: 201 });
  } catch (error) {
    console.error('Error creando niño:', error);
    return NextResponse.json({ error: 'Error al registrar beneficiario' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      nombre_completo,
      tipo_documento,
      numero_documento,
      fecha_nacimiento,
      genero,
      acudiente,
      contacto_acudiente,
      parentesco,
      eps,
      rh,
      alergias,
      peso_actual_kg,
      talla_actual_cm,
      estado,
      unidad_id,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de niño requerido' }, { status: 400 });
    }

    const ninoActualizado = await prisma.beneficiarioNino.update({
      where: { id: Number(id) },
      data: {
        nombre_completo: nombre_completo?.trim(),
        tipo_documento: tipo_documento,
        numero_documento: numero_documento?.trim(),
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined,
        genero: genero ? genero.toUpperCase() : undefined,
        acudiente: acudiente?.trim(),
        contacto_acudiente: contacto_acudiente?.trim(),
        parentesco: parentesco?.trim(),
        eps: eps ? eps.trim() : null,
        rh: rh ? rh.trim().toUpperCase() : null,
        alergias: alergias ? alergias.trim() : null,
        peso_actual_kg: peso_actual_kg !== undefined ? (peso_actual_kg ? parseFloat(peso_actual_kg) : null) : undefined,
        talla_actual_cm: talla_actual_cm !== undefined ? (talla_actual_cm ? parseFloat(talla_actual_cm) : null) : undefined,
        estado: estado || undefined,
        unidad_id: unidad_id ? Number(unidad_id) : undefined,
      },
      include: { unidad: true },
    });

    return NextResponse.json(ninoActualizado);
  } catch (error) {
    console.error('Error actualizando niño:', error);
    return NextResponse.json({ error: 'Error al actualizar beneficiario' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de niño requerido' }, { status: 400 });
    }

    await prisma.beneficiarioNino.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: 'Beneficiario retirado exitosamente' });
  } catch (error) {
    console.error('Error eliminando niño:', error);
    return NextResponse.json({ error: 'Error al eliminar beneficiario' }, { status: 500 });
  }
}
