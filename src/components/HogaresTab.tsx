'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Calendar,
  FileBadge,
  Trash2,
  Heart,
  ShieldAlert,
  UserPlus,
  Home,
  CheckCircle,
  X,
  FileText,
  Sparkles,
  Pencil,
  Baby,
  Smile,
} from 'lucide-react';
import { calcularEdadICBF } from '@/lib/ageCalculator';
import CarnetNino from './CarnetNino';

export default function HogaresTab() {
  const [hogares, setHogares] = useState<any[]>([]);
  const [selectedHogarId, setSelectedHogarId] = useState<number | null>(null);
  const [ninos, setNinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchHogar, setSearchHogar] = useState('');
  const [searchNino, setSearchNino] = useState('');

  // Modales
  const [showHogarModal, setShowHogarModal] = useState(false);
  const [showNinoModal, setShowNinoModal] = useState(false);
  const [selectedNinoForCarnet, setSelectedNinoForCarnet] = useState<any | null>(null);

  // Formulario Hogar
  const [hogarForm, setHogarForm] = useState({
    nombre: '',
    madre_comunitaria: '',
    telefono: '',
    direccion: '',
    barrio: '',
    codigo_uds: '',
    cupo_aprobado: 14,
  });

  // Formulario Niño
  const [ninoForm, setNinoForm] = useState({
    nombre_completo: '',
    tipo_documento: 'RC',
    numero_documento: '',
    fecha_nacimiento: '',
    genero: 'M',
    acudiente: '',
    contacto_acudiente: '',
    parentesco: 'Madre',
    eps: '',
    rh: 'O+',
    alergias: '',
  });

  // Modales y formularios de edición
  const [showEditHogarModal, setShowEditHogarModal] = useState(false);
  const [editingHogarForm, setEditingHogarForm] = useState<any>({
    id: null,
    nombre: '',
    madre_comunitaria: '',
    telefono: '',
    direccion: '',
    barrio: '',
    codigo_uds: '',
    cupo_aprobado: 14,
  });

  const [showEditNinoModal, setShowEditNinoModal] = useState(false);
  const [editingNinoForm, setEditingNinoForm] = useState<any>({
    id: null,
    nombre_completo: '',
    tipo_documento: 'RC',
    numero_documento: '',
    fecha_nacimiento: '',
    genero: 'M',
    acudiente: '',
    contacto_acudiente: '',
    parentesco: 'Madre',
    eps: '',
    rh: 'O+',
    alergias: '',
  });

  // Cargar Hogares
  const fetchHogares = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hogares');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHogares(data);
        if (data.length > 0 && !selectedHogarId) {
          setSelectedHogarId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching hogares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHogares();
  }, []);

  // Cargar Niños del Hogar Seleccionado
  const fetchNinos = async (hogarId: number) => {
    try {
      const res = await fetch(`/api/ninos?unidad_id=${hogarId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNinos(data);
      }
    } catch (err) {
      console.error('Error fetching ninos:', err);
    }
  };

  useEffect(() => {
    if (selectedHogarId) {
      fetchNinos(selectedHogarId);
    } else {
      setNinos([]);
    }
  }, [selectedHogarId]);

  // Guardar nuevo Hogar
  const handleCreateHogar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hogares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hogarForm),
      });
      if (res.ok) {
        const created = await res.json();
        setHogares((prev) => [...prev, { ...created, _count: { beneficiarios: 0 } }]);
        setSelectedHogarId(created.id);
        setShowHogarModal(false);
        setHogarForm({
          nombre: '',
          madre_comunitaria: '',
          telefono: '',
          direccion: '',
          barrio: '',
          codigo_uds: '',
          cupo_aprobado: 14,
        });
      } else {
        alert('Error al registrar el Hogar HCB');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar el Hogar');
    }
  };

  // Guardar nuevo Niño
  const handleCreateNino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHogarId) return;

    try {
      const res = await fetch('/api/ninos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ninoForm, unidad_id: selectedHogarId }),
      });
      if (res.ok) {
        const created = await res.json();
        setNinos((prev) => [...prev, created]);
        setShowNinoModal(false);
        fetchHogares(); // refrescar conteos de beneficiarios
        setNinoForm({
          nombre_completo: '',
          tipo_documento: 'RC',
          numero_documento: '',
          fecha_nacimiento: '',
          genero: 'M',
          acudiente: '',
          contacto_acudiente: '',
          parentesco: 'Madre',
          eps: '',
          rh: 'O+',
          alergias: '',
        });
      } else {
        alert('Error al registrar el niño/a');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al registrar el beneficiario');
    }
  };

  // Eliminar Niño
  const handleDeleteNino = async (ninoId: number, nombre: string) => {
    if (!window.confirm(`¿Confirmas el retiro del beneficiario ${nombre}?`)) return;
    try {
      const res = await fetch(`/api/ninos?id=${ninoId}`, { method: 'DELETE' });
      if (res.ok) {
        setNinos((prev) => prev.filter((n) => n.id !== ninoId));
        fetchHogares();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminar Hogar
  const handleDeleteHogar = async (hogarId: number, nombre: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el hogar "${nombre}" y todos sus beneficiarios vinculados?`)) return;
    try {
      const res = await fetch(`/api/hogares?id=${hogarId}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = hogares.filter((h) => h.id !== hogarId);
        setHogares(updated);
        if (selectedHogarId === hogarId) {
          setSelectedHogarId(updated.length > 0 ? updated[0].id : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Utilidad para formatear fechas a YYYY-MM-DD para <input type="date">
  const formatFechaParaInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().substring(0, 10);
    } catch {
      return '';
    }
  };

  // Abrir Modal de Edición de Hogar
  const handleOpenEditHogar = (hogar: any) => {
    setEditingHogarForm({
      id: hogar.id,
      nombre: hogar.nombre || '',
      madre_comunitaria: hogar.madre_comunitaria || '',
      telefono: hogar.telefono || '',
      direccion: hogar.direccion || '',
      barrio: hogar.barrio || '',
      codigo_uds: hogar.codigo_uds || '',
      cupo_aprobado: hogar.cupo_aprobado || 14,
    });
    setShowEditHogarModal(true);
  };

  // Guardar Cambios de Hogar
  const handleUpdateHogar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHogarForm.id) return;

    try {
      const res = await fetch('/api/hogares', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingHogarForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setHogares((prev) =>
          prev.map((h) => (h.id === updated.id ? { ...h, ...updated } : h))
        );
        setShowEditHogarModal(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al actualizar los datos de la UDS');
      }
    } catch (err) {
      console.error('Error actualizando hogar:', err);
      alert('Error de conexión al actualizar la UDS');
    }
  };

  // Abrir Modal de Edición de Niño
  const handleOpenEditNino = (nino: any) => {
    setEditingNinoForm({
      id: nino.id,
      nombre_completo: nino.nombre_completo || '',
      tipo_documento: nino.tipo_documento || 'RC',
      numero_documento: nino.numero_documento || '',
      fecha_nacimiento: formatFechaParaInput(nino.fecha_nacimiento),
      genero: nino.genero || 'M',
      acudiente: nino.acudiente || '',
      contacto_acudiente: nino.contacto_acudiente || '',
      parentesco: nino.parentesco || 'Madre',
      eps: nino.eps || '',
      rh: nino.rh || 'O+',
      alergias: nino.alergias || '',
      unidad_id: nino.unidad_id,
    });
    setShowEditNinoModal(true);
  };

  // Guardar Cambios de Niño
  const handleUpdateNino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNinoForm.id) return;

    try {
      const res = await fetch('/api/ninos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNinoForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setNinos((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n))
        );
        setShowEditNinoModal(false);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al actualizar los datos del beneficiario');
      }
    } catch (err) {
      console.error('Error actualizando niño:', err);
      alert('Error de conexión al actualizar el beneficiario');
    }
  };

  const selectedHogar = hogares.find((h) => h.id === selectedHogarId);

  // Filtros
  const filteredHogares = hogares.filter((h) =>
    (h.nombre || '').toLowerCase().includes(searchHogar.toLowerCase()) ||
    (h.madre_comunitaria || '').toLowerCase().includes(searchHogar.toLowerCase()) ||
    (h.codigo_uds || '').toLowerCase().includes(searchHogar.toLowerCase())
  );

  const filteredNinos = ninos.filter((n) =>
    (n.nombre_completo || '').toLowerCase().includes(searchNino.toLowerCase()) ||
    (n.numero_documento || '').includes(searchNino) ||
    (n.acudiente || '').toLowerCase().includes(searchNino.toLowerCase())
  );

  // Estadísticas globales (Todas las UDS)
  const statsGlobales = React.useMemo(() => {
    let totalNinos = 0;
    let menores3 = 0;
    let mayores3 = 0;

    for (const hogar of hogares) {
      const beneficiarios = hogar.beneficiarios || [];
      totalNinos += hogar._count?.beneficiarios || beneficiarios.length;
      for (const b of beneficiarios) {
        if (b.fecha_nacimiento) {
          const edad = calcularEdadICBF(b.fecha_nacimiento);
          if (edad.anios < 3) {
            menores3++;
          } else {
            mayores3++;
          }
        }
      }
    }

    return { totalNinos, menores3, mayores3 };
  }, [hogares]);

  // Estadísticas de la UDS Seleccionada
  const statsUdsActual = React.useMemo(() => {
    let menores3 = 0;
    let mayores3 = 0;
    for (const nino of ninos) {
      if (nino.fecha_nacimiento) {
        const edad = calcularEdadICBF(nino.fecha_nacimiento);
        if (edad.anios < 3) menores3++;
        else mayores3++;
      }
    }
    return {
      total: ninos.length,
      menores3,
      mayores3,
    };
  }, [ninos]);

  return (
    <div className="space-y-6">
      
      {/* 1. TARJETAS DE INDICADORES (KPIS) - TOTAL DE TODAS LAS UDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Hogares HCB (UDS)</span>
            <p className="text-lg font-black text-slate-800">{hogares.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Total Niños (Todas UDS)</span>
            <p className="text-lg font-black text-slate-800">{statsGlobales.totalNinos}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Menores de 3 Años (&lt; 3)</span>
            <p className="text-lg font-black text-sky-700">
              {statsGlobales.menores3}{' '}
              <span className="text-[10px] font-normal text-slate-400">
                ({statsGlobales.totalNinos > 0 ? Math.round((statsGlobales.menores3 / statsGlobales.totalNinos) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Mayores de 3 Años (&ge; 3)</span>
            <p className="text-lg font-black text-purple-700">
              {statsGlobales.mayores3}{' '}
              <span className="text-[10px] font-normal text-slate-400">
                ({statsGlobales.totalNinos > 0 ? Math.round((statsGlobales.mayores3 / statsGlobales.totalNinos) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Nuevo Registro</span>
            <p className="text-xs font-bold text-slate-700">Crear Hogar HCB</p>
          </div>
          <button
            onClick={() => setShowHogarModal(true)}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva UDS
          </button>
        </div>
      </div>

      {/* 2. LAYOUT MAESTRO-DETALLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: LISTADO DE HOGARES HCB */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              Unidades de Servicio (UDS)
            </h3>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-semibold">
              {filteredHogares.length}
            </span>
          </div>

          {/* Buscador de Hogares */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar Hogar, Madre o Código..."
              value={searchHogar}
              onChange={(e) => setSearchHogar(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Lista de Cards de Hogares */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredHogares.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No se encontraron Hogares HCB. Haz clic en "+ Nueva UDS" para registrar el primero.
              </div>
            ) : (
              filteredHogares.map((hogar) => {
                const isSelected = hogar.id === selectedHogarId;
                const count = hogar._count?.beneficiarios || 0;
                const cupo = hogar.cupo_aprobado || 14;

                const beneficiariosHogar = hogar.beneficiarios || [];
                let menores3Hogar = 0;
                let mayores3Hogar = 0;
                for (const b of beneficiariosHogar) {
                  if (b.fecha_nacimiento) {
                    const edad = calcularEdadICBF(b.fecha_nacimiento);
                    if (edad.anios < 3) menores3Hogar++;
                    else mayores3Hogar++;
                  }
                }

                return (
                  <div
                    key={hogar.id}
                    onClick={() => setSelectedHogarId(hogar.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{hogar.nombre}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Madre Com: <strong className="text-slate-700">{hogar.madre_comunitaria}</strong>
                        </p>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        count >= cupo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {count} / {cupo}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold" title="Menores de 3 años">
                        &lt; 3a: <strong>{menores3Hogar}</strong>
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold" title="Mayores de 3 años">
                        &ge; 3a: <strong>{mayores3Hogar}</strong>
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[170px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {hogar.direccion || 'Sin dirección'}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {hogar.telefono || 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: SUBGRUPO / GRILLA DE NIÑOS VINCULADOS */}
        <div className="lg:col-span-2 space-y-4">
          {selectedHogar ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              
              {/* Header del Hogar Seleccionado */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedHogar.nombre}</h3>
                    {selectedHogar.codigo_uds && (
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
                        {selectedHogar.codigo_uds}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Madre Comunitaria: <strong>{selectedHogar.madre_comunitaria}</strong> • Tel: {selectedHogar.telefono || 'Sin registrar'} • Dir: {selectedHogar.direccion || 'Sin registrar'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEditHogar(selectedHogar)}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-2xs"
                    title="Editar información de la UDS"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                    Editar UDS
                  </button>
                  <button
                    onClick={() => handleDeleteHogar(selectedHogar.id, selectedHogar.nombre)}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-600 px-2.5 py-1.5 text-xs font-semibold rounded hover:bg-rose-50 transition-colors"
                    title="Eliminar Hogar HCB"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar UDS
                  </button>
                  <button
                    onClick={() => setShowNinoModal(true)}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Vincular Niño/a
                  </button>
                </div>
              </div>

              {/* Resumen etario de la UDS Seleccionada */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
                    <Users className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total en esta UDS</span>
                    <strong className="text-sm font-black text-slate-900">{statsUdsActual.total} niños/as</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-sky-100 text-sky-800 rounded-lg shrink-0">
                    <Baby className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Menores de 3 Años (&lt; 3a)</span>
                    <strong className="text-sm font-black text-sky-700">
                      {statsUdsActual.menores3} niños/as{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({statsUdsActual.total > 0 ? Math.round((statsUdsActual.menores3 / statsUdsActual.total) * 100) : 0}%)
                      </span>
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-purple-100 text-purple-800 rounded-lg shrink-0">
                    <Smile className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Mayores de 3 Años (&ge; 3a)</span>
                    <strong className="text-sm font-black text-purple-700">
                      {statsUdsActual.mayores3} niños/as{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({statsUdsActual.total > 0 ? Math.round((statsUdsActual.mayores3 / statsUdsActual.total) * 100) : 0}%)
                      </span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Buscador de Niños */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre del niño, documento o acudiente..."
                  value={searchNino}
                  onChange={(e) => setSearchNino(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tabla de Niños */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Beneficiario / Documento</th>
                      <th className="p-3">Edad Dinámica</th>
                      <th className="p-3 text-center">Grupo Etario ICBF</th>
                      <th className="p-3">Acudiente & Contacto</th>
                      <th className="p-3 text-center">RH / EPS</th>
                      <th className="p-3 text-center">Alergias</th>
                      <th className="p-3 text-center">Carnet & Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNinos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                          No hay niños registrados en esta Unidad de Servicio. Haz clic en "Vincular Niño/a" para agregar el primero.
                        </td>
                      </tr>
                    ) : (
                      filteredNinos.map((nino) => {
                        const edad = calcularEdadICBF(nino.fecha_nacimiento);
                        const tieneAlergia = Boolean(nino.alergias && nino.alergias.trim() !== '' && nino.alergias.toLowerCase() !== 'ninguna');

                        return (
                          <tr key={nino.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{nino.nombre_completo}</span>
                              <span className="font-mono text-[11px] text-slate-500">
                                {nino.tipo_documento}: {nino.numero_documento} ({nino.genero === 'F' ? 'Niña' : 'Niño'})
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="font-black text-slate-800 block text-xs flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {edad.edadTexto}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Nac: {new Date(nino.fecha_nacimiento).toLocaleDateString()}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${edad.colorBadge.bg} ${edad.colorBadge.text} ${edad.colorBadge.border}`}>
                                {edad.grupoEtarioCorto}
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="font-medium text-slate-800 block">{nino.acudiente}</span>
                              <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {nino.contacto_acudiente}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                                {nino.rh || 'S/R'}
                              </span>
                              <span className="block text-[10px] text-slate-500 truncate max-w-[80px] mx-auto">
                                {nino.eps || 'S/E'}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              {tieneAlergia ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse" title={nino.alergias}>
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  Alerta
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Ninguna</span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedNinoForCarnet({ ...nino, unidad: selectedHogar })}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-bold transition-colors shadow-2xs"
                                  title="Abrir Carnet Digital Infantil"
                                >
                                  <FileBadge className="w-3.5 h-3.5" />
                                  Ver Carnet
                                </button>
                                <button
                                  onClick={() => handleOpenEditNino(nino)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                  title="Editar datos del niño/a"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNino(nino.id, nino.nombre_completo)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Retirar beneficiario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 space-y-3">
              <Building className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700">Selecciona o Registra una Unidad de Servicio (UDS)</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Para ver y gestionar los niños vinculados a un Hogar Comunitario de Bienestar, selecciona una UDS en el panel izquierdo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL REGISTRO DE NUEVA UDS / HOGAR HCB */}
      {showHogarModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                Registrar Nuevo Hogar Comunitario (UDS)
              </h3>
              <button onClick={() => setShowHogarModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHogar} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la UDS / Hogar *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: HCB Los Angelitos"
                  value={hogarForm.nombre}
                  onChange={(e) => setHogarForm({ ...hogarForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Madre Comunitaria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carmen Rosa Pérez"
                  value={hogarForm.madre_comunitaria}
                  onChange={(e) => setHogarForm({ ...hogarForm, madre_comunitaria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="Ej: 312 456 7890"
                    value={hogarForm.telefono}
                    onChange={(e) => setHogarForm({ ...hogarForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código UDS (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: UDS-05001-01"
                    value={hogarForm.codigo_uds}
                    onChange={(e) => setHogarForm({ ...hogarForm, codigo_uds: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección del Hogar</label>
                <input
                  type="text"
                  placeholder="Ej: Cra 45 # 12-34 Barrio El Jardín"
                  value={hogarForm.direccion}
                  onChange={(e) => setHogarForm({ ...hogarForm, direccion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barrio / Vereda</label>
                  <input
                    type="text"
                    placeholder="Ej: San Antonio"
                    value={hogarForm.barrio}
                    onChange={(e) => setHogarForm({ ...hogarForm, barrio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cupo Aprobado ICBF</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={hogarForm.cupo_aprobado}
                    onChange={(e) => setHogarForm({ ...hogarForm, cupo_aprobado: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHogarModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Guardar Hogar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL REGISTRO / VINCULACIÓN DE NIÑO */}
      {showNinoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Vincular Niño/a a {selectedHogar?.nombre}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  La edad se calculará automáticamente a partir de la fecha de nacimiento.
                </p>
              </div>
              <button onClick={() => setShowNinoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNino} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo del Niño/a *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mateo Gómez Ramírez"
                  value={ninoForm.nombre_completo}
                  onChange={(e) => setNinoForm({ ...ninoForm, nombre_completo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Doc. *</label>
                  <select
                    value={ninoForm.tipo_documento}
                    onChange={(e) => setNinoForm({ ...ninoForm, tipo_documento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="RC">RC (Registro Civil)</option>
                    <option value="TI">TI (Tarjeta Identidad)</option>
                    <option value="NUIP">NUIP</option>
                    <option value="PPT">PPT</option>
                    <option value="CE">CE (Cédula Extranjería)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Número de Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 1023456789"
                    value={ninoForm.numero_documento}
                    onChange={(e) => setNinoForm({ ...ninoForm, numero_documento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={ninoForm.fecha_nacimiento}
                    onChange={(e) => setNinoForm({ ...ninoForm, fecha_nacimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Género *</label>
                  <select
                    value={ninoForm.genero}
                    onChange={(e) => setNinoForm({ ...ninoForm, genero: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="M">Masculino 👦</option>
                    <option value="F">Femenino 👧</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre del Acudiente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Laura Ramírez Ospina"
                    value={ninoForm.acudiente}
                    onChange={(e) => setNinoForm({ ...ninoForm, acudiente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono Acudiente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 310 123 4567"
                    value={ninoForm.contacto_acudiente}
                    onChange={(e) => setNinoForm({ ...ninoForm, contacto_acudiente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parentesco</label>
                  <input
                    type="text"
                    placeholder="Ej: Madre"
                    value={ninoForm.parentesco}
                    onChange={(e) => setNinoForm({ ...ninoForm, parentesco: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RH</label>
                  <select
                    value={ninoForm.rh}
                    onChange={(e) => setNinoForm({ ...ninoForm, rh: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">EPS</label>
                  <input
                    type="text"
                    placeholder="Ej: Savia Salud"
                    value={ninoForm.eps}
                    onChange={(e) => setNinoForm({ ...ninoForm, eps: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1 text-rose-700">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Alergias Alimentarias o Restricciones (Crítico para Nutrición ICBF)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Alérgico al huevo, intolerancia a la lactosa, o 'Ninguna'"
                  value={ninoForm.alergias}
                  onChange={(e) => setNinoForm({ ...ninoForm, alergias: e.target.value })}
                  className="w-full px-3 py-2 border border-rose-300 bg-rose-50/40 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNinoModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Registrar Niño/a
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL EDICIÓN DE UDS / HOGAR HCB */}
      {showEditHogarModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                Editar Hogar Comunitario (UDS)
              </h3>
              <button onClick={() => setShowEditHogarModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateHogar} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la UDS / Hogar *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: HCB Los Angelitos"
                  value={editingHogarForm.nombre}
                  onChange={(e) => setEditingHogarForm({ ...editingHogarForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre de la Madre Comunitaria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carmen Rosa Pérez"
                  value={editingHogarForm.madre_comunitaria}
                  onChange={(e) => setEditingHogarForm({ ...editingHogarForm, madre_comunitaria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="Ej: 312 456 7890"
                    value={editingHogarForm.telefono}
                    onChange={(e) => setEditingHogarForm({ ...editingHogarForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código UDS</label>
                  <input
                    type="text"
                    placeholder="Ej: UDS-05001-01"
                    value={editingHogarForm.codigo_uds}
                    onChange={(e) => setEditingHogarForm({ ...editingHogarForm, codigo_uds: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección del Hogar</label>
                <input
                  type="text"
                  placeholder="Ej: Cra 45 # 12-34 Barrio El Jardín"
                  value={editingHogarForm.direccion}
                  onChange={(e) => setEditingHogarForm({ ...editingHogarForm, direccion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barrio / Vereda</label>
                  <input
                    type="text"
                    placeholder="Ej: San Antonio"
                    value={editingHogarForm.barrio}
                    onChange={(e) => setEditingHogarForm({ ...editingHogarForm, barrio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cupo Aprobado ICBF</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editingHogarForm.cupo_aprobado}
                    onChange={(e) => setEditingHogarForm({ ...editingHogarForm, cupo_aprobado: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditHogarModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL EDICIÓN DE NIÑO / BENEFICIARIO */}
      {showEditNinoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                Editar Información del Beneficiario
              </h3>
              <button onClick={() => setShowEditNinoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNino} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo del Niño/a *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Gómez Valencia"
                  value={editingNinoForm.nombre_completo}
                  onChange={(e) => setEditingNinoForm({ ...editingNinoForm, nombre_completo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo Doc *</label>
                  <select
                    value={editingNinoForm.tipo_documento}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, tipo_documento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="RC">Registro Civil (RC)</option>
                    <option value="TI">Tarjeta Identidad (TI)</option>
                    <option value="CE">Cédula Extranjería (CE)</option>
                    <option value="PEP">PEP / PPT</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Número de Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 1035678901"
                    value={editingNinoForm.numero_documento}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, numero_documento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={editingNinoForm.fecha_nacimiento}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, fecha_nacimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Género *</label>
                  <select
                    value={editingNinoForm.genero}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, genero: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="M">Masculino (Niño)</option>
                    <option value="F">Femenino (Niña)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nombre del Acudiente / Madre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Laura Ospina Gómez"
                    value={editingNinoForm.acudiente}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, acudiente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parentesco</label>
                  <input
                    type="text"
                    placeholder="Ej: Madre"
                    value={editingNinoForm.parentesco}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, parentesco: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tel. Acudiente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 300 123 4567"
                    value={editingNinoForm.contacto_acudiente}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, contacto_acudiente: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grupo RH</label>
                  <select
                    value={editingNinoForm.rh}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, rh: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">EPS</label>
                  <input
                    type="text"
                    placeholder="Ej: Savia Salud"
                    value={editingNinoForm.eps}
                    onChange={(e) => setEditingNinoForm({ ...editingNinoForm, eps: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1 text-rose-700">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Alergias Alimentarias o Restricciones (Crítico para Nutrición ICBF)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Alérgico al huevo, intolerancia a la lactosa, o 'Ninguna'"
                  value={editingNinoForm.alergias}
                  onChange={(e) => setEditingNinoForm({ ...editingNinoForm, alergias: e.target.value })}
                  className="w-full px-3 py-2 border border-rose-300 bg-rose-50/40 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditNinoModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL CARNET DIGITAL INFANTIL */}
      {selectedNinoForCarnet && (
        <CarnetNino
          nino={selectedNinoForCarnet}
          onClose={() => setSelectedNinoForCarnet(null)}
        />
      )}

    </div>
  );
}
