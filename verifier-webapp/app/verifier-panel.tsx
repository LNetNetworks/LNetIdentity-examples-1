"use client";

import { useState } from "react";

const MODULES = 25;
const FINDER_SIZE = 7;
const FINDER_ORIGINS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0, MODULES - FINDER_SIZE],
  [MODULES - FINDER_SIZE, 0],
];

/**
 * Whether (row, col) falls inside one of the three corner finder patterns,
 * and if so whether that module is dark. Returns null when outside all of them.
 */
function finderModule(row: number, col: number): boolean | null {
  for (const [originRow, originCol] of FINDER_ORIGINS) {
    const dr = row - originRow;
    const dc = col - originCol;
    if (dr < 0 || dc < 0 || dr >= FINDER_SIZE || dc >= FINDER_SIZE) continue;

    const onOuterRing = dr === 0 || dc === 0 || dr === 6 || dc === 6;
    const inInnerBlock = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
    return onOuterRing || inInnerBlock;
  }
  return null;
}

/**
 * A decorative QR-looking matrix. This encodes nothing — it is a visual mock
 * standing in for a real presentation QR. Deterministic in `seed` so the
 * server and client render identical markup.
 */
function buildMatrix(seed: number): boolean[][] {
  let state = ((seed + 1) * 2654435761) >>> 0;
  const nextBit = () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000 > 0.5;
  };

  const matrix: boolean[][] = [];
  for (let row = 0; row < MODULES; row++) {
    const cells: boolean[] = [];
    for (let col = 0; col < MODULES; col++) {
      const finder = finderModule(row, col);
      if (finder !== null) {
        cells.push(finder);
      } else if (row === 6 || col === 6) {
        cells.push((row + col) % 2 === 0); // timing pattern
      } else {
        cells.push(nextBit());
      }
    }
    matrix.push(cells);
  }
  return matrix;
}

type Notification = {
  id: number;
  message: string;
  time: string;
};

export default function VerifierPanel() {
  const [seed, setSeed] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const matrix = buildMatrix(seed);

  function generateQr() {
    const next = seed + 1;
    setSeed(next);
    setNotifications((current) =>
      [
        {
          id: next,
          message: `QR de presentación generado (#${String(next).padStart(3, "0")})`,
          time: new Date().toLocaleTimeString("es-AR"),
        },
        ...current,
      ].slice(0, 4),
    );
  }

  return (
    <>
      {/* QR panel */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-6 rounded-3xl bg-brand/20 blur-2xl"
        />
        <div className="relative rounded-2xl border border-line bg-white p-5 shadow-2xl shadow-brand/20">
          <svg
            viewBox={`0 0 ${MODULES} ${MODULES}`}
            role="img"
            aria-label="Código QR de presentación (simulado)"
            className="h-52 w-52 sm:h-60 sm:w-60"
            shapeRendering="crispEdges"
          >
            <rect width={MODULES} height={MODULES} fill="#ffffff" />
            {matrix.map((cells, row) =>
              cells.map((dark, col) =>
                dark ? (
                  <rect
                    key={`${row}-${col}`}
                    x={col}
                    y={row}
                    width={1}
                    height={1}
                    fill="#04060e"
                  />
                ) : null,
              ),
            )}
          </svg>
        </div>
      </div>

      <button
        type="button"
        onClick={generateQr}
        className="mt-8 rounded-full bg-brand px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-bright"
      >
        Generar QR
      </button>

      {/* Notification area — intentionally reserves space while empty */}
      <section
        aria-live="polite"
        aria-label="Notificaciones"
        className="mt-12 w-full max-w-md"
      >
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
          Notificaciones
        </h2>
        <div className="min-h-32 rounded-xl border border-line/70 bg-surface/60 p-4">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted">Sin notificaciones por ahora.</p>
          ) : (
            <ul className="space-y-2.5">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-bright"
                  />
                  <span className="flex-1 text-foreground/90">
                    {notification.message}
                  </span>
                  <time className="shrink-0 font-mono text-xs text-muted">
                    {notification.time}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
