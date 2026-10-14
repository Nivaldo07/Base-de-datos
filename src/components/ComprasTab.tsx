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
  AlertCircle,
  Filter,
  Search,
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  ChevronRight,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DiaSemanaConfig {
  diaSemana: string;
  numeroDiaCiclo: number;
  activo: boolean;
  motivoAnulacion: string;
}

interface ItemProyeccionCompra {
  alimentoId: number;
  codigo_icbf: string;
  nombre: string;
  grupo_alimento: string;
  presentacion_comercial_gramos: number;
  tipo_empaque: string;
  costo_unidad_compra: number;
  pesoBrutoPorNinoSemana: number; // gramos brutos por ración en toda la semana activa
  totalBrutoGramos: number; // pesoBrutoPorNinoSemana * totalBeneficiarios
  totalBrutoKilos: number; // totalBrutoGramos / 1000
  unidadesComerciales: number; // ceil(totalBrutoGramos / presentacion_comercial_gramos)
  costoSubtotal: number; // unidadesComerciales * costo_unidad_compra
  preparacionesUsadas: string[];
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
  const [selectedGrupoId, setSelectedGrupoId] = useState<number>(1);
  const [menusCiclo, setMenusCiclo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuración de la semana
  const [semanaSeleccionadaId, setSemanaSeleccionadaId] = useState<number>(1);
  const [diasConfig, setDiasConfig] = useState<DiaSemanaConfig[]>([
    { diaSemana: 'Lunes', numeroDiaCiclo: 1, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Martes', numeroDiaCiclo: 2, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Miércoles', numeroDiaCiclo: 3, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Jueves', numeroDiaCiclo: 4, activo: true, motivoAnulacion: '' },
    { diaSemana: 'Viernes', numeroDiaCiclo: 5, activo: true, motivoAnulacion: '' },
  ]);

  // Modo de visualización: 'global' (Todas las UDS) o 'uds' (Individual)
  const [modoVista, setModoVista] = useState<'global' | 'uds'>('global');
  const [selectedUdsId, setSelectedUdsId] = useState<number | null>(null);

  // Filtros de búsqueda en la tabla de compras
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupoFiltro, setSelectedGrupoFiltro] = useState<string>('TODOS');

  // 1. Cargar Hogares (UDS) y Grupos Etarios
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        const [resHogares, resGrupos] = await Promise.all([
          fetch('/api/hogares'),
          fetch('/api/grupos-etarios'),
        ]);

        const dataHogares = await resHogares.json();
        const dataGrupos = await resGrupos.json();

        if (Array.isArray(dataHogares)) {
          setHogares(dataHogares);
          if (dataHogares.length > 0) {
            setSelectedUdsId(dataHogares[0].id);
          }
        }

        if (Array.isArray(dataGrupos) && dataGrupos.length > 0) {
          setGruposEtarios(dataGrupos);
          setSelectedGrupoId(dataGrupos[0].id);
        }
      } catch (error) {
        console.error('Error cargando catálogos de compras:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogos();
  }, []);

