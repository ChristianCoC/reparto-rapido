export interface VehicleZone {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
}

export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface PackageItem {
  id: string;
  trackingNumber: string;
  recipient?: string;
  address: string;
  notes?: string;
  vehicleZoneId: string;
  status: DeliveryStatus;
  scannedAt: string;
  deliveredAt?: string;
  failureReason?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const DEFAULT_VEHICLE_ZONES: VehicleZone[] = [
  { id: 'zone-copilot', code: 'A1', name: 'Copiloto / Cabina', color: '#3b82f6', description: 'Próximas entregas inmediatas' },
  { id: 'zone-front', code: 'B1', name: 'Fila 1 (Delante)', color: '#10b981', description: 'Parte delantera de carga' },
  { id: 'zone-middle', code: 'C1', name: 'Fila 2 (Medio)', color: '#f59e0b', description: 'Zona central del vehículo' },
  { id: 'zone-side', code: 'D1', name: 'Puerta Lateral', color: '#8b5cf6', description: 'Fácil acceso lateral' },
  { id: 'zone-back', code: 'E1', name: 'Fondo / Baúl', color: '#ef4444', description: 'Entregas del final de ruta' },
];
