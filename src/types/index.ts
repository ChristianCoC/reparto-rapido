export type VehicleZoneId = 'copiloto' | 'atras' | 'baul';

export interface VehicleZone {
  id: VehicleZoneId;
  name: string;
  code: string;
  color: string;
  description: string;
}

export type DeliveryStatus = 'pending' | 'delivered';

export interface PackageItem {
  id: string;
  code: string; // Ej: "#HH58"
  zoneId: VehicleZoneId;
  status: DeliveryStatus;
  createdAt: string;
  deliveredAt?: string;
  notes?: string;
}

export const VEHICLE_ZONES: VehicleZone[] = [
  { id: 'copiloto', code: 'COP', name: 'Copiloto', color: '#3b82f6', description: 'Asiento delantero / Inmediatas' },
  { id: 'atras', code: 'ATR', name: 'Atrás', color: '#10b981', description: 'Asientos traseros / Carga media' },
  { id: 'baul', code: 'BAU', name: 'Baúl', color: '#f59e0b', description: 'Baúl / Fondo del vehículo' },
];
