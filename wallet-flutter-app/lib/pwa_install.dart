/// Instalación de la webapp como PWA.
///
/// Fuera de la web ninguna de estas consultas aplica, así que el stub devuelve
/// siempre `false` y el botón de instalar no se muestra.
library;

export 'pwa_install_stub.dart'
    if (dart.library.js_interop) 'pwa_install_web.dart';
