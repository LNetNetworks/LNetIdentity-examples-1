import { useState } from 'react';
import { StepIndicator } from '../../components/StepIndicator';
import { Step1SelectType } from './Step1SelectType';
import { Step2FillData } from './Step2FillData';
import { Step3Recipient } from './Step3Recipient';
import { Step4Review } from './Step4Review';
import { fetchSchema } from '../../data/credentialTypes';
import { defaultExpiration, toISODateTime } from '../../utils/date';
import { issueVC, type IssueVCParams } from '../../api/vc';
import { useAuth } from '../../context/AuthContext';
import type { CredentialTypeOption, JsonSchema } from '../../types';

const TOTAL_STEPS = 4;
const { dateStr: DEFAULT_DATE, timeStr: DEFAULT_TIME } = defaultExpiration();

export function IssueWizard() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<CredentialTypeOption | null>(null);
  const [schema, setSchema] = useState<JsonSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [expirationDate, setExpirationDate] = useState(DEFAULT_DATE);
  const [recipientDid, setRecipientDid] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const issueParams: IssueVCParams | null = user && selectedType
    ? {
        issuerDid: user.did,
        subjectDid: recipientDid,
        type: selectedType.type,
        context: selectedType.schemaUrl,
        validUntil: toISODateTime(expirationDate, DEFAULT_TIME),
        data: { ...formValues, id: recipientDid },
      }
    : null;

  async function selectType(option: CredentialTypeOption) {
    setSelectedType(option);
    setFormValues({});
    setLoadingSchema(true);
    try {
      setSchema(await fetchSchema(option));
    } finally {
      setLoadingSchema(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setSelectedType(null);
    setSchema(null);
    setFormValues({});
    setExpirationDate(DEFAULT_DATE);
    setRecipientDid('');
    setIssueError(null);
    setResult(null);
  }

  async function emit() {
    if (!issueParams) return;

    setIssuing(true);
    setIssueError(null);
    try {
      const res = await issueVC(issueParams);
      setResult(res);
    } catch (e) {
      setIssueError(e instanceof Error ? e.message : String(e));
    } finally {
      setIssuing(false);
    }
  }

  const canAdvance =
    (step === 1 && !!selectedType && !loadingSchema) ||
    (step === 2 && true) ||
    (step === 3 && recipientDid.trim().length > 0);

  return (
    <div className="space-y-4">
      <StepIndicator step={step} total={TOTAL_STEPS} />

      {step === 1 && <Step1SelectType selected={selectedType} onSelect={selectType} />}

      {step === 2 && schema && (
        <Step2FillData
          schema={schema}
          values={formValues}
          onValuesChange={setFormValues}
          expirationDate={expirationDate}
          onExpirationDateChange={setExpirationDate}
        />
      )}

      {step === 3 && <Step3Recipient did={recipientDid} onDidChange={setRecipientDid} />}

      {step === 4 && selectedType && issueParams && (
        <Step4Review
          typeLabel={selectedType.label}
          recipientDid={recipientDid}
          schemaUrl={selectedType.schemaUrl}
          expirationISO={toISODateTime(expirationDate, DEFAULT_TIME)}
          data={{ ...formValues, id: recipientDid }}
          issueParams={issueParams}
          issuing={issuing}
          error={issueError}
          result={result}
          onEmit={emit}
        />
      )}

      {!result && (
        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="min-h-[50px] flex-1 rounded-[14px] border border-white/15 bg-white/[0.08] px-5 font-semibold text-slate-100 transition hover:bg-white/[0.12] active:scale-[0.985]"
            >
              Atrás
            </button>
          )}
          {step < TOTAL_STEPS && (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="min-h-[50px] flex-1 rounded-[14px] bg-emerald-500 px-5 font-semibold text-white shadow-[0_10px_24px_-14px_#10b981] transition hover:bg-emerald-400 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          )}
        </div>
      )}

      {result && (
        <button
          onClick={resetWizard}
          className="min-h-[50px] w-full rounded-[14px] border border-white/15 bg-white/[0.08] px-5 font-semibold text-slate-100 transition hover:bg-white/[0.12] active:scale-[0.985]"
        >
          Emitir otra credencial
        </button>
      )}
    </div>
  );
}
