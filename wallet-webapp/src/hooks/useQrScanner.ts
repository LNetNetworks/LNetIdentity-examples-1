import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'

/* `BarcodeDetector` todavía no está en las definiciones estándar del DOM. */
interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor & {
      getSupportedFormats?: () => Promise<string[]>
    }
  }
}

export type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error'

/** Intervalo entre análisis de frames: suficiente para leer sin fundir la batería. */
const SCAN_INTERVAL_MS = 120
/** Lado máximo del frame que se analiza con jsQR. */
const MAX_ANALYSIS_SIZE = 720

interface UseQrScannerOptions {
  /** Mientras sea `true` la cámara está encendida y analizando. */
  active: boolean
  onResult: (value: string) => void
}

interface UseQrScannerResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: ScannerStatus
  error: string | null
  /** `true` si el dispositivo/navegador puede abrir la cámara. */
  supported: boolean
}

export function useQrScanner({ active, onResult }: UseQrScannerOptions): UseQrScannerResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // El callback se guarda en un ref para que cambiar su identidad no reinicie la cámara.
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  const supported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  useEffect(() => {
    if (!active) {
      setStatus('idle')
      setError(null)
      return
    }

    if (!window.isSecureContext) {
      setStatus('error')
      setError(
        'La cámara solo está disponible sobre HTTPS (o en localhost). Podés pegar el DID del verificador manualmente.',
      )
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError(
        'Este navegador no permite acceder a la cámara. Podés pegar el DID del verificador manualmente.',
      )
      return
    }

    let stream: MediaStream | null = null
    let frameId = 0
    let timeoutId = 0
    let cancelled = false
    let handled = false
    let detector: BarcodeDetectorLike | null = null
    let canvas: HTMLCanvasElement | null = null
    let context: CanvasRenderingContext2D | null = null

    setStatus('starting')
    setError(null)

    const emit = (value: string) => {
      if (handled || cancelled) return
      handled = true
      onResultRef.current(value)
    }

    const scheduleNext = () => {
      if (cancelled || handled) return
      timeoutId = window.setTimeout(() => {
        frameId = requestAnimationFrame(analyze)
      }, SCAN_INTERVAL_MS)
    }

    const analyze = async () => {
      const video = videoRef.current
      if (cancelled || handled || !video || video.readyState < video.HAVE_CURRENT_DATA) {
        scheduleNext()
        return
      }

      try {
        if (detector) {
          const codes = await detector.detect(video)
          const value = codes.find((code) => code.rawValue)?.rawValue
          if (value) {
            emit(value)
            return
          }
        } else {
          const value = decodeWithJsQr(video)
          if (value) {
            emit(value)
            return
          }
        }
      } catch {
        /* Un frame ilegible no es un error: se reintenta con el siguiente. */
      }

      scheduleNext()
    }

    const decodeWithJsQr = (video: HTMLVideoElement): string | null => {
      const { videoWidth, videoHeight } = video
      if (!videoWidth || !videoHeight) return null

      const scale = Math.min(1, MAX_ANALYSIS_SIZE / Math.max(videoWidth, videoHeight))
      const width = Math.round(videoWidth * scale)
      const height = Math.round(videoHeight * scale)

      if (!canvas) {
        canvas = document.createElement('canvas')
        context = canvas.getContext('2d', { willReadFrequently: true })
      }
      if (!context || !canvas) return null

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      context.drawImage(video, 0, 0, width, height)
      const image = context.getImageData(0, 0, width, height)
      const code = jsQR(image.data, width, height, { inversionAttempts: 'dontInvert' })
      return code?.data ?? null
    }

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) return

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        // iOS exige reproducción inline y silenciada para no ir a pantalla completa.
        video.setAttribute('playsinline', 'true')
        video.muted = true
        await video.play()
        if (cancelled) return

        if (window.BarcodeDetector) {
          try {
            const formats = (await window.BarcodeDetector.getSupportedFormats?.()) ?? ['qr_code']
            if (formats.includes('qr_code')) {
              detector = new window.BarcodeDetector({ formats: ['qr_code'] })
            }
          } catch {
            detector = null
          }
        }

        setStatus('scanning')
        frameId = requestAnimationFrame(analyze)
      } catch (cause) {
        if (cancelled) return
        setStatus('error')
        setError(describeCameraError(cause))
      }
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
      for (const track of stream?.getTracks() ?? []) track.stop()
      const video = videoRef.current
      if (video) video.srcObject = null
    }
  }, [active])

  return { videoRef, status, error, supported }
}

function describeCameraError(cause: unknown): string {
  const name = cause instanceof DOMException ? cause.name : ''

  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'No diste permiso para usar la cámara. Habilitalo en los ajustes del navegador o pegá el DID manualmente.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No se encontró una cámara disponible en este dispositivo.'
    case 'NotReadableError':
      return 'La cámara está siendo usada por otra aplicación.'
    default:
      return 'No se pudo iniciar la cámara. Podés pegar el DID del verificador manualmente.'
  }
}
