import PDFParser from 'pdf2json';
import { GoogleGenAI } from '@google/genai';

export interface ParsedIngredient {
  codigo_tcac: string;
  nombre: string;
  peso_bruto: number;
  peso_neto: number;
  sodio_mg_excel: number | null;
  costo_unidad_compra: number | null;
  costo_unitario_excel: number | null;
}

export interface ParsedPreparacion {
  nombre: string;
  tiempo_comida: string;
  ingredientes: ParsedIngredient[];
}

export interface ParsedMinutaResult {
  numero_dia: number | null;
  grupo_etario: string | null;
  preparaciones: ParsedPreparacion[];
  parser_used: 'native_pdf2json' | 'gemini_multimodal';
}

function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    try {
      return decodeURIComponent(str.replace(/%(?![0-9a-fA-F]{2})/g, '%25'));
    } catch {
      return str;
    }
  }
}

function parseNumber(val: any): number | null {
  if (val == null) return null;
  const s = String(val).replace(/[$]/g, '').replace(/\s+/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function isTcacCode(txt: string): boolean {
  return /^[A-Z]\d{3}$/i.test(txt) || /^(1015|1004|8004|\d{4})$/.test(txt);
}

function normalizeCode(code: string): string {
  const c = code.toUpperCase().trim();
  if (c === '1015') return 'L015';
  if (c === '1004') return 'J004';
  if (c === '8004') return 'R004';
  return c;
}

const CONTINUATION_END_WORDS = ['Y', 'EN', 'CON', 'DE', 'DEL', 'O', 'A', 'AL', 'AMARILLO'];
const CONTINUATION_START_WORDS = [
  'DE', 'CON', 'EN', 'Y', 'DEL', 'AL', 'A', 'COCIDO', 'COCIDA', 'ASADA', 'ASADO',
  'FRITA', 'FRITO', 'PASTEURIZADA', 'CUADRITOS', 'ZANAHORIA', 'ZANOHORIA', 'TOMATE',
  'CEBOLLA', 'GUAYABA', 'HARINA', 'ROJA', 'NEGRA', 'BLANCA', 'VERDE'
];

const DISH_START_WORDS = [
  'PAN', 'HUEVO', 'COLADA', 'FRUTA', 'ARROZ', 'PAPA', 'ENSALADA', 'PECHUGA',
  'CARNE', 'SOPA', 'JUGO', 'GALLETA', 'GALLETAS', 'QUESO', 'YOGURT', 'LECHE',
  'AREPA', 'CREMA', 'POLLO', 'LENTEJAS', 'FRIJOL', 'FRIJOLES', 'GARBANZOS',
  'PASTA', 'VERDURAS', 'TORTILLA'
];

function cleanIngredientName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\s+\b(g|cc|g\s*o\s*cc|g\s*ó\s*cc|kg|ml|und|unidad|unidades)\b\s*$/i, '')
    .trim();
}

