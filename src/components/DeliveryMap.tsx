import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Search, MapPin, Navigation, Compass, Loader2, X, AlertTriangle } from 'lucide-react';
import { searchAddressSuggestions, getNavigationLinks, GeoSuggestion } from '../utils/geo';

export const DeliveryMap: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GeoSuggestion | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const defaultLat = -34.6037;
    const defaultLng = -58.3816;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Obtener ubicación GPS actual del conductor
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(coords);
          map.setView([coords.lat, coords.lng], 14);

          const driverIcon = L.divIcon({
            className: 'driver-gps-pin',
            html: `<div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37,99,235,0.6);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: driverIcon }).addTo(map);
        },
        (err) => {
          console.warn('GPS no disponible:', err);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Calcular distancia entre dos puntos (Haversine en km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Autocompletado mientras escribe (con debounce de 350ms)
  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchAddressSuggestions(
        query,
        currentLocation?.lat,
        currentLocation?.lng
      );
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, currentLocation]);

  // Cerrar dropdown si toca fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Seleccionar una dirección de la lista desplegable
  const handleSelectSuggestion = (item: GeoSuggestion) => {
    setSelectedPoint(item);
    setQuery(item.shortName);
    setIsOpen(false);

    if (currentLocation) {
      const dist = calculateDistance(currentLocation.lat, currentLocation.lng, item.lat, item.lng);
      setDistanceKm(dist);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Remover marcador previo de destino
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
    }

    // Pin de destino en rojo con icono
    const destIcon = L.divIcon({
      className: 'dest-pin',
      html: `
        <div style="background-color: #ef4444; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(239,68,68,0.4);">
          <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    const marker = L.marker([item.lat, item.lng], { icon: destIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <b style="font-size: 13px; color: #0f172a;">${item.shortName}</b>
        <p style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.secondaryText}</p>
      </div>
    `).openPopup();
    destMarkerRef.current = marker;

    // Animación suave hacia el destino
    map.flyTo([item.lat, item.lng], 16, { duration: 1.2 });
  };

  // Limpiar búsqueda
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedPoint(null);
    setDistanceKm(null);
    if (destMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
  };

  // Centrar en ubicación GPS del conductor
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCurrentLocation(coords);
      mapInstanceRef.current?.flyTo([coords.lat, coords.lng], 15);
    });
  };

  const navLinks = selectedPoint
    ? getNavigationLinks(selectedPoint.displayName, selectedPoint.lat, selectedPoint.lng)
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-brand-600" />
          Buscador y Verificador de Direcciones
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Escribe para ver sugerencias exactas y verificar si te queda cerca o lejos
        </p>
      </div>

      {/* Barra de Búsqueda con Autocompletado tipo Google Maps */}
      <div ref={dropdownRef} className="relative z-30">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder="Escribe calle y altura (ej: Rivadavia 4500)"
            className="w-full pl-12 pr-11 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-brand-500 transition-colors"
          />

          {loading ? (
            <Loader2 className="w-5 h-5 text-brand-500 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        {/* Menú Desplegable de Sugerencias en Tiempo Real */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 max-h-72 overflow-y-auto animate-in fade-in">
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full p-3.5 text-left flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 mt-0.5 flex-shrink-0">
                  <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {item.shortName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.secondaryText}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tarjeta de Información y Distancia al Destino Seleccionado */}
      {selectedPoint && (
        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Dirección seleccionada
              </span>
              <h4 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                {selectedPoint.shortName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedPoint.secondaryText}
              </p>
            </div>

            {distanceKm !== null && (
              <div className="text-right flex-shrink-0">
                <span
                  className={`inline-block px-3 py-1 rounded-xl text-xs font-black shadow-xs ${
                    distanceKm <= 3
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : distanceKm <= 10
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}
                >
                  {distanceKm <= 3 ? '🟢 Cerca' : distanceKm <= 10 ? '🔵 Media' : '🟡 Lejos'} ({distanceKm} km)
                </span>
              </div>
            )}
          </div>

          {/* Botones de navegación */}
          {navLinks && (
            <div className="flex gap-2 pt-1">
              <a
                href={navLinks.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                Google Maps
              </a>
              <a
                href={navLinks.waze}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                Waze
              </a>
            </div>
          )}
        </div>
      )}

      {/* Contenedor del Mapa con botón flotante GPS */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div ref={mapContainerRef} className="w-full h-full z-0"></div>

        <button
          onClick={handleLocateMe}
          className="absolute bottom-4 right-4 z-[400] p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-transform active:scale-90"
          title="Mi ubicación GPS actual"
        >
          <Compass className="w-5 h-5 text-brand-600" />
        </button>
      </div>
    </div>
  );
};
