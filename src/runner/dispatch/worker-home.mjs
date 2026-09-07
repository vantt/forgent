// dispatch/worker-home.mjs — build and tear down the private HOME a dispatched
// worker runs under (Phase 01 group C1 of plans/260906-1831-dispatch-visibility-v0).
//
// WHY A PRIVATE HOME AT ALL. Two problems settle with one mechanism. It closes
// the `$HOME/.config/herdr/herdr.sock` path a worker would otherwise use to reach
// the operator's own terminal cockpit (measured 2026-09-06: with a private HOME
// that route is blocked, without one it is open), and it is the writable private
// scratch that P00.1's Known Limitation already required before an agent CLI can
// start under a read-only mount at all.
//
// WHY IT MUST BE PROVISIONED, NOT MERELY EMPTY. An empty HOME is not a private
// HOME, it is a broken one. The five items below were not designed up front; each
// was found by hitting its own failure while running a real agent:
//
//   1. `.zshrc`                              -- without it zsh runs its first-run
//      wizard, which sits where the shell prompt should be. herdr types the launch
//      command into it, the wizard consumes the first keystroke as a menu choice,
//      and `claude --model haiku` arrives at the shell as `laude --model haiku`.
//   2. `.claude/.credentials.json`           -- provider auth.
//   3. `.claude.json` onboarding + theme     -- without it the agent starts but sits
//      in its own onboarding wizard, unable to accept an instruction, WHILE herdr
//      reports it `idle` and `interactive_ready`. A prompt sent then is swallowed.
//   4. `.claude.json` workspace trust        -- without it the folder-trust dialog.
//   5. `.claude/settings.json`
//      `skipDangerousModePermissionPrompt`   -- only when the declared posture is
//      `bypass`. That flag triggers a one-time acceptance screen which herdr
//      correctly classifies as `blocked`, so declaring bypass without this leaves a
//      dispatch that fails safely at startup and is useless.
//
// Evidence for every line above:
// docs/architect/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/
//
// WHAT THIS DOES NOT SOLVE, stated so nobody assumes otherwise. The worker ends up
// holding a copy of the operator's provider credential, because the credential has
// to be reachable for the worker to function at all. HOME isolation cannot fix
// that; only a credential-holding relay can, and that is named as open in
// docs/architect/proposals/coordination-worker-provider-boundary.md.

import fs from 'node:fs';
import path from 'node:path';
import { readTrust, TrustStoreError } from './trust-store.mjs';

/** Marker file written into every home this module creates. `removeWorkerHome`
 * refuses to delete a directory that does not carry it, so a teardown bug can
 * never turn into "recursively delete some path someone passed in". */
const MARKER = '.fgos-worker-home';

export class WorkerHomeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'WorkerHomeError';
    this.code = code;
    Object.assign(this, details);
  }
}

/**
 * Create a provisioned private HOME for one Run.
 *
 * `permissionMode` is `'ask'` or `'bypass'` and is DECLARED by the caller from the
 * executor profile — never inherited from a shell alias. That distinction is the
 * whole point of C4: on a developer machine the bypass flag reaches the agent
 * through `~/.zshrc`, which fgOS cannot see and a private HOME silently removes.
 *
 * Refuses, leaving nothing behind, when the repo root is not already trusted
 * (`untrusted-root`, the same B1 rule as `trust-store.mjs` and deliberately the
 * same implementation) or the source home has no credential to copy
 * (`missing-credential`).
 *
 * Returns `{ homePath, provisioned }` where `provisioned` names the items written,
 * so a caller can log what a Run actually got rather than what it assumed.
 */
