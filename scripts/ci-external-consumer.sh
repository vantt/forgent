#!/bin/sh
set -eu

# scripts/ci-external-consumer.sh
# External-consumer walking skeleton proof (Phase 15 R1).
# Takes `--assets <dir>` containing fgos-*.tar.gz, fgctl-*.tar.gz, SHA256SUMS, and install.sh.
# Builds nothing itself; verifies the entire consumer flow outside the repo checkout.

usage() {
  echo "Usage: $0 --assets <directory>" >&2
  exit 1
}

ASSETS_DIR=""
while [ $# -gt 0 ]; do
  case "$1" in
    --assets)
      if [ -n "${2:-}" ]; then
        ASSETS_DIR="$2"
        shift 2
      else
        echo "Error: --assets requires a directory argument" >&2
        usage
      fi
      ;;
    *)
      echo "Error: unrecognized argument: $1" >&2
      usage
      ;;
  esac
done

if [ -z "$ASSETS_DIR" ]; then
  echo "Error: --assets <dir> is required" >&2
  usage
fi

if [ ! -d "$ASSETS_DIR" ]; then
  echo "Step failed: assets directory does not exist: $ASSETS_DIR" >&2
  exit 1
fi

ASSETS_DIR="$(cd "$ASSETS_DIR" && pwd)"

# Verify required files exist in assets dir
FGOS_TARBALL=""
for f in "$ASSETS_DIR"/fgos-*.tar.gz; do
  if [ -f "$f" ]; then
    FGOS_TARBALL="$f"
    break
  fi
done

FGCTL_TARBALL=""
for f in "$ASSETS_DIR"/fgctl-*.tar.gz; do
  if [ -f "$f" ]; then
    FGCTL_TARBALL="$f"
    break
  fi
done

if [ -z "$FGOS_TARBALL" ]; then
  echo "Step failed: fgos-*.tar.gz not found in $ASSETS_DIR" >&2
  exit 1
fi

if [ -z "$FGCTL_TARBALL" ]; then
  echo "Step failed: fgctl-*.tar.gz not found in $ASSETS_DIR" >&2
  exit 1
fi

if [ ! -f "$ASSETS_DIR/SHA256SUMS" ]; then
  echo "Step failed: SHA256SUMS not found in $ASSETS_DIR" >&2
  exit 1
fi

if [ ! -f "$ASSETS_DIR/install.sh" ]; then
  echo "Step failed: install.sh not found in $ASSETS_DIR" >&2
  exit 1
fi

# Set up temp working directory and cleanup trap
TMP_BASE="$(mktemp -d 2>/dev/null || mktemp -d -t 'fgos-ci-consumer')"
PORT_FILE="$TMP_BASE/port"

cleanup() {
  if [ -n "${SERVER_PID:-}" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  if [ -n "${TMP_BASE:-}" ] && [ -d "$TMP_BASE" ]; then
    rm -rf "$TMP_BASE"
  fi
}
trap cleanup EXIT INT TERM

# Start local static file server on node:http
node -e '
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const dir = path.resolve(process.argv[1]);
const files = fs.readdirSync(dir);
const fgctl = files.find(f => f.startsWith("fgctl-") && f.endsWith(".tar.gz"));
let ver = "v0.1.0";
if (fgctl) {
  const m = fgctl.match(/^fgctl-(.+)-(x86_64-unknown-linux-gnu|\w+-\w+-\w+-\w+)\.tar\.gz$/);
  if (m) ver = m[1];
}
const s = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (u === "/releases/latest" || u === "/releases/latest/") {
    res.writeHead(302, { Location: "/releases/tag/" + ver });
    res.end();
    return;
  }
  if (u === "/releases/tag/" + ver) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  const f = path.join(dir, path.basename(u));
  let st;
  try { st = fs.lstatSync(f); } catch { st = null; }
  if (st && st.isFile()) {
    res.writeHead(200, { "Content-Length": st.size });
    fs.createReadStream(f).pipe(res);
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});
s.listen(0, "127.0.0.1", () => {
  fs.writeFileSync(process.argv[2], String(s.address().port));
});
' "$ASSETS_DIR" "$PORT_FILE" &
SERVER_PID=$!

