export function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex-1 flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
              n <= step ? 'bg-emerald-500 text-white' : 'border border-white/10 bg-white/[0.06] text-slate-500'
            }`}
          >
            {n}
          </div>
          {n < total && <div className={`flex-1 h-0.5 ${n < step ? 'bg-emerald-500' : 'bg-white/10'}`} />}
        </div>
      ))}
    </div>
  );
}
