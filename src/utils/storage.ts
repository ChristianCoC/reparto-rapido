import { PackageItem, VehicleZoneId } from '../types';

const STORAGE_KEY = 'reparto_rapido_packages_v2';
const ZONE_KEY = 'reparto_rapido_active_zone_v2';
const PREFIX_KEY = 'reparto_rapido_day_prefix_v2';

export const storage = {
  getPackages(): PackageItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al cargar paquetes', e);
      return [];
    }
  },

  savePackages(packages: PackageItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    } catch (e) {
      console.error('Error al guardar paquetes', e);
    }
  },

  getActiveZone(): VehicleZoneId {
    try {
      const zone = localStorage.getItem(ZONE_KEY);
      if (zone === 'copiloto' || zone === 'atras' || zone === 'baul') {
        return zone;
      }
    } catch {
      // fallback
    }
    return 'copiloto';
  },

  saveActiveZone(zone: VehicleZoneId) {
    try {
      localStorage.setItem(ZONE_KEY, zone);
    } catch (e) {
      console.error('Error guardando zona activa', e);
    }
  },

  getDayPrefix(): string {
    try {
      return localStorage.getItem(PREFIX_KEY) || '';
    } catch {
      return '';
    }
  },

  saveDayPrefix(prefix: string) {
    try {
      localStorage.setItem(PREFIX_KEY, prefix);
    } catch (e) {
      console.error('Error guardando prefijo del día', e);
    }
  },

  clearDay() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PREFIX_KEY);
    } catch (e) {
      console.error('Error al limpiar la jornada', e);
    }
  }
};
