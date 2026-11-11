import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PackageItem, VehicleZone } from '../types';
import { getNavigationLinks } from '../utils/geo';
import { Navigation, MapPin } from 'lucide-react';

interface DeliveryMapProps {
  packages: PackageItem[];
  zones: VehicleZone[];
  onSelectPackage?: (pkg: PackageItem) => void;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({ packages, zones }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filtrar paquetes con coordenadas
  const locatedPackages = packages.filter((p) => p.coordinates);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inicializar mapa si no existe
    if (!mapInstanceRef.current) {
      // Coordenadas por defecto (ej: Buenos Aires, o centrado general)
      const defaultLat = -34.6037;
      const defaultLng = -58.3816;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([defaultLat, defaultLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    const bounds = L.latLngBounds([]);

    locatedPackages.forEach((pkg, index) => {
      if (!pkg.coordinates) return;
      const { lat, lng } = pkg.coordinates;
      bounds.extend([lat, lng]);

      const zone = zones.find((z) => z.id === pkg.vehicleZoneId);
      const isDelivered = pkg.status === 'delivered';
      const isFailed = pkg.status === 'failed';

      const pinColor = isDelivered ? '#10b981' : isFailed ? '#ef4444' : (zone?.color || '#3b82f6');
      const navLinks = getNavigationLinks(pkg.address, lat, lng);

      // Crear icono HTML personalizado
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-weight: 800;
              font-size: 11px;
            ">${index + 1}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; background: ${zone?.color || '#333'}; color: white; padding: 2px 6px; border-radius: 4px;">
              ${zone?.code || 'ZONA'} - ${zone?.name || ''}
            </span>
            <span style="font-size: 11px; font-weight: bold; color: ${isDelivered ? '#10b981' : '#64748b'};">
              ${isDelivered ? '✓ Entregado' : '# ' + (index + 1)}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">
            ${pkg.address}
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-bottom: 8px;">
            ID: ${pkg.trackingNumber}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <a href="${navLinks.googleMaps}" target="_blank" rel="noopener noreferrer" style="
              flex: 1;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              text-align: center;
              padding: 6px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              display: block;
            ">
              Google Maps ↗
            </a>
            <a href="${navLinks.waze}" target="_blank" rel="noopener noreferrer" style="
              flex: 1;
              background-color: #059669;
              color: white;
              text-decoration: none;
              text-align: center;
              padding: 6px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              display: block;
            ">
              Waze ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersGroup.addLayer(marker);
    });

    if (locatedPackages.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }

    // Invalidar tamaño para renderizado correcto en contenedores dinámicos
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [packages, zones, locatedPackages.length]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Navigation className="w-5 h-5 text-brand-600" />
            Mapa de Rutas y Paradas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {locatedPackages.length} de {packages.length} paradas geolocalizadas
          </p>
        </div>
      </div>

      {locatedPackages.length === 0 ? (
        <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400">
          <MapPin className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm font-semibold">No hay paradas en el mapa todavía</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Escribe direcciones completas al cargar paquetes (ej: "Calle 123, Ciudad") para ver las paradas numeradas aquí.
          </p>
        </div>
      ) : (
        <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div ref={mapContainerRef} className="w-full h-full z-0"></div>
        </div>
      )}
    </div>
  );
};
