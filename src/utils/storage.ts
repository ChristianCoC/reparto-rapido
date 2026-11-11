import { PackageItem, VehicleZone, DEFAULT_VEHICLE_ZONES } from '../types';

const PACKAGES_KEY = 'reparto_rapido_packages_v1';
const ZONES_KEY = 'reparto_rapido_zones_v1';

export const storage = {
  getPackages(): PackageItem[] {
    try {
      const data = localStorage.getItem(PACKAGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error cargando paquetes de localStorage', e);
      return [];
    }
  },

  savePackages(packages: PackageItem[]) {
    try {
      localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
    } catch (e) {
      console.error('Error guardando paquetes en localStorage', e);
    }
  },

  getZones(): VehicleZone[] {
    try {
      const data = localStorage.getItem(ZONES_KEY);
      return data ? JSON.parse(data) : DEFAULT_VEHICLE_ZONES;
    } catch (e) {
      return DEFAULT_VEHICLE_ZONES;
    }
  },

  saveZones(zones: VehicleZone[]) {
    try {
      localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
    } catch (e) {
      console.error('Error guardando zonas', e);
    }
  },

  // Limpiar toda la jornada
  clearDay() {
    try {
      localStorage.removeItem(PACKAGES_KEY);
    } catch (e) {
      console.error('Error limpiando jornada', e);
    }
  }
};
