import React, { useState, useEffect } from 'react';
import { PackageItem, VehicleZone } from '../types';
import { Truck, MapPin, Hash, Plus, Check, User, FileText, Camera } from 'lucide-react';
import { geocodeAddress } from '../utils/geo';
import { feedback } from '../utils/feedback';

interface PackageFormProps {
  initialCode?: string;
  zones: VehicleZone[];
  onAddPackage: (pkg: PackageItem) => void;
  onOpenScanner: () => void;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  initialCode = '',
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

  useEffect(() => {
    if (initialCode) {
      setTrackingNumber(initialCode);
    }
  }, [initialCode]);

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

    // Resetear formulario para el siguiente paquete manteniendo la zona o dejándola lista
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
          Ingreso y Ubicación de Paquete
        </h3>
        <button
          type="button"
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-semibold border border-brand-200 dark:border-brand-800 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Escanear Cámara
        </button>
      </div>

      {/* Código / Número de paquete */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Código de Paquete (Barras / QR / ID)
        </label>
        <div className="relative">
          <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Ej: AR982341235 o escanea con la cámara"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>
      </div>

      {/* Selector visual de Zona del Vehículo */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
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
            placeholder="Ej: Av. Corrientes 1234, CABA"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Destinatario y Observaciones (acordeón o campos compactos) */}
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
              placeholder="Nombre del cliente"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Notas / Timbre (Opcional)
          </label>
          <div className="relative">
            <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Dejar en portería, piso 3B"
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
