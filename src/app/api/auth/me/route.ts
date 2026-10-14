import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nutri_session')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json(
        { authenticated: false, user: null, error: 'Sesión inválida o expirada' },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        unidad_id: true,
        unidad: {
          select: {
            id: true,
            nombre: true,
            codigo_uds: true,
          },
        },
      },
    });

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { authenticated: false, user: null, error: 'Usuario inactivo o no encontrado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: usuario,
    });
  } catch (error) {
    console.error('Error en GET /api/auth/me:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: 'Error al verificar sesión' },
      { status: 500 }
    );
  }
}
