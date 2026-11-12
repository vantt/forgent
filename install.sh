#!/bin/sh
# fgctl installer for Linux (x86_64).
#
#   curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh | sh
#   curl -fsSL https://github.com/vantt/forgent/releases/download/<tag>/install.sh | sh -s -- --version <tag>
#
# All code lives in functions and `main "$@"` is the last line, so a download
# that is cut short defines a few functions and runs nothing.
set -eu

DEFAULT_REPO_URL="https://github.com/vantt/forgent"
SUPPORTED_TARGETS="x86_64-unknown-linux-gnu"
# Per-download byte caps: the fgctl tarball is a few MiB and the whole fgOS
# release about 17 MiB, so these leave generous headroom and still stop a
# server that streams without end.
MAX_ASSET_BYTES=134217728
MAX_CHECKSUMS_BYTES=1048576

usage() {
  cat <<'EOF'
Install fgctl, the fgOS installer and manager.

Usage:
  curl -fsSL https://github.com/vantt/forgent/releases/latest/download/install.sh | sh
  curl -fsSL <release>/install.sh | sh -s -- --version <tag>

Options (each also as an environment variable):
  --version <tag>        release to install, with or without the leading v
                         (FGCTL_VERSION; default: the latest release, which is
                         never a pre-release, so an alpha needs its tag)
  -h, --help             show this help

Environment:
  FGCTL_INSTALL_DIR      where fgctl goes (default: ~/.local/bin)
  FGCTL_ASSET_BASE_URL   the directory that holds the release assets, for a
                         mirror; https://, file:///, or http:// to a loopback
                         host only. It names assets, never a repository, so it
                         needs FGCTL_VERSION.
  FGCTL_TARGET           release target (default: detected)
  FGCTL_ALLOW_ROOT=1     allow running as root

Exit codes: 0 installed, 1 failed, 2 usage error.
EOF
}

say() {
  printf '%s\n' "$*" >&2
}

die() {
  say "Error: $*"
  exit 1
}

usage_error() {
  say "Error: $1"
  say "Run with --help for usage."
  exit 2
}

cleanup() {
  [ -z "${TMP_DIR:-}" ] || rm -rf "$TMP_DIR"
  [ -z "${TEMP_BIN:-}" ] || rm -f "$TEMP_BIN"
  return 0
}

# Bounds every network call below so a server that connects but never
# finishes sending (or never responds at all) cannot hang this script
# indefinitely. curl stops a transfer that stays below 1 KiB/s for 30 s
# (--speed-limit/--speed-time), so a slow link that keeps moving can finish
# and a stalled one is cut off; --max-time 900 is the wall-clock total cap.
# The same values sit in CURL_ARGS in packages/distribution/rust/src/fetch.rs;
# change both together.
# wget has no such option -- its --timeout resets on every byte received
# (an idle timeout, not a total one) and it retries up to 20 times by
# default, so a slow-drip server could keep it alive far past the cap even
# with --tries capped. HARD_TIMEOUT_CMD wraps both with a real wall-clock
# backstop via the external `timeout` command when available, so the wget
# fallback path is genuinely bounded too, not just curl's own preferred path.
# CURL_SAFE_ARGS lets a redirect lead only to https and never below TLS 1.2.
# curl is the hardened path: wget cannot restrict where a redirect leads, so
# download_file lets it fetch https:// URLs only and caps its redirects.
init_network_limits() {
  CURL_TIMEOUT_ARGS="--connect-timeout 15 --speed-limit 1024 --speed-time 30 --max-time 900"
  CURL_SAFE_ARGS="--proto =https,http --proto-redir =https --tlsv1.2"
  WGET_TIMEOUT_ARGS="--timeout=120 --tries=1 --max-redirect=5"
  HARD_TIMEOUT_CMD=""
  if command -v timeout >/dev/null 2>&1; then
    HARD_TIMEOUT_CMD="timeout 910"
  fi
}

parse_args() {
  VERSION="${FGCTL_VERSION:-}"
  while [ $# -gt 0 ]; do
    case "$1" in
      -h|--help)
        usage
        exit 0
        ;;
      --version)
        [ $# -ge 2 ] && [ -n "$2" ] || usage_error "--version needs a release tag"
        VERSION="$2"
        shift
        ;;
      --version=*)
        VERSION="${1#--version=}"
        ;;
      *)
        usage_error "unknown option: $1"
        ;;
    esac
    shift
  done
}

