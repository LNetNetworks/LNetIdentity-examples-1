import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../auth/useSession'
import { AppShell } from '../components/AppShell'
import { CredentialCard } from '../components/CredentialCard'
import { ShareIcon } from '../components/Icons'
import { Alert, CopyableValue, DataRow, Loading } from '../components/Ui'
import { useCredentialDetail } from '../hooks/useCredentials'
import {
  credentialStatus,
  flattenClaims,
  formatDateTime,
  issuerDid,
  STATUS_LABEL,
  validFrom,
  validUntil,
} from '../lib/credentials'

export function CredentialDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const session = useSession()
  const holderDid = session?.did ?? null

  const { detail, loading, error } = useCredentialDetail(holderDid, id)

  const claims = flattenClaims(detail?.credentialSubject)
  const status = credentialStatus(detail ?? undefined)
  const subjectDid =
    typeof detail?.credentialSubject?.id === 'string' ? detail.credentialSubject.id : holderDid

  return (
    <AppShell title="Credencial" back="/">
      {loading && <Loading label="Cargando credencial…" />}

      {error && !loading && <Alert tone="error">{error}</Alert>}

      {detail && !loading && (
        <div className="stack stack--loose">
          <CredentialCard
            type={detail.type}
            issuerDid={issuerDid(detail)}
            status={status}
            validUntil={validUntil(detail)}
          />

          {status === 'expired' && (
            <Alert tone="warning">
              Esta credencial venció. Es probable que un verificador la rechace.
            </Alert>
          )}

          {claims.length > 0 && (
            <section className="stack stack--tight">
              <h2 className="section-label">Datos de la credencial</h2>
              <div className="panel panel--flush">
                <div className="data-list">
                  {claims.map((claim) => (
                    <DataRow key={claim.key} label={claim.label}>
                      {claim.value}
                    </DataRow>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* La acción principal va antes del bloque técnico: en pantallas chicas
              quedaba abajo de todo y había que scrollear para encontrarla. */}
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/scan', { state: { credentialId: id } })}
          >
            <ShareIcon />
            Compartir esta credencial
          </button>

          <section className="stack stack--tight">
            <h2 className="section-label">Información técnica</h2>
            <div className="panel panel--flush">
              <div className="data-list">
                <DataRow label="Estado">
                  <span className={`badge badge--${status}`}>{STATUS_LABEL[status]}</span>
                </DataRow>

                <DataRow label="ID en la wallet">
                  <CopyableValue value={id ?? '—'} label="ID de la credencial" />
                </DataRow>

                {detail.id && (
                  <DataRow label="ID de la credencial (URI)">
                    <CopyableValue value={detail.id} label="URI de la credencial" />
                  </DataRow>
                )}

                <DataRow label="Emisor">
                  <CopyableValue value={issuerDid(detail) ?? '—'} label="DID del emisor" />
                </DataRow>

                {subjectDid && (
                  <DataRow label="Titular">
                    <CopyableValue value={subjectDid} label="DID del titular" />
                  </DataRow>
                )}

                <DataRow label="Válida desde">{formatDateTime(validFrom(detail))}</DataRow>
                <DataRow label="Válida hasta">{formatDateTime(validUntil(detail))}</DataRow>

                {detail.trustedList && (
                  <DataRow label="Trusted list">
                    <CopyableValue value={detail.trustedList} label="Trusted list" />
                  </DataRow>
                )}
              </div>
            </div>
          </section>

          <details className="disclosure">
            <summary>Ver credencial completa (JSON)</summary>
            <div className="disclosure__content">
              <pre className="raw-json">{JSON.stringify(detail, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
    </AppShell>
  )
}
