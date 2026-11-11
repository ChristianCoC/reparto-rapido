import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, X, AlertCircle, Image as ImageIcon, ScanText, Loader2, Sparkles } from 'lucide-react';
import { feedback } from '../utils/feedback';
import { recognizeLabelImage, OcrProgress } from '../utils/ocr';
import { parseLabelContent, ParsedLabelData } from '../utils/labelParser';

interface ScannerViewProps {
  onScan: (code: string, parsedData?: ParsedLabelData) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan, onClose, isModal = false }) => {
  const [mode, setMode] = useState<'barcode' | 'ocr'>('barcode');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'interactive-camera-scanner';
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMessage('No se encontraron cámaras disponibles en el dispositivo.');
        }
      })
      .catch((err) => {
        console.warn('Error solicitando permisos de cámara:', err);
        setErrorMessage('Permiso de cámara denegado. Puedes ingresar datos manualmente o capturar una foto.');
      });

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    setErrorMessage(null);
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          feedback.playScanSuccess();
          // Procesar el texto si es JSON de Mercado Libre
          const parsed = parseLabelContent(decodedText);
          onScan(parsed.trackingId || decodedText, parsed);
        },
        () => {
          // Frame no decodificado aún
        }
      );
      setIsScanning(true);
    } catch (err: unknown) {
      console.error('Error iniciando escáner:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`No se pudo acceder a la cámara seleccionada (${msg}).`);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error al detener escáner:', e);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (selectedCameraId && mode === 'barcode') {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId, mode]);

  // Capturar frame actual del video para OCR
  const captureFrameForOcr = async () => {
    const videoEl = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
    if (!videoEl) {
      // Si no hay video en vivo, abrir selector de foto
      fileInputRef.current?.click();
      return;
    }

    try {
      setOcrLoading(true);
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 1280;
      canvas.height = videoEl.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      const parsed = await recognizeLabelImage(canvas, (p) => setOcrProgress(p));
      feedback.playScanSuccess();
      onScan(parsed.routeCode || parsed.trackingId || 'PAQUETE-OCR', parsed);
    } catch (err) {
      console.error('Error procesando OCR del frame:', err);
      alert('No se pudo leer la etiqueta con suficiente claridad. Intenta enfocar más de cerca o toma una foto.');
    } finally {
      setOcrLoading(false);
      setOcrProgress(null);
    }
  };

  // Procesar archivo / foto subida
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      const parsed = await recognizeLabelImage(file, (p) => setOcrProgress(p));
      feedback.playScanSuccess();
      onScan(parsed.routeCode || parsed.trackingId || 'PAQUETE-OCR', parsed);
    } catch (err) {
      console.error('Error procesando imagen con OCR:', err);
      // Fallback: intentar lectura de código de barras
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(containerId);
        }
        const decoded = await scannerRef.current.scanFile(file, true);
        feedback.playScanSuccess();
        const parsed = parseLabelContent(decoded);
        onScan(parsed.trackingId || decoded, parsed);
      } catch {
        alert('No se detectó texto ni código legible. Intenta con mejor iluminación.');
      }
    } finally {
      setOcrLoading(false);
      setOcrProgress(null);
    }
  };

  return (
    <div className={`relative bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${isModal ? 'w-full max-w-lg mx-auto' : ''}`}>
      {/* Barra superior del escáner */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-500 animate-pulse" />
          <span className="font-semibold text-sm">Escáner de Envíos</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Selector de Modo: Barras/QR vs OCR Inteligente */}
      <div className="flex bg-slate-950 p-1 border-b border-slate-800 text-xs">
        <button
          onClick={() => setMode('barcode')}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
            mode === 'barcode'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Barras / QR en Vivo
        </button>
        <button
          onClick={() => {
            setMode('ocr');
            if (isScanning) {
              // Mantener la cámara activa para el frame
            }
          }}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
            mode === 'ocr'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ScanText className="w-3.5 h-3.5" />
          Etiqueta / OCR (#BD-32)
        </button>
      </div>

      {/* Visor de Cámara */}
      <div className="relative aspect-square sm:aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        <div id={containerId} className="w-full h-full object-cover"></div>

        {/* Guía visual */}
        {isScanning && !ocrLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className={`border-2 rounded-2xl relative transition-all duration-300 ${
              mode === 'ocr'
                ? 'w-72 h-60 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'w-64 h-40 border-brand-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
            }`}>
              {/* Esquinas */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-current -mt-1 -ml-1 rounded-tl"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-current -mt-1 -mr-1 rounded-tr"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-current -mb-1 -ml-1 rounded-bl"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-current -mb-1 -mr-1 rounded-br"></div>
              <div className="w-full h-0.5 bg-current shadow-[0_0_8px_currentColor] animate-bounce opacity-80 mt-16"></div>
            </div>
            <p className="absolute bottom-4 text-xs font-bold text-slate-200 bg-black/75 px-3 py-1.5 rounded-full backdrop-blur">
              {mode === 'ocr' ? 'Enfoca el sticker con la letra y el #BD-32' : 'Apunta al código de barras o QR'}
            </p>
          </div>
        )}

        {/* Overlay de carga OCR */}
        {ocrLoading && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-3" />
            <h4 className="font-bold text-base text-white">Leyendo Etiqueta con IA</h4>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              {ocrProgress?.status || 'Extrayendo dirección, zona y código #BD-32...'}
            </p>
            {ocrProgress?.progress !== undefined && (
              <div className="w-48 bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-brand-500 h-full transition-all duration-300"
                  style={{ width: `${Math.round(ocrProgress.progress * 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de error si la cámara falla */}
        {errorMessage && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
            <p className="text-sm text-slate-300 mb-4">{errorMessage}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Tomar foto o subir de galería
            </button>
          </div>
        )}
      </div>

      {/* Botón de captura rápida para OCR */}
      <div className="p-3 bg-slate-950 flex flex-col gap-2 border-t border-slate-800">
        <button
          onClick={captureFrameForOcr}
          disabled={ocrLoading}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>Capturar Etiqueta (Leer Zona B y #BD-32)</span>
        </button>

        <div className="flex items-center justify-between text-xs text-slate-400">
          {cameras.length > 1 ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-slate-800 text-slate-200 rounded px-2 py-1 text-xs border border-slate-700 focus:outline-none"
              >
                {cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Cámara ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span>Cámara lista</span>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-300 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto / Galería</span>
          </button>
        </div>
      </div>
    </div>
  );
};
