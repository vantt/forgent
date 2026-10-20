#!/usr/bin/env bash
# P-RELEASE (Git spec §12 C5, §15) and V-PACK: the landing checks, in one place, run by the
# coordinator on the merged git/p07-switch + git/p08-gate tree. Each check names its owning proof;
# this script only runs them and collects one verdict line each. Nothing here mutates a real
# workspace: every fixture lives under --work.
#
#   scripts/git/p-release-checks.sh --work <fresh dir on ext4> [--stale-fgos <old release root>] [--skip-assets]
#
#   --stale-fgos  root of the previously installed global npm package (e.g. `npm root -g`/fgos); the
#                 protocol check compares its Node<->host lock protocol with this checkout's
#   --skip-assets skip the release-asset build and external-consumer install (slow; needs network
#                 only for npm, not for GitHub)
set -uo pipefail
WORK="" STALE="" ASSETS=1
while [ $# -gt 0 ]; do
  case "$1" in
    --work) WORK="$2"; shift 2 ;; --stale-fgos) STALE="$2"; shift 2 ;; --skip-assets) ASSETS=0; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$WORK" ] || { echo "--work <fresh dir> is required" >&2; exit 2; }
CHECKOUT="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$WORK"; WORK="$(cd "$WORK" && pwd)"
cd "$CHECKOUT"
VERDICTS="$WORK/p-release-verdicts.txt"; : > "$VERDICTS"
FAILED=0
# The release-profile host, fgctl and addon the rollback row stages, built as `npm test` builds them.
RELEASE="${CARGO_TARGET_DIR:-$CHECKOUT/target}/release"
cargo build --locked --release -p fgos -p fgctl -p fgos-node-addon > "$WORK/release-build.log" 2>&1 \
  || { echo "release build failed (see $WORK/release-build.log)" >&2; exit 1; }
# Node rows run with the addon and host `npm test` hands its files (FGOS_HOST_BIN and the dev manifest).
{ read -r FGOS_HOST_BIN && read -r FGOS_ACTIVE_MANIFEST_PATH; } < <(node --input-type=module -e "
const { ensureGitAddon } = await import('./scripts/git-addon.mjs');
const env = { ...process.env, FGOS_HOST_BIN: '' };
ensureGitAddon(env);
console.log(env.FGOS_HOST_BIN + '\\n' + env.FGOS_ACTIVE_MANIFEST_PATH);
" 2>> "$WORK/release-build.log") && [ -x "$FGOS_HOST_BIN" ] || { echo "addon staging failed (see $WORK/release-build.log)" >&2; exit 1; }
export FGOS_HOST_BIN FGOS_ACTIVE_MANIFEST_PATH
check() { # name, command...
  local name="$1"; shift
  if "$@" > "$WORK/$name.log" 2>&1; then echo "PASS $name" | tee -a "$VERDICTS"
  else echo "FAIL $name (see $WORK/$name.log)" | tee -a "$VERDICTS"; FAILED=1; fi
}

# C5 door: pending WAL refuses a release without git-wal-v1; corrupt/incomplete scans refuse;
# the fence stops an older fgctl; a live predecessor writer refuses activation.
check c5-git-gate          cargo test --locked -p fgos-distribution --lib git_gate
check c5-activation-locks  cargo test --locked -p fgos-distribution --test activation_lock_multiprocess
check c5-fgctl-wal-gate    cargo test --locked -p fgctl --test git_wal_activation_gate
check c5-node-doctor-rows  node --test test/setup/git-checks.test.mjs test/distribution/native-addon.test.mjs
# V-PACK: one combined addon, manifest digests, no PATH/cwd fallback, a second load refused.
check v-pack-native-load   node --test test/git/native-load.test.mjs
# Live old process during rollback and forward activation (E3's rollback row, owner budget:
# refused by the C5 door or completed, zero lost or corrupt records).
check live-process-rollback node scripts/git/e3-bench.mjs rollback --root "$WORK/rollback" \
  --addon "$RELEASE/libfgos_node_addon.so" --fgctl "$RELEASE/fgctl" --host "$RELEASE/fgos"
# Stale global npm `fgos merge`: spec §12 needs the protocol bump to refuse it. The old package must
# speak a different lock protocol than the new host, or nothing refuses its legacy writer.
if [ -n "$STALE" ]; then
  protocol_of() { node --input-type=module -e "console.log((await import('$1/src/holder-lock/protocol.mjs')).PROTOCOL)"; }
  old_protocol="$(protocol_of "$STALE")" new_protocol="$(protocol_of "$CHECKOUT")"
  check stale-npm-protocol-bump test "$old_protocol" != "$new_protocol"
  echo "  stale package protocol $old_protocol, this release $new_protocol" | tee -a "$VERDICTS"
else
  echo "SKIP stale-npm-protocol-bump (pass --stale-fgos <old package root>)" | tee -a "$VERDICTS"
fi
# External project: package the release assets and install them outside the checkout.
if [ "$ASSETS" = 1 ]; then
  version="v$(node -pe "require('./package.json').version")"
  check release-assets node scripts/package-release-assets.mjs --version "$version" --out "$WORK/dist"
  check external-consumer scripts/ci-external-consumer.sh --assets "$WORK/dist"
fi
echo "verdicts: $VERDICTS"
exit "$FAILED"
