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

# Start the local release stand-in (same server the Windows proof uses)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
node "$SCRIPT_DIR/ci-asset-server.mjs" "$ASSETS_DIR" "$PORT_FILE" &
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

# FGCTL_ASSET_BASE_URL names the asset directory, so the tag comes from the
# asset's own file name (fgctl-<tag>-<target>.tar.gz).
FGCTL_TAG="$(basename "$FGCTL_TARBALL" | sed 's/^fgctl-//; s/-x86_64-unknown-linux-gnu\.tar\.gz$//')"
FGCTL_ASSET_BASE_URL="http://127.0.0.1:$PORT"
FGCTL_INSTALL_DIR="$TEMP_INSTALL_DIR"
HOME="$TEMP_HOME"
FGCTL_ALLOW_ROOT=1
export FGCTL_ASSET_BASE_URL FGCTL_INSTALL_DIR HOME FGCTL_ALLOW_ROOT

if ! FGCTL_VERSION="$FGCTL_TAG" sh "$ASSETS_DIR/install.sh"; then
  echo "Step failed: install.sh execution against local asset server" >&2
  exit 1
fi

FGCTL_BIN="$TEMP_INSTALL_DIR/fgctl"
if [ ! -x "$FGCTL_BIN" ]; then
  echo "Step failed: fgctl binary not found or not executable at $FGCTL_BIN" >&2
  exit 1
fi

# Fresh git init temp project. Named sandbox class (Git spec §13, external-consumer CI):
# the only repository this script's git touches is the one it creates here under $TMP_BASE,
# through the sandbox door (scripts/lib/sandbox-git.mjs), which refuses any path outside it.
TEMP_PROJECT="$TMP_BASE/project"
mkdir -p "$TEMP_PROJECT"

SANDBOX_GIT="$SCRIPT_DIR/lib/sandbox-git.mjs"
(
  node "$SANDBOX_GIT" --root "$TMP_BASE" -- init -q "$TEMP_PROJECT" &&
  node "$SANDBOX_GIT" --root "$TMP_BASE" -- -C "$TEMP_PROJECT" config user.name "CI Consumer" &&
  node "$SANDBOX_GIT" --root "$TMP_BASE" -- -C "$TEMP_PROJECT" config user.email "consumer@example.com"
) || {
  echo "Step failed: git init in fresh temp project" >&2
  exit 1
}

# fgctl init --from <fgos tarball>. This proof is about activation; an init that activated but ends
# on the list of checks that still need the user (this runner's agent CLIs, trust stores) exits 2
# (precondition in packages/host-runtime/contracts/exit-codes.v1.json) and is accepted, because the
# steps below read the activated release itself.
INIT_STATUS=0
INIT_OUTPUT="$(
  cd "$TEMP_PROJECT" &&
  PATH="$TEMP_INSTALL_DIR:$PATH" "$FGCTL_BIN" init --from "$FGOS_TARBALL" 2>&1
)" || INIT_STATUS=$?
printf '%s\n' "$INIT_OUTPUT"
if [ "$INIT_STATUS" -ne 0 ] && [ "$INIT_STATUS" -ne 2 ]; then
  echo "Step failed: fgctl init --from $FGOS_TARBALL" >&2
  exit 1
fi

# The release manifest's artifactDigest inside an fgos archive (empty when unreadable).
archive_manifest_digest() {
  (tar -xzf "$1" ./manifest.json -O 2>/dev/null || tar -xzf "$1" manifest.json -O 2>/dev/null) | node -e '
    let d = "";
    process.stdin.on("data", c => d += c);
    process.stdin.on("end", () => {
      try { console.log(JSON.parse(d).artifactDigest || ""); } catch { console.log(""); }
    });
  '
}

# fgos version --runtime-json and assertion
VERSION_OUTPUT="$(
  cd "$TEMP_PROJECT" &&
  .fgos/installation/bin/fgos version --runtime-json
)" || {
  echo "Step failed: .fgos/installation/bin/fgos version --runtime-json execution" >&2
  exit 1
}

# A verb that loads a runtime dependency (workflow imports the yaml package) must run from the
# installed release alone. `version` above never imports it, so only this step catches a release
# tree that shipped without its dependencies.
WORKFLOW_OUTPUT="$(
  cd "$TEMP_PROJECT" &&
  .fgos/installation/bin/fgos workflow status 2>&1 || true
)"
case "$WORKFLOW_OUTPUT" in
  *"Cannot find package"*)
    echo "Step failed: .fgos/installation/bin/fgos workflow status cannot load a runtime dependency: $WORKFLOW_OUTPUT" >&2
    exit 1
    ;;
esac

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
MANIFEST_DIGEST="$(archive_manifest_digest "$FGOS_TARBALL")"

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

