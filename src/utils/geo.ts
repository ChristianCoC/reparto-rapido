export interface GeoSuggestion {
  displayName: string;
  shortName: string;
  secondaryText: string;
  lat: number;
  lng: number;
}

// Búsqueda con autocompletado en tiempo real utilizando Photon (Komoot / OpenStreetMap) y Nominatim
// Soporta sesgo de proximidad (bias por coordenadas del conductor)
export async function searchAddressSuggestions(
  query: string,
  userLat?: number,
  userLng?: number
): Promise<GeoSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  const cleanQuery = query.trim();

  try {
    // 1. Intentar con Photon (diseñado específicamente para autocompletado rápido con proximidad GPS)
    let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=5`;
    if (userLat !== undefined && userLng !== undefined) {
      photonUrl += `&lat=${userLat}&lon=${userLng}`;
    }

    const photonRes = await fetch(photonUrl);
    if (photonRes.ok) {
      const data = await photonRes.json();
      if (data && data.features && data.features.length > 0) {
        return data.features.map((f: {
          geometry: { coordinates: [number, number] };
          properties: {
            name?: string;
            street?: string;
            housenumber?: string;
            city?: string;
            district?: string;
            state?: string;
            country?: string;
          };
        }) => {
          const p = f.properties;
          const [lon, lat] = f.geometry.coordinates;

          // Construir nombre corto principal (Calle y Número)
          const streetPart = p.street
            ? `${p.street} ${p.housenumber || ''}`.trim()
            : (p.name || cleanQuery);

          // Construir subtítulo (Localidad, Barrio, Provincia)
          const secondaryParts = [p.district, p.city, p.state, p.country].filter(Boolean);
          const secondaryText = secondaryParts.join(', ');

          return {
            shortName: streetPart,
            secondaryText: secondaryText || 'Ubicación encontrada',
            displayName: `${streetPart}, ${secondaryText}`,
            lat,
            lng: lon
          };
        });
      }
    }
  } catch (err) {
    console.warn('Photon autocomplete falló, probando Nominatim:', err);
  }

  // 2. Respaldo con Nominatim si Photon no responde
  try {
    let nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=5&addressdetails=1`;
    if (userLat !== undefined && userLng !== undefined) {
      // Priorizar un radio alrededor del usuario (viewbox)
      const delta = 0.5; // ~50km
      nomUrl += `&viewbox=${userLng - delta},${userLat + delta},${userLng + delta},${userLat - delta}`;
    }

    const nomRes = await fetch(nomUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RepartoRapidoApp/2.0'
      }
    });

    if (nomRes.ok) {
      const items = await nomRes.json();
      return items.map((item: {
        lat: string;
        lon: string;
        display_name: string;
        address?: {
          road?: string;
          house_number?: string;
          neighbourhood?: string;
          suburb?: string;
          city?: string;
          town?: string;
          state?: string;
        };
      }) => {
        const addr = item.address || {};
        const street = addr.road
          ? `${addr.road} ${addr.house_number || ''}`.trim()
          : item.display_name.split(',')[0];

        const secondary = [
          addr.neighbourhood || addr.suburb,
          addr.city || addr.town,
          addr.state
        ].filter(Boolean).join(', ');

        return {
          shortName: street,
          secondaryText: secondary || item.display_name,
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      });
    }
  } catch (err) {
    console.error('Error en búsqueda de direcciones:', err);
  }

  return [];
}

// Enlaces directos a Google Maps o Waze para navegación
export function getNavigationLinks(address: string, lat?: number, lng?: number) {
  const query = lat !== undefined && lng !== undefined ? `${lat},${lng}` : encodeURIComponent(address);
  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    waze: `https://waze.com/ul?q=${query}&navigate=yes`
  };
}
