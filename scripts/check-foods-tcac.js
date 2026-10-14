const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const foods = [
  "Yuca blanca, sin cáscara, cruda",
  "Huevo de gallina, entero, crudo",
  "Aceite de soya",
  "Chocolate, en pastilla, con azúcar",
  "Leche de vaca, entera, líquida, pasteurizad",
  "Azúcar blanco, granulado",
  "Mandarina, cruda",
  "Arroz blanco, pulido, crudo",
  "Ajo, crudo",
  "Sal",
  "Plátano hartón, verde, crudo",
  "Lechuga común, cruda",
  "Zanahoria, sin cáscara, cruda",
  "Pollo, pechuga con piel, cruda",
  "Ají dulce, crudo",
  "Cebolla cabezona, cruda",
  "Tomate, crudo",
  "Naranja, cruda",
  "Galletas saladas, tipo soda",
  "Banano común, crudo",
  "Bienestarina",
  "Guayaba, pintona, cruda",
  "Papa, variedad harinosa, pastusa",
  "Mantequilla",
  "Piña, cruda",
  "pasta alimentacia",
  "plátano hartón, maduro, crudo",
  "Pepino Cohombro, crudo",
  "Res, carne semigorda, molida, cruda",
  "Harina de maíz blanco, precocida",
  "yogurt, bebible, entero, con azúcar",
  "Habichuela, cruda",
  "Papaya, madura, cruda",
  "Cerdo, carne magra, cruda",
  "Pimentón rojo, crudo",
  "Pan blanco, regular, horneado",
  "Queso fresco, semiduro, semigraso, tipo campesino",
  "Pan blanco, tipo molde, horneado",
  "Cebolla junca, tallos, cruda",
  "Mango común, crudo",
  "Repollo blanco, crudo",
  "Harina de trigo, fortificada",
  "Maracuyá, cruda",
  "Sandía, cruda",
  "Manzana común cruda"
];

async function main() {
  const allAlimentos = await prisma.alimentoTCAC.findMany({
    select: { id: true, nombre: true, codigo_icbf: true }
  });
  console.log(`Total alimentos in TCAC: ${allAlimentos.length}`);

  let found = 0;
  let missing = [];

  for (const f of foods) {
    const match = allAlimentos.find(a => 
      a.nombre.toLowerCase().includes(f.toLowerCase().slice(0, 10)) ||
      f.toLowerCase().includes(a.nombre.toLowerCase().slice(0, 10))
    );
    if (match) {
      found++;
    } else {
      missing.push(f);
    }
  }

  console.log(`Matched: ${found}/${foods.length}`);
  if (missing.length > 0) {
    console.log('Missing/Needs mapping:', missing);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