# A tag is accepted as v0.2.0 or 0.2.0 and must hold only characters that are
# safe in a file name and a URL.
normalize_version() {
  case "$VERSION" in
    "") return 0 ;;
    [0-9]*) VERSION="v$VERSION" ;;
  esac
  case "$VERSION" in
    *[!A-Za-z0-9._+-]*)
      die "invalid release tag '$VERSION': only letters, digits, '.', '_', '+' and '-' are allowed"
      ;;
  esac
}

refuse_root() {
  if [ "$(id -u)" = "0" ] && [ "${FGCTL_ALLOW_ROOT:-0}" != "1" ]; then
    die "running as root is not permitted by default. Set FGCTL_ALLOW_ROOT=1 to allow."
  fi
}

detect_target() {
  if [ -n "${FGCTL_TARGET:-}" ]; then
    TARGET="$FGCTL_TARGET"
  else
    case "$(uname -s)-$(uname -m)" in
      Linux-x86_64|Linux-amd64)
        TARGET="x86_64-unknown-linux-gnu"
        ;;
      MINGW*|MSYS*|CYGWIN*)
        die "this is a Windows shell. Use install.ps1 from PowerShell instead (see the README Install section)."
        ;;
      *)
        TARGET="$(uname -s)-$(uname -m)"
        ;;
    esac
  fi
  case "$TARGET" in
    x86_64-unknown-linux-gnu)
      ;;
    *)
      say "Error: target '$TARGET' is not supported. Supported targets: $SUPPORTED_TARGETS"
      say "There is no prebuilt fgctl for it. Build from source:"
      say "  git clone $DEFAULT_REPO_URL && cd forgent && cargo build --release -p fgctl"
      say "  (the binary is target/release/fgctl)"
      exit 1
      ;;
  esac
}

# Loopback test for the host[:port] of an http:// URL: localhost, ::1, or a
# dotted-quad address in 127.0.0.0/8 with no leading zeros (some resolvers read
# those as octal).
is_loopback_host() {
  hp="$1"
  case "$hp" in
    "[::1]")
      return 0
      ;;
    "[::1]:"*)
      host="::1"
      port="${hp#*]:}"
      ;;
    "["*)
      return 1
      ;;
    *:*)
      host="${hp%%:*}"
      port="${hp#*:}"
      ;;
    *)
      host="$hp"
      port=""
      ;;
  esac
  case "$port" in
    *[!0-9]*) return 1 ;;
  esac
  case "$host" in
    localhost|::1) return 0 ;;
    127.*) ;;
    *) return 1 ;;
  esac
  case "$host" in
    *[!0-9.]*) return 1 ;;
  esac
  printf '%s\n' "$host" | awk -F. '
    NF != 4 || $1 != "127" { exit 1 }
    { for (i = 2; i <= 4; i++) if ($i == "" || $i + 0 > 255 || (length($i) > 1 && substr($i, 1, 1) == "0")) exit 1 }
  '
}

# https:// and file:/// always; http:// only for a loopback host. There is no
# escape hatch: a mirror on plain http would let anyone on the path replace the
# archive and its SHA256SUMS together.
check_url() {
  case "$1" in
    *\\*|*[[:space:]]*)
      die "refusing $1: a URL with a backslash or whitespace in it is not a valid https:// or file:/// URL"
      ;;
    https://*|file:///*)
      return 0
      ;;
    http://*)
      rest="${1#http://}"
      authority="${rest%%[/?#]*}"
      if is_loopback_host "${authority##*@}"; then
        return 0
      fi
      die "refusing $1: plain http:// is allowed only for a loopback host (127.0.0.0/8, ::1, localhost); use an https:// URL"
      ;;
    *)
      die "refusing $1: only https:// and file:/// URLs are allowed (http:// for a loopback host)"
      ;;
  esac
}

# Downloads <url> to <dest>, refusing anything larger than <max-bytes>.
# Returns non-zero when the download itself fails; dies on a refused URL or an
# oversized file. A file:/// URL is copied, so a local mirror needs no network tool.
download_file() {
  dl_url="$1"
  dl_dest="$2"
  dl_max="$3"
  check_url "$dl_url"
  case "$dl_url" in
    file://*)
      cp "${dl_url#file://}" "$dl_dest" 2>/dev/null || return 1
      ;;
    *)
      if command -v curl >/dev/null 2>&1; then
        $HARD_TIMEOUT_CMD curl -fsSL $CURL_TIMEOUT_ARGS $CURL_SAFE_ARGS --max-filesize "$dl_max" -o "$dl_dest" "$dl_url" || return 1
      elif command -v wget >/dev/null 2>&1; then
        case "$dl_url" in
          https://*) ;;
          *) die "without curl, only https:// URLs can be downloaded safely (wget cannot limit redirects); install curl to use $dl_url" ;;
        esac
        $HARD_TIMEOUT_CMD wget -q $WGET_TIMEOUT_ARGS -O "$dl_dest" "$dl_url" || return 1
      else
        die "curl or wget is required to download assets; install curl and run this installer again"
      fi
      ;;
  esac
  dl_size="$(wc -c < "$dl_dest" | tr -d ' ')"
  [ "$dl_size" -le "$dl_max" ] || die "download larger than allowed ($dl_max bytes): $dl_url"
}

