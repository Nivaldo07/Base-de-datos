import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const grupo = await prisma.grupoEtario.findFirst();
  if (!grupo) throw new Error("No grupo etario");

  const tcacCodes = [
    'A034', '1015', '1004', 'B027', 'B103', 'K010', 'G012', 'K003', 'C079', // Ref. Mañana
    'A074', 'D012', 'B009', 'B089', 'B077', 'F101', 'B007', 'C050', // Almuerzo
    'A063', 'C051' // Ref. Tarde
  ];

  const alimentos = await prisma.alimentoTCAC.findMany();

  const getAlimId = (code: string) => {
    // some codes are typos in the user's OCR (e.g. 1015 instead of L015, 1004 instead of J004, 8004 instead of R004)
    if (code === '1015') code = 'L015';
    if (code === '1004') code = 'J004';
    if (code === '8004') code = 'R004';

    let alim = alimentos.find(a => a.codigo_icbf === code);
    if (!alim) {
      if (code === 'D012') alim = alimentos.find(a => a.codigo_icbf === 'D013');
      if (code === 'F101') alim = alimentos.find(a => a.codigo_icbf === 'F099'); // Res -> carne magra
      if (code === 'B077') alim = alimentos.find(a => a.codigo_icbf === 'B076'); 
      if (code === 'K010') alim = alimentos.find(a => a.codigo_icbf === 'K009'); // Chocolate
      if (code === 'A063') alim = alimentos.find(a => a.codigo_icbf === 'A060'); // Pan
    }
    if (!alim) {
      console.warn(`Alimento no encontrado: ${code}`);
      return 1;
    }
    return alim.id;
  };

  const menu = {
    numero_dia: 2,
    grupo_etario_id: grupo.id,
    preparaciones: [
      {
        nombre: 'AREPA DE HARINA DE MAIZ CON BIENESTARINA FRITA',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('A034'), peso_bruto: 20, peso_neto: 20 },
          { alimento_id: getAlimId('R004'), peso_bruto: 15, peso_neto: 15 },
          { alimento_id: getAlimId('D012'), peso_bruto: 2, peso_neto: 2 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
        ]
      },
      {
        nombre: 'HUEVO REVUELTO CON CEBOLLA Y TOMATE',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('J004'), peso_bruto: 60, peso_neto: 54 },
          { alimento_id: getAlimId('B027'), peso_bruto: 3, peso_neto: 3 },
          { alimento_id: getAlimId('B103'), peso_bruto: 3.7, peso_neto: 3 },
          { alimento_id: getAlimId('D012'), peso_bruto: 2, peso_neto: 2 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
        ]
      },
      {
        nombre: 'CHOCOLATE COSTEÑO CON LECHE DE VACA PASTEURIZADA',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('K010'), peso_bruto: 5, peso_neto: 5 },
          { alimento_id: getAlimId('G012'), peso_bruto: 100, peso_neto: 100 },
          { alimento_id: getAlimId('K003'), peso_bruto: 4, peso_neto: 4 },
        ]
      },
      {
        nombre: 'FRUTA EN PORCION',
        tiempo_comida: 'REFRIGERIO MAÑANA',
        ingredientes: [
          { alimento_id: getAlimId('C079'), peso_bruto: 126, peso_neto: 50 },
        ]
      },
      {
        nombre: 'PASTA EN SALSA DE TOMATE Y CEBOLLA',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('A074'), peso_bruto: 18, peso_neto: 18 },
          { alimento_id: getAlimId('B027'), peso_bruto: 3, peso_neto: 3 },
          { alimento_id: getAlimId('B103'), peso_bruto: 10, peso_neto: 8 },
          { alimento_id: getAlimId('D012'), peso_bruto: 5, peso_neto: 5 },
          { alimento_id: getAlimId('B009'), peso_bruto: 1.5, peso_neto: 1.5 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
        ]
      },
      {
        nombre: 'PLATANO HARTON AMARILLO COCIDO',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('B089'), peso_bruto: 35, peso_neto: 25 },
        ]
      },
      {
        nombre: 'ENSALADA DE PEPINO Y TOMATE',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('B077'), peso_bruto: 33, peso_neto: 25 },
          { alimento_id: getAlimId('B103'), peso_bruto: 6.5, peso_neto: 5 },
        ]
      },
      {
        nombre: 'CARNE DE RES MOLIDA CON TOMATE-CEBOLLA ROJA-AJI',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('F101'), peso_bruto: 30, peso_neto: 30 },
          { alimento_id: getAlimId('B103'), peso_bruto: 3.7, peso_neto: 3 },
          { alimento_id: getAlimId('B027'), peso_bruto: 2.5, peso_neto: 3 },
          { alimento_id: getAlimId('B007'), peso_bruto: 0.5, peso_neto: 0.5 },
          { alimento_id: getAlimId('D012'), peso_bruto: 4, peso_neto: 4 },
          { alimento_id: getAlimId('L015'), peso_bruto: 0.5, peso_neto: 0.5 },
        ]
      },
      {
        nombre: 'FRUTA EN PORCION',
        tiempo_comida: 'ALMUERZO',
        ingredientes: [
          { alimento_id: getAlimId('C050'), peso_bruto: 71, peso_neto: 50 },
        ]
      },
      {
        nombre: 'PAN MANTEQUILLA',
        tiempo_comida: 'REFRIGERIO TARDE',
        ingredientes: [
          { alimento_id: getAlimId('A063'), peso_bruto: 20, peso_neto: 20 },
        ]
      },
      {
        nombre: 'FRUTA EN PORCION',
        tiempo_comida: 'REFRIGERIO TARDE',
        ingredientes: [
          { alimento_id: getAlimId('C051'), peso_bruto: 100, peso_neto: 50 },
        ]
      },
      {
        nombre: 'LECHE DE VACA PASTEURIZADA',
        tiempo_comida: 'REFRIGERIO TARDE',
        ingredientes: [
          { alimento_id: getAlimId('G012'), peso_bruto: 100, peso_neto: 100 },
        ]
      }
    ]
  };

  let existingMenu = await prisma.menu.findFirst({
    where: { numero_dia: 2, grupo_etario_id: grupo.id }
  });

  if (existingMenu) {
    await prisma.menu.delete({ where: { id: existingMenu.id } });
  }

  await prisma.menu.create({
    data: {
      numero_dia: 2,
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

  console.log("¡Día 2 ingresado exitosamente!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
