import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const goals = await prisma.metaRIEN.findMany({
      orderBy: { grupo_poblacional: 'asc' },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching RIEN goals:', error);
    return NextResponse.json({ error: 'Error al obtener metas RIEN' }, { status: 500 });
  }
}
