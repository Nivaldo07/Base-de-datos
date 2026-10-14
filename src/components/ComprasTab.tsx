'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Calendar,
  Building,
  Users,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  ChevronRight,
  Eye,
  Baby,
  Smile,
  Printer,
  Edit3,
  Check,
  PackageCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  generarExcelProyeccionYPlanilla,
  DiaProyeccionExcel,
  ItemPlanillaExcel,
  MetadatosPlanillaExcel,
} from '@/lib/comprasExcelGenerator';
import {
  generarPDFPlanillaEntregaOficialUDS,
  generarPDFListaCompras,
} from '@/lib/pdfGenerator';
import { calcularEdadICBF } from '@/lib/ageCalculator';

interface DiaSemanaConfig {
  diaSemana: string;
  numeroDiaCiclo: number;
  activo: boolean;
  motivoAnulacion: string;
}

const SEMANAS_PRESET = [
  { id: 1, label: 'Semana 1 (Días 1 a 5)', dias: [1, 2, 3, 4, 5] },
  { id: 2, label: 'Semana 2 (Días 6 a 10)', dias: [6, 7, 8, 9, 10] },
  { id: 3, label: 'Semana 3 (Días 11 a 15)', dias: [11, 12, 13, 14, 15] },
  { id: 4, label: 'Semana 4 (Días 16 a 20)', dias: [16, 17, 18, 19, 20] },
  { id: 5, label: 'Semana 5 (Días 21 a 25)', dias: [21, 22, 23, 24, 25] },
];

