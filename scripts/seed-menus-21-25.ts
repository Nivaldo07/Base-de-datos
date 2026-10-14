import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos exactos de los Menús 21 al 25 compartidos por el usuario
const rawMenusData = [
  // --- MENÚ 21 (Día 1 de la semana 5) ---
  {
    numero_dia: 21,
    items: [
      { nombre: "Yuca blanca, sin cáscara, cruda", gMenor: 25, gMayor: 31.25, tcacCode: "B091", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Huevo de gallina, entero, crudo", gMenor: 60, gMayor: 60, tcacCode: "J004", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Aceite de soya", gMenor: 2, gMayor: 2, tcacCode: "D013", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Chocolate, en pastilla, con azúcar", gMenor: 5, gMayor: 5, tcacCode: "K009", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Leche de vaca, entera, líquida, pasteurizada", gMenor: 100, gMayor: 150, tcacCode: "G012", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Azúcar blanco, granulado", gMenor: 2, gMayor: 3, tcacCode: "K003", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Mandarina, cruda", gMenor: 70, gMayor: 84, tcacCode: "C039", tiempo: "ALMUERZO" },
      { nombre: "Arroz blanco, pulido, crudo", gMenor: 18, gMayor: 23, tcacCode: "A010", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 4, gMayor: 5, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.65, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Plátano hartón, verde, crudo", gMenor: 37.5, gMayor: 45, tcacCode: "B089", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 2, gMayor: 2, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Lechuga común, cruda", gMenor: 45, gMayor: 54, tcacCode: "B056", tiempo: "ALMUERZO" },
      { nombre: "Zanahoria, sin cáscara, cruda", gMenor: 6, gMayor: 12, tcacCode: "B109", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Pollo, pechuga con piel, cruda", gMenor: 32, gMayor: 42, tcacCode: "F082", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 5, gMayor: 5, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Ají dulce, crudo", gMenor: 0.5, gMayor: 0.5, tcacCode: "B007", tiempo: "ALMUERZO" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3.3, gMayor: 3.3, tcacCode: "B027", tiempo: "ALMUERZO" },
      { nombre: "Tomate, crudo", gMenor: 2.5, gMayor: 2.5, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.65, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Naranja, cruda", gMenor: 85, gMayor: 102, tcacCode: "C050", tiempo: "ALMUERZO" },
      { nombre: "Galletas saladas, tipo soda", gMenor: 20, gMayor: 25, tcacCode: "A024", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Banano común, crudo", gMenor: 35, gMayor: 84, tcacCode: "C008", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Bienestarina", gMenor: 15, gMayor: 15, tcacCode: "R004", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Leche de vaca, entera, líquida, pasteurizada", gMenor: 100, gMayor: 150, tcacCode: "G012", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Azúcar blanco, granulado", gMenor: 2, gMayor: 2, tcacCode: "K003", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Guayaba, pintona, cruda", gMenor: 37.5, gMayor: 39, tcacCode: "C031", tiempo: "REFRIGERIO TARDE" },
    ]
  },
  // --- MENÚ 22 (Día 2 de la semana 5) ---
  {
    numero_dia: 22,
    items: [
      { nombre: "Papa pastusa, con cáscara, cruda", gMenor: 22, gMayor: 31.25, tcacCode: "B074", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Mantequilla", gMenor: 3, gMayor: 3, tcacCode: "D015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Huevo de gallina, entero, crudo", gMenor: 60, gMayor: 60, tcacCode: "J004", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Bienestarina", gMenor: 15, gMayor: 15, tcacCode: "R004", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Leche de vaca, entera, líquida, pasteurizada", gMenor: 100, gMayor: 150, tcacCode: "G012", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Azúcar blanco, granulado", gMenor: 4, gMayor: 6, tcacCode: "K003", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Piña, cruda", gMenor: 90, gMayor: 108, tcacCode: "C071", tiempo: "ALMUERZO" },
      { nombre: "pasta alimenticia, cruda", gMenor: 18, gMayor: 23, tcacCode: "A074", tiempo: "ALMUERZO" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3.3, gMayor: 3.3, tcacCode: "B027", tiempo: "ALMUERZO" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 10, gMayor: 10, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 5, gMayor: 5, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.65, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "plátano hartón, maduro, crudo", gMenor: 35, gMayor: 42, tcacCode: "B077", tiempo: "ALMUERZO" },
      { nombre: "Pepino Cohombro, crudo", gMenor: 32.5, gMayor: 39, tcacCode: "B073", tiempo: "ALMUERZO" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 6.25, gMayor: 12.5, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3.3, gMayor: 3.3, tcacCode: "B027", tiempo: "ALMUERZO" },
      { nombre: "Res, carne semigorda, molida, cruda", gMenor: 30, gMayor: 40, tcacCode: "F099", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 3, gMayor: 4, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Ají dulce, crudo", gMenor: 0.5, gMayor: 0.5, tcacCode: "B007", tiempo: "ALMUERZO" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3.3, gMayor: 3.3, tcacCode: "B027", tiempo: "ALMUERZO" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 2.5, gMayor: 2.5, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.65, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Mandarina, cruda", gMenor: 70, gMayor: 84, tcacCode: "C039", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Harina de maíz blanco, precocida", gMenor: 20, gMayor: 25, tcacCode: "A034", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Aceite de soya", gMenor: 2, gMayor: 2, tcacCode: "D013", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Naranja, cruda", gMenor: 85, gMayor: 102, tcacCode: "C050", tiempo: "REFRIGERIO TARDE" },
      { nombre: "yogurt, bebible, entero, con azúcar", gMenor: 100, gMayor: 150, tcacCode: "G002", tiempo: "REFRIGERIO TARDE" },
    ]
  },
  // --- MENÚ 23 (Día 3 de la semana 5) ---
  {
    numero_dia: 23,
    items: [
      { nombre: "Harina de maíz blanco, precocida", gMenor: 20, gMayor: 25, tcacCode: "A034", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Pollo, pechuga con piel, cruda", gMenor: 22, gMayor: 27, tcacCode: "F082", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 3.7, gMayor: 3.75, tcacCode: "B103", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3, gMayor: 3.3, tcacCode: "B027", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Ají dulce, crudo", gMenor: 0.5, gMayor: 0.5, tcacCode: "B007", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Habichuela, cruda", gMenor: 3, gMayor: 3.3, tcacCode: "B052", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Ajo, crudo", gMenor: 1.5, gMayor: 1.65, tcacCode: "B009", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Aceite de soya", gMenor: 5, gMayor: 5, tcacCode: "D013", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Bienestarina", gMenor: 15, gMayor: 15, tcacCode: "R004", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Leche de vaca, entera, líquida, pasteurizada", gMenor: 100, gMayor: 150, tcacCode: "G012", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Azúcar blanco, granulado", gMenor: 4, gMayor: 6, tcacCode: "K003", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Papaya, madura, cruda", gMenor: 72, gMayor: 84, tcacCode: "C065", tiempo: "ALMUERZO" },
      { nombre: "Arroz blanco, pulido, crudo", gMenor: 18, gMayor: 23, tcacCode: "A010", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 4, gMayor: 5, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.5, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Yuca blanca, sin cáscara, cruda", gMenor: 31, gMayor: 37.5, tcacCode: "B091", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 4, gMayor: 4, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Zanahoria, sin cáscara, cruda", gMenor: 29, gMayor: 36, tcacCode: "B109", tiempo: "ALMUERZO" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 6.5, gMayor: 12.5, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Cerdo, carne magra, cruda", gMenor: 30, gMayor: 40, tcacCode: "F013", tiempo: "ALMUERZO" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 3.7, gMayor: 3.75, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3, gMayor: 3.3, tcacCode: "B027", tiempo: "ALMUERZO" },
      { nombre: "Pimentón rojo, crudo", gMenor: 2, gMayor: 2.5, tcacCode: "B083", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.5, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Banano común, crudo", gMenor: 36, gMayor: 84, tcacCode: "C008", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Pan blanco, regular, horneado", gMenor: 20, gMayor: 25, tcacCode: "A060", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Piña, cruda", gMenor: 90, gMayor: 108, tcacCode: "C071", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Queso fresco, semiduro, semigraso, tipo campesino", gMenor: 16, gMayor: 20, tcacCode: "G016", tiempo: "REFRIGERIO TARDE" },
    ]
  },
  // --- MENÚ 24 (Día 4 de la semana 5) ---
  {
    numero_dia: 24,
    items: [
      { nombre: "Pan blanco, tipo molde, horneado", gMenor: 20, gMayor: 25, tcacCode: "A060", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Queso fresco, semiduro, semigraso, tipo campesino", gMenor: 16, gMayor: 20, tcacCode: "G016", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Mantequilla", gMenor: 3, gMayor: 3, tcacCode: "D015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Huevo de gallina, entero, crudo", gMenor: 60, gMayor: 60, tcacCode: "J004", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Cebolla junca, tallos, cruda", gMenor: 7, gMayor: 6, tcacCode: "B031", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Aceite de soya", gMenor: 3, gMayor: 3, tcacCode: "D013", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Naranja, cruda", gMenor: 51, gMayor: 51, tcacCode: "C050", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Azúcar blanco, granulado", gMenor: 2, gMayor: 2, tcacCode: "K003", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Mango común, crudo", gMenor: 40, gMayor: 60, tcacCode: "C038", tiempo: "ALMUERZO" },
      { nombre: "Arroz blanco, pulido, crudo", gMenor: 10, gMayor: 15, tcacCode: "A010", tiempo: "ALMUERZO" },
      { nombre: "pasta alimenticia, cruda", gMenor: 8, gMayor: 8, tcacCode: "A074", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 4, gMayor: 5, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.65, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Yuca blanca, sin cáscara, cruda", gMenor: 31.25, gMayor: 37.5, tcacCode: "B091", tiempo: "ALMUERZO" },
      { nombre: "Repollo blanco, crudo", gMenor: 35, gMayor: 42, tcacCode: "B095", tiempo: "ALMUERZO" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 6.25, gMayor: 12.5, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Pollo, pechuga con piel, cruda", gMenor: 32, gMayor: 42, tcacCode: "F082", tiempo: "ALMUERZO" },
      { nombre: "Harina de trigo, fortificada", gMenor: 5, gMayor: 5, tcacCode: "A043", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 3, gMayor: 3, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Maracuyá, cruda", gMenor: 90, gMayor: 42, tcacCode: "C044", tiempo: "ALMUERZO" },
      { nombre: "Azúcar blanco, granulado", gMenor: 2, gMayor: 2, tcacCode: "K003", tiempo: "ALMUERZO" },
      { nombre: "Papaya, madura, cruda", gMenor: 28, gMayor: 42, tcacCode: "C065", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Harina de maíz blanco, precocida", gMenor: 20, gMayor: 25, tcacCode: "A034", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Banano común, crudo", gMenor: 70, gMayor: 84, tcacCode: "C008", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Leche de vaca, entera, líquida, pasteurizada", gMenor: 100, gMayor: 150, tcacCode: "G012", tiempo: "REFRIGERIO TARDE" },
    ]
  },
  // --- MENÚ 25 (Día 5 de la semana 5) ---
  {
    numero_dia: 25,
    items: [
      { nombre: "Plátano hartón, verde, crudo", gMenor: 30, gMayor: 45, tcacCode: "B089", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3.3, gMayor: 3.3, tcacCode: "B027", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Ajo, crudo", gMenor: 1.65, gMayor: 1.65, tcacCode: "B009", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Aceite de soya", gMenor: 3, gMayor: 3, tcacCode: "D013", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Huevo de gallina, entero, crudo", gMenor: 60, gMayor: 60, tcacCode: "J004", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3.3, gMayor: 3.3, tcacCode: "B027", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 3.75, gMayor: 3.75, tcacCode: "B103", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Aceite de soya", gMenor: 3, gMayor: 3, tcacCode: "D013", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Chocolate, en pastilla, con azúcar", gMenor: 5, gMayor: 5, tcacCode: "K009", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Leche de vaca, entera, líquida, pasteurizada", gMenor: 100, gMayor: 150, tcacCode: "G012", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Azúcar blanco, granulado", gMenor: 2, gMayor: 3, tcacCode: "K003", tiempo: "REFRIGERIO MANANA" },
      { nombre: "Sandía (patilla), cruda", gMenor: 125, gMayor: 150, tcacCode: "C079", tiempo: "ALMUERZO" },
      { nombre: "Arroz blanco, pulido, crudo", gMenor: 18, gMayor: 23, tcacCode: "A010", tiempo: "ALMUERZO" },
      { nombre: "Zanahoria, sin cáscara, cruda", gMenor: 6, gMayor: 6, tcacCode: "B109", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 4, gMayor: 3, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Ajo, crudo", gMenor: 1.7, gMayor: 1.65, tcacCode: "B009", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "plátano hartón, maduro, crudo", gMenor: 22.5, gMayor: 28, tcacCode: "B077", tiempo: "ALMUERZO" },
      { nombre: "Papa pastusa, con cáscara, cruda", gMenor: 12.5, gMayor: 12.5, tcacCode: "B074", tiempo: "ALMUERZO" },
      { nombre: "Habichuela, cruda", gMenor: 27.5, gMayor: 27.5, tcacCode: "B052", tiempo: "ALMUERZO" },
      { nombre: "Cebolla cabezona, cruda", gMenor: 3.3, gMayor: 3.3, tcacCode: "B027", tiempo: "ALMUERZO" },
      { nombre: "Tomate de aliño / chonto, crudo", gMenor: 6.25, gMayor: 6.25, tcacCode: "B103", tiempo: "ALMUERZO" },
      { nombre: "Res, carne semigorda, molida, cruda", gMenor: 30, gMayor: 40, tcacCode: "F099", tiempo: "ALMUERZO" },
      { nombre: "Aceite de soya", gMenor: 3, gMayor: 3, tcacCode: "D013", tiempo: "ALMUERZO" },
      { nombre: "Sal", gMenor: 0.5, gMayor: 0.5, tcacCode: "L015", tiempo: "ALMUERZO" },
      { nombre: "Piña, cruda", gMenor: 90, gMayor: 108, tcacCode: "C071", tiempo: "ALMUERZO" },
      { nombre: "Pan blanco, tipo molde, horneado", gMenor: 20, gMayor: 25, tcacCode: "A060", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Manzana común cruda", gMenor: 60, gMayor: 72, tcacCode: "C041", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Bienestarina", gMenor: 15, gMayor: 15, tcacCode: "R004", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Leche de vaca, entera, líquida, pasteurizada", gMenor: 100, gMayor: 150, tcacCode: "G012", tiempo: "REFRIGERIO TARDE" },
      { nombre: "Azúcar blanco, granulado", gMenor: 4, gMayor: 4, tcacCode: "K003", tiempo: "REFRIGERIO TARDE" },
    ]
  }
];

async function main() {
  console.log('🚀 Iniciando siembra de Menús 21 al 25 para Grupos 1 y 2...');

  // 1. Obtener los 2 Grupos Etarios
  const grupos = await prisma.grupoEtario.findMany();
  let grupoMenores = grupos.find(g => g.nombre.includes('1') || g.id === 1);
  let grupoMayores = grupos.find(g => g.nombre.includes('3') || g.id === 2);

  if (!grupoMenores || !grupoMayores) {
    throw new Error('Faltan grupos etarios en la BD');
  }

  // 2. Obtener catálogo TCAC completo para mapear IDs
  const alimentos = await prisma.alimentoTCAC.findMany();
  const getAlim = (code: string, fallbackName?: string) => {
    let a = alimentos.find(x => x.codigo_icbf === code);
    if (!a && fallbackName) {
      a = alimentos.find(x => x.nombre.toLowerCase().includes(fallbackName.toLowerCase()));
    }
    return a || alimentos[0]; // fallback
  };

  for (const mData of rawMenusData) {
    const dia = mData.numero_dia;

    // A. MENÚ GRUPO 1 (< 3 AÑOS)
    await prisma.menu.deleteMany({
      where: { numero_dia: dia, grupo_etario_id: grupoMenores.id }
    });

    await prisma.menu.create({
      data: {
        numero_dia: dia,
        grupo_etario_id: grupoMenores.id,
        preparaciones: {
          create: mData.items.map(item => {
            const alim = getAlim(item.tcacCode, item.nombre);
            return {
              nombre: item.nombre,
              tiempo_comida: item.tiempo,
              ingredientes: {
                create: [
                  {
                    alimento_id: alim.id,
                    peso_bruto: item.gMenor,
                    peso_neto: item.gMenor,
                    costo_unidad_compra: alim.costo_unidad_compra || 0
                  }
                ]
              }
            };
          })
        }
      }
    });

    // B. MENÚ GRUPO 2 (≥ 3 AÑOS)
    await prisma.menu.deleteMany({
      where: { numero_dia: dia, grupo_etario_id: grupoMayores.id }
    });

    await prisma.menu.create({
      data: {
        numero_dia: dia,
        grupo_etario_id: grupoMayores.id,
        preparaciones: {
          create: mData.items.map(item => {
            const alim = getAlim(item.tcacCode, item.nombre);
            return {
              nombre: item.nombre,
              tiempo_comida: item.tiempo,
              ingredientes: {
                create: [
                  {
                    alimento_id: alim.id,
                    peso_bruto: item.gMayor,
                    peso_neto: item.gMayor,
                    costo_unidad_compra: alim.costo_unidad_compra || 0
                  }
                ]
              }
            };
          })
        }
      }
    });

    console.log(`✅ Menú Día ${dia} insertado para Menores (${mData.items.length} ing) y Mayores (${mData.items.length} ing).`);
  }

  console.log('🎉 Siembra de Menús 21 al 25 finalizada con éxito.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
