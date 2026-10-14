import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra completa de la Tabla de Composición de Alimentos Colombianos (TCAC 2018 - ICBF)...');

  // 1. Limpiar base de datos
  await prisma.minutaDetalle.deleteMany({});
  await prisma.minuta.deleteMany({});
  await prisma.metaRIEN.deleteMany({});
  await prisma.alimentoTCAC.deleteMany({});
  await prisma.unidadAtencion.deleteMany({});

  // 2. Insertar Catálogo TCAC Completo (Valores oficiales por 100g de porción comestible limpia)
  const datasetTCAC = [
    // --- GRUPO A: CEREALES Y DERIVADOS ---
    { codigo: 'A001', nombre: 'Almidón de maíz, crudo', grupo: 'Cereales y Raíces', pCom: 100, kcal: 370, prot: 0.3, grasa: 0.1, carb: 91.4, fe: 0.5, ca: 2, zn: 0.1, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A002', nombre: 'Almojábana, bogotana, horneada', grupo: 'Cereales y Raíces', pCom: 100, kcal: 285, prot: 13.0, grasa: 12.3, carb: 30.6, fe: 2.2, ca: 320, zn: 0.0, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A003', nombre: 'Almojábana, vallecaucana, horneada', grupo: 'Cereales y Raíces', pCom: 100, kcal: 341, prot: 17.5, grasa: 14.7, carb: 34.6, fe: 2.2, ca: 500, zn: 0.0, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A004', nombre: 'Arepa de maíz precocido, con sal', grupo: 'Cereales y Raíces', pCom: 100, kcal: 163, prot: 3.3, grasa: 0.9, carb: 35.0, fe: 0.7, ca: 17, zn: 0.2, vitA: 36, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A005', nombre: 'Arepa de maíz precocido, sin sal', grupo: 'Cereales y Raíces', pCom: 100, kcal: 156, prot: 3.4, grasa: 0.5, carb: 34.5, fe: 0.5, ca: 19, zn: 0.2, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A006', nombre: 'Arepa de maíz, asada', grupo: 'Cereales y Raíces', pCom: 100, kcal: 162, prot: 4.1, grasa: 0.0, carb: 36.3, fe: 1.5, ca: 3, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A007', nombre: 'Arepa de maíz, con queso, asada', grupo: 'Cereales y Raíces', pCom: 100, kcal: 211, prot: 4.8, grasa: 8.4, carb: 29.0, fe: 0.7, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A008', nombre: 'Arepa de maíz, frita', grupo: 'Cereales y Raíces', pCom: 100, kcal: 325, prot: 3.4, grasa: 20.3, carb: 32.1, fe: 0.4, ca: 2, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A009', nombre: 'Arroz blanco, pulido, cocido, sin sal', grupo: 'Cereales y Raíces', pCom: 100, kcal: 161, prot: 2.3, grasa: 2.1, carb: 32.5, fe: 0.2, ca: 10, zn: 0.7, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A010', nombre: 'Arroz blanco, pulido, crudo', grupo: 'Cereales y Raíces', pCom: 100, kcal: 353, prot: 6.7, grasa: 0.4, carb: 80.1, fe: 0.8, ca: 9, zn: 1.2, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A011', nombre: 'Arroz integral, cocido, sin sal', grupo: 'Cereales y Raíces', pCom: 100, kcal: 370, prot: 7.5, grasa: 2.6, carb: 77.3, fe: 1.8, ca: 28, zn: 2.0, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A012', nombre: 'Avena en hojuelas, precocida', grupo: 'Cereales y Raíces', pCom: 100, kcal: 411, prot: 16.9, grasa: 7.5, carb: 64.1, fe: 4.5, ca: 54, zn: 4.0, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A013', nombre: 'Brownie, de chocolate, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 427, prot: 4.8, grasa: 16.3, carb: 64.2, fe: 2.2, ca: 29, zn: 0.7, vitA: 20, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A014', nombre: 'Cebada, perlada, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 385, prot: 12.5, grasa: 1.8, carb: 72.1, fe: 2.7, ca: 36, zn: 2.1, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A015', nombre: 'Cereal para el desayuno, hojuelas de maíz', grupo: 'Cereales y Raíces', pCom: 100, kcal: 383, prot: 8.1, grasa: 0.4, carb: 85.0, fe: 7.9, ca: 5, zn: 0.4, vitA: 0, empaqueG: 500, tipoEmp: 'caja 500g' },
    { codigo: 'A016', nombre: 'Croissant, de queso, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 445, prot: 9.2, grasa: 23.0, carb: 48.9, fe: 1.6, ca: 48, zn: 0.8, vitA: 227, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A017', nombre: 'Cuchuco de cebada, crudo', grupo: 'Cereales y Raíces', pCom: 100, kcal: 358, prot: 8.4, grasa: 0.7, carb: 79.4, fe: 1.7, ca: 36, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A018', nombre: 'Cuchuco de trigo, crudo', grupo: 'Cereales y Raíces', pCom: 100, kcal: 358, prot: 12.8, grasa: 1.2, carb: 74.0, fe: 4.3, ca: 50, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A019', nombre: 'Envuelto de mazorca, precocido', grupo: 'Cereales y Raíces', pCom: 100, kcal: 186, prot: 4.8, grasa: 7.9, carb: 23.5, fe: 0.2, ca: 104, zn: 0.4, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A020', nombre: 'Galletas dulces, con relleno', grupo: 'Cereales y Raíces', pCom: 100, kcal: 516, prot: 3.8, grasa: 24.1, carb: 70.1, fe: 3.6, ca: 36, zn: 0.4, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A022', nombre: 'Galletas dulces, de avena, con uvas pasas', grupo: 'Cereales y Raíces', pCom: 100, kcal: 451, prot: 6.5, grasa: 16.2, carb: 68.6, fe: 2.6, ca: 100, zn: 0.9, vitA: 143, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A026', nombre: 'Galletas saladas, tipo cracker', grupo: 'Cereales y Raíces', pCom: 100, kcal: 466, prot: 8.4, grasa: 17.2, carb: 68.2, fe: 2.6, ca: 107, zn: 1.0, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A027', nombre: 'Galletas saladas, tipo soda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 424, prot: 9.6, grasa: 9.7, carb: 72.9, fe: 5.6, ca: 38, zn: 0.7, vitA: 1, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A028', nombre: 'Harina de arroz, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 361, prot: 6.0, grasa: 1.4, carb: 80.0, fe: 0.4, ca: 8, zn: 0.8, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A029', nombre: 'Harina de avena, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 414, prot: 14.7, grasa: 8.6, carb: 66.2, fe: 4.0, ca: 54, zn: 3.2, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A033', nombre: 'Harina de maíz amarillo, precocida', grupo: 'Cereales y Raíces', pCom: 100, kcal: 386, prot: 7.7, grasa: 3.3, carb: 77.6, fe: 2.7, ca: 6, zn: 1.0, vitA: 13, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A034', nombre: 'Harina de maíz blanco, precocida', grupo: 'Cereales y Raíces', pCom: 100, kcal: 380, prot: 9.1, grasa: 3.7, carb: 73.9, fe: 1.0, ca: 4, zn: 1.3, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A037', nombre: 'Harina de quinua, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 360, prot: 11.0, grasa: 4.1, carb: 69.0, fe: 4.9, ca: 44, zn: 2.7, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A038', nombre: 'Harina de trigo, fortificada, para panificación', grupo: 'Cereales y Raíces', pCom: 100, kcal: 363, prot: 13.2, grasa: 1.9, carb: 72.1, fe: 5.1, ca: 18, zn: 1.6, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A041', nombre: 'Harina de trigo, integral, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 382, prot: 13.8, grasa: 2.1, carb: 71.2, fe: 4.0, ca: 48, zn: 3.4, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A043', nombre: 'Maíz amarillo, crudo', grupo: 'Cereales y Raíces', pCom: 100, kcal: 393, prot: 9.4, grasa: 4.7, carb: 74.5, fe: 2.7, ca: 7, zn: 2.2, vitA: 34, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A045', nombre: 'Maíz blanco, crudo', grupo: 'Cereales y Raíces', pCom: 100, kcal: 363, prot: 9.4, grasa: 3.8, carb: 72.2, fe: 2.4, ca: 4, zn: 2.2, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A051', nombre: 'Maíz pira o reventón, crudo', grupo: 'Cereales y Raíces', pCom: 100, kcal: 392, prot: 10.9, grasa: 4.3, carb: 71.1, fe: 3.0, ca: 5, zn: 2.8, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'A053', nombre: 'Maíz tierno, crudo (Choclo)', grupo: 'Cereales y Raíces', pCom: 60, kcal: 152, prot: 3.4, grasa: 1.2, carb: 30.5, fe: 0.8, ca: 5, zn: 0.4, vitA: 28, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'A060', nombre: 'Pan blanco, regular, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 268, prot: 8.9, grasa: 3.4, carb: 48.8, fe: 3.0, ca: 54, zn: 0.9, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A061', nombre: 'Pan blanco, tipo molde, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 278, prot: 8.9, grasa: 1.6, carb: 56.8, fe: 1.9, ca: 25, zn: 0.8, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A063', nombre: 'Pan de dulce, regular, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 328, prot: 8.9, grasa: 4.3, carb: 63.1, fe: 3.0, ca: 31, zn: 1.4, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A064', nombre: 'Pan de leche, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 281, prot: 8.6, grasa: 4.8, carb: 49.7, fe: 3.0, ca: 83, zn: 0.6, vitA: 22, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A065', nombre: 'Pan de queso, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 367, prot: 10.4, grasa: 20.8, carb: 33.5, fe: 2.0, ca: 90, zn: 1.0, vitA: 32, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A068', nombre: 'Pan francés, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 308, prot: 10.1, grasa: 2.1, carb: 61.1, fe: 1.9, ca: 32, zn: 0.8, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A069', nombre: 'Pan integral, regular, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 279, prot: 9.4, grasa: 3.1, carb: 50.4, fe: 2.7, ca: 50, zn: 1.5, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A070', nombre: 'Pandebono, horneado', grupo: 'Cereales y Raíces', pCom: 100, kcal: 357, prot: 15.8, grasa: 10.1, carb: 50.7, fe: 7.3, ca: 450, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A071', nombre: 'Pasta alimenticia, con huevo, cocida, sin sal', grupo: 'Cereales y Raíces', pCom: 100, kcal: 132, prot: 4.5, grasa: 1.0, carb: 25.5, fe: 0.5, ca: 12, zn: 0.6, vitA: 5, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A072', nombre: 'Pasta alimenticia, enriquecida, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 371, prot: 13.0, grasa: 1.5, carb: 74.7, fe: 3.9, ca: 25, zn: 1.3, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A074', nombre: 'Pasta alimenticia, sin enriquecer, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 371, prot: 13.0, grasa: 1.4, carb: 74.8, fe: 1.0, ca: 21, zn: 1.5, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'A079', nombre: 'Quinua, cruda', grupo: 'Cereales y Raíces', pCom: 100, kcal: 376, prot: 14.6, grasa: 4.4, carb: 66.4, fe: 8.4, ca: 55, zn: 3.2, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },

    // --- GRUPO B: VERDURAS, HORTALIZAS Y DERIVADOS ---
    { codigo: 'B001', nombre: 'Aceituna, cruda', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 176, prot: 1.1, grasa: 14.7, carb: 8.3, fe: 0.5, ca: 52, zn: 0.0, vitA: 24, empaqueG: 500, tipoEmp: 'frasco' },
    { codigo: 'B003', nombre: 'Acelga, hojas, cruda', grupo: 'Verduras y Hortalizas', pCom: 85, kcal: 38, prot: 2.4, grasa: 0.2, carb: 5.3, fe: 1.8, ca: 49, zn: 0.4, vitA: 30, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B005', nombre: 'Ahuyama, cocida, sin sal', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 48, prot: 0.7, grasa: 0.7, carb: 8.4, fe: 0.3, ca: 14, zn: 0.2, vitA: 1093, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B006', nombre: 'Ahuyama, cruda', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 30, prot: 0.8, grasa: 0.2, carb: 5.8, fe: 0.8, ca: 20, zn: 0.2, vitA: 1775, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B007', nombre: 'Ají dulce, crudo', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 42, prot: 1.0, grasa: 1.6, carb: 5.1, fe: 1.0, ca: 13, zn: 0.2, vitA: 460, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B008', nombre: 'Ají rojo, crudo', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 80, prot: 1.7, grasa: 0.4, carb: 16.6, fe: 1.1, ca: 19, zn: 0.3, vitA: 544, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B009', nombre: 'Ajo, crudo', grupo: 'Verduras y Hortalizas', pCom: 95, kcal: 144, prot: 4.7, grasa: 0.3, carb: 29.3, fe: 1.3, ca: 40, zn: 1.0, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B014', nombre: 'Apio, crudo', grupo: 'Verduras y Hortalizas', pCom: 50, kcal: 26, prot: 0.7, grasa: 0.2, carb: 4.6, fe: 0.4, ca: 42, zn: 0.2, vitA: 22, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B015', nombre: 'Arracacha amarilla, sin cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 111, prot: 0.9, grasa: 0.1, carb: 26.3, fe: 0.9, ca: 21, zn: 0.0, vitA: 57, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B018', nombre: 'Arveja verde, cocida, sin sal', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 120, prot: 6.7, grasa: 0.3, carb: 19.7, fe: 1.5, ca: 19, zn: 1.2, vitA: 41, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B019', nombre: 'Arveja verde, cruda', grupo: 'Verduras y Hortalizas', pCom: 40, kcal: 99, prot: 5.9, grasa: 0.3, carb: 15.5, fe: 1.5, ca: 36, zn: 1.2, vitA: 51, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B021', nombre: 'Batata (camote), sin cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 99, prot: 1.2, grasa: 0.1, carb: 21.9, fe: 0.4, ca: 25, zn: 0.3, vitA: 673, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B023', nombre: 'Berenjena, con cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 75, kcal: 35, prot: 1.0, grasa: 0.2, carb: 5.7, fe: 0.4, ca: 10, zn: 0.1, vitA: 10, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B024', nombre: 'Berro, crudo', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 27, prot: 1.7, grasa: 0.3, carb: 3.3, fe: 1.6, ca: 195, zn: 0.2, vitA: 240, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B025', nombre: 'Brócoli, crudo', grupo: 'Verduras y Hortalizas', pCom: 40, kcal: 46, prot: 3.0, grasa: 0.3, carb: 6.6, fe: 1.1, ca: 60, zn: 0.4, vitA: 31, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B026', nombre: 'Calabaza, sin cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 31, prot: 0.8, grasa: 0.4, carb: 4.5, fe: 0.3, ca: 24, zn: 0.2, vitA: 75, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B027', nombre: 'Cebolla cabezona, cruda', grupo: 'Verduras y Hortalizas', pCom: 95, kcal: 40, prot: 1.4, grasa: 0.1, carb: 7.7, fe: 0.3, ca: 24, zn: 0.2, vitA: 1, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B028', nombre: 'Cebolla junca, hojas, cruda', grupo: 'Verduras y Hortalizas', pCom: 45, kcal: 41, prot: 1.6, grasa: 0.2, carb: 7.1, fe: 1.5, ca: 44, zn: 0.4, vitA: 60, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B029', nombre: 'Cebolla junca, tallos, cruda', grupo: 'Verduras y Hortalizas', pCom: 40, kcal: 37, prot: 1.2, grasa: 0.1, carb: 6.8, fe: 0.5, ca: 57, zn: 0.2, vitA: 200, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B030', nombre: 'Cebolla puerro, cruda', grupo: 'Verduras y Hortalizas', pCom: 95, kcal: 69, prot: 1.6, grasa: 0.1, carb: 14.4, fe: 0.8, ca: 58, zn: 0.1, vitA: 50, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B033', nombre: 'Champiñón, crudo', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 32, prot: 3.1, grasa: 0.6, carb: 3.0, fe: 0.6, ca: 6, zn: 0.5, vitA: 2, empaqueG: 500, tipoEmp: 'bandeja 500g' },
    { codigo: 'B035', nombre: 'Cilantro, crudo', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 44, prot: 2.3, grasa: 0.6, carb: 5.9, fe: 1.8, ca: 82, zn: 0.5, vitA: 390, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B036', nombre: 'Col o repollitas de bruselas, cruda', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 60, prot: 3.4, grasa: 0.3, carb: 9.1, fe: 1.4, ca: 42, zn: 0.4, vitA: 43, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B039', nombre: 'Coliflor, cruda', grupo: 'Verduras y Hortalizas', pCom: 55, kcal: 36, prot: 1.9, grasa: 0.1, carb: 5.7, fe: 0.7, ca: 25, zn: 0.3, vitA: 15, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B041', nombre: 'Espárrago, crudo', grupo: 'Verduras y Hortalizas', pCom: 56, kcal: 35, prot: 2.6, grasa: 0.3, carb: 4.4, fe: 0.9, ca: 23, zn: 0.6, vitA: 56, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B044', nombre: 'Espinaca, cruda', grupo: 'Verduras y Hortalizas', pCom: 60, kcal: 34, prot: 2.9, grasa: 0.2, carb: 3.8, fe: 2.4, ca: 123, zn: 0.5, vitA: 533, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B045', nombre: 'Fríjol verde, cocido, con sal', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 147, prot: 9.3, grasa: 0.4, carb: 25.5, fe: 1.9, ca: 31, zn: 1.3, vitA: 3, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'B046', nombre: 'Fríjol verde, crudo', grupo: 'Verduras y Hortalizas', pCom: 50, kcal: 166, prot: 10.5, grasa: 0.4, carb: 29.0, fe: 3.3, ca: 67, zn: 0.0, vitA: 4, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B048', nombre: 'Guatila (chayote), sin cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 65, kcal: 27, prot: 0.8, grasa: 0.0, carb: 5.2, fe: 0.4, ca: 15, zn: 0.7, vitA: 4, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B050', nombre: 'Haba verde, cruda', grupo: 'Verduras y Hortalizas', pCom: 60, kcal: 144, prot: 9.9, grasa: 0.6, carb: 22.5, fe: 2.0, ca: 33, zn: 0.6, vitA: 19, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B052', nombre: 'Habichuela, cruda', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 43, prot: 2.1, grasa: 0.0, carb: 7.2, fe: 1.0, ca: 40, zn: 0.2, vitA: 33, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B059', nombre: 'Lechuga común, cruda', grupo: 'Verduras y Hortalizas', pCom: 55, kcal: 18, prot: 0.8, grasa: 0.1, carb: 2.6, fe: 0.9, ca: 21, zn: 0.3, vitA: 10, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B060', nombre: 'Lechuga romana, cruda', grupo: 'Verduras y Hortalizas', pCom: 55, kcal: 23, prot: 1.1, grasa: 0.1, carb: 3.3, fe: 1.0, ca: 30, zn: 0.2, vitA: 290, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B064', nombre: 'Papa sabanera, con cáscara, cocida, sin sal', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 99, prot: 2.3, grasa: 0.1, carb: 21.0, fe: 0.8, ca: 8, zn: 0.3, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B065', nombre: 'Papa sabanera, con cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 80, prot: 2.2, grasa: 0.1, carb: 16.9, fe: 0.8, ca: 12, zn: 0.3, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B071', nombre: 'Papa criolla, con cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 96, prot: 2.2, grasa: 0.1, carb: 21.1, fe: 1.0, ca: 11, zn: 0.0, vitA: 2, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B074', nombre: 'Papa pastusa, con cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 85, prot: 2.4, grasa: 0.1, carb: 17.2, fe: 0.8, ca: 12, zn: 0.3, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B077', nombre: 'Pepino cohombro, crudo', grupo: 'Verduras y Hortalizas', pCom: 75, kcal: 14, prot: 0.5, grasa: 0.1, carb: 2.3, fe: 0.3, ca: 18, zn: 0.1, vitA: 2, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B079', nombre: 'Perejil, crudo', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 55, prot: 2.9, grasa: 1.0, carb: 6.9, fe: 6.6, ca: 138, zn: 1.1, vitA: 421, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B080', nombre: 'Pimentón rojo, crudo', grupo: 'Verduras y Hortalizas', pCom: 85, kcal: 35, prot: 1.0, grasa: 0.3, carb: 6.3, fe: 0.4, ca: 7, zn: 0.0, vitA: 184, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B081', nombre: 'Pimentón verde, crudo', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 28, prot: 0.9, grasa: 0.1, carb: 4.9, fe: 0.4, ca: 11, zn: 0.1, vitA: 20, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B089', nombre: 'Plátano hartón, maduro, crudo', grupo: 'Verduras y Hortalizas', pCom: 68, kcal: 132, prot: 1.1, grasa: 0.2, carb: 30.3, fe: 0.5, ca: 3, zn: 0.1, vitA: 54, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B092', nombre: 'Plátano hartón, verde, crudo', grupo: 'Verduras y Hortalizas', pCom: 68, kcal: 166, prot: 1.2, grasa: 0.2, carb: 39.3, fe: 0.4, ca: 8, zn: 0.1, vitA: 106, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B096', nombre: 'Rábano, sin cáscara, crudo', grupo: 'Verduras y Hortalizas', pCom: 90, kcal: 22, prot: 0.8, grasa: 0.1, carb: 3.7, fe: 0.6, ca: 23, zn: 0.3, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B098', nombre: 'Remolacha, sin cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 53, prot: 1.4, grasa: 0.1, carb: 10.3, fe: 0.8, ca: 16, zn: 0.4, vitA: 2, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B099', nombre: 'Repollo blanco, crudo', grupo: 'Verduras y Hortalizas', pCom: 70, kcal: 40, prot: 1.8, grasa: 0.3, carb: 6.4, fe: 0.5, ca: 44, zn: 0.2, vitA: 24, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B101', nombre: 'Repollo morado, crudo', grupo: 'Verduras y Hortalizas', pCom: 85, kcal: 39, prot: 1.4, grasa: 0.3, carb: 6.5, fe: 0.6, ca: 45, zn: 0.2, vitA: 4, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B103', nombre: 'Tomate de aliño / chonto, crudo', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 23, prot: 0.9, grasa: 0.1, carb: 4.1, fe: 0.5, ca: 9, zn: 0.1, vitA: 62, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B107', nombre: 'Yuca blanca, sin cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 80, kcal: 159, prot: 0.9, grasa: 0.3, carb: 37.4, fe: 0.3, ca: 16, zn: 0.3, vitA: 1, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B109', nombre: 'Zanahoria, sin cáscara, cocida, sin sal', grupo: 'Verduras y Hortalizas', pCom: 100, kcal: 43, prot: 0.8, grasa: 0.2, carb: 8.1, fe: 0.4, ca: 30, zn: 0.2, vitA: 1667, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'B110', nombre: 'Zanahoria, sin cáscara, cruda', grupo: 'Verduras y Hortalizas', pCom: 85, kcal: 47, prot: 0.7, grasa: 0.1, carb: 9.5, fe: 0.4, ca: 27, zn: 0.2, vitA: 1318, empaqueG: 1000, tipoEmp: 'kg' },

    // --- GRUPO C: FRUTAS Y DERIVADOS ---
    { codigo: 'C001', nombre: 'Aguacate Hass, crudo', grupo: 'Frutas', pCom: 64, kcal: 221, prot: 1.3, grasa: 16.4, carb: 13.5, fe: 0.5, ca: 8, zn: 0.7, vitA: 7, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C002', nombre: 'Aguacate Lorena, crudo', grupo: 'Frutas', pCom: 77, kcal: 179, prot: 1.6, grasa: 13.3, carb: 10.0, fe: 0.4, ca: 10, zn: 0.5, vitA: 3, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C009', nombre: 'Banano bocadillo, crudo', grupo: 'Frutas', pCom: 80, kcal: 125, prot: 1.2, grasa: 0.1, carb: 28.9, fe: 0.4, ca: 5, zn: 0.3, vitA: 20, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C010', nombre: 'Banano común / criollo, crudo', grupo: 'Frutas', pCom: 70, kcal: 101, prot: 1.5, grasa: 0.1, carb: 22.3, fe: 0.9, ca: 8, zn: 0.2, vitA: 22, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C014', nombre: 'Cereza, cruda', grupo: 'Frutas', pCom: 50, kcal: 104, prot: 1.2, grasa: 0.1, carb: 23.7, fe: 1.0, ca: 40, zn: 0.1, vitA: 20, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C015', nombre: 'Chirimoya, cruda', grupo: 'Frutas', pCom: 51, kcal: 95, prot: 1.5, grasa: 0.5, carb: 20.2, fe: 0.5, ca: 7, zn: 0.2, vitA: 5, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C021', nombre: 'Curuba, cruda', grupo: 'Frutas', pCom: 100, kcal: 38, prot: 0.6, grasa: 0.1, carb: 8.5, fe: 1.0, ca: 7, zn: 0.0, vitA: 170, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C023', nombre: 'Durazno, crudo', grupo: 'Frutas', pCom: 85, kcal: 58, prot: 1.0, grasa: 0.1, carb: 12.5, fe: 0.6, ca: 9, zn: 0.1, vitA: 46, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C024', nombre: 'Feijoa, cruda', grupo: 'Frutas', pCom: 83, kcal: 83, prot: 1.7, grasa: 0.0, carb: 15.8, fe: 1.9, ca: 41, zn: 0.6, vitA: 28, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C025', nombre: 'Fresa, madura, cruda', grupo: 'Frutas', pCom: 95, kcal: 45, prot: 0.8, grasa: 0.5, carb: 8.3, fe: 0.5, ca: 21, zn: 0.2, vitA: 4, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C027', nombre: 'Granada, cruda', grupo: 'Frutas', pCom: 30, kcal: 70, prot: 1.0, grasa: 1.2, carb: 12.9, fe: 0.5, ca: 13, zn: 0.2, vitA: 5, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C028', nombre: 'Granadilla, cruda', grupo: 'Frutas', pCom: 30, kcal: 95, prot: 2.1, grasa: 1.6, carb: 14.9, fe: 0.9, ca: 12, zn: 0.8, vitA: 28, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C030', nombre: 'Guanábana, cruda', grupo: 'Frutas', pCom: 70, kcal: 33, prot: 0.6, grasa: 0.2, carb: 6.8, fe: 0.2, ca: 11, zn: 0.0, vitA: 1, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C031', nombre: 'Guayaba, madura, cruda', grupo: 'Frutas', pCom: 75, kcal: 71, prot: 0.9, grasa: 0.3, carb: 13.4, fe: 0.3, ca: 13, zn: 0.3, vitA: 31, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C038', nombre: 'Higo, maduro, crudo', grupo: 'Frutas', pCom: 61, kcal: 48, prot: 0.7, grasa: 0.1, carb: 9.7, fe: 0.5, ca: 46, zn: 0.1, vitA: 7, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C042', nombre: 'Kiwi, crudo', grupo: 'Frutas', pCom: 91, kcal: 73, prot: 1.0, grasa: 0.4, carb: 15.0, fe: 0.4, ca: 30, zn: 0.1, vitA: 18, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C044', nombre: 'Limón, crudo', grupo: 'Frutas', pCom: 50, kcal: 44, prot: 0.3, grasa: 0.3, carb: 9.3, fe: 0.5, ca: 19, zn: 0.1, vitA: 1, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C045', nombre: 'Lulo, crudo', grupo: 'Frutas', pCom: 60, kcal: 48, prot: 0.9, grasa: 0.1, carb: 8.9, fe: 0.6, ca: 10, zn: 0.1, vitA: 37, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C050', nombre: 'Mandarina, cruda', grupo: 'Frutas', pCom: 70, kcal: 54, prot: 0.9, grasa: 0.1, carb: 11.4, fe: 0.3, ca: 35, zn: 0.2, vitA: 35, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C051', nombre: 'Mango común, crudo', grupo: 'Frutas', pCom: 50, kcal: 79, prot: 0.6, grasa: 0.0, carb: 17.1, fe: 0.5, ca: 15, zn: 0.0, vitA: 140, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C052', nombre: 'Mango Tommy Atkins, crudo', grupo: 'Frutas', pCom: 76, kcal: 194, prot: 0.4, grasa: 0.1, carb: 46.9, fe: 0.1, ca: 8, zn: 0.1, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C054', nombre: 'Manzana común, cruda', grupo: 'Frutas', pCom: 85, kcal: 72, prot: 0.3, grasa: 0.2, carb: 16.5, fe: 0.3, ca: 16, zn: 0.0, vitA: 3, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C056', nombre: 'Maracuyá, crudo', grupo: 'Frutas', pCom: 32, kcal: 60, prot: 1.5, grasa: 0.5, carb: 12.4, fe: 1.7, ca: 9, zn: 0.1, vitA: 173, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C060', nombre: 'Melón, crudo', grupo: 'Frutas', pCom: 50, kcal: 25, prot: 0.7, grasa: 0.0, carb: 5.0, fe: 0.4, ca: 11, zn: 0.1, vitA: 68, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C061', nombre: 'Mora de Castilla, cruda', grupo: 'Frutas', pCom: 90, kcal: 74, prot: 1.0, grasa: 0.1, carb: 14.6, fe: 1.7, ca: 42, zn: 0.5, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C062', nombre: 'Naranja, cruda', grupo: 'Frutas', pCom: 60, kcal: 41, prot: 0.7, grasa: 0.3, carb: 8.8, fe: 1.3, ca: 33, zn: 0.5, vitA: 2, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C065', nombre: 'Papaya, madura, cruda', grupo: 'Frutas', pCom: 70, kcal: 40, prot: 0.5, grasa: 0.1, carb: 8.2, fe: 0.3, ca: 24, zn: 0.1, vitA: 235, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C071', nombre: 'Pera, cruda', grupo: 'Frutas', pCom: 85, kcal: 63, prot: 0.3, grasa: 0.2, carb: 12.9, fe: 0.4, ca: 8, zn: 0.1, vitA: 2, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C072', nombre: 'Piña, cruda', grupo: 'Frutas', pCom: 55, kcal: 56, prot: 0.6, grasa: 0.1, carb: 12.4, fe: 0.5, ca: 16, zn: 0.2, vitA: 8, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C079', nombre: 'Sandía (patilla), cruda', grupo: 'Frutas', pCom: 40, kcal: 17, prot: 0.4, grasa: 0.0, carb: 3.7, fe: 0.3, ca: 4, zn: 0.1, vitA: 30, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C081', nombre: 'Tomate de árbol amarillo, crudo', grupo: 'Frutas', pCom: 60, kcal: 58, prot: 1.7, grasa: 0.1, carb: 12.5, fe: 0.8, ca: 10, zn: 0.1, vitA: 155, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C082', nombre: 'Tomate de árbol rojo, crudo', grupo: 'Frutas', pCom: 86, kcal: 55, prot: 2.0, grasa: 0.2, carb: 10.2, fe: 0.9, ca: 10, zn: 0.0, vitA: 112, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'C084', nombre: 'Uchuva, cruda', grupo: 'Frutas', pCom: 94, kcal: 77, prot: 1.5, grasa: 0.5, carb: 14.2, fe: 1.0, ca: 7, zn: 0.0, vitA: 202, empaqueG: 1000, tipoEmp: 'kg' },

    // --- GRUPO D: GRASAS Y ACEITES ---
    { codigo: 'D001', nombre: 'Aceite de ajonjolí o sésamo', grupo: 'Grasas y Aceites', pCom: 100, kcal: 900, prot: 0.0, grasa: 100.0, carb: 0.0, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500ml' },
    { codigo: 'D003', nombre: 'Aceite de canola', grupo: 'Grasas y Aceites', pCom: 100, kcal: 900, prot: 0.0, grasa: 100.0, carb: 0.0, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500ml' },
    { codigo: 'D004', nombre: 'Aceite de girasol', grupo: 'Grasas y Aceites', pCom: 100, kcal: 900, prot: 0.0, grasa: 100.0, carb: 0.0, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500ml' },
    { codigo: 'D006', nombre: 'Aceite de maíz', grupo: 'Grasas y Aceites', pCom: 100, kcal: 900, prot: 0.0, grasa: 100.0, carb: 0.0, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500ml' },
    { codigo: 'D008', nombre: 'Aceite de oliva', grupo: 'Grasas y Aceites', pCom: 100, kcal: 900, prot: 0.0, grasa: 100.0, carb: 0.0, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500ml' },
    { codigo: 'D009', nombre: 'Aceite de palma', grupo: 'Grasas y Aceites', pCom: 100, kcal: 900, prot: 0.0, grasa: 100.0, carb: 0.0, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500ml' },
    { codigo: 'D013', nombre: 'Aceite, mezcla vegetal', grupo: 'Grasas y Aceites', pCom: 100, kcal: 884, prot: 0.0, grasa: 100.0, carb: 0.0, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500ml' },
    { codigo: 'D015', nombre: 'Mantequilla', grupo: 'Grasas y Aceites', pCom: 100, kcal: 743, prot: 0.8, grasa: 82.2, carb: 0.0, fe: 0.2, ca: 22, zn: 0.1, vitA: 1170, empaqueG: 250, tipoEmp: 'barra 250g' },
    { codigo: 'D016', nombre: 'Mantequilla de maní', grupo: 'Grasas y Aceites', pCom: 100, kcal: 643, prot: 24.6, grasa: 50.0, carb: 20.7, fe: 1.7, ca: 34, zn: 2.5, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500g' },
    { codigo: 'D018', nombre: 'Margarina, con sal', grupo: 'Grasas y Aceites', pCom: 100, kcal: 732, prot: 0.6, grasa: 81.1, carb: 0.0, fe: 0.0, ca: 14, zn: 0.0, vitA: 819, empaqueG: 500, tipoEmp: 'barra 500g' },
    { codigo: 'D020', nombre: 'Mayonesa, con sal', grupo: 'Grasas y Aceites', pCom: 100, kcal: 326, prot: 0.9, grasa: 33.4, carb: 5.4, fe: 0.2, ca: 14, zn: 0.2, vitA: 84, empaqueG: 500, tipoEmp: 'frasco 500g' },

    // --- GRUPO E: PESCADOS Y MARISCOS ---
    { codigo: 'E003', nombre: 'Atún, enlatado en aceite', grupo: 'Pescados y Mariscos', pCom: 100, kcal: 211, prot: 25.5, grasa: 12.1, carb: 0.0, fe: 1.5, ca: 8, zn: 0.5, vitA: 40, empaqueG: 170, tipoEmp: 'lata 170g' },
    { codigo: 'E004', nombre: 'Atún, enlatado en agua', grupo: 'Pescados y Mariscos', pCom: 100, kcal: 127, prot: 24.2, grasa: 3.0, carb: 0.9, fe: 1.0, ca: 14, zn: 0.5, vitA: 42, empaqueG: 170, tipoEmp: 'lata 170g' },
    { codigo: 'E005', nombre: 'Bagre, graso, sin cabeza, crudo', grupo: 'Pescados y Mariscos', pCom: 85, kcal: 165, prot: 15.5, grasa: 11.4, carb: 0.0, fe: 0.6, ca: 8, zn: 0.5, vitA: 55, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E007', nombre: 'Bagre, magro, sin cabeza, crudo', grupo: 'Pescados y Mariscos', pCom: 92, kcal: 93, prot: 17.5, grasa: 2.4, carb: 0.2, fe: 1.9, ca: 19, zn: 0.6, vitA: 46, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E010', nombre: 'Bocachico, sin cabeza, crudo', grupo: 'Pescados y Mariscos', pCom: 64, kcal: 138, prot: 20.1, grasa: 6.4, carb: 0.0, fe: 2.1, ca: 24, zn: 0.0, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E015', nombre: 'Calamar, crudo', grupo: 'Pescados y Mariscos', pCom: 70, kcal: 79, prot: 16.4, grasa: 1.5, carb: 0.1, fe: 0.7, ca: 32, zn: 1.5, vitA: 233, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E016', nombre: 'Camarón, cocido, sin sal', grupo: 'Pescados y Mariscos', pCom: 83, kcal: 103, prot: 23.5, grasa: 1.0, carb: 0.0, fe: 3.0, ca: 90, zn: 1.6, vitA: 205, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E017', nombre: 'Camarón, crudo', grupo: 'Pescados y Mariscos', pCom: 87, kcal: 94, prot: 20.3, grasa: 1.2, carb: 0.5, fe: 2.5, ca: 82, zn: 1.3, vitA: 145, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E021', nombre: 'Corvina, de mar, filete, crudo', grupo: 'Pescados y Mariscos', pCom: 100, kcal: 100, prot: 17.8, grasa: 3.2, carb: 0.0, fe: 0.7, ca: 89, zn: 3.6, vitA: 78, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E030', nombre: 'Merluza, filete, crudo', grupo: 'Pescados y Mariscos', pCom: 100, kcal: 85, prot: 18.3, grasa: 1.3, carb: 0.1, fe: 0.8, ca: 27, zn: 0.3, vitA: 41, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E033', nombre: 'Pescado seco, crudo', grupo: 'Pescados y Mariscos', pCom: 100, kcal: 273, prot: 62.8, grasa: 2.4, carb: 0.0, fe: 3.6, ca: 160, zn: 1.6, vitA: 152, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E038', nombre: 'Salmón, filete, crudo', grupo: 'Pescados y Mariscos', pCom: 100, kcal: 181, prot: 20.2, grasa: 11.0, carb: 0.3, fe: 0.4, ca: 17, zn: 0.5, vitA: 51, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E040', nombre: 'Sardinas, enlatadas en salsa de tomate', grupo: 'Pescados y Mariscos', pCom: 100, kcal: 177, prot: 20.9, grasa: 10.3, carb: 0.1, fe: 2.3, ca: 380, zn: 1.4, vitA: 61, empaqueG: 170, tipoEmp: 'lata 170g' },
    { codigo: 'E043', nombre: 'Tilapia o mojarra, entera, cruda', grupo: 'Pescados y Mariscos', pCom: 62, kcal: 96, prot: 20.1, grasa: 1.7, carb: 0.0, fe: 0.6, ca: 10, zn: 0.3, vitA: 50, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E044', nombre: 'Tilapia o mojarra, frita, sin sal', grupo: 'Pescados y Mariscos', pCom: 44, kcal: 227, prot: 26.3, grasa: 13.5, carb: 0.0, fe: 1.9, ca: 72, zn: 0.9, vitA: 141, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'E047', nombre: 'Trucha, entera, cruda', grupo: 'Pescados y Mariscos', pCom: 58, kcal: 135, prot: 19.9, grasa: 6.2, carb: 0.0, fe: 0.3, ca: 34, zn: 0.7, vitA: 58, empaqueG: 1000, tipoEmp: 'kg' },

    // --- GRUPO F: CARNES Y DERIVADOS ---
    { codigo: 'F007', nombre: 'Cerdo, brazo, cocido, sin sal', grupo: 'Carnes y Aves', pCom: 100, kcal: 184, prot: 26.8, grasa: 8.5, carb: 0.0, fe: 0.9, ca: 14, zn: 3.4, vitA: 89, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F008', nombre: 'Cerdo, brazo, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 115, prot: 20.3, grasa: 3.8, carb: 0.0, fe: 0.5, ca: 10, zn: 2.4, vitA: 67, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F011', nombre: 'Cerdo, carne magra, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 140, prot: 21.4, grasa: 6.0, carb: 0.2, fe: 0.8, ca: 17, zn: 1.8, vitA: 60, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F015', nombre: 'Cerdo, costilla, cruda', grupo: 'Carnes y Aves', pCom: 77, kcal: 277, prot: 18.7, grasa: 22.5, carb: 0.0, fe: 1.0, ca: 11, zn: 1.8, vitA: 75, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F017', nombre: 'Cerdo, hígado, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 123, prot: 21.4, grasa: 3.7, carb: 1.1, fe: 23.3, ca: 10, zn: 6.4, vitA: 301, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F019', nombre: 'Cerdo, lomo, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 110, prot: 21.6, grasa: 2.5, carb: 0.3, fe: 0.9, ca: 10, zn: 1.9, vitA: 44, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F021', nombre: 'Cerdo, tocino / panceta, cocida', grupo: 'Carnes y Aves', pCom: 100, kcal: 465, prot: 39.0, grasa: 34.1, carb: 0.5, fe: 0.8, ca: 23, zn: 3.5, vitA: 111, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F025', nombre: 'Cerdo, pierna o pernil, cruda', grupo: 'Carnes y Aves', pCom: 68, kcal: 131, prot: 20.5, grasa: 5.4, carb: 0.2, fe: 1.2, ca: 8, zn: 2.5, vitA: 68, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F048', nombre: 'Gallina, entera con piel, cruda', grupo: 'Carnes y Aves', pCom: 72, kcal: 256, prot: 18.9, grasa: 20.0, carb: 0.0, fe: 1.5, ca: 12, zn: 1.2, vitA: 72, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F049', nombre: 'Hamburguesa de carne de res, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 276, prot: 16.2, grasa: 23.3, carb: 0.2, fe: 1.8, ca: 7, zn: 3.7, vitA: 44, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F051', nombre: 'Jamón de cerdo y res, tipo sánduche, precocido', grupo: 'Carnes y Aves', pCom: 100, kcal: 215, prot: 11.4, grasa: 15.5, carb: 7.4, fe: 0.6, ca: 8, zn: 1.1, vitA: 37, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F052', nombre: 'Jamón de cerdo, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 162, prot: 23.7, grasa: 6.6, carb: 2.0, fe: 2.0, ca: 12, zn: 1.7, vitA: 58, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F054', nombre: 'Mortadela de cerdo y res, precocida', grupo: 'Carnes y Aves', pCom: 100, kcal: 298, prot: 16.7, grasa: 23.8, carb: 4.3, fe: 1.8, ca: 59, zn: 1.6, vitA: 70, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F055', nombre: 'Mortadela de pollo, precocida', grupo: 'Carnes y Aves', pCom: 83, kcal: 291, prot: 16.4, grasa: 21.6, carb: 7.8, fe: 1.8, ca: 57, zn: 2.2, vitA: 83, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F061', nombre: 'Pavo, pechuga sin piel, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 108, prot: 24.3, grasa: 1.0, carb: 0.5, fe: 0.9, ca: 5, zn: 0.8, vitA: 82, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F067', nombre: 'Pollo, ala con piel, asada, sin sal', grupo: 'Carnes y Aves', pCom: 54, kcal: 247, prot: 23.8, grasa: 16.9, carb: 0.0, fe: 0.8, ca: 18, zn: 1.6, vitA: 141, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F069', nombre: 'Pollo, ala con piel, cruda', grupo: 'Carnes y Aves', pCom: 71, kcal: 214, prot: 17.5, grasa: 16.0, carb: 0.1, fe: 0.9, ca: 12, zn: 1.3, vitA: 77, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F071', nombre: 'Pollo, ala sin piel, cocida, sin sal', grupo: 'Carnes y Aves', pCom: 38, kcal: 164, prot: 26.9, grasa: 6.3, carb: 0.0, fe: 1.1, ca: 12, zn: 2.0, vitA: 74, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F073', nombre: 'Pollo, contramuslo con piel, crudo', grupo: 'Carnes y Aves', pCom: 91, kcal: 205, prot: 17.1, grasa: 15.1, carb: 0.0, fe: 0.7, ca: 10, zn: 1.6, vitA: 84, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F075', nombre: 'Pollo, contramuslo sin piel, crudo', grupo: 'Carnes y Aves', pCom: 91, kcal: 139, prot: 18.9, grasa: 7.0, carb: 0.0, fe: 0.8, ca: 7, zn: 1.6, vitA: 94, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F077', nombre: 'Pollo, entero con piel, crudo', grupo: 'Carnes y Aves', pCom: 60, kcal: 167, prot: 18.1, grasa: 10.3, carb: 0.4, fe: 0.7, ca: 12, zn: 1.5, vitA: 75, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F079', nombre: 'Pollo, hígado, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 109, prot: 17.2, grasa: 3.9, carb: 1.2, fe: 8.6, ca: 11, zn: 3.1, vitA: 345, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F081', nombre: 'Pollo, menudencias, crudas', grupo: 'Carnes y Aves', pCom: 100, kcal: 139, prot: 17.4, grasa: 7.0, carb: 1.5, fe: 5.7, ca: 10, zn: 3.0, vitA: 257, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F083', nombre: 'Pollo, molleja, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 89, prot: 17.7, grasa: 2.1, carb: 0.0, fe: 2.5, ca: 11, zn: 2.7, vitA: 240, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F084', nombre: 'Pollo, pechuga con piel, cocida, sin sal', grupo: 'Carnes y Aves', pCom: 77, kcal: 174, prot: 26.9, grasa: 7.4, carb: 0.0, fe: 0.9, ca: 12, zn: 1.0, vitA: 75, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F085', nombre: 'Pollo, pechuga con piel, cruda', grupo: 'Carnes y Aves', pCom: 93, kcal: 166, prot: 20.7, grasa: 9.2, carb: 0.1, fe: 0.7, ca: 11, zn: 0.8, vitA: 64, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F087', nombre: 'Pollo, pechuga sin piel, cocida, sin sal', grupo: 'Carnes y Aves', pCom: 69, kcal: 141, prot: 28.4, grasa: 3.0, carb: 0.3, fe: 0.9, ca: 13, zn: 1.0, vitA: 77, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F091', nombre: 'Pollo, pierna o colombina con piel, cruda', grupo: 'Carnes y Aves', pCom: 73, kcal: 182, prot: 18.1, grasa: 12.1, carb: 0.1, fe: 1.0, ca: 10, zn: 1.8, vitA: 83, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F094', nombre: 'Res, bofe o pulmón, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 90, prot: 16.6, grasa: 2.5, carb: 0.3, fe: 7.5, ca: 13, zn: 1.6, vitA: 242, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F097', nombre: 'Res, callo o menudo, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 95, prot: 14.6, grasa: 4.1, carb: 0.0, fe: 0.8, ca: 67, zn: 1.4, vitA: 122, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F098', nombre: 'Res, carne gorda, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 257, prot: 18.4, grasa: 20.3, carb: 0.2, fe: 1.5, ca: 8, zn: 3.6, vitA: 63, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F099', nombre: 'Res, carne magra, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 139, prot: 21.8, grasa: 5.7, carb: 0.0, fe: 2.7, ca: 6, zn: 5.1, vitA: 59, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F100', nombre: 'Res, carne semigorda, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 223, prot: 21.6, grasa: 15.1, carb: 0.3, fe: 1.9, ca: 6, zn: 3.6, vitA: 53, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F101', nombre: 'Res, carne molida semigorda, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 194, prot: 19.6, grasa: 12.7, carb: 0.2, fe: 1.8, ca: 12, zn: 2.5, vitA: 60, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F102', nombre: 'Res, chunchullo, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 216, prot: 11.0, grasa: 19.1, carb: 0.0, fe: 1.8, ca: 12, zn: 2.5, vitA: 150, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F105', nombre: 'Res, corazón, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 106, prot: 16.8, grasa: 3.7, carb: 1.4, fe: 5.0, ca: 8, zn: 1.8, vitA: 131, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F107', nombre: 'Res, costilla, cruda', grupo: 'Carnes y Aves', pCom: 73, kcal: 287, prot: 17.1, grasa: 23.3, carb: 2.3, fe: 1.6, ca: 9, zn: 1.6, vitA: 73, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F109', nombre: 'Res, hígado, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 138, prot: 20.4, grasa: 4.5, carb: 3.9, fe: 6.5, ca: 7, zn: 5.3, vitA: 389, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F113', nombre: 'Res, lengua, cruda', grupo: 'Carnes y Aves', pCom: 87, kcal: 219, prot: 16.5, grasa: 16.1, carb: 1.9, fe: 2.7, ca: 9, zn: 2.9, vitA: 95, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F114', nombre: 'Res, lomo, cocido, sin sal', grupo: 'Carnes y Aves', pCom: 90, kcal: 218, prot: 36.1, grasa: 7.9, carb: 0.5, fe: 3.1, ca: 5, zn: 6.2, vitA: 90, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F118', nombre: 'Res, pierna, cruda', grupo: 'Carnes y Aves', pCom: 100, kcal: 121, prot: 21.8, grasa: 3.8, carb: 0.0, fe: 2.3, ca: 20, zn: 6.9, vitA: 39, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F119', nombre: 'Res, riñón, crudo', grupo: 'Carnes y Aves', pCom: 100, kcal: 87, prot: 15.3, grasa: 2.8, carb: 0.1, fe: 5.7, ca: 13, zn: 1.9, vitA: 411, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'F125', nombre: 'Salchicha de cerdo y res, precocida', grupo: 'Carnes y Aves', pCom: 100, kcal: 266, prot: 13.8, grasa: 20.7, carb: 6.1, fe: 1.1, ca: 23, zn: 1.8, vitA: 55, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F127', nombre: 'Salchicha de pollo, precocida', grupo: 'Carnes y Aves', pCom: 100, kcal: 248, prot: 13.8, grasa: 21.4, carb: 0.0, fe: 1.1, ca: 37, zn: 1.8, vitA: 64, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F129', nombre: 'Salchichón de cerdo y pollo, cervecero, precocido', grupo: 'Carnes y Aves', pCom: 100, kcal: 243, prot: 15.3, grasa: 19.9, carb: 0.7, fe: 1.9, ca: 15, zn: 1.6, vitA: 70, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'F130', nombre: 'Salchichón de cerdo y pollo, tradicional, precocido', grupo: 'Carnes y Aves', pCom: 100, kcal: 243, prot: 15.5, grasa: 19.9, carb: 0.5, fe: 0.8, ca: 14, zn: 2.0, vitA: 70, empaqueG: 500, tipoEmp: 'paquete 500g' },

    // --- GRUPO G: LECHE Y DERIVADOS ---
    { codigo: 'G001', nombre: 'Crema de leche', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 330, prot: 2.1, grasa: 35.0, carb: 1.7, fe: 0.0, ca: 68, zn: 0.2, vitA: 110, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'G002', nombre: 'Kumis, entero, con azúcar', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 88, prot: 2.9, grasa: 2.5, carb: 13.5, fe: 0.1, ca: 113, zn: 0.3, vitA: 0, empaqueG: 1000, tipoEmp: 'litro 1L' },
    { codigo: 'G005', nombre: 'Leche de vaca, condensada, con azúcar', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 327, prot: 8.3, grasa: 8.4, carb: 54.6, fe: 0.2, ca: 270, zn: 0.9, vitA: 34, empaqueG: 380, tipoEmp: 'lata 380g' },
    { codigo: 'G006', nombre: 'Leche de vaca, descremada, en polvo', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 358, prot: 36.2, grasa: 0.5, carb: 52.2, fe: 0.4, ca: 1257, zn: 4.1, vitA: 20, empaqueG: 400, tipoEmp: 'bolsa 400g' },
    { codigo: 'G007', nombre: 'Leche de vaca, descremada, líquida, pasteurizada', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 34, prot: 3.3, grasa: 0.1, carb: 4.9, fe: 0.0, ca: 127, zn: 0.4, vitA: 2, empaqueG: 1000, tipoEmp: 'bolsa 1L' },
    { codigo: 'G008', nombre: 'Leche de vaca, entera, en polvo', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 499, prot: 26.3, grasa: 26.6, carb: 38.4, fe: 0.5, ca: 940, zn: 3.3, vitA: 97, empaqueG: 400, tipoEmp: 'bolsa 400g' },
    { codigo: 'G010', nombre: 'Leche de vaca, entera, líquida, cruda', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 65, prot: 3.3, grasa: 3.7, carb: 4.6, fe: 0.2, ca: 120, zn: 0.4, vitA: 14, empaqueG: 1000, tipoEmp: 'bolsa 1L' },
    { codigo: 'G011', nombre: 'Leche de vaca, entera, líquida, hervida', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 62, prot: 3.1, grasa: 3.3, carb: 4.8, fe: 0.0, ca: 120, zn: 0.4, vitA: 10, empaqueG: 1000, tipoEmp: 'bolsa 1L' },
    { codigo: 'G012', nombre: 'Leche de vaca, entera, líquida, pasteurizada', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 55, prot: 3.2, grasa: 3.2, carb: 3.4, fe: 0.0, ca: 120, zn: 0.4, vitA: 10, empaqueG: 1000, tipoEmp: 'bolsa 1L' },
    { codigo: 'G014', nombre: 'Queso crema, amarillo', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 293, prot: 16.4, grasa: 25.1, carb: 0.4, fe: 0.2, ca: 394, zn: 1.6, vitA: 55, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'G015', nombre: 'Queso fresco, blando, magro, tipo suero costeño', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 83, prot: 11.0, grasa: 1.5, carb: 6.4, fe: 0.0, ca: 0, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'G016', nombre: 'Queso fresco, semiblando, semimagro, tipo cuajada', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 207, prot: 15.2, grasa: 15.4, carb: 2.0, fe: 1.5, ca: 490, zn: 0.5, vitA: 0, empaqueG: 500, tipoEmp: 'bloque 500g' },
    { codigo: 'G017', nombre: 'Queso fresco, semiduro, semimagro, tipo campesino', grupo: 'Lácteos y Derivados', pCom: 94, kcal: 301, prot: 17.5, grasa: 25.5, carb: 0.3, fe: 0.4, ca: 586, zn: 2.9, vitA: 94, empaqueG: 500, tipoEmp: 'bloque 500g' },
    { codigo: 'G018', nombre: 'Queso fresco, semiduro, semimagro, tipo costeño', grupo: 'Lácteos y Derivados', pCom: 94, kcal: 303, prot: 17.5, grasa: 25.5, carb: 0.9, fe: 1.3, ca: 783, zn: 0.5, vitA: 94, empaqueG: 500, tipoEmp: 'bloque 500g' },
    { codigo: 'G019', nombre: 'Queso fresco, semiduro, semimagro, tipo mozzarella', grupo: 'Lácteos y Derivados', pCom: 79, kcal: 296, prot: 22.9, grasa: 21.4, carb: 3.1, fe: 0.2, ca: 517, zn: 2.9, vitA: 79, empaqueG: 500, tipoEmp: 'bloque 500g' },
    { codigo: 'G021', nombre: 'Queso fresco, semiduro, semimagro, tipo doble crema', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 286, prot: 23.4, grasa: 18.7, carb: 5.9, fe: 0.5, ca: 405, zn: 2.9, vitA: 0, empaqueG: 500, tipoEmp: 'bloque 500g' },
    { codigo: 'G024', nombre: 'Queso madurado, duro, semimagro, tipo parmesano', grupo: 'Lácteos y Derivados', pCom: 68, kcal: 389, prot: 35.8, grasa: 26.0, carb: 3.1, fe: 0.8, ca: 1184, zn: 2.8, vitA: 68, empaqueG: 250, tipoEmp: 'empaque 250g' },
    { codigo: 'G028', nombre: 'Yogurt, bebible, entero, con azúcar', grupo: 'Lácteos y Derivados', pCom: 100, kcal: 81, prot: 2.9, grasa: 2.8, carb: 11.2, fe: 0.0, ca: 89, zn: 0.3, vitA: 13, empaqueG: 1000, tipoEmp: 'litro 1L' },

    // --- GRUPO J: HUEVOS Y DERIVADOS ---
    { codigo: 'J001', nombre: 'Huevo de codorniz, entero, crudo', grupo: 'Huevos y Derivados', pCom: 92, kcal: 154, prot: 13.0, grasa: 11.1, carb: 0.5, fe: 3.6, ca: 64, zn: 1.5, vitA: 844, empaqueG: 120, tipoEmp: 'cubeta 12u' },
    { codigo: 'J002', nombre: 'Huevo de gallina, clara, cruda', grupo: 'Huevos y Derivados', pCom: 100, kcal: 47, prot: 10.8, grasa: 0.2, carb: 0.6, fe: 0.1, ca: 6, zn: 0.0, vitA: 0, empaqueG: 30, tipoEmp: 'unidad' },
    { codigo: 'J003', nombre: 'Huevo de gallina, entero, cocido, sin sal', grupo: 'Huevos y Derivados', pCom: 100, kcal: 145, prot: 13.0, grasa: 10.4, carb: 0.0, fe: 1.6, ca: 49, zn: 0.9, vitA: 375, empaqueG: 50, tipoEmp: 'unidad (huevo entero)' },
    { codigo: 'J004', nombre: 'Huevo de gallina, entero, crudo', grupo: 'Huevos y Derivados', pCom: 90, kcal: 149, prot: 12.6, grasa: 10.8, carb: 0.3, fe: 1.7, ca: 53, zn: 1.4, vitA: 374, empaqueG: 50, tipoEmp: 'unidad (huevo entero)' },
    { codigo: 'J006', nombre: 'Huevo de gallina, entero, frito, sin sal', grupo: 'Huevos y Derivados', pCom: 100, kcal: 208, prot: 17.1, grasa: 14.6, carb: 2.0, fe: 1.7, ca: 64, zn: 1.2, vitA: 408, empaqueG: 50, tipoEmp: 'unidad' },
    { codigo: 'J007', nombre: 'Huevo de gallina, entero, revuelto, con sal', grupo: 'Huevos y Derivados', pCom: 100, kcal: 152, prot: 10.2, grasa: 11.4, carb: 2.3, fe: 2.0, ca: 62, zn: 1.2, vitA: 338, empaqueG: 50, tipoEmp: 'unidad' },
    { codigo: 'J009', nombre: 'Huevo de gallina, yema, cruda', grupo: 'Huevos y Derivados', pCom: 100, kcal: 355, prot: 16.3, grasa: 31.9, carb: 0.7, fe: 5.1, ca: 132, zn: 2.3, vitA: 1140, empaqueG: 18, tipoEmp: 'unidad' },

    // --- GRUPO K: PRODUCTOS AZUCARADOS ---
    { codigo: 'K001', nombre: 'Arequipe o dulce de leche', grupo: 'Productos Azucarados', pCom: 100, kcal: 320, prot: 6.4, grasa: 7.5, carb: 56.7, fe: 0.1, ca: 253, zn: 0.7, vitA: 87, empaqueG: 500, tipoEmp: 'vasito 500g' },
    { codigo: 'K003', nombre: 'Azúcar blanco, granulado', grupo: 'Productos Azucarados', pCom: 100, kcal: 397, prot: 0.0, grasa: 0.0, carb: 99.3, fe: 0.1, ca: 0, zn: 0.0, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'K004', nombre: 'Azúcar moreno, granulado', grupo: 'Productos Azucarados', pCom: 100, kcal: 390, prot: 0.0, grasa: 0.0, carb: 97.5, fe: 1.9, ca: 85, zn: 0.2, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'K005', nombre: 'Bocadillo o dulce de guayaba, tradicional', grupo: 'Productos Azucarados', pCom: 100, kcal: 332, prot: 0.4, grasa: 0.5, carb: 79.6, fe: 1.2, ca: 25, zn: 0.0, vitA: 80, empaqueG: 500, tipoEmp: 'bloque 500g' },
    { codigo: 'K009', nombre: 'Chocolate, en bolas, con panela', grupo: 'Productos Azucarados', pCom: 100, kcal: 419, prot: 4.2, grasa: 10.2, carb: 77.5, fe: 4.0, ca: 37, zn: 0.0, vitA: 0, empaqueG: 500, tipoEmp: 'caja 500g' },
    { codigo: 'K010', nombre: 'Chocolate, en pastilla, con azúcar', grupo: 'Productos Azucarados', pCom: 100, kcal: 466, prot: 3.6, grasa: 16.6, carb: 75.5, fe: 3.5, ca: 36, zn: 1.2, vitA: 2, empaqueG: 500, tipoEmp: 'caja 500g' },
    { codigo: 'K011', nombre: 'Chocolate, en pastilla, con azúcar y leche', grupo: 'Productos Azucarados', pCom: 100, kcal: 466, prot: 7.5, grasa: 15.8, carb: 73.4, fe: 2.2, ca: 139, zn: 0.0, vitA: 9, empaqueG: 500, tipoEmp: 'caja 500g' },
    { codigo: 'K031', nombre: 'Miel de abejas, líquida', grupo: 'Productos Azucarados', pCom: 100, kcal: 332, prot: 0.6, grasa: 0.0, carb: 82.4, fe: 0.6, ca: 7, zn: 0.2, vitA: 0, empaqueG: 500, tipoEmp: 'frasco 500g' },
    { codigo: 'K033', nombre: 'Panela', grupo: 'Productos Azucarados', pCom: 100, kcal: 364, prot: 0.6, grasa: 0.1, carb: 90.2, fe: 4.9, ca: 42, zn: 1.4, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },

    // --- GRUPO R: ALIMENTOS MANUFACTURADOS Y PROGRAMAS ICBF ---
    { codigo: 'R001', nombre: 'Alimento para Mujer Gestante y Madre en Periodo de Lactancia, en polvo', grupo: 'Programas Especiales ICBF', pCom: 100, kcal: 395, prot: 21.5, grasa: 11.0, carb: 52.0, fe: 39.4, ca: 1166, zn: 37.4, vitA: 128, empaqueG: 900, tipoEmp: 'bolsa 900g' },
    { codigo: 'R002', nombre: 'Bienestarina Más®, precocida, en polvo, sabor a fresa natural', grupo: 'Programas Especiales ICBF', pCom: 100, kcal: 354, prot: 24.0, grasa: 3.0, carb: 57.0, fe: 10.5, ca: 800, zn: 10.5, vitA: 116, empaqueG: 900, tipoEmp: 'bolsa 900g' },
    { codigo: 'R003', nombre: 'Bienestarina Más®, precocida, en polvo, sabor a vainilla natural', grupo: 'Programas Especiales ICBF', pCom: 100, kcal: 354, prot: 24.0, grasa: 3.0, carb: 57.0, fe: 10.5, ca: 800, zn: 10.5, vitA: 116, empaqueG: 900, tipoEmp: 'bolsa 900g' },
    { codigo: 'R004', nombre: 'Bienestarina Más®, precocida, en polvo, sabor natural', grupo: 'Programas Especiales ICBF', pCom: 100, kcal: 354, prot: 21.0, grasa: 3.0, carb: 60.0, fe: 10.5, ca: 800, zn: 10.5, vitA: 116, empaqueG: 900, tipoEmp: 'bolsa 900g' },
    { codigo: 'R005', nombre: 'Bienestarina®, líquida, con arroz, avena y quinua', grupo: 'Programas Especiales ICBF', pCom: 100, kcal: 79, prot: 3.5, grasa: 2.5, carb: 10.2, fe: 1.5, ca: 125, zn: 1.5, vitA: 57, empaqueG: 200, tipoEmp: 'cajita 200ml' },
    { codigo: 'R006', nombre: 'Bienestarina®, líquida, sabor a vainilla natural', grupo: 'Programas Especiales ICBF', pCom: 100, kcal: 79, prot: 3.5, grasa: 2.5, carb: 10.2, fe: 1.5, ca: 125, zn: 1.5, vitA: 50, empaqueG: 200, tipoEmp: 'cajita 200ml' },

    // --- GRUPO T: LEGUMINOSAS Y DERIVADOS ---
    { codigo: 'T001', nombre: 'Ajonjolí o sésamo, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 648, prot: 20.4, grasa: 52.2, carb: 18.2, fe: 12.7, ca: 975, zn: 6.8, vitA: 2, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T002', nombre: 'Arveja seca, cocida, sin sal', grupo: 'Leguminosas', pCom: 100, kcal: 138, prot: 8.1, grasa: 0.4, carb: 22.4, fe: 1.5, ca: 25, zn: 1.0, vitA: 8, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T003', nombre: 'Arveja seca, cruda', grupo: 'Leguminosas', pCom: 100, kcal: 374, prot: 23.9, grasa: 1.1, carb: 60.2, fe: 4.6, ca: 60, zn: 3.5, vitA: 22, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T005', nombre: 'Fríjol blanco, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 373, prot: 21.3, grasa: 1.1, carb: 61.8, fe: 6.2, ca: 133, zn: 3.7, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T006', nombre: 'Fríjol bola roja, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 371, prot: 21.4, grasa: 1.2, carb: 58.7, fe: 7.1, ca: 125, zn: 2.8, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T007', nombre: 'Fríjol cabecita negra, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 391, prot: 21.6, grasa: 1.4, carb: 60.5, fe: 5.7, ca: 81, zn: 3.5, vitA: 2, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T009', nombre: 'Fríjol caraota o negro, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 386, prot: 22.8, grasa: 1.7, carb: 59.0, fe: 6.1, ca: 129, zn: 2.7, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T010', nombre: 'Fríjol cargamanto rojo, cocido, sin sal', grupo: 'Leguminosas', pCom: 100, kcal: 161, prot: 8.1, grasa: 0.6, carb: 26.9, fe: 2.1, ca: 46, zn: 1.0, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T011', nombre: 'Fríjol cargamanto rojo, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 386, prot: 22.8, grasa: 1.5, carb: 60.4, fe: 5.3, ca: 119, zn: 2.6, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T013', nombre: 'Fríjol guandul, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 366, prot: 19.5, grasa: 1.4, carb: 61.4, fe: 5.2, ca: 119, zn: 2.8, vitA: 9, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T019', nombre: 'Garbanzo, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 393, prot: 19.9, grasa: 5.5, carb: 58.8, fe: 6.4, ca: 120, zn: 3.1, vitA: 3, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T020', nombre: 'Haba seca, cruda', grupo: 'Leguminosas', pCom: 100, kcal: 391, prot: 25.8, grasa: 1.8, carb: 55.5, fe: 6.2, ca: 101, zn: 3.1, vitA: 4, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T025', nombre: 'Lenteja común, cocida, sin sal', grupo: 'Leguminosas', pCom: 100, kcal: 122, prot: 7.7, grasa: 0.5, carb: 18.5, fe: 1.7, ca: 14, zn: 1.1, vitA: 5, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T026', nombre: 'Lenteja común, cruda', grupo: 'Leguminosas', pCom: 100, kcal: 367, prot: 23.1, grasa: 0.9, carb: 61.0, fe: 7.2, ca: 51, zn: 3.6, vitA: 2, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T028', nombre: 'Maní, con piel, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 619, prot: 27.3, grasa: 47.8, carb: 15.8, fe: 3.3, ca: 62, zn: 3.3, vitA: 1, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T029', nombre: 'Maní, con piel, tostado, sin sal', grupo: 'Leguminosas', pCom: 98, kcal: 650, prot: 25.9, grasa: 50.4, carb: 19.2, fe: 1.8, ca: 53, zn: 3.3, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T030', nombre: 'Soya, cruda', grupo: 'Leguminosas', pCom: 100, kcal: 479, prot: 36.5, grasa: 20.7, carb: 28.8, fe: 8.9, ca: 263, zn: 4.4, vitA: 2, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'T032', nombre: 'Tofu, crudo', grupo: 'Leguminosas', pCom: 100, kcal: 142, prot: 17.4, grasa: 7.7, carb: 0.5, fe: 1.2, ca: 191, zn: 1.8, vitA: 2, empaqueG: 500, tipoEmp: 'paquete 500g' },

    // --- GRUPO P: ALIMENTOS NATIVOS ---
    { codigo: 'P001', nombre: 'Achira, sin cáscara, cocida, sin sal', grupo: 'Alimentos Nativos', pCom: 100, kcal: 244, prot: 3.4, grasa: 0.2, carb: 54.4, fe: 1.3, ca: 18, zn: 0.6, vitA: 0, empaqueG: 500, tipoEmp: 'bolsa 500g' },
    { codigo: 'P007', nombre: 'Arazá, crudo', grupo: 'Alimentos Nativos', pCom: 77, kcal: 42, prot: 1.1, grasa: 1.1, carb: 6.5, fe: 0.8, ca: 4, zn: 0.4, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'P017', nombre: 'Borojó, crudo', grupo: 'Alimentos Nativos', pCom: 60, kcal: 140, prot: 3.0, grasa: 0.6, carb: 30.5, fe: 6.9, ca: 51, zn: 1.5, vitA: 3, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'P038', nombre: 'Chontaduro amazónico, crudo', grupo: 'Alimentos Nativos', pCom: 70, kcal: 255, prot: 7.9, grasa: 16.6, carb: 18.5, fe: 1.0, ca: 38, zn: 0.0, vitA: 3260, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'P041', nombre: 'Cocona, cruda', grupo: 'Alimentos Nativos', pCom: 74, kcal: 85, prot: 0.7, grasa: 0.1, carb: 19.5, fe: 4.7, ca: 121, zn: 0.1, vitA: 92, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'P063', nombre: 'Majua o cubio, con cáscara, crudo', grupo: 'Alimentos Nativos', pCom: 95, kcal: 135, prot: 5.8, grasa: 2.4, carb: 22.6, fe: 1.0, ca: 12, zn: 0.4, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'P072', nombre: 'Ñame, con cáscara, crudo', grupo: 'Alimentos Nativos', pCom: 100, kcal: 131, prot: 2.2, grasa: 0.4, carb: 27.6, fe: 0.7, ca: 8, zn: 0.2, vitA: 7, empaqueG: 1000, tipoEmp: 'kg' },
    { codigo: 'P077', nombre: 'Olloco o chugua, con cáscara, crudo', grupo: 'Alimentos Nativos', pCom: 100, kcal: 50, prot: 1.4, grasa: 0.5, carb: 9.7, fe: 0.7, ca: 15, zn: 0.0, vitA: 0, empaqueG: 1000, tipoEmp: 'kg' },

    // --- GRUPO S: ALIMENTOS PREPARADOS ---
    { codigo: 'S001', nombre: 'Ajiaco santafereño', grupo: 'Alimentos Preparados', pCom: 95, kcal: 82, prot: 6.4, grasa: 0.8, carb: 11.3, fe: 0.7, ca: 15, zn: 0.6, vitA: 407, empaqueG: 1000, tipoEmp: 'porción' },
    { codigo: 'S004', nombre: 'Bandeja paisa', grupo: 'Alimentos Preparados', pCom: 100, kcal: 212, prot: 11.7, grasa: 11.0, carb: 15.3, fe: 1.5, ca: 32, zn: 1.2, vitA: 14, empaqueG: 1000, tipoEmp: 'porción' },
    { codigo: 'S011', nombre: 'Empanada de pipián, frita', grupo: 'Alimentos Preparados', pCom: 100, kcal: 396, prot: 4.7, grasa: 26.3, carb: 34.6, fe: 7.1, ca: 12, zn: 0.0, vitA: 7, empaqueG: 500, tipoEmp: 'paquete 500g' },
    { codigo: 'S018', nombre: 'Lechona tolimense, horneada', grupo: 'Alimentos Preparados', pCom: 100, kcal: 242, prot: 21.8, grasa: 12.0, carb: 10.2, fe: 1.6, ca: 20, zn: 1.8, vitA: 86, empaqueG: 1000, tipoEmp: 'porción' },
    { codigo: 'S024', nombre: 'Sancocho de bagre', grupo: 'Alimentos Preparados', pCom: 100, kcal: 134, prot: 16.9, grasa: 6.3, carb: 1.6, fe: 0.7, ca: 78, zn: 0.7, vitA: 57, empaqueG: 1000, tipoEmp: 'porción' },
    { codigo: 'S025', nombre: 'Sancocho valluno de gallina', grupo: 'Alimentos Preparados', pCom: 93, kcal: 121, prot: 16.4, grasa: 4.0, carb: 4.2, fe: 0.8, ca: 29, zn: 0.6, vitA: 47, empaqueG: 1000, tipoEmp: 'porción' },
  ];

  const alimentosCreados = await Promise.all(
    datasetTCAC.map((item) =>
      prisma.alimentoTCAC.create({
        data: {
          codigo_icbf: item.codigo,
          nombre: item.nombre,
          grupo_alimento: item.grupo,
          porcentaje_comestible: item.pCom,
          energia_kcal: item.kcal,
          proteina_g: item.prot,
          grasa_g: item.grasa,
          carbohidratos_g: item.carb,
          hierro_mg: item.fe,
          calcio_mg: item.ca,
          zinc_mg: item.zn,
          vitamina_a_rae: item.vitA,
          presentacion_comercial_gramos: item.empaqueG,
          tipo_empaque: item.tipoEmp,
        },
      })
    )
  );

  console.log(`✅ ${alimentosCreados.length} Alimentos oficiales TCAC 2018 insertados correctamente.`);

  // 3. Metas RIEN de Referencia ICBF
  const metaLactante = await prisma.metaRIEN.create({
    data: {
      grupo_poblacional: 'Lactantes (6 a 11 meses)',
      tiempo_comida: 'Almuerzo / Ración base',
      kcal_meta: 110.0,
      proteina_meta: 3.5,
      hierro_meta: 1.2,
      vitamina_a_meta: 150.0,
    },
  });

  const metaPreescolar = await prisma.metaRIEN.create({
    data: {
      grupo_poblacional: '1 a 2 años',
      tiempo_comida: 'Almuerzo (30% RIEN)',
      kcal_meta: 340.0,
      proteina_meta: 12.0,
      hierro_meta: 3.5,
      vitamina_a_meta: 200.0,
    },
  });

  const metaPreescolarMayor = await prisma.metaRIEN.create({
    data: {
      grupo_poblacional: '3 a 5 años',
      tiempo_comida: 'Almuerzo (30% RIEN)',
      kcal_meta: 450.0,
      proteina_meta: 16.0,
      hierro_meta: 4.5,
      vitamina_a_meta: 250.0,
    },
  });

  const metaRPPFami = await prisma.metaRIEN.create({
    data: {
      grupo_poblacional: 'Gestantes y Lactantes FAMI',
      tiempo_comida: 'RPP Mensual (70% RIEN)',
      kcal_meta: 1450.0,
      proteina_meta: 52.0,
      hierro_meta: 18.0,
      vitamina_a_meta: 600.0,
    },
  });

  console.log('✅ Metas RIEN de referencia ICBF insertadas.');

  // 4. Minuta Maestra de prueba
  const ahuyama = alimentosCreados.find((a) => a.codigo_icbf === 'B006')!;
  const yema = alimentosCreados.find((a) => a.codigo_icbf === 'J009')!;
  const arroz = alimentosCreados.find((a) => a.codigo_icbf === 'A009')!;

  const minutaEjemplo = await prisma.minuta.create({
    data: {
      nombre: 'Minuta Patrón Lactante FAMI (6-11 meses)',
      meta_rien_id: metaLactante.id,
      modalidad: 'FAMI',
      detalles: {
        create: [
          { alimento_id: ahuyama.id, gramaje_neto: 60.0 },
          { alimento_id: yema.id, gramaje_neto: 15.0 },
          { alimento_id: arroz.id, gramaje_neto: 30.0 },
        ],
      },
    },
  });

  console.log(`✅ Minuta maestra "${minutaEjemplo.nombre}" creada.`);

  // 5. Unidad de Atención de prueba
  await prisma.unidadAtencion.create({
    data: {
      nombre: 'Hogar Infantil Los Angelitos',
      regional: 'Antioquia',
      centro_zonal: 'Medellín Sur',
      numero_beneficiarios: 25,
      dias_atencion_mes: 20,
    },
  });

  console.log('✅ Unidad de Atención creada.');
  console.log('🚀 Siembra completa de la TCAC 2018 finalizada exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
