// drift-status.mjs — read-only, git-inspecting drift checks over item
// branches: `driftStatus` per ROOT branch (tsk-3bn,
// docs/history/tsk-3bn-merge-conductor-harness-v2/) and
// `unmergedDeliveries` over EVERY handed-over item, leaf included
// (tsk-1l9). Kept OUT of
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
import { isResolvedStatus } from './frontier.mjs';

// `trunk` is supplied by the caller, never detected here (tsk-49i D1): the
// only way to name a repo's trunk is a git call that lives on the runner
// side, and importing it back into `state/` was one of the import edges
// that made the two folders mutually dependent. Both exported functions
// below take it as a REQUIRED option — a silently-defaulted `'main'` would
// route drift comparisons at the wrong branch on a master-trunk repo.
function requireTrunk(fnName, trunk) {
  if (typeof trunk !== 'string' || trunk === '') {
    throw new TypeError(`${fnName}: opts.trunk is required (a non-empty branch name, e.g. detectTrunk(repoRoot))`);
  }
  return trunk;
}

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

// Whether every commit on `branch` is already reachable from `from`.
function isAncestor(repoRoot, branch, from) {
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', branch, from]);
    return true;
  } catch {
    return false;
  }
}

// Whether `branch` introduces no file change at all relative to where it
// forked from `from`. A branch can sit many commits "ahead" while its tree is
// byte-identical to the merge-base — a chain of merge commits that only
// carried trunk's own content back in, which is what a synced-up root branch
// looks like. Nothing there can possibly be missing, whatever the commit
// count says.
function introducesNothing(repoRoot, branch, from) {
  try {
    const base = git(repoRoot, ['merge-base', from, branch]).trim();
    if (!base) return false;
    return git(repoRoot, ['diff', '--name-only', base, branch]).trim() === '';
  } catch {
    return false;
  }
}