# The latest release is the one <repo>/releases/latest redirects to. Only the
# default repository is asked: FGCTL_ASSET_BASE_URL names an asset directory.
resolve_latest_version() {
  latest_url="$DEFAULT_REPO_URL/releases/latest"
  if command -v curl >/dev/null 2>&1; then
    effective_url="$($HARD_TIMEOUT_CMD curl -fsSL $CURL_TIMEOUT_ARGS $CURL_SAFE_ARGS -o /dev/null -w '%{url_effective}' "$latest_url")" || effective_url=""
  elif command -v wget >/dev/null 2>&1; then
    effective_url="$($HARD_TIMEOUT_CMD wget $WGET_TIMEOUT_ARGS --spider -S "$latest_url" 2>&1 | grep -i '^[[:space:]]*Location:' | tail -n 1 | awk '{print $2}')" || effective_url=""
  else
    die "curl or wget is required to resolve the latest release; install curl, or pass --version <tag>"
  fi
  effective_url="${effective_url%%\?*}"
  effective_url="${effective_url%%\#*}"
  effective_url="${effective_url%/}"
  VERSION="${effective_url##*/}"
  if [ -z "$VERSION" ] || [ "$VERSION" = "latest" ]; then
    die "failed to resolve the latest release from $latest_url (pre-releases are never \"latest\"); pass --version <tag> or set FGCTL_VERSION"
  fi
  normalize_version
}

resolve_version_and_base() {
  if [ -n "${FGCTL_ASSET_BASE_URL:-}" ]; then
    ASSET_BASE="${FGCTL_ASSET_BASE_URL%/}"
    check_url "$ASSET_BASE"
    [ -n "$VERSION" ] || die "FGCTL_ASSET_BASE_URL names the directory that holds the assets, so the latest version cannot be looked up there; set FGCTL_VERSION (or pass --version <tag>)"
  else
    [ -n "$VERSION" ] || resolve_latest_version
    ASSET_BASE="$DEFAULT_REPO_URL/releases/download/$VERSION"
  fi
}

# One tool answers for SHA-256; the first of sha256sum, shasum and openssl found.
select_hash_tool() {
  if command -v sha256sum >/dev/null 2>&1; then
    HASH_TOOL="sha256sum"
  elif command -v shasum >/dev/null 2>&1; then
    HASH_TOOL="shasum"
  elif command -v openssl >/dev/null 2>&1; then
    HASH_TOOL="openssl"
  else
    die "no SHA-256 tool found: install sha256sum (coreutils), shasum or openssl, then run this installer again"
  fi
}

sha256_of() {
  case "$HASH_TOOL" in
    sha256sum) sha256sum "$1" | cut -d' ' -f1 ;;
    shasum) shasum -a 256 "$1" | cut -d' ' -f1 ;;
    openssl) openssl dgst -sha256 "$1" | awk '{print $NF}' ;;
  esac
}

# Checks <archive> against the one entry in <sums> whose file name is exactly
# <asset> (a leading binary-mode "*" is ignored, a substring never matches).
verify_checksum() {
  vc_sums="$1"
  vc_asset="$2"
  vc_archive="$3"
  vc_count="$(awk -v f="$vc_asset" '{ n = $2; sub(/^\*/, "", n); if (n == f) c++ } END { print c + 0 }' "$vc_sums")"
  [ "$vc_count" != "0" ] || die "no checksum entry found for $vc_asset in SHA256SUMS"
  [ "$vc_count" = "1" ] || die "SHA256SUMS lists $vc_asset more than once; refusing to choose between the entries"
  vc_expected="$(awk -v f="$vc_asset" '{ n = $2; sub(/^\*/, "", n); if (n == f) { print $1; exit } }' "$vc_sums" | tr 'A-F' 'a-f')"
  case "$vc_expected" in
    ""|*[!0-9a-f]*) die "invalid checksum entry for $vc_asset in SHA256SUMS" ;;
  esac
  [ "${#vc_expected}" = "64" ] || die "invalid checksum entry for $vc_asset in SHA256SUMS"
  [ "$(sha256_of "$vc_archive")" = "$vc_expected" ] || die "checksum verification failed for $vc_asset"
}

