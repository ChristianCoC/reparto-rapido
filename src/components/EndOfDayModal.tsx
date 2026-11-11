import React from 'react';
import { PackageItem } from '../types';
import { Trash2, CheckCircle2, AlertTriangle, Clock, X, Download } from 'lucide-react';

interface EndOfDayModalProps {
  packages: PackageItem[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
}

export const EndOfDayModal: React.FC<EndOfDayModalProps> = ({
  packages,
  isOpen,
  onClose,
  onConfirmClear
}) => {
  if (!isOpen) return null;

  const total = packages.length;
  const delivered = packages.filter((p) => p.status === 'delivered').length;
  const failed = packages.filter((p) => p.status === 'failed').length;
  const pending = packages.filter((p) => p.status === 'pending').length;
  const percentage = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const handleExportSummary = () => {
    const textReport = `REPORTE DE JORNADA DE ENTREGAS
Fecha: ${new Date().toLocaleDateString()}
Total Paquetes: ${total}
Entregados: ${delivered} (${percentage}%)
Incidencias: ${failed}
Pendientes: ${pending}

DETALLE:
${packages.map((p, i) => `${i + 1}. [${p.status.toUpperCase()}] ${p.trackingNumber} - ${p.address} (Zona: ${p.vehicleZoneId})`).join('\n')}
`;
    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-reparto-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg">
            <Trash2 className="w-5 h-5 text-red-500" />
            Cierre de Jornada
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del día */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 p-3 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-brand-600 mx-auto mb-1" />
            <div className="text-xl font-black text-brand-700 dark:text-brand-300">{delivered}</div>
            <div className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">Entregados</div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl">
            <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">{pending}</div>
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Pendientes</div>
          </div>

          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <div className="text-xl font-black text-red-700 dark:text-red-300">{failed}</div>
            <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">Incidencias</div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tasa de efectividad
          </span>
          <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
            {percentage}%
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Al confirmar, <strong>se eliminarán todos los paquetes cargados</strong> para dejar la aplicación lista y vacía para mañana.
        </p>

        {/* Acciones */}
        <div className="space-y-2">
          {total > 0 && (
            <button
              onClick={handleExportSummary}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Resumen en Texto
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirmClear();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95"
            >
              Limpiar y Cerrar Día
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
