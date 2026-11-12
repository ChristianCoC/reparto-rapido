import React, { useState, useRef, useEffect } from 'react';
import { PackageItem, VehicleZoneId, VEHICLE_ZONES } from '../types';
import { Plus, Hash, Check, Box, Sparkles, X, Edit2 } from 'lucide-react';
import { feedback } from '../utils/feedback';

interface PackageFormProps {
  selectedZone: VehicleZoneId;
  onSelectZone: (zone: VehicleZoneId) => void;
  dayPrefix: string;
  onSetDayPrefix: (prefix: string) => void;
  onAddPackage: (pkg: PackageItem) => void;
  totalCount: number;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  selectedZone,
  onSelectZone,
  dayPrefix,
  onSetDayPrefix,
  onAddPackage,
  totalCount,
}) => {
  // Inicializar el valor del input con el prefijo si existe
  const [code, setCode] = useState(() => (dayPrefix ? `#${dayPrefix}` : ''));
  const [isEditingPrefix, setIsEditingPrefix] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar input si el prefijo cambia externamente
  useEffect(() => {
    if (dayPrefix && (!code || code === '#' || code === `#${dayPrefix}`)) {
      setCode(`#${dayPrefix}`);
    }
  }, [dayPrefix]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();

    // Si hay un prefijo activo y el usuario escribe números directamente (ej: escribe "02")
    if (dayPrefix) {
      const cleanVal = val.replace(/^#/, '');
      // Si el usuario borró todo o solo escribió dígitos
      if (/^\d+$/.test(cleanVal)) {
        val = `#${dayPrefix}${cleanVal}`;
      } else if (!val.startsWith('#')) {
        val = `#${val}`;
      }
    } else {
      // Sin prefijo todavía: asegurarse de iniciar con '#'
      if (val && !val.startsWith('#')) {
        val = `#${val}`;
      }
    }

    setCode(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode === '#' || (dayPrefix && cleanCode === `#${dayPrefix}`)) {
      alert('Ingresa el código o número del paquete');
      inputRef.current?.focus();
      return;
    }

    // Si aún no tenemos prefijo del día, extraerlo del primer paquete cargado (ej: "#AA01" -> "AA")
    if (!dayPrefix) {
      const matchLetters = cleanCode.replace(/^#/, '').match(/^([A-Za-z]+)/);
      if (matchLetters && matchLetters[1].length >= 1) {
        const detectedPrefix = matchLetters[1].toUpperCase();
        onSetDayPrefix(detectedPrefix);
      }
    }

    const newPackage: PackageItem = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: cleanCode,
      zoneId: selectedZone,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    feedback.playScanSuccess();
    onAddPackage(newPackage);

    // Si tenemos prefijo del día (o recién detectado), dejar listo "#PREFIJO" para el siguiente
    const activePrefix = dayPrefix || cleanCode.replace(/^#/, '').match(/^([A-Za-z]+)/)?.[1]?.toUpperCase() || '';
    if (activePrefix) {
      setCode(`#${activePrefix}`);
    } else {
      setCode('');
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleClearPrefix = () => {
    onSetDayPrefix('');
    setCode('');
    setIsEditingPrefix(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Header con Cartel Luminoso de Total de Paquetes */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-brand-600" />
            Carga de Paquetes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa código y ubica en el auto
          </p>
        </div>

        {/* Contador Destacado con Alto Impacto Visual */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-emerald-500 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative px-3.5 py-1.5 bg-slate-900 text-white dark:bg-slate-950 rounded-2xl flex items-center gap-2 border border-brand-500/30 shadow-md">
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-400 leading-none">
                Total Cargados
              </span>
              <span className="text-lg font-black font-mono text-white leading-tight">
                {totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Principal Grande */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Código de Paquete
            </label>

            {/* Aviso de Prefijo Automático del Viaje */}
            {dayPrefix && (
              <div className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950/60 border border-brand-300 dark:border-brand-800 px-2.5 py-0.5 rounded-lg text-xs font-bold text-brand-700 dark:text-brand-300">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Prefijo: <strong>#{dayPrefix}</strong></span>
                <button
                  type="button"
                  onClick={handleClearPrefix}
                  className="p-0.5 hover:text-red-600 ml-0.5"
                  title="Cambiar prefijo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <Hash className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder={dayPrefix ? `#${dayPrefix}01` : 'Ej: #AA01'}
              autoFocus
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono transition-colors shadow-inner"
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            {dayPrefix
              ? `Las letras #${dayPrefix} se autocompletan. Solo escribe los números siguientes.`
              : 'Al cargar el primer paquete (ej: AA01) las letras se recordarán para todo el viaje.'}
          </p>
        </div>

        {/* 3 Ubicaciones del Vehículo - 100% PERSISTENTE (No se cambia al girar) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Ubicación en el Vehículo
            </label>
            <span className="text-[10px] text-slate-400 font-semibold">
              (Fija hasta que elijas otra)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {VEHICLE_ZONES.map((zone) => {
              const isSelected = selectedZone === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onSelectZone(zone.id)}
                  className={`py-3.5 px-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/70 shadow-lg scale-[1.03] ring-2 ring-brand-500/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs"
                      style={{ backgroundColor: zone.color }}
                    ></span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {zone.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 stroke-[3]" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold text-center line-clamp-1">
                    {zone.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón de Cargar */}
        <button
          type="submit"
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-brand-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span>Cargar al Vehículo (Enter)</span>
        </button>
      </form>
    </div>
  );
};
