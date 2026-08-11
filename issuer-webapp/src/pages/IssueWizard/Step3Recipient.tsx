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
      <h2 className="text-lg font-semibold text-slate-900">3. Destinatario</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">DID del holder</label>
        <input
          type="text"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        className="w-full rounded-md border border-slate-300 py-2.5 font-medium text-slate-700"
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
