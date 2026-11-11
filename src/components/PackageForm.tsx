import React, { useState, useEffect } from 'react';
import { PackageItem, VehicleZone } from '../types';
import { Truck, MapPin, Hash, Plus, Check, User, FileText, Camera, Sparkles, ScanText } from 'lucide-react';
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
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Helper para asignar zona según la letra detectada (A, B, C, D, E)
  const assignZoneFromLetter = (letter: string) => {
    const clean = letter.toUpperCase();
    const matchedZone = zones.find((z) => z.code.startsWith(clean) || z.name.toUpperCase().includes(clean));
    if (matchedZone) {
      setSelectedZoneId(matchedZone.id);
    }
  };

  // Reaccionar cuando se escanea con código simple
  useEffect(() => {
    if (initialCode) {
      setTrackingNumber(initialCode);
      // Si el código escrito empieza con una letra (ej: "BD-32" -> "B")
      const letterMatch = initialCode.replace(/^#/, '').match(/^([A-E])/i);
      if (letterMatch) {
        assignZoneFromLetter(letterMatch[1]);
      }
    }
  }, [initialCode]);

  // Reaccionar cuando el OCR o el QR parsean datos estructurados
  useEffect(() => {
    if (initialData) {
      let codeToUse = initialData.routeCode || initialData.trackingId || '';
      if (codeToUse) setTrackingNumber(codeToUse);

      if (initialData.address) setAddress(initialData.address);
      if (initialData.recipient) setRecipient(initialData.recipient);
      if (initialData.notes) setNotes(initialData.notes);

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

  // Si el usuario escribe manualmente "BD32", detectar automáticamente la zona B
  const handleTrackingChange = (val: string) => {
    setTrackingNumber(val);
    const letterMatch = val.replace(/^#/, '').match(/^([A-E])/i);
    if (letterMatch) {
      assignZoneFromLetter(letterMatch[1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim() && !address.trim()) {
      alert('Por favor ingresa al menos el código de paquete o la dirección');
      return;
    }

    setIsGeocoding(true);
    let coords: { lat: number; lng: number } | undefined;
    if (address.trim()) {
      const geo = await geocodeAddress(address);
      if (geo) coords = geo;
    }
    setIsGeocoding(false);

    const newPackage: PackageItem = {
      id: `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      trackingNumber: trackingNumber.trim() || `S/N-${Date.now().toString().slice(-4)}`,
      recipient: recipient.trim() || undefined,
      address: address.trim() || 'Dirección a confirmar',
      notes: notes.trim() || undefined,
      vehicleZoneId: selectedZoneId,
      status: 'pending',
      scannedAt: new Date().toISOString(),
      coordinates: coords
    };

    feedback.playScanSuccess();
    onAddPackage(newPackage);

    // Resetear formulario
    setTrackingNumber('');
    setAddress('');
    setRecipient('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-base flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Truck className="w-5 h-5 text-brand-600" />
          Carga y Ubicación de Paquete
        </h3>
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>Escanear / OCR</span>
        </button>
      </div>

      {/* Notificación de datos auto-rellenados por visión OCR */}
      {autoFilled && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>¡Datos extraídos automáticamente de la etiqueta! Revisa y confirma.</span>
        </div>
      )}

      {/* Código / Etiqueta de ruta (#BD-32) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Etiqueta / Código (ej: #BD-32 o ID)
          </label>
          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
            Auto-asigna la zona según la letra
          </span>
        </div>
        <div className="relative">
          <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => handleTrackingChange(e.target.value)}
            placeholder="Ej: #BD-32, 48455648099 o escanea"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>
      </div>

      {/* Selector visual de Zona del Vehículo */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Ubicación Asignada en el Vehículo
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {zones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 ring-2 ring-brand-500 shadow-sm'
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
                  {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">
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

      {/* Dirección */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Dirección de Entrega
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Calle Rivadavia 4616, CP 1650"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Destinatario y Observaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Destinatario (Opcional)
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Ej: Adriana Castaño"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Referencia / Timbre (Opcional)
          </label>
          <div className="relative">
            <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: 3er piso dpto 3"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Botón principal de guardar */}
      <button
        type="submit"
        disabled={isGeocoding}
        className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        <Plus className="w-5 h-5" />
        {isGeocoding ? 'Localizando y guardando...' : 'Cargar Paquete al Vehículo'}
      </button>
    </form>
  );
};
