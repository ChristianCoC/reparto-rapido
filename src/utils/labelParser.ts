export interface ParsedLabelData {
  trackingId?: string;
  routeCode?: string;       // Ej: "#BD-32" o "BD-32"
  zoneLetter?: string;      // Ej: "B"
  recipient?: string;       // Ej: "Adriana Castaño"
  address?: string;         // Ej: "Calle Rivadavia 4616"
  postalCode?: string;      // Ej: "1650"
  notes?: string;           // Ej: "3er piso dpto 3"
  rawText?: string;
}

/**
 * Procesa tanto el JSON que devuelve el QR como el texto OCR leído de la etiqueta
 */
export function parseLabelContent(input: string): ParsedLabelData {
  const result: ParsedLabelData = {
    rawText: input
  };

  const trimmed = input.trim();

  // 1. Verificar si es un JSON (el caso del QR de Mercado Libre: {"id":"48455648099","t":"lm"})
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.id) {
        result.trackingId = String(obj.id);
      }
      return result;
    } catch {
      // Si falla, continuar procesando como texto
    }
  }

  // Si es un número limpio de 10-14 dígitos (código de barras directo)
  if (/^\d{9,15}$/.test(trimmed)) {
    result.trackingId = trimmed;
    return result;
  }

  // 2. Procesamiento de Texto OCR (cuando lee la etiqueta física)
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);

  // A. Buscar código de etiqueta / sticker (#BD-32, #BD32, ETIQUETA: #BD-32, etc.)
  const etiquetaMatch = trimmed.match(/ETIQUETA[:\s]*#?([A-Z0-9-]+)/i) ||
                        trimmed.match(/#([A-Z]{1,3}[ -]?[0-9]{1,4})/i) ||
                        trimmed.match(/\b([A-Z]{1,2}[ -]?[0-9]{2,4})\b/);
  if (etiquetaMatch) {
    const code = etiquetaMatch[1].toUpperCase().replace(/\s+/g, '-');
    result.routeCode = code.startsWith('#') ? code : `#${code}`;
    // La primera letra suele indicar la zona (ej: "BD-32" -> "B")
    const letterMatch = code.match(/^[#]?([A-Z])/);
    if (letterMatch) {
      result.zoneLetter = letterMatch[1];
    }
  }

  // Si no encontró por regex de etiqueta pero hay una letra B grande o similar
  if (!result.zoneLetter) {
    const singleLetterMatch = trimmed.match(/\b([A-E])\b\s*(?:SD\d|\d\s*SD)/i) ||
                              trimmed.match(/PUNTO\s*\(([A-Z])\)/i);
    if (singleLetterMatch) {
      result.zoneLetter = singleLetterMatch[1].toUpperCase();
    }
  }

  // B. Buscar Domicilio / Dirección
  const domicilioMatch = trimmed.match(/Domicilio[:\s]+([^\n\r]+)/i) ||
                         trimmed.match(/Direcci[oó]n[:\s]+([^\n\r]+)/i) ||
                         trimmed.match(/(Calle\s+[^\n\r,]+(?:\d+)[^\n\r,]*)/i) ||
                         trimmed.match(/(Av\.?\s+[^\n\r,]+(?:\d+)[^\n\r,]*)/i);
  if (domicilioMatch) {
    result.address = domicilioMatch[1].trim();
  }

  // C. Buscar Código Postal (CP: 1650)
  const cpMatch = trimmed.match(/CP[:\s]*([0-9]{4})/i);
  if (cpMatch) {
    result.postalCode = cpMatch[1];
    if (result.address && !result.address.includes(result.postalCode)) {
      result.address = `${result.address}, CP ${result.postalCode}`;
    }
  }

  // D. Buscar Nombre de Destinatario (ej: "Adriana Castaño (CAAD5994294)")
  const nombreMatch = trimmed.match(/([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,35})\s*\([A-Z0-9]{5,15}\)/);
  if (nombreMatch) {
    result.recipient = nombreMatch[1].trim();
  } else {
    // Si no tiene el código entre paréntesis, buscar la línea anterior a "Domicilio:"
    const domIndex = lines.findIndex((l) => /Domicilio/i.test(l));
    if (domIndex > 0 && lines[domIndex - 1].length < 40 && !/CP|FBA|SBU|BOLT/i.test(lines[domIndex - 1])) {
      result.recipient = lines[domIndex - 1].replace(/\(.*\)/, '').trim();
    }
  }

  // E. Buscar Referencia / Observaciones (ej: "Referencia: 3er piso dpto 3")
  const refMatch = trimmed.match(/Referencia[:\s]+([^\n\r]+)/i);
  if (refMatch) {
    result.notes = refMatch[1].trim();
  }

  // F. Buscar ID de paquete si está en el texto (ej: "ID: 48455648099")
  const idMatch = trimmed.match(/ID[:\s]*([0-9]{9,15})/i) ||
                  trimmed.match(/\b([0-9]{11})\b/);
  if (idMatch) {
    result.trackingId = idMatch[1];
  }

  return result;
}
