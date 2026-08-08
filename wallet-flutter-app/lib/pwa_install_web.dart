/// Puente con el helper `window.walletPwa` que define `web/index.html`.
///
/// El evento `beforeinstallprompt` se dispara antes de que arranque Flutter y
/// es de un solo uso, así que la captura vive en el HTML y acá sólo se consulta.
library;

import 'dart:js_interop';

@JS('walletPwa')
external _WalletPwa? get _walletPwa;

extension type _WalletPwa._(JSObject _) implements JSObject {
  external bool isInstalled();
  external bool canPrompt();
  external bool isIos();
  external JSPromise<JSBoolean> prompt();
  external void onChange(JSFunction listener);
}

bool isPwaInstalled() => _walletPwa?.isInstalled() ?? false;

bool canPromptPwaInstall() => _walletPwa?.canPrompt() ?? false;

bool isIosBrowser() => _walletPwa?.isIos() ?? false;

/// Abre el diálogo nativo de instalación. `true` si el usuario aceptó.
Future<bool> promptPwaInstall() async {
  final api = _walletPwa;
  if (api == null) return false;

  final accepted = await api.prompt().toDart;
  return accepted.toDart;
}

/// Avisa cuando cambia la disponibilidad (el navegador ofreció el prompt, o la
/// app terminó de instalarse y el botón ya no tiene sentido).
void onPwaInstallChanged(void Function() listener) {
  _walletPwa?.onChange(listener.toJS);
}
