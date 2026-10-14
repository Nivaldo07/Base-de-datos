'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  BookOpen,
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Search,
  Building,
  RefreshCw,
  Info,
  FileText,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import {
  generarPDFMinutaPatron,
  generarPDFListaCompras,
  generarPDFPlanillaEntrega,
} from '@/lib/pdfGenerator';
import MinutasTab from '@/components/MinutasTab';
import HogaresTab from '@/components/HogaresTab';
import ComprasTab from '@/components/ComprasTab';
import type { AlimentoTCAC, MetaRIEN } from '@prisma/client';

interface MinutaItem {
  alimentoId: number;
  gramosNetos: number;
}

interface CurrentUser {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  unidad_id?: number | null;
  unidad?: {
    id: number;
    nombre: string;
    codigo_uds: string | null;
  } | null;
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'designer' | 'tcac' | 'compras' | 'reportes' | 'ciclo_menus' | 'hogares'>('designer');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // State
  const [tcacDatabase, setTcacDatabase] = useState<AlimentoTCAC[]>([]);
  const [metasRien, setMetasRien] = useState<MetaRIEN[]>([]);
  const [selectedMetaId, setSelectedMetaId] = useState<number | null>(null);
  const [minutaNombre, setMinutaNombre] = useState('Minuta Ejemplo - Lactante FAMI');
  const [modalidad, setModalidad] = useState('FAMI');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Error en logout:', e);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  // Minuta ingredients state
  const [itemsMinuta, setItemsMinuta] = useState<MinutaItem[]>([
    { alimentoId: 1, gramosNetos: 60 },
    { alimentoId: 2, gramosNetos: 15 },
    { alimentoId: 3, gramosNetos: 30 },
  ]);

  const [selectedFoodId, setSelectedFoodId] = useState<number>(1);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');

  // Logistics state
  const [numNinos, setNumNinos] = useState<number>(25);
  const [numDias, setNumDias] = useState<number>(20);