function getSemanticAffinity(prepName: string, ing: { tcac: string; nombre: string }): number {
  const p = prepName.toUpperCase();
  const code = ing.tcac.toUpperCase();
  const name = ing.nombre.toUpperCase();

  // FRUTA EN PORCION: should only contain fruit
  if (p === 'FRUTA EN PORCION') {
    if (code.startsWith('C') || name.includes('FRUTA') || name.includes('BANANO') || name.includes('MELON') ||
        name.includes('GUAYABA') || name.includes('SANDIA') || name.includes('MANGO') || name.includes('MANDARINA') ||
        name.includes('MANZANA') || name.includes('PIÑA') || name.includes('NARANJA') || name.includes('PAPAYA')) {
      return -50;
    }
    // Strongly penalize non-fruits in fruta en porcion
    return 100;
  }

  // ARROZ: should contain Rice
  if (p.includes('ARROZ')) {
    if (code === 'A010' || name.includes('ARROZ')) return -50;
  }

  // HUEVO: should contain Egg
  if (p.includes('HUEVO')) {
    if (code === 'J004' || name.includes('HUEVO')) return -50;
  }

  // COLADA / SORBETE: Bienestarina, Leche, Azúcar
  if (p.includes('COLADA') || p.includes('SORBETE')) {
    if (code === 'R004' || name.includes('BIENESTARINA')) return -50;
    if (code === 'G012' || name.includes('LECHE')) return -30;
    if (code === 'K003' || name.includes('AZUCAR')) return -30;
  }

  // PAPA: should contain Potato
  if (p.includes('PAPA')) {
    if (code === 'B074' || name.includes('PAPA')) return -50;
  }

  // PASTA: should contain Pasta
  if (p.includes('PASTA')) {
    if (code === 'A074' || name.includes('PASTA')) return -50;
  }

  // PECHUGA / POLLO: should contain Chicken
  if (p.includes('POLLO') || p.includes('PECHUGA')) {
    if (code === 'F085' || name.includes('POLLO')) return -50;
  }

  // CARNE / RES: should contain Meat
  if (p.includes('CARNE') || p.includes('RES')) {
    if (code === 'F101' || name.includes('RES') || name.includes('CARNE')) return -50;
  }

  // SOPA / FRIJOL: should contain Beans
  if (p.includes('FRIJOL')) {
    if (code === 'T006' || name.includes('FRIJOL')) return -50;
  }

  // JUGO: Corozo / Fruit + Azúcar
  if (p.includes('JUGO')) {
    if (code === 'P046' || name.includes('COROZO') || code.startsWith('C')) return -50;
    if (code === 'K003' || name.includes('AZUCAR')) return -30;
  }

  // GALLETAS:
  if (p.includes('GALLETA')) {
    if (code === 'A027' || name.includes('GALLETA')) return -50;
  }

  // QUESO:
  if (p.includes('QUESO')) {
    if (code === 'G017' || name.includes('QUESO')) return -50;
  }

  // YOGURT:
  if (p.includes('YOGURT')) {
    if (code === 'G028' || name.includes('YOGURT')) return -50;
  }

  // LECHE:
  if (p.includes('LECHE')) {
    if (code === 'G012' || name.includes('LECHE')) return -50;
  }

  // PAN:
  if (p.includes('PAN') && !p.includes('APANADA')) {
    if (code.startsWith('A06') || name.includes('PAN')) return -50;
  }

  // AREPA:
  if (p.includes('AREPA')) {
    if (code === 'A034' || name.includes('HARINA DE MAIZ') || name.includes('AREPA')) return -50;
  }

  return 0;
}

function alignIngredientsToPrepsSemantic(
  preps: { text: string; y: number; meal: string }[],
  ingrs: { tcac: string; nombre: string; peso_bruto: number; peso_neto: number; y: number }[]
): ParsedPreparacion[] {
  const M = preps.length;
  const N = ingrs.length;
  if (M === 0 || N === 0) return [];

  const dp: number[][] = Array.from({ length: M + 1 }, () => Array(N + 1).fill(Infinity));
  const parent: number[][] = Array.from({ length: M + 1 }, () => Array(N + 1).fill(-1));
  dp[0][0] = 0;

  for (let j = 1; j <= M; j++) {
    const prep = preps[j - 1];
    const prepY = prep.y;
    for (let k = j; k <= N - (M - j); k++) {
      let currentCost = 0;
      for (let p = k - 1; p >= j - 1; p--) {
        const ing = ingrs[p];
        const distCost = Math.abs(ing.y - prepY) * 10;
        const semCost = getSemanticAffinity(prep.text, ing);
        currentCost += (distCost + semCost);
        const total = dp[j - 1][p] + currentCost;
        if (total < dp[j][k]) {
          dp[j][k] = total;
          parent[j][k] = p;
        }
      }
    }
  }

  const splits: { start: number; end: number }[] = [];
  let currK = N;
  for (let j = M; j >= 1; j--) {
    const prevK = parent[j][currK];
    splits.unshift({ start: prevK, end: currK });
    currK = prevK;
  }

  return preps.map((p, j) => ({
    nombre: p.text.replace(/\s+/g, ' ').trim(),
    tiempo_comida: p.meal,
    ingredientes: ingrs.slice(splits[j].start, splits[j].end).map(ing => ({
      codigo_tcac: ing.tcac,
      nombre: ing.nombre,
      peso_bruto: ing.peso_bruto,
      peso_neto: ing.peso_neto,
      sodio_mg_excel: null,
      costo_unidad_compra: null,
      costo_unitario_excel: null
    }))
  }));
}

/**
 * Motor 1: Spatial Clustering Parser with Dynamic Column Detection.
 * Automatically discovers table boundaries, column X positions, and row heights dynamically.
 */
