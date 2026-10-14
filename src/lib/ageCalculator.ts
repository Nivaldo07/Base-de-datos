// src/lib/ageCalculator.ts

export interface ICBFAgeResult {
  anios: number;
  meses: number;
  dias: number;
  totalMeses: number;
  edadTexto: string;               // Ej: "2 años, 3 meses"
  grupoEtarioICBF: string;         // Ej: "1 a 2 años 11 meses"
  grupoEtarioCorto: string;        // Ej: "1-2 años"
  esLactante: boolean;             // < 12 meses
  colorBadge: {
    bg: string;
    text: string;
    border: string;
  };
  metaRienCorrespondiente: string; // Para emparejar con metas_rien
}

/**
 * Calcula con precisión la edad en años, meses y días cumplidos a la fecha.
 * Se actualiza automáticamente en tiempo real con el paso del tiempo.
 */
export function calcularEdadICBF(fechaNacimiento: string | Date, fechaReferencia: Date = new Date()): ICBFAgeResult {
  const fechaNac = typeof fechaNacimiento === 'string' ? new Date(fechaNacimiento) : fechaNacimiento;
  
  if (!fechaNac || isNaN(fechaNac.getTime())) {
    return {
      anios: 0,
      meses: 0,
      dias: 0,
      totalMeses: 0,
      edadTexto: 'Fecha inválida',
      grupoEtarioICBF: 'Desconocido',
      grupoEtarioCorto: 'N/A',
      esLactante: false,
      colorBadge: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
      metaRienCorrespondiente: 'N/A',
    };
  }

  const anioActual = fechaReferencia.getFullYear();
  const mesActual = fechaReferencia.getMonth();
  const diaActual = fechaReferencia.getDate();

  const anioNac = fechaNac.getFullYear();
  const mesNac = fechaNac.getMonth();
  const diaNac = fechaNac.getDate();

  let anios = anioActual - anioNac;
  let meses = mesActual - mesNac;
  let dias = diaActual - diaNac;

  // Si los días actuales son menores a los días de nacimiento, retroceder 1 mes
  if (dias < 0) {
    meses--;
    // Obtener días del mes anterior
    const diasMesAnterior = new Date(anioActual, mesActual, 0).getDate();
    dias += diasMesAnterior;
  }

  // Si los meses quedan negativos, retroceder 1 año
  if (meses < 0) {
    anios--;
    meses += 12;
  }

  // Prevenir valores negativos si la fecha es en el futuro
  if (anios < 0) {
    anios = 0;
    meses = 0;
    dias = 0;
  }

  const totalMeses = anios * 12 + meses;

  // Formato textual amigable
  let edadTexto = '';
  if (anios === 0 && meses === 0) {
    edadTexto = `${dias} ${dias === 1 ? 'día' : 'días'}`;
  } else if (anios === 0) {
    edadTexto = `${meses} ${meses === 1 ? 'mes' : 'meses'}${dias > 0 ? ` (${dias} d)` : ''}`;
  } else if (meses === 0) {
    edadTexto = `${anios} ${anios === 1 ? 'año' : 'años'}`;
  } else {
    edadTexto = `${anios} ${anios === 1 ? 'año' : 'años'}, ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  }

  // Clasificación oficial de grupos etarios ICBF (Guía Técnica de Metas RIEN / Primera Infancia)
  let grupoEtarioICBF = '';
  let grupoEtarioCorto = '';
  let metaRienCorrespondiente = '';
  let colorBadge = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };

  if (totalMeses < 6) {
    grupoEtarioICBF = 'Menor de 6 meses (< 6m)';
    grupoEtarioCorto = '< 6m';
    metaRienCorrespondiente = 'Lactante Menor (0-5 meses)';
    colorBadge = { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
  } else if (totalMeses >= 6 && totalMeses <= 11) {
    grupoEtarioICBF = 'Lactante Mayor (6 a 11 meses)';
    grupoEtarioCorto = '6-11 meses';
    metaRienCorrespondiente = 'Lactantes (6 a 11 meses)';
    colorBadge = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  } else if (totalMeses >= 12 && totalMeses <= 35) {
    grupoEtarioICBF = 'Primera Infancia (1 a 2 años 11 meses)';
    grupoEtarioCorto = '1 a 2 años';
    metaRienCorrespondiente = '1 a 2 años';
    colorBadge = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  } else if (totalMeses >= 36 && totalMeses <= 71) {
    grupoEtarioICBF = 'Preescolar (3 a 5 años 11 meses)';
    grupoEtarioCorto = '3 a 5 años';
    metaRienCorrespondiente = '3 a 5 años';
    colorBadge = { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
  } else {
    grupoEtarioICBF = 'Mayor de 6 años (Escolar)';
    grupoEtarioCorto = '≥ 6 años';
    metaRienCorrespondiente = 'Escolar';
    colorBadge = { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
  }

  return {
    anios,
    meses,
    dias,
    totalMeses,
    edadTexto,
    grupoEtarioICBF,
    grupoEtarioCorto,
    esLactante: totalMeses < 12,
    colorBadge,
    metaRienCorrespondiente,
  };
}
