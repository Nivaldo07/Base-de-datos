import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let grupos = await prisma.grupoEtario.findMany();
    
    // Seed them if they don't exist
    if (grupos.length === 0) {
      await prisma.grupoEtario.createMany({
        data: [
          { nombre: "1 año 11 meses a 2 años 11 meses" },
          { nombre: "3 años 11 meses a 5 años 11 meses" }
        ]
      });
      grupos = await prisma.grupoEtario.findMany();
    }

    return NextResponse.json(grupos);
  } catch (error) {
    console.error("Error fetching grupos etarios:", error);
    return NextResponse.json({ error: 'Error fetching grupos etarios' }, { status: 500 });
  }
}
