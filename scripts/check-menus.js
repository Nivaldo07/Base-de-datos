const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const grupos = await prisma.grupoEtario.findMany();
  console.log('Grupos:', JSON.stringify(grupos, null, 2));
  for (const g of grupos) {
    const menus = await prisma.menu.findMany({
      where: { grupo_etario_id: g.id },
      select: { id: true, numero_dia: true }
    });
    console.log(`Grupo ${g.id} (${g.nombre}) has ${menus.length} menus:`, menus.map(m => m.numero_dia).sort((a,b)=>a-b));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
