import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = process.env.AUTH_SECRET || 'nutri-icbf-super-secret-jwt-key-2026-secure';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionUserPayload extends JWTPayload {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  unidad_id?: number | null;
}

/**
 * Firma un token JWT con la información de sesión del usuario.
 * Válido por 7 días con algoritmo HS256.
 */
export async function signSessionToken(payload: SessionUserPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Verifica y decodifica un token JWT de sesión.
 * Retorna el payload si es válido o null si expiró o es inválido.
 */
export async function verifySessionToken(token: string): Promise<SessionUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionUserPayload;
  } catch {
    return null;
  }
}
