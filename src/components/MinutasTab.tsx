import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Upload, ChevronDown, ChevronRight, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { AlimentoTCAC } from '@prisma/client';

interface GrupoEtario {
  id: number;
  nombre: string;
}

interface MinutasTabProps {
  tcacDatabase: AlimentoTCAC[];
}

export default function MinutasTab({ tcacDatabase }: MinutasTabProps) {
  const [grupos, setGrupos] = useState<GrupoEtario[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<number | null>(null);
  const [selectedDia, setSelectedDia] = useState<number>(1);
  const [menuCurrent, setMenuCurrent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isGridExpanded, setIsGridExpanded] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/grupos-etarios')
      .then(res => res.json())
      .then(data => {
        setGrupos(data);
        if (data.length > 0) setSelectedGrupo(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (selectedGrupo) {
      setLoading(true);
      fetch(`/api/menus?grupoId=${selectedGrupo}&dia=${selectedDia}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setMenuCurrent(data[0]);
          } else {
            setMenuCurrent({
              numero_dia: selectedDia,
              grupo_etario_id: selectedGrupo,
              preparaciones: []
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [selectedGrupo, selectedDia]);

  const addFila = () => {
    const preps = [...(menuCurrent.preparaciones || [])];
    if (preps.length === 0) {
      preps.push({ nombre: '', tiempo_comida: 'ALMUERZO', ingredientes: [{ alimento_id: tcacDatabase[0]?.id || 0, peso_bruto: 0, peso_neto: 0 }] });
    } else {
      preps[preps.length - 1].ingredientes.push({ alimento_id: tcacDatabase[0]?.id || 0, peso_bruto: 0, peso_neto: 0 });
    }
    setMenuCurrent({ ...menuCurrent, preparaciones: preps });
    setIsGridExpanded(true);
  };

  const addPreparacion = () => {
    const preps = [...(menuCurrent.preparaciones || [])];
    preps.push({ nombre: 'Nueva Preparación', tiempo_comida: 'ALMUERZO', ingredientes: [{ alimento_id: tcacDatabase[0]?.id || 0, peso_bruto: 0, peso_neto: 0 }] });
    setMenuCurrent({ ...menuCurrent, preparaciones: preps });
    setIsGridExpanded(true);
  };

  const updatePrepField = (pIndex: number, field: string, value: any) => {
    const preps = [...menuCurrent.preparaciones];
    preps[pIndex] = { ...preps[pIndex], [field]: value };
    setMenuCurrent({ ...menuCurrent, preparaciones: preps });
  };

  const updateIngrediente = (pIndex: number, iIndex: number, field: string, value: any) => {
    const preps = [...menuCurrent.preparaciones];
    preps[pIndex].ingredientes[iIndex] = { ...preps[pIndex].ingredientes[iIndex], [field]: value };
    setMenuCurrent({ ...menuCurrent, preparaciones: preps });
  };

  const removeIngrediente = (pIndex: number, iIndex: number) => {
    const preps = [...menuCurrent.preparaciones];
    preps[pIndex].ingredientes.splice(iIndex, 1);
    if (preps[pIndex].ingredientes.length === 0) {
      preps.splice(pIndex, 1);
    }
    setMenuCurrent({ ...menuCurrent, preparaciones: preps });
  };

  const removePreparacion = (pIndex: number) => {
    if (!menuCurrent) return;
    const preps = [...menuCurrent.preparaciones];
    const prepNombre = preps[pIndex]?.nombre || 'esta preparación';
    if (!window.confirm(`¿Deseas eliminar la preparación "${prepNombre}" y todos sus ingredientes?`)) return;
    preps.splice(pIndex, 1);
    setMenuCurrent({ ...menuCurrent, preparaciones: preps });
  };

  const deleteMenu = async () => {
    if (!selectedGrupo || !selectedDia) return;
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas vaciar/eliminar toda la información del Menú ${selectedDia}? Esta acción borrará los datos de la plataforma.`);
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/menus?grupo_etario_id=${selectedGrupo}&numero_dia=${selectedDia}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMenuCurrent({
          numero_dia: selectedDia,
          grupo_etario_id: selectedGrupo,
          preparaciones: []
        });
        alert(`El Menú ${selectedDia} ha sido vaciado.`);
      } else {
        alert('Error al eliminar el menú.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar menú.');
    } finally {
      setLoading(false);
    }
  };

  const saveMenu = async () => {
    try {
      setLoading(true);
      await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuCurrent)
      });
      alert('Menú guardado exitosamente.');
    } catch (err) {
      console.error(err);
      alert('Error guardando el menú.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        // Convert to array of arrays
        const csvData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        setLoading(true);
        const response = await fetch('/api/menus/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            csvData, 
            grupo_etario_id: selectedGrupo,
            numero_dia: selectedDia
          })
        });
        
        if (!response.ok) throw new Error('Error al importar el archivo');
        
        const resultData = await response.json();
        setMenuCurrent(resultData);
        alert('¡Menú importado correctamente desde Excel!');
        setIsGridExpanded(true);
      } catch (err) {
        console.error(err);
        alert('Hubo un problema importando el archivo. Asegúrate de que sea el formato correcto.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const dias = Array.from({ length: 25 }, (_, i) => i + 1);

  let flatRows: any[] = [];
  let totales = { kcal: 0, prot: 0, grasa: 0, cho: 0, vitA: 0, calcio: 0, fe: 0, zinc: 0, sodio: 0, costo_unitario: 0 };

  if (menuCurrent?.preparaciones) {
    menuCurrent.preparaciones.forEach((prep: any, pIndex: number) => {
      prep.ingredientes.forEach((ing: any, iIndex: number) => {
        const alim = tcacDatabase.find(a => a.id === ing.alimento_id) as any;
        
        // Calcular valores dinámicos
        let macros = { kcal: 0, prot: 0, grasa: 0, cho: 0, vitA: 0, calcio: 0, fe: 0, zinc: 0, sodio: 0, costo_unitario: 0 };
        if (alim && ing.peso_neto) {
          const f = ing.peso_neto / 100;
          
          // El costo unitario según el excel es:
          // Si el alimento tiene costo_unidad_compra, es el precio por la presentación. 
          // En el excel el precio está por ejemplo "500" para un huevo (unidad) o "10600" para 1000cc.
          // Como la fórmula exacta depende de cómo llenen el excel, asumiremos que COSTO UNITARIO = COSTO UNIDAD DE COMPRA si es por unidad, o (COSTO UNIDAD DE COMPRA * PESO BRUTO) / (1000) si es por kilo.
          // Pero para simplificar, usaremos el mismo cálculo de su excel: COSTO UNIDAD COMPRA * Peso Bruto / Presentación...
          // Wait, the excel literally has 10600 for 1000cc of oil, weight 2cc => 21.2. So (10600 * 2) / 1000 = 21.2!
          // For Egg: 700. Peso bruto = 60. Wait, 700 is per egg. The Excel just shows COSTO UNIDAD DE COMPRA = 700, UNITARIO = 700. 
          // So if costo_unidad_compra is explicitly given for the row, use it.
          const costo_unidad = ing.costo_unidad_compra || alim.costo_unidad_compra || 0;
          let costo_unitario = ing.costo_unitario_excel !== undefined && ing.costo_unitario_excel !== null ? ing.costo_unitario_excel : 0;
          if (costo_unidad > 0 && ing.peso_bruto > 0 && (ing.costo_unitario_excel === undefined || ing.costo_unitario_excel === null)) {
            // Check if it's per kilo/litro (e.g. > 1000) or per piece
            if (costo_unidad > 1000 && alim.tipo_empaque && !alim.tipo_empaque.includes('unidad') && !alim.nombre.toLowerCase().includes('huevo') && !alim.nombre.toLowerCase().includes('pan')) {
               costo_unitario = (costo_unidad * ing.peso_bruto) / 1000;
            } else {
               costo_unitario = costo_unidad; 
               // For things like pan or egg, unit cost = total cost. Wait, what if they eat 2 eggs?
               // If peso_bruto is 120g (2 eggs), it should be 1400.
               if (alim.nombre.toLowerCase().includes('huevo')) {
                  costo_unitario = costo_unidad * (ing.peso_bruto / 50); // average egg is 50g
               }
            }
          }

          macros = {
            kcal: alim.energia_kcal * f,
            prot: alim.proteina_g * f,
            grasa: alim.grasa_g * f,
            cho: alim.carbohidratos_g * f,
            vitA: alim.vitamina_a_rae * f,
            calcio: alim.calcio_mg * f,
            fe: alim.hierro_mg * f,
            zinc: alim.zinc_mg * f,
            sodio: ing.sodio_mg_excel !== undefined && ing.sodio_mg_excel !== null ? ing.sodio_mg_excel : (alim.sodio_mg || 0) * f,
            costo_unitario
          };
          
          totales.kcal += macros.kcal;
          totales.prot += macros.prot;
          totales.grasa += macros.grasa;
          totales.cho += macros.cho;
          totales.vitA += macros.vitA;
          totales.calcio += macros.calcio;
          totales.fe += macros.fe;
          totales.zinc += macros.zinc;
          totales.sodio += macros.sodio;
          totales.costo_unitario += macros.costo_unitario;
        }

        flatRows.push({ pIndex, iIndex, prep, ing, macros });
      });
    });
  }

  // Valores meta aproximados basados en el PDF ejemplo
  const metas = { kcal: 761, prot: 27.6, grasa: 28.1, cho: 95.8, vitA: 444, calcio: 420, fe: 6.6, zinc: 5.6, sodio: 1037 };

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-3 rounded shadow-sm border border-slate-300">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Grupo:</label>
            <select
              className="px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50"
              value={selectedGrupo || ''}
              onChange={(e) => setSelectedGrupo(Number(e.target.value))}
            >
              {grupos.map(g => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Día:</label>
            <select
              className="px-2 py-1 text-sm border border-slate-300 rounded bg-slate-50"
              value={selectedDia}
              onChange={(e) => setSelectedDia(Number(e.target.value))}
            >
              {dias.map(d => (
                <option key={d} value={d}>Menú {d}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button
            onClick={triggerFileInput}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded hover:bg-blue-100 border border-blue-200"
          >
            <Upload className="h-3 w-3" /> Cargar Archivo .xlsx / .csv
          </button>
          <button
            onClick={saveMenu}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Save className="h-3 w-3" />
            {loading ? 'Cargando...' : 'Guardar en Plataforma'}
          </button>
          {menuCurrent?.preparaciones?.length > 0 && (
            <button
              onClick={deleteMenu}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded hover:bg-rose-100 border border-rose-200 disabled:opacity-50 transition-colors"
              title="Vaciar / Eliminar todas las preparaciones de este menú"
            >
              <Trash2 className="h-3 w-3" /> Vaciar Menú
            </button>
          )}
        </div>
      </div>

      {loading && !menuCurrent ? (
        <div className="text-center p-8 text-slate-500 text-sm flex items-center justify-center gap-2">
          <FileSpreadsheet className="h-5 w-5 animate-pulse" /> Cargando documento...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-300 shadow-sm rounded overflow-hidden">
            <button 
              className="w-full bg-slate-100 px-4 py-3 flex items-center gap-2 font-bold text-slate-800 text-sm hover:bg-slate-200 border-b border-slate-300"
              onClick={() => setIsGridExpanded(!isGridExpanded)}
            >
              {isGridExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              ANÁLISIS CONTENIDO NUTRICIONAL
            </button>
            
            {isGridExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300 text-center">
                      <th className="px-1 py-2 border-r border-slate-300">T. COMIDA</th>
                      <th className="px-1 py-2 border-r border-slate-300">PREPARACIÓN</th>
                      <th className="px-1 py-2 border-r border-slate-300">CÓD. TCAC</th>
                      <th className="px-1 py-2 border-r border-slate-300">INGREDIENTE</th>
                      <th className="px-1 py-2 border-r border-slate-300">P.BRUTO</th>
                      <th className="px-1 py-2 border-r border-slate-300">P.NETO</th>
                      <th className="px-1 py-2 border-r border-slate-300">Calorías</th>
                      <th className="px-1 py-2 border-r border-slate-300">Prot.</th>
                      <th className="px-1 py-2 border-r border-slate-300">Grasa</th>
                      <th className="px-1 py-2 border-r border-slate-300">Carboh.</th>
                      <th className="px-1 py-2 border-r border-slate-300">Vit. A</th>
                      <th className="px-1 py-2 border-r border-slate-300">Calcio</th>
                      <th className="px-1 py-2 border-r border-slate-300">Hierro</th>
                      <th className="px-1 py-2 border-r border-slate-300">Zinc</th>
                      <th className="px-1 py-2 border-r border-slate-300">Sodio</th>
                      <th className="px-1 py-2 border-r border-slate-300">UNIDAD DE COMPRA</th>
                      <th className="px-1 py-2 border-r border-slate-300">COSTO UNIDAD DE COMPRA</th>
                      <th className="px-1 py-2 border-r border-slate-300">COSTO UNITARIO $</th>
                      <th className="px-1 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatRows.length === 0 ? (
                      <tr><td colSpan={16} className="p-4 text-center text-slate-400">Sin datos</td></tr>
                    ) : (
                      flatRows.map((row, idx) => {
                        const alim = tcacDatabase.find(a => a.id === row.ing.alimento_id);
                        const isFirst = row.iIndex === 0;

                        return (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-yellow-50">
                            <td className="px-1 py-1 border-r border-slate-200 bg-white">
                              {isFirst && (
                                <select value={row.prep.tiempo_comida} onChange={e => updatePrepField(row.pIndex, 'tiempo_comida', e.target.value)} className="w-24 bg-transparent outline-none uppercase font-bold text-[10px]">
                                  <option value="REFRIGERIO MAÑANA">REF. MAÑANA</option>
                                  <option value="ALMUERZO">ALMUERZO</option>
                                  <option value="REFRIGERIO TARDE">REF. TARDE</option>
                                </select>
                              )}
                            </td>
                            <td className="px-1 py-1 border-r border-slate-200 bg-white">
                              {isFirst && (
                                <div className="flex items-center justify-between gap-1">
                                  <input type="text" value={row.prep.nombre} onChange={e => updatePrepField(row.pIndex, 'nombre', e.target.value)} className="w-full bg-transparent outline-none uppercase font-bold" />
                                  <button type="button" onClick={() => removePreparacion(row.pIndex)} title="Eliminar preparación entera" className="text-slate-300 hover:text-rose-600 p-0.5 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-1 border-r border-slate-200 font-mono text-slate-600">{alim?.codigo_icbf || ''}</td>
                            <td className="px-1 py-1 border-r border-slate-200 w-64 truncate">
                              <select value={row.ing.alimento_id} onChange={e => updateIngrediente(row.pIndex, row.iIndex, 'alimento_id', Number(e.target.value))} className="w-full bg-transparent outline-none">
                                {tcacDatabase.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                              </select>
                            </td>
                            <td className="px-1 py-1 border-r border-slate-200"><input type="number" value={row.ing.peso_bruto||''} onChange={e => updateIngrediente(row.pIndex, row.iIndex, 'peso_bruto', Number(e.target.value))} className="w-12 bg-transparent text-center" /></td>
                            <td className="px-1 py-1 border-r border-slate-200"><input type="number" value={row.ing.peso_neto||''} onChange={e => updateIngrediente(row.pIndex, row.iIndex, 'peso_neto', Number(e.target.value))} className="w-12 bg-transparent text-center font-bold text-emerald-700" /></td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.kcal.toFixed(1)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.prot.toFixed(2)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.grasa.toFixed(2)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.cho.toFixed(2)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.vitA.toFixed(1)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.calcio.toFixed(1)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.fe.toFixed(2)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.zinc.toFixed(2)}</td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center">{row.macros.sodio.toFixed(1)}</td>
                            
                            <td className="px-1 py-1 border-r border-slate-200 text-center">
                              {alim?.tipo_empaque?.includes('litro') || alim?.tipo_empaque?.includes('cc') || alim?.tipo_empaque?.includes('botella') ? 'cc' : 'g'}
                            </td>
                            <td className="px-1 py-1 border-r border-slate-200">
                              <input 
                                type="number" 
                                value={row.ing.costo_unidad_compra || ''} 
                                onChange={e => updateIngrediente(row.pIndex, row.iIndex, 'costo_unidad_compra', Number(e.target.value))} 
                                className="w-16 bg-transparent text-center" 
                                placeholder="Ej: 500"
                              />
                            </td>
                            <td className="px-1 py-1 border-r border-slate-200 text-center font-medium bg-blue-50">
                              {row.macros.costo_unitario > 0 ? row.macros.costo_unitario.toFixed(1) : '0'}
                            </td>

                            <td className="px-1 text-center"><button onClick={() => removeIngrediente(row.pIndex, row.iIndex)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3"/></button></td>
                          </tr>
                        );
                      })
                    )}
                    {/* TOTALES */}
                    <tr className="bg-slate-200 font-bold border-t-2 border-slate-400">
                      <td colSpan={6} className="text-right px-2 py-2">APORTE TOTAL DEL DÍA</td>
                      <td className="text-center">{totales.kcal.toFixed(1)}</td>
                      <td className="text-center">{totales.prot.toFixed(1)}</td>
                      <td className="text-center">{totales.grasa.toFixed(1)}</td>
                      <td className="text-center">{totales.cho.toFixed(1)}</td>
                      <td className="text-center">{totales.vitA.toFixed(1)}</td>
                      <td className="text-center">{totales.calcio.toFixed(1)}</td>
                      <td className="text-center">{totales.fe.toFixed(1)}</td>
                      <td className="text-center">{totales.zinc.toFixed(1)}</td>
                      <td className="text-center">{totales.sodio.toFixed(1)}</td>
                      <td colSpan={2}></td>
                      <td className="text-center text-blue-700 bg-blue-100">${totales.costo_unitario.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={6} className="text-right px-2 py-2 text-slate-500">APORTE MINUTA PATRON</td>
                      <td className="text-center text-slate-500">{metas.kcal}</td>
                      <td className="text-center text-slate-500">{metas.prot}</td>
                      <td className="text-center text-slate-500">{metas.grasa}</td>
                      <td className="text-center text-slate-500">{metas.cho}</td>
                      <td className="text-center text-slate-500">{metas.vitA}</td>
                      <td className="text-center text-slate-500">{metas.calcio}</td>
                      <td className="text-center text-slate-500">{metas.fe}</td>
                      <td className="text-center text-slate-500">{metas.zinc}</td>
                      <td className="text-center text-slate-500">{metas.sodio}</td>
                      <td colSpan={3}></td>
                      <td></td>
                    </tr>
                    <tr className="bg-emerald-50 font-bold border-b-2 border-slate-400 text-emerald-800">
                      <td colSpan={6} className="text-right px-2 py-2">% CUBRIMIENTO DEL DÍA</td>
                      <td className="text-center">{((totales.kcal/metas.kcal)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.prot/metas.prot)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.grasa/metas.grasa)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.cho/metas.cho)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.vitA/metas.vitA)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.calcio/metas.calcio)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.fe/metas.fe)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.zinc/metas.zinc)*100).toFixed(1)}%</td>
                      <td className="text-center">{((totales.sodio/metas.sodio)*100).toFixed(1)}%</td>
                      <td colSpan={3}></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
                <div className="p-2 bg-white">
                  <button onClick={addFila} className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded border border-slate-300">
                    <Plus className="h-3 w-3" /> Añadir Fila
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
