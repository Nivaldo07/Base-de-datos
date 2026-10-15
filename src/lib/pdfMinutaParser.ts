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

function getSemanticAffinity(prepName: string, ing: { tcac: string; nombre: string }): number {
  const p = prepName.toUpperCase();
  const code = ing.tcac.toUpperCase();
  const name = ing.nombre.toUpperCase();

  // FRUTA EN PORCION: should only contain fruit
  if (p === 'FRUTA EN PORCION') {
    if (code.startsWith('C') || name.includes('FRUTA') || name.includes('BANANO') || name.includes('MELON') ||
        name.includes('GUAYABA') || name.includes('SANDIA') || name.includes('MANGO') || name.includes('MANDARINA') ||
        name.includes('MANZANA') || name.includes('PIÑA') || name.includes('NARANJA')) {
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
    if (code === 'P046' || name.includes('COROZO')) return -50;
    if (code === 'K003' || name.includes('AZUCAR')) return -20;
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
  ingrs: { tcac: string; nombre: string; peso_bruto: number; peso_neto: number; sodio_mg_excel: number | null; costo_unidad_compra: number | null; costo_unitario_excel: number | null; y: number }[]
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
    nombre: p.text,
    tiempo_comida: p.meal,
    ingredientes: ingrs.slice(splits[j].start, splits[j].end).map(ing => ({
      codigo_tcac: ing.tcac,
      nombre: ing.nombre,
      peso_bruto: ing.peso_bruto,
      peso_neto: ing.peso_neto,
      sodio_mg_excel: ing.sodio_mg_excel,
      costo_unidad_compra: ing.costo_unidad_compra,
      costo_unitario_excel: ing.costo_unitario_excel
    }))
  }));
}

/**
 * Native deterministic extractor for ICBF PDF minutas using layout analysis and dynamic programming.
 */
