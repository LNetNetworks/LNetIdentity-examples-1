import { DynamicForm } from '../../components/DynamicForm';
import type { JsonSchema } from '../../types';

export function Step2FillData({
  schema,
  values,
  onValuesChange,
  expirationDate,
  onExpirationDateChange,
}: {
  schema: JsonSchema;
  values: Record<string, unknown>;
  onValuesChange: (values: Record<string, unknown>) => void;
  expirationDate: string;
  onExpirationDateChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-slate-100">2. Datos de la credencial</h2>
      <DynamicForm schema={schema} values={values} onChange={onValuesChange} skipField="id" />
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-400">Expiration Date</label>
        <input
          type="date"
          className="min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] px-3.5 py-3 text-base text-slate-100 outline-none transition focus:border-emerald-500 focus:bg-[#121829]"
          value={expirationDate}
          onChange={(e) => onExpirationDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}