function parseSpatialClustering(texts: any[]): ParsedPreparacion[] {
  // 1. Detect Footer markers
  const footerKeywords = ['APORTE TOTAL', 'APORTE DE LA', 'RIEN PARA', 'AMDR', 'COSTO TOTAL', 'FIRMA', 'NUTRICIONISTA'];
  const footerItem = texts.find((t: any) =>
    footerKeywords.some(kw => t.text.toUpperCase().includes(kw))
  );
  const tableEnd = footerItem ? footerItem.y - 0.2 : 28.0;

  // 2. Identify TCAC code candidates
  const codeCandidates = texts.filter((t: any) =>
    t.y >= 7.0 && t.y < tableEnd && isTcacCode(t.text)
  );

  if (codeCandidates.length === 0) {
    return [];
  }

  // Calculate median X of code column
  const xValues = codeCandidates.map((c: any) => c.x).sort((a: number, b: number) => a - b);
  const medianCodeX = xValues[Math.floor(xValues.length / 2)];

  // True codes aligned with the median X column
  const trueCodes = codeCandidates
    .filter((c: any) => Math.abs(c.x - medianCodeX) <= 1.0)
    .sort((a: any, b: any) => a.y - b.y);

  if (trueCodes.length === 0) {
    return [];
  }

  const tableStartY = Math.min(...trueCodes.map((c: any) => c.y)) - 0.5;

  // 3. Extract Ingredients for each code
  const parsedIngrs = trueCodes.map((codeItem: any, idx: number) => {
    const code = normalizeCode(codeItem.text);
    const prevY = idx === 0 ? codeItem.y - 0.4 : trueCodes[idx - 1].y;
    const nextY = idx === trueCodes.length - 1 ? codeItem.y + 0.4 : trueCodes[idx + 1].y;

    const yStart = (prevY + codeItem.y) / 2;
    const yEnd = (codeItem.y + nextY) / 2;

    // Food name and weight numbers
    const rowTexts = texts.filter((t: any) =>
      t.y >= yStart && t.y < yEnd && t.x > medianCodeX + 0.4
    ).sort((a: any, b: any) => a.x - b.x);

    const nameParts: string[] = [];
    const numberParts: number[] = [];

    for (const item of rowTexts) {
      const num = parseNumber(item.text);
      if (num !== null && (item.x >= medianCodeX + 4.5 || numberParts.length > 0)) {
        numberParts.push(num);
      } else {
        nameParts.push(item.text);
      }
    }

    const ingName = cleanIngredientName(nameParts.join(' '));
    const pBruto = numberParts[0] ?? 0;
    const pNeto = numberParts[1] ?? 0;

    return {
      tcac: code,
      nombre: ingName,
      peso_bruto: pBruto,
      peso_neto: pNeto,
      y: codeItem.y
    };
  });

  // 4. Extract Preparations from Column 2 (between meals and code column)
  const rawPrepTexts = texts.filter((t: any) =>
    t.y >= tableStartY && t.y < tableEnd &&
    t.x >= 1.8 && t.x <= medianCodeX - 0.4 &&
    !t.text.toUpperCase().includes('NOMBRE DE LA PREP') &&
    !t.text.toUpperCase().includes('INGREDIENTES') &&
    !t.text.toUpperCase().includes('TIEMPO DE COMIDA') &&
    !t.text.toUpperCase().includes('CÓDIG')
  ).sort((a: any, b: any) => a.y - b.y);

  const prepLabels: { text: string; y: number }[] = [];

  for (const t of rawPrepTexts) {
    if (prepLabels.length === 0) {
      prepLabels.push({ text: t.text, y: t.y });
      continue;
    }
    const prev = prepLabels[prepLabels.length - 1];
    const prevUpper = prev.text.toUpperCase().trim();
    const currUpper = t.text.toUpperCase().trim();
    const prevLastWord = prevUpper.split(/\s+/).pop() || '';
    const currFirstWord = currUpper.split(/\s+/)[0] || '';

    const isContinuation =
      CONTINUATION_END_WORDS.includes(prevLastWord) ||
      CONTINUATION_START_WORDS.includes(currFirstWord) ||
      (t.y - prev.y <= 0.45 && !DISH_START_WORDS.some(w => currUpper.startsWith(w)));

    if (isContinuation) {
      prev.text += ' ' + t.text;
    } else {
      prepLabels.push({ text: t.text, y: t.y });
    }
  }

  if (prepLabels.length === 0) {
    return [];
  }

  // 5. Detect Meal names in Column 1 (x < 3.5)
  const mealMarkers = texts.filter((t: any) => {
    if (t.y < tableStartY - 0.5 || t.y > tableEnd) return false;
    if (t.x >= 3.5) return false;
    const u = t.text.toUpperCase();
    return u.includes('REFRIGERIO') || u.includes('ALMUERZO') || u.includes('DESAYUNO') || u.includes('CENA');
  }).sort((a: any, b: any) => a.y - b.y);

  let morningMealName = 'REFRIGERIO MAÑANA';
  let afternoonMealName = 'REFRIGERIO TARDE';
  for (const m of mealMarkers) {
    const u = m.text.toUpperCase();
    if (u.includes('DESAYUNO')) morningMealName = 'DESAYUNO';
    if (u.includes('CENA')) afternoonMealName = 'CENA';
  }

  // Find index of first lunch dish
  const totalP = prepLabels.length;
  const LUNCH_STARTERS = ['ARROZ', 'SOPA', 'PAPA', 'YUCA', 'PLATANO', 'CARNE', 'POLLO', 'PECHUGA', 'PESCADO', 'FRIJOL', 'LENTEJA', 'GARBANZO'];
  let lunchStartIndex = prepLabels.findIndex(p => {
    const u = p.text.toUpperCase();
    return LUNCH_STARTERS.some(ls => u.includes(ls));
  });

  if (lunchStartIndex === -1 || lunchStartIndex > Math.floor(totalP / 2)) {
    lunchStartIndex = 4; // Standard ICBF morning count
  }

  // Find index of afternoon snack start
  const SNACK_STARTERS = ['GALLETA', 'GALLETAS', 'QUESO', 'YOGURT'];
  let afternoonStartIndex = prepLabels.findIndex((p, idx) => {
    if (idx < lunchStartIndex + 3) return false;
    const u = p.text.toUpperCase();
    return SNACK_STARTERS.some(ss => u.includes(ss));
  });

  if (afternoonStartIndex === -1) {
    afternoonStartIndex = totalP - 3;
  }

  const prepsWithMeal = prepLabels.map((p, idx) => {
    let meal = 'ALMUERZO';
    if (idx < lunchStartIndex) {
      meal = morningMealName;
    } else if (idx >= afternoonStartIndex) {
      meal = afternoonMealName;
    } else {
      meal = 'ALMUERZO';
    }
    return { ...p, meal };
  });

  return alignIngredientsToPrepsSemantic(prepsWithMeal, parsedIngrs);
}

