import React from 'react';
import { PackageItem, VehicleZone } from '../types';
import { Box, Layers } from 'lucide-react';

interface VehicleMapProps {
  zones: VehicleZone[];
  packages: PackageItem[];
  selectedZoneId?: string | null;
  onSelectZone: (zoneId: string | null) => void;
}

export const VehicleMap: React.FC<VehicleMapProps> = ({
  zones,
  packages,
  selectedZoneId,
  onSelectZone
}) => {
  // Conteo de paquetes por zona
  const getZoneCount = (zoneId: string) => {
    return packages.filter((p) => p.vehicleZoneId === zoneId).length;
  };

  const getPendingCount = (zoneId: string) => {
    return packages.filter((p) => p.vehicleZoneId === zoneId && p.status === 'pending').length;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Layers className="w-5 h-5 text-brand-600" />
            Distribución en el Vehículo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Toca una zona para filtrar los paquetes guardados
          </p>
        </div>
        {selectedZoneId && (
          <button
            onClick={() => onSelectZone(null)}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Ver todas las zonas
          </button>
        )}
      </div>

      {/* Esquema visual del vehículo (vista superior de furgoneta) */}
      <div className="relative max-w-sm mx-auto bg-slate-100 dark:bg-slate-800/60 rounded-3xl p-4 border-2 border-dashed border-slate-300 dark:border-slate-700">
        {/* Cabina / Frente del vehículo */}
        <div className="flex items-center justify-center py-2 mb-3 bg-slate-200 dark:bg-slate-700/80 rounded-2xl text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
          ▲ Frente (Cabina / Conductor) ▲
        </div>

        {/* Cuadrícula de Zonas dentro del Vehículo */}
        <div className="space-y-2.5">
          {/* Zona A1: Copiloto / Cabina */}
          {(() => {
            const z = zones.find((item) => item.id === 'zone-copilot') || zones[0];
            const isSelected = selectedZoneId === z?.id;
            const count = z ? getZoneCount(z.id) : 0;
            const pending = z ? getPendingCount(z.id) : 0;
            return z ? (
              <button
                key={z.id}
                onClick={() => onSelectZone(isSelected ? null : z.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm"
                    style={{ backgroundColor: z.color }}
                  >
                    {z.code}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{z.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{z.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5" />
                    {count} {pending < count ? `(${pending} pend.)` : ''}
                  </span>
                </div>
              </button>
            ) : null;
          })()}

          {/* Fila Delantera y Puerta Lateral */}
          <div className="grid grid-cols-2 gap-2">
            {zones
              .filter((z) => z.id === 'zone-front' || z.id === 'zone-side')
              .map((z) => {
                const isSelected = selectedZoneId === z.id;
                const count = getZoneCount(z.id);
                return (
                  <button
                    key={z.id}
                    onClick={() => onSelectZone(isSelected ? null : z.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-black text-white"
                        style={{ backgroundColor: z.color }}
                      >
                        {z.code}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {count} paq.
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {z.name}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Fila Central y Fondo / Baúl */}
          <div className="grid grid-cols-2 gap-2">
            {zones
              .filter((z) => z.id === 'zone-middle' || z.id === 'zone-back')
              .map((z) => {
                const isSelected = selectedZoneId === z.id;
                const count = getZoneCount(z.id);
                return (
                  <button
                    key={z.id}
                    onClick={() => onSelectZone(isSelected ? null : z.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-black text-white"
                        style={{ backgroundColor: z.color }}
                      >
                        {z.code}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {count} paq.
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {z.name}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Puertas traseras */}
        <div className="flex items-center justify-center py-2 mt-3 bg-slate-200 dark:bg-slate-700/80 rounded-2xl text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
          ▼ Puertas Traseras (Descarga Principal) ▼
        </div>
      </div>
    </div>
  );
};
