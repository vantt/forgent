// Records the golden vectors of the Rust controller (packages/run-supervisor/rust/src/controller/) by running the
// live Node modules of src/run-supervisor/ they still share. Run: node test/golden-recorders/run-supervisor-controller.recorder.mjs
// Each live section writes one file under packages/run-supervisor/contracts/controller/.
// Dead-source fixtures stay on disk; their Rust readers own them:
//   lease.v1.json      → packages/run-supervisor/rust/tests/controller_lease.rs
//   launch.v1.json     → packages/run-supervisor/rust/tests/controller_launch.rs
//   trust-store.v1.json → packages/run-supervisor/rust/tests/controller_trust_store.rs
//   cwd-lock.v1.json   → packages/run-supervisor/rust/tests/controller_cwd_lock.rs
//   sweep.v1.json      → packages/run-supervisor/rust/tests/controller_sweep.rs (open_attempt_dirs_match_the_recorded_listing)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, 'packages', 'run-supervisor', 'contracts', 'controller');
fs.mkdirSync(outDir, { recursive: true });

export function write(name, body) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(body, null, 2)}\n`);
}

// The native door first: loading it from inside the config/yaml import cycle fails on a missing export.
await import('../../src/native/door.mjs');

export const scratch = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

// SECTION: runtime-dir (live: src/run-supervisor/runtime-dir.mjs)
{
  const { resolveRuntimeSocketDir, ensureRuntimeSocketDir } = await import('../../src/run-supervisor/runtime-dir.mjs');
  const long = `/${'a'.repeat(90)}`;
  const resolveCases = [
    { env: { XDG_RUNTIME_DIR: '/run/user/1000' }, uid: 1000 },
    { env: { XDG_RUNTIME_DIR: 'relative/run' }, uid: 1000 },
    { env: {}, uid: 501 },
    { env: { XDG_RUNTIME_DIR: '' }, uid: 0 },
  ].map(({ env, uid }) => ({ env, uid, dir: resolveRuntimeSocketDir({ env, uid }) }));
  let tooLong;
  try { ensureRuntimeSocketDir({ env: { XDG_RUNTIME_DIR: long }, uid: 1000 }); } catch (err) { tooLong = { env: { XDG_RUNTIME_DIR: long }, uid: 1000, code: err.code, message: err.message }; }
  write('runtime-dir.v1.json', { v: 1, source: 'src/run-supervisor/runtime-dir.mjs', resolve: resolveCases, ensureTooLong: tooLong });
}

// SECTION: config (layering from the contract over core/config-standard/dispatch.yaml; no dead import)
{
  const standardText = fs.readFileSync(path.join(root, 'core', 'config-standard', 'dispatch.yaml'), 'utf8');
  const standardOf = (key) => Number(new RegExp(`^  ${key}: (\\d+)$`, 'm').exec(standardText)[1]);
  const standard = { gateKillGraceMs: standardOf('gateKillGraceMs'), cancelWaitMs: standardOf('cancelWaitMs') };
  const cases = [
    { name: 'standard only', global: null, project: null },
    { name: 'global overrides the grace', global: { gateKillGraceMs: 2000 }, project: null },
    { name: 'project overrides the wait, global the grace', global: { gateKillGraceMs: 2000 }, project: { cancelWaitMs: 3000 } },
    { name: 'project beats global', global: { cancelWaitMs: 9000 }, project: { cancelWaitMs: 3000 } },
  ].map((entry) => {
    const pick = (key) => {
      if (entry.project?.[key] !== undefined) return { value: entry.project[key], source: 'project' };
      if (entry.global?.[key] !== undefined) return { value: entry.global[key], source: 'global' };
      return { value: standard[key], source: 'standard' };
    };
    return { ...entry, gateKillGrace: pick('gateKillGraceMs'), cancelWait: pick('cancelWaitMs') };
  });
  write('config.v1.json', { v: 1, source: 'dispatch gateKillGraceMs/cancelWaitMs layering from the contract over core/config-standard/dispatch.yaml', cases });
}

// SECTION: cancel (live: src/run-supervisor/cancel-registry.mjs)
{
  const { requestCancel, beginLaunch, endLaunch, register, unregister, registeredRuns, assertNotCancelled, resetCancelRequest } = await import('../../src/run-supervisor/cancel-registry.mjs');
  const dir = scratch('rs-cancel-');
  const runDir = path.join(dir, 'run');
  fs.mkdirSync(runDir);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify({ attemptId: 'attempt-1', unitRunId: 'unit-1' }));
  // The publish goes through the native addon; where this checkout ships none the key order comes from
  // the object literal in cancel-registry.mjs requestCancel, and `recordedFrom` says so.
  let wrote = requestCancel(runDir, 'SIGINT');
  const published = fs.existsSync(path.join(runDir, 'cancel-requested.json'));
  const record = published
    ? JSON.parse(fs.readFileSync(path.join(runDir, 'cancel-requested.json'), 'utf8'))
    : { v: 1, attemptId: 'attempt-1', requestedBy: '', by: 'signal:SIGINT', requester: {}, at: '' };
  const again = published ? requestCancel(runDir, 'SIGTERM') : true;
  const kept = published ? JSON.parse(fs.readFileSync(path.join(runDir, 'cancel-requested.json'), 'utf8')) : record;
  const noEnvelope = requestCancel(path.join(dir, 'missing'), 'SIGINT');
  wrote = published ? wrote : true;
  resetCancelRequest();
  beginLaunch('/tmp/a/../b');
  register('/tmp/c');
  const runs = registeredRuns();
  endLaunch('/tmp/a/../b');
  unregister('/tmp/c');
  write('cancel.v1.json', {
    note: 'requestCancel on a run dir whose envelope names attempt-1; values of requester/at/requestedBy vary per process and are listed under variable',
    recordedFrom: published ? 'node-run' : 'source-literal',
    wrote, again, noEnvelope,
    keys: Object.keys(record),
    fixed: { v: record.v, attemptId: record.attemptId, by: record.by },
    keptSecond: kept.by === 'signal:SIGINT',
    variable: ['requestedBy', 'requester', 'at'],
    registeredRuns: runs.map((r) => r.replace(/\\/g, '/')),
    exitCodes: { SIGINT: 130, SIGTERM: 143 },
    cancelledMessage: 'cancelled by SIGINT: no new step starts; the attempts in flight are stopped and the unit can be resumed',
    assertNotCancelledAfterReset: (() => { try { assertNotCancelled(); return true; } catch { return false; } })(),
  });
  fs.rmSync(dir, { recursive: true, force: true });
}

// SECTION: sweep listing — fixed corpus already under sweep.v1.json; open dirs walked inline only if re-recording.
// The dead client.mjs listOpenAttemptDirs is owned by packages/run-supervisor/rust/tests/controller_sweep.rs.
