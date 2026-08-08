#!/usr/bin/env bash
#
# Compila la wallet Flutter para web dentro del build de Vercel.
#
# La imagen de build de Vercel es Amazon Linux 2023 con Node, sin Flutter, así
# que el script provisiona el SDK antes de compilar. Se clona el tag exacto
# (--depth 1) en vez de bajar el tarball oficial: son ~220 MB contra ~1,5 GB, y
# al apuntar HEAD al tag Flutter detecta bien su versión.
#
set -euo pipefail

# Mantener alineado con el Flutter local del equipo (`flutter --version`).
FLUTTER_VERSION="${FLUTTER_VERSION:-3.44.9}"
FLUTTER_ROOT="${FLUTTER_ROOT:-$HOME/flutter}"

# El default de `IDENTITY_API_BASE_URL` vive en lib/wallet_api.dart; esto sólo
# permite apuntar a otro backend desde las env vars del proyecto en Vercel.
IDENTITY_API_BASE_URL="${IDENTITY_API_BASE_URL:-}"

# El bootstrap de Flutter (bin/internal/update_dart_sdk.sh) extrae el Dart SDK
# con `unzip`, que no viene garantizado en la imagen.
if ! command -v unzip >/dev/null 2>&1; then
  echo "==> Instalando 'unzip' (requerido por el bootstrap de Flutter)"
  dnf install -y unzip
fi

if [ ! -x "$FLUTTER_ROOT/bin/flutter" ]; then
  echo "==> Clonando Flutter $FLUTTER_VERSION en $FLUTTER_ROOT"
  git clone --depth 1 --branch "$FLUTTER_VERSION" \
    https://github.com/flutter/flutter.git "$FLUTTER_ROOT"
fi

export PATH="$FLUTTER_ROOT/bin:$PATH"

# El clon lo hace el mismo usuario que corre el build, pero si difieren git
# aborta con "dubious ownership" y el bootstrap no puede leer la versión.
git config --global --add safe.directory "$FLUTTER_ROOT"

echo "==> Versión de Flutter"
flutter --version

echo "==> Precargando artefactos de web"
flutter precache --web

echo "==> flutter pub get"
flutter pub get

build_args=(build web --release)
if [ -n "$IDENTITY_API_BASE_URL" ]; then
  echo "==> Backend: $IDENTITY_API_BASE_URL"
  build_args+=("--dart-define=IDENTITY_API_BASE_URL=$IDENTITY_API_BASE_URL")
fi

echo "==> flutter ${build_args[*]}"
flutter "${build_args[@]}"

echo "==> Listo: build/web"
ls -la build/web