  // TCAC catalog tab state
  const [tcacSearch, setTcacSearch] = useState('');
  const [tcacGrupoFilter, setTcacGrupoFilter] = useState('');
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);

  // New food form state
  const [newFoodForm, setNewFoodForm] = useState({
    codigo_icbf: '',
    nombre: '',
    grupo_alimento: 'Verduras y Hortalizas',
    porcentaje_comestible: 100,
    energia_kcal: 0,
    proteina_g: 0,
    grasa_g: 0,
    carbohidratos_g: 0,
    hierro_mg: 0,
    calcio_mg: 0,
    zinc_mg: 0,
    vitamina_a_rae: 0,
    presentacion_comercial_gramos: 1000,
    tipo_empaque: 'kg',
  });

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resTcac, resRien, resMe] = await Promise.all([
          fetch('/api/tcac'),
          fetch('/api/rien'),
          fetch('/api/auth/me'),
        ]);

        const tcacData = await resTcac.json();
        const rienData = await resRien.json();
        if (resMe.ok) {
          const meData = await resMe.json();
          if (meData.authenticated && meData.user) {
            setCurrentUser(meData.user);
          }
        }

        setTcacDatabase(tcacData);
        setMetasRien(rienData);

        if (rienData.length > 0) {
          setSelectedMetaId(rienData[0].id);
        }
        if (tcacData.length > 0) {
          setSelectedFoodId(tcacData[0].id);
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const selectedMeta = metasRien.find((m) => m.id === selectedMetaId) || metasRien[0];

  // Calculated Minuta metrics
  const calculatedItems = itemsMinuta.map((item) => {
    const alim = tcacDatabase.find((a) => a.id === item.alimentoId);
    if (!alim) return null;

    const pesoBruto = Math.round((item.gramosNetos / alim.porcentaje_comestible) * 100);
    const factorDesecho = (100 - alim.porcentaje_comestible).toFixed(0);

    const factor = item.gramosNetos / 100;
    const kcal = alim.energia_kcal * factor;
    const proteina = alim.proteina_g * factor;
    const hierro = alim.hierro_mg * factor;
    const vitaminaA = alim.vitamina_a_rae * factor;

    return {
      ...item,
      alim,
      pesoBruto,
      factorDesecho,
      kcal,
      proteina,
      hierro,
      vitaminaA,
    };
  }).filter(Boolean) as {
    alim: AlimentoTCAC;
    gramosNetos: number;
    pesoBruto: number;
    factorDesecho: string;
    kcal: number;
    proteina: number;
    hierro: number;
    vitaminaA: number;
  }[];

  // Totals
  const totKcal = calculatedItems.reduce((acc, curr) => acc + (curr?.kcal || 0), 0);
  const totProteina = calculatedItems.reduce((acc, curr) => acc + (curr?.proteina || 0), 0);
  const totHierro = calculatedItems.reduce((acc, curr) => acc + (curr?.hierro || 0), 0);
  const totVitaminaA = calculatedItems.reduce((acc, curr) => acc + (curr?.vitaminaA || 0), 0);

  // Filtered ingredients for selector dropdown (by Code or Name)
  const filteredFoodsForSelection = tcacDatabase.filter((a) => {
    if (!ingredientSearchQuery.trim()) return true;
    const q = ingredientSearchQuery.toLowerCase().trim();
    const matchesCode = a.codigo_icbf ? a.codigo_icbf.toLowerCase().includes(q) : false;
    const matchesName = a.nombre.toLowerCase().includes(q);
    const matchesGrupo = a.grupo_alimento.toLowerCase().includes(q);
    return matchesCode || matchesName || matchesGrupo;
  });

  // Adequacy evaluation (% Adecuación ICBF)
  const calculateAdequacy = (actual: number, meta: number) => {
    if (!meta || meta === 0) return { pct: 0, status: 'warn', label: 'Sin Meta', textClass: 'text-amber-600', bgClass: 'bg-amber-100', barClass: 'bg-amber-500' };
    const pct = Math.round((actual / meta) * 100);
    if (pct >= 90 && pct <= 110) {
      return { pct, status: 'ok', label: 'Adecuado (Verde)', textClass: 'text-emerald-700', bgClass: 'bg-emerald-100', barClass: 'bg-emerald-500' };
    } else if (pct < 90) {
      return { pct, status: 'warn', label: 'Déficit (Amarillo)', textClass: 'text-amber-700', bgClass: 'bg-amber-100', barClass: 'bg-amber-500' };
    } else {
      return { pct, status: 'danger', label: 'Exceso (Rojo)', textClass: 'text-red-700', bgClass: 'bg-red-100', barClass: 'bg-red-500' };
    }
  };

  const adecKcal = calculateAdequacy(totKcal, selectedMeta?.kcal_meta || 110);
  const adecProt = calculateAdequacy(totProteina, selectedMeta?.proteina_meta || 3.5);
  const adecFe = calculateAdequacy(totHierro, selectedMeta?.hierro_meta || 1.2);
  const adecVitA = calculateAdequacy(totVitaminaA, selectedMeta?.vitamina_a_meta || 150);

  // Add food item to minuta
  const handleAddIngredient = () => {
    if (filteredFoodsForSelection.length === 0) return;
    const validId = filteredFoodsForSelection.some((a) => a.id === selectedFoodId)
      ? selectedFoodId
      : filteredFoodsForSelection[0].id;
    setItemsMinuta([...itemsMinuta, { alimentoId: validId, gramosNetos: 30 }]);
  };

  // Remove food item from minuta
  const handleRemoveIngredient = (index: number) => {
    setItemsMinuta(itemsMinuta.filter((_, i) => i !== index));
  };

  // Update net weight
  const handleUpdateGramos = (index: number, val: number) => {
    const next = [...itemsMinuta];
    next[index].gramosNetos = Math.max(1, val || 0);
    setItemsMinuta(next);
  };

  // PDF Export Handlers
  const handleExportPDFMinuta = () => {
    if (!selectedMeta) return;
    generarPDFMinutaPatron(
      minutaNombre,
      modalidad,
      selectedMeta,
      calculatedItems,
      { kcal: totKcal, proteina: totProteina, hierro: totHierro, vitaminaA: totVitaminaA },
      { kcal: adecKcal, proteina: adecProt, hierro: adecFe, vitaminaA: adecVitA }
    );
  };

  const handleExportPDFCompras = () => {
    generarPDFListaCompras(minutaNombre, numNinos, numDias, calculatedItems);
  };

  const handleExportPDFPlanilla = () => {
    generarPDFPlanillaEntrega(minutaNombre, modalidad, numNinos);
  };

  // Save Minuta to DB
  const handleSaveMinuta = async () => {
    try {
      setSaveStatus('Guardando...');
      const res = await fetch('/api/minutas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: minutaNombre,
          meta_rien_id: selectedMetaId,
          modalidad,
          detalles: itemsMinuta.map((i) => ({
            alimento_id: i.alimentoId,
            gramaje_neto: i.gramosNetos,
          })),
        }),
      });

      if (res.ok) {
        setSaveStatus('¡Minuta guardada exitosamente!');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('Error al guardar.');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('Error de conexión.');
    }
  };

  // Create new TCAC food
  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tcac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFoodForm),
      });

      if (res.ok) {
        const created = await res.json();
        setTcacDatabase([...tcacDatabase, created]);
        setShowAddFoodModal(false);
        setNewFoodForm({
          codigo_icbf: '',
          nombre: '',
          grupo_alimento: 'Verduras y Hortalizas',
          porcentaje_comestible: 100,
          energia_kcal: 0,
          proteina_g: 0,
          grasa_g: 0,
          carbohidratos_g: 0,
          hierro_mg: 0,
          calcio_mg: 0,
          zinc_mg: 0,
          vitamina_a_rae: 0,
          presentacion_comercial_gramos: 1000,
          tipo_empaque: 'kg',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered TCAC catalog
  const filteredTcac = tcacDatabase.filter((a) => {
    const matchesSearch = a.nombre.toLowerCase().includes(tcacSearch.toLowerCase()) ||
      (a.codigo_icbf && a.codigo_icbf.toLowerCase().includes(tcacSearch.toLowerCase()));
    const matchesGrupo = tcacGrupoFilter ? a.grupo_alimento === tcacGrupoFilter : true;
    return matchesSearch && matchesGrupo;
  });

  const gruposAlimentosUnicos = Array.from(new Set(tcacDatabase.map((a) => a.grupo_alimento)));

  const navItems = [
    { id: 'designer' as const, label: 'Diseñador y Semáforo', icon: Utensils, badge: 'RIEN' },
    { id: 'tcac' as const, label: 'Catálogo TCAC', icon: BookOpen, badge: tcacDatabase.length.toString() },
    { id: 'ciclo_menus' as const, label: 'Ciclo de Menús', icon: FileSpreadsheet, badge: '25 días' },
    { id: 'hogares' as const, label: 'Hogares HCB & Niños', icon: Building },
    { id: 'compras' as const, label: 'Proyección de Compras', icon: ShoppingBag },
    { id: 'reportes' as const, label: 'Reportes PDF & Firmas', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      {/* SIDEBAR LATERAL IZQUIERDO */}
      <aside
        className={`bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-all duration-300 z-30 shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-900/30 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <h1 className="font-extrabold text-base text-white tracking-tight leading-none">NutriICBF</h1>
                <span className="text-[10px] text-emerald-400 font-medium">Plataforma Nutricional</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title={isSidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!isSidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 ${
                          isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout en Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70">
          {!isSidebarCollapsed ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate" title={currentUser?.nombre || 'Usuario ICBF'}>
                    {currentUser?.nombre || 'Usuario ICBF'}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {currentUser?.rol || 'NUTRICIONISTA'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>

              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 truncate">
                Modalidades ICBF • 2026
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs"
                title={`${currentUser?.nombre || 'Usuario'} (${currentUser?.rol || 'NUTRICIONISTA'})`}
              >
                {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar Superior Ligera */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h2>
            <p className="text-[11px] text-slate-500">ICBF • Automatización de Minutas, TCAC, Compras y Hogares</p>
          </div>
          <div className="flex items-center gap-2.5">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-800">{currentUser.nombre}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  {currentUser.rol}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              ICBF Oficial
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-sm font-medium">Cargando base de datos bromatológica y metas RIEN...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DESIGNER & TRAFFIC LIGHT */}
            {activeTab === 'designer' && (
              <div className="space-y-6">
                {/* Configuration Banner */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Nombre de la Minuta Patrón
                    </label>
                    <input
                      type="text"
                      value={minutaNombre}
                      onChange={(e) => setMinutaNombre(e.target.value)}
                      className="w-full text-lg font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Modalidad ICBF
                      </label>
                      <select
                        value={modalidad}
                        onChange={(e) => setModalidad(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="FAMI">FAMI (Familia, Mujer e Infancia)</option>
                        <option value="CDI">CDI (Centro de Desarrollo Infantil)</option>
                        <option value="RPP">RPP (Ración para Preparar)</option>
                        <option value="Comunitario">Comunitario HCB</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Grupo Poblacional & Meta RIEN
                      </label>
                      <select
                        value={selectedMetaId || ''}
                        onChange={(e) => setSelectedMetaId(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                      >
                        {metasRien.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.grupo_poblacional} — {m.tiempo_comida}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleSaveMinuta}
                      className="mt-5 flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>

                    <button
                      onClick={handleExportPDFMinuta}
                      className="mt-5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF Interventoría
                    </button>
                  </div>
                </div>

                {saveStatus && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {saveStatus}
                  </div>
                )}

                {/* Grid layout: Left Form & Table, Right Traffic Light */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (2 cols): Ingredients Table */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-emerald-600" />
                        Ingredientes de la Preparación
                      </h3>
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                        {itemsMinuta.length} ingredientes en la minuta
                      </span>
                    </div>

                    {/* Search & Select Ingredient Controls */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        <span>Buscar y Agregar Ingrediente TCAC</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {filteredFoodsForSelection.length} resultados disponibles
                        </span>
                      </div>

                      {/* Live Code / Text Search Bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="🔍 Filtrar ingrediente por código TCAC (ej: B005, A010, R004) o nombre..."
                          value={ingredientSearchQuery}
                          onChange={(e) => setIngredientSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        {ingredientSearchQuery && (
                          <button
                            onClick={() => setIngredientSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Select Dropdown + FIXED Add Button */}
                      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        <select
                          value={selectedFoodId}
                          onChange={(e) => setSelectedFoodId(Number(e.target.value))}
                          className="flex-1 min-w-0 max-w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 truncate"
                        >
                          {filteredFoodsForSelection.length === 0 ? (
                            <option value="">No hay alimentos con el código o nombre "{ingredientSearchQuery}"</option>
                          ) : (
                            filteredFoodsForSelection.map((a) => (
                              <option key={a.id} value={a.id}>
                                [{a.codigo_icbf || `#${a.id}`}] {a.nombre} — ({a.grupo_alimento}) — {a.porcentaje_comestible}% Comestible
                              </option>
                            ))
                          )}
                        </select>

                        <button
                          onClick={handleAddIngredient}
                          disabled={filteredFoodsForSelection.length === 0}
                          className="shrink-0 flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>
                    </div>

                    {/* Ingredients Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-center">Código</th>
                            <th className="p-3">Alimento (TCAC)</th>
                            <th className="p-3">Gramos Netos</th>
                            <th className="p-3 text-center">% Comestible</th>
                            <th className="p-3 text-center">Peso Bruto</th>
                            <th className="p-3 text-right">Kcal</th>
                            <th className="p-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {calculatedItems.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                                No se han agregado ingredientes a la minuta.
                              </td>
                            </tr>
                          ) : (
                            calculatedItems.map((item, index) => item && (
                              <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 text-center">
                                  <span className="inline-block px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 rounded border border-emerald-200">
                                    {item.alim.codigo_icbf || `#${item.alim.id}`}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-800">
                                  {item.alim.nombre}
                                  <span className="block text-[11px] text-slate-400 font-normal">
                                    {item.alim.grupo_alimento}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.gramosNetos}
                                      onChange={(e) => handleUpdateGramos(index, parseFloat(e.target.value))}
                                      className="w-20 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <span className="text-xs text-slate-500">g</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center font-semibold text-slate-600">
                                  {item.alim.porcentaje_comestible}%
                                </td>
                                <td className="p-3 text-center font-bold text-slate-900 bg-amber-50/50 rounded">
                                  {item.pesoBruto} g
                                  <span className="block text-[10px] text-amber-700 font-normal">
                                    (+{item.factorDesecho}% desecho)
                                  </span>
                                </td>
                                <td className="p-3 text-right font-medium text-slate-700">
                                  {item.kcal.toFixed(1)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleRemoveIngredient(index)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar ingrediente"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Semáforo ICBF (Nutritional Adequacy) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col">
                    <div className="pb-3 border-b border-slate-100">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        Semáforo de Adecuación ICBF
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Rango normativo óptimo: <strong className="text-emerald-700">90% a 110%</strong> de la meta RIEN.
                      </p>
                    </div>

                    <div className="space-y-4 flex-1">
                      {/* Metric 1: Calorías */}
                      <NutrientProgressCard
                        label="Energía (Kcal)"
                        actual={totKcal.toFixed(1)}
                        meta={selectedMeta?.kcal_meta || 110}
                        unit="kcal"
                        adequacy={adecKcal}
                      />

                      {/* Metric 2: Proteína */}
                      <NutrientProgressCard
                        label="Proteína (g)"
                        actual={totProteina.toFixed(1)}
                        meta={selectedMeta?.proteina_meta || 3.5}
                        unit="g"
                        adequacy={adecProt}
                      />

                      {/* Metric 3: Hierro */}
                      <NutrientProgressCard
                        label="Hierro (mg)"
                        actual={totHierro.toFixed(2)}
                        meta={selectedMeta?.hierro_meta || 1.2}
                        unit="mg"
                        adequacy={adecFe}
                      />

                      {/* Metric 4: Vitamina A */}
                      <NutrientProgressCard
                        label="Vitamina A (µg RAE)"
                        actual={totVitaminaA.toFixed(1)}
                        meta={selectedMeta?.vitamina_a_meta || 150}
                        unit="µg"
                        adequacy={adecVitA}
                      />
                    </div>

                    {/* Operational compliance summary */}
                    <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl space-y-3">
                      <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                        Dictamen de Interventoría
                      </div>
                      {[adecKcal, adecProt, adecFe, adecVitA].every((a) => a.status === 'ok') ? (
                        <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold bg-emerald-100 p-2.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>¡Cumplimiento normativo 100%! La minuta cumple entre 90% y 110% en todos los nutrientes.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-800 text-xs font-medium bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Ajustar gramos netos: Existen nutrientes en Déficit (&lt;90%) o Exceso (&gt;110%).</span>
                        </div>
                      )}

                      <button
                        onClick={handleExportPDFMinuta}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                        Generar PDF Oficial para Interventoría
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CATÁLOGO TCAC */}
            {activeTab === 'tcac' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Tabla de Composición de Alimentos Colombianos (TCAC)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Catálogo oficial de valores bromatológicos y factores de desecho por cada 100g de porción comestible limpia.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddFoodModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow"
                  >
                    <Plus className="w-4 h-4" />
                    Registrar Nuevo Alimento TCAC
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o código ICBF (ej: B005, A009)..."
                      value={tcacSearch}
                      onChange={(e) => setTcacSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={tcacGrupoFilter}
                    onChange={(e) => setTcacGrupoFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Todos los grupos de alimentos</option>
                    {gruposAlimentosUnicos.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TCAC Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Nombre del Alimento</th>
                        <th className="p-3">Grupo</th>
                        <th className="p-3 text-center">% Comestible</th>
                        <th className="p-3 text-right">Kcal (100g)</th>
                        <th className="p-3 text-right">Proteína (g)</th>
                        <th className="p-3 text-right">Hierro (mg)</th>
                        <th className="p-3 text-right">Vit A (µg)</th>
                        <th className="p-3">Empaque Comercial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTcac.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                            No se encontraron alimentos en la TCAC.
                          </td>
                        </tr>
                      ) : (
                        filteredTcac.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <span className="inline-block px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 rounded border border-emerald-200">
                                {item.codigo_icbf || `#${item.id}`}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{item.nombre}</td>
                            <td className="p-3 text-xs text-slate-600">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                {item.grupo_alimento}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                              {item.porcentaje_comestible}%
                            </td>
                            <td className="p-3 text-right font-medium">{item.energia_kcal}</td>
                            <td className="p-3 text-right">{item.proteina_g}</td>
                            <td className="p-3 text-right">{item.hierro_mg}</td>
                            <td className="p-3 text-right">{item.vitamina_a_rae}</td>
                            <td className="p-3 text-xs text-slate-600">
                              {item.presentacion_comercial_gramos}g ({item.tipo_empaque})
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PROYECCIÓN LOGÍSTICA DE COMPRAS */}
            {activeTab === 'compras' && <ComprasTab />}

            {/* TAB 4: REPORTES PDF & AUDITORÍA */}
            {activeTab === 'reportes' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-600" />
                    Módulo de Generación de Documentos y Reportes PDF Oficiales ICBF
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Generación inmediata de documentos listos para impresión, auditorías de interventoría, listas de compras a proveedores y planillas de firmas de acudientes.
                  </p>
                </div>

                {/* Grid 3 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Minuta Patrón */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4 hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg w-fit">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-800">1. Formato Minuta Patrón e Interventoría</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Documento oficial con encabezado institucional ICBF, evaluación de semáforo RIEN (90%-110%), tabla bromatológica por ingrediente y <strong>bloque de 3 firmas profesionales</strong> (Nutricionista, EAS y Supervisor ICBF).
                      </p>
                    </div>
                    <button
                      onClick={handleExportPDFMinuta}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Minuta Patrón PDF
                    </button>
                  </div>

                  {/* Card 2: Lista de Compras */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4 hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="p-2.5 bg-slate-200 text-slate-800 rounded-lg w-fit">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-800">2. Orden de Compra para Proveedores</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Consolidado mensual de compras proyectado según censo de beneficiarios ({numNinos}) y días hábiles ({numDias}), con cálculo de empaques comerciales redondeados hacia arriba ($\lceil \dots \rceil$).
                      </p>
                    </div>
                    <button
                      onClick={handleExportPDFCompras}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Orden de Compra PDF
                    </button>
                  </div>

                  {/* Card 3: Planilla de Entrega */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4 hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg w-fit">
                        <Printer className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base text-slate-800">3. Planilla de Entrega de Raciones</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Formato impreso horizontal para control físico de entrega de minutas y raciones con celdas para nombre del beneficiario, documento ID, fecha y <strong>espacio amplio para firmas/huella del acudiente</strong>.
                      </p>
                    </div>
                    <button
                      onClick={handleExportPDFPlanilla}
                      className="w-full flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Planilla de Firmas PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CICLO DE MENUS */}
            {activeTab === 'ciclo_menus' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                    Gestión del Ciclo de Menús
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Administra los menús diarios y sus preparaciones por grupo poblacional, editando gramajes netos y brutos.
                  </p>
                </div>
                <MinutasTab tcacDatabase={tcacDatabase} />
              </div>
            )}

            {/* TAB 6: HOGARES HCB & NIÑOS */}
            {activeTab === 'hogares' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Building className="w-6 h-6 text-emerald-600" />
                    Hogares Comunitarios de Bienestar (HCB) y Niños Beneficiarios
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Administra las Unidades de Servicio (UDS), Madres Comunitarias, listados de niños vinculados y carnets digitales de nutrición con cálculo dinámico de edad.
                  </p>
                </div>
                <HogaresTab />
              </div>
            )}
          </>
        )}
      </main>
    </div>

    {/* Modal: Register New Food */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Registrar Alimento en Catálogo TCAC</h3>
              <button
                onClick={() => setShowAddFoodModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFood} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Código ICBF</label>
                  <input
                    type="text"
                    placeholder="Ej: AL-011"
                    value={newFoodForm.codigo_icbf}
                    onChange={(e) => setNewFoodForm({ ...newFoodForm, codigo_icbf: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del Alimento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Espinaca cruda"
                    value={newFoodForm.nombre}
                    onChange={(e) => setNewFoodForm({ ...newFoodForm, nombre: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Grupo de Alimentos</label>
                  <select
                    value={newFoodForm.grupo_alimento}
                    onChange={(e) => setNewFoodForm({ ...newFoodForm, grupo_alimento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  >
                    <option value="Verduras y Hortalizas">Verduras y Hortalizas</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Cereales y Raíces">Cereales y Raíces</option>
                    <option value="Carnes y Aves">Carnes y Aves</option>
                    <option value="Huevos y Derivados">Huevos y Derivados</option>
                    <option value="Leguminosas">Leguminosas</option>
                    <option value="Lácteos y Derivados">Lácteos y Derivados</option>
                    <option value="Grasas y Aceites">Grasas y Aceites</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">% Comestible limpia *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={newFoodForm.porcentaje_comestible}
                    onChange={(e) => setNewFoodForm({ ...newFoodForm, porcentaje_comestible: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Composición Bromatológica (por 100g comestible):</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block mb-1">Energía (Kcal)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFoodForm.energia_kcal}
                      onChange={(e) => setNewFoodForm({ ...newFoodForm, energia_kcal: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Proteína (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFoodForm.proteina_g}
                      onChange={(e) => setNewFoodForm({ ...newFoodForm, proteina_g: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Hierro (mg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFoodForm.hierro_mg}
                      onChange={(e) => setNewFoodForm({ ...newFoodForm, hierro_mg: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gramaje Empaque Comercial (g)</label>
                  <input
                    type="number"
                    value={newFoodForm.presentacion_comercial_gramos}
                    onChange={(e) => setNewFoodForm({ ...newFoodForm, presentacion_comercial_gramos: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Empaque</label>
                  <input
                    type="text"
                    placeholder="Ej: bolsa 500g, kg, cubeta 30u"
                    value={newFoodForm.tipo_empaque}
                    onChange={(e) => setNewFoodForm({ ...newFoodForm, tipo_empaque: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFoodModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow"
                >
                  Guardar Alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for Nutrient Progress Card
function NutrientProgressCard({
  label,
  actual,
  meta,
  unit,
  adequacy,
}: {
  label: string;
  actual: string;
  meta: number;
  unit: string;
  adequacy: { pct: number; status: string; label: string; textClass: string; bgClass: string; barClass: string };
}) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${adequacy.bgClass} ${adequacy.textClass}`}>
          {adequacy.pct}% ({adequacy.label.split(' ')[0]})
        </span>
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>Aporte obtenido: <strong className="text-slate-800">{actual} {unit}</strong></span>
        <span>Meta RIEN: <strong>{meta} {unit}</strong></span>
      </div>

      {/* Progress bar background */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${adequacy.barClass}`}
          style={{ width: `${Math.min(adequacy.pct, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}