# Lists the archive before anything is extracted: no link or special file, no
# absolute, drive-letter or `..` path, and fgctl itself at the archive root.
check_layout() {
  tar -tzvf "$1" > "$TMP_DIR/entries-long" 2>/dev/null || die "failed to read $TARBALL (it is not a gzip tar archive)"
  tar -tzf "$1" > "$TMP_DIR/entries" 2>/dev/null || die "failed to read $TARBALL (it is not a gzip tar archive)"
  if awk '{ t = substr($0, 1, 1); if (t != "-" && t != "d") bad = 1 } END { exit bad ? 0 : 1 }' "$TMP_DIR/entries-long"; then
    die "$TARBALL contains a symlink, hard link or special file, which is refused"
  fi
  FGCTL_MEMBER=""
  while IFS= read -r member; do
    case "$member" in
      /*|[A-Za-z]:*|..|../*|*/..|*/../*|*\\*)
        die "unsafe path in $TARBALL: $member"
        ;;
      fgctl|./fgctl)
        FGCTL_MEMBER="$member"
        ;;
    esac
  done < "$TMP_DIR/entries"
  [ -n "$FGCTL_MEMBER" ] || die "$TARBALL has no fgctl at its root"
}

# Extracts only fgctl, then activates it by rename. The candidate runs once
# before it replaces anything, so a binary that cannot start here never
# displaces the one already installed.
install_binary() {
  extract_dir="$TMP_DIR/extracted"
  mkdir -p "$extract_dir"
  tar -xzf "$TMP_DIR/$TARBALL" -C "$extract_dir" "$FGCTL_MEMBER" || die "failed to extract $TARBALL"
  extracted="$extract_dir/fgctl"
  if [ ! -f "$extracted" ] || [ -L "$extracted" ]; then
    die "fgctl in $TARBALL is not a regular file"
  fi
  INSTALL_DIR="${FGCTL_INSTALL_DIR:-$HOME/.local/bin}"
  INSTALL_DIR="${INSTALL_DIR%/}"
  mkdir -p "$INSTALL_DIR"
  TEMP_BIN="$INSTALL_DIR/.fgctl.$$.tmp"
  cp "$extracted" "$TEMP_BIN"
  chmod 755 "$TEMP_BIN"
  "$TEMP_BIN" --version >/dev/null 2>&1 || die "the downloaded fgctl does not run on this machine ($(uname -sm)); nothing was installed. Report this release at $DEFAULT_REPO_URL/issues"
  mv -f "$TEMP_BIN" "$INSTALL_DIR/fgctl"
  TEMP_BIN=""
}

print_next_steps() {
  fgctl_cmd="fgctl"
  case ":$PATH:" in
    *":$INSTALL_DIR:"*)
      ;;
    *)
      fgctl_cmd="$INSTALL_DIR/fgctl"
      echo ""
      echo "Notice: $INSTALL_DIR is not in your PATH."
      echo "Add it to your shell configuration file by running:"
      echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
      ;;
  esac
  echo ""
  echo "Installed fgctl $VERSION to $INSTALL_DIR/fgctl"
  echo "Next, from inside your project (a git repository):"
  echo "  $fgctl_cmd init"
  echo "  fgos run \"<prompt>\""
}

main() {
  init_network_limits
  parse_args "$@"
  normalize_version
  refuse_root
  detect_target
  select_hash_tool
  resolve_version_and_base

  TARBALL="fgctl-${VERSION}-${TARGET}.tar.gz"
  TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t 'fgctl-install')"
  TEMP_BIN=""
  trap cleanup EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM

  if ! download_file "$ASSET_BASE/$TARBALL" "$TMP_DIR/$TARBALL" "$MAX_ASSET_BYTES"; then
    die "failed to download $TARBALL from $ASSET_BASE/$TARBALL"
  fi
  if ! download_file "$ASSET_BASE/SHA256SUMS" "$TMP_DIR/SHA256SUMS" "$MAX_CHECKSUMS_BYTES"; then
    die "failed to download SHA256SUMS from $ASSET_BASE/SHA256SUMS"
  fi
  verify_checksum "$TMP_DIR/SHA256SUMS" "$TARBALL" "$TMP_DIR/$TARBALL"
  check_layout "$TMP_DIR/$TARBALL"
  install_binary
  print_next_steps
}

main "$@"