export function createWorkerHome(baseDir, { runId, sourceHome, workspacePath, repoRoot, permissionMode = 'ask' } = {}) {
  if (typeof runId !== 'string' || runId.length === 0) {
    throw new WorkerHomeError('invalid-arg', 'createWorkerHome: runId is required.');
  }
  if (typeof workspacePath !== 'string' || !path.isAbsolute(workspacePath)) {
    throw new WorkerHomeError('invalid-arg', `createWorkerHome: workspacePath must be absolute, got "${workspacePath}".`);
  }
  if (permissionMode !== 'ask' && permissionMode !== 'bypass') {
    throw new WorkerHomeError('invalid-arg', `createWorkerHome: permissionMode must be "ask" or "bypass", got "${permissionMode}".`);
  }

  // B1 runs BEFORE anything is created, so a refusal leaves no directory behind.
  // Reusing trust-store's reader keeps "is this root trusted" in one place; a
  // second copy of that rule is how the two drift apart.
  const sourceStore = path.join(sourceHome, '.claude.json');
  let rootTrust;
  try {
    rootTrust = readTrust(sourceStore, repoRoot);
  } catch (err) {
    if (err instanceof TrustStoreError) {
      throw new WorkerHomeError(err.code, `createWorkerHome: could not read the source trust store: ${err.message}`, { sourceStore });
    }
    throw err;
  }
  if (rootTrust !== true) {
    throw new WorkerHomeError(
      'untrusted-root',
      `createWorkerHome refused: repo root "${repoRoot}" is not trusted in the source home, so a worker home for "${workspacePath}" would be inventing trust rather than deriving it.`,
      { repoRoot, workspacePath },
    );
  }

  const credentialSource = path.join(sourceHome, '.claude', '.credentials.json');
  if (!fs.existsSync(credentialSource)) {
    throw new WorkerHomeError(
      'missing-credential',
      `createWorkerHome refused: no provider credential at "${credentialSource}". A worker home without auth cannot do any work, and starting one anyway only fails later and less clearly.`,
      { credentialSource },
    );
  }

  const homePath = fs.mkdtempSync(path.join(baseDir, `worker-${runId}-`));
  const claudeDir = path.join(homePath, '.claude');
  const provisioned = [];
  try {
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(homePath, MARKER), `${runId}\n`);

    fs.writeFileSync(path.join(homePath, '.zshrc'), '# provisioned by fgOS: present so zsh does not run its first-run wizard\n');
    provisioned.push('.zshrc');

    // Copy, never link: a symlink would leave the worker a path back into the
    // operator's home. `COPYFILE_EXCL` keeps this from ever overwriting.
    fs.copyFileSync(credentialSource, path.join(claudeDir, '.credentials.json'), fs.constants.COPYFILE_EXCL);
    fs.chmodSync(path.join(claudeDir, '.credentials.json'), 0o600);
    provisioned.push('.claude/.credentials.json');

    fs.writeFileSync(path.join(homePath, '.claude.json'), `${JSON.stringify({
      hasCompletedOnboarding: true,
      theme: 'dark',
      installMethod: 'native',
      projects: {
        [workspacePath]: {
          allowedTools: [],
          hasTrustDialogAccepted: true,
          mcpServers: {},
          enabledMcpjsonServers: [],
          disabledMcpjsonServers: [],
          history: [],
        },
      },
    }, null, 2)}\n`);
    provisioned.push('.claude.json (onboarding + workspace trust)');

    if (permissionMode === 'bypass') {
      fs.writeFileSync(path.join(claudeDir, 'settings.json'), `${JSON.stringify({
        skipDangerousModePermissionPrompt: true,
      }, null, 2)}\n`);
      provisioned.push('.claude/settings.json (bypass acceptance)');
    }
  } catch (err) {
    // Never leave a half-provisioned home: a home missing one of the five fails
    // in a way that looks like an agent problem rather than a setup problem.
    try { fs.rmSync(homePath, { recursive: true, force: true }); } catch {}
    throw new WorkerHomeError('provision-failed', `createWorkerHome could not provision "${homePath}": ${err.message}`, { homePath });
  }

  return { homePath, provisioned };
}

/**
 * Remove a home this module created. Returns whether there was one.
 *
 * Refuses any directory without the marker file. Teardown runs on error paths,
 * where a wrong argument is most likely, and a recursive delete is the one
 * operation that must never act on a path it cannot recognise.
 */
export function removeWorkerHome(homePath) {
  if (typeof homePath !== 'string' || homePath.length === 0) {
    throw new WorkerHomeError('invalid-arg', 'removeWorkerHome: homePath is required.');
  }
  if (!fs.existsSync(homePath)) return false;
  if (!fs.existsSync(path.join(homePath, MARKER))) {
    throw new WorkerHomeError(
      'not-a-worker-home',
      `removeWorkerHome refused: "${homePath}" carries no ${MARKER} marker, so this module did not create it and will not delete it.`,
      { homePath },
    );
  }
  fs.rmSync(homePath, { recursive: true, force: true });
  return true;
}

/**
 * Take the provider credential out of a home that is being kept.
 *
 * A failed round keeps its home for the same reason it keeps its pane: the
 * settings and rc are the only record of what the worker was actually given.
 * The credential is not part of that record. It is a plain copy of the
 * operator's own, and one copy per failed round accumulating in a world-
 * listable temp directory is a different thing from "the worker holds a copy
 * while it runs".
 *
 * Same marker check as `removeWorkerHome`, for the same reason: this runs on
 * error paths, where a wrong argument is most likely.
 */
export function redactWorkerHome(homePath) {
  if (typeof homePath !== 'string' || homePath.length === 0) {
    throw new WorkerHomeError('invalid-arg', 'redactWorkerHome: homePath is required.');
  }
  if (!fs.existsSync(homePath)) return false;
  if (!fs.existsSync(path.join(homePath, MARKER))) {
    throw new WorkerHomeError(
      'not-a-worker-home',
      `redactWorkerHome refused: "${homePath}" carries no ${MARKER} marker, so this module did not create it and will not touch it.`,
      { homePath },
    );
  }
  const credential = path.join(homePath, '.claude', '.credentials.json');
  if (!fs.existsSync(credential)) return false;
  fs.rmSync(credential, { force: true });
  return true;
}