PORT=""
for _ in $(seq 1 50); do
  if [ -s "$PORT_FILE" ]; then
    PORT="$(head -n 1 "$PORT_FILE")"
    break
  fi
  sleep 0.1
done

if [ -z "$PORT" ]; then
  echo "Step failed: starting local static file server on node:http" >&2
  exit 1
fi

# Run install.sh with fresh temp paths
TEMP_INSTALL_DIR="$TMP_BASE/install"
TEMP_HOME="$TMP_BASE/home"
mkdir -p "$TEMP_INSTALL_DIR" "$TEMP_HOME"

FGCTL_ASSET_BASE_URL="http://127.0.0.1:$PORT"
FGCTL_INSTALL_DIR="$TEMP_INSTALL_DIR"
HOME="$TEMP_HOME"
FGCTL_ALLOW_ROOT=1
export FGCTL_ASSET_BASE_URL FGCTL_INSTALL_DIR HOME FGCTL_ALLOW_ROOT

if ! sh "$ASSETS_DIR/install.sh"; then
  echo "Step failed: install.sh execution against local asset server" >&2
  exit 1
fi

FGCTL_BIN="$TEMP_INSTALL_DIR/fgctl"
if [ ! -x "$FGCTL_BIN" ]; then
  echo "Step failed: fgctl binary not found or not executable at $FGCTL_BIN" >&2
  exit 1
fi

# Fresh git init temp project
TEMP_PROJECT="$TMP_BASE/project"
mkdir -p "$TEMP_PROJECT"

(
  cd "$TEMP_PROJECT" &&
  git init -q &&
  git config user.name "CI Consumer" &&
  git config user.email "consumer@example.com"
) || {
  echo "Step failed: git init in fresh temp project" >&2
  exit 1
}

# fgctl init --from <fgos tarball>
(
  cd "$TEMP_PROJECT" &&
  PATH="$TEMP_INSTALL_DIR:$PATH" "$FGCTL_BIN" init --from "$FGOS_TARBALL"
) || {
  echo "Step failed: fgctl init --from $FGOS_TARBALL" >&2
  exit 1
}

# fgos version --runtime-json and assertion
VERSION_OUTPUT="$(
  cd "$TEMP_PROJECT" &&
  .fgos/installation/bin/fgos version --runtime-json
)" || {
  echo "Step failed: .fgos/installation/bin/fgos version --runtime-json execution" >&2
  exit 1
}

FGOS_BASENAME="$(basename "$FGOS_TARBALL")"
SHA_RECORD="$(awk -v f="$FGOS_BASENAME" '{ n = $2; sub(/^\*/, "", n); sub(/^dist\//, "", n); if (n == f) { print $1; exit } }' "$ASSETS_DIR/SHA256SUMS")"
if [ -z "$SHA_RECORD" ]; then
  echo "Step failed: SHA256SUMS has no entry for $FGOS_BASENAME" >&2
  exit 1
fi

# Gate 1: the archive's own bytes must match the published SHA256SUMS
# record -- this is the only check that can detect a tampered/corrupted
# tarball in transit. It must pass BEFORE any content extracted from the
# archive (below) is trusted.
ARCHIVE_SHA="$(sha256sum "$FGOS_TARBALL" | awk '{ print $1 }')"
if [ "$ARCHIVE_SHA" != "$SHA_RECORD" ]; then
  echo "Step failed: $FGOS_BASENAME sha256 ($ARCHIVE_SHA) does not match SHA256SUMS ($SHA_RECORD)" >&2
  exit 1
fi

