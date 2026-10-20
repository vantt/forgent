// postland-drift.mjs — recompute-on-read post-land drift consumer (tsk-1el,
// D1-D9, docs/history/postland-drift-consumer/CONTEXT.md).
//
// Computes path overlap between landed target branches and open leaf (or nested
// root) branches cumulative since fork (D6), gated strictly to items with a live
// session (`listSessions`, D2). Recompute-on-read, no merge-time persistence
// (D3).
import { openLeavesSharingTarget } from './graph-harness.mjs';
import { listSessions } from '../runner/session.mjs';
import { createGitInspect, gitPortOptions } from '../git/inspect.mjs';
import { inspectEntries, inspectPath } from '../util/git-paths.mjs';

function requireTrunk(fnName, trunk) {
  if (typeof trunk !== 'string' || trunk === '') {
    throw new TypeError(`${fnName}: opts.trunk is required (a non-empty branch name, e.g. detectTrunk(repoRoot))`);
  }
  return trunk;
}

// The commit `branch` names as a real local ref, or null when it has none.
function branchTip(inspect, branch) {
  try {
    const ref = inspect.resolveRef({ name: `refs/heads/${branch}` });
    return ref.kind === 'direct' ? ref.oid : null;
  } catch {
    return null;
  }
}

// Every path the commits from `base` to `tip` change, byte for byte, a rename as both halves.
function changedPaths(inspect, base, tip) {
  return inspectEntries((page) => inspect.diff({ ...page, before: base, after: tip })).map((entry) => inspectPath(entry.path));
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

  let inspect;
  for (const id of Array.from(candidateIds).sort()) {
    const sessionIds = sessionsByItem.get(id) ?? [];
    if (sessionIds.length === 0) continue; // D2: notify only

    const item = work[id];
    if (!item) continue;

    inspect ??= createGitInspect(gitPortOptions(repoRoot));
    const leafBranch = `fgw/${id}`;
    const leafTip = branchTip(inspect, leafBranch);
    if (!leafTip) continue;

    const targetBranch = item.parent ? `fgw/${item.parent}` : trunk;
    const targetTip = branchTip(inspect, targetBranch);
    if (!targetTip) continue; // D8: skipped silently if target gone

    let leafFiles = [];
    let targetFiles = [];
    try {
      const { mergeBase } = inspect.compareCommits({ left: targetTip, right: leafTip });
      if (!mergeBase) continue;
      // One side moving a file the other edits is shared.
      leafFiles = changedPaths(inspect, mergeBase, leafTip);
      targetFiles = changedPaths(inspect, mergeBase, targetTip);
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