  // 2. Cargar Menús del Grupo Etario seleccionado
  useEffect(() => {
    const fetchMenus = async () => {
      if (!selectedGrupoId) return;
      try {
        const res = await fetch(`/api/menus?grupoId=${selectedGrupoId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMenusCiclo(data);
        }
      } catch (error) {
        console.error('Error cargando menús del ciclo:', error);
      }
    };

    fetchMenus();
  }, [selectedGrupoId]);

  // Cambiar semana preconfigurada (Semana 1..5)
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

  // Toggle de un día activo/anulado (festivo o no laboral)
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

  // Cambiar el número de día del ciclo de un día específico
  const handleChangeDiaCiclo = (index: number, nuevoDiaCiclo: number) => {
    setDiasConfig((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        numeroDiaCiclo: nuevoDiaCiclo,
      };
      return next;
    });
  };

  // Cambiar motivo de anulación
  const handleChangeMotivoAnulacion = (index: number, motivo: string) => {
    setDiasConfig((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        motivoAnulacion: motivo,
      };
      return next;
    });
  };

  // Cálculo de beneficiarios según la vista seleccionada
  const udsSeleccionada = hogares.find((h) => h.id === selectedUdsId);

  const totalBeneficiariosActivos = useMemo(() => {
    if (modoVista === 'uds') {
      return udsSeleccionada?.cupo_aprobado || udsSeleccionada?.numero_beneficiarios || 14;
    }
    // Modo Global: Suma de los cupos de todas las UDS
    return hogares.reduce(
      (acc, h) => acc + (h.cupo_aprobado || h.numero_beneficiarios || 14),
      0
    );
  }, [modoVista, udsSeleccionada, hogares]);

  const diasHabilesActivosCount = useMemo(() => {
    return diasConfig.filter((d) => d.activo).length;
  }, [diasConfig]);

  // CÁLCULO PRINCIPAL: Proyección de compras de víveres
  const proyeccionCompras = useMemo<ItemProyeccionCompra[]>(() => {
    const diasActivos = diasConfig.filter((d) => d.activo);
    if (diasActivos.length === 0 || totalBeneficiariosActivos <= 0) {
      return [];
    }

    const mapaAlimentos = new Map<
      number,
      {
        alim: any;
        pesoBrutoTotalNino: number;
        costoUnidad: number;
        preparacionesSet: Set<string>;
      }
    >();

    for (const diaCfg of diasActivos) {
      const menuDelDia = menusCiclo.find((m) => m.numero_dia === diaCfg.numeroDiaCiclo);
      if (!menuDelDia || !Array.isArray(menuDelDia.preparaciones)) continue;

      for (const prep of menuDelDia.preparaciones) {
        if (!Array.isArray(prep.ingredientes)) continue;

        for (const ing of prep.ingredientes) {
          const alim = ing.alimento;
          if (!alim) continue;

          const bruto = Number(ing.peso_bruto) || 0;
          const costoUnitario =
            Number(ing.costo_unidad_compra) ||
            Number(ing.costo_unitario_excel) ||
            Number(alim.costo_unidad_compra) ||
            0;

          if (!mapaAlimentos.has(alim.id)) {
            mapaAlimentos.set(alim.id, {
              alim,
              pesoBrutoTotalNino: 0,
              costoUnidad: costoUnitario,
              preparacionesSet: new Set(),
            });
          }

          const entry = mapaAlimentos.get(alim.id)!;
          entry.pesoBrutoTotalNino += bruto;
          if (costoUnitario > 0 && entry.costoUnidad === 0) {
            entry.costoUnidad = costoUnitario;
          }
          entry.preparacionesSet.add(
            `[${diaCfg.diaSemana} - ${prep.tiempo_comida}] ${prep.nombre}`
          );
        }
      }
    }

    const items: ItemProyeccionCompra[] = [];

    for (const [alimentoId, data] of mapaAlimentos.entries()) {
      const presGramos =
        data.alim.presentacion_comercial_gramos > 0
          ? data.alim.presentacion_comercial_gramos
          : 1000;

      // Demanda total = Bruto individual en la semana activa * Total de raciones
      const totalBrutoGramos = data.pesoBrutoTotalNino * totalBeneficiariosActivos;
      const totalBrutoKilos = totalBrutoGramos / 1000;

      // Función techo reglamentaria del ICBF: Math.ceil(TotalGramos / PresentacionComercial)
      const unidadesComerciales = Math.ceil(totalBrutoGramos / presGramos);
      const costoSubtotal = unidadesComerciales * data.costoUnidad;

      items.push({
        alimentoId,
        codigo_icbf: data.alim.codigo_icbf || `#${alimentoId}`,
        nombre: data.alim.nombre,
        grupo_alimento: data.alim.grupo_alimento || 'Varios',
        presentacion_comercial_gramos: presGramos,
        tipo_empaque: data.alim.tipo_empaque || 'kg',
        costo_unidad_compra: data.costoUnidad,
        pesoBrutoPorNinoSemana: data.pesoBrutoTotalNino,
        totalBrutoGramos,
        totalBrutoKilos,
        unidadesComerciales,
        costoSubtotal,
        preparacionesUsadas: Array.from(data.preparacionesSet),
      });
    }

    // Ordenar por Grupo de Alimento y luego por Nombre
    return items.sort((a, b) =>
      a.grupo_alimento.localeCompare(b.grupo_alimento) || a.nombre.localeCompare(b.nombre)
    );
  }, [diasConfig, menusCiclo, totalBeneficiariosActivos]);

