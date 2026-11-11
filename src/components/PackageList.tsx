import React, { useState } from 'react';
import { PackageItem, VehicleZone, DeliveryStatus } from '../types';
import { CheckCircle2, Circle, Navigation, Trash2, User, FileText, AlertTriangle, Box, MapPin } from 'lucide-react';
import { getNavigationLinks } from '../utils/geo';
import { feedback } from '../utils/feedback';

interface PackageListProps {
  packages: PackageItem[];
  zones: VehicleZone[];
  selectedZoneId?: string | null;
  onUpdateStatus: (id: string, status: DeliveryStatus, reason?: string) => void;
  onDeletePackage: (id: string) => void;
}

export const PackageList: React.FC<PackageListProps> = ({
  packages,
  zones,
  selectedZoneId,
  onUpdateStatus,
  onDeletePackage,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [failedModalPkgId, setFailedModalPkgId] = useState<string | null>(null);
  const [failedReason, setFailedReason] = useState('Cliente ausente');

  // Filtrado
  const filteredPackages = packages.filter((p) => {
    if (selectedZoneId && p.vehicleZoneId !== selectedZoneId) return false;
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'delivered') return p.status === 'delivered';
    return true;
  });

  const handleMarkDelivered = (pkg: PackageItem) => {
    feedback.playDelivered();
    onUpdateStatus(pkg.id, 'delivered');
  };

  const handleConfirmFailed = () => {
    if (failedModalPkgId) {
      onUpdateStatus(failedModalPkgId, 'failed', failedReason);
      setFailedModalPkgId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Pestañas de filtro de estado */}
      <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Todos ({packages.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'pending'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Pendientes ({packages.filter((p) => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            filter === 'delivered'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Entregados ({packages.filter((p) => p.status === 'delivered').length})
        </button>
      </div>

      {filteredPackages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
          <Box className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-medium">No hay paquetes en esta lista</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPackages.map((pkg, index) => {
            const zone = zones.find((z) => z.id === pkg.vehicleZoneId);
            const isDelivered = pkg.status === 'delivered';
            const isFailed = pkg.status === 'failed';
            const hasRealAddress = pkg.address && pkg.address !== 'Dirección a confirmar';
            const navLinks = hasRealAddress ? getNavigationLinks(pkg.address, pkg.coordinates?.lat, pkg.coordinates?.lng) : null;

            return (
              <div
                key={pkg.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDelivered
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : isFailed
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Botón Tachar / Tildar grande */}
                  <button
                    onClick={() => {
                      if (isDelivered) {
                        onUpdateStatus(pkg.id, 'pending');
                      } else {
                        handleMarkDelivered(pkg);
                      }
                    }}
                    className="mt-1 flex-shrink-0 text-slate-400 hover:text-brand-600 active:scale-90 transition-transform"
                    title={isDelivered ? 'Desmarcar entrega' : 'Marcar como entregado'}
                  >
                    {isDelivered ? (
                      <CheckCircle2 className="w-8 h-8 text-brand-600 fill-brand-100 dark:fill-brand-950" />
                    ) : (
                      <Circle className="w-8 h-8 hover:text-brand-500" />
                    )}
                  </button>

                  {/* Datos del paquete con Cartel #BD-32 como TÍTULO PRINCIPAL */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Badge de Zona en el auto */}
                      {zone && (
                        <span
                          className="px-2.5 py-0.5 rounded-lg text-xs font-black text-white shadow-xs"
                          style={{ backgroundColor: zone.color }}
                        >
                          {zone.code} - {zone.name}
                        </span>
                      )}

                      <span className="text-xs text-slate-400 font-mono">
                        Parada #{index + 1}
                      </span>

                      {isDelivered && (
                        <span className="text-[11px] font-bold text-brand-700 dark:text-brand-400 bg-brand-100 dark:bg-brand-950 px-2 py-0.5 rounded-full">
                          ✓ Entregado
                        </span>
                      )}

                      {isFailed && (
                        <span className="text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full">
                          ✗ {pkg.failureReason || 'No entregado'}
                        </span>
                      )}
                    </div>

                    {/* Cartel / Código de Ruteo destacado en grande */}
                    <h3
                      className={`font-black text-xl tracking-tight ${
                        isDelivered
                          ? 'line-through text-slate-500 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {pkg.trackingNumber}
                    </h3>

                    {/* Si tiene dirección real la mostramos, sino indicamos la zona */}
                    {hasRealAddress ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className={isDelivered ? 'line-through' : ''}>{pkg.address}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Guardado en: <strong>{zone?.name || 'Zona Asignada'}</strong>
                      </p>
                    )}

                    {pkg.recipient && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {pkg.recipient}
                      </p>
                    )}

                    {pkg.notes && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md mt-1.5 flex items-center gap-1.5 border border-amber-200/60 dark:border-amber-900/40">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{pkg.notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Barra de acciones */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-3 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    {navLinks && (
                      <a
                        href={navLinks.googleMaps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg font-semibold flex items-center gap-1 border border-blue-200 dark:border-blue-900"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Maps
                      </a>
                    )}

                    {!isDelivered && (
                      <button
                        onClick={() => setFailedModalPkgId(pkg.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Incidencia
                      </button>
                    )}
                  </div>

                  {/* Borrar de la lista */}
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar paquete ${pkg.trackingNumber} de la carga?`)) {
                        onDeletePackage(pkg.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                    title="Eliminar paquete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Incidencia */}
      {failedModalPkgId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Marcar Incidencia de Entrega
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Motivo:
              </label>
              <select
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100"
              >
                <option value="Cliente ausente">Cliente ausente</option>
                <option value="Dirección incorrecta / no encontrada">Dirección incorrecta / no encontrada</option>
                <option value="Paquete rechazado por el cliente">Paquete rechazado por el cliente</option>
                <option value="Zona inaccesible / fuera de horario">Zona inaccesible / fuera de horario</option>
                <option value="Paquete dañado">Paquete dañado</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFailedModalPkgId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFailed}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
