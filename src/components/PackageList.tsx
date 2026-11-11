import React, { useState } from 'react';
import { PackageItem, VehicleZoneId, VEHICLE_ZONES } from '../types';
import { CheckCircle2, Circle, Trash2, Box } from 'lucide-react';
import { feedback } from '../utils/feedback';

interface PackageListProps {
  packages: PackageItem[];
  selectedZone?: VehicleZoneId | null;
  onToggleStatus: (id: string) => void;
  onDeletePackage: (id: string) => void;
}

export const PackageList: React.FC<PackageListProps> = ({
  packages,
  selectedZone,
  onToggleStatus,
  onDeletePackage,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');

  // Filtrado estricto
  const filtered = packages.filter((p) => {
    if (selectedZone && p.zoneId !== selectedZone) return false;
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'delivered') return p.status === 'delivered';
    return true;
  });

  // Conteo exacto garantizado sin desfasajes
  const total = packages.length;
  const delivered = packages.filter((p) => p.status === 'delivered').length;
  const pending = total - delivered;

  const handleToggle = (pkg: PackageItem) => {
    if (pkg.status === 'pending') {
      feedback.playDelivered();
    }
    onToggleStatus(pkg.id);
  };

  return (
    <div className="space-y-3">
      {/* Pestañas de estado con conteo en vivo */}
      <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Todos ({total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'pending'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Pendientes ({pending})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'delivered'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Entregados ({delivered})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
          <Box className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-semibold">No hay paquetes en esta lista</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((pkg, index) => {
            const isDelivered = pkg.status === 'delivered';
            const zone = VEHICLE_ZONES.find((z) => z.id === pkg.zoneId) || VEHICLE_ZONES[0];

            return (
              <div
                key={pkg.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isDelivered
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Botón Tildar / Tachar */}
                  <button
                    onClick={() => handleToggle(pkg)}
                    className="p-1 text-slate-400 hover:text-brand-600 active:scale-90 transition-transform"
                    title={isDelivered ? 'Desmarcar entrega' : 'Marcar como entregado'}
                  >
                    {isDelivered ? (
                      <CheckCircle2 className="w-9 h-9 text-brand-600 fill-brand-100 dark:fill-brand-950" />
                    ) : (
                      <Circle className="w-9 h-9 hover:text-brand-500" />
                    )}
                  </button>

                  {/* Código #HH58 y Ubicación */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {/* Badge de Zona (Copiloto, Atrás, Baúl) */}
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-xs"
                        style={{ backgroundColor: zone.color }}
                      >
                        {zone.name}
                      </span>

                      <span className="text-xs text-slate-400 font-mono">
                        #{index + 1}
                      </span>

                      {isDelivered && (
                        <span className="text-[11px] font-bold text-brand-700 dark:text-brand-400 bg-brand-100 dark:bg-brand-950 px-2 py-0.5 rounded-full">
                          ✓ Entregado
                        </span>
                      )}
                    </div>

                    {/* Código con estilo tachado si está entregado */}
                    <div
                      className={`font-black text-2xl tracking-wide font-mono ${
                        isDelivered
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {pkg.code}
                    </div>
                  </div>

                  {/* Eliminar paquete */}
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar paquete ${pkg.code}?`)) {
                        onDeletePackage(pkg.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-colors"
                    title="Eliminar de la lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
