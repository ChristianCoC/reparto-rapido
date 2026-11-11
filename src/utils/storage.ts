import { PackageItem } from '../types';

const STORAGE_KEY = 'reparto_rapido_packages_v2';

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

  clearDay() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error al limpiar la jornada', e);
    }
  }
};
