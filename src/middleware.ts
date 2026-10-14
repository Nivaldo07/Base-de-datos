import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas del sistema de autenticación
  const isAuthApiRoute =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout';

  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('nutri_session')?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session;

  // Si el usuario ya está autenticado y visita /login, redirigir al dashboard principal
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Si el usuario NO está autenticado e intenta acceder a rutas protegidas
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto archivos estáticos internos de Next.js e imágenes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