/**
 * Motor 2: Pure Text Stream / Regex Parser.
 * Reconstructs lines in reading order, identifies meal sections, preparation titles and ingredient tokens.
 */
function parseTextStream(texts: any[]): ParsedPreparacion[] {
  const sorted = [...texts].sort((a, b) => {
    const dy = a.y - b.y;
    if (Math.abs(dy) > 0.28) return dy;
    return a.x - b.x;
  });

  const lines: { y: number; items: any[] }[] = [];
  for (const item of sorted) {
    const lastLine = lines[lines.length - 1];
    if (!lastLine || Math.abs(item.y - lastLine.y) > 0.28) {
      lines.push({ y: item.y, items: [item] });
    } else {
      lastLine.items.push(item);
    }
  }

  const footerKeywords = ['APORTE TOTAL', 'APORTE DE LA', 'RIEN PARA', 'AMDR', 'COSTO TOTAL', 'FIRMA', 'NUTRICIONISTA'];

  let currentMeal = 'REFRIGERIO MAÑANA';
  let currentPrep = 'PREPARACION';
  const prepsMap = new Map<string, { meal: string; ingredientes: ParsedIngredient[] }>();

  for (const line of lines) {
    const lineText = line.items.map(it => it.text).join(' ');
    const lineUpper = lineText.toUpperCase();

    if (footerKeywords.some(fk => lineUpper.includes(fk))) {
      break;
    }

    if (lineUpper.includes('REFRIGERIO MAÑANA') || lineUpper.includes('DESAYUNO')) {
      currentMeal = 'REFRIGERIO MAÑANA';
    } else if (lineUpper.includes('ALMUERZO')) {
      currentMeal = 'ALMUERZO';
    } else if (lineUpper.includes('REFRIGERIO TARDE') || lineUpper.includes('CENA')) {
      currentMeal = 'REFRIGERIO TARDE';
    }

    const codeIndex = line.items.findIndex(it => isTcacCode(it.text));
    if (codeIndex !== -1) {
      const codeItem = line.items[codeIndex];
      const code = normalizeCode(codeItem.text);

      const leftItems = line.items.slice(0, codeIndex).filter(it => {
        const u = it.text.toUpperCase();
        return !u.includes('REFRIGERIO') && !u.includes('ALMUERZO') && !u.includes('DESAYUNO') &&
               !u.includes('TIEMPO') && !u.includes('PREPARACION') && !u.includes('CÓDIG');
      });

      if (leftItems.length > 0) {
        const candidatePrep = leftItems.map(it => it.text).join(' ').trim();
        if (candidatePrep.length >= 3) {
          currentPrep = candidatePrep;
        }
      }

      const rightItems = line.items.slice(codeIndex + 1);
      const nameParts: string[] = [];
      const numParts: number[] = [];

      for (const it of rightItems) {
        const n = parseNumber(it.text);
        if (n !== null && numParts.length < 2 && (nameParts.length > 0 || it.x > codeItem.x + 4.0)) {
          numParts.push(n);
        } else if (numParts.length === 0) {
          nameParts.push(it.text);
        }
      }

      const ingName = cleanIngredientName(nameParts.join(' '));
      const pBruto = numParts[0] ?? 0;
      const pNeto = numParts[1] ?? 0;

      if (!prepsMap.has(currentPrep)) {
        prepsMap.set(currentPrep, { meal: currentMeal, ingredientes: [] });
      }

      prepsMap.get(currentPrep)!.ingredientes.push({
        codigo_tcac: code,
        nombre: ingName,
        peso_bruto: pBruto,
        peso_neto: pNeto,
        sodio_mg_excel: null,
        costo_unidad_compra: null,
        costo_unitario_excel: null
      });
    } else {
      const cleanLine = lineText.replace(/TIEMPO DE COMIDA|NOMBRE DE LA PREPARACI[ÓO]N|INGREDIENTES|PESO BRUTO|PESO NETO/gi, '').trim();
      if (cleanLine.length >= 3 && cleanLine === cleanLine.toUpperCase() && !lineUpper.includes('PROCESO') && !lineUpper.includes('FORMATO') && !lineUpper.includes('ANÁLISIS')) {
        currentPrep = cleanLine;
      }
    }
  }

  return Array.from(prepsMap.entries()).map(([nombre, data]) => ({
    nombre,
    tiempo_comida: data.meal,
    ingredientes: data.ingredientes
  }));
}