# Gate 2: artifactDigest is a canonical hash of the release manifest/tree
# content, not of the compressed archive bytes, so it is never expected to
# equal the SHA256SUMS record above -- it is compared against the same
# archive's own manifest.json instead. This is only trustworthy because
# Gate 1 already proved these archive bytes are authentic.
MANIFEST_DIGEST="$( (tar -xzf "$FGOS_TARBALL" ./manifest.json -O 2>/dev/null || tar -xzf "$FGOS_TARBALL" manifest.json -O 2>/dev/null) | node -e '
  let d = "";
  process.stdin.on("data", c => d += c);
  process.stdin.on("end", () => {
    try { console.log(JSON.parse(d).artifactDigest || ""); } catch { console.log(""); }
  });
')"

node -e '
  const versionJson = JSON.parse(process.argv[1]);
  const manifestDigest = (process.argv[2] || "").trim();

  const host = versionJson.data?.host;
  if (host !== "rust") {
    console.error(`Assertion failed: expected host == "rust", got "${host}"`);
    process.exit(1);
  }

  const reportedDigest = versionJson.data?.artifactDigest;
  if (!reportedDigest) {
    console.error("Assertion failed: version --runtime-json missing data.artifactDigest");
    process.exit(1);
  }

  const reportedHex = reportedDigest.replace(/^sha256:/, "");
  const manifestHex = manifestDigest.replace(/^sha256:/, "");

  if (!manifestHex || reportedHex !== manifestHex) {
    console.error(`Assertion failed: reported digest "${reportedDigest}" does not match the verified archive manifest ("${manifestDigest}")`);
    process.exit(1);
  }
' "$VERSION_OUTPUT" "$MANIFEST_DIGEST" || {
  echo "Step failed: inline assertion for version --runtime-json (host == "rust" and digest match)" >&2
  exit 1
}

# fgos ready --json
(
  cd "$TEMP_PROJECT" &&
  .fgos/installation/bin/fgos ready --json >/dev/null
) || {
  echo "Step failed: .fgos/installation/bin/fgos ready --json" >&2
  exit 1
}

# fgctl upgrade --from <the same asset> (assert no-op)
ACT_FILE="$TEMP_PROJECT/.fgos/installation/activation.json"
PREV_DIGEST="$(node -pe 'JSON.parse(fs.readFileSync(process.argv[1])).artifactDigest' "$ACT_FILE")"
PREV_PREV="$(node -pe 'JSON.parse(fs.readFileSync(process.argv[1])).previousArtifactDigest ?? "null"' "$ACT_FILE")"

(
  cd "$TEMP_PROJECT" &&
  PATH="$TEMP_INSTALL_DIR:$PATH" "$FGCTL_BIN" upgrade --from "$FGOS_TARBALL"
) || {
  echo "Step failed: fgctl upgrade --from $FGOS_TARBALL" >&2
  exit 1
}

POST_DIGEST="$(node -pe 'JSON.parse(fs.readFileSync(process.argv[1])).artifactDigest' "$ACT_FILE")"
POST_PREV="$(node -pe 'JSON.parse(fs.readFileSync(process.argv[1])).previousArtifactDigest ?? "null"' "$ACT_FILE")"

if [ "$PREV_DIGEST" != "$POST_DIGEST" ]; then
  echo "Step failed: fgctl upgrade no-op assertion (expected artifactDigest $PREV_DIGEST, got $POST_DIGEST)" >&2
  exit 1
fi

if [ "$PREV_PREV" != "$POST_PREV" ]; then
  echo "Step failed: fgctl upgrade no-op assertion (expected previousArtifactDigest $PREV_PREV, got $POST_PREV)" >&2
  exit 1
fi

# fgctl repair
(
  cd "$TEMP_PROJECT" &&
  PATH="$TEMP_INSTALL_DIR:$PATH" "$FGCTL_BIN" repair
) || {
  echo "Step failed: fgctl repair" >&2
  exit 1
}

echo "All external consumer proof steps passed successfully."
exit 0
