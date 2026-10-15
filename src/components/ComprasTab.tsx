'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Plus,
  Trash2,
  Upload,
  RotateCcw,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import {
  generarExcelProyeccionYPlanilla,
  generarExcelCicloCompleto,
  DiaProyeccionExcel,
  ItemPlanillaExcel,
  MetadatosPlanillaExcel,
  SemanaProyeccionExcel,
} from '@/lib/comprasExcelGenerator';
import {
  generarPDFPlanillaEntregaOficialUDS,
  generarPDFPlanillasTodasLasSemanas,
  generarPDFListaCompras,
} from '@/lib/pdfGenerator';
import { calcularEdadICBF } from '@/lib/ageCalculator';
import { DEFAULT_LOGO_BASE64 } from '@/lib/defaultLogoBase64';

export interface DiaSemanaConfig {
  diaSemana: string;
  numeroDiaCiclo: number;
  activo: boolean;
  motivoAnulacion: string;
}

export interface DiaItemEditor {
  id: string;
  tiempo: string;
  preparacion: string;
  codigo_tcac: string;
  nombre: string;
  gMenor: number;
  gMayor: number;
  presentacionGramos: number;
  costoUnidadCompra: number;
  tipoEmpaque: string;
  grupoAlimento: string;
}

export interface ItemDiaCalculado extends DiaItemEditor {
  totalMenor: number;
  totalMayor: number;
  totalDia: number;
}

const SEMANAS_PRESET = [
  { id: 1, label: 'Semana 1 (Días 1 a 5)', dias: [1, 2, 3, 4, 5], inicio: '1 de septiembre', fin: '5 de septiembre de 2026', entrega: '31 del mes 08 del año 2026' },
  { id: 2, label: 'Semana 2 (Días 6 a 10)', dias: [6, 7, 8, 9, 10], inicio: '7 de septiembre', fin: '11 de septiembre de 2026', entrega: '5 del mes 09 del año 2026' },
  { id: 3, label: 'Semana 3 (Días 11 a 15)', dias: [11, 12, 13, 14, 15], inicio: '14 de septiembre', fin: '18 de septiembre de 2026', entrega: '12 del mes 09 del año 2026' },
  { id: 4, label: 'Semana 4 (Días 16 a 20)', dias: [16, 17, 18, 19, 20], inicio: '21 de septiembre', fin: '25 de septiembre de 2026', entrega: '19 del mes 09 del año 2026' },
  { id: 5, label: 'Semana 5 (Días 21 a 25)', dias: [21, 22, 23, 24, 25], inicio: '28 de septiembre', fin: '2 de octubre de 2026', entrega: '26 del mes 09 del año 2026' },
];

const NOMBRES_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const TIEMPOS_COMIDA_DEFAULT = [
  'REFRIGERIO MAÑANA',
  'ALMUERZO',
  'REFRIGERIO TARDE',
  'DESAYUNO',
  'CENA',
];

/**
 * Función auxiliar para extraer los ingredientes de un día del ciclo desde los menús de la base de datos
 */