const NOMBRES_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default function ComprasTab() {
  // Datos maestros
  const [hogares, setHogares] = useState<any[]>([]);
  const [gruposEtarios, setGruposEtarios] = useState<any[]>([]);
  const [menusCiclo, setMenusCiclo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modo de visualización: 'uds' (Individual) o 'global' (Todas las UDS)
  const [modoVista, setModoVista] = useState<'uds' | 'global'>('uds');
  const [selectedUdsId, setSelectedUdsId] = useState<number | null>(null);

  // Configuración de la semana (por defecto Semana 5: Días 21 a 25)
  const [semanaSeleccionadaId, setSemanaSeleccionadaId] = useState<number>(5);
  const [diasConfig, setDiasConfig] = useState<DiaSemanaConfig[]>([
    { diaSemana: 'Lunes', numeroDiaCiclo: 21, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Martes', numeroDiaCiclo: 22, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Miércoles', numeroDiaCiclo: 23, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Jueves', numeroDiaCiclo: 24, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Viernes', numeroDiaCiclo: 25, activo: true, motivoAnulacion: '' },
  ]);

  // Sub-pestaña activa dentro del módulo de compras
  const [subTabActiva, setSubTabActiva] = useState<string>('planilla');

  // Sobrescritura manual opcional de niños por grupo de edad para la UDS actual
  const [overrideMenores3, setOverrideMenores3] = useState<number | null>(null);
  const [overrideMayores3, setOverrideMayores3] = useState<number | null>(null);

  // Metadatos institucionales oficiales ICBF (Editables)
  const [showEditMetaModal, setShowEditMetaModal] = useState(false);
  const [metaInstitucional, setMetaInstitucional] = useState({
    eas: 'ASOCIACION DE FAMILIA DE HCB DE CAIMITO-SUCRE',
    nit: '8230002828 - 6',
    contrato: '70005732024',
    municipio: 'CAIMITO-SUCRE',
    fechaEntrega: '26 del mes 09 del año 2026',
    fechaInicio: '28 de septiembre',
    fechaFin: '2 de octubre de 2026',
  });

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Cargar Hogares (UDS), Grupos Etarios y Menús
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resHogares, resGrupos, resMenus] = await Promise.all([
          fetch('/api/hogares'),
          fetch('/api/grupos-etarios'),
          fetch('/api/menus'),
        ]);

        const dataHogares = await resHogares.json();
        const dataGrupos = await resGrupos.json();
        const dataMenus = await resMenus.json();

        if (Array.isArray(dataHogares) && dataHogares.length > 0) {
          setHogares(dataHogares);
          setSelectedUdsId(dataHogares[0].id);
        }

        if (Array.isArray(dataGrupos)) {
          setGruposEtarios(dataGrupos);
        }

        if (Array.isArray(dataMenus)) {
          setMenusCiclo(dataMenus);
        }
      } catch (error) {
        console.error('Error cargando catálogos de compras:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Manejo de cambio de semana preconfigurada (Semana 1..5)
  const handleSelectSemanaPreset = (semanaId: number) => {
    setSemanaSeleccionadaId(semanaId);
    const preset = SEMANAS_PRESET.find((s) => s.id === semanaId);
    if (!preset) return;

    setDiasConfig(
      preset.dias.map((numDia, index) => ({
        diaSemana: NOMBRES_DIAS[index],
        numeroDiaCiclo: numDia,
        activo: true,
        motivoAnulacion: '',
      }))
    );
  };

  // Toggle de día activo/anulado (festivo o no laboral)
  const handleToggleDiaActivo = (index: number) => {
    setDiasConfig((prev) => {
      const next = [...prev];
      const actual = next[index];
      const nuevoEstado = !actual.activo;
      next[index] = {
        ...actual,
        activo: nuevoEstado,
        motivoAnulacion: nuevoEstado ? '' : 'Día Festivo / No Laboral',
      };
      return next;
    });
  };

  // UDS Seleccionada actualmente
  const udsSeleccionada = hogares.find((h) => h.id === selectedUdsId) || hogares[0];

  // Cálculo demográfico real de niños menores y mayores de 3 años para la UDS
  const demografiaUds = useMemo(() => {
    if (!udsSeleccionada) {
      return { menores3: 4, mayores3: 5, total: 9, esAuto: false };
    }

    const beneficiarios = udsSeleccionada.beneficiarios || [];
    let countMenores3 = 0;
    let countMayores3 = 0;

    for (const b of beneficiarios) {
      if (b.fecha_nacimiento) {
        const edad = calcularEdadICBF(b.fecha_nacimiento);
        if (edad.anios < 3) countMenores3++;
        else countMayores3++;
      }
    }

    // Si no hay niños registrados con fecha, usar fallback basado en cupo aprobado (ej. 4 y 5 para cupo 9, o 6 y 8 para cupo 14)
    if (beneficiarios.length === 0) {
      const cupo = udsSeleccionada.cupo_aprobado || udsSeleccionada.numero_beneficiarios || 9;
      countMenores3 = Math.floor(cupo * 0.45);
      countMayores3 = cupo - countMenores3;
    }

    const m3 = overrideMenores3 !== null ? overrideMenores3 : countMenores3;
    const my3 = overrideMayores3 !== null ? overrideMayores3 : countMayores3;

    return {
      menores3: m3,
      mayores3: my3,
      total: m3 + my3,
      esAuto: overrideMenores3 === null && overrideMayores3 === null,
      conteoRealMenores3: countMenores3,
      conteoRealMayores3: countMayores3,
    };
  }, [udsSeleccionada, overrideMenores3, overrideMayores3]);

  // Demografía consolidada de TODAS las UDS (para el modo Global)
  const demografiaGlobal = useMemo(() => {
    let totMenores = 0;
    let totMayores = 0;

    for (const h of hogares) {
      const beneficiarios = h.beneficiarios || [];
      let m = 0;
      let my = 0;
      for (const b of beneficiarios) {
        if (b.fecha_nacimiento) {
          const edad = calcularEdadICBF(b.fecha_nacimiento);
          if (edad.anios < 3) m++;
          else my++;
        }
      }
      if (beneficiarios.length === 0) {
        const cupo = h.cupo_aprobado || h.numero_beneficiarios || 14;
        m = Math.floor(cupo * 0.45);
        my = cupo - m;
      }
      totMenores += m;
      totMayores += my;
    }

    return {
      menores3: totMenores,
      mayores3: totMayores,
      total: totMenores + totMayores,
    };
  }, [hogares]);

  // Demografía activa según el modo seleccionado
  const demografiaActiva = modoVista === 'uds' ? demografiaUds : demografiaGlobal;

  // CÁLCULO PRINCIPAL: Desglose Diario y Planilla de 5 Días
  const { diasCalculados, consolidadoPlanilla, totalGramosSemana, listaAlimentosUnicos } = useMemo(() => {
    const idGrupoMenores = gruposEtarios.find((g) => g.nombre.includes('1') || g.id === 1)?.id || 1;
    const idGrupoMayores = gruposEtarios.find((g) => g.nombre.includes('3') || g.id === 2)?.id || 2;

    const diasResult: DiaProyeccionExcel[] = [];
    const mapaProductosPlanilla = new Map<
      string,
      {
        producto: string;
        totalGramos: number;
        unidad: string;
        presentacionGramos: number;
        costoUnidadCompra: number;
        tipoEmpaque: string;
        grupoAlimento: string;
      }
    >();

    let acumuladorGramosTotal = 0;

    for (const diaCfg of diasConfig) {
      // Buscar menú de menores y menú de mayores para este día del ciclo
      const menuMenores = menusCiclo.find(
        (m) => m.numero_dia === diaCfg.numeroDiaCiclo && m.grupo_etario_id === idGrupoMenores
      );
      const menuMayores = menusCiclo.find(
        (m) => m.numero_dia === diaCfg.numeroDiaCiclo && m.grupo_etario_id === idGrupoMayores
      );

      // Mapa para unir ingredientes de ambos grupos en este día
      const mapaIngredientesDia = new Map<
        string,
        {
          nombre: string;
          gMenor: number;
          gMayor: number;
          totalMenor: number;
          totalMayor: number;
          totalDia: number;
          tiempo: string;
          presentacionGramos: number;
          costoUnidadCompra: number;
          tipoEmpaque: string;
          grupoAlimento: string;
        }
      >();

      // Procesar ingredientes del grupo de menores
      if (menuMenores && Array.isArray(menuMenores.preparaciones)) {
        for (const prep of menuMenores.preparaciones) {
          if (!Array.isArray(prep.ingredientes)) continue;
          for (const ing of prep.ingredientes) {
            const alim = ing.alimento;
            if (!alim) continue;
            const clave = alim.nombre.trim();
            const g = Number(ing.peso_bruto) || 0;
            const item = mapaIngredientesDia.get(clave) || {
              nombre: alim.nombre,
              gMenor: 0,
              gMayor: 0,
              totalMenor: 0,
              totalMayor: 0,
              totalDia: 0,
              tiempo: prep.tiempo_comida || 'ALMUERZO',
              presentacionGramos: alim.presentacion_comercial_gramos || 1000,
              costoUnidadCompra: Number(ing.costo_unidad_compra) || Number(alim.costo_unidad_compra) || 0,
              tipoEmpaque: alim.tipo_empaque || 'kg',
              grupoAlimento: alim.grupo_alimento || 'Otros',
            };
            item.gMenor = Math.max(item.gMenor, g);
            mapaIngredientesDia.set(clave, item);
          }
        }
      }

      // Procesar ingredientes del grupo de mayores
      if (menuMayores && Array.isArray(menuMayores.preparaciones)) {
        for (const prep of menuMayores.preparaciones) {
          if (!Array.isArray(prep.ingredientes)) continue;
          for (const ing of prep.ingredientes) {
            const alim = ing.alimento;
            if (!alim) continue;
            const clave = alim.nombre.trim();
            const g = Number(ing.peso_bruto) || 0;
            const item = mapaIngredientesDia.get(clave) || {
              nombre: alim.nombre,
              gMenor: 0,
              gMayor: 0,
              totalMenor: 0,
              totalMayor: 0,
              totalDia: 0,
              tiempo: prep.tiempo_comida || 'ALMUERZO',
              presentacionGramos: alim.presentacion_comercial_gramos || 1000,
              costoUnidadCompra: Number(ing.costo_unidad_compra) || Number(alim.costo_unidad_compra) || 0,
              tipoEmpaque: alim.tipo_empaque || 'kg',
              grupoAlimento: alim.grupo_alimento || 'Otros',
            };
            item.gMayor = Math.max(item.gMayor, g);
            mapaIngredientesDia.set(clave, item);
          }
        }
      }

      // Si por alguna razón solo había menú para un grupo, rellenar el otro proporcionalmente
      for (const item of mapaIngredientesDia.values()) {
        if (item.gMenor === 0 && item.gMayor > 0) {
          item.gMenor = Math.round(item.gMayor * 0.8 * 100) / 100;
        } else if (item.gMayor === 0 && item.gMenor > 0) {
          item.gMayor = Math.round(item.gMenor * 1.25 * 100) / 100;
        }

        if (diaCfg.activo) {
          item.totalMenor = Math.round(item.gMenor * demografiaActiva.menores3 * 10) / 10;
          item.totalMayor = Math.round(item.gMayor * demografiaActiva.mayores3 * 10) / 10;
          item.totalDia = Math.round((item.totalMenor + item.totalMayor) * 10) / 10;
        } else {
          item.totalMenor = 0;
          item.totalMayor = 0;
          item.totalDia = 0;
        }
      }

      const itemsDelDia = Array.from(mapaIngredientesDia.values());

      diasResult.push({
        diaSemana: diaCfg.diaSemana,
        numeroDiaCiclo: diaCfg.numeroDiaCiclo,
        activo: diaCfg.activo,
        motivoAnulacion: diaCfg.motivoAnulacion,
        items: itemsDelDia,
      });

      // Si el día está activo, acumular en la Planilla de Entrega semanal
      if (diaCfg.activo) {
        for (const it of itemsDelDia) {
          const actual = mapaProductosPlanilla.get(it.nombre) || {
            producto: it.nombre,
            totalGramos: 0,
            unidad: it.nombre.toLowerCase().includes('leche') || it.nombre.toLowerCase().includes('aceite') ? 'Mililitros' : 'Gramos',
            presentacionGramos: it.presentacionGramos,
            costoUnidadCompra: it.costoUnidadCompra,
            tipoEmpaque: it.tipoEmpaque,
            grupoAlimento: it.grupoAlimento,
          };
          actual.totalGramos = Math.round((actual.totalGramos + it.totalDia) * 10) / 10;
          acumuladorGramosTotal += it.totalDia;
          mapaProductosPlanilla.set(it.nombre, actual);
        }
      }
    }

    // Ordenar consolidado de la planilla alfabéticamente
    const consolidado = Array.from(mapaProductosPlanilla.values()).sort((a, b) =>
      a.producto.localeCompare(b.producto, 'es', { sensitivity: 'base' })
    );

    return {
      diasCalculados: diasResult,
      consolidadoPlanilla: consolidado,
      totalGramosSemana: Math.round(acumuladorGramosTotal * 10) / 10,
      listaAlimentosUnicos: consolidado.length,
    };
  }, [diasConfig, menusCiclo, gruposEtarios, demografiaActiva]);

  // Texto del rango del ciclo (ej. "21 - 25")
  const textoCiclo = `${diasConfig[0]?.numeroDiaCiclo || 21} - ${diasConfig[4]?.numeroDiaCiclo || 25}`;

  // Metadatos unificados para la exportación
  const metadatosCompletos: MetadatosPlanillaExcel = useMemo(() => {
    return {
      eas: metaInstitucional.eas,
      nit: metaInstitucional.nit,
      contrato: metaInstitucional.contrato,
      municipio: metaInstitucional.municipio,
      nombreUds: modoVista === 'uds' ? udsSeleccionada?.nombre || 'Travesuras Infantiles' : `CONSOLIDADO GLOBAL (${hogares.length} UDS)`,
      madreComunitaria: modoVista === 'uds' ? udsSeleccionada?.madre_comunitaria || 'Ana Acevedo' : 'Todas las Madres Comunitarias',
      codigoUds: udsSeleccionada?.codigo_uds || 'UDS-001',
      fechaEntrega: metaInstitucional.fechaEntrega,
      diasCicloTexto: textoCiclo,
      fechaInicio: metaInstitucional.fechaInicio,
      fechaFin: metaInstitucional.fechaFin,
      menores3: demografiaActiva.menores3,
      mayores3: demografiaActiva.mayores3,
      totalNinos: demografiaActiva.total,
    };
  }, [metaInstitucional, modoVista, udsSeleccionada, hogares.length, textoCiclo, demografiaActiva]);

  // Manejo de exportación a Excel (.xlsx)
  const handleDescargarExcel = () => {
    const consolidadoFinal: ItemPlanillaExcel[] = consolidadoPlanilla.map((p) => ({
      producto: p.producto,
      totalGramos: p.totalGramos,
      unidad: p.unidad,
      presentacionGramos: p.presentacionGramos,
      empaquesSugeridos: Math.ceil(p.totalGramos / (p.presentacionGramos || 1000)),
    }));

    generarExcelProyeccionYPlanilla(diasCalculados, consolidadoFinal, metadatosCompletos);
  };

  // Manejo de exportación a PDF de la Planilla Oficial
  const handleDescargarPDFPlanilla = () => {
    generarPDFPlanillaEntregaOficialUDS(metadatosCompletos, consolidadoPlanilla);
  };

  // Filtrado de la lista en la pestaña activa
  const productosFiltradosPlanilla = useMemo(() => {
    if (!searchTerm.trim()) return consolidadoPlanilla;
    const term = searchTerm.toLowerCase();
    return consolidadoPlanilla.filter((p) => p.producto.toLowerCase().includes(term));
  }, [consolidadoPlanilla, searchTerm]);

  // Índices de subpestaña seleccionada (día 0 a 4)
  const diaSeleccionadoIndex = subTabActiva.startsWith('dia-') ? parseInt(subTabActiva.replace('dia-', '')) : null;
  const diaSeleccionadoObj = diaSeleccionadoIndex !== null ? diasCalculados[diaSeleccionadoIndex] : null;

  const productosFiltradosDia = useMemo(() => {
    if (!diaSeleccionadoObj) return [];
    if (!searchTerm.trim()) return diaSeleccionadoObj.items;
    const term = searchTerm.toLowerCase();
    return diaSeleccionadoObj.items.filter((it) => it.nombre.toLowerCase().includes(term));
  }, [diaSeleccionadoObj, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 1. CABECERA PRINCIPAL Y BOTONES DE EXPORTACIÓN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Proyección de Compras y Pedidos Semanales
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Formato Oficial ICBF
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo automatizado de víveres por ración para menores y mayores de 3 años, planilla semanal y consolidado general.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales de Descarga */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setShowEditMetaModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            title="Editar Entidad, Contrato, NIT y Fechas oficiales"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            Datos Institucionales
          </button>

          <button
            onClick={handleDescargarPDFPlanilla}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Imprimir Planilla PDF
          </button>

          <button
            onClick={handleDescargarExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            Descargar Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* 2. BARRA DE CONFIGURACIÓN: SELECTOR DE SEMANA Y MODO DE VISTA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Selector de Semana del Ciclo */}
        <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Semana del Ciclo de Menús
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Menú {textoCiclo}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {SEMANAS_PRESET.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSemanaPreset(s.id)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                  semanaSeleccionadaId === s.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sem {s.id}
                <span className="block text-[10px] font-normal opacity-80">
                  {s.dias[0]}-{s.dias[4]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Modo: UDS Individual vs Global */}
        <div className="md:col-span-7 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-600" />
              Unidad de Servicio (UDS) / Alcance
            </span>

            {/* Toggle de Modo */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setModoVista('uds')}
                className={`px-3 py-1 rounded-md transition-all ${
                  modoVista === 'uds' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Por UDS Individual
              </button>
              <button
                onClick={() => setModoVista('global')}
                className={`px-3 py-1 rounded-md transition-all ${
                  modoVista === 'global' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Consolidado Todas UDS
              </button>
            </div>
          </div>

          {modoVista === 'uds' ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <select
                value={selectedUdsId || ''}
                onChange={(e) => {
                  setSelectedUdsId(Number(e.target.value));
                  setOverrideMenores3(null);
                  setOverrideMayores3(null);
                }}
                className="w-full sm:w-1/2 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {hogares.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nombre} ({h.madre_comunitaria})
                  </option>
                ))}
              </select>

              {/* Ajustador de Censo de Niños para la UDS */}
              <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <span className="text-[11px] text-slate-500 font-semibold">Censo:</span>

                {/* Menores de 3 */}
                <div className="flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-sky-900">
                  <Baby className="w-3.5 h-3.5 text-sky-700" />
                  <span className="text-[10px] font-bold">&lt; 3a:</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={demografiaUds.menores3}
                    onChange={(e) => setOverrideMenores3(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-8 text-center font-black bg-white border border-sky-300 rounded text-xs py-0.5"
                  />
                </div>

                {/* Mayores de 3 */}
                <div className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-purple-900">
                  <Smile className="w-3.5 h-3.5 text-purple-700" />
                  <span className="text-[10px] font-bold">&ge; 3a:</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={demografiaUds.mayores3}
                    onChange={(e) => setOverrideMayores3(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-8 text-center font-black bg-white border border-purple-300 rounded text-xs py-0.5"
                  />
                </div>

                <span className="font-extrabold text-slate-800 pl-1">
                  = {demografiaUds.total} niños
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Users className="w-4 h-4 text-emerald-600" />
                Suma consolidada de las {hogares.length} UDS activas
              </span>
              <div className="flex items-center gap-3">
                <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[11px]">
                  &lt; 3 años: <strong>{demografiaGlobal.menores3}</strong>
                </span>
                <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[11px]">
                  &ge; 3 años: <strong>{demografiaGlobal.mayores3}</strong>
                </span>
                <span className="bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded text-[11px]">
                  Total: {demografiaGlobal.total} niños/as
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. CONTROL DE DÍAS HÁBILES Y ANULACIÓN (LUNES A VIERNES) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Estado de Días Laborables de la Semana
          </span>
          <span className="text-[11px] text-slate-400">
            Haz clic en un día para marcarlo como <strong>Festivo o No Laboral</strong> y excluirlo de las compras.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {diasConfig.map((dia, idx) => (
            <button
              key={idx}
              onClick={() => handleToggleDiaActivo(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                dia.activo
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-100/70'
                  : 'bg-rose-50/70 border-rose-300 text-rose-900 hover:bg-rose-100/70 opacity-90'
              }`}
            >
              <div>
                <span className="text-xs font-black block">{dia.diaSemana}</span>
                <span className="text-[10px] font-mono font-semibold block text-slate-500">
                  Menú Ciclo #{dia.numeroDiaCiclo}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase mt-0.5 inline-block px-1.5 py-0.2 rounded ${
                    dia.activo ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'
                  }`}
                >
                  {dia.activo ? 'Activo (Laborable)' : 'Anulado (Festivo)'}
                </span>
              </div>
              <div>
                {dia.activo ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. BARRA DE SUB-PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setSubTabActiva('planilla')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all border-b-2 whitespace-nowrap ${
            subTabActiva === 'planilla'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Planilla Oficial de Entrega (Total 5 Días)
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-emerald-200/80 text-emerald-900 rounded-full font-bold">
            {listaAlimentosUnicos} productos
          </span>
        </button>

        {diasConfig.map((dia, idx) => (
          <button
            key={idx}
            onClick={() => setSubTabActiva(`dia-${idx}`)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              subTabActiva === `dia-${idx}`
                ? 'border-emerald-600 bg-white text-emerald-900 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {dia.diaSemana} (M{dia.numeroDiaCiclo})
            {!dia.activo && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Día Anulado" />
            )}
          </button>
        ))}

        <button
          onClick={() => setSubTabActiva('proveedores')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            subTabActiva === 'proveedores'
              ? 'border-emerald-600 bg-white text-emerald-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-slate-500" />
          Empaques Comerciales & Proveedores
        </button>
      </div>

      {/* 5. CONTENIDO DE LA SUB-PESTAÑA SELECCIONADA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        
        {/* BUSCADOR DENTRO DE LA TABLA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por nombre de alimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Beneficiarios activos:{' '}
            <strong className="text-slate-800">
              {demografiaActiva.total} niños/as ({demografiaActiva.menores3} &lt; 3a | {demografiaActiva.mayores3} &ge; 3a)
            </strong>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUB-TAB 1: PLANILLA OFICIAL DE ENTREGA DE ALIMENTOS (5 DÍAS) */}
        {/* ============================================================== */}
        {subTabActiva === 'planilla' && (
          <div className="space-y-4">
            {/* Banner Institucional con Datos de Entrega */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {metaInstitucional.eas}
                  </h4>
                  <p className="text-slate-600">
                    NIT: {metaInstitucional.nit} • Contrato N°: {metaInstitucional.contrato} • Municipio: {metaInstitucional.municipio}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditMetaModal(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-emerald-50"
                >
                  <Edit3 className="w-3 h-3" /> Editar Encabezado
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>
                  <strong>NOMBRE DEL HCB (UDS):</strong>{' '}
                  <span className="font-bold text-emerald-800">{metadatosCompletos.nombreUds}</span>
                </div>
                <div>
                  <strong>NOMBRE DE LA MADRE COMUNITARIA:</strong>{' '}
                  <span className="font-bold text-slate-900">{metadatosCompletos.madreComunitaria}</span>
                </div>
              </div>

              {/* Declaración Legal de Entrega */}
              <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                El día <strong>{metaInstitucional.fechaEntrega}</strong> se hizo la entrega a la madre comunitaria los productos alimenticios establecidos en la minuta patrón y lista de compra, para la preparación de los alimentos de los niños y niñas beneficiarios de la modalidad HCB; los cuales se relacionan a continuación: <strong>menú {textoCiclo}</strong>, semana del <strong>{metaInstitucional.fechaInicio}</strong> hasta el <strong>{metaInstitucional.fechaFin}</strong>:
              </div>
            </div>

            {/* TABLA OFICIAL DE PRODUCTOS ENTREGADOS EN LOS 5 DÍAS */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-center w-12">N°</th>
                    <th className="p-3">PRODUCTO / ALIMENTO</th>
                    <th className="p-3 text-right">UNIDAD DE MEDIDA ( GRAMOS- ML)</th>
                    <th className="p-3 text-right">EQUIVALENTE EN KILOS</th>
                    <th className="p-3 text-center">ESTADO RECEPCIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productosFiltradosPlanilla.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                        No hay productos registrados para esta semana.
                      </td>
                    </tr>
                  ) : (
                    productosFiltradosPlanilla.map((prod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {prod.producto}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-900 bg-slate-50/50">
                          {prod.totalGramos.toLocaleString('es-CO')}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          {(prod.totalGramos / 1000).toFixed(2)} kg
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Conforme
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-xs text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={2} className="p-3 text-right uppercase">
                      TOTAL CONSOLIDADO SEMANAL ({productosFiltradosPlanilla.length} PRODUCTOS):
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-900 text-sm">
                      {totalGramosSemana.toLocaleString('es-CO')} g
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800 text-sm">
                      {(totalGramosSemana / 1000).toFixed(2)} kg
                    </td>
                    <td className="p-3 text-center text-emerald-700">
                      100% Entregado
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* SECCIÓN DE FIRMAS OFICIALES ICBF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200">
              <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Responsable de Recepción en la UDS
                </span>
                <div className="pt-8 border-b border-slate-400 mx-6"></div>
                <div>
                  <strong className="text-xs text-slate-900 block uppercase">
                    RECIBIO A SATISFACCION
                  </strong>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Madre Comunitaria: {metadatosCompletos.madreComunitaria}
                  </p>
                  <p className="text-[10px] text-slate-400">C.C. ____________________________</p>
                </div>
              </div>

              <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Responsable de Suministro y Despacho
                </span>
                <div className="pt-8 border-b border-slate-400 mx-6"></div>
                <div>
                  <strong className="text-xs text-slate-900 block uppercase">
                    ENTREGO
                  </strong>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Nutricionista / Supervisor ICBF / EAS
                  </p>
                  <p className="text-[10px] text-slate-400">T.P. / C.C. ____________________________</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUB-TABS 2 A 6: DESGLOSE DIARIO (DÍA 1 A DÍA 5) */}
        {/* ============================================================== */}
        {diaSeleccionadoObj && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  {diaSeleccionadoObj.diaSemana} — Menú del Ciclo #{diaSeleccionadoObj.numeroDiaCiclo}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    diaSeleccionadoObj.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {diaSeleccionadoObj.activo ? 'Día Activo' : `Anulado (${diaSeleccionadoObj.motivoAnulacion})`}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Cálculo: ({diaSeleccionadoObj.items[0]?.gMenor || 0}g × {demografiaActiva.menores3} niños) + ({diaSeleccionadoObj.items[0]?.gMayor || 0}g × {demografiaActiva.mayores3} niños)
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">INGREDIENTE / ALIMENTO</th>
                    <th className="p-3 text-right">GRAMAJE &lt; 3a (g)</th>
                    <th className="p-3 text-right">GRAMAJE &ge; 3a (g)</th>
                    <th className="p-3 text-right bg-sky-50 text-sky-900">
                      MENOR DE 3 (g) <span className="block text-[9px] font-normal">({demografiaActiva.menores3} niños)</span>
                    </th>
                    <th className="p-3 text-right bg-purple-50 text-purple-900">
                      MAYOR DE 3 (g) <span className="block text-[9px] font-normal">({demografiaActiva.mayores3} niños)</span>
                    </th>
                    <th className="p-3 text-right bg-emerald-50 text-emerald-950 font-black">
                      TOTAL DÍA (g)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productosFiltradosDia.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        No hay ingredientes registrados para este día.
                      </td>
                    </tr>
                  ) : (
                    productosFiltradosDia.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-800">{it.nombre}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">{it.gMenor}</td>
                        <td className="p-2.5 text-right font-mono text-slate-600">{it.gMayor}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-sky-800 bg-sky-50/40">
                          {it.totalMenor}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-purple-800 bg-purple-50/40">
                          {it.totalMayor}
                        </td>
                        <td className="p-2.5 text-right font-mono font-extrabold text-emerald-900 bg-emerald-50/40">
                          {it.totalDia}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUB-TAB 7: EMPAQUES COMERCIALES Y PROVEEDORES */}
        {/* ============================================================== */}
        {subTabActiva === 'proveedores' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Los empaques comerciales se calculan con redondeo hacia arriba{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">⌈Demanda Total / Presentación⌉</code>,
                garantizando abastecimiento comercial completo a los proveedores.
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">PRODUCTO</th>
                    <th className="p-3 text-right">DEMANDA SEMANAL</th>
                    <th className="p-3 text-center">PRESENTACIÓN COMERCIAL</th>
                    <th className="p-3 text-center">EMPAQUES A COMPRAR</th>
                    <th className="p-3 text-right">COSTO SUB-TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productosFiltradosPlanilla.map((p, idx) => {
                    const pres = p.presentacionGramos || 1000;
                    const empaques = Math.ceil(p.totalGramos / pres);
                    const costoUnit = p.costoUnidadCompra || 0;
                    const costoTotal = empaques * costoUnit;

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{p.producto}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          {(p.totalGramos / 1000).toFixed(2)} kg ({p.totalGramos} g)
                        </td>
                        <td className="p-2.5 text-center text-slate-600 font-mono">
                          {p.tipoEmpaque || 'Bolsa'} ({pres}g)
                        </td>
                        <td className="p-2.5 text-center font-extrabold text-emerald-800 font-mono">
                          {empaques} unidades
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ${costoTotal.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA EDITAR METADATOS INSTITUCIONALES ICBF */}
      {showEditMetaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                Editar Encabezado Oficial ICBF de la Planilla
              </h3>
              <button
                onClick={() => setShowEditMetaModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Entidad Administradora del Servicio (EAS):
                </label>
                <input
                  type="text"
                  value={metaInstitucional.eas}
                  onChange={(e) => setMetaInstitucional({ ...metaInstitucional, eas: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIT:</label>
                  <input
                    type="text"
                    value={metaInstitucional.nit}
                    onChange={(e) => setMetaInstitucional({ ...metaInstitucional, nit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contrato N°:</label>
                  <input
                    type="text"
                    value={metaInstitucional.contrato}
                    onChange={(e) => setMetaInstitucional({ ...metaInstitucional, contrato: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Municipio:</label>
                <input
                  type="text"
                  value={metaInstitucional.municipio}
                  onChange={(e) => setMetaInstitucional({ ...metaInstitucional, municipio: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha Entrega:</label>
                  <input
                    type="text"
                    value={metaInstitucional.fechaEntrega}
                    onChange={(e) => setMetaInstitucional({ ...metaInstitucional, fechaEntrega: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inicio Semana:</label>
                  <input
                    type="text"
                    value={metaInstitucional.fechaInicio}
                    onChange={(e) => setMetaInstitucional({ ...metaInstitucional, fechaInicio: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fin Semana:</label>
                  <input
                    type="text"
                    value={metaInstitucional.fechaFin}
                    onChange={(e) => setMetaInstitucional({ ...metaInstitucional, fechaFin: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowEditMetaModal(false)}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
              >
                Guardar y Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