/**
 * Native deterministic extractor for ICBF PDF minutas focusing strictly on the 6 essential fields.
 * Employs Dual Engine: Spatial Clustering with Dynamic Column Detection + Fallback Text Stream.
 */
export async function parseMinutaPDFNative(pdfBuffer: Buffer): Promise<ParsedMinutaResult> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)();

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(errData?.parserError || new Error('Error al parsear PDF con pdf2json'));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        const pages = pdfData?.Pages || [];
        if (pages.length === 0) {
          throw new Error('El PDF no contiene páginas válidas');
        }

        // Aggregate texts across all pages
        const allTexts: any[] = [];
        for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
          const page = pages[pageIdx];
          const pageTexts = (page.Texts || []).map((t: any) => ({
            x: Math.round(t.x * 100) / 100,
            y: Math.round((t.y + pageIdx * 30.0) * 100) / 100,
            text: safeDecode(t.R?.[0]?.T || '').trim()
          })).filter((t: any) => t.text.length > 0);
          allTexts.push(...pageTexts);
        }

        // Header detection: Menú Nº and Grupo de Edad
        let detectedDia: number | null = null;
        let detectedGrupo: string | null = null;

        for (const t of allTexts) {
          const matchMenu = t.text.match(/(?:MEN[ÚU]|D[IÍ]A|CICLO)\s*(?:N[º°\.]?|#)?\s*(\d+)/i);
          if (matchMenu && !detectedDia) {
            detectedDia = parseInt(matchMenu[1], 10);
          }
          if ((t.text.includes('año') || t.text.includes('meses') || t.text.toUpperCase().includes('MAYORES DE 1 AÑO')) && !detectedGrupo) {
            detectedGrupo = t.text;
          }
        }

        // Try Engine 1: Spatial Clustering with Dynamic Columns
        let preps = parseSpatialClustering(allTexts);

        // Verify that preparations have ingredients
        const totalIngrs = preps.reduce((acc, p) => acc + p.ingredientes.length, 0);

        // If Engine 1 failed or returned 0 ingredients, fallback to Engine 2: Text Stream
        if (preps.length === 0 || totalIngrs === 0) {
          preps = parseTextStream(allTexts);
        }

        resolve({
          numero_dia: detectedDia,
          grupo_etario: detectedGrupo,
          preparaciones: preps,
          parser_used: 'native_pdf2json'
        });
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.parseBuffer(pdfBuffer);
  });
}

