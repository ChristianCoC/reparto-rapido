import React from 'react';
import { PackageItem, VehicleZoneId, VEHICLE_ZONES } from '../types';
import { Box, Layers } from 'lucide-react';

interface VehicleMapProps {
  packages: PackageItem[];
  selectedZone?: VehicleZoneId | null;
  onSelectZone: (zone: VehicleZoneId | null) => void;
}

export const VehicleMap: React.FC<VehicleMapProps> = ({
  packages,
  selectedZone,
  onSelectZone
}) => {
  const getCounts = (zoneId: VehicleZoneId) => {
    const total = packages.filter((p) => p.zoneId === zoneId).length;
    const pending = packages.filter((p) => p.zoneId === zoneId && p.status === 'pending').length;
    return { total, pending };
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-900 dark:text-white">
            <Layers className="w-5 h-5 text-brand-600" />
            Distribución en el Vehículo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Toca una ubicación para ver qué paquetes tiene guardados
          </p>
        </div>
        {selectedZone && (
          <button
            onClick={() => onSelectZone(null)}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Ver todos
          </button>
        )}
      </div>

      {/* Croquis limpio del vehículo (3 zonas) */}
      <div className="max-w-xs mx-auto bg-slate-100 dark:bg-slate-800/60 rounded-3xl p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-3">
        {/* Cabina / Frente */}
        <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-1">
          ▲ Frente (Parabrisas) ▲
        </div>

        {/* Zona 1: Copiloto */}
        {(() => {
          const zone = VEHICLE_ZONES.find((z) => z.id === 'copiloto')!;
          const { total, pending } = getCounts('copiloto');
          const isSelected = selectedZone === 'copiloto';
          return (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-200 dark:bg-slate-700/50 rounded-2xl p-2.5 flex items-center justify-center text-xs font-bold text-slate-500">
                Conductor
              </div>
              <button
                type="button"
                onClick={() => onSelectZone(isSelected ? null : 'copiloto')}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-md ring-2 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-blue-600 dark:text-blue-400">
                    Copiloto
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5 text-blue-500" />
                    {total}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {pending} pendientes
                </span>
              </button>
            </div>
          );
        })()}

        {/* Zona 2: Asientos Traseros (Atrás) */}
        {(() => {
          const { total, pending } = getCounts('atras');
          const isSelected = selectedZone === 'atras';
          return (
            <button
              type="button"
              onClick={() => onSelectZone(isSelected ? null : 'atras')}
              className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 shadow-md ring-2 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                  Atrás (Asientos traseros)
                </span>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Box className="w-4 h-4 text-emerald-500" />
                  {total} paq.
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {pending} pendientes de entrega
              </span>
            </button>
          );
        })()}

        {/* Zona 3: Baúl */}
        {(() => {
          const { total, pending } = getCounts('baul');
          const isSelected = selectedZone === 'baul';
          return (
            <button
              type="button"
              onClick={() => onSelectZone(isSelected ? null : 'baul')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 shadow-md ring-2 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-base text-amber-600 dark:text-amber-400">
                  Baúl (Fondo)
                </span>
                <span className="text-base font-mono font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Box className="w-4 h-4 text-amber-500" />
                  {total} paq.
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {pending} pendientes de entrega
              </span>
            </button>
          );
        })()}

        <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 py-1">
          ▼ Puerta Trasera (Baúl) ▼
        </div>
      </div>
    </div>
  );
};
