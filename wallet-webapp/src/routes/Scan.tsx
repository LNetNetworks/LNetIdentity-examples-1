import { useCallback, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CameraOffIcon, QrIcon } from '../components/Icons'
import { Alert } from '../components/Ui'
import { useQrScanner } from '../hooks/useQrScanner'
import { parseVerifierQr } from '../lib/qr'

interface ScanState {
  /** Credencial preseleccionada cuando se llega desde el detalle. */
  credentialId?: string
}

export function Scan() {
  const navigate = useNavigate()
  const location = useLocation()
  const preselected = (location.state as ScanState | null)?.credentialId

  const [manualValue, setManualValue] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  const goToShare = useCallback(
    (verifierDid: string) => {
      navigate(`/share?verifier=${encodeURIComponent(verifierDid)}`, {
        state: { credentialId: preselected },
      })
    },
    [navigate, preselected],
  )

  const handleScan = useCallback(
    (raw: string) => {
      const result = parseVerifierQr(raw)
      if (!result.ok) {
        setParseError(result.error)
        return
      }
      navigator.vibrate?.(60)
      goToShare(result.verifierDid)
    },
    [goToShare],
  )

  const { videoRef, status, error, supported } = useQrScanner({
    // Al detectar un QR inválido se pausa la cámara para que el error sea legible.
    active: parseError === null,
    onResult: handleScan,
  })

  const submitManual = (event: FormEvent) => {
    event.preventDefault()
    const result = parseVerifierQr(manualValue)
    if (!result.ok) {
      setParseError(result.error)
      return
    }
    goToShare(result.verifierDid)
  }

  const retry = () => {
    setParseError(null)
    setManualValue('')
  }

  return (
    <AppShell title="Escanear QR" showNav>
      <div className="stack stack--loose">
        <div className="stack stack--tight">
          <p className="page-subtitle">
            Apuntá la cámara al código QR del verificador para compartirle una credencial.
          </p>
        </div>

        <div className="scanner">
          <video
            ref={videoRef}
            className="scanner__video"
            playsInline
            muted
            autoPlay
            aria-label="Vista de la cámara"
          />

          {status === 'scanning' && !parseError ? (
            <div className="scanner__overlay">
              <div className="scanner__frame">
                <span className="scanner__corner scanner__corner--tl" />
                <span className="scanner__corner scanner__corner--tr" />
                <span className="scanner__corner scanner__corner--bl" />
                <span className="scanner__corner scanner__corner--br" />
              </div>
            </div>
          ) : (
            <div className="scanner__placeholder">
              {status === 'starting' ? (
                <>
                  <span className="spinner spinner--large" />
                  <span>Iniciando la cámara…</span>
                </>
              ) : error || !supported ? (
                <>
                  <CameraOffIcon />
                  <span>{error ?? 'La cámara no está disponible en este dispositivo.'}</span>
                </>
              ) : (
                <>
                  <QrIcon />
                  <span>Cámara en pausa</span>
                </>
              )}
            </div>
          )}
        </div>

        {parseError && (
          <div className="stack stack--tight">
            <Alert tone="error">{parseError}</Alert>
            <button type="button" className="button button--secondary" onClick={retry}>
              Escanear de nuevo
            </button>
          </div>
        )}

        <form className="stack stack--tight" onSubmit={submitManual}>
          <div className="field">
            <label className="field__label" htmlFor="manual-did">
              ¿No podés escanear?
            </label>
            <div className="input-with-action">
              <input
                id="manual-did"
                className="input input--mono"
                type="text"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="did:lac:openprotest:0x…"
                value={manualValue}
                onChange={(event) => {
                  setManualValue(event.target.value)
                  if (parseError) setParseError(null)
                }}
              />
              <button
                type="submit"
                className="button button--secondary button--auto"
                disabled={!manualValue.trim()}
              >
                Continuar
              </button>
            </div>
            <p className="field__hint">
              Pegá el DID del verificador o la URL completa del QR. Solo se usa el DID: la
              presentación siempre se envía al servicio configurado en la app.
            </p>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
