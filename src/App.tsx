import React, { useState, useEffect } from 'react';
import { PackageItem, VehicleZoneId } from './types';
import { storage } from './utils/storage';
import { PackageForm } from './components/PackageForm';
import { VehicleMap } from './components/VehicleMap';
import { DeliveryMap } from './components/DeliveryMap';
import { PackageList } from './components/PackageList';
import { EndOfDayModal } from './components/EndOfDayModal';
import {
  Truck,
  PlusCircle,
  Layers,
  Map as MapIcon,
  CheckSquare,
  Moon,
  Sun,
  RotateCcw,
  Sparkles,
  Box
} from 'lucide-react';

export const App: React.FC = () => {
  const [packages, setPackages] = useState<PackageItem[]>(() => storage.getPackages());
  const [activeTab, setActiveTab] = useState<'cargar' | 'vehiculo' | 'entregas' | 'mapa'>('cargar');

  // UBICACIÓN DE VEHÍCULO PERSISTENTE: Nunca se resetea por rotación ni cambio de pestaña
  const [activeVehicleZone, setActiveVehicleZone] = useState<VehicleZoneId>(() => storage.getActiveZone());

  // PREFIJO DE LETRAS DEL VIAJE (ej: "AA" para #AA01, #AA02...)
  const [dayPrefix, setDayPrefix] = useState<string>(() => storage.getDayPrefix());

  // Filtro de zona en pantalla de entregas / croquis
  const [filterZone, setFilterZone] = useState<VehicleZoneId | null>(null);

  const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Guardar paquetes en localStorage
  useEffect(() => {
    storage.savePackages(packages);
  }, [packages]);

  // Guardar zona del vehículo
  const handleSelectVehicleZone = (zone: VehicleZoneId) => {
    setActiveVehicleZone(zone);
    storage.saveActiveZone(zone);
  };

  // Guardar prefijo del viaje
  const handleSetDayPrefix = (prefix: string) => {
    setDayPrefix(prefix);
    storage.saveDayPrefix(prefix);
  };

  // Modo oscuro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Agregar nuevo paquete
  const handleAddPackage = (newPkg: PackageItem) => {
    setPackages((prev) => [newPkg, ...prev]);
  };

  // Alternar entregado / pendiente (sin bugs de conteo)
  const handleToggleStatus = (id: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === id) {
          const isNowDelivered = pkg.status !== 'delivered';
          return {
            ...pkg,
            status: isNowDelivered ? 'delivered' : 'pending',
            deliveredAt: isNowDelivered ? new Date().toISOString() : undefined,
          };
        }
        return pkg;
      })
    );
  };

  // Eliminar paquete individual
  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  // Limpiar jornada completa
  const handleClearDay = () => {
    storage.clearDay();
    setPackages([]);
    setFilterZone(null);
    setDayPrefix('');
  };

  // Cargar paquetes de prueba (ej: #AA01 a #AA05)
  const handleLoadDemo = () => {
    const demo: PackageItem[] = [
      { id: 'd-1', code: '#AA01', zoneId: 'copiloto', status: 'pending', createdAt: new Date().toISOString() },
      { id: 'd-2', code: '#AA02', zoneId: 'copiloto', status: 'pending', createdAt: new Date().toISOString() },
      { id: 'd-3', code: '#AA03', zoneId: 'atras', status: 'pending', createdAt: new Date().toISOString() },
      { id: 'd-4', code: '#AA10', zoneId: 'atras', status: 'pending', createdAt: new Date().toISOString() },
      { id: 'd-5', code: '#AA15', zoneId: 'baul', status: 'pending', createdAt: new Date().toISOString() },
    ];
    setPackages(demo);
    handleSetDayPrefix('AA');
  };

  // Conteo exacto garantizado
  const total = packages.length;
  const delivered = packages.filter((p) => p.status === 'delivered').length;
  const pending = total - delivered;
  const progressPercent = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Header Fijo con Alta Visibilidad */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-base leading-tight tracking-tight">RepartoRápido</h1>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {total === 0 ? 'Vehículo sin carga' : `${delivered} de ${total} entregados`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Medallón de Total en Header */}
            {total > 0 && (
              <div className="px-2.5 py-1 bg-brand-50 dark:bg-brand-950/70 border border-brand-300 dark:border-brand-800 rounded-xl flex items-center gap-1.5 shadow-xs">
                <Box className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-black font-mono text-brand-700 dark:text-brand-300">
                  {total} paq.
                </span>
              </div>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cambiar tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsEndOfDayOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
              title="Cierre de jornada"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        {total > 0 && (
          <div className="max-w-md mx-auto mt-2">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_#22c55e]"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Banner de inicio rápido si la app está vacía */}
        {total === 0 && (
          <div className="bg-gradient-to-r from-brand-600 to-emerald-700 text-white p-4 rounded-3xl shadow-lg flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm">¿Probar con 5 paquetes de ejemplo?</h3>
              <p className="text-xs text-brand-100 mt-0.5">
                Carga paquetes con código #AA01 al #AA15 en Copiloto, Atrás y Baúl.
              </p>
            </div>
            <button
              onClick={handleLoadDemo}
              className="px-3.5 py-2.5 bg-white text-brand-900 font-black rounded-2xl text-xs hover:bg-brand-50 flex items-center gap-1.5 flex-shrink-0 shadow cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Cargar demo
            </button>
          </div>
        )}

        {/* 1. Carga Rápida */}
        {activeTab === 'cargar' && (
          <div className="space-y-4">
            <PackageForm
              selectedZone={activeVehicleZone}
              onSelectZone={handleSelectVehicleZone}
              dayPrefix={dayPrefix}
              onSetDayPrefix={handleSetDayPrefix}
              onAddPackage={handleAddPackage}
              totalCount={total}
            />

            {total > 0 && (
              <VehicleMap
                packages={packages}
                selectedZone={filterZone}
                onSelectZone={(z) => {
                  setFilterZone(z);
                  setActiveTab('entregas');
                }}
              />
            )}
          </div>
        )}

        {/* 2. Vehículo (Copiloto, Atrás, Baúl) */}
        {activeTab === 'vehiculo' && (
          <div className="space-y-4">
            <VehicleMap
              packages={packages}
              selectedZone={filterZone}
              onSelectZone={(z) => setFilterZone(z)}
            />

            {filterZone && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400">
                    Paquetes en {filterZone.toUpperCase()}
                  </h4>
                  <button
                    onClick={() => setFilterZone(null)}
                    className="text-xs font-bold text-brand-600 dark:text-brand-400"
                  >
                    Ver todas las ubicaciones
                  </button>
                </div>
                <PackageList
                  packages={packages}
                  selectedZone={filterZone}
                  onToggleStatus={handleToggleStatus}
                  onDeletePackage={handleDeletePackage}
                />
              </div>
            )}
          </div>
        )}

        {/* 3. Lista de Entregas (Checklist ordenado numéricamente + Buscador) */}
        {activeTab === 'entregas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-600" />
                Control de Entregas
              </h3>
              {filterZone && (
                <button
                  onClick={() => setFilterZone(null)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400"
                >
                  Filtro: {filterZone.toUpperCase()} (Quitar)
                </button>
              )}
            </div>

            <PackageList
              packages={packages}
              selectedZone={filterZone}
              onToggleStatus={handleToggleStatus}
              onDeletePackage={handleDeletePackage}
            />
          </div>
        )}

        {/* 4. Verificador de Mapa */}
        {activeTab === 'mapa' && (
          <div className="space-y-4">
            <DeliveryMap />
          </div>
        )}
      </main>

      {/* Modal de Cierre de Día */}
      <EndOfDayModal
        packages={packages}
        isOpen={isEndOfDayOpen}
        onClose={() => setIsEndOfDayOpen(false)}
        onConfirmClear={handleClearDay}
      />

      {/* Navegación Inferior Fija para Repartidores */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around p-2">
          {/* Cargar */}
          <button
            onClick={() => setActiveTab('cargar')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'cargar'
                ? 'text-brand-600 dark:text-brand-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 font-semibold'
            }`}
          >
            <PlusCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Cargar</span>
          </button>

          {/* Vehículo */}
          <button
            onClick={() => setActiveTab('vehiculo')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'vehiculo'
                ? 'text-brand-600 dark:text-brand-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 font-semibold'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Vehículo</span>
          </button>

          {/* Entregas */}
          <button
            onClick={() => setActiveTab('entregas')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all relative cursor-pointer ${
              activeTab === 'entregas'
                ? 'text-brand-600 dark:text-brand-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 font-semibold'
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Entregas</span>
            {pending > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                {pending}
              </span>
            )}
          </button>

          {/* Mapa */}
          <button
            onClick={() => setActiveTab('mapa')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'mapa'
                ? 'text-brand-600 dark:text-brand-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 font-semibold'
            }`}
          >
            <MapIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Mapa</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
