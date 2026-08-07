import { useEffect, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'
import { DownloadIcon, XIcon } from './Icons'

const DISMISSED_KEY = 'piw.install-banner-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iOS expone su propio flag fuera del estándar.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  const ua = window.navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ se identifica como Mac; se distingue por el soporte táctil.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  )
}

/**
 * Invita a instalar la PWA. En Android usa el prompt nativo; en iOS, que no lo
 * expone, muestra las instrucciones de "Agregar a pantalla de inicio".
 */
export function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => readJson<boolean>(DISMISSED_KEY) === true)
  const [standalone, setStandalone] = useState(isStandalone)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setStandalone(true)

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // iOS nunca dispara `beforeinstallprompt`: se detecta la plataforma.
    if (isIos()) setShowIosHint(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    writeJson(DISMISSED_KEY, true)
  }

  const install = async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  if (standalone || dismissed) return null
  if (!promptEvent && !showIosHint) return null

  return (
    <div className="install-banner">
      <DownloadIcon style={{ width: 20, height: 20, flex: '0 0 20px', color: '#a5b4fc' }} />

      <div className="install-banner__text">
        <div className="install-banner__title">Instalá la wallet</div>
        {promptEvent
          ? 'Agregala a tu pantalla de inicio para abrirla como una app.'
          : 'Tocá Compartir y luego “Agregar a pantalla de inicio”.'}
      </div>

      {promptEvent && (
        <button type="button" className="button button--primary button--auto button--small" onClick={install}>
          Instalar
        </button>
      )}

      <button type="button" className="icon-button" onClick={dismiss} aria-label="Descartar" style={{ width: 32, height: 32, flexBasis: 32 }}>
        <XIcon style={{ width: 16, height: 16 }} />
      </button>
    </div>
  )
}
