export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Geocodificación liviana con OpenStreetMap Nominatim (gratuito)
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // Respeto a las políticas de uso de Nominatim
        'User-Agent': 'RepartoRapidoApp/1.0'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (err) {
    console.warn('Geocodificación falló o sin red:', err);
  }
  return null;
}

// Enlaces directos a apps de navegación instaladas en el móvil
export function getNavigationLinks(address: string, lat?: number, lng?: number) {
  const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(address);
  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    waze: `https://waze.com/ul?q=${query}&navigate=yes`,
    appleMaps: `maps://?daddr=${query}`
  };
}
