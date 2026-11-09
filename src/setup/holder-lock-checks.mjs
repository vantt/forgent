// holder-lock-checks.mjs -- the doctor checks and setup fixes of the
// holder-lock component (docs/platform/holder-lock/spec.md, "Setup, doctor
// and activation"). `registrations.mjs` registers them; the bodies live here.
//
// Every check reads; the one fix, `lock-dirs`, creates `<fgosDir>/locks` and
// `<lockRoot>`.
//
// Levels follow the doctor convention: `passed: false` fails, a message that
// starts with `warning:` warns, `info:` is informational, anything else passes.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { hostBin, guaranteeFor, doorTwoProcessProbe, doorKillWaitMs } from '../holder-lock/driver.mjs';
import { PROTOCOL } from '../holder-lock/protocol.mjs';
import { resolveStateRoot, LOCKS_DIR } from '../holder-lock/state-root.mjs';
import { fgosDirFromRoot } from '../runner/paths.mjs';

const BORROW_VECTORS_TIMEOUT_MS = 30_000;
const MAX_LISTED = 5;

const warn = (text) => `warning: ${text}`;

function listed(items) {
  const head = items.slice(0, MAX_LISTED).join('; ');
  return items.length > MAX_LISTED ? `${head}; and ${items.length - MAX_LISTED} more` : head;
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** The machine state root and lock root with what decided them, or `{ error }` naming why it cannot be resolved. */
function machineLockRoot() {
  try {
    return resolveStateRoot();
  } catch (err) {
    return { error: err.message };
  }
}

/** Both lock directories this workspace uses, workspace first. */
function lockDirs(repoRoot, machine = machineLockRoot()) {
  const fgosDir = fgosDirFromRoot(repoRoot);
  return [
    { label: 'workspace', dir: path.join(fgosDir, LOCKS_DIR) },
    machine.error ? { label: 'machine', error: machine.error } : { label: 'machine', dir: machine.lockRoot },
  ];
}

// ---------------------------------------------------------------------
// lock-kernel-semantics
// ---------------------------------------------------------------------

function guaranteeShape(guarantee) {
  return JSON.stringify({ driver: guarantee.driver, exclusion: guarantee.exclusion, borrow: guarantee.borrow, holders: guarantee.holders });
}

/** Why a guarantee refuses the locks, or null when the driver can exclude there. */
export function guaranteeRefusal(label, dir, guarantee) {
  const shape = guaranteeShape(guarantee);
  if (guarantee.exclusion === 'unsupported') {
    return `${label} ${dir} ${shape}: holder-lock has no driver on ${guarantee.platform}; gateway, sessions, runner, dispatch, advance, recovery and the provider locks cannot run here`;
  }
  if (guarantee.exclusion === 'none') {
    return `${label} ${dir} ${shape}: the filesystem gives no lock exclusion (${(guarantee.notes ?? []).join('; ') || 'network filesystem'}); move the state root or the workspace to a local disk`;
  }
  return null;
}

/** The predecessor kill wait as the holder-lock crate states it; `null` when the door is not reachable (the rows above already name that). */
function killWaitFact() {
  try {
    return `killWaitMs ${doorKillWaitMs()} (fixed)`;
  } catch {
    return null;
  }
}

/**
 * For `<fgosDir>/locks` and `<lockRoot>`: the driver's guarantee through
 * door, then the two-process probe on that same mount.
 * `kernel` with a green probe passes; a platform with no driver
 * (`unsupported`) and a network filesystem (`none`) fail by name; a missing
 * directory warns (setup creates it).
 */
export async function checkLockKernelSemantics(repoRoot) {
  const failures = [];
  const warnings = [];
  const passes = [];
  const machine = machineLockRoot();
  for (const { label, dir, error } of lockDirs(repoRoot, machine)) {
    if (error) {
      failures.push(`${label} lock root unresolved: ${error}`);
      continue;
    }
    if (!isDirectory(dir)) {
      warnings.push(`${label} ${dir} does not exist yet, not measured (fgos setup creates it)`);
      continue;
    }
    let guarantee;
    try {
      guarantee = guaranteeFor(path.join(dir, 'guarantee.lock'));
    } catch (err) {
      failures.push(`${label} ${dir}: ${err.message}`);
      continue;
    }
    const shape = guaranteeShape(guarantee);
    const refusal = guaranteeRefusal(label, dir, guarantee);
    if (refusal) {
      failures.push(refusal);
      continue;
    }
    try {
      doorTwoProcessProbe(dir);
      passes.push(`${label} ${dir} ${shape}, two-process probe green`);
    } catch (err) {
      failures.push(`${label} ${dir} ${shape}: two-process probe failed: ${err.message}`);
    }
  }
  // The two fixed facts of the lock layer stay visible: the state root the locks live under and the predecessor kill wait.
  const facts = [machine.error ? null : `stateRoot ${machine.stateRoot} (${machine.source})`, killWaitFact()].filter(Boolean);
  const all = [...failures, ...warnings, ...passes, ...facts].join('; ');
  if (failures.length > 0) return { passed: false, message: all };
  if (warnings.length > 0) return { passed: true, message: warn(all) };
  return { passed: true, message: all };
}

// ---------------------------------------------------------------------
// lock-borrow-vectors
// ---------------------------------------------------------------------

/**
 * `fgos internal lock-borrow-vectors`: a borrowed description must not leak
 * to any background process of git. Any red vector fails (there is no
 * run-time switch that turns borrowing off).
 */
export function checkLockBorrowVectors(repoRoot) {
  let bin;
  try {
    bin = hostBin({ fgosDir: fgosDirFromRoot(repoRoot) });
  } catch (err) {
    return { passed: false, message: `cannot run the borrow vectors: ${err.message}` };
  }
  const res = spawnSync(bin, ['internal', 'lock-borrow-vectors', '--protocol', String(PROTOCOL)], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: BORROW_VECTORS_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    maxBuffer: 1024 * 1024,
  });
  if (res.error) return { passed: false, message: `${bin} internal lock-borrow-vectors did not finish: ${res.error.message}` };
  let out = null;
  try {
    out = JSON.parse(String(res.stdout).split('\n').find((line) => line.trim() !== '') ?? '');
  } catch {
    out = null;
  }
  const stderr = String(res.stderr ?? '').trim().slice(0, 300);
  if (res.status === 0 && out?.result === 'pass') {
    return { passed: true, message: `all ${out.vectors.length} vectors and the sibling check green (${out.gitVersion})` };
  }
  if (res.status === 10 && out) {
    const red = (out.vectors ?? []).filter((vector) => vector.result !== 'pass').map((vector) => `${vector.name}: ${vector.detail}`);
    if (out.sibling?.result !== 'pass') red.push(`sibling-refused: ${out.sibling?.detail ?? 'no result'}`);
    return { passed: false, message: `borrowed lock leaks (${out.gitVersion}): ${listed(red)}` };
  }
  if (res.status === 12) return { passed: false, message: `borrow vectors unavailable: ${out?.detail ?? stderr ?? 'no detail'}` };
  if (res.status === 3) return { passed: false, message: `${bin} refused protocol ${PROTOCOL} (host-version-mismatch): restage/activate a matching release` };
  return { passed: false, message: `${bin} internal lock-borrow-vectors exited ${res.status}${res.signal ? ` (${res.signal})` : ''}: ${stderr || String(res.stdout).slice(0, 300)}` };
}

