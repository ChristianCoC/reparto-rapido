import React, { useState, useEffect } from 'react';
import { PackageItem, VehicleZone } from '../types';
import { Truck, Hash, Plus, Check, Camera, Sparkles, ScanText } from 'lucide-react';
import { geocodeAddress } from '../utils/geo';
import { feedback } from '../utils/feedback';
import { ParsedLabelData } from '../utils/labelParser';

interface PackageFormProps {
  initialCode?: string;
  initialData?: ParsedLabelData | null;
  zones: VehicleZone[];
  onAddPackage: (pkg: PackageItem) => void;
  onOpenScanner: () => void;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  initialCode = '',
  initialData,
  zones,
  onAddPackage,
  onOpenScanner
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialCode);
  const [address, setAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[1]?.id || zones[0]?.id || '');
  const [autoFilled, setAutoFilled] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Helper para asignar zona según la letra (A, B, C, D, E)
  const assignZoneFromLetter = (letter: string) => {
    const clean = letter.toUpperCase();
    const matchedZone = zones.find((z) => z.code.startsWith(clean) || z.name.toUpperCase().includes(clean));
    if (matchedZone) {
      setSelectedZoneId(matchedZone.id);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setTrackingNumber(initialCode);
      const letterMatch = initialCode.replace(/^#/, '').match(/^([A-E])/i);
      if (letterMatch) {
        assignZoneFromLetter(letterMatch[1]);
      }
    }
  }, [initialCode]);

  useEffect(() => {
    if (initialData) {
      const codeToUse = initialData.routeCode || (initialData.zoneLetter ? `ZONA ${initialData.zoneLetter}` : initialData.trackingId) || '';
      if (codeToUse) setTrackingNumber(codeToUse);

      if (initialData.zoneLetter) {
        assignZoneFromLetter(initialData.zoneLetter);
      } else if (codeToUse) {
        const letterMatch = codeToUse.replace(/^#/, '').match(/^([A-E])/i);
        if (letterMatch) assignZoneFromLetter(letterMatch[1]);
      }

      setAutoFilled(true);
      setTimeout(() => setAutoFilled(false), 5000);
    }
  }, [initialData]);

  const handleTrackingChange = (val: string) => {
    setTrackingNumber(val);
    const letterMatch = val.replace(/^#/, '').match(/^([A-E])/i);
    if (letterMatch) {
      assignZoneFromLetter(letterMatch[1]);
    }
  };

  // Selector rápido de letra para el cartel (A, B, C, D, E)
  const handleQuickLetter = (letter: string) => {
    assignZoneFromLetter(letter);
    // Si el campo está vacío o no tiene esa letra, sugerir el prefijo
    if (!trackingNumber.toUpperCase().startsWith(`#${letter}`)) {
      setTrackingNumber(`#${letter}-`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = trackingNumber.trim() || `PAQUETE-${Date.now().toString().slice(-4)}`;

    const newPackage: PackageItem = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      trackingNumber: finalCode,
      recipient: recipient.trim() || undefined,
      address: address.trim() || 'Zona Asignada',
      notes: notes.trim() || undefined,
      vehicleZoneId: selectedZoneId,
      status: 'pending',
      scannedAt: new Date().toISOString(),
    };

    feedback.playScanSuccess();
    onAddPackage(newPackage);

    // Resetear manteniendo la zona elegida para seguir cargando paquetes de esa misma zona
    setTrackingNumber('');
    setAddress('');
    setRecipient('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-900 dark:text-white">
            <Truck className="w-5 h-5 text-amber-500" />
            Carga de Paquetes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identifica por el cartel [Letra] y #Código
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Camera className="w-4 h-4 text-slate-950" />
          <span>Escanear Cartel</span>
        </button>
      </div>

      {/* Notificación si fue capturado por OCR */}
      {autoFilled && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>¡Cartel detectado con éxito! Se asignó la zona automáticamente.</span>
        </div>
      )}

      {/* Cartel / Código Principal (#BD-32) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Cartel / Código (ej: #BD-32)
          </label>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
            Escribe ej: BD32 o escanea
          </span>
        </div>
        <div className="relative">
          <Hash className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => handleTrackingChange(e.target.value)}
            placeholder="Ej: #BD-32"
            autoFocus
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-black tracking-wide text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* Botones de letras rápidas (A, B, C, D, E) */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11px] font-bold text-slate-400">Rápido:</span>
          {['A', 'B', 'C', 'D', 'E'].map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => handleQuickLetter(letter)}
              className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950 text-slate-800 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 font-black text-xs border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Selector visual de Zona del Vehículo */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
          Ubicación en el Vehículo
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {zones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={`flex flex-col items-start p-2.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: zone.color }}
                  >
                    {zone.code}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate w-full">
                  {zone.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">
                  {zone.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campos adicionales opcionales (colapsables) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 flex items-center gap-1"
        >
          {showAdvanced ? '▲ Ocultar campos opcionales' : '▼ Agregar notas o dirección (opcional)'}
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-3 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Dirección (Opcional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Calle Rivadavia 4616"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Notas / Referencia
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Timbre 3B"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Botón principal */}
      <button
        type="submit"
        className="w-full py-4 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 active:scale-[0.99] transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>Cargar Paquete al Vehículo</span>
      </button>
    </form>
  );
};