# fgos doctor --json on a clean runner (no agent CLI, no global config), with fgctl on PATH as
# the installer tells a consumer to put it: the report must be ok. Warnings are allowed, a
# failing row is not. The exit code stays 0, so read `data.ok`.
DOCTOR_JSON="$(cd "$TEMP_PROJECT" && PATH="$TEMP_INSTALL_DIR:$PATH" .fgos/installation/bin/fgos doctor --json)" || {
  echo "Step failed: .fgos/installation/bin/fgos doctor --json" >&2
  exit 1
}
node -e '
  const report = JSON.parse(process.argv[1]).data;
  if (report?.ok !== true) {
    const failing = (report?.checks || []).filter((row) => row.status === "fail").map((row) => `${row.id}: ${row.message}`);
    console.error(`Assertion failed: fgos doctor --json data.ok is ${report?.ok}; failing rows: ${JSON.stringify(failing, null, 2)}; next: ${JSON.stringify(report?.next)}`);
    process.exit(1);
  }
' "$DOCTOR_JSON" || {
  echo "Step failed: fgos doctor --json must report ok: true on a clean runner" >&2
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

# fgctl verify (release files intact, workspace shims present and current)
(
  cd "$TEMP_PROJECT" &&
  PATH="$TEMP_INSTALL_DIR:$PATH" "$FGCTL_BIN" verify
) || {
  echo "Step failed: fgctl verify" >&2
  exit 1
}

# ---- upgrade from the previous release ----------------------------------------------------
# A real consumer upgrades from what they have installed, not from the same bytes. The previous
# published release is resolved by semver (scripts/previous-release-tag.mjs), its own assets and
# installer are downloaded, and the candidate built in this run upgrades a project on it.
# Only a runner with no `gh` outside CI skips; in CI a resolution or download error fails the proof.
if [ -z "${CI:-}" ] && ! command -v gh >/dev/null 2>&1; then
  echo "Skipping the upgrade-from-previous-release proof: gh is not installed (CI always runs it)."
