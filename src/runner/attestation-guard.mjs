// attestation-guard.mjs — worktree dispatch attestation level 2 guard (tsk-34o5)
//
// Reads the persisted `executor.dispatch` event for a work item from
// `.fgos/events.jsonl` and compares the recorded `baseCommit` and `headRef`
// against the actual git branch state before reap, return, or approve.
//
// Posture: Halt on divergence (recorded headRef != branch or branch tip is not
// a descendant of baseCommit). Never halt on missing event or null attestation
// (in-session dispatch path).

import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readEvents } from '../state/events.mjs';

function gitAt(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

/**
 * Check dispatch attestation for a work item.
 *
 * @param {string} dir - Path to `.fgos` directory
 * @param {string} repoRoot - Path to main repository root
 * @param {string} id - Work item id
 * @param {string} branch - Branch name (e.g. `fgw/<id>`)
 * @returns {{ ok: boolean, skipped?: boolean, reason?: string, detail?: string, baseCommit?: string, headRef?: string }}
 */
export function checkDispatchAttestation(dir, repoRoot, id, branch) {
  const logPath = path.join(dir, 'events.jsonl');
  const events = readEvents(logPath);

  // Pick the LAST matching executor.dispatch event by id (handling retries)
  let lastDispatch = null;
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.type === 'executor.dispatch' && ev.payload?.id === id) {
      lastDispatch = ev;
      break;
    }
  }

  // If no attestation event exists or payload/baseCommit/headRef is null/absent -> skipped (no-op)
  if (!lastDispatch || !lastDispatch.payload) {
    return { ok: true, skipped: true };
  }

  const { baseCommit, headRef } = lastDispatch.payload;
  if (!baseCommit || !headRef) {
    return { ok: true, skipped: true };
  }

  // Check 1: recorded headRef at dispatch time must match the expected branch name
  if (headRef !== branch) {
    return {
      ok: false,
      reason: 'attestation-mismatch',
      detail: `attestation mismatch for "${id}": recorded headRef "${headRef}" does not match branch "${branch}"`,
    };
  }

  // Check 2: actual branch tip must be a descendant of recorded baseCommit
  let branchHead;
  try {
    branchHead = gitAt(repoRoot, ['rev-parse', branch]).trim();
  } catch (err) {
    // If branch doesn't exist or can't be read, let caller handle branch existence
    return { ok: true, skipped: true };
  }

  try {
    gitAt(repoRoot, ['merge-base', '--is-ancestor', baseCommit, branchHead]);
  } catch {
    return {
      ok: false,
      reason: 'attestation-mismatch',
      detail: `attestation mismatch for "${id}": branch tip ${branchHead} is not a descendant of recorded baseCommit ${baseCommit}`,
    };
  }

  return { ok: true, baseCommit, headRef };
}