// How many NON-MERGE commits on `branch` have no patch-equivalent anywhere on
// `from`. `--cherry-pick` compares patch-ids, so a commit whose content
// reached trunk by a different route — cherry-picked, re-applied, or carried
// in on a branch that was later rewritten — is not counted.
//
// `--no-merges` matters: a merge commit has no patch-id, so `--cherry-pick`
// can never match one and would count every merge as unmatched forever.
//
// This is the difference between "this branch is not merged" (a ref fact) and
// "this work is missing" (a content fact). The first without the second is
// ordinary housekeeping, not an incident: the first live run of this module
// flagged three branches, and two of them (tsk-67g, tsk-3um) turned out to
// have landed their content by another path already. Reporting those as lost
// work is exactly the kind of false alarm that teaches people to skip doctor.
function unmatchedCommitCount(repoRoot, branch, from) {
  try {
    const out = git(repoRoot, ['rev-list', '--count', '--cherry-pick', '--right-only', '--no-merges', `${from}...${branch}`]).trim();
    const n = Number.parseInt(out, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    // Unreadable refs — report nothing rather than guess a number that would
    // drive a false alarm either way.
    return 0;
  }
}

// A completed item's branch is supposed to be reachable from trunk. These
// four statuses all mean "this item's work is finished and handed over";
// `wontfix` is deliberately absent for the same reason `driftStatus`'s own
// caller excludes it — an abandoned item's branch is SUPPOSED to sit outside
// trunk forever, so reporting it would be pure noise.
const DELIVERED_STATUSES = new Set(['delivered', 'retrospective', 'cleanup', 'done']);

/**
 * Compute drift status for every root branch reachable from `view`'s work
 * state. Returns `{ [rootId]: { branch, target, aheadOfTarget,
 * behindTarget, lastSyncedTip, carriesContent, needsSync } }` — a root whose
 * `fgw/<id>`
 * branch does not exist locally (never created, or already cleaned up
 * after merge) is omitted entirely, not reported as an error.
 *
 * `target` is the caller-supplied `opts.trunk` — the repo's real detected
 * trunk name (`worktree.mjs`'s `detectTrunk`), never a hardcoded `'main'`
 * literal — unless the root itself has a `parent` (a nested root), in which
 * case its target is `fgw/<parentId>` — supporting nesting deeper than one
 * level, per the locked design.
 */
export function driftStatus(repoRoot, view, { trunk } = {}) {
  requireTrunk('driftStatus', trunk);
  const work = view?.work ?? {};
  const result = {};

  for (const rootId of findRootIds(work)) {
    const branch = `fgw/${rootId}`;
    if (!branchExists(repoRoot, branch)) continue;

    const rootItem = work[rootId];
    // tsk-2ec: a parent that has already resolved (done/delivered/...) is
    // no longer a legitimate sync target -- its own fgw/<parentId> branch
    // is frozen (nothing further is meant to land there), even though the
    // branch itself typically still exists on disk (worktrees/branches
    // are never torn down promptly after merge). Route to trunk directly
    // in that case, the same "is this item done" question isResolvedStatus
    // already answers one line below for needsSync.
    const parentItem = rootItem?.parent ? work[rootItem.parent] : null;
    const targetBranch = rootItem?.parent && !isResolvedStatus(parentItem) ? `fgw/${rootItem.parent}` : trunk;
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

    // tsk-1l9 follow-up: `aheadOfTarget` counts COMMITS, which is the wrong
    // question for "is anything stranded". A root branch that only ever
    // merged its target back into itself sits many commits ahead while
    // carrying no content of its own, and a branch whose commits all landed
    // by another route is just a stale ref. Reported as a separate ADDITIVE
    // field rather than folded into `needsSync`: that flag drives `fgos merge
    // next`'s own auto-sync path (bin/fgos.mjs), and narrowing it here would
    // silently change what the unattended merge loop acts on. Only
    // `fgos doctor`'s root-drift check reads this.
    const carriesContent = !introducesNothing(repoRoot, branch, targetBranch)
      && unmatchedCommitCount(repoRoot, branch, targetBranch) > 0;

    result[rootId] = {
      branch,
      target: targetBranch,
      aheadOfTarget,
      behindTarget,
      lastSyncedTip,
      carriesContent,
      needsSync: aheadOfTarget > 0 && !isResolvedStatus(rootItem),
    };
  }

  return result;
}

/**
 * Every item whose status says its work was handed over, but whose own
 * `fgw/<id>` branch is NOT reachable from trunk — i.e. the work is not on
 * main even though the state says it is. Returns
 * `{ [id]: { branch, status, landedOn, unmatched } }`; `landedOn` names the
 * parent branch the item did merge into when that is why it is off trunk,
 * and is `null` when the branch was never merged anywhere. `unmatched` is
 * how many of the branch's non-merge commits have no patch-equivalent on
 * trunk — a branch where that is zero, or which changes no file at all
 * against its fork point, is omitted entirely, because its content is
 * already there and only the ref is stale.
 *
 * Why this is not covered by `driftStatus` above: that function is scoped to
 * ROOTS (an item some other item calls `parent`), so a leaf is invisible to
 * it. `delivered` is reachable through a bare `fgos move`, which performs no
 * merge and asks for no proof of one, so a leaf can be marked handed-over
 * with its branch still sitting outside trunk and nothing anywhere says so:
 * `fgos stale`'s post-delivery bucket waits a three-day TTL and then reports
 * "forgotten", never "unmerged". Observed three times before this existed —
 * `tsk-4b2` (recovered by tsk-13z), then `tsk-64h` and `tsk-2t5` together
 * (recovered by tsk-1l9, which is where this function comes from).
 *
 * An item with no local `fgw/<id>` branch is omitted, not reported: the
 * branch may simply have been cleaned up after a real merge, and this
 * function must never turn ordinary housekeeping into an alarm.
 */
export function unmergedDeliveries(repoRoot, view, { trunk } = {}) {
  requireTrunk('unmergedDeliveries', trunk);
  const work = view?.work ?? {};
  const result = {};

  for (const item of Object.values(work)) {
    if (!DELIVERED_STATUSES.has(item.status)) continue;
    const branch = `fgw/${item.id}`;
    if (!branchExists(repoRoot, branch)) continue;
    if (isAncestor(repoRoot, branch, trunk)) continue;

    // Not merged, but is anything actually missing? Two ways the answer is
    // no, and neither is an incident: the branch changes no file at all
    // against its fork point, or every commit it does carry already has a
    // patch-equivalent on trunk. Both are stale refs, pure housekeeping.
    if (introducesNothing(repoRoot, branch, trunk)) continue;
    const unmatched = unmatchedCommitCount(repoRoot, branch, trunk);
    if (unmatched === 0) continue;

    // Distinguish the two causes, because they need different fixes. A leaf
    // that DID merge into its parent's branch is stranded only because that
    // root has not synced — `fgos sync-root <parent>` carries it, and
    // re-merging the leaf would be wrong. A branch that merged nowhere needs
    // its content landed on its own.
    const parentBranch = item.parent ? `fgw/${item.parent}` : null;
    const landedOn = parentBranch && branchExists(repoRoot, parentBranch) && isAncestor(repoRoot, branch, parentBranch)
      ? parentBranch
      : null;

    result[item.id] = { branch, status: item.status, landedOn, unmatched };
  }

  return result;
}
