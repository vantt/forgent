// drift-status.mjs — read-only, git-inspecting drift check per root branch
// (tsk-3bn, docs/history/tsk-3bn-merge-conductor-harness-v2/). Kept OUT of
// graph-harness.mjs deliberately: that file declares itself pure ("no fs,
// no Date.now(), no event append, no mutation"), while this module shells
// real git subprocesses — a different testing/mocking story (design report
// §External Practice 3, design-decisions report's Layer 1 spec).
//
// NOT cached (D4, docs/history/tsk-3bn-merge-conductor-harness-v2/
// CONTEXT.md): every field here is recomputed fresh from git refs on each
// call. `lastSyncedTip` in particular is `git merge-base` re-run live, not
// a stored "last-known-synced-tip" file — avoids a second state-consistency
// surface next to `events.jsonl`, which is already known fragile under
// concurrency (tsk-3wq).
import { execFileSync } from 'node:child_process';
import { detectTrunk } from '../runner/merge.mjs';
import { isResolvedStatus } from './frontier.mjs';

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
}

// A "root" is any item that is some other item's `parent` — the same
// definition CONTEXT.md's pinned term uses ("a work item whose fgw/<id>
// branch is a merge target for its own children").
function findRootIds(work) {
  const rootIds = new Set();
  for (const item of Object.values(work)) {
    if (item.parent) rootIds.add(item.parent);
  }
  return rootIds;
}

// Whether `branch` exists as a real local ref in `repoRoot`.
function branchExists(repoRoot, branch) {
  try {
    git(repoRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute drift status for every root branch reachable from `view`'s work
 * state. Returns `{ [rootId]: { branch, target, aheadOfTarget,
 * behindTarget, lastSyncedTip, needsSync } }` — a root whose `fgw/<id>`
 * branch does not exist locally (never created, or already cleaned up
 * after merge) is omitted entirely, not reported as an error.
 *
 * `target` is `main`'s real detected name (`detectTrunk`, never a
 * hardcoded `'main'` literal) unless the root itself has a `parent`
 * (a nested root), in which case its target is `fgw/<parentId>` —
 * supporting nesting deeper than one level, per the locked design.
 */
export function driftStatus(repoRoot, view) {
  const work = view?.work ?? {};
  const trunk = detectTrunk(repoRoot);
  const result = {};

  for (const rootId of findRootIds(work)) {
    const branch = `fgw/${rootId}`;
    if (!branchExists(repoRoot, branch)) continue;

    const rootItem = work[rootId];
    const targetBranch = rootItem?.parent ? `fgw/${rootItem.parent}` : trunk;
    if (targetBranch !== trunk && !branchExists(repoRoot, targetBranch)) continue;

    let aheadOfTarget = 0;
    let behindTarget = 0;
    let lastSyncedTip = null;
    try {
      const counts = git(repoRoot, ['rev-list', '--left-right', '--count', `${targetBranch}...${branch}`]).trim();
      const [behind, ahead] = counts.split(/\s+/).map((n) => Number.parseInt(n, 10));
      behindTarget = Number.isFinite(behind) ? behind : 0;
      aheadOfTarget = Number.isFinite(ahead) ? ahead : 0;
    } catch {
      // one of the two refs became unreachable between the existence
      // checks above and this call (rare race) — report zero drift rather
      // than throw; the next call will see current reality.
    }
    try {
      lastSyncedTip = git(repoRoot, ['merge-base', targetBranch, branch]).trim() || null;
    } catch {
      // no common ancestor (orphan branch) — leave null.
    }

    result[rootId] = {
      branch,
      target: targetBranch,
      aheadOfTarget,
      behindTarget,
      lastSyncedTip,
      needsSync: aheadOfTarget > 0 && !isResolvedStatus(rootItem),
    };
  }

  return result;
}
