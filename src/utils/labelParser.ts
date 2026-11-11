export interface ParsedLabelData {
  trackingId?: string;
  routeCode?: string;       // Ej: "#BD-32" o "BD-32"
  zoneLetter?: string;      // Ej: "B"
  packageNumber?: string;   // Ej: "32"
  rawText?: string;
}

/**
 * Extrae específicamente el cartel de ruteo: Letra de Zona (B) y Código (#BD-32)
 */
export function parseLabelContent(input: string): ParsedLabelData {
  const result: ParsedLabelData = {
    rawText: input
  };

  const trimmed = input.trim();

  // 1. Si vino del escáner de barras o QR de Mercado Libre (ej: {"id":"48455648099","t":"lm"} o 48455648099)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.id) result.trackingId = String(obj.id);
    } catch {
      // Ignorar si no es JSON válido
    }
  } else if (/^\d{9,15}$/.test(trimmed)) {
    result.trackingId = trimmed;
  }

  // 2. Extracción de Código de Etiqueta (#BD-32, #BD32, BD-32, etc.)
  // Busca patrones como: #BD-32, #BD32, ETIQUETA: #BD-32, BD 32
  const etiquetaMatch = trimmed.match(/ETIQUETA[:\s]*#?([A-Z]{1,2}[ -]?[0-9]{1,4})/i) ||
                        trimmed.match(/#([A-Z]{1,2}[ -]?[0-9]{1,4})/i) ||
                        trimmed.match(/\b([A-Z]{1,2}[ -][0-9]{1,4})\b/i) ||
                        trimmed.match(/\b([A-Z]{1,2}[0-9]{2,4})\b/i);

  if (etiquetaMatch) {
    const rawCode = etiquetaMatch[1].toUpperCase().replace(/\s+/g, '-');
    const formatted = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;
    result.routeCode = formatted;

    // Extraer número de parada (ej: "32")
    const numMatch = formatted.match(/(\d+)/);
    if (numMatch) {
      result.packageNumber = numMatch[1];
    }

    // La primera letra de #BD-32 indica la zona logística (B)
    const firstLetter = formatted.replace(/^#/, '').charAt(0);
    if (/^[A-E]$/i.test(firstLetter)) {
      result.zoneLetter = firstLetter;
    }
  }

  // 3. Buscar la letra de zona grande (B) si no vino en el código
  if (!result.zoneLetter) {
    // Buscar la letra grande que suele estar sola o junto a SD
    const letterMatch = trimmed.match(/\b([A-E])\b\s*(?:SD|\d|PUNTO)/i) ||
                        trimmed.match(/(?:SD\d|\d\s*SD)\s*\b([A-E])\b/i) ||
                        trimmed.match(/PUNTO\s*\(([A-E])\)/i);
    if (letterMatch) {
      result.zoneLetter = letterMatch[1].toUpperCase();
    }
  }

  // 4. Si aún no tenemos routeCode pero tenemos la letra de zona, armar uno representativo
  if (!result.routeCode && result.zoneLetter) {
    result.routeCode = result.packageNumber 
      ? `#${result.zoneLetter}-${result.packageNumber}`
      : `ZONA ${result.zoneLetter}`;
  }

  return result;
}
