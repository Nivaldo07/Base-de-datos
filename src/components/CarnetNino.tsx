'use client';

import React from 'react';
import {
  X,
  Printer,
  Heart,
  Calendar,
  Phone,
  Home,
  User,
  ShieldAlert,
  CheckCircle,
  Activity,
  FileBadge,
  Sparkles,
} from 'lucide-react';
import { calcularEdadICBF } from '@/lib/ageCalculator';

interface CarnetNinoProps {
  nino: any;
  onClose: () => void;
}

export default function CarnetNino({ nino, onClose }: CarnetNinoProps) {
  if (!nino) return null;

  // Cierre mediante tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const edadInfo = calcularEdadICBF(nino.fecha_nacimiento);
  const tieneAlergias = Boolean(nino.alergias && nino.alergias.trim().length > 0 && nino.alergias.toLowerCase() !== 'ninguna');

  const handlePrint = () => {
    window.print();
  };

  const fechaNacFormateada = new Date(nino.fecha_nacimiento).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8 cursor-default"
      >
        
        {/* Barra de Acciones Superior (No imprimible) */}
        <div className="print:hidden bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <FileBadge className="w-4 h-4 text-emerald-600" />
            <span>Ficha Técnica y Carnet Digital de Nutrición Infantil ICBF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Carnet
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
              title="Cerrar carnet (ESC)"
            >
              <X className="w-4 h-4" />
              Cerrar
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL CARNET (Imprimible) */}
        <div className="p-6 md:p-8 space-y-6 print:p-4 print:space-y-4">
          
          {/* Encabezado Institucional ICBF */}
          <div className="border-b-2 border-emerald-700 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                ICBF
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                  Instituto Colombiano de Bienestar Familiar
                </h2>
                <p className="text-xs font-medium text-emerald-800">
                  Dirección de Primera Infancia • Modalidad Hogar Comunitario de Bienestar (HCB)
                </p>
                <p className="text-[11px] text-slate-500">
                  Carnet Oficial de Vinculación y Semáforo de Nutrición
                </p>
              </div>
            </div>

            {/* Badge de Grupo Etario Dinámico */}
            <div className={`px-3 py-1.5 rounded-xl border text-center ${edadInfo.colorBadge.bg} ${edadInfo.colorBadge.border}`}>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Grupo Etario ICBF
              </span>
              <span className={`text-xs font-extrabold ${edadInfo.colorBadge.text}`}>
                {edadInfo.grupoEtarioCorto}
              </span>
            </div>
          </div>

          {/* Banner de Datos Personales y Avatar */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-xs shrink-0 ${
              nino.genero === 'F' ? 'bg-pink-500' : 'bg-blue-600'
            }`}>
              {nino.nombre_completo.charAt(0)}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{nino.nombre_completo}</h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold">
                  {nino.tipo_documento}: {nino.numero_documento}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-800">
                  Género: {nino.genero === 'F' ? 'Femenino 👧' : 'Masculino 👦'}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {nino.estado || 'ACTIVO'}
                </span>
              </div>
            </div>

            {/* EDAD EN TIEMPO REAL */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center shadow-xs shrink-0">
              <span className="block text-[10px] uppercase font-bold text-emerald-700 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Edad Dinámica Hoy
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {edadInfo.edadTexto}
              </span>
              <span className="text-[10px] text-slate-400">
                ({edadInfo.totalMeses} meses cumplidos)
              </span>
            </div>
          </div>

          {/* ALERTA CRÍTICA DE ALERGIAS ALIMENTARIAS */}
          {tieneAlergias ? (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-3.5 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-rose-900 uppercase tracking-wide block">
                  ⚠️ ALERTA MÉDICA: ALERGIA O RESTRICCIÓN ALIMENTARIA
                </span>
                <p className="text-xs font-bold text-rose-800 mt-0.5">
                  {nino.alergias}
                </p>
                <p className="text-[11px] text-rose-700 mt-1">
                  * La Madre Comunitaria y el Manipulador de Alimentos deben ofrecer minuta diferencial sustituyendo el alérgeno.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sin alergias ni restricciones alimentarias registradas (Apto para Minuta Estándar ICBF).</span>
            </div>
          )}

          {/* Grid de 2 Columnas con Fichas de Detalle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Columna Izquierda: Salud y Nutrición */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200 text-xs uppercase tracking-wide">
                <Heart className="w-4 h-4 text-rose-500" />
                Salud y Antropometría
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">EPS Asignada</span>
                  <span className="font-semibold text-slate-800">{nino.eps || 'No registrada'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Grupo & Factor RH</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {nino.rh || 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Peso Actual</span>
                  <span className="font-semibold text-slate-800">
                    {nino.peso_actual_kg ? `${nino.peso_actual_kg} kg` : 'Sin tamizaje'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Talla Actual</span>
                  <span className="font-semibold text-slate-800">
                    {nino.talla_actual_cm ? `${nino.talla_actual_cm} cm` : 'Sin tamizaje'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Fecha de Nacimiento</span>
                <span className="font-medium text-slate-700">{fechaNacFormateada}</span>
              </div>
            </div>

            {/* Columna Derecha: Acudiente y Contacto */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-slate-50/50">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200 text-xs uppercase tracking-wide">
                <User className="w-4 h-4 text-emerald-600" />
                Acudiente y Emergencias
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Nombre del Acudiente / Cuidador</span>
                <span className="font-bold text-slate-800 text-sm">{nino.acudiente}</span>
                <span className="text-[10px] text-slate-500 block">Parentesco: {nino.parentesco || 'Madre'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Teléfono de Contacto</span>
                <span className="font-mono font-bold text-emerald-700 text-sm flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {nino.contacto_acudiente}
                </span>
              </div>

              <div className="pt-1 border-t border-slate-200">
                <span className="text-slate-400 block text-[10px]">Hogar HCB (UDS) Asignado</span>
                <span className="font-semibold text-slate-800 block">{nino.unidad?.nombre || 'UDS Actual'}</span>
                <span className="text-[11px] text-slate-600">Madre Com: {nino.unidad?.madre_comunitaria || 'Asignada'}</span>
              </div>
            </div>
          </div>

          {/* Pie Institucional de Firmas ICBF (Visible en Imprimir) */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-44 mx-auto h-8"></div>
              <p className="font-semibold text-slate-800">Firma Madre Comunitaria</p>
              <p className="text-[10px] text-slate-400">{nino.unidad?.madre_comunitaria || 'Responsable UDS'}</p>
            </div>
            <div className="space-y-1">
              <div className="border-b border-slate-400 w-44 mx-auto h-8"></div>
              <p className="font-semibold text-slate-800">Firma Acudiente</p>
              <p className="text-[10px] text-slate-400">{nino.acudiente}</p>
            </div>
          </div>

        </div>

        {/* Barra de Acciones Inferior / Footer (No imprimible) */}
        <div className="print:hidden bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-[11px] text-slate-500">
            💡 Puedes cerrar haciendo clic fuera de la ficha o presionando <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs font-bold text-slate-700">ESC</kbd>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar Carnet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
