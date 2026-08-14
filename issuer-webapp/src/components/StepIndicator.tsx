export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-4 flex w-full items-center gap-4">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="contents">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
              n <= step ? 'bg-emerald-500 text-white' : 'border border-white/10 bg-white/[0.06] text-slate-500'
            }`}
          >
            {n}
          </div>
          {n < total && <div className={`h-0.5 flex-1 ${n < step ? 'bg-emerald-500' : 'bg-white/10'}`} />}
        </div>
      ))}
    </div>
  );
}