  // Lista única de grupos para el filtro
  const listaGruposAlimentos = useMemo(() => {
    const grupos = new Set<string>();
    proyeccionCompras.forEach((item) => grupos.add(item.grupo_alimento));
    return Array.from(grupos).sort();
  }, [proyeccionCompras]);

  // Filtrado de la tabla
  const itemsFiltrados = useMemo(() => {
    return proyeccionCompras.filter((item) => {
      const matchSearch =
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo_icbf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.preparacionesUsadas.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchGrupo =
        selectedGrupoFiltro === 'TODOS' || item.grupo_alimento === selectedGrupoFiltro;

      return matchSearch && matchGrupo;
    });
  }, [proyeccionCompras, searchTerm, selectedGrupoFiltro]);

  // Totales acumulados
  const totalCostoGeneral = useMemo(() => {
    return proyeccionCompras.reduce((acc, item) => acc + item.costoSubtotal, 0);
  }, [proyeccionCompras]);

  const totalKilosGeneral = useMemo(() => {
    return proyeccionCompras.reduce((acc, item) => acc + item.totalBrutoKilos, 0);
  }, [proyeccionCompras]);

  // Exportar a Excel (.xlsx)
  const handleExportExcel = () => {
    if (proyeccionCompras.length === 0) {
      alert('No hay datos calculados para exportar');
      return;
    }

    const rows = proyeccionCompras.map((item) => ({
      'Código TCAC': item.codigo_icbf,
      'Alimento / Insumo': item.nombre,
      'Grupo de Alimento': item.grupo_alimento,
      'Bruto / Niño / Sem (g)': Math.round(item.pesoBrutoPorNinoSemana * 10) / 10,
      'Demanda Total (kg)': Math.round(item.totalBrutoKilos * 100) / 100,
      'Presentación Comercial': `${item.presentacion_comercial_gramos}g (${item.tipo_empaque})`,
      'Empaques a Adquirir (Techo)': item.unidadesComerciales,
      'Costo Unitario ($)': item.costo_unidad_compra,
      'Costo Total ($)': item.costoSubtotal,
      'Tiempos y Preparaciones': item.preparacionesUsadas.join('; '),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proyección Compras ICBF');

    const fileName = `Proyeccion_Compras_${modoVista === 'global' ? 'Consolidado_Todas_UDS' : udsSeleccionada?.nombre || 'UDS'}_Semana_${semanaSeleccionadaId}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Exportar Orden de Compra Oficial en PDF
  const handleExportPDF = () => {
    if (proyeccionCompras.length === 0) {
      alert('No hay datos calculados para exportar');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    // Cabecera institucional ICBF
    doc.setFillColor(6, 78, 59); // emerald-900
    doc.rect(0, 0, 279, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INSTITUTO COLOMBIANO DE BIENESTAR FAMILIAR - ICBF', 14, 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'ORDEN DE COMPRA Y CONSOLIDADO LOGÍSTICO SEMANAL DE VÍVERES Y ALIMENTOS',
      14,
      17
    );

    // Metadata
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const nombreUdsText =
      modoVista === 'global'
        ? `CONSOLIDADO GENERAL (${hogares.length} UDS ACTIVAS)`
        : `${udsSeleccionada?.nombre} (${udsSeleccionada?.codigo_uds || 'Sin Código'})`;

    doc.text(`Destino / Modalidad: ${nombreUdsText}`, 14, 30);
    doc.text(
      `Semana del Menú: Semana ${semanaSeleccionadaId} (${diasHabilesActivosCount} días hábiles programados)`,
      14,
      35
    );
    doc.text(
      `Beneficiarios: ${totalBeneficiariosActivos} niños/as • Raciones: ${totalBeneficiariosActivos * diasHabilesActivosCount}`,
      160,
      30
    );
    doc.text(
      `Total Inversión Estimada: $${totalCostoGeneral.toLocaleString('es-CO')} COP`,
      160,
      35
    );

    const tableData = proyeccionCompras.map((item) => [
      item.codigo_icbf,
      item.nombre,
      item.grupo_alimento,
      `${item.pesoBrutoPorNinoSemana.toFixed(1)}g`,
      `${item.totalBrutoKilos.toFixed(2)} kg`,
      `${item.presentacion_comercial_gramos}g (${item.tipo_empaque})`,
      item.unidadesComerciales.toString(),
      `$${item.costo_unidad_compra.toLocaleString('es-CO')}`,
      `$${item.costoSubtotal.toLocaleString('es-CO')}`,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [
        [
          'Cód. TCAC',
          'Alimento / Insumo',
          'Grupo',
          'Bruto/Niño',
          'Total Bruto',
          'Presentación',
          'A Adquirir',
          'Costo Unit.',
          'Costo Total',
        ],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [6, 78, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
        5: { halign: 'center', cellWidth: 35 },
        6: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        7: { halign: 'right', cellWidth: 25 },
        8: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
      },
    });

    // Firmas reglamentarias
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY < 185) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.line(14, finalY + 12, 80, finalY + 12);
      doc.text('Nutricionista Dietista EAS / ICBF', 14, finalY + 16);

      doc.line(100, finalY + 12, 170, finalY + 12);
      doc.text('Coordinador Operativo / Interventoría', 100, finalY + 16);

      doc.line(190, finalY + 12, 260, finalY + 12);
      doc.text('Proveedor Mayorista de Víveres', 190, finalY + 16);
    }

    doc.save(
      `Orden_Compra_ICBF_${modoVista === 'global' ? 'Global' : udsSeleccionada?.nombre || 'UDS'}_Semana_${semanaSeleccionadaId}.pdf`
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold">Cargando datos de UDS y ciclo de menús...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. CABECERA PRINCIPAL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Proyección de Compras y Pedido Semanal
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cálculo automatizado de víveres por UDS y consolidado global con control de festivos y redondeo comercial reglamentario ICBF.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de Exportación */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-102"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar Excel (.xlsx)
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-102"
          >
            <Download className="w-4 h-4" />
            Orden de Compra PDF
          </button>
        </div>
      </div>

      {/* 2. SELECTOR DE SEMANA Y GRUPO ETARIO */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Selección de la Semana en el Ciclo de 25 Días
            </h3>
            <p className="text-[11px] text-slate-500">
              Escoge una semana del ciclo y gestiona qué días operan o se anulan por festivos/paros.
            </p>
          </div>

          {/* Selector de Grupo Etario */}
          {gruposEtarios.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Grupo Etario:</label>
              <select
                value={selectedGrupoId}
                onChange={(e) => setSelectedGrupoId(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                {gruposEtarios.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botones de Selección Rápida de Semanas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SEMANAS_PRESET.map((sem) => {
            const isSelected = semanaSeleccionadaId === sem.id;
            return (
              <button
                key={sem.id}
                onClick={() => handleSelectSemanaPreset(sem.id)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <span>{sem.label}</span>
                <span className={`text-[10px] font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                  5 días del ciclo
                </span>
              </button>
            );
          })}
        </div>

