import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Search, MapPin, Navigation, Compass, AlertCircle, Loader2 } from 'lucide-react';
import { geocodeAddress, getNavigationLinks } from '../utils/geo';

export const DeliveryMap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchedPoint, setSearchedPoint] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Buenos Aires o centro por defecto
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([-34.6037, -58.3816], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Intentar obtener ubicación GPS inicial del conductor
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(coords);
          map.setView([coords.lat, coords.lng], 14);

          // Marcador de conductor
          const driverIcon = L.divIcon({
            className: 'driver-gps-pin',
            html: `<div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.6);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: driverIcon }).addTo(map);
        },
        () => {
          console.log('GPS no disponible o denegado');
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Calcular distancia Haversine en km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Buscar dirección en el mapa
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    const result = await geocodeAddress(searchQuery);
    setSearching(false);

    if (result && mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      setSearchedPoint({ lat: result.lat, lng: result.lng, address: searchQuery });

      if (currentLocation) {
        const dist = calculateDistance(currentLocation.lat, currentLocation.lng, result.lat, result.lng);
        setDistanceKm(dist);
      }

      // Remover marcador previo
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }

      // Pin rojo de destino
      const destIcon = L.divIcon({
        className: 'dest-pin',
        html: `
          <div style="background-color: #ef4444; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
            <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">📍</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      const marker = L.marker([result.lat, result.lng], { icon: destIcon }).addTo(map);
      marker.bindPopup(`<b>${searchQuery}</b>`).openPopup();
      searchMarkerRef.current = marker;

      // Centrar y hacer zoom
      map.setView([result.lat, result.lng], 15);
    } else {
      alert('No pudimos ubicar esa dirección. Prueba agregando la ciudad o localidad (ej: "Av. Rivadavia 4500, Almagro").');
    }
  };

  // Centrar en ubicación del conductor
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentLocation(coords);
      mapInstanceRef.current?.setView([coords.lat, coords.lng], 15);
    });
  };

  const navLinks = searchedPoint ? getNavigationLinks(searchedPoint.address, searchedPoint.lat, searchedPoint.lng) : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-brand-600" />
          Verificador y Ubicación de Direcciones
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Busca cualquier dirección para ver si te queda cerca o comprobar la zona
        </p>
      </div>

      {/* Buscador de Direcciones */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej: Av. Rivadavia 4500, CABA"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-brand-600/20 disabled:opacity-50 flex-shrink-0"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          <span>Ubicar</span>
        </button>
      </form>

      {/* Resultado de búsqueda / Distancia */}
      {searchedPoint && (
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Destino ubicado
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                {searchedPoint.address}
              </h4>
            </div>

            {distanceKm !== null && (
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                distanceKm <= 3
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : distanceKm <= 10
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                A {distanceKm} km
              </span>
            )}
          </div>

          {navLinks && (
            <div className="flex gap-2">
              <a
                href={navLinks.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                Navegar con Google Maps
              </a>
              <a
                href={navLinks.waze}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                Abrir en Waze
              </a>
            </div>
          )}
        </div>
      )}

      {/* Visor de Mapa con botón GPS flotante */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div ref={mapContainerRef} className="w-full h-full z-0"></div>

        <button
          onClick={handleLocateMe}
          className="absolute bottom-4 right-4 z-[400] p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-transform active:scale-95"
          title="Centrar en mi ubicación GPS"
        >
          <Compass className="w-5 h-5 text-brand-600" />
        </button>
      </div>
    </div>
  );
};
