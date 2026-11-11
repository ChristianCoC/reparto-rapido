import React, { useState, useEffect } from 'react';
import { PackageItem, VehicleZone, DeliveryStatus } from './types';
import { storage } from './utils/storage';
import { PackageForm } from './components/PackageForm';
import { ScannerView } from './components/ScannerView';
import { VehicleMap } from './components/VehicleMap';
import { DeliveryMap } from './components/DeliveryMap';
import { PackageList } from './components/PackageList';
import { EndOfDayModal } from './components/EndOfDayModal';
import {
  Truck,
  ScanLine,
  Layers,
  Map as MapIcon,
  CheckSquare,
  Moon,
  Sun,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const App: React.FC = () => {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [zones] = useState<VehicleZone[]>(() => storage.getZones());
  const [activeTab, setActiveTab] = useState<'scan' | 'vehicle' | 'map' | 'list'>('scan');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Cargar paquetes guardados al montar
  useEffect(() => {
    const saved = storage.getPackages();
    setPackages(saved);
  }, []);

  // Guardar en localStorage cada vez que cambie
  useEffect(() => {
    storage.savePackages(packages);
  }, [packages]);

  // Manejar modo oscuro
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
    setScannedCode('');
    setIsScannerOpen(false);
  };

  // Escaneo exitoso
  const handleScanSuccess = (code: string) => {
    setScannedCode(code);
    setIsScannerOpen(false);
    // Cambiar a la pestaña de carga si no está en ella
    setActiveTab('scan');
  };

  // Actualizar estado de entrega (tachar / tildar)
  const handleUpdateStatus = (id: string, status: DeliveryStatus, reason?: string) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === id) {
          return {
            ...pkg,
            status,
            failureReason: status === 'failed' ? reason : undefined,
            deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
          };
        }
        return pkg;
      })
    );
  };

  // Eliminar un paquete
  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  // Limpiar jornada
  const handleClearDay = () => {
    storage.clearDay();
    setPackages([]);
    setSelectedZoneId(null);
  };

  // Cargar datos de prueba de ejemplo para verificar sin paquetes físicos
  const handleLoadDemoData = () => {
    const demoPackages: PackageItem[] = [
      {
        id: 'demo-1',
        trackingNumber: 'ML-984210',
        recipient: 'Martín Gómez',
        address: 'Av. Santa Fe 3200, Palermo',
        notes: 'Piso 4 Departamento B',
        vehicleZoneId: 'zone-copilot',
        status: 'pending',
        scannedAt: new Date().toISOString(),
        coordinates: { lat: -34.5888, lng: -58.4111 }
      },
      {
        id: 'demo-2',
        trackingNumber: 'ML-984211',
        recipient: 'Lucía Fernández',
        address: 'Av. Cabildo 1500, Belgrano',
        notes: 'Dejar en recepción',
        vehicleZoneId: 'zone-front',
        status: 'pending',
        scannedAt: new Date().toISOString(),
        coordinates: { lat: -34.5678, lng: -58.4522 }
      },
      {
        id: 'demo-3',
        trackingNumber: 'ML-984212',
        recipient: 'Carlos Rossi',
        address: 'Av. Rivadavia 4500, Almagro',
        vehicleZoneId: 'zone-middle',
        status: 'pending',
        scannedAt: new Date().toISOString(),
        coordinates: { lat: -34.6189, lng: -58.4287 }
      },
      {
        id: 'demo-4',
        trackingNumber: 'ML-984213',
        recipient: 'Sofía Díaz',
        address: 'Av. de Mayo 800, Montserrat',
        notes: 'Llamar antes al timbre',
        vehicleZoneId: 'zone-back',
        status: 'pending',
        scannedAt: new Date().toISOString(),
        coordinates: { lat: -34.6083, lng: -58.3794 }
      }
    ];
    setPackages(demoPackages);
  };

  const total = packages.length;
  const delivered = packages.filter((p) => p.status === 'delivered').length;
  const progressPercent = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Header Superior Fijo */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight tracking-tight">RepartoRápido</h1>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {total === 0 ? 'Vehículo sin carga' : `${delivered} de ${total} entregados (${progressPercent}%)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Alternar modo oscuro */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cambiar tema de color"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Finalizar día / Limpiar */}
            <button
              onClick={() => setIsEndOfDayOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 transition-colors"
              title="Cierre de jornada"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de progreso de entregas */}
        {total > 0 && (
          <div className="max-w-md mx-auto mt-2.5">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* Contenido Principal */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Banner para cargar datos de prueba si está vacía */}
        {packages.length === 0 && (
          <div className="bg-gradient-to-r from-brand-600 to-emerald-700 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm">¿Quieres probar la app de inmediato?</h3>
              <p className="text-xs text-brand-100 mt-0.5">
                Carga 4 paquetes de prueba para ver el mapa, zonas y checklist.
              </p>
            </div>
            <button
              onClick={handleLoadDemoData}
              className="px-3 py-2 bg-white text-brand-800 font-bold rounded-xl text-xs hover:bg-brand-50 flex items-center gap-1.5 flex-shrink-0 shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Probar demo
            </button>
          </div>
        )}

        {/* Pestaña 1: Carga y Escaneo */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            <PackageForm
              initialCode={scannedCode}
              zones={zones}
              onAddPackage={handleAddPackage}
              onOpenScanner={() => setIsScannerOpen(true)}
            />

            {/* Vista previa rápida de distribución en furgón */}
            {packages.length > 0 && (
              <VehicleMap
                zones={zones}
                packages={packages}
                selectedZoneId={selectedZoneId}
                onSelectZone={(z) => {
                  setSelectedZoneId(z);
                  setActiveTab('list');
                }}
              />
            )}
          </div>
        )}

        {/* Pestaña 2: Vehículo / Croquis */}
        {activeTab === 'vehicle' && (
          <div className="space-y-4">
            <VehicleMap
              zones={zones}
              packages={packages}
              selectedZoneId={selectedZoneId}
              onSelectZone={(z) => {
                setSelectedZoneId(z);
              }}
            />

            {selectedZoneId && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">
                    Paquetes en la zona seleccionada
                  </h4>
                  <button
                    onClick={() => setSelectedZoneId(null)}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400"
                  >
                    Ver todos
                  </button>
                </div>
                <PackageList
                  packages={packages}
                  zones={zones}
                  selectedZoneId={selectedZoneId}
                  onUpdateStatus={handleUpdateStatus}
                  onDeletePackage={handleDeletePackage}
                />
              </div>
            )}
          </div>
        )}

        {/* Pestaña 3: Mapa de Rutas */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <DeliveryMap packages={packages} zones={zones} />
            <div className="pt-2">
              <h4 className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400 mb-2">
                Listado de Paradas
              </h4>
              <PackageList
                packages={packages}
                zones={zones}
                onUpdateStatus={handleUpdateStatus}
                onDeletePackage={handleDeletePackage}
              />
            </div>
          </div>
        )}

        {/* Pestaña 4: Checklist de Entregas */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-600" />
                Checklist de Entregas
              </h3>
              {selectedZoneId && (
                <button
                  onClick={() => setSelectedZoneId(null)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400"
                >
                  Quitar filtro de zona
                </button>
              )}
            </div>
            <PackageList
              packages={packages}
              zones={zones}
              selectedZoneId={selectedZoneId}
              onUpdateStatus={handleUpdateStatus}
              onDeletePackage={handleDeletePackage}
            />
          </div>
        )}
      </main>

      {/* Modal / Overlay del Escáner de Cámara */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-md">
            <ScannerView
              onScan={handleScanSuccess}
              onClose={() => setIsScannerOpen(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* Modal de Cierre de Día */}
      <EndOfDayModal
        packages={packages}
        isOpen={isEndOfDayOpen}
        onClose={() => setIsEndOfDayOpen(false)}
        onConfirmClear={handleClearDay}
      />

      {/* Barra de Navegación Inferior Fija (Mobile Thumb Navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around p-2">
          {/* Tab 1: Carga */}
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'scan'
                ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 font-medium'
            }`}
          >
            <ScanLine className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Cargar</span>
          </button>

          {/* Tab 2: Vehículo */}
          <button
            onClick={() => setActiveTab('vehicle')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'vehicle'
                ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 font-medium'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Vehículo</span>
          </button>

          {/* Tab 3: Mapa */}
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'map'
                ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 font-medium'
            }`}
          >
            <MapIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Mapa</span>
          </button>

          {/* Tab 4: Lista Checklist */}
          <button
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all relative ${
              activeTab === 'list'
                ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 font-medium'
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">Entregas</span>
            {total > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                {total - delivered}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
