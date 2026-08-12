import type { JsonSchema, JsonSchemaProperty } from '../types';

interface DynamicFormProps {
  schema: JsonSchema;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  /** Field to skip rendering, e.g. `id` which is filled from the recipient DID. */
  skipField?: string;
}

function labelFor(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

export function DynamicForm({ schema, values, onChange, skipField }: DynamicFormProps) {
  const subject = schema.properties.credentialSubject;
  const required = new Set(subject.required ?? []);
  const entries = Object.entries(subject.properties).filter(([key]) => key !== skipField);

  function setValue(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, prop]) => (
        <Field
          key={key}
          name={key}
          prop={prop}
          required={required.has(key)}
          value={values[key]}
          onChange={(v) => setValue(key, v)}
        />
      ))}
    </div>
  );
}

function Field({
  name,
  prop,
  required,
  value,
  onChange,
}: {
  name: string;
  prop: JsonSchemaProperty;
  required: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = (
    <label className="text-sm font-semibold text-slate-400">
      {labelFor(name)}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
  const inputClass =
    'min-h-[50px] w-full rounded-[13px] border border-white/10 bg-white/[0.045] px-3.5 py-3 text-base text-slate-100 outline-none transition focus:border-emerald-500 focus:bg-[#121829]';

  if (prop.enum) {
    return (
      <div className="space-y-1">
        {label}
        <select
          className={inputClass}
          value={(value as string) ?? ''}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Seleccionar…
          </option>
          {prop.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (prop.format === 'date') {
    return (
      <div className="space-y-1">
        {label}
        <input
          type="date"
          className={inputClass}
          value={(value as string) ?? ''}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (prop.type === 'integer' || prop.type === 'number') {
    return (
      <div className="space-y-1">
        {label}
        <input
          type="number"
          className={inputClass}
          value={value === undefined || value === null ? '' : String(value)}
          min={prop.minimum}
          required={required}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label}
      <input
        type="text"
        className={inputClass}
        value={(value as string) ?? ''}
        minLength={prop.minLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
