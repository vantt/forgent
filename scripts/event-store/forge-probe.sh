#!/usr/bin/env bash
# Event Store real-forge probe (spec section 23.2 item 5, last step; owner
# authorization Q3). Through the facade, clone A appends one event and syncs,
# which pushes refs/fgos/events/<probe-id> to the forge; a fresh clone B
# installs the fetch refspec, syncs without pushing and must read the event.
# Pushes one ref to the forge; the last line prints how to delete it.
#   node scripts/git-addon.mjs                       # once, builds the addon
#   scripts/event-store/forge-probe.sh <forge-url>   # from the checkout
set -euo pipefail
FORGE=$1; CHECKOUT=$(cd "$(dirname "$0")/../.." && pwd)
export FORGE
P=$(mktemp -d); trap 'rm -rf "$P"' EXIT
# The two clones are sandbox repositories under $P: they go through the sandbox door.
SANDBOX_GIT=(node "$CHECKOUT/scripts/lib/sandbox-git.mjs" --root "$P" --)
"${SANDBOX_GIT[@]}" clone -q "$FORGE" "$P/a"; "${SANDBOX_GIT[@]}" clone -q "$FORGE" "$P/b"
cd "$CHECKOUT" && node --input-type=module - "$P" <<'EOF'
import fs from 'node:fs'; import path from 'node:path';
import { sandboxGit } from './scripts/lib/sandbox-git.mjs';
import { loadNativeAddon } from './src/git/native.mjs';
import { openStore, ensureEventStoreRefspecs } from './src/event-store/index.mjs';
const P = process.argv[2];
const git = sandboxGit(P);
const loaderOptions = { descriptor: { manifest: JSON.parse(fs.readFileSync('.fgos/runtime/git-addon/manifest.json')), releaseRoot: process.cwd() } };
const addon = loadNativeAddon(loaderOptions);
const contract = path.join(P, 'contract.json');
fs.writeFileSync(contract, JSON.stringify({ v: 1, types: [{ type: 'forge.probe', domain: 'forge', schemaVersion: 1, scope: 'project', sealOnWrite: false }] }));
const id = `forge-probe-${Date.now().toString(36)}`;
function clone(name, machine) {
  const repo = path.join(P, name), state = path.join(P, `${name}-state`);
  fs.mkdirSync(state, { mode: 0o700 });
  git(['-C', repo, 'config', 'fgos.machineId', machine]);
  fs.mkdirSync(path.join(repo, '.git/fgos/events/locks'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(repo, '.fgos/locks/activation.lock'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.fgos/locks/activation.lock/TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'forge-probe' }));
  ensureEventStoreRefspecs(repo, { stateRoot: state, trustedMain: repo, loaderOptions });
  const resolved = addon.resolveEventStore(repo, state, repo);
  return openStore(resolved, resolved.machineId, [contract], loaderOptions);
}
const a = clone('a', id);
const appended = a.append('project', [{ eventType: 'forge.probe', schemaVersion: 1, payload: { id }, ts: new Date().toISOString() }], {}, 'forge-probe', []);
const pushed = a.sync({ remote: 'origin' }, []);
const ref = `refs/fgos/events/${id}`;
const b = clone('b', `${id}-reader`);
const fetched = b.sync({ remote: 'origin', noPush: true }, []);
// The fresh clone's mirror of A's ref is what the forge served.
const remoteTip = Object.entries(b.status([]).refs).find(([name]) => name.endsWith(`/events/${id}`))?.[1] ?? null;
const seen = b.read({ streams: ['project'] }, []).events.some(e => e.h === appended.events[0].h);
const result = { forgeRef: ref, remoteTip, pushWarnings: pushed.warnings, fetchWarnings: fetched.warnings, freshCloneReadsEvent: seen, verdict: remoteTip && seen ? 'PASS' : 'FAIL' };
console.log(JSON.stringify(result));
console.log(`remove the probe ref afterwards: git push ${process.env.FORGE ?? '<forge-url>'} :${ref}`);
process.exitCode = result.verdict === 'PASS' ? 0 : 1;
EOF