// ---------------------------------------------------------------------
// lock-holders (pointer)
// ---------------------------------------------------------------------

/**
 * A pointer, never a judgment: the holders of every lock file, the predecessor records and the hot records cost about a second
 * to read, over the pointer cost cap, so the row names the verb that reads them (`fgos lock-status` reports them as `problems`).
 */
export function checkLockHolders() {
  return { passed: true, message: 'holders of fgOS locks, predecessor domains still running and hot records that need a person: run `fgos lock-status`' };
}

// ---------------------------------------------------------------------
// lock-dirs (setup)
// ---------------------------------------------------------------------

/**
 * Create `<fgosDir>/locks` and `<lockRoot>` with mode 0700 when missing, and
 * tighten an existing one to 0700 (the first acquire may have created it
 * with the umask's mode before setup ran).
 */
export function fixLockDirs(repoRoot) {
  const created = [];
  const skipped = [];
  for (const { label, dir, error } of lockDirs(repoRoot)) {
    if (error) {
      skipped.push(`${label} lock root unresolved: ${error}`);
      continue;
    }
    if (isDirectory(dir)) {
      try {
        if ((fs.statSync(dir).mode & 0o077) !== 0) {
          fs.chmodSync(dir, 0o700);
          created.push(`${dir} (mode tightened to 0700)`);
        }
      } catch (err) {
        skipped.push(`${dir}: ${err.code ?? err.message}`);
      }
      continue;
    }
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      fs.chmodSync(dir, 0o700);
      created.push(dir);
    } catch (err) {
      skipped.push(`${dir}: ${err.code ?? err.message}`);
    }
  }
  const parts = [];
  if (created.length > 0) parts.push(`created or tightened ${created.join(', ')}`);
  if (skipped.length > 0) parts.push(`not created: ${skipped.join('; ')}`);
  return { changed: created.length > 0, message: parts.length > 0 ? parts.join('; ') : 'lock directories present' };
}
