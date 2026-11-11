import React, { useState, useRef } from 'react';
import { PackageItem, VehicleZoneId, VEHICLE_ZONES } from '../types';
import { Plus, Hash, Check, Box } from 'lucide-react';
import { feedback } from '../utils/feedback';

interface PackageFormProps {
  onAddPackage: (pkg: PackageItem) => void;
  totalCount: number;
}

export const PackageForm: React.FC<PackageFormProps> = ({ onAddPackage, totalCount }) => {
  const [code, setCode] = useState('');
  const [selectedZone, setSelectedZone] = useState<VehicleZoneId>('copiloto');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    // Asegurar que comience con '#' si escribe letras o números
    if (val && !val.startsWith('#')) {
      val = `#${val}`;
    }
    setCode(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode === '#') {
      alert('Ingresa el código del paquete (ej: #HH58)');
      inputRef.current?.focus();
      return;
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

    // Limpiar input y volver a enfocar para el siguiente paquete (manteniendo la zona seleccionada)
    setCode('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-brand-600" />
            Carga Rápida de Paquetes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa el código con numeral y ubícalo en el vehículo
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
          {totalCount} cargados
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Principal Grande */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Código de Paquete (ej: #HH58)
          </label>
          <div className="relative">
            <Hash className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="#HH58"
              autoFocus
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black tracking-wider text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono transition-colors"
            />
          </div>
        </div>

        {/* 3 Ubicaciones Claras del Vehículo: Copiloto, Atrás, Baúl */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            Ubicación en el Vehículo
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {VEHICLE_ZONES.map((zone) => {
              const isSelected = selectedZone === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone.id)}
                  className={`py-3.5 px-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/50 shadow-md scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    ></span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {zone.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center line-clamp-1">
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
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 transition-all"
        >
          <Plus className="w-6 h-6" />
          <span>Cargar al Vehículo (Enter)</span>
        </button>
      </form>
    </div>
  );
};
