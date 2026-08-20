// postland-drift.mjs — recompute-on-read post-land drift consumer (tsk-1el,
// D1-D9, docs/history/postland-drift-consumer/CONTEXT.md).
//
// Computes path overlap between landed target branches and open leaf (or nested
// root) branches cumulative since fork (D6), gated strictly to items with a live
// session (`listSessions`, D2). Recompute-on-read, no merge-time persistence
// (D3).
import { execFileSync } from 'node:child_process';
import { openLeavesSharingTarget } from './graph-harness.mjs';
import { listSessions } from '../runner/session.mjs';

function requireTrunk(fnName, trunk) {
  if (typeof trunk !== 'string' || trunk === '') {
    throw new TypeError(`${fnName}: opts.trunk is required (a non-empty branch name, e.g. detectTrunk(repoRoot))`);
  }
  return trunk;
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
}

function branchExists(repoRoot, branch) {
  try {
    git(repoRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute post-land drift for open leaves with active sessions.
 *
 * Returns `{ [itemId]: { id, branch, target, shared, sessionIds } }`.
 * Target branches that do not exist by check time are skipped silently (D8).
 * Items with no live sessions are excluded (D2 — notify branch only).
 */
export function postLandDrift(repoRoot, view, { trunk, sessions } = {}) {
  requireTrunk('postLandDrift', trunk);
  const work = view?.work ?? {};
  const result = {};

  const candidateIds = new Set();
  for (const landedId of Object.keys(work)) {
    for (const id of openLeavesSharingTarget(view, landedId)) {
      candidateIds.add(id);
    }
  }

  const activeSessions = sessions ?? listSessions(repoRoot);
  const sessionsByItem = new Map();
  for (const entry of activeSessions) {
    if (!entry?.itemId) continue;
    const known = sessionsByItem.get(entry.itemId) ?? [];
    known.push(entry.sessionId);
    sessionsByItem.set(entry.itemId, known);
  }

  for (const id of Array.from(candidateIds).sort()) {
    const sessionIds = sessionsByItem.get(id) ?? [];
    if (sessionIds.length === 0) continue; // D2: notify only

    const item = work[id];
    if (!item) continue;

    const leafBranch = `fgw/${id}`;
    if (!branchExists(repoRoot, leafBranch)) continue;

    const targetBranch = item.parent ? `fgw/${item.parent}` : trunk;
    if (!branchExists(repoRoot, targetBranch)) continue; // D8: skipped silently if target gone

    let mergeBase;
    try {
      mergeBase = git(repoRoot, ['merge-base', targetBranch, leafBranch]).trim();
    } catch {
      continue;
    }
    if (!mergeBase) continue;

    let leafFiles = [];
    let targetFiles = [];
    try {
      const leafOut = git(repoRoot, ['diff', '--name-only', `${mergeBase}...${leafBranch}`]).trim();
      if (leafOut) leafFiles = leafOut.split('\n').filter(Boolean);
      const targetOut = git(repoRoot, ['diff', '--name-only', `${mergeBase}...${targetBranch}`]).trim();
      if (targetOut) targetFiles = targetOut.split('\n').filter(Boolean);
    } catch {
      continue;
    }

    const targetFileSet = new Set(targetFiles);
    const shared = leafFiles.filter((file) => targetFileSet.has(file)).sort();
    if (shared.length === 0) continue;

    result[id] = {
      id,
      branch: leafBranch,
      target: targetBranch,
      shared,
      sessionIds,
    };
  }

  return result;
}

export const postlandDrift = postLandDrift;