        {/* GRILLA DE LOS 5 DÍAS DE LA SEMANA CON SWITCH DE ANULACIÓN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {diasConfig.map((diaCfg, index) => {
            const menuAsociado = menusCiclo.find((m) => m.numero_dia === diaCfg.numeroDiaCiclo);
            const cantidadIngredientes = menuAsociado?.preparaciones?.reduce(
              (acc: number, p: any) => acc + (p.ingredientes?.length || 0),
              0
            ) || 0;

            return (
              <div
                key={diaCfg.diaSemana}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  diaCfg.activo
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-100/80 border-slate-300 opacity-80'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-slate-800">{diaCfg.diaSemana}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleDiaActivo(index)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                      diaCfg.activo
                        ? 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300'
                        : 'bg-rose-200 text-rose-900 hover:bg-rose-300'
                    }`}
                  >
                    {diaCfg.activo ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-700" />
                        Laborable
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-700" />
                        Anulado
                      </>
                    )}
                  </button>
                </div>

                {/* Selector de Menú del Ciclo para este día */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Menú del Ciclo:
                  </label>
                  <select
                    disabled={!diaCfg.activo}
                    value={diaCfg.numeroDiaCiclo}
                    onChange={(e) => handleChangeDiaCiclo(index, Number(e.target.value))}
                    className={`w-full px-2 py-1 border rounded-lg text-xs font-bold ${
                      diaCfg.activo
                        ? 'bg-white border-slate-300 text-slate-800'
                        : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {Array.from({ length: 25 }, (_, i) => i + 1).map((dia) => (
                      <option key={dia} value={dia}>
                        Día {dia} {dia === diaCfg.numeroDiaCiclo ? `(${cantidadIngredientes} ing.)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Motivo de anulación si está inactivo */}
                {!diaCfg.activo ? (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">
                      Motivo de Anulación:
                    </label>
                    <select
                      value={diaCfg.motivoAnulacion}
                      onChange={(e) => handleChangeMotivoAnulacion(index, e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-rose-300 rounded text-[11px] text-rose-800 font-medium"
                    >
                      <option value="Día Festivo">Día Festivo</option>
                      <option value="Jornada Pedagógica">Jornada Pedagógica</option>
                      <option value="Paro / Emergencia">Paro / Emergencia</option>
                      <option value="Mantenimiento UDS">Mantenimiento UDS</option>
                    </select>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-800 font-medium flex items-center justify-between">
                    <span>Preparaciones:</span>
                    <strong className="font-bold">{menuAsociado?.preparaciones?.length || 0} registradas</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SELECTOR DE MODALIDAD: CONSOLIDADO GLOBAL vs POR UDS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Modalidad de Cálculo:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setModoVista('global')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modoVista === 'global'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Consolidado Global ({hogares.length} UDS)
            </button>
            <button
              onClick={() => setModoVista('uds')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modoVista === 'uds'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              Desglose por UDS Individual
            </button>
          </div>
        </div>

        {/* Si está en modo individual, mostrar selector de UDS */}
        {modoVista === 'uds' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-600 shrink-0">Seleccionar UDS:</label>
            <select
              value={selectedUdsId || ''}
              onChange={(e) => setSelectedUdsId(Number(e.target.value))}
              className="w-full md:w-64 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {hogares.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre} (Cupo: {h.cupo_aprobado || h.numero_beneficiarios || 14})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. TARJETAS KPI DE RESUMEN LOGÍSTICO Y FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inversión en Víveres</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">
              ${totalCostoGeneral.toLocaleString('es-CO')}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Presupuesto semanal total</p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demanda Bruta Total</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalKilosGeneral.toFixed(1)} <span className="text-sm font-semibold text-slate-500">kg</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Peso bruto total a adquirir</p>
          </div>
          <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beneficiarios Atendidos</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalBeneficiariosActivos} <span className="text-sm font-semibold text-slate-500">niños/as</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {modoVista === 'global' ? `Suma de ${hogares.length} UDS` : udsSeleccionada?.madre_comunitaria}
            </p>
          </div>
          <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Días y Raciones</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {diasHabilesActivosCount} <span className="text-sm font-semibold text-slate-500">días activos</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalBeneficiariosActivos * diasHabilesActivosCount} raciones semanales
            </p>
          </div>
          <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 5. TABLA DETALLADA DE VÍVERES Y EMPAQUES A ADQUIRIR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Barra de Búsqueda y Filtro por Grupo */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por alimento o código TCAC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedGrupoFiltro}
              onChange={(e) => setSelectedGrupoFiltro(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="TODOS">Todos los Grupos de Alimentos ({listaGruposAlimentos.length})</option>
              {listaGruposAlimentos.map((grupo) => (
                <option key={grupo} value={grupo}>
                  {grupo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3 text-center">Cód. TCAC</th>
                <th className="p-3">Alimento / Insumo</th>
                <th className="p-3">Grupo de Alimento</th>
                <th className="p-3 text-right">Bruto/Niño (g)</th>
                <th className="p-3 text-right font-black text-slate-900">Demanda Total (kg)</th>
                <th className="p-3 text-center">Presentación Comercial</th>
                <th className="p-3 text-center bg-emerald-100/70 text-emerald-950 font-black">
                  Empaques a Adquirir ⌈...⌉
                </th>
                <th className="p-3 text-right">Costo Unit.</th>
                <th className="p-3 text-right font-black text-emerald-900">Subtotal ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    <p className="font-semibold">No hay insumos registrados para los días activos seleccionados.</p>
                    <p className="text-[11px] mt-1">Verifica que los menús tengan ingredientes cargados en la pestaña "Gestión de Minutas".</p>
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => (
                  <tr key={item.alimentoId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center">
                      <span className="font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {item.codigo_icbf}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{item.nombre}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1 truncate max-w-xs block" title={item.preparacionesUsadas.join(', ')}>
                        {item.preparacionesUsadas.join(', ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.grupo_alimento}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-600">
                      {item.pesoBrutoPorNinoSemana.toFixed(1)}g
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {item.totalBrutoKilos.toFixed(2)} kg
                    </td>
                    <td className="p-3 text-center text-slate-600">
                      {item.presentacion_comercial_gramos}g ({item.tipo_empaque})
                    </td>
                    <td className="p-3 text-center bg-emerald-50/60 font-black text-sm text-emerald-900">
                      {item.unidadesComerciales}{' '}
                      <span className="text-[10px] font-normal text-emerald-700">{item.tipo_empaque}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      ${item.costo_unidad_compra.toLocaleString('es-CO')}
                    </td>
                    <td className="p-3 text-right font-bold font-mono text-emerald-800">
                      ${item.costoSubtotal.toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {itemsFiltrados.length > 0 && (
              <tfoot className="bg-slate-100 font-extrabold text-xs text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="p-3 text-right uppercase">
                    TOTALES CONSOLIDADOS:
                  </td>
                  <td className="p-3 text-right text-slate-900">
                    {totalKilosGeneral.toFixed(2)} kg
                  </td>
                  <td colSpan={3} className="p-3 text-center text-slate-500">
                    {proyeccionCompras.length} alimentos calculados
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-900 text-sm">
                    ${totalCostoGeneral.toLocaleString('es-CO')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Nota Normativa ICBF */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            <strong>Criterio Técnico ICBF:</strong> Los empaques a adquirir se calculan aplicando la función techo matemática{' '}
            <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">⌈Demanda Total / Presentación Comercial⌉</code>,
            garantizando que ninguna Unidad de Servicio quede desabastecida por fracciones no comerciales de producto. Los días marcados como{' '}
            <span className="font-semibold text-rose-700">Anulado (Festivos)</span> quedan completamente excluidos de la orden de compra semanal.
          </p>
        </div>
      </div>
    </div>
  );
}
