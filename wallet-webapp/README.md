# Proof Identity Wallet

Wallet PWA de credenciales verificables sobre el servicio **D-Wallet**. Funciona como
web app en el navegador y se puede instalar en la pantalla de inicio de Android e iOS
con apariencia de app nativa.

## Funcionalidades

| Flujo | Pantalla | Endpoints |
| --- | --- | --- |
| Login / logout | `/login`, `/profile` | `POST /login`, `POST /logout` |
| Listado de credenciales | `/` | `GET /holder/{did}` |
| Detalle de credencial | `/credential/:id` | `GET /holder/{did}/id/{id}` |
| Escaneo del QR del verificador | `/scan` | — (lectura local) |
| Selección y envío de la VP | `/share?verifier=…` | `POST /shareverify/{did}` |
| Solicitud de nueva credencial | `/request` | `POST /vc` |
| Creación de wallet DID | onboarding | `POST /`, `POST /wallet-id`, `POST /wallet-document` |

## Puesta en marcha

```bash
npm install
```

```bash
npm run dev
```

La app queda en `http://localhost:5173`. El servidor de desarrollo escucha en todas las
interfaces (`host: true`), así que también se puede abrir desde el teléfono usando la IP
de la máquina — útil para probar la cámara y la instalación en el dispositivo.

Build de producción y verificación local:

```bash
npm run build && npm run preview
```

### Configuración

La URL del backend se toma de `VITE_API_BASE_URL`; si no está definida se usa el entorno
de desarrollo de D-Wallet. Copiá `.env.example` a `.env.local` para cambiarla.

```
VITE_API_BASE_URL=https://dev-identity-dwallet.l-net.io/wallet
```

El valor debe incluir el base path `/wallet` del router, tal como lo publica el OpenAPI.
No hace falta proxy: la API responde `Access-Control-Allow-Origin: *` y acepta el header
`Authorization` en el preflight, así que el navegador puede llamarla directamente.

## Flujo de compartición

El QR del verificador puede contener la URL completa que publica el servicio:

```
http://dev-identity-dwallet.l-net.io/wallet/shareverify/did:lac:openprotest:0x1975b634…
```

o directamente el DID. **En ambos casos la wallet extrae solo el DID** y arma la petición
contra la API configurada en `VITE_API_BASE_URL`. Es una decisión deliberada:

- evita que un QR manipulado redirija la credencial a un host arbitrario;
- evita el bloqueo por *mixed content* cuando el QR trae una URL `http://` y la PWA corre
  sobre HTTPS (que es el caso del ejemplo de arriba).

Con el DID y la credencial elegida se llama a `POST /shareverify/{didVerificador}` con
`{ did_holder, id_vc }`; el backend verifica la VC y la envía al verificador como
Verifiable Presentation. La pantalla final muestra el resultado y, ante un error, permite
reintentar sin volver a escanear.

Si la cámara no está disponible (permiso denegado, sin HTTPS, o navegador sin soporte) la
pantalla degrada a un campo para pegar el DID o la URL a mano.

## Solicitud de credenciales

La API de D-Wallet no expone un endpoint de *solicitud* del lado del holder: la emisión se
hace con `POST /vc` y **requiere rol `issuer`**. La pantalla `/request` arma y envía esa
petición con el DID del usuario como `subject`:

- si el usuario tiene rol `issuer`, la credencial se emite y aparece en el listado;
- si no lo tiene, la API responde `403` y la solicitud queda guardada en el historial
  local (`localStorage`) con estado *Pendiente*, para que el usuario pueda pasársela al
  emisor.

## PWA

- `manifest.webmanifest` generado por `vite-plugin-pwa` con `display: standalone`,
  `theme_color`, `scope`, `id`, atajos y los tres iconos requeridos.
- Iconos en `public/icons/`: `pwa-192`, `pwa-512`, `maskable-512` (con el glifo dentro de
  la zona segura del 80 %) y `apple-touch-icon-180` opaco para iOS.
- Metatags de iOS en `index.html` (`apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`) porque Safari no lee el
  manifest para "Agregar a pantalla de inicio".
- Service worker con `registerType: 'autoUpdate'` y precache del app shell.
  **Las respuestas de la API nunca se cachean**: son datos sensibles y con token.
- `viewport-fit=cover` + `env(safe-area-inset-*)` para que el header y la navegación
  inferior respeten el notch y la barra de gestos en modo standalone.
- `InstallBanner` usa el prompt nativo en Android y muestra las instrucciones de
  Compartir → "Agregar a pantalla de inicio" en iOS, que no expone ese evento.

> La instalación y el acceso a la cámara requieren **HTTPS** (o `localhost`). Sobre HTTP
> plano el navegador no ofrece instalar la PWA ni concede `getUserMedia`.

## Notas de implementación

- **Sesión.** Los tokens se guardan en `localStorage` y el store se conecta al cliente API
  en tiempo de import (`src/auth/session.ts`), de modo que ningún efecto pueda disparar una
  request antes de que el token esté disponible. La expiración se calcula con el `exp` del
  JWT y se vigila con un intervalo y con `visibilitychange`. No hay endpoint de refresh en
  la API, así que al vencer el token se vuelve al login.
- **Límite de rate.** El gateway permite ~100 requests cada 15 minutos. Por eso el detalle
  de cada VC se cachea en memoria y el listado se reutiliza durante 60 s: ir del listado al
  escáner y a la pantalla de compartir no repite el mismo `GET`. El botón de recargar
  siempre va a la red.
- **DIDs en la URL.** Los `:` son válidos en un path segment y es la forma en que el propio
  servicio publica sus URLs, así que `encodeDidSegment` codifica todo excepto los dos
  puntos.
- **Escáner.** Usa `BarcodeDetector` nativo cuando existe (Android/Chrome) y cae a `jsQR`
  sobre un canvas en el resto (Safari/iOS), analizando ~8 fps para no castigar la batería.

## Estructura

```
src/
├── auth/         sesión (store externo + hook con useSyncExternalStore)
├── components/   AppShell, tarjetas, iconos, primitivas de UI
├── hooks/        datos de credenciales y escáner QR
├── lib/          cliente API, tipos, parseo de QR, helpers de VC
├── routes/       una pantalla por archivo
└── styles/       hoja de estilos única
```

## Estado de la verificación

Los flujos (login con credenciales válidas e inválidas, listado, detalle, escaneo manual,
envío de la VP con éxito y con error, solicitud con rol insuficiente, creación de wallet,
logout) se probaron end-to-end en el navegador contra un mock local que reproduce el
contrato del OpenAPI, incluidas sus respuestas de error. **No se probó contra el entorno
real de D-Wallet**: hace falta un usuario con rol `holder`, que no estaba disponible.
