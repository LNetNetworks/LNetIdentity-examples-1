/// Implementación para builds no-web (macOS, tests): nunca hay nada que instalar.
library;

bool isPwaInstalled() => false;

bool canPromptPwaInstall() => false;

bool isIosBrowser() => false;

Future<bool> promptPwaInstall() async => false;

void onPwaInstallChanged(void Function() listener) {}
