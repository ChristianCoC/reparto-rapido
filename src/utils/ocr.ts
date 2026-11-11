import { createWorker } from 'tesseract.js';
import { parseLabelContent, ParsedLabelData } from './labelParser';

let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      // Usamos español e inglés para que reconozca tanto caracteres hispanos como números de ruta
      const worker = await createWorker(['spa', 'eng']);
      return worker;
    })();
  }
  return workerPromise;
}

export interface OcrProgress {
  status: string;
  progress: number;
}

/**
 * Procesa una imagen (File, Blob, Canvas o base64 URL) y extrae los datos de la etiqueta
 */
export async function recognizeLabelImage(
  imageSource: File | Blob | HTMLCanvasElement | string,
  onProgress?: (p: OcrProgress) => void
): Promise<ParsedLabelData> {
  try {
    if (onProgress) {
      onProgress({ status: 'Iniciando escáner de visión...', progress: 0.1 });
    }

    const worker = await getWorker();

    if (onProgress) {
      onProgress({ status: 'Leyendo texto de la etiqueta...', progress: 0.4 });
    }

    const result = await worker.recognize(imageSource);

    if (onProgress) {
      onProgress({ status: 'Procesando datos...', progress: 0.9 });
    }

    const rawText = result.data.text;
    const parsed = parseLabelContent(rawText);

    if (onProgress) {
      onProgress({ status: 'Completado', progress: 1.0 });
    }

    return parsed;
  } catch (error) {
    console.error('Error durante OCR:', error);
    throw error;
  }
}