function extraerItemsDeMenu(
  numeroDia: number,
  menus: any[],
  idMenores: number,
  idMayores: number
): DiaItemEditor[] {
  const menuMenores = menus.find(
    (m) => m.numero_dia === numeroDia && m.grupo_etario_id === idMenores
  );
  const menuMayores = menus.find(
    (m) => m.numero_dia === numeroDia && m.grupo_etario_id === idMayores
  );

  const mapaItems = new Map<string, DiaItemEditor>();

  const genKey = (tiempo: string, prep: string, alim: string) =>
    `${(tiempo || '').trim().toUpperCase()}_${(prep || '').trim().toUpperCase()}_${(alim || '').trim().toLowerCase()}`;

  // 1. Procesar ingredientes de menores de 3 años
  if (menuMenores && Array.isArray(menuMenores.preparaciones)) {
    for (const prep of menuMenores.preparaciones) {
      const tiempo = prep.tiempo_comida || 'ALMUERZO';
      const nomPrep = prep.nombre || 'Preparación';
      if (!Array.isArray(prep.ingredientes)) continue;

      for (const ing of prep.ingredientes) {
        const alim = ing.alimento;
        if (!alim) continue;
        const key = genKey(tiempo, nomPrep, alim.nombre);
        const gBruto = Number(ing.peso_bruto) || 0;

        mapaItems.set(key, {
          id: `item-${numeroDia}-${key}`,
          tiempo,
          preparacion: nomPrep,
          codigo_tcac: alim.codigo_icbf || '',
          nombre: alim.nombre,
          gMenor: gBruto,
          gMayor: 0,
          presentacionGramos: alim.presentacion_comercial_gramos || 1000,
          costoUnidadCompra: Number(ing.costo_unidad_compra) || Number(alim.costo_unidad_compra) || 0,
          tipoEmpaque: alim.tipo_empaque || 'kg',
          grupoAlimento: alim.grupo_alimento || 'Otros',
        });
      }
    }
  }

  // 2. Procesar ingredientes de mayores de 3 años
  if (menuMayores && Array.isArray(menuMayores.preparaciones)) {
    for (const prep of menuMayores.preparaciones) {
      const tiempo = prep.tiempo_comida || 'ALMUERZO';
      const nomPrep = prep.nombre || 'Preparación';
      if (!Array.isArray(prep.ingredientes)) continue;

      for (const ing of prep.ingredientes) {
        const alim = ing.alimento;
        if (!alim) continue;
        const key = genKey(tiempo, nomPrep, alim.nombre);
        const gBruto = Number(ing.peso_bruto) || 0;

        const existing = mapaItems.get(key);
        if (existing) {
          existing.gMayor = gBruto;
          if (!existing.codigo_tcac && alim.codigo_icbf) {
            existing.codigo_tcac = alim.codigo_icbf;
          }
        } else {
          mapaItems.set(key, {
            id: `item-${numeroDia}-${key}`,
            tiempo,
            preparacion: nomPrep,
            codigo_tcac: alim.codigo_icbf || '',
            nombre: alim.nombre,
            gMenor: 0,
            gMayor: gBruto,
            presentacionGramos: alim.presentacion_comercial_gramos || 1000,
            costoUnidadCompra: Number(ing.costo_unidad_compra) || Number(alim.costo_unidad_compra) || 0,
            tipoEmpaque: alim.tipo_empaque || 'kg',
            grupoAlimento: alim.grupo_alimento || 'Otros',
          });
        }
      }
    }
  }

  // Si uno de los grupos no tenía menú explícito, rellenar proporcionalmente
  for (const it of mapaItems.values()) {
    if (it.gMenor === 0 && it.gMayor > 0) {
      it.gMenor = Math.round(it.gMayor * 0.8 * 10) / 10;
    } else if (it.gMayor === 0 && it.gMenor > 0) {
      it.gMayor = Math.round(it.gMenor * 1.25 * 10) / 10;
    }
  }

  return Array.from(mapaItems.values());
}

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

  // Sub-pestaña activa dentro del módulo de compras ('planilla' | 'dia-0'..'dia-4' | 'proveedores')
  const [subTabActiva, setSubTabActiva] = useState<string>('planilla');

  // Sobrescritura manual opcional de niños por grupo de edad para la UDS actual
  const [overrideMenores3, setOverrideMenores3] = useState<number | null>(null);
  const [overrideMayores3, setOverrideMayores3] = useState<number | null>(null);

  // Logo Oficial EAS (Personalizable con persistencia en localStorage)
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_BASE64);

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

  // Estado Interactivo de Alimentos por Día: { [numeroDiaCiclo: number]: DiaItemEditor[] }
  const [itemsPorDia, setItemsPorDia] = useState<Record<number, DiaItemEditor[]>>({});

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para Agregar Alimento al Día
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodTiempo, setAddFoodTiempo] = useState('ALMUERZO');
  const [addFoodPreparacion, setAddFoodPreparacion] = useState('');
  const [addFoodSearch, setAddFoodSearch] = useState('');
  const [addFoodSearchResults, setAddFoodSearchResults] = useState<any[]>([]);
  const [addFoodSearching, setAddFoodSearching] = useState(false);
  const [addFoodSelected, setAddFoodSelected] = useState<any | null>(null);
  const [addFoodGMenor, setAddFoodGMenor] = useState<number | string>(20);
  const [addFoodGMayor, setAddFoodGMayor] = useState<number | string>(30);

  // Modal para Confirmar Eliminación de Alimento
  const [itemAEliminar, setItemAEliminar] = useState<{ numDia: number; item: DiaItemEditor } | null>(null);

  // 1. Cargar Logo desde localStorage al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLogo = localStorage.getItem('nutri_eas_logo');
        if (savedLogo && savedLogo.startsWith('data:image')) {
          setLogoUrl(savedLogo);
        }
      } catch (err) {
        console.error('Error leyendo logo de localStorage:', err);
      }
    }
  }, []);

  // Manejador para Subir / Modificar Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setLogoUrl(base64);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('nutri_eas_logo', base64);
          } catch (err) {
            console.error('Error guardando logo en localStorage:', err);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Manejador para Restablecer Logo por Defecto
  const handleResetLogo = () => {
    setLogoUrl(DEFAULT_LOGO_BASE64);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('nutri_eas_logo');
      } catch (err) {
        console.error('Error eliminando logo de localStorage:', err);
      }
    }
  };

  // 2. Cargar Hogares (UDS), Grupos Etarios y Menús
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

  // IDs de grupos etarios
  const idGrupoMenores = useMemo(() => {
    return gruposEtarios.find((g) => g.nombre.includes('1') || g.id === 1)?.id || 1;
  }, [gruposEtarios]);

  const idGrupoMayores = useMemo(() => {
    return gruposEtarios.find((g) => g.nombre.includes('3') || g.id === 2)?.id || 2;
  }, [gruposEtarios]);

  // Inicializar itemsPorDia cuando menusCiclo se cargue o cambie la semana
  useEffect(() => {
    if (menusCiclo.length === 0) return;

    setItemsPorDia((prev) => {
      const next = { ...prev };
      let huboCambios = false;

      for (const diaCfg of diasConfig) {
        const numDia = diaCfg.numeroDiaCiclo;
        if (!next[numDia] || next[numDia].length === 0) {
          const itemsExtraidos = extraerItemsDeMenu(numDia, menusCiclo, idGrupoMenores, idGrupoMayores);
          next[numDia] = itemsExtraidos;
          huboCambios = true;
        }
      }

      return huboCambios ? next : prev;
    });
  }, [menusCiclo, diasConfig, idGrupoMenores, idGrupoMayores]);

  // Manejo de cambio de semana preconfigurada (Semana 1..5)
  const handleSelectSemanaPreset = (semanaId: number) => {
    setSemanaSeleccionadaId(semanaId);
    const preset = SEMANAS_PRESET.find((s) => s.id === semanaId);
    if (!preset) return;

    const nuevosDiasConfig: DiaSemanaConfig[] = preset.dias.map((numDia, index) => ({
      diaSemana: NOMBRES_DIAS[index],
      numeroDiaCiclo: numDia,
      activo: true,
      motivoAnulacion: '',
    }));

    setDiasConfig(nuevosDiasConfig);

    // Adaptar dinámicamente las fechas del encabezado y texto legal
    setMetaInstitucional((prev) => ({
      ...prev,
      fechaInicio: preset.inicio,
      fechaFin: preset.fin,
      fechaEntrega: preset.entrega,
    }));

    // Inicializar items para los nuevos días si aún no existen
    if (menusCiclo.length > 0) {
      setItemsPorDia((prev) => {
        const next = { ...prev };
        for (const numDia of preset.dias) {
          if (!next[numDia] || next[numDia].length === 0) {
            next[numDia] = extraerItemsDeMenu(numDia, menusCiclo, idGrupoMenores, idGrupoMayores);
          }
        }
        return next;
      });
    }
  };

  // Toggle de día activo/anulado (festivo o no laboral)
  // Solo se llama desde el checkbox/botón con e.stopPropagation()
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

  // CÁLCULO PRINCIPAL Y CONSOLIDACIÓN EN TIEMPO REAL (TOTAL 5 DÍAS SIN REPETIR ÍTEMS)
  const { diasCalculados, consolidadoPlanilla, totalGramosSemana, listaAlimentosUnicos } = useMemo(() => {
    const diasResult: (DiaProyeccionExcel & { itemsCompletos: ItemDiaCalculado[] })[] = [];
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
      const numDia = diaCfg.numeroDiaCiclo;
      // Obtener items interactivos del día o extraer de fallback
      const itemsBase = itemsPorDia[numDia] || extraerItemsDeMenu(numDia, menusCiclo, idGrupoMenores, idGrupoMayores);

      const itemsConTotales: ItemDiaCalculado[] = itemsBase.map((it) => {
        let totalMenor = 0;
        let totalMayor = 0;
        let totalDia = 0;

        if (diaCfg.activo) {
          totalMenor = Math.round(it.gMenor * demografiaActiva.menores3 * 10) / 10;
          totalMayor = Math.round(it.gMayor * demografiaActiva.mayores3 * 10) / 10;
          totalDia = Math.round((totalMenor + totalMayor) * 10) / 10;
        }

        return {
          ...it,
          totalMenor,
          totalMayor,
          totalDia,
        };
      });

      diasResult.push({
        diaSemana: diaCfg.diaSemana,
        numeroDiaCiclo: diaCfg.numeroDiaCiclo,
        activo: diaCfg.activo,
        motivoAnulacion: diaCfg.motivoAnulacion,
        items: itemsConTotales,
        itemsCompletos: itemsConTotales,
      });

      // CONSOLIDACIÓN EN LA PLANILLA OFICIAL (Solo si el día está ACTIVO)
      // ¡SIN REPETIR ÍTEMS! Agrupados por nombre de alimento único
      if (diaCfg.activo) {
        for (const it of itemsConTotales) {
          const nombreLimpio = it.nombre.trim();
          const claveUnica = nombreLimpio.toLowerCase();

          const prodExistente = mapaProductosPlanilla.get(claveUnica) || {
            producto: nombreLimpio,
            totalGramos: 0,
            unidad:
              nombreLimpio.toLowerCase().includes('leche') || nombreLimpio.toLowerCase().includes('aceite')
                ? 'Mililitros'
                : 'Gramos',
            presentacionGramos: it.presentacionGramos || 1000,
            costoUnidadCompra: it.costoUnidadCompra || 0,
            tipoEmpaque: it.tipoEmpaque || 'kg',
            grupoAlimento: it.grupoAlimento || 'Otros',
          };

          prodExistente.totalGramos = Math.round((prodExistente.totalGramos + it.totalDia) * 10) / 10;
          acumuladorGramosTotal += it.totalDia;
          mapaProductosPlanilla.set(claveUnica, prodExistente);
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
  }, [diasConfig, itemsPorDia, menusCiclo, idGrupoMenores, idGrupoMayores, demografiaActiva]);

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
      logoBase64: logoUrl,
    };
  }, [metaInstitucional, modoVista, udsSeleccionada, hogares.length, textoCiclo, demografiaActiva, logoUrl]);

  // Función auxiliar para calcular los datos completos (días + consolidado + metadatos) de cualquier semana (1..5)
  const obtenerDatosDeSemana = useCallback(
    (semanaId: number) => {
      const preset = SEMANAS_PRESET.find((s) => s.id === semanaId) || SEMANAS_PRESET[0];
      const diasResult: DiaProyeccionExcel[] = [];
      const mapaProductos = new Map<string, ItemPlanillaExcel>();

      // Si es la semana seleccionada actualmente, usar los días y su estado activo/inactivo editado
      const esSemanaActual = semanaId === semanaSeleccionadaId;

      for (let i = 0; i < preset.dias.length; i++) {
        const numDia = preset.dias[i];
        const diaCfgActual = esSemanaActual ? diasConfig[i] : null;
        const diaActivo = diaCfgActual ? diaCfgActual.activo : true;
        const motivoAnulacion = diaCfgActual ? diaCfgActual.motivoAnulacion : '';

        const itemsBase = itemsPorDia[numDia] || extraerItemsDeMenu(numDia, menusCiclo, idGrupoMenores, idGrupoMayores);
        const itemsConTotales = itemsBase.map((it) => {
          let totalMenor = 0;
          let totalMayor = 0;
          let totalDia = 0;

          if (diaActivo) {
            totalMenor = Math.round(it.gMenor * demografiaActiva.menores3 * 10) / 10;
            totalMayor = Math.round(it.gMayor * demografiaActiva.mayores3 * 10) / 10;
            totalDia = Math.round((totalMenor + totalMayor) * 10) / 10;
          }

          return {
            ...it,
            totalMenor,
            totalMayor,
            totalDia,
          };
        });

        diasResult.push({
          diaSemana: NOMBRES_DIAS[i] || 'Día',
          numeroDiaCiclo: numDia,
          activo: diaActivo,
          motivoAnulacion,
          items: itemsConTotales,
        });

        if (diaActivo) {
          for (const it of itemsConTotales) {
            const nombreLimpio = it.nombre.trim();
            const clave = nombreLimpio.toLowerCase();
            const exist = mapaProductos.get(clave) || {
              producto: nombreLimpio,
              totalGramos: 0,
              unidad:
                nombreLimpio.toLowerCase().includes('leche') || nombreLimpio.toLowerCase().includes('aceite')
                  ? 'Mililitros'
                  : 'Gramos',
              presentacionGramos: it.presentacionGramos || 1000,
            };
            exist.totalGramos = Math.round((exist.totalGramos + it.totalDia) * 10) / 10;
            mapaProductos.set(clave, exist);
          }
        }
      }

      const consolidado = Array.from(mapaProductos.values()).sort((a, b) =>
        a.producto.localeCompare(b.producto, 'es', { sensitivity: 'base' })
      );

      const metaSemana: MetadatosPlanillaExcel = {
        eas: metaInstitucional.eas,
        nit: metaInstitucional.nit,
        contrato: metaInstitucional.contrato,
        municipio: metaInstitucional.municipio,
        nombreUds: modoVista === 'uds' ? udsSeleccionada?.nombre || 'Travesuras Infantiles' : `CONSOLIDADO GLOBAL (${hogares.length} UDS)`,
        madreComunitaria: modoVista === 'uds' ? udsSeleccionada?.madre_comunitaria || 'Ana Acevedo' : 'Todas las Madres Comunitarias',
        codigoUds: udsSeleccionada?.codigo_uds || 'UDS-001',
        fechaEntrega: preset.entrega,
        diasCicloTexto: `${preset.dias[0]} - ${preset.dias[preset.dias.length - 1]}`,
        fechaInicio: preset.inicio,
        fechaFin: preset.fin,
        menores3: demografiaActiva.menores3,
        mayores3: demografiaActiva.mayores3,
        totalNinos: demografiaActiva.total,
        logoBase64: logoUrl || undefined,
      };

      return {
        numeroSemana: semanaId,
        dias: diasResult,
        consolidado,
        meta: metaSemana,
      };
    },
    [
      semanaSeleccionadaId,
      diasConfig,
      itemsPorDia,
      menusCiclo,
      idGrupoMenores,
      idGrupoMayores,
      demografiaActiva,
      metaInstitucional,
      modoVista,
      udsSeleccionada,
      hogares.length,
      logoUrl,
    ]
  );

  // 1. Manejo de exportación a Excel (.xlsx) de la Semana Actual
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

  // 2. Manejo de exportación a Excel (.xlsx) del Ciclo Completo (5 Semanas)
  const handleDescargarExcelCicloCompleto = () => {
    const todasLasSemanas: SemanaProyeccionExcel[] = SEMANAS_PRESET.map((s) =>
      obtenerDatosDeSemana(s.id)
    );
    generarExcelCicloCompleto(todasLasSemanas, metadatosCompletos);
  };

  // 3. Manejo de exportación a PDF de la Planilla Oficial de la Semana Actual
  const handleDescargarPDFPlanilla = () => {
    generarPDFPlanillaEntregaOficialUDS(metadatosCompletos, consolidadoPlanilla);
  };

  // 4. Manejo de exportación a PDF de Todas las Semanas (5 Semanas Oficiales)
  const handleDescargarPDFTodasLasSemanas = () => {
    const todasLasSemanas = SEMANAS_PRESET.map((s) => {
      const data = obtenerDatosDeSemana(s.id);
      return {
        numeroSemana: s.id,
        meta: data.meta,
        consolidado: data.consolidado,
      };
    });
    generarPDFPlanillasTodasLasSemanas(todasLasSemanas);
  };

  // Manejo de actualización de gramajes en línea para un día
  const handleUpdateGramaje = (
    numDia: number,
    itemId: string,
    campo: 'gMenor' | 'gMayor',
    valor: number
  ) => {
    setItemsPorDia((prev) => {
      const itemsDia = prev[numDia] ? [...prev[numDia]] : [];
      const idx = itemsDia.findIndex((it) => it.id === itemId);
      if (idx === -1) return prev;

      itemsDia[idx] = {
        ...itemsDia[idx],
        [campo]: Math.max(0, valor),
      };

      return {
        ...prev,
        [numDia]: itemsDia,
      };
    });
  };

  // Manejo de eliminación de un alimento de un día
  const handleConfirmEliminar = () => {
    if (!itemAEliminar) return;
    const { numDia, item } = itemAEliminar;

    setItemsPorDia((prev) => {
      const itemsDia = prev[numDia] ? [...prev[numDia]] : [];
      return {
        ...prev,
        [numDia]: itemsDia.filter((it) => it.id !== item.id),
      };
    });

    setItemAEliminar(null);
  };

  // Restablecer el menú original del ciclo para el día actual
  const handleRestablecerMenuDia = (numDia: number) => {
    const itemsOriginales = extraerItemsDeMenu(numDia, menusCiclo, idGrupoMenores, idGrupoMayores);
    setItemsPorDia((prev) => ({
      ...prev,
      [numDia]: itemsOriginales,
    }));
  };

  // Búsqueda predictiva de alimentos para el panel y modal de agregar alimento
  useEffect(() => {
    if (!addFoodSearch.trim() || (addFoodSelected && addFoodSearch.trim() === addFoodSelected.nombre.trim())) {
      setAddFoodSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setAddFoodSearching(true);
        const res = await fetch(`/api/tcac?q=${encodeURIComponent(addFoodSearch.trim())}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setAddFoodSearchResults(data.slice(0, 15));
        }
      } catch (err) {
        console.error('Error buscando alimentos TCAC:', err);
      } finally {
        setAddFoodSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [addFoodSearch, addFoodSelected]);

  // Confirmar adición de nuevo alimento al día
  const handleConfirmAgregarAlimento = (numDia: number) => {
    if (!addFoodSelected) return;

    const nuevoItem: DiaItemEditor = {
      id: `item-${numDia}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tiempo: addFoodTiempo,
      preparacion: (addFoodPreparacion || 'Preparación').trim().toUpperCase(),
      codigo_tcac: addFoodSelected.codigo_icbf || '',
      nombre: addFoodSelected.nombre,
      gMenor: Number(addFoodGMenor) || 0,
      gMayor: Number(addFoodGMayor) || 0,
      presentacionGramos: addFoodSelected.presentacion_comercial_gramos || 1000,
      costoUnidadCompra: Number(addFoodSelected.costo_unidad_compra) || 0,
      tipoEmpaque: addFoodSelected.tipo_empaque || 'kg',
      grupoAlimento: addFoodSelected.grupo_alimento || 'Otros',
    };

    setItemsPorDia((prev) => ({
      ...prev,
      [numDia]: [...(prev[numDia] || []), nuevoItem],
    }));

    // Resetear formulario del modal
    setAddFoodSelected(null);
    setAddFoodSearch('');
    setAddFoodSearchResults([]);
    setShowAddFoodModal(false);
  };

  // Filtrado de la lista en la pestaña activa
  const productosFiltradosPlanilla = useMemo(() => {
    if (!searchTerm.trim()) return consolidadoPlanilla;
    const term = searchTerm.toLowerCase();
    return consolidadoPlanilla.filter((p) => p.producto.toLowerCase().includes(term));
  }, [consolidadoPlanilla, searchTerm]);

  // Índices de subpestaña seleccionada (día 0 a 4)
  const diaSeleccionadoIndex = subTabActiva.startsWith('dia-')
    ? parseInt(subTabActiva.replace('dia-', ''))
    : null;
  const diaSeleccionadoObj =
    diaSeleccionadoIndex !== null ? diasCalculados[diaSeleccionadoIndex] : null;

  const productosFiltradosDia = useMemo(() => {
    if (!diaSeleccionadoObj) return [];
    if (!searchTerm.trim()) return diaSeleccionadoObj.itemsCompletos;
    const term = searchTerm.toLowerCase();
    return diaSeleccionadoObj.itemsCompletos.filter(
      (it) =>
        it.nombre.toLowerCase().includes(term) ||
        it.preparacion.toLowerCase().includes(term) ||
        it.tiempo.toLowerCase().includes(term) ||
        (it.codigo_tcac && it.codigo_tcac.toLowerCase().includes(term))
    );
  }, [diaSeleccionadoObj, searchTerm]);

  // Lista de preparaciones sugeridas para el día actual
  const preparacionesSugeridas = useMemo(() => {
    if (!diaSeleccionadoObj) return [];
    const setPreps = new Set<string>();
    for (const it of diaSeleccionadoObj.itemsCompletos) {
      if (it.preparacion) setPreps.add(it.preparacion);
    }
    return Array.from(setPreps);
  }, [diaSeleccionadoObj]);

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

        {/* Acciones principales de Descarga y Configuración */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setShowEditMetaModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            title="Editar Entidad, Logo, Contrato, NIT y Fechas oficiales"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            Datos & Logo
          </button>

          {/* Grupo PDF Oficial: Semana Actual y Ciclo Completo (5 Semanas) */}
          <div className="flex items-center rounded-xl bg-slate-800 p-0.5 shadow-xs">
            <button
              onClick={handleDescargarPDFPlanilla}
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
              title={`Generar e imprimir el PDF de la planilla oficial de entrega de la Semana ${semanaSeleccionadaId}`}
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              PDF (Semana {semanaSeleccionadaId})
            </button>
            <button
              onClick={handleDescargarPDFTodasLasSemanas}
              className="flex items-center gap-1 px-2.5 py-2 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-lg transition-colors border-l border-slate-700"
              title="Descargar documento PDF con las planillas oficiales de entrega de las 5 semanas completas del ciclo"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Todas (5 Sem PDF)
            </button>
          </div>

          {/* Grupo Excel Oficial: Semana Actual y Ciclo Completo (5 Semanas) */}
          <div className="flex items-center rounded-xl bg-emerald-700 p-0.5 shadow-xs">
            <button
              onClick={handleDescargarExcel}
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors"
              title={`Descargar libro Excel oficial (5 menús diarios + planilla) de la Semana ${semanaSeleccionadaId}`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              Excel (Semana {semanaSeleccionadaId})
            </button>
            <button
              onClick={handleDescargarExcelCicloCompleto}
              className="flex items-center gap-1 px-2.5 py-2 hover:bg-emerald-800 text-amber-200 text-xs font-bold rounded-lg transition-colors border-l border-emerald-600"
              title="Descargar libro Excel completo con las 5 semanas (25 menús diarios y las 5 planillas oficiales de entrega)"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              Ciclo Completo (5 Sem Excel)
            </button>
          </div>
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
      {/* MEJORA 1: Clic en la tarjeta selecciona el día; Clic exclusivo en el botón/checkbox anula/activa el día */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Estado de Días Laborables de la Semana
          </span>
          <span className="text-[11px] text-slate-500">
            Haz clic en la tarjeta para <strong>ver/editar el menú</strong> del día. Usa el botón <strong>✓ / ✕</strong> para anular (festivo).
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {diasConfig.map((dia, idx) => {
            const estaSeleccionado = subTabActiva === `dia-${idx}`;

            return (
              <div
                key={idx}
                onClick={() => setSubTabActiva(`dia-${idx}`)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                  estaSeleccionado
                    ? 'ring-2 ring-emerald-600 shadow-md bg-emerald-50/90 border-emerald-400'
                    : dia.activo
                    ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-emerald-50/50 hover:border-emerald-300'
                    : 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70 opacity-90'
                }`}
                title={`Haz clic para ver o editar el menú de ${dia.diaSemana}`}
              >
                <div className="flex-1 mr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black block text-slate-900">{dia.diaSemana}</span>
                    {estaSeleccionado && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-semibold block text-slate-500">
                    Menú Ciclo #{dia.numeroDiaCiclo}
                  </span>
                </div>

                {/* CASILLA DE VERIFICACIÓN (CHECKLIST / CHECKBOX) EXPLÍCITA */}
                <label
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center gap-1.5 cursor-pointer px-2 py-1.5 rounded-lg border transition-all ${
                    dia.activo
                      ? 'bg-emerald-100/90 hover:bg-emerald-200/90 border-emerald-300 text-emerald-900 shadow-2xs'
                      : 'bg-rose-100/90 hover:bg-rose-200/90 border-rose-300 text-rose-900 shadow-2xs'
                  }`}
                  title={dia.activo ? 'Desmarcar para anular día (Festivo / No Laboral)' : 'Marcar para activar como día laborable'}
                >
                  <input
                    type="checkbox"
                    checked={dia.activo}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleDiaActivo(idx);
                    }}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span className="text-[10px] font-extrabold select-none whitespace-nowrap">
                    {dia.activo ? '✓ Laborable' : '✕ Festivo / Anulado'}
                  </span>
                </label>
              </div>
            );
          })}
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
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Día Anulado (Festivo)" />
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
              placeholder="Filtrar por nombre, preparación o código..."
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
        {/* MEJORA 2: Con Logo Oficial en esquina superior derecha, títulos centrados y verde pastel oficial #a9d08e */}
        {/* ============================================================== */}
        {subTabActiva === 'planilla' && (
          <div className="space-y-4">
            {/* Contenedor Oficial de la Planilla con Logo Superior Derecho */}
            <div className="relative bg-white p-6 sm:p-7 rounded-2xl border border-slate-300 shadow-sm space-y-4">
              
              {/* Logo Oficial en la esquina superior derecha */}
              <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex flex-col items-center gap-1 z-10">
                <img
                  src={logoUrl || DEFAULT_LOGO_BASE64}
                  alt="Logo EAS"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl p-1 bg-white border border-slate-200 shadow-2xs"
                />
                <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md cursor-pointer transition-colors shadow-2xs">
                  📷 Cambiar Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Encabezado Institucional Centrado (Acotado con márgenes seguros para evitar colisión con el logo) */}
              <div className="w-full max-w-xl sm:max-w-2xl mx-auto text-center space-y-1 pt-1 pb-2 px-6 sm:px-12">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                  PLANILLA DE ENTREGA DE ALIMENTOS
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase leading-snug">
                  ENTIDAD ADMINISTRADORA DEL SERVICIO: <br className="sm:hidden" />
                  <span className="font-extrabold text-slate-900">{metaInstitucional.eas}</span>
                </p>
                <p className="text-[11px] sm:text-xs text-slate-700 font-bold uppercase">
                  NIT: {metaInstitucional.nit}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-700 font-bold uppercase">
                  CONTRATO N°: {metaInstitucional.contrato}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-700 font-bold uppercase">
                  MUNICIPIO: {metaInstitucional.municipio}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-800 font-bold uppercase">
                  NOMBRE DEL HCB: <span className="text-emerald-800 font-extrabold">{metadatosCompletos.nombreUds}</span>
                </p>
                <p className="text-[11px] sm:text-xs text-slate-800 font-bold uppercase">
                  NOMBRE DE LA MADRE COMUNITARIA: <span className="text-slate-900 font-extrabold">{metadatosCompletos.madreComunitaria}</span>
                </p>
              </div>

              {/* Declaración Legal Oficial */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-700 text-xs leading-relaxed text-justify sm:text-left flex-1">
                  El día <strong>{metaInstitucional.fechaEntrega}</strong> se hizo la entrega a la madre comunitaria los productos alimenticos establecidos en la minuta patrón y lista de compra, para la preparación de los alimentos de los niños y niñas beneficiarios de la modalidad HCB; los cuales se relacionan a continuación: <strong>menú {textoCiclo}</strong>, semana del <strong>{metaInstitucional.fechaInicio}</strong> hasta el <strong>{metaInstitucional.fechaFin}</strong>:
                </p>
                <button
                  type="button"
                  onClick={() => setShowEditMetaModal(true)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-2xs"
                  title="Editar Fechas y Encabezado Oficial"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  ✏️ Editar Fechas y Encabezado
                </button>
              </div>

              {/* TABLA OFICIAL DE PRODUCTOS CON ENCABEZADO VERDE PASTEL #a9d08e OFICIAL */}
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#a9d08e] text-slate-900 font-black border-b border-slate-300 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-center w-12 border-r border-slate-300">N°</th>
                      <th className="p-3 border-r border-slate-300">PRODUCTO / ALIMENTO</th>
                      <th className="p-3 text-right border-r border-slate-300">UNIDAD DE MEDIDA ( GRAMOS- ML)</th>
                      <th className="p-3 text-right border-r border-slate-300">EQUIVALENTE EN KILOS</th>
                      <th className="p-3 text-center">ESTADO RECEPCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {productosFiltradosPlanilla.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                          No hay productos registrados para los días activos de esta semana.
                        </td>
                      </tr>
                    ) : (
                      productosFiltradosPlanilla.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-center font-mono text-slate-500 font-bold border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                            {prod.producto}
                          </td>
                          <td className="p-2.5 text-right font-mono font-extrabold text-slate-900 bg-slate-50/50 border-r border-slate-200">
                            {prod.totalGramos.toLocaleString('es-CO')}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-200">
                            {(prod.totalGramos / 1000).toFixed(2)} kg
                          </td>
                          <td className="p-2.5 text-center">
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
                      <td colSpan={2} className="p-3 text-right uppercase border-r border-slate-200">
                        TOTAL CONSOLIDADO SEMANAL ({productosFiltradosPlanilla.length} PRODUCTOS):
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-900 text-sm border-r border-slate-200">
                        {totalGramosSemana.toLocaleString('es-CO')} g
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800 text-sm border-r border-slate-200">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="p-5 border border-dashed border-slate-400 rounded-xl bg-slate-50 text-center space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Responsable de Recepción en la UDS
                  </span>
                  <div className="pt-10 border-b border-slate-500 mx-8"></div>
                  <div>
                    <strong className="text-xs text-slate-900 block uppercase font-extrabold">
                      RECIBIO A SATISFACCION
                    </strong>
                    <p className="text-[11px] text-slate-700 font-bold mt-1">
                      Madre Comunitaria: {metadatosCompletos.madreComunitaria}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">C.C. ____________________________</p>
                  </div>
                </div>

                <div className="p-5 border border-dashed border-slate-400 rounded-xl bg-slate-50 text-center space-y-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Responsable de Suministro y Despacho
                  </span>
                  <div className="pt-10 border-b border-slate-500 mx-8"></div>
                  <div>
                    <strong className="text-xs text-slate-900 block uppercase font-extrabold">
                      ENTREGO
                    </strong>
                    <p className="text-[11px] text-slate-700 font-bold mt-1">
                      Nutricionista / Supervisor ICBF / EAS
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">T.P. / C.C. ____________________________</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUB-TABS 2 A 6: CREADOR / EDITOR INTERACTIVO DE ALIMENTOS POR DÍA */}
        {/* MEJORA 3: Edición en línea de gramajes, botón Agregar Alimento, botón Restablecer y eliminar */}
        {/* ============================================================== */}
        {diaSeleccionadoObj && (
          <div className="space-y-4">
            {/* 1. INFORMACIÓN Y ESTADO DEL DÍA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {diaSeleccionadoObj.diaSemana} — Menú del Ciclo #{diaSeleccionadoObj.numeroDiaCiclo}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        diaSeleccionadoObj.activo ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {diaSeleccionadoObj.activo ? 'Día Activo' : `Anulado (${diaSeleccionadoObj.motivoAnulacion || 'Festivo'})`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifica los gramajes en línea o añade nuevos alimentos a este día del menú. Se recalcula en vivo.
                  </p>
                </div>
              </div>

              {/* Botón de Restablecer Menú */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleRestablecerMenuDia(diaSeleccionadoObj.numeroDiaCiclo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition-colors shadow-2xs"
                  title="Restablecer los alimentos originales del ciclo para este día"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Restablecer Menú Original
                </button>
              </div>
            </div>

            {/* 2. PANEL SUPERIOR VISIBLE: "+ AGREGAR ALIMENTO A ESTE DÍA" */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-700 text-white rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                    + Agregar Alimento a este Día ({diaSeleccionadoObj.diaSemana} - Menú #{diaSeleccionadoObj.numeroDiaCiclo})
                  </h5>
                  <p className="text-[11px] text-slate-600">
                    Selecciona tiempo, preparación, busca por Cód. TCAC o nombre y define los pesos brutos.
                  </p>
                </div>
              </div>

              {/* Formulario Reactivo e Interactivo */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs">
                {/* Selector de Tiempo de Comida */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Tiempo de Comida:</label>
                  <select
                    value={addFoodTiempo}
                    onChange={(e) => setAddFoodTiempo(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 text-xs"
                  >
                    {TIEMPOS_COMIDA_DEFAULT.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input de Preparación con Datalist de autocompletado */}
                <div className="sm:col-span-3">
                  <label className="font-bold text-slate-700 block mb-1">Preparación:</label>
                  <input
                    type="text"
                    list={`preparaciones-list-${diaSeleccionadoObj.numeroDiaCiclo}`}
                    placeholder="Ej. SOPA DE VERDURAS..."
                    value={addFoodPreparacion}
                    onChange={(e) => setAddFoodPreparacion(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-medium uppercase"
                  />
                  <datalist id={`preparaciones-list-${diaSeleccionadoObj.numeroDiaCiclo}`}>
                    {preparacionesSugeridas.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                {/* Buscador predictivo de Alimento (Cód. TCAC o Nombre) */}
                <div className="sm:col-span-3 relative">
                  <label className="font-bold text-slate-700 block mb-1">
                    Alimento (Cód. TCAC o Nombre):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cód. (ej. 01002) o nombre..."
                      value={addFoodSearch}
                      onChange={(e) => {
                        setAddFoodSearch(e.target.value);
                        if (addFoodSelected && e.target.value !== addFoodSelected.nombre) {
                          setAddFoodSelected(null);
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 bg-white border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs ${
                        addFoodSelected ? 'border-emerald-500 font-bold text-emerald-900 bg-emerald-50/50' : 'border-slate-300'
                      }`}
                    />
                    {addFoodSearching && (
                      <span className="absolute right-2 top-2 text-[9px] text-slate-400 font-semibold animate-pulse">
                        ...
                      </span>
                    )}
                  </div>

                  {/* Dropdown flotante con resultados predictivos */}
                  {addFoodSearchResults.length > 0 && !addFoodSelected && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto bg-white border border-slate-300 rounded-xl shadow-lg divide-y divide-slate-100">
                      {addFoodSearchResults.map((alim) => (
                        <div
                          key={alim.id}
                          onClick={() => {
                            setAddFoodSelected(alim);
                            setAddFoodSearch(alim.nombre);
                            setAddFoodSearchResults([]);
                          }}
                          className="p-2 hover:bg-emerald-50 cursor-pointer flex justify-between items-center text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{alim.nombre}</span>
                            <span className="text-[10px] text-slate-500">
                              Cód: {alim.codigo_icbf || 'S/C'} • {alim.grupo_alimento}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {alim.presentacion_comercial_gramos || 1000}g
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {addFoodSelected && (
                    <span className="block text-[10px] text-emerald-800 font-bold mt-0.5 truncate">
                      ✓ Cód. {addFoodSelected.codigo_icbf || 'S/C'}: {addFoodSelected.nombre}
                    </span>
                  )}
                </div>

                {/* Inputs numéricos: P. Bruto < 3a (g) y P. Bruto >= 3a (g) */}
                <div className="sm:col-span-1">
                  <label className="font-bold text-sky-900 block mb-1 text-[11px] whitespace-nowrap">
                    &lt; 3a (g):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={addFoodGMenor}
                    onChange={(e) => setAddFoodGMenor(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-mono font-bold text-right"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="font-bold text-purple-900 block mb-1 text-[11px] whitespace-nowrap">
                    &ge; 3a (g):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={addFoodGMayor}
                    onChange={(e) => setAddFoodGMayor(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-right"
                  />
                </div>

                {/* Botón Agregar a la Lista */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    disabled={!addFoodSelected}
                    onClick={() => handleConfirmAgregarAlimento(diaSeleccionadoObj.numeroDiaCiclo)}
                    className="w-full py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Agregar a la Lista
                  </button>
                </div>
              </div>
            </div>

            {/* TABLA EDITABLE CON LAS 10 COLUMNAS ESPECIFICADAS */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Tiempo de Comida</th>
                    <th className="p-3">Preparación</th>
                    <th className="p-3 text-center">Cód. TCAC</th>
                    <th className="p-3">Ingredientes (Alimento)</th>
                    <th className="p-3 text-right">P. Bruto &lt; 3a (g)</th>
                    <th className="p-3 text-right">P. Bruto &ge; 3a (g)</th>
                    <th className="p-3 text-right bg-sky-50/70 text-sky-950 font-extrabold">
                      Menor de 3 (g) <span className="block text-[9px] font-normal text-sky-700">({demografiaActiva.menores3} niños)</span>
                    </th>
                    <th className="p-3 text-right bg-purple-50/70 text-purple-950 font-extrabold">
                      Mayor de 3 (g) <span className="block text-[9px] font-normal text-purple-700">({demografiaActiva.mayores3} niños)</span>
                    </th>
                    <th className="p-3 text-right bg-emerald-50 text-emerald-950 font-black">
                      Total Día (g)
                    </th>
                    <th className="p-3 text-center w-12">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productosFiltradosDia.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                        No hay ingredientes registrados para este día. Usa el botón &quot;+ Agregar Alimento al Día&quot; o &quot;Restablecer Menú&quot;.
                      </td>
                    </tr>
                  ) : (
                    productosFiltradosDia.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Tiempo de comida */}
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                            {it.tiempo}
                          </span>
                        </td>

                        {/* 2. Preparación */}
                        <td className="p-2.5 font-semibold text-slate-800">
                          {it.preparacion}
                        </td>

                        {/* 3. Código TCAC */}
                        <td className="p-2.5 text-center font-mono text-[11px] text-slate-500 font-bold">
                          {it.codigo_tcac || '—'}
                        </td>

                        {/* 4. Nombre del ingrediente */}
                        <td className="p-2.5 font-bold text-slate-900">
                          {it.nombre}
                        </td>

                        {/* 5. Peso Bruto < 3a (Editable en línea) */}
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={it.gMenor}
                            onChange={(e) =>
                              handleUpdateGramaje(
                                diaSeleccionadoObj.numeroDiaCiclo,
                                it.id,
                                'gMenor',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 px-1.5 py-1 text-right font-mono font-bold bg-white border border-sky-300 rounded text-xs focus:ring-2 focus:ring-sky-500 shadow-2xs"
                            title="Editar gramaje por ración para menores de 3 años"
                          />
                        </td>

                        {/* 6. Peso Bruto >= 3a (Editable en línea) */}
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={it.gMayor}
                            onChange={(e) =>
                              handleUpdateGramaje(
                                diaSeleccionadoObj.numeroDiaCiclo,
                                it.id,
                                'gMayor',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 px-1.5 py-1 text-right font-mono font-bold bg-white border border-purple-300 rounded text-xs focus:ring-2 focus:ring-purple-500 shadow-2xs"
                            title="Editar gramaje por ración para mayores de 3 años"
                          />
                        </td>

                        {/* 7. Menor de 3 (g) Calculado reactivo */}
                        <td className="p-2.5 text-right font-mono font-bold text-sky-900 bg-sky-50/40">
                          {it.totalMenor.toLocaleString('es-CO')}
                        </td>

                        {/* 8. Mayor de 3 (g) Calculado reactivo */}
                        <td className="p-2.5 text-right font-mono font-bold text-purple-900 bg-purple-50/40">
                          {it.totalMayor.toLocaleString('es-CO')}
                        </td>

                        {/* 9. Total Día (g) Calculado reactivo */}
                        <td className="p-2.5 text-right font-mono font-extrabold text-emerald-950 bg-emerald-50/40">
                          {it.totalDia.toLocaleString('es-CO')}
                        </td>

                        {/* 10. Acciones: Eliminar fila con confirmación */}
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() =>
                              setItemAEliminar({
                                numDia: diaSeleccionadoObj.numeroDiaCiclo,
                                item: it,
                              })
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title={`Eliminar ${it.nombre} de este día`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-xs text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="p-3 text-right uppercase">
                      TOTAL DÍA ({productosFiltradosDia.length} INGREDIENTES):
                    </td>
                    <td className="p-3 text-right font-mono text-sky-900">
                      {productosFiltradosDia
                        .reduce((sum, it) => sum + it.totalMenor, 0)
                        .toLocaleString('es-CO')}{' '}
                      g
                    </td>
                    <td className="p-3 text-right font-mono text-purple-900">
                      {productosFiltradosDia
                        .reduce((sum, it) => sum + it.totalMayor, 0)
                        .toLocaleString('es-CO')}{' '}
                      g
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-900 text-sm">
                      {productosFiltradosDia
                        .reduce((sum, it) => sum + it.totalDia, 0)
                        .toLocaleString('es-CO')}{' '}
                      g
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
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

      {/* ============================================================== */}
      {/* MODAL 1: DATOS INSTITUCIONALES Y GESTIÓN DE LOGO OFICIAL */}
      {/* ============================================================== */}
      {showEditMetaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                Editar Encabezado Oficial ICBF y Logo EAS
              </h3>
              <button
                onClick={() => setShowEditMetaModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Sección de Gestión del Logo Oficial */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Logo Oficial de la Entidad (EAS)
                </span>

                <div className="flex items-center gap-4">
                  <img
                    src={logoUrl || DEFAULT_LOGO_BASE64}
                    alt="Logo actual"
                    className="w-16 h-16 object-contain rounded-lg border border-slate-300 bg-white p-1 shadow-2xs"
                  />

                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      Subir o Modificar Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    <div>
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="text-[11px] text-slate-500 hover:text-rose-600 underline font-semibold"
                      >
                        Restablecer logo oficial por defecto
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  El logo se almacena localmente y se incrusta automáticamente tanto en la planilla visual como en el archivo PDF oficial.
                </p>
              </div>

              {/* Campos de Texto Institucionales */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Entidad Administradora del Servicio (EAS):
                </label>
                <input
                  type="text"
                  value={metaInstitucional.eas}
                  onChange={(e) => setMetaInstitucional({ ...metaInstitucional, eas: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIT:</label>
                  <input
                    type="text"
                    value={metaInstitucional.nit}
                    onChange={(e) => setMetaInstitucional({ ...metaInstitucional, nit: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contrato N°:</label>
                  <input
                    type="text"
                    value={metaInstitucional.contrato}
                    onChange={(e) => setMetaInstitucional({ ...metaInstitucional, contrato: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Municipio:</label>
                <input
                  type="text"
                  value={metaInstitucional.municipio}
                  onChange={(e) => setMetaInstitucional({ ...metaInstitucional, municipio: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
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

      {/* ============================================================== */}
      {/* MODAL 2: AGREGAR ALIMENTO AL DÍA ACTIVO */}
      {/* ============================================================== */}
      {showAddFoodModal && diaSeleccionadoObj && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Agregar Alimento al Día ({diaSeleccionadoObj.diaSemana} - Menú #{diaSeleccionadoObj.numeroDiaCiclo})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Busca por código TCAC o por nombre y define los gramajes por grupo etario.
                </p>
              </div>
              <button
                onClick={() => setShowAddFoodModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Tiempo de Comida */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiempo de Comida:</label>
                <select
                  value={addFoodTiempo}
                  onChange={(e) => setAddFoodTiempo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {TIEMPOS_COMIDA_DEFAULT.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preparación con sugerencias */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nombre de la Preparación:
                </label>
                <input
                  type="text"
                  list="preparaciones-list"
                  placeholder="Ej. SOPA DE VERDURAS, ARROZ BLANCO..."
                  value={addFoodPreparacion}
                  onChange={(e) => setAddFoodPreparacion(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <datalist id="preparaciones-list">
                  {preparacionesSugeridas.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              {/* Buscador predictivo por Código TCAC o Nombre */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Buscar Alimento (Cód. TCAC o Nombre):
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Escribe el código ICBF o nombre (ej. 01002, Zanahoria, Arroz)..."
                    value={addFoodSearch}
                    onChange={(e) => setAddFoodSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  {addFoodSearching && (
                    <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-semibold animate-pulse">
                      Buscando...
                    </span>
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {addFoodSearchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-xs">
                    {addFoodSearchResults.map((alim) => (
                      <div
                        key={alim.id}
                        onClick={() => {
                          setAddFoodSelected(alim);
                          setAddFoodSearch(alim.nombre);
                          setAddFoodSearchResults([]);
                        }}
                        className={`p-2 hover:bg-emerald-50 cursor-pointer flex justify-between items-center text-xs transition-colors ${
                          addFoodSelected?.id === alim.id ? 'bg-emerald-100 font-bold' : ''
                        }`}
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{alim.nombre}</span>
                          <span className="text-[10px] text-slate-500">
                            Cód: {alim.codigo_icbf || 'S/C'} • Grupo: {alim.grupo_alimento}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {alim.presentacion_comercial_gramos || 1000}g
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alimento seleccionado activo */}
                {addFoodSelected && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-emerald-950 block">
                        ✓ {addFoodSelected.nombre}
                      </span>
                      <span className="text-[10px] text-emerald-800">
                        Código: {addFoodSelected.codigo_icbf || 'S/C'} • {addFoodSelected.tipo_empaque || 'kg'} ({addFoodSelected.presentacion_comercial_gramos || 1000}g)
                      </span>
                    </div>
                    <button
                      onClick={() => setAddFoodSelected(null)}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Gramajes por Ración (< 3 años y >= 3 años) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
                  <label className="font-bold text-sky-900 block flex items-center gap-1">
                    <Baby className="w-3.5 h-3.5 text-sky-700" />
                    P. Bruto &lt; 3 años (g):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={addFoodGMenor}
                    onChange={(e) => setAddFoodGMenor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-mono font-bold text-right"
                  />
                  <span className="text-[10px] text-sky-700 block text-right font-medium">
                    = {Math.round((Number(addFoodGMenor) || 0) * demografiaActiva.menores3 * 10) / 10}g total
                  </span>
                </div>

                <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                  <label className="font-bold text-purple-900 block flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-purple-700" />
                    P. Bruto &ge; 3 años (g):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={addFoodGMayor}
                    onChange={(e) => setAddFoodGMayor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-right"
                  />
                  <span className="text-[10px] text-purple-700 block text-right font-medium">
                    = {Math.round((Number(addFoodGMayor) || 0) * demografiaActiva.mayores3 * 10) / 10}g total
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddFoodModal(false)}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!addFoodSelected}
                onClick={() => handleConfirmAgregarAlimento(diaSeleccionadoObj.numeroDiaCiclo)}
                className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                Insertar en el Menú del Día
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CONFIRMAR ELIMINACIÓN DE ALIMENTO */}
      {/* ============================================================== */}
      {itemAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-extrabold text-slate-900 text-sm">
                Confirmar Eliminación
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar <strong>{itemAEliminar.item.nombre}</strong> ({itemAEliminar.item.preparacion}) de este día?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setItemAEliminar(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEliminar}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Eliminar Fila
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
