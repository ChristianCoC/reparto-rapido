import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, X, AlertCircle, Image as ImageIcon, ScanText, Loader2, Sparkles, Barcode } from 'lucide-react';
import { feedback } from '../utils/feedback';
import { recognizeLabelImage, OcrProgress } from '../utils/ocr';
import { parseLabelContent, ParsedLabelData } from '../utils/labelParser';

interface ScannerViewProps {
  onScan: (code: string, parsedData?: ParsedLabelData) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan, onClose, isModal = false }) => {
  // Ponemos por defecto el modo Cartel / Sticker para que no capture el código de barras por accidente
  const [mode, setMode] = useState<'cartel' | 'barcode'>('cartel');
  const [isCameraActive, setIsCameraActive] = useState(false);
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
        setErrorMessage('Permiso de cámara no disponible. Puedes usar foto de galería o ingreso rápido.');
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
          // SOLO capturar códigos de barra si el usuario está explícitamente en la pestaña de códigos de barra
          if (mode === 'barcode') {
            feedback.playScanSuccess();
            const parsed = parseLabelContent(decodedText);
            onScan(parsed.trackingId || decodedText, parsed);
          }
        },
        () => {
          // Frame no decodificado
        }
      );
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.error('Error iniciando escáner:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`No se pudo abrir la cámara (${msg}).`);
      setIsCameraActive(false);
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
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId]);

  // Capturar el sticker/cartel de la cámara con zoom/recorte central para OCR
  const captureCartelForOcr = async () => {
    const videoEl = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
    if (!videoEl) {
      fileInputRef.current?.click();
      return;
    }

    try {
      setOcrLoading(true);
      const canvas = document.createElement('canvas');
      const vWidth = videoEl.videoWidth || 1280;
      const vHeight = videoEl.videoHeight || 720;

      // Recortar la parte central donde está enfocado el sticker
      const cropWidth = Math.floor(vWidth * 0.7);
      const cropHeight = Math.floor(vHeight * 0.5);
      const cropX = Math.floor((vWidth - cropWidth) / 2);
      const cropY = Math.floor((vHeight - cropHeight) / 2);

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      ctx.drawImage(videoEl, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const parsed = await recognizeLabelImage(canvas, (p) => setOcrProgress(p));
      console.log('Datos extraídos del cartel:', parsed);

      if (parsed.routeCode || parsed.zoneLetter) {
        feedback.playScanSuccess();
        const finalCode = parsed.routeCode || (parsed.zoneLetter ? `ZONA ${parsed.zoneLetter}` : 'PAQUETE');
        onScan(finalCode, parsed);
      } else {
        alert('No se detectó con claridad la letra o el código #BD-32. Intenta enfocar más cerca del sticker blanco o ingresa la letra y número.');
      }
    } catch (err) {
      console.error('Error procesando OCR del cartel:', err);
      alert('Error al leer el cartel. Asegúrate de enfocar con buena luz.');
    } finally {
      setOcrLoading(false);
      setOcrProgress(null);
    }
  };

  // Procesar imagen subida
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      const parsed = await recognizeLabelImage(file, (p) => setOcrProgress(p));
      if (parsed.routeCode || parsed.zoneLetter) {
        feedback.playScanSuccess();
        onScan(parsed.routeCode || `ZONA ${parsed.zoneLetter}`, parsed);
      } else {
        alert('No se detectó el código #BD-32 en la foto.');
      }
    } catch (err) {
      alert('No se pudo procesar la imagen.');
    } finally {
      setOcrLoading(false);
      setOcrProgress(null);
    }
  };

  return (
    <div className={`relative bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 ${isModal ? 'w-full max-w-lg mx-auto' : ''}`}>
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ScanText className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="font-bold text-sm">Escáner de Cartel Logístico</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Selector de Modo */}
      <div className="flex bg-slate-950 p-1.5 border-b border-slate-800 text-xs gap-1.5">
        <button
          onClick={() => setMode('cartel')}
          className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            mode === 'cartel'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-950" />
          <span>Cartel (Letra B y #BD-32)</span>
        </button>

        <button
          onClick={() => setMode('barcode')}
          className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
            mode === 'barcode'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-400 hover:text-white bg-slate-800/40'
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>Código de Barras</span>
        </button>
      </div>

      {/* Visor de Cámara */}
      <div className="relative aspect-square sm:aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        <div id={containerId} className="w-full h-full object-cover"></div>

        {/* Guía visual enfocada en el Cartel */}
        {isCameraActive && !ocrLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {mode === 'cartel' ? (
              <div className="w-64 h-44 border-3 border-amber-400 rounded-2xl relative shadow-[0_0_25px_rgba(251,191,36,0.35)] bg-amber-400/5">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br"></div>
                <div className="text-center pt-2 text-amber-300 font-black text-xs tracking-wider">
                  ENFOCA EL STICKER [ B ] #BD-32
                </div>
              </div>
            ) : (
              <div className="w-64 h-36 border-2 border-brand-500 rounded-xl relative shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <div className="w-full h-0.5 bg-brand-500 animate-bounce mt-14"></div>
              </div>
            )}

            <p className="absolute bottom-3 text-xs font-bold text-slate-100 bg-black/80 px-3.5 py-1.5 rounded-full backdrop-blur border border-white/10">
              {mode === 'cartel'
                ? 'Pon el sticker blanco en el centro y toca el botón amarillo abajo'
                : 'Apunta al código de barras del paquete'}
            </p>
          </div>
        )}

        {/* Overlay de carga OCR */}
        {ocrLoading && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-3" />
            <h4 className="font-extrabold text-base text-white">Leyendo Cartel...</h4>
            <p className="text-xs text-amber-200 mt-1 max-w-xs font-medium">
              {ocrProgress?.status || 'Buscando la letra y código #BD-32...'}
            </p>
            {ocrProgress?.progress !== undefined && (
              <div className="w-48 bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{ width: `${Math.round(ocrProgress.progress * 100)}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
            <p className="text-sm text-slate-300 mb-4">{errorMessage}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Tomar foto o subir de galería
            </button>
          </div>
        )}
      </div>

      {/* Botones inferiores */}
      <div className="p-4 bg-slate-950 flex flex-col gap-2.5 border-t border-slate-800">
        {mode === 'cartel' ? (
          <button
            onClick={captureCartelForOcr}
            disabled={ocrLoading}
            className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
            <span>CAPTURAR CARTEL (LETRA B / #BD-32)</span>
          </button>
        ) : (
          <div className="text-center py-2 text-xs text-slate-400 font-medium">
            El escáner de barras lee automáticamente cuando enfoques el código
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          {cameras.length > 1 ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs border border-slate-700 focus:outline-none"
              >
                {cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Cámara ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span>Cámara activa</span>
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
            className="text-slate-300 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Foto de Etiqueta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
