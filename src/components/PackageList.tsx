import React, { useState, useMemo } from 'react';
import { PackageItem, VehicleZoneId, VEHICLE_ZONES } from '../types';
import { CheckCircle2, Circle, Trash2, Box, Search, X, CheckCheck, Clock } from 'lucide-react';
import { feedback } from '../utils/feedback';

interface PackageListProps {
  packages: PackageItem[];
  selectedZone?: VehicleZoneId | null;
  onToggleStatus: (id: string) => void;
  onDeletePackage: (id: string) => void;
}

// Extraer el número de un código (ej: "#AA01" -> 1, "#BD32" -> 32, "#HH5" -> 5)
function extractNumberFromCode(code: string): number {
  const match = code.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999999;
}

export const PackageList: React.FC<PackageListProps> = ({
  packages,
  selectedZone,
  onToggleStatus,
  onDeletePackage,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filtrado por estado, zona y término de búsqueda
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toUpperCase().replace(/^#/, '');

    return packages.filter((p) => {
      // Filtro de ubicación
      if (selectedZone && p.zoneId !== selectedZone) return false;

      // Filtro de estado
      if (filter === 'pending' && p.status !== 'pending') return false;
      if (filter === 'delivered' && p.status !== 'delivered') return false;

      // Filtro de búsqueda rápida
      if (q) {
        const cleanCode = p.code.toUpperCase().replace(/^#/, '');
        return cleanCode.includes(q) || p.code.toUpperCase().includes(q);
      }

      return true;
    });
  }, [packages, selectedZone, filter, searchQuery]);

  // 2. ORDENAR ESTRICTAMENTE POR NUMERACIÓN (Requerimiento: orden numérico y no por carga)
  const sortedPackages = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const numA = extractNumberFromCode(a.code);
      const numB = extractNumberFromCode(b.code);
      if (numA !== numB) {
        return numA - numB;
      }
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });
  }, [filtered]);

  // Conteo exacto en tiempo real
  const total = packages.length;
  const delivered = packages.filter((p) => p.status === 'delivered').length;
  const pending = total - delivered;
  const percent = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const handleToggle = (pkg: PackageItem) => {
    if (pkg.status === 'pending') {
      feedback.playDelivered();
    }
    onToggleStatus(pkg.id);
  };

  return (
    <div className="space-y-4">
      {/* Panel Luminoso de Alto Impacto para el Total de Paquetes */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-400 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Estado de la Carga
            </span>
          </div>
          <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-brand-300 border border-brand-500/20">
            {percent}% completado
          </span>
        </div>

        {/* 3 Bloques Grandes de Totales */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          {/* Total */}
          <div className="bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/60 flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total
            </span>
            <span className="text-2xl font-black font-mono text-white mt-0.5">
              {total}
            </span>
          </div>

          {/* Pendientes */}
          <div className="bg-amber-950/40 p-2.5 rounded-2xl border border-amber-500/30 flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Faltan
            </span>
            <span className="text-2xl font-black font-mono text-amber-300 mt-0.5">
              {pending}
            </span>
          </div>

          {/* Entregados */}
          <div className="bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-500/30 flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              Listos
            </span>
            <span className="text-2xl font-black font-mono text-emerald-300 mt-0.5">
              {delivered}
            </span>
          </div>
        </div>
      </div>

      {/* Buscador Rápido de Paquetes en la Pantalla de Entregas */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar paquete por número o código (ej: 05, AA05)..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 shadow-sm transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pestañas de estado con conteo en vivo */}
      <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Todos ({total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'pending'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Pendientes ({pending})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'delivered'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Entregados ({delivered})
        </button>
      </div>

      {/* Listado de Paquetes Ordenados Numéricamente */}
      {sortedPackages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
          <Box className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {searchQuery ? `No hay paquetes que coincidan con "${searchQuery}"` : 'No hay paquetes en esta lista'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              Borrar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedPackages.map((pkg) => {
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
                    className="p-1 text-slate-400 hover:text-brand-600 active:scale-90 transition-transform cursor-pointer"
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

                      {isDelivered && (
                        <span className="text-[11px] font-black text-brand-700 dark:text-brand-400 bg-brand-100 dark:bg-brand-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5" />
                          Entregado
                        </span>
                      )}
                    </div>

                    {/* Código grande ordenado numéricamente */}
                    <div
                      className={`font-black text-2xl tracking-wider font-mono ${
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
