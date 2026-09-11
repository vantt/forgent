#!/bin/sh
set -eu

# R6: Refuse to run as root unless explicitly allowed
if [ "$(id -u)" = "0" ] && [ "${FGCTL_ALLOW_ROOT:-0}" != "1" ]; then
  echo "Error: running as root is not permitted by default. Set FGCTL_ALLOW_ROOT=1 to allow." >&2
  exit 1
fi

# R2: Target detection and override
SUPPORTED_TARGETS="x86_64-unknown-linux-gnu"

if [ -n "${FGCTL_TARGET:-}" ]; then
  TARGET="$FGCTL_TARGET"
else
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  case "$OS-$ARCH" in
    Linux-x86_64|Linux-amd64)
      TARGET="x86_64-unknown-linux-gnu"
      ;;
    *)
      TARGET="$OS-$ARCH"
      ;;
  esac
fi

case "$TARGET" in
  x86_64-unknown-linux-gnu)
    ;;
  *)
    echo "Error: target '$TARGET' is not supported. Supported targets: $SUPPORTED_TARGETS" >&2
    exit 1
    ;;
esac

download_file() {
  dl_url="$1"
  dl_dest="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$dl_dest" "$dl_url"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$dl_dest" "$dl_url"
  else
    echo "Error: curl or wget is required to download assets" >&2
    exit 1
  fi
}

# R3: Version resolution
if [ -n "${FGCTL_VERSION:-}" ]; then
  VERSION="$FGCTL_VERSION"
else
  if [ -n "${FGCTL_ASSET_BASE_URL:-}" ]; then
    LATEST_URL="${FGCTL_ASSET_BASE_URL%/}/releases/latest"
  else
    LATEST_URL="https://github.com/vantt/forgent/releases/latest"
  fi

  if command -v curl >/dev/null 2>&1; then
    EFFECTIVE_URL="$(curl -fsSL -o /dev/null -w '%{url_effective}' "$LATEST_URL")"
  elif command -v wget >/dev/null 2>&1; then
    EFFECTIVE_URL="$(wget --spider -S "$LATEST_URL" 2>&1 | grep -i '^[[:space:]]*Location:' | tail -n 1 | awk '{print $2}')"
  else
    echo "Error: curl or wget is required to resolve the latest release" >&2
    exit 1
  fi

  EFFECTIVE_URL="${EFFECTIVE_URL%%\?*}"
  EFFECTIVE_URL="${EFFECTIVE_URL%%\#*}"
  EFFECTIVE_URL="${EFFECTIVE_URL%/}"
  VERSION="${EFFECTIVE_URL##*/}"

  if [ -z "$VERSION" ]; then
    echo "Error: failed to resolve latest version from $LATEST_URL" >&2
    exit 1
  fi
fi

# R4: Asset base URL and asset download
TARBALL="fgctl-${VERSION}-${TARGET}.tar.gz"
if [ -n "${FGCTL_ASSET_BASE_URL:-}" ]; then
  ASSET_BASE="${FGCTL_ASSET_BASE_URL%/}"
else
  ASSET_BASE="https://github.com/vantt/forgent/releases/download/${VERSION}"
fi

TARBALL_URL="${ASSET_BASE}/${TARBALL}"
CHECKSUMS_URL="${ASSET_BASE}/SHA256SUMS"

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t 'fgctl-install')"
trap 'rm -rf "$TMP_DIR"' EXIT INT TERM

if ! download_file "$TARBALL_URL" "$TMP_DIR/$TARBALL"; then
  echo "Error: failed to download $TARBALL from $TARBALL_URL" >&2
  exit 1
fi

if ! download_file "$CHECKSUMS_URL" "$TMP_DIR/SHA256SUMS"; then
  echo "Error: failed to download SHA256SUMS from $CHECKSUMS_URL" >&2
  exit 1
fi

# Checksum verification against the tarball's own line in SHA256SUMS
TARBALL_LINE="$(grep -F "$TARBALL" "$TMP_DIR/SHA256SUMS" || true)"
if [ -z "$TARBALL_LINE" ]; then
  echo "Error: no checksum entry found for $TARBALL in SHA256SUMS" >&2
  exit 1
fi

HASH="$(echo "$TARBALL_LINE" | awk '{print $1}')"
if [ -z "$HASH" ]; then
  echo "Error: invalid checksum entry for $TARBALL in SHA256SUMS" >&2
  exit 1
fi

printf '%s  %s\n' "$HASH" "$TARBALL" > "$TMP_DIR/single_checksum.txt"

CHECKSUM_OK=0
if (cd "$TMP_DIR" && command -v sha256sum >/dev/null 2>&1 && sha256sum -c --ignore-missing single_checksum.txt >/dev/null 2>&1); then
  CHECKSUM_OK=1
elif (cd "$TMP_DIR" && command -v shasum >/dev/null 2>&1 && shasum -a 256 -c single_checksum.txt >/dev/null 2>&1); then
  CHECKSUM_OK=1
fi

if [ "$CHECKSUM_OK" != "1" ]; then
  echo "Error: checksum verification failed for $TARBALL" >&2
  exit 1
fi

# R5: Extract to fresh temp dir and atomically install to FGCTL_INSTALL_DIR
EXTRACT_DIR="$TMP_DIR/extracted"
mkdir -p "$EXTRACT_DIR"
if ! tar -xzf "$TMP_DIR/$TARBALL" -C "$EXTRACT_DIR"; then
  echo "Error: failed to extract $TARBALL" >&2
  exit 1
fi

if [ -f "$EXTRACT_DIR/fgctl" ]; then
  FGCTL_BIN="$EXTRACT_DIR/fgctl"
else
  FGCTL_BIN="$(find "$EXTRACT_DIR" -type f -name fgctl 2>/dev/null | head -n 1 || true)"
fi

if [ -z "$FGCTL_BIN" ] || [ ! -f "$FGCTL_BIN" ]; then
  echo "Error: fgctl binary not found in $TARBALL" >&2
  exit 1
fi

INSTALL_DIR="${FGCTL_INSTALL_DIR:-$HOME/.local/bin}"
mkdir -p "$INSTALL_DIR"

TEMP_BIN="$INSTALL_DIR/.fgctl.$$.tmp"
cp "$FGCTL_BIN" "$TEMP_BIN"
chmod 755 "$TEMP_BIN"
mv -f "$TEMP_BIN" "$INSTALL_DIR/fgctl"

# R6: PATH advisory and next step
INSTALL_DIR_CLEAN="${INSTALL_DIR%/}"
PATH_FOUND=0
case ":$PATH:" in
  *":$INSTALL_DIR_CLEAN:"*)
    PATH_FOUND=1
    ;;
esac

if [ "$PATH_FOUND" = "0" ]; then
  echo ""
  echo "Notice: $INSTALL_DIR_CLEAN is not in your PATH."
  echo "Add it to your shell configuration file by running:"
  echo "  export PATH=\"$INSTALL_DIR_CLEAN:\$PATH\""
fi

echo ""
echo "Installed fgctl successfully to $INSTALL_DIR/fgctl"
echo "Next step:"
echo "  fgctl init"