/**
 * Optional Gemini multimodal extraction if GEMINI_API_KEY is configured.
 */
export async function parseMinutaPDFGemini(pdfBuffer: Buffer): Promise<ParsedMinutaResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = pdfBuffer.toString('base64');

    const prompt = `Analiza esta minuta institucional del ICBF ("Formato Ciclo de Menús - Análisis de Contenido Nutricional F4.G36.PP").
Extrae EXCLUSIVAMENTE las 6 casillas esenciales del menú, descartando toda la información de nutrientes y costos:
- numero_dia: número de menú (ejemplo: 1 si dice "MENÚ Nº 1" o "MENÚ 7").
- grupo_etario: texto del grupo de edad (ejemplo: "1 año 11 meses a 2 años 11").
- preparaciones: lista de preparaciones agrupadas por tiempo de comida ("REFRIGERIO MAÑANA", "ALMUERZO", "REFRIGERIO TARDE").
Para cada preparación:
  - nombre: nombre exacto de la preparación en mayúsculas (ej. "PAN REDONDO CON MANTEQUILLA", "ARROZ BLANCO").
  - tiempo_comida: "REFRIGERIO MAÑANA", "ALMUERZO" o "REFRIGERIO TARDE".
  - ingredientes: lista de ingredientes con las casillas esenciales:
    * codigo_tcac: código ICBF / TCAC del alimento (ej. "A060", "D015", "J004", "R004", "L015").
    * nombre: nombre del ingrediente.
    * peso_bruto: número en gramos/cc.
    * peso_neto: número en gramos/cc.

Responde ÚNICAMENTE con un objeto JSON válido con este formato:
{
  "numero_dia": 1,
  "grupo_etario": "1 año 11 meses a 2 años 11",
  "preparaciones": [ ... ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'application/pdf'
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (!text) return null;

    const data = JSON.parse(text);
    return {
      numero_dia: data.numero_dia || null,
      grupo_etario: data.grupo_etario || null,
      preparaciones: (data.preparaciones || []).map((p: any) => ({
        nombre: p.nombre,
        tiempo_comida: p.tiempo_comida,
        ingredientes: (p.ingredientes || []).map((i: any) => ({
          codigo_tcac: String(i.codigo_tcac || '').trim().toUpperCase(),
          nombre: String(i.nombre || '').trim(),
          peso_bruto: Number(i.peso_bruto) || 0,
          peso_neto: Number(i.peso_neto) || 0,
          sodio_mg_excel: null,
          costo_unidad_compra: null,
          costo_unitario_excel: null
        }))
      })),
      parser_used: 'gemini_multimodal'
    };
  } catch (error) {
    console.warn('Gemini multimodal parsing failed, falling back to native parser:', error);
    return null;
  }
}

/**
 * Main parser entrypoint. Tries Gemini if key available, else native PDF2JSON.
 */
export async function parseMinutaPDF(pdfBuffer: Buffer): Promise<ParsedMinutaResult> {
  if (process.env.GEMINI_API_KEY) {
    const geminiResult = await parseMinutaPDFGemini(pdfBuffer);
    if (geminiResult && geminiResult.preparaciones.length > 0) {
      return geminiResult;
    }
  }

  return parseMinutaPDFNative(pdfBuffer);
}
