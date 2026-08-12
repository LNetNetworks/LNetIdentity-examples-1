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
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[22px] border border-white/10 bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      </div>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      <button
        onClick={onClose}
        className="mt-4 min-h-[50px] rounded-[14px] border border-white/15 bg-white/[0.08] px-5 font-semibold text-slate-100 hover:bg-white/[0.12]"
      >
        Cancelar
      </button>
    </div>
  );
}
