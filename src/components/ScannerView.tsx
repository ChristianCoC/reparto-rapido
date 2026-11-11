import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { feedback } from '../utils/feedback';

interface ScannerViewProps {
  onScan: (code: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan, onClose, isModal = false }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'interactive-camera-scanner';
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    // Obtener lista de cámaras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Preferir cámara trasera ('back', 'rear', 'environment')
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
        setErrorMessage('Permiso de cámara denegado o no disponible. Puedes ingresar el código manualmente o subir una foto.');
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
          onScan(decodedText);
        },
        () => {
          // Fallo por frame (normal mientras enfoca)
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
    if (selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId]);

  // Manejador para escanear desde imagen/archivo si la cámara en vivo falla
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      const decodedResult = await scannerRef.current.scanFile(file, true);
      feedback.playScanSuccess();
      onScan(decodedResult);
    } catch (err) {
      setErrorMessage('No se detectó un código claro en la imagen. Prueba con otra foto o ingresa manualmente.');
    }
  };

  return (
    <div className={`relative bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${isModal ? 'w-full max-w-lg mx-auto' : ''}`}>
      {/* Barra superior del escáner */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-500 animate-pulse" />
          <span className="font-semibold text-sm">Escáner de Paquete (Barras / QR)</span>
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

      {/* Visor de Cámara */}
      <div className="relative aspect-square sm:aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        <div id={containerId} className="w-full h-full object-cover"></div>

        {/* Guía visual de enfoque */}
        {isScanning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-40 border-2 border-brand-500/80 rounded-xl relative shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-500 -mt-1 -ml-1 rounded-tl"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-500 -mt-1 -mr-1 rounded-tr"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-500 -mb-1 -ml-1 rounded-bl"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-500 -mb-1 -mr-1 rounded-br"></div>
              {/* Línea láser animada */}
              <div className="w-full h-0.5 bg-brand-500 shadow-[0_0_8px_#22c55e] animate-bounce opacity-80 mt-16"></div>
            </div>
            <p className="absolute bottom-4 text-xs font-medium text-slate-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur">
              Apunta al código de barras o QR
            </p>
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

      {/* Controles inferiores del visor */}
      <div className="p-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
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
          <span>Cámara activa</span>
        )}

        {/* Botón alternativo para cargar foto/archivo */}
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
  );
};
