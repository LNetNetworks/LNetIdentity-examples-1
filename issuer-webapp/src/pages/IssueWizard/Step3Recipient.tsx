import { useState } from 'react';
import { QRScanner } from '../../components/QRScanner';

export function Step3Recipient({
  did,
  onDidChange,
}: {
  did: string;
  onDidChange: (did: string) => void;
}) {
  const [scanning, setScanning] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-slate-100">3. Destinatario</h2>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-400">DID del holder</label>
        <input
          type="text"
          className="min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] px-3.5 py-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:bg-[#121829]"
          placeholder="did:lac:openprotest:0x..."
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={did}
          onChange={(e) => onDidChange(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => setScanning(true)}
        className="min-h-[50px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-5 font-semibold text-slate-100 transition hover:bg-white/[0.12] active:scale-[0.985]"
      >
        Escanear QR
      </button>

      {scanning && (
        <QRScanner
          onScan={(value) => {
            onDidChange(value);
            setScanning(false);
          }}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}
