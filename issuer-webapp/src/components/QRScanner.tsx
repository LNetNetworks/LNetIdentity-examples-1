import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scanner = new QrScanner(
      video,
      (result) => {
        onScan(result.data);
        scanner.stop();
      },
      { returnDetailedScanResult: true, highlightScanRegion: true },
    );

    scanner.start().catch(() => setError('No se pudo acceder a la cámara.'));

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-20 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      </div>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      <button
        onClick={onClose}
        className="mt-4 px-4 py-2 rounded-md bg-white text-slate-900 font-medium"
      >
        Cancelar
      </button>
    </div>
  );
}
