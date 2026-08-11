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
      <h2 className="text-lg font-semibold text-slate-900">2. Datos de la credencial</h2>
      <DynamicForm schema={schema} values={values} onChange={onValuesChange} skipField="id" />
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Expiration Date</label>
        <input
          type="date"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={expirationDate}
          onChange={(e) => onExpirationDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}
