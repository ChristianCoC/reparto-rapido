import { createWorker } from 'tesseract.js';
import { parseLabelContent, ParsedLabelData } from './labelParser';

let workerPromise: Promise<Tesseract.Worker> | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      // Usamos eng para reconocimiento de caracteres latinos y números de códigos
      const worker = await createWorker(['eng', 'spa']);
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
 * Pre-procesa una imagen aumentando contraste y escala de grises
 * para que Tesseract lea el papel térmico blanco y texto negro con máxima precisión.
 */
function enhanceImageForOcr(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas;

  // Dibujar original
  ctx.drawImage(sourceCanvas, 0, 0);

  // Obtener píxeles para aumentar contraste
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Filtro de escala de grises y aumento de contraste
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Umbral de contraste alto para destacar texto negro sobre fondo blanco
    const threshold = avg > 140 ? 255 : (avg < 90 ? 0 : avg);
    data[i] = threshold;
    data[i + 1] = threshold;
    data[i + 2] = threshold;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Procesa la imagen del cartel/sticker y extrae la letra B y el #BD-32
 */
export async function recognizeLabelImage(
  imageSource: File | Blob | HTMLCanvasElement | string,
  onProgress?: (p: OcrProgress) => void
): Promise<ParsedLabelData> {
  try {
    if (onProgress) {
      onProgress({ status: 'Preparando imagen...', progress: 0.1 });
    }

    let inputForOcr: HTMLCanvasElement | File | Blob | string = imageSource;

    // Si viene de un canvas, aplicamos el realce de contraste
    if (imageSource instanceof HTMLCanvasElement) {
      inputForOcr = enhanceImageForOcr(imageSource);
    } else if (imageSource instanceof Blob) {
      // Convertir blob a canvas para realce
      const bitmap = await createImageBitmap(imageSource);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = bitmap.width;
      tempCanvas.height = bitmap.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        inputForOcr = enhanceImageForOcr(tempCanvas);
      }
    }

    const worker = await getWorker();

    if (onProgress) {
      onProgress({ status: 'Buscando cartel (Letra y #BD-32)...', progress: 0.5 });
    }

    const result = await worker.recognize(inputForOcr);

    if (onProgress) {
      onProgress({ status: 'Identificando zona...', progress: 0.9 });
    }

    const rawText = result.data.text;
    console.log('Texto detectado por OCR:', rawText);
    const parsed = parseLabelContent(rawText);

    if (onProgress) {
      onProgress({ status: '¡Listo!', progress: 1.0 });
    }

    return parsed;
  } catch (error) {
    console.error('Error durante OCR:', error);
    throw error;
  }
}
