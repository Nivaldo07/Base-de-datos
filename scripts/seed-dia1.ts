import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get Grupo Etario 1 (1 a 2 años)
  const grupo = await prisma.grupoEtario.findFirst();
  if (!grupo) throw new Error("No grupo etario");

  const tcacCodes = [
    'A060', 'D015', 'J004', 'R004', 'G012', 'K003', 'C010', // Ref. Mañana
    'A010', 'D012', 'B009', 'L015', 'B074', 'B035', 'B052', 'B110', 'F085', 'P046', // Almuerzo
    'A027', 'C032', 'G017' // Ref. Tarde
  ];

  const alimentos = await prisma.alimentoTCAC.findMany({
    where: { codigo_icbf: { in: tcacCodes } }
  });

  const getAlimId = (code: string) => {
    let alim = alimentos.find(a => a.codigo_icbf === code);
    if (!alim) {
      if (code === 'D012') alim = alimentos.find(a => a.codigo_icbf === 'D013');
      if (code === 'F085') alim = alimentos.find(a => a.codigo_icbf === 'F082'); // Pollo, pechuga con piel -> Pollo
      if (code === 'A027') alim = alimentos.find(a => a.codigo_icbf === 'A024'); // Galletas saladas
      if (code === 'C010') alim = alimentos.find(a => a.codigo_icbf === 'C008'); // Banano
      if (code === 'C032') alim = alimentos.find(a => a.codigo_icbf === 'C031'); // Guayaba
      if (code === 'G017') alim = alimentos.find(a => a.codigo_icbf === 'G016'); // Queso
      if (code === 'P046') alim = alimentos.find(a => a.codigo_icbf === 'P045'); // Corozo
      if (code === 'B074') alim = alimentos.find(a => a.codigo_icbf === 'B073'); // Papa
      if (code === 'B035') alim = alimentos.find(a => a.codigo_icbf === 'B034'); // Cilantro
      if (code === 'B052') alim = alimentos.find(a => a.codigo_icbf === 'B051'); // Habichuela
      if (code === 'B110') alim = alimentos.find(a => a.codigo_icbf === 'B109'); // Zanahoria
    }
    if (!alim) {
      console.warn(`Alimento no encontrado: ${code}, usando id 1 por defecto`);
      return 1;
    }
    return alim.id;
  };

  const menu = {
    numero_dia: 1,
    grupo_etario_id: grupo.id,
    preparaciones: [
      {
        nombre: 'PAN REDONDO CON MANTEQUILLA',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('A060'), peso_bruto: 20, peso_neto: 20 },
          { alimento_id: getAlimId('D015'), peso_bruto: 6, peso_neto: 6 },
        ]
      },
      {
        nombre: 'HUEVO COCIDO',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('J004'), peso_bruto: 60, peso_neto: 54 },
        ]
      },
      {
        nombre: 'COLADA DE BIENESTARINA CON LECHE DE VACA PASTEURIZADA',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('R004'), peso_bruto: 15, peso_neto: 15 },
          { alimento_id: getAlimId('G012'), peso_bruto: 100, peso_neto: 100 },
          { alimento_id: getAlimId('K003'), peso_bruto: 2, peso_neto: 2 },
        ]
      },
      {
        nombre: 'FRUTA EN PORCION',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('C010'), peso_bruto: 71, peso_neto: 50 },
        ]
      },
      {
        nombre: 'ARROZ BLANCO',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('A010'), peso_bruto: 18, peso_neto: 18 },
          { alimento_id: getAlimId('D012'), peso_bruto: 4, peso_neto: 4 },
          { alimento_id: getAlimId('B009'), peso_bruto: 1.5, peso_neto: 1.5 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
        ]
      },
      {
        nombre: 'PAPA COMUN COCIDA EN CUADRITOS CON CILANTRO',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('B074'), peso_bruto: 25, peso_neto: 25 },
          { alimento_id: getAlimId('B035'), peso_bruto: 3.3, peso_neto: 3 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
          { alimento_id: getAlimId('D012'), peso_bruto: 3, peso_neto: 3 },
        ]
      },
      {
        nombre: 'ENSALADA DE HABICHUELA Y ZANOHORIA',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('B052'), peso_bruto: 17, peso_neto: 15 },
          { alimento_id: getAlimId('B110'), peso_bruto: 18, peso_neto: 15 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
        ]
      },
      {
        nombre: 'PECHUGA DE POLLO ASADA',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('F085'), peso_bruto: 32, peso_neto: 30 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
        ]
      },
      {
        nombre: 'JUGO DE FRUTA',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('P046'), peso_bruto: 42, peso_neto: 20 },
          { alimento_id: getAlimId('K003'), peso_bruto: 2, peso_neto: 2 },
        ]
      },
      {
        nombre: 'GALLETAS DE SODA',
        tiempo_comida: 'REFRIGERIO TARDE',
        ingredientes: [
          { alimento_id: getAlimId('A027'), peso_bruto: 20, peso_neto: 20 },
        ]
      },
      {
        nombre: 'FRUTA EN PORCION',
        tiempo_comida: 'REFRIGERIO TARDE',
        ingredientes: [
          { alimento_id: getAlimId('C032'), peso_bruto: 66, peso_neto: 50 },
        ]
      },
      {
        nombre: 'QUESO TIPO CAMPESINO',
        tiempo_comida: 'REFRIGERIO TARDE',
        ingredientes: [
          { alimento_id: getAlimId('G017'), peso_bruto: 16, peso_neto: 16 },
        ]
      }
    ]
  };

  // call the internal db logic to save it
  let existingMenu = await prisma.menu.findFirst({
    where: { numero_dia: 1, grupo_etario_id: grupo.id }
  });

  if (existingMenu) {
    await prisma.menu.delete({ where: { id: existingMenu.id } });
  }

  await prisma.menu.create({
    data: {
      numero_dia: 1,
      grupo_etario_id: grupo.id,
      preparaciones: {
        create: menu.preparaciones.map(prep => ({
          nombre: prep.nombre,
          tiempo_comida: prep.tiempo_comida,
          ingredientes: {
            create: prep.ingredientes
          }
        }))
      }
    }
  });

  console.log("¡Día 1 ingresado exitosamente!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