else
  PREV_STATUS=0
  PREV_TAG="$(node "$SCRIPT_DIR/previous-release-tag.mjs" --candidate "$FGCTL_TAG")" || PREV_STATUS=$?
  if [ "$PREV_STATUS" -eq 3 ]; then
    echo "Skipping the upgrade-from-previous-release proof: no release earlier than $FGCTL_TAG exists."
  elif [ "$PREV_STATUS" -ne 0 ] || [ -z "$PREV_TAG" ]; then
    echo "Step failed: resolving the previous release (exit $PREV_STATUS)" >&2
    exit 1
  else
    PREV_TARGET="x86_64-unknown-linux-gnu"
    echo "Upgrade proof: previous release $PREV_TAG -> candidate $FGCTL_TAG"
    if [ "$PREV_TAG" = "$FGCTL_TAG" ]; then
      echo "Step failed: the previous release resolved to the candidate itself ($PREV_TAG)" >&2
      exit 1
    fi

    # A consumer upgrading has only the previous release's home and state; the candidate flow above
    # wrote its own, and the two must not share one.
    PROOF_HOME="$HOME"
    HOME="$TMP_BASE/upgrade-home"
    mkdir -p "$HOME"
    export HOME

    PREV_DIR="$TMP_BASE/previous-release"
    mkdir -p "$PREV_DIR"
    set -- --dir "$PREV_DIR" \
      --pattern "fgos-$PREV_TAG-$PREV_TARGET.tar.gz" --pattern "fgctl-$PREV_TAG-$PREV_TARGET.tar.gz" \
      --pattern SHA256SUMS --pattern install.sh
    if [ -n "${GITHUB_REPOSITORY:-}" ]; then set -- "$@" --repo "$GITHUB_REPOSITORY"; fi
    gh release download "$PREV_TAG" "$@" || {
      echo "Step failed: downloading the $PREV_TAG assets" >&2
      exit 1
    }
    (cd "$PREV_DIR" && sha256sum --check --ignore-missing SHA256SUMS >/dev/null) || {
      echo "Step failed: the downloaded $PREV_TAG assets do not match its SHA256SUMS" >&2
      exit 1
    }
    PREV_FGOS_TARBALL="$PREV_DIR/fgos-$PREV_TAG-$PREV_TARGET.tar.gz"
    PREV_MANIFEST_DIGEST="$(archive_manifest_digest "$PREV_FGOS_TARBALL")"
    if [ -z "$PREV_MANIFEST_DIGEST" ] || [ "$PREV_MANIFEST_DIGEST" = "$MANIFEST_DIGEST" ]; then
      echo "Step failed: the previous release ($PREV_TAG, '$PREV_MANIFEST_DIGEST') must be a different artifact from the candidate ('$MANIFEST_DIGEST')" >&2
      exit 1
    fi

    # Install the previous fgctl with the previous release's own installer.
    node "$SCRIPT_DIR/ci-asset-server.mjs" "$PREV_DIR" "$TMP_BASE/prev-port" &
    PREV_SERVER_PID=$!
    PREV_PORT=""
    for _ in $(seq 1 50); do
      if [ -s "$TMP_BASE/prev-port" ]; then PREV_PORT="$(head -n 1 "$TMP_BASE/prev-port")"; break; fi
      sleep 0.1
    done
    [ -n "$PREV_PORT" ] || { kill "$PREV_SERVER_PID" 2>/dev/null || true; echo "Step failed: starting the previous-release asset server" >&2; exit 1; }
    PREV_INSTALL_DIR="$TMP_BASE/prev-install"
    mkdir -p "$PREV_INSTALL_DIR"
    FGCTL_ASSET_BASE_URL="http://127.0.0.1:$PREV_PORT" FGCTL_INSTALL_DIR="$PREV_INSTALL_DIR" FGCTL_VERSION="$PREV_TAG" \
      sh "$PREV_DIR/install.sh" || {
      kill "$PREV_SERVER_PID" 2>/dev/null || true
      echo "Step failed: install.sh of $PREV_TAG" >&2
      exit 1
    }
    kill "$PREV_SERVER_PID" 2>/dev/null || true
    wait "$PREV_SERVER_PID" 2>/dev/null || true

    UPGRADE_PROJECT="$TMP_BASE/upgrade-project"
    mkdir -p "$UPGRADE_PROJECT"
    node "$SANDBOX_GIT" --root "$TMP_BASE" -- init -q "$UPGRADE_PROJECT" || {
      echo "Step failed: git init in the upgrade project" >&2
      exit 1
    }
    # A consumer of the previous release has its fgctl directory on PATH, as its installer says;
    # without it the previous doctor finds no place for the project launcher and init is not ready.
    (cd "$UPGRADE_PROJECT" && PATH="$PREV_INSTALL_DIR:$PATH" "$PREV_INSTALL_DIR/fgctl" init --from "$PREV_FGOS_TARBALL") || {
      echo "Step failed: $PREV_TAG fgctl init --from its own fgos asset" >&2
      exit 1
    }
    UPGRADE_ACT="$UPGRADE_PROJECT/.fgos/installation/activation.json"
    BEFORE_DIGEST="$(node -pe 'JSON.parse(fs.readFileSync(process.argv[1])).artifactDigest' "$UPGRADE_ACT")"
    if [ "${BEFORE_DIGEST#sha256:}" != "${PREV_MANIFEST_DIGEST#sha256:}" ]; then
      echo "Step failed: the project is not on the $PREV_TAG artifact (activation $BEFORE_DIGEST, asset $PREV_MANIFEST_DIGEST)" >&2
      exit 1
    fi

    # The project's own config must keep its effective values across the upgrade, whichever file
    # format holds them afterwards. The proof sets one non-standard key and reads one the previous
    # release wrote, in the legacy project file that release's init created, then reads both back
    # through the candidate's `fgos config show --json`.
    UPGRADE_CONFIG="$UPGRADE_PROJECT/.fgos/config.json"
    if [ ! -f "$UPGRADE_CONFIG" ]; then
      echo "Step failed: $PREV_TAG fgctl init left no .fgos/config.json to set the proof's keys in" >&2
      exit 1
    fi
    CONFIG_KEYS_BEFORE="$(node -e '
      const fs = require("node:fs");
      const file = process.argv[1];
      const config = JSON.parse(fs.readFileSync(file, "utf8"));
      config.gateBypass = { ...config.gateBypass, level: "light" };
      if (typeof config.ironLaw?.level !== "string") { console.error("no ironLaw.level in the previous release config"); process.exit(1); }
      fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
      console.log(JSON.stringify({ "gateBypass.level": config.gateBypass.level, "ironLaw.level": config.ironLaw.level }));
    ' "$UPGRADE_CONFIG")" || {
      echo "Step failed: recording the project config values before the upgrade" >&2
      exit 1
    }

    (cd "$UPGRADE_PROJECT" && PATH="$TEMP_INSTALL_DIR:$PATH" "$FGCTL_BIN" upgrade --from "$FGOS_TARBALL") || {
      echo "Step failed: candidate fgctl upgrade --from the candidate asset, on a $PREV_TAG project" >&2
      exit 1
    }
    AFTER_DIGEST="$(node -pe 'JSON.parse(fs.readFileSync(process.argv[1])).artifactDigest' "$UPGRADE_ACT")"
    AFTER_PREV="$(node -pe 'JSON.parse(fs.readFileSync(process.argv[1])).previousArtifactDigest ?? "null"' "$UPGRADE_ACT")"
    if [ "${AFTER_DIGEST#sha256:}" != "${MANIFEST_DIGEST#sha256:}" ] || [ "$AFTER_DIGEST" = "$BEFORE_DIGEST" ]; then
      echo "Step failed: upgrade from $PREV_TAG did not activate the candidate (before $BEFORE_DIGEST, after $AFTER_DIGEST, candidate $MANIFEST_DIGEST)" >&2
      exit 1
    fi
    if [ "$AFTER_PREV" != "$BEFORE_DIGEST" ]; then
      echo "Step failed: previousArtifactDigest after the upgrade is $AFTER_PREV, expected $BEFORE_DIGEST" >&2
      exit 1
    fi
    CONFIG_KEYS_AFTER="$(cd "$UPGRADE_PROJECT" && PATH="$TEMP_INSTALL_DIR:$PATH" .fgos/installation/bin/fgos config show --json | node -e '
      let d = "";
      process.stdin.on("data", (c) => (d += c));
      process.stdin.on("end", () => {
        const value = JSON.parse(d).data.value;
        console.log(JSON.stringify({ "gateBypass.level": value.gateBypass?.level, "ironLaw.level": value.ironLaw?.level }));
      });
    ')" || {
      echo "Step failed: fgos config show --json on the project upgraded from $PREV_TAG" >&2
      exit 1
    }
    if [ "$CONFIG_KEYS_BEFORE" != "$CONFIG_KEYS_AFTER" ]; then
      echo "Step failed: the project's config values changed during the upgrade from $PREV_TAG (before $CONFIG_KEYS_BEFORE, after $CONFIG_KEYS_AFTER)" >&2
      exit 1
    fi
    (cd "$UPGRADE_PROJECT" && .fgos/installation/bin/fgos version --runtime-json >/dev/null) || {
      echo "Step failed: the upgraded project's fgos does not run" >&2
      exit 1
    }
    (cd "$UPGRADE_PROJECT" && "$FGCTL_BIN" verify) || {
      echo "Step failed: fgctl verify on the project upgraded from $PREV_TAG" >&2
      exit 1
    }
    # The upgraded project reads its legacy config with no config row failing (no manual migration).
    UPGRADE_DOCTOR="$(cd "$UPGRADE_PROJECT" && PATH="$TEMP_INSTALL_DIR:$PATH" .fgos/installation/bin/fgos doctor --json)" || {
      echo "Step failed: fgos doctor --json on the project upgraded from $PREV_TAG" >&2
      exit 1
    }
    node -e '
      const failing = (JSON.parse(process.argv[1]).data?.checks || []).filter((row) => row.status === "fail" && /^config-/.test(row.id));
      if (failing.length) {
        console.error(`Assertion failed: config rows fail after the upgrade: ${failing.map((row) => `${row.id}: ${row.message}`).join(" | ")}`);
        process.exit(1);
      }
    ' "$UPGRADE_DOCTOR" || {
      echo "Step failed: the project upgraded from $PREV_TAG needs a manual config migration" >&2
      exit 1
    }
    HOME="$PROOF_HOME"
    export HOME
    echo "Upgrade proof passed: $PREV_TAG ($BEFORE_DIGEST) -> $FGCTL_TAG ($AFTER_DIGEST), config values kept."
  fi