export async function parseMinutaPDFNative(pdfBuffer: Buffer): Promise<ParsedMinutaResult> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)();

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(errData?.parserError || new Error('Error al parsear PDF con pdf2json'));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        const page = pdfData?.Pages?.[0];
        if (!page) {
          throw new Error('El PDF no contiene páginas válidas');
        }

        const texts = page.Texts.map((t: any) => ({
          x: t.x,
          y: t.y,
          text: safeDecode(t.R?.[0]?.T || '').trim()
        })).filter((t: any) => t.text.length > 0);

        // Header detection: Menú Nº and Grupo de Edad
        let detectedDia: number | null = null;
        let detectedGrupo: string | null = null;

        for (const t of texts) {
          const matchMenu = t.text.match(/MEN[ÚU]\s*N[º°\.]?\s*(\d+)/i);
          if (matchMenu && !detectedDia) {
            detectedDia = parseInt(matchMenu[1], 10);
          }
          if (t.text.includes('año') || t.text.includes('meses')) {
            detectedGrupo = t.text;
          }
        }

        const tableEndItem = texts.find((t: any) =>
          t.text.includes('APORTE TOTAL DEL DÍA') || t.text.includes('APORTE DE LA MINUTA') || t.text.includes('RIEN PARA')
        );
        const tableEnd = tableEndItem ? tableEndItem.y - 0.2 : 27.0;

        // Reconstruct preparation names in column 2 (x in [4.2, 9.8])
        const rawPrepTexts = texts.filter((t: any) =>
          t.y >= 11.0 && t.y < tableEnd &&
          t.x >= 4.2 && t.x < 9.8 &&
          !t.text.toUpperCase().includes('NOMBRE DE LA PREP') &&
          !t.text.toUpperCase().includes('INGREDIENTES') &&
          !t.text.toUpperCase().includes('O TCAC')
        ).sort((a: any, b: any) => a.y - b.y);

        const prepLabels: { text: string; y: number }[] = [];
        const CONTINUATION_END_WORDS = ['Y', 'EN', 'CON', 'DE', 'DEL', 'O', 'A', 'AL', 'AMARILLO'];
        const CONTINUATION_START_WORDS = [
          'DE', 'CON', 'EN', 'Y', 'DEL', 'AL', 'A', 'COCIDO', 'COCIDA', 'ASADA', 'ASADO',
          'FRITA', 'FRITO', 'PASTEURIZADA', 'CUADRITOS', 'ZANAHORIA', 'ZANOHORIA', 'TOMATE',
          'CEBOLLA', 'GUAYABA', 'HARINA'
        ];

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
            (t.y - prev.y <= 0.6 &&
             !currUpper.includes('FRUTA') && !currUpper.includes('ARROZ') &&
             !currUpper.includes('PAN') && !currUpper.includes('HUEVO') &&
             !currUpper.includes('AREPA') && !currUpper.includes('GALLETAS') &&
             !currUpper.includes('SOPAS') && !currUpper.includes('QUESO') &&
             !currUpper.includes('LECHE') && !currUpper.includes('YOGURT'));

          if (isContinuation) {
            prev.text += ' ' + t.text;
          } else {
            prepLabels.push({ text: t.text, y: t.y });
          }
        }

        // All TCAC ingredients
        const isTcacCode = (txt: string) => /^[A-Z]\d{3}$/i.test(txt) || /^(1015|1004|8004)$/.test(txt);
        const tcacItems = texts.filter((t: any) =>
          t.y >= 11.0 && t.y < tableEnd &&
          t.x >= 9.5 && t.x <= 10.8 &&
          isTcacCode(t.text)
        ).sort((a: any, b: any) => a.y - b.y);

        const parsedIngrs = tcacItems.map((t: any) => {
          let code = t.text.toUpperCase();
          if (code === '1015') code = 'L015';
          if (code === '1004') code = 'J004';
          if (code === '8004') code = 'R004';

          const rowTexts = texts.filter((rowT: any) => Math.abs(rowT.y - t.y) <= 0.25);
          const nameItems = rowTexts.filter((it: any) => it.x >= 10.8 && it.x < 16.5);
          const ingName = nameItems.map((it: any) => it.text).join(' ');

          const pBruto = rowTexts.find((it: any) => it.x >= 16.5 && it.x < 18.5);
          const pNeto = rowTexts.find((it: any) => it.x >= 18.5 && it.x < 20.2);
          const pSodio = rowTexts.find((it: any) => it.x >= 39.0 && it.x < 41.5);
          const pCompra = rowTexts.find((it: any) => it.x >= 43.5 && it.x < 45.8);
          const pUnitario = rowTexts.find((it: any) => it.x >= 45.8 && it.x < 49.0);

          return {
            tcac: code,
            nombre: ingName,
            peso_bruto: parseNumber(pBruto?.text) || 0,
            peso_neto: parseNumber(pNeto?.text) || 0,
            sodio_mg_excel: parseNumber(pSodio?.text),
            costo_unidad_compra: parseNumber(pCompra?.text),
            costo_unitario_excel: parseNumber(pUnitario?.text),
            y: t.y
          };
        });

        // ICBF Menu structure:
        // Morning: first 4 preparations
        // Afternoon: last 3 preparations
        // Lunch: all preparations in between
        const totalP = prepLabels.length;
        const prepsWithMeal = prepLabels.map((p, idx) => {
          let meal = 'ALMUERZO';
          if (idx < 4) meal = 'REFRIGERIO MAÑANA';
          else if (idx >= totalP - 3) meal = 'REFRIGERIO TARDE';
          return { ...p, meal };
        });

        const alignedPreps = alignIngredientsToPrepsSemantic(prepsWithMeal, parsedIngrs);

        resolve({
          numero_dia: detectedDia,
          grupo_etario: detectedGrupo,
          preparaciones: alignedPreps,
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
Extrae detalladamente:
- numero_dia: número de menú (ejemplo: 1 si dice "MENÚ Nº 1").
- grupo_etario: texto del grupo de edad (ejemplo: "1 año 11 meses a 2 años 11").
- preparaciones: lista de preparaciones agrupadas por tiempo de comida ("REFRIGERIO MAÑANA", "ALMUERZO", "REFRIGERIO TARDE").
Para cada preparación:
  - nombre: nombre exacto de la preparación en mayúsculas (ej. "PAN REDONDO CON MANTEQUILLA", "ARROZ BLANCO").
  - tiempo_comida: "REFRIGERIO MAÑANA", "ALMUERZO" o "REFRIGERIO TARDE".
  - ingredientes: lista de ingredientes con:
    * codigo_tcac: código ICBF de 4 caracteres (ej. "A060", "D015", "J004", "R004", "L015").
    * nombre: nombre del ingrediente.
    * peso_bruto: número en gramos/cc.
    * peso_neto: número en gramos/cc.
    * sodio_mg_excel: aporte de sodio en mg (ej. 108.2, 193.905).
    * costo_unidad_compra: costo unidad de compra en pesos.
    * costo_unitario_excel: costo unitario en pesos.

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
          sodio_mg_excel: i.sodio_mg_excel != null ? Number(i.sodio_mg_excel) : null,
          costo_unidad_compra: i.costo_unidad_compra != null ? Number(i.costo_unidad_compra) : null,
          costo_unitario_excel: i.costo_unitario_excel != null ? Number(i.costo_unitario_excel) : null
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
