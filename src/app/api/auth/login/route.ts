import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Correo electrónico y contraseña requeridos' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!usuario.activo) {
      return NextResponse.json(
        { success: false, error: 'El usuario se encuentra inactivo. Contacte al administrador.' },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = await signSessionToken({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      unidad_id: usuario.unidad_id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        unidad_id: usuario.unidad_id,
      },
    });

    // Guardar cookie segura nutri_session
    response.cookies.set('nutri_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error) {
    console.error('Error en POST /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno en el servidor de autenticación' },
      { status: 500 }
    );
  }
}