fi

# ---- uninstall ------------------------------------------------------------------------------
# Last, because it takes the installation away. The plan changes nothing; --yes removes what
# fgOS installed and keeps the project's config and data.
(cd "$TEMP_PROJECT" && "$FGCTL_BIN" uninstall --dry-run >/dev/null) || {
  echo "Step failed: fgctl uninstall --dry-run" >&2
  exit 1
}
if [ ! -d "$TEMP_PROJECT/.fgos/installation" ]; then
  echo "Step failed: fgctl uninstall --dry-run removed the installation" >&2
  exit 1
fi
printf '# consumer proof config marker\n' >> "$TEMP_PROJECT/.fgos/config.yaml"
(cd "$TEMP_PROJECT" && "$FGCTL_BIN" uninstall --yes) || {
  echo "Step failed: fgctl uninstall --yes" >&2
  exit 1
}
if [ -e "$TEMP_PROJECT/.fgos/installation" ]; then
  echo "Step failed: .fgos/installation is still there after fgctl uninstall --yes" >&2
  exit 1
fi
for kept in .fgos/config.yaml .fgos/distribution.json; do
  if [ ! -f "$TEMP_PROJECT/$kept" ]; then
    echo "Step failed: fgctl uninstall removed $kept, which it must keep" >&2
    exit 1
  fi
done
set -- "$TEMP_PROJECT"/.fgos/uninstall-backup-*/activation.json
if [ ! -f "$1" ]; then
  echo "Step failed: fgctl uninstall left no backup of the activation record" >&2
  exit 1
fi

echo "All external consumer proof steps passed successfully."
exit 0
