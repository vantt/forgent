// merge.mjs — the approval-gate merge engine (per pr-lifecycle D1-D5):
// mechanics that turn an approved proposal into a merged, verified `done`
// item — extracted from bin/fgos.mjs so the CLI stays a thin verb table,
// mirroring how worktree.mjs/goal-check.mjs were already extracted.
//
// SOURCE CLASSIFICATION (per plan action (2)): every proposed item is
// classified into exactly one diff source before review/approve act on it:
//   - "runner" : a live `fgw/<id>` branch exists (worktree.mjs's branchExists)
//   - "pull"   : no live branch, but the item carries headAtTake AND
//                headAtReturn (fgos take/return, cell pr-lifecycle-1)
//   - "legacy" : neither — a proposed item from before this feature existed,
//                or whose branch/markers are gone. Approve/review never
//                throw on this — every verb degrades honestly (must_haves).
//
// MERGE MECHANICS (Git spec §9): every runner merge is one native Land
// transaction. Land builds a candidate commit of the branch onto the pinned
// target in its own detached worktree; the item's OWN verify and the
// repo-invariant checks run in that candidate (goal-check.mjs, D3's "merge
// sạch" second clause) BEFORE anything is published; a red verify or a
// conflict leaves the target untouched, so no target ever holds a broken
// merge commit. Only "pull"/"legacy" items skip the merge step entirely:
// their code is already on main (D4), so approve only re-runs their verify
// directly against the current tree.
//
// This module never writes to `.fgos/` — every state transition (proposed
// -> done / -> blocked) stays in bin/fgos.mjs, the sole write door via
// src/state/store.mjs, exactly like worktree.mjs/goal-check.mjs never touch
// state.json either.
//
// TRUNK PARAMETERIZATION (per D3, fan-out-parallel): `reviewDiff`'s "runner"
// source diff trunk is caller-parameterizable via `opts.trunk` — fan-out's
// per-root branch tree (`fgw/<root>`) needs a leaf's diff computed against
// its parent branch instead of the repo's actual trunk. When `opts.trunk` is
// omitted, `detectTrunk` resolves the default (origin/HEAD's target, falling
// back to a local `main`/`master` branch) instead of a hardcoded `'main'` —
// this repo's own trunk is `main`, but nothing here assumes that literal
// name anymore. Wiring an actual caller to pass a non-default trunk is out
// of scope here (Epic 4's job); this only makes the primitive capable.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { branchNameFor, branchExists, reclaimOrphanedCheckout, detectTrunk, inspectGit, resolveRefSha, checkoutPathForBranch, provisionDependencies, runWorktreeSetupCommands, createVerifyCheckout, removeWorktree, deleteBranchRef, gitWorktrees, realpathOrSelf } from './worktree.mjs';
import { runGoalCheck, runInvariantChecks, invariantFailureAsCheck } from './goal-check.mjs';
import { readInvariantCheckCommands } from '../config/shared-config-file.mjs';
import { normalizePath } from '../util/normalize-path.mjs';
import { listSessions } from './session.mjs';
import { listWork, readRawEvents } from '../state/store.mjs';
import { prepareWorkStore } from '../state/work-event-store.mjs';
import { branchKey } from '../event-store/index.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { openLeavesSharingTarget, classifyPostLandDrift } from '../state/graph-harness.mjs';
import { withMainCheckout } from './repo-locks.mjs';
import { DEFAULT_LOCK_WAIT_MS } from './lock-wait.mjs';
import { LockScope, acquireSync, createLockScope, lockHolders, probe } from '../holder-lock/index.mjs';
import { createGitLand } from '../git/land.mjs';
import { createGitRecovery } from '../git/recovery.mjs';
import { gitPortOptions } from '../git/inspect.mjs';
import { createGitSync } from '../git/sync.mjs';
import { nativeError } from '../git/native.mjs';
import { createGitWorktree } from '../git/worktree.mjs';

/** Raised only for a genuinely unexpected failure (a held lock, a target
 * checked out elsewhere, an unreadable merge) — never for a conflict or a
 * red verify, which are defined outcomes returned normally (see
 * landRunnerItem below). */
export class MergeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MergeError';
    this.errorClass = 'merge-fail';
    this.category = 'merge-fail';
    Object.assign(this, details);
  }
}

/** Every path Inspect `diff` reports between `before` and `after` (commits
 * or trees), across all pages, as text. `scope` passes `prefix`/`renames`. */
function diffPaths(port, before, after, scope = {}) {
  const paths = [];
  let cursor;
  do {
    const page = port.diff({ before, after, ...scope, maxEntries: 4096, cursor });
    paths.push(...page.entries.map(entry => Buffer.from(entry.path).toString('utf8')));
    cursor = page.nextCursor;
  } while (cursor);
  return paths;
}

/** Every file path starting with the literal `prefix` at the commit or tree
 * `revision`. */
function treePaths(port, revision, prefix) {
  const paths = [];
  let cursor;
  do {
    const page = port.listTree({ revision, prefix, maxEntries: 4096, cursor });
    paths.push(...page.entries.filter(entry => entry.kind !== 'tree').map(entry => Buffer.from(entry.path).toString('utf8')));
    cursor = page.nextCursor;
  } while (cursor);
  return paths;
}

// Review patches retain the existing 50 MiB ceiling and caller override.
// Inspect enforces the bound before returning patch text to Node.
const DIFF_MAX_BUFFER = 50 * 1024 * 1024;

// tsk-648: raised once a diff still overflows maxBuffer above — names the
// real condition (a diff too large to compute, most often because the
// branch is very stale) instead of forwarding Node's raw ENOBUFS message,
// which gave no path forward. Only fires on that one specific failure
// mode; every other git failure keeps its original "computing <label>
// failed: <err.message>" shape unchanged. `label` is the call site's own
// pre-formatted description (e.g. `diff for branch "${branch}"` or
// `pull-door diff for range "${range}"`) — this helper never reformats it.
function diffFailureMessage(label, err) {
  let cause;
  try { cause = JSON.parse(err.message).cause; } catch { /* native diagnostic is optional */ }
  if (err.code === 'ENOBUFS' || cause === 'git-output-limit') {
    return (
      `${label} exceeds the ${DIFF_MAX_BUFFER}-byte diff limit — ` +
      'the branch is likely very stale relative to its merge target (many commits behind); ' +
      'sync/rebase it before reviewing.'
    );
  }
  return `computing ${label} failed: ${err.message}`;
}

/** Whether one path Git Inspect reports (a rename or copy as both halves) is ignorable by the clean-tree
 * gate: it sits inside `.fgos/`, or outside `ownFileSet` when one is given.
 *
 * `git status --porcelain` always reports paths relative to the real git
 * top-level, never relative to the cwd the command was actually run from
 * (verified empirically: `git -C sub status --porcelain` still reports
 * `sub/other.txt`, not `other.txt`). When the caller's own `.fgos/` lives
 * under a subdirectory of that top-level (`fgos` invoked from a subdir of
 * the real repo — the STR60 dogfood-fixture case), the literal `.fgos`/
 * `.fgos/` comparison never matches. `prefix` is that subdirectory's path
 * relative to the git top-level (with a trailing slash, or '' at the
 * top-level itself — exactly `git rev-parse --show-prefix`'s own output),
 * so callers already at the top-level (the default, '') see byte-identical
 * behavior to before this parameter existed.
 *
 * `ownFileSet` (tsk-598, D2/D3) narrows which NON-`.fgos/` paths still count
 * as blocking: `null` (the default, every existing caller) keeps this path
 * blocking exactly like before — the fail-safe direction. When a `Set` is
 * given, a non-`.fgos/` path also counts as ignorable when it is outside
 * that set — an unrelated dirty/untracked file (a different session's work,
 * or anything not in the item's own committed-diff-plus-footprint scope)
 * never blocks `return`/`approve` again; a path that IS in the set still
 * blocks, whether that is a real re-dirtied conflict (D2) or the item's own
 * not-yet-committed work inside a declared `footprint` (D3). */
export function isIgnorableStatusPath(filePath, prefix = '', ownFileSet = null) {
  const isFgosPath = filePath === `${prefix}.fgos` || filePath.startsWith(`${prefix}.fgos/`);
  // `buildOwnFileSet` normalizes its paths, so the status path is normalized the same way before
  // the lookup (two names differing only in edge spaces then both count as own: the gate blocks).
  return isFgosPath || (ownFileSet !== null && !ownFileSet.has(normalizePath(filePath)));
}

/** Build the `ownFileSet` `isIgnorableStatusPath`/`isWorkingTreeClean` take
 * (D2/D3): the union of the item's own committed-diff paths (`return`'s
 * `headAtTake..HEAD`, or `approve`'s branch-vs-trunk `changedFiles` — the
 * caller already has whichever applies) and its declared `footprint`, if
 * any — same exact-path Set membership `frozenJudgeHits` already uses for
 * `footprint`, `normalizePath`'d the same way so a path reported by git
 * status matches regardless of a stray `./` or `\`. */
export function buildOwnFileSet(committedDiffPaths, footprint) {
  const paths = [
    ...(Array.isArray(committedDiffPaths) ? committedDiffPaths : []),
    ...(Array.isArray(footprint) ? footprint : []),
  ];
  return new Set(paths.map(normalizePath));
}

/** Whether a working tree has no pending changes outside of `.fgos/` — the
 * single shared gate both `return` (subtree scope) and `approve` (whole-repo
 * scope) check before either lets an item advance. `.fgos/` itself is
 * excluded: it holds the store's own view caches and runtime files, written
 * by the very take/return/approve lifecycle operations this gate guards, so
 * it never signals an actually-dirty code tree.
 *
 * `scope` picks git's own pathspec: `'whole-repo'` (the default) runs `git
 * status --porcelain` with no pathspec — `approve` is expected to see the
 * entire main tree's cleanliness, not just its own subtree. `'subtree'` runs
 * `git status --porcelain -- .` instead, scoping the scan to `repoRoot`'s
 * own subtree — `return`'s per-item gate, where an unrelated uncommitted
 * file elsewhere in the repo must never block returning THIS item.
 *
 * Either way `repoRoot` is not guaranteed to be the git top-level
 * (`worktree.mjs`'s `isMainWorktree` tolerates a subdirectory of the main worktree;
 * `return`'s cwd is the item's own working directory, same reasoning), and
 * either way git still reports paths top-level-relative — verified
 * empirically for both pathspec forms — so the `.fgos/` exclusion needs the
 * same top-level-relative prefix `isIgnorableStatusPath` takes, computed here
 * via `git rev-parse --show-prefix` regardless of scope.
 *
 * `ownFileSet` (tsk-598, D2/D3) is threaded straight through to
 * `isIgnorableStatusPath` — omitted (`null`, the default), every existing
 * caller keeps today's exact whole-tree-blocks-on-anything behavior. */
export function isWorkingTreeClean(repoRoot, ownFileSet = null, { scope = 'whole-repo' } = {}) {
  const port = inspectGit(repoRoot);
  const facts = port.resolveRepo();
  const relative = path.relative(fs.realpathSync(facts.worktreeRoot), fs.realpathSync(repoRoot)).replaceAll('\\', '/');
  const prefix = relative ? `${relative}/` : '';
  let cursor;
  do {
    const page = port.status({ untracked: 'all', maxEntries: 4096, cursor });
    for (const entry of page.entries) {
      const file = Buffer.from(entry.path).toString('utf8');
      if (scope === 'subtree' && prefix && !file.startsWith(prefix)) continue;
      if (!isIgnorableStatusPath(file, prefix, ownFileSet)) return false;
    }
    cursor = page.nextCursor;
  } while (cursor);
  return true;
}

/**
 * Resolve the pull-door take/return head pair for `item` — tsk-40m (docs/
 * architect/doing-coordination-redesign.md): `headAtTake`/`headAtReturn` are
 * top-level sticky fields only ever set by a durable work.move payload,
 * which claim time no longer writes; the settle's own work.attempt now
 * carries them instead, folded into `item.lastAttempt`. Checked as a
 * fallback, never instead of, so a genuinely legacy pre-migration record
 * (top-level field set, no lastAttempt) still resolves exactly as before.
 */
function resolvePullDoorHeads(item) {
  const headAtTake = item.headAtTake ?? item.lastAttempt?.headAtTake;
  const headAtReturn = item.headAtReturn ?? item.lastAttempt?.headAtReturn;
  return { headAtTake, headAtReturn };
}

/** Classify a proposed `item` into its diff/merge source (see module doc). */
export function classifySource(repoRoot, item) {
  if (branchExists(repoRoot, branchNameFor(item.id))) {
    return 'runner';
  }
  const { headAtTake, headAtReturn } = resolvePullDoorHeads(item);
  if (typeof headAtTake === 'string' && headAtTake && typeof headAtReturn === 'string' && headAtReturn) {
    return 'pull';
  }
  return 'legacy';
}

/**
 * Build the human-viewable diff for a proposed item's `review` (never
 * throws on a legacy item — it degrades to a warning, no diff). For a
 * "runner" item, the trunk compared against defaults to the repo's detected
 * trunk (`detectTrunk` — no longer a hardcoded `'main'`) but is caller-
 * parameterizable via `opts.trunk` (per D3, fan-out-parallel) — a leaf's
 * diff against its parent root branch instead of the trunk, without
 * changing the default behavior for every existing caller.
 *
 * Pull-door range (per plan's deferred-to-planning resolution): the range is
 * fixed at `headAtTake..headAtReturn`, so it never picks up commits landed
 * on main AFTER this item's own return — but it CAN contain commits from
 * another session's take/return interleaved inside this item's own window
 * (multi-session is a valid scenario, not an error). This is reported as an
 * honest warning (commit count in range) rather than silently attributing
 * every line in the diff to this one item.
 *
 * `opts.maxBuffer` (tsk-648): overrides DIFF_MAX_BUFFER for both full-diff
 * calls below — the seam a test uses to prove the ENOBUFS-diagnosis path
 * deterministically, without needing an actually-hundreds-of-commits-stale
 * diff. Omitted in every real caller today, so the generous default applies.
 */
export function reviewDiff(repoRoot, item, opts = {}) {
  const { trunk = detectTrunk(repoRoot), maxBuffer = DIFF_MAX_BUFFER } = opts;
  const source = classifySource(repoRoot, item);

  if (source === 'runner') {
    const branch = branchNameFor(item.id);
    let diff;
    try {
      const port = inspectGit(repoRoot);
      const after = resolveRefSha(repoRoot, branch);
      const before = port.compareCommits({ left: resolveRefSha(repoRoot, trunk), right: after }).mergeBase;
      diff = port.diffText({ before, after, maxBytes: maxBuffer });
    } catch (err) {
      throw new MergeError(diffFailureMessage(`diff for branch "${branch}"`, err), { branch });
    }
    return { source, diff, warnings: [] };
  }

  if (source === 'pull') {
    const { headAtTake, headAtReturn } = resolvePullDoorHeads(item);
    const range = `${headAtTake}..${headAtReturn}`;
    let diff;
    let commitCount;
    try {
      const port = inspectGit(repoRoot);
      const before = resolveRefSha(repoRoot, headAtTake);
      const after = resolveRefSha(repoRoot, headAtReturn);
      diff = port.diffText({ before, after, maxBytes: maxBuffer });
      commitCount = port.compareCommits({ left: before, right: after }).right;
    } catch (err) {
      throw new MergeError(diffFailureMessage(`pull-door diff for range "${range}"`, err), { range });
    }
    const warnings = commitCount > 1
      ? [`range headAtTake..headAtReturn contains ${commitCount} commits — may include commits from another session's take/return interleaved with this one (multi-session is a valid scenario; honest degrade, not an error)`]
      : [];
    return { source, diff, warnings };
  }

  return {
    source: 'legacy',
    diff: null,
    warnings: ['no live diff source for this item — no fgw/<id> branch and no headAtTake/headAtReturn recorded (a legacy proposed item predating pr-lifecycle); review/approve/reject still work, just without a viewable diff'],
  };
}

/**
 * The changed file paths of a runner item's branch, relative to the repo
 * root — the input the Iron Law classifier (evolve/iron-law.mjs) checks its
 * self-modifying-capable module rules against (D16). Reuses the exact same
 * trunk/branch resolution `reviewDiff`'s runner path already uses
 * (`detectTrunk` + `branchNameFor`, `opts.trunk` overridable per D3) but runs
 * `git diff --name-only <trunk>...<branch>` instead of the full textual diff,
 * returning the paths as an array of strings (empty entries dropped).
 *
 * Scoped to runner-sourced items only (per D16): a pull/legacy item returns
 * an empty array — its code is already human-committed directly to main (the
 * durability ladder D4), so the approve-side Iron Law check has nothing to
 * gate. This is a confirmed, intentional boundary, not a coverage gap.
 */
/**
 * POST-LAND DRIFT DETECTION (tsk-2ypd, CONTEXT.md D4): after a merge lands,
 * which still-open branches did it actually put behind? Answered by
 * intersecting REAL changed-file sets on both sides — never declared
 * `footprint` (`graph-metrics.mjs`'s `footprintOverlapAmong` compares that
 * weaker, hand-filled signal; git already has the ground truth here).
 *
 * This is a DETECTION point, never a catchup point. Triggering catchup on
 * "the root moved" uses a topology event as a proxy for real risk: a root
 * landing 13 children sequentially costs ~78 catchup+verify rounds, and
 * nearly all of them find nothing collided. So nothing in this path touches
 * a branch, runs a verify, or writes to `.fgos/` — it runs `git diff
 * --name-only` per candidate and returns a report. The three outcomes are
 * `classifyPostLandDrift`'s (nothing / notify the owning session / mark
 * stale); this function's own job is gathering the real inputs for it.
 *
 * `target` and `landedFiles` are supplied by the caller because they can
 * only be read correctly BEFORE the merge: once the branch lands, `target`
 * contains it, so `git diff target...branch` is empty and the paths this
 * branch brought are no longer recoverable from the three-dot diff.
 *
 * `view` and `sessions` are passed in rather than read here, keeping this
 * function's own I/O to git alone — and keeping this module's standing rule
 * that state access belongs to the caller.
 */
export function detectPostLandDrift(repoRoot, view, landedItem, { target, landedFiles = [], sessions = [] } = {}) {
  const sessionsByItem = new Map();
  for (const entry of sessions) {
    if (!entry?.itemId) continue;
    const known = sessionsByItem.get(entry.itemId) ?? [];
    known.push(entry.sessionId);
    sessionsByItem.set(entry.itemId, known);
  }

  const examined = [];
  const leaves = [];
  for (const id of openLeavesSharingTarget(view, landedItem.id)) {
    // A candidate whose branch is gone (deleted after its own merge, or
    // never created) has nothing to diff — skipped rather than thrown on, so
    // a detection pass can never turn an already-successful merge into a
    // failure.
    if (!branchExists(repoRoot, branchNameFor(id))) continue;
    examined.push(id);
    leaves.push({
      id,
      files: changedFiles(repoRoot, view.work[id], { trunk: target }),
      sessionIds: sessionsByItem.get(id) ?? [],
    });
  }

  return {
    landed: landedItem.id,
    target,
    landedFiles,
    examined,
    ...classifyPostLandDrift({ landedFiles, leaves }),
  };
}

export function changedFiles(repoRoot, item, opts = {}) {
  const { trunk = detectTrunk(repoRoot) } = opts;
  const source = classifySource(repoRoot, item);
  if (source !== 'runner') {
    return [];
  }
  const branch = branchNameFor(item.id);
  try {
    const port = inspectGit(repoRoot);
    const after = resolveRefSha(repoRoot, branch);
    const before = port.compareCommits({ left: resolveRefSha(repoRoot, trunk), right: after }).mergeBase;
    return diffPaths(port, before, after);
  } catch (err) {
    throw new MergeError(`computing changed files for branch "${branch}" failed: ${err.message}`, { branch });
  }
}

// DECISION-ID COLLISION AUTO-RESOLVE (tsk-3mv-1, CONTEXT.md D1a): a
// content-agnostic conflict shape, proven real on `tsk-66l`
// (docs/how-to/resolve-a-decision-id-collision-merge-conflict-on-approve.md)
// -- two branches independently pick the same "next free" decision-record
// id and both insert a row for it into `docs/decisions/0000-index.md` at
// the same position. `classifyDecisionIndexCollision` below only ever
// RECOGNIZES this shape (never resolves anything); the caller decides
// whether to attempt a resolve, and the resolve itself renumbers ONLY
// `branch`'s own colliding decision file(s) -- `HEAD`'s (main's) numbering
// is always treated as already-authoritative, matching the how-to's own
// "find the real next-free ID from main" step. Any conflict shape this
// classifier does not recognize returns null, and the caller falls
// through to the exact same abort-and-report `conflict` outcome as before
// this feature existed -- self-resolve is additive, never a new way to
// silently keep the wrong content (CONTEXT.md's pinned "self-resolvable
// merge-conflict" boundary is a hard line, not a suggestion).

const DECISION_INDEX_PATH = 'docs/decisions/0000-index.md';
const DECISION_FILE_RE = /^docs\/decisions\/(\d{4})-([^/]+)\.md$/;
const DECISION_ROW_RE = /^\|\s*\[(\d{4})\]\(([^)]+)\)\s*\|/;

/** Split a conflicted file's raw text (as `git merge --no-commit --no-ff`
 * leaves it on disk) into an ordered list of segments -- plain `{type:
 * 'text', lines}` runs and `{type: 'conflict', oursLines, theirsLines}`
 * hunks -- so a caller can reconstruct the file with only the conflict
 * hunks replaced. Tolerates zero conflict markers (an all-text list),
 * though a caller in this module never calls it on an unconflicted file. */
export function splitConflictSegments(text) {
  const lines = text.split('\n');
  const segments = [];
  let textLines = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith('<<<<<<<')) {
      if (textLines.length > 0) {
        segments.push({ type: 'text', lines: textLines });
        textLines = [];
      }
      i++;
      const oursLines = [];
      while (i < lines.length && !lines[i].startsWith('=======')) {
        oursLines.push(lines[i]);
        i++;
      }
      i++; // skip the "=======" separator itself
      const theirsLines = [];
      while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
        theirsLines.push(lines[i]);
        i++;
      }
      i++; // skip the ">>>>>>> branch" marker itself
      segments.push({ type: 'conflict', oursLines, theirsLines });
    } else {
      textLines.push(lines[i]);
      i++;
    }
  }
  if (textLines.length > 0) {
    segments.push({ type: 'text', lines: textLines });
  }
  return segments;
}

/**
 * Classify whether the conflicted text of `docs/decisions/0000-index.md`
 * (as `git merge-tree --write-tree` leaves it in its merged tree, read by
 * `declareLandFiles` only when that index is the ONLY conflicted path --
 * any other conflicted path, or more than one, is never this shape) is a
 * self-resolvable decision-ID collision. Requires every conflict hunk in it to be a pure
 * two-sided row INSERTION -- both `oursLines` and `theirsLines` are
 * non-empty, share no identical line (a same-row edit reads as one side
 * repeating what the other kept, which this never treats as a safe
 * insertion), and every line on both sides matches the index's own `|
 * [NNNN](file.md) | ... |` row shape. Returns `null` for anything else --
 * a real content dispute, a non-index conflict, or a hunk this classifier
 * cannot confidently read as "two independent new rows" -- so the caller's
 * only choice on `null` is the pre-existing abort-and-report path.
 */
function classifyDecisionIndexText(raw) {
  const segments = splitConflictSegments(raw);
  const conflicts = segments.filter((s) => s.type === 'conflict');
  if (conflicts.length === 0) {
    return null;
  }
  const oursIds = new Set();
  const theirsIds = new Set();
  const oursLinks = new Set();
  const theirsLinks = new Set();
  for (const hunk of conflicts) {
    if (hunk.oursLines.length === 0 || hunk.theirsLines.length === 0) {
      return null; // a pure delete/keep on either side is not two insertions
    }
    const oursSet = new Set(hunk.oursLines);
    if (hunk.theirsLines.some((line) => oursSet.has(line))) {
      return null; // an identical line on both sides doesn't read as two independent inserts
    }
    for (const line of hunk.oursLines) {
      const m = line.match(DECISION_ROW_RE);
      if (!m) return null;
      oursIds.add(m[1]);
      oursLinks.add(m[2]);
    }
    for (const line of hunk.theirsLines) {
      const m = line.match(DECISION_ROW_RE);
      if (!m) return null;
      theirsIds.add(m[1]);
      theirsLinks.add(m[2]);
    }
  }
  // The decisive signal a same-id COLLISION (two independent new rows that
  // happen to claim the same next-free number) is not the same thing as a
  // same-ROW EDIT (both sides changing an existing row's text differently):
  // a genuine insertion collision always links to two DIFFERENT files (each
  // side wrote its own new decision doc); an edit dispute always links to
  // the SAME already-existing file on both sides. Any shared link target
  // between ours/theirs means at least one hunk is really an edit dispute,
  // not two independent inserts -- bail to the safe abort-and-report path.
  if ([...oursLinks].some((link) => theirsLinks.has(link))) {
    return null;
  }
  const collidingIds = [...theirsIds].filter((id) => oursIds.has(id)).sort();
  return { segments, oursIds, theirsIds, collidingIds };
}

/** The next free 4-digit decision id after every id already present on
 * `refs` -- a single ref, or an array of refs when more than one tree's
 * decision files must be considered together (tsk-2iz: the auto-resolve
 * resolution in `declareLandFiles` needs BOTH the target and the incoming source's
 * own new decision files, never `HEAD` alone -- a branch can carry new,
 * non-colliding decision files ABOVE `HEAD`'s own max that `HEAD`-only
 * would never see, minting an id that then collides with one of those
 * files). The index file itself, id "0000", is excluded from every ref --
 * it is the index, never a decision record. Mirrors the how-to's own "read
 * the highest existing number on disk and add one" rule, generalized to
 * consider every tree that could hold a colliding number, instead of a
 * person reading just one tree by hand. */
export function nextFreeDecisionId(repoRoot, refs) {
  const refList = Array.isArray(refs) ? refs : [refs];
  const port = inspectGit(repoRoot);
  let max = 0;
  for (const ref of refList) {
    for (const f of treePaths(port, resolveRefSha(repoRoot, ref), 'docs/decisions/')) {
      const m = f.match(DECISION_FILE_RE);
      if (m && m[1] !== '0000') {
        max = Math.max(max, parseInt(m[1], 10));
      }
    }
  }
  return String(max + 1).padStart(4, '0');
}

/** A decision doc's own text with its title and heading lines citing
 * `newId` instead of `oldId` -- the two mechanical, always-present
 * self-references every decision doc carries. A `supersedes`/`superseded_by`
 * cross-reference to a DIFFERENT decision's id is deliberately left
 * untouched (it names another doc, not this one), and free-text prose that
 * cites the doc's own old number by hand is a documented residual
 * limitation, the same illustrative-not-exhaustive stance `iron-law.mjs`'s
 * own module list takes. */
function renumberDecisionText(text, oldId, newId) {
  const oldIdRe = new RegExp(`\\b${oldId}\\b`);
  const lines = text.split('\n');
  let titleFixed = false;
  let headingFixed = false;
  for (let i = 0; i < lines.length; i++) {
    if (!titleFixed && lines[i].startsWith('title:') && oldIdRe.test(lines[i])) {
      lines[i] = lines[i].replace(oldIdRe, newId);
      titleFixed = true;
      continue;
    }
    if (!headingFixed && lines[i].startsWith('# ') && oldIdRe.test(lines[i])) {
      lines[i] = lines[i].replace(oldIdRe, newId);
      headingFixed = true;
    }
  }
  return lines.join('\n');
}

/** Rebuild `docs/decisions/0000-index.md`'s conflicted text with every
 * conflict hunk replaced by the union of both sides' rows, sorted
 * numerically by decision id -- `idRenames` (a `Map<oldId, {newId,
 * newPath}>`, only ever populated for `theirs`-side ids that collided with
 * an `ours` id) rewrites a renamed row's `[oldId](oldPath)` link to
 * `[newId](newPath)` before sorting. Returns the text; the caller declares
 * it as candidate bytes. */
function rebuildDecisionIndex(classification, idRenames) {
  const rewriteRow = (line) => {
    const m = line.match(DECISION_ROW_RE);
    const rename = idRenames.get(m[1]);
    if (!rename) return line;
    return line
      .replace(`[${m[1]}]`, `[${rename.newId}]`)
      .replace(`(${m[2]})`, `(${path.basename(rename.newPath)})`);
  };
  const rowSortKey = (line) => line.match(DECISION_ROW_RE)[1];

  const rebuilt = classification.segments.map((segment) => {
    if (segment.type === 'text') {
      return segment.lines.join('\n');
    }
    const rows = [...segment.oursLines, ...segment.theirsLines.map(rewriteRow)];
    rows.sort((a, b) => (rowSortKey(a) < rowSortKey(b) ? -1 : 1));
    return rows.join('\n');
  }).join('\n');
  return rebuilt;
}

// tsk-1lv-2: a "mirrors merge.mjs collision-resolve subsystem" auto-resolve
// for the new GENERATED docs/decisions/index.md was attempted here and
// removed after direct reproduction proved it structurally unreachable for
// the specific scenario tested (two branches each committing a decision +
// regenerated index): a `fgw/<id>` worker branch can never legitimately
// carry a `.fgos/`-derived regenerated file through its own commit,
// because regenerating `docs/decisions/index.md` correctly requires
// reading Work's store under `.fgos/`, which a worktree never carries in the
// first place (ADR0020) -- so no branch can produce a *meaningful*
// regenerated version to collide over in a runner merge for a normal,
// well-formed regenerate. Cross-checked against `docs/how-to/fix-fgos-
// write-rejected-merge-block.md`'s own documented precedent (tsk-n4i-1/
// tsk-5vf/tsk-4eu/tsk-5ge/tsk-28o/tsk-3v2 -- six independent real
// occurrences of the SAME `.fgos/`-staged wall, a different scenario from
// this one).
//
// **This does NOT make a hostile or accidental regeneration impossible to
// merge (tsk-1lv review-fix F12, corrected here)** -- `fgos-write-rejected`
// (`declareLandFiles`) only rejects a merge that changes a path
// under `.fgos/`; `docs/decisions/index.md` itself is an ordinary tracked
// doc file, not a `.fgos/` path, so that wall never inspects it at all. A
// worktree running `fgos decision-index` with no real store to read from
// (the exact ADR0020 gap above) computes the "no decisions yet" placeholder
// -- committing and merging THAT is a real, ordinary git merge
// a runner merge would happily accept, silently blanking every platform
// decision's projection. The actual fix is a guard at the write site, not
// a merge-time collision-resolve: `generateDecisionIndex`
// (`src/report/decision-index.mjs`) now refuses to overwrite an index that
// already has real rows with freshly-computed content that has none.
// `docs/decisions/0000-index.md` (the OLD hand-authored corpus above) is a
// genuinely different case: those files are ordinary tracked source a work
// item's own branch legitimately creates as part of its real diff, never a
// `.fgos/`-derived regeneration.

/**
 * A lock-held answer from the repo-lock door as the MergeError every merge
 * caller already handles (`code: 'lock-held'`); any other error passes as is.
 * The message keeps the door's own wording: the lock's name, the holder pids
 * the kernel shows, and how long the wait lasted.
 */
export function toMergeLockError(err, details = {}) {
  if (err?.code !== 'lock-held' || err instanceof MergeError) return err;
  const named = String(err.message).replace(/^holder-lock \(lock-held\): /, '');
  const into = details.targetRef ? ` into "${details.targetRef}"` : '';
  return new MergeError(`cannot merge${details.branch ? ` "${details.branch}"` : ''}${into}: ${named}.`, {
    ...details,
    code: 'lock-held',
    holders: err.holders ?? [],
    lock: err.lock ?? null,
  });
}

// tsk-3yl D1: a prior `approve` run can already have landed this branch's
// merge commit and died at a LATER step (any failure after merge-commit
// but before the status-move to `done` — not just the compound-learn gap
// that first surfaced this, docs/backlog.md p-b91d487a). Retrying then
// finds `git merge --no-commit --no-ff` a no-op (nothing to stage), so
// `git commit --no-edit` fails with "nothing to commit" and this function
// used to throw an opaque MergeError instead of recognizing the merge
// already happened. Checked BEFORE attempting the merge, not inferred
// after the fact from an empty staged diff (fragile: commit-failure
// wording is locale/git-version dependent, `is-ancestor` is not).
export function isAlreadyMerged(repoRoot, branch, ref) {
  try {
    return inspectGit(repoRoot).ancestry({ ancestor: resolveRefSha(repoRoot, branch), descendant: resolveRefSha(repoRoot, ref) }).answer === 'yes';
  } catch (err) {
    throw new MergeError(`checking whether "${branch}" is already merged into ${ref} failed: ${err.message}`, { branch });
  }
}

/**
 * tsk-516 (docs/history/tsk-516-approve-reverify-scope/CONTEXT.md D5):
 * true when the tree this merge is about to produce is provably the exact
 * tree `return` already verified green, so re-running the checks over it
 * would be a duplicate of a result already known.
 *
 * Two conditions, both required:
 *  - the branch tip still equals `branchHeadAtReturn` — the SHA whose tree
 *    actually passed. Without this, a commit pushed onto the branch after
 *    `return` would ride in unverified.
 *  - `HEAD` has not changed any path that `branch` introduced since the fork
 *    point (`git merge-base branch HEAD`). If `HEAD` is an ancestor of `branch`,
 *    main has not advanced past the fork at all, so merging `branch` yields
 *    `branch`'s own tree. If main HAS advanced past the fork point, but only
 *    on paths disjoint from `branch`'s footprint, standard 3-way merge semantics
 *    guarantee each side's changes to paths touched by only that side are carried
 *    unmodified — so the merged tree at branch's paths is byte-identical to
 *    `branchHeadAtReturn`'s tree there. (tsk-2lq: relaxed from strict ancestor-only
 *    to tolerate disjoint main advances on busy trunks).
 *
 * Deliberately SUFFICIENT, not necessary: it skips only where identity is
 * provable, and false-negatives (running checks that would have passed)
 * cost time, while a false-positive would land an unverified tree on main.
 * A main-source return is never eligible — it records `headAtReturn`, not
 * `branchHeadAtReturn`, and this returns false for it.
 */
function mergedTreeAlreadyVerified(repoRoot, item, branch, target = 'HEAD') {
  if (typeof item.branchHeadAtReturn !== 'string' || !item.branchHeadAtReturn) return false;
  let branchTip;
  try {
    branchTip = resolveRefSha(repoRoot, branch);
  } catch {
    return false;
  }
  if (branchTip !== item.branchHeadAtReturn) return false;
  if (isAlreadyMerged(repoRoot, target, branch)) return true;

  try {
    const port = inspectGit(repoRoot);
    const head = resolveRefSha(repoRoot, target);
    const mergeBase = port.compareCommits({ left: branchTip, right: head }).mergeBase;
    if (!mergeBase) return false;
    const pathsSinceBase = (after) => new Set(diffPaths(port, mergeBase, after));
    const introducedPaths = pathsSinceBase(branchTip);
    const mainAdvancedPaths = pathsSinceBase(head);
    for (const path of introducedPaths) {
      if (mainAdvancedPaths.has(path)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// tsk-15k: whether the paths `branch` actually introduced (relative to its
// own true fork point, found via the EARLIEST merge commit on the
// `branch..ref` ancestry path) are still reflected in `ref`'s current tree.
// `isAlreadyMerged`'s bare `is-ancestor` check only proves branch's commit
// is reachable from `ref` (parent-chain linkage) — it says nothing about
// whether the resulting tree still carries branch's actual changes. A
// manually-resolved `git merge -s ours` (or any history rewrite that keeps
// branch as a parent while discarding its content) makes branch a real
// ancestor while dropping 100% of what it introduced — reproduced
// empirically against this exact function
// (docs/history/merge-verify-only-false-done/plan.md). Returns the list of
// mismatched paths (empty = parity holds, safe to trust the ancestry
// alone).
//
// Deliberately does NOT use `merge-base(branch, ref)` directly for the
// "before" state — that resolves trivially to branch's own tip once branch
// is already an ancestor of ref, which would make every check pass
// vacuously. Instead finds the specific merge commit that first brought
// branch into ref's history and uses ITS first parent (the mainline tip
// immediately before that merge landed) as the real fork point. No merge
// commit found (a fast-forward, never produced by this codebase's own
// `--no-ff` merges) means there was nothing to discard in the first place —
// trusts ancestry unchanged, matching pre-existing behavior.
function branchContentMismatch(repoRoot, branch, ref) {
  const port = inspectGit(repoRoot);
  const branchTip = resolveRefSha(repoRoot, branch);
  const firstMerge = port.firstAncestryMerge({ ancestor: branchTip, descendant: resolveRefSha(repoRoot, ref) });
  if (!firstMerge) {
    return [];
  }
  let mainline;
  let base;
  try {
    mainline = port.resolveCommit({ name: `${firstMerge}^1` });
    base = mainline && port.compareCommits({ left: branchTip, right: mainline }).mergeBase;
  } catch {
    base = null;
  }
  if (!base) return []; // no shared history to diff against — fail open, nothing to compare
  // tsk-52p: exclude .fgos/ paths outright, never just gated by a
  // `merge=union` attribute like declareLandFiles' own exemption below —
  // ADR0020 guarantees a worker branch can NEVER
  // legitimately reflect main's live .fgos/ content, union-declared or
  // not, so a branch-side .fgos/ diff (e.g. the documented recovery in
  // docs/how-to/fix-fgos-write-rejected-merge-block.md: restoring .fgos/
  // paths to the branch's own frozen pre-merge versions) is never real
  // discarded content, just an expected, permanent divergence from HEAD.
  // Rename detection stays on here (a rename names only its new path): a branch that renamed
  // `a -> b` after main already deleted `a` leaves the merge no change to make on `a`, and the
  // source half would read as discarded content.
  const introducedPaths = diffPaths(port, base, branchTip, { renames: true })
    .filter((p) => p !== '.fgos' && !p.startsWith('.fgos/'));
  if (introducedPaths.length === 0) {
    return [];
  }
  // tsk-107: compare against firstMerge itself (its content right as the
  // merge landed), not against ref's CURRENT tree. A later, unrelated
  // already-merged branch touching the same path makes ref's tree legitimately
  // differ from branch's own tree forever after — that's not discarded
  // content, just two branches sharing a file. The real "-s ours"-style
  // discard signature is narrower: the merge commit itself made no change to
  // that path relative to its own first parent, even though branch's diff
  // touched it.
  // Without rename folding a renamed path names both of its ends, so either
  // end counts as changed by the merge.
  const changedByMerge = new Set(diffPaths(port, mainline, firstMerge));
  return introducedPaths.filter((p) => !changedByMerge.has(p));
}

/** Whether the main checkout has a merge in progress (its `MERGE_HEAD`). */
function mergeHeadExists(repoRoot) {
  return inspectGit(repoRoot).resolveCommit({ name: 'MERGE_HEAD' }) !== null;
}

export function formatFgosWriteRejectedDetail(branch, paths, targetLabel) {
  return `${branch} staged a change under .fgos/ (${paths.join(', ')}); merge aborted, ${targetLabel} unchanged — ADR0020. See docs/how-to/fix-fgos-write-rejected-merge-block.md for the recovery steps.`;
}

/**
 * Best-effort cleanup, called from the `cleanup` verb once D7's TTL has
 * elapsed AND D8's harness (assessCleanupReadiness, including the
 * root-aware `checkMergeStillResolves`, tsk-1p9) has already passed — not
 * at merge time (tsk-1p9, restore-to-decision: `approve`'s own merge paths
 * no longer call this). The worktree checkout for a runner item is
 * normally already torn down by the runner at propose-time (loop.mjs's
 * finally), so this only reclaims a stray leftover checkout if one somehow
 * still exists, then deletes the now-fully-merged branch. Never throws — a
 * cleanup failure must never mask the merge/done result that already
 * happened; failures are returned as warnings for the caller to surface.
 *
 * FORCE DELETE (tsk-1p9 D8): an exact-old Refs delete, never `-d`'s merge check. By the time this
 * runs, D8's harness has ALREADY independently verified the branch's
 * commit resolves against the correct target (the root's branch for a
 * leaf, `HEAD` for a root/standalone item) — `-d`'s own local safety net
 * would check merge-into-CURRENT-HEAD instead, which is actively wrong for
 * a leaf branch (merged into its still-unmerged root branch, never into
 * `main` directly): `-d` would refuse and silently leak the branch behind
 * a harmless-looking warning, the exact bug this item exists to close.
 */
export function cleanupMergedBranch(repoRoot, branch) {
  const warnings = [];
  // The tip the harness verified is the only one this deletes: a branch that
  // moves meanwhile is left in place by the exact-old delete.
  let tip;
  try {
    tip = resolveRefSha(repoRoot, branch);
  } catch (err) {
    return { warnings: [`branch delete failed for "${branch}" (left in place, harmless): ${err.message}`] };
  }
  try {
    reclaimOrphanedCheckout(repoRoot, branch);
  } catch (err) {
    warnings.push(`worktree cleanup failed for "${branch}": ${err.message}`);
  }
  try {
    deleteBranchRef(repoRoot, branch, tip);
  } catch (err) {
    warnings.push(`branch delete failed for "${branch}" (left in place, harmless): ${err.message}`);
  }
  return { warnings };
}

/**
 * tsk-4ax (D3): the git merge/verify/commit MECHANICS shared by the
 * `catchup` verb's manual-recovery path and `approve`'s own inbound
 * pre-check (`src/verbs/merge/approve.mjs`) — merges `target` into item
 * `id`'s own branch through Sync under the source checkout's custody,
 * verifies, and commits. Lives here rather than in `bin/fgos.mjs` (tsk-49i
 * D3): it is whole git mechanics with no CLI in it, the same tier as
 * `landRunnerItem` below.
 * Deliberately never touches `.fgos/` state itself (no moveWork, no dir
 * param at all) — the two callers have DIFFERENT bookkeeping needs around
 * this same mechanism (the verb moves `blocked -> awaiting-approval`;
 * approve's pre-check makes no status transition at all, since the item is
 * already `awaiting-approval` and stays there until approve's own land
 * step finishes) and `awaiting-approval -> awaiting-approval` is not even
 * a valid FSM edge (`src/state/status-fsm.mjs`) — there would be nothing
 * for a shared moveWork call to do on that path anyway.
 *
 * Returns one of:
 *   - `{ outcome: 'already-caught-up', catchupHead, output }` — target was
 *     already an ancestor of the branch; no merge/commit needed, but a
 *     fresh verify still ran (its own green run is what's being cashed in).
 *   - `{ outcome: 'merged', catchupHead, output }` — a real merge commit
 *     landed on the item's own branch through Sync's continuation.
 *   - `{ outcome: 'verify-fail', timedOut, exitStatus, output }` — the
 *     merge (or the already-caught-up tree) staged cleanly but the item's
 *     own verify came back red; any merge started is aborted, the item's
 *     branch is left exactly as it was.
 *   - `{ outcome: 'conflict', conflictedFiles }` — a real textual conflict
 *     outside `.fgos`, read from the read-only merge before any checkout or
 *     Sync exists; branch untouched.
 *   - `{ outcome: 'merge-refused', reason }` — git refused the merge attempt
 *     up front before staging anything (no MERGE_HEAD); aborted cleanly (nothing
 *     staged to abort), branch untouched.
 *
 * Never mutates `.fgos/` state and never throws for any of these defined
 * outcomes — only for a genuinely unexpected git failure (e.g. `git merge
 * --abort` itself failing), mirroring `landRunnerItem`'s own contract.
 */
export async function performCatchUp(repoRoot, id, item, target, timeoutMs) {
  const ownBranch = branchNameFor(id);
  // The store rule Land applies, bound to the target pinned for this Sync:
  // `.fgos` keeps the target's bytes, so a stale branch neither conflicts on
  // nor carries forward store state it never owned (ADR0020). Sync on its
  // own keeps the source's `.fgos`, which would make this merge commit read
  // as the branch reverting the target's store changes; so every `.fgos`
  // path the merge result changes against the source is declared with the
  // merge's bytes. A branch's own store write is left to Land to refuse.
  const pinned = resolveRefSha(repoRoot, target);
  const source = resolveRefSha(repoRoot, ownBranch);
  const files = new Map();
  if (inspectGit(repoRoot).ancestry({ ancestor: pinned, descendant: source }).answer !== 'yes') {
    const { tree, conflictedPaths } = readMergeTree(repoRoot, pinned, source);
    // A real conflict is known from the read-only merge: report it before
    // any checkout or Sync exists, so no merge bytes are left to preserve.
    const conflictedFiles = conflictedPaths.filter((p) => !isFgosPath(p));
    if (conflictedFiles.length > 0) return { outcome: 'conflict', conflictedFiles };
    declareStoreFiles(repoRoot, item, { target: pinned, source, tree, conflictedPaths }, files);
    const merged = changedStorePaths(repoRoot, source, tree).filter((p) => !files.has(p) && !conflictedPaths.includes(p));
    const mergedBytes = readPathsAt(repoRoot, tree, merged);
    for (const p of merged) files.set(p, { path: p, bytes: mergedBytes.get(p) === null ? null : [...mergedBytes.get(p)] });
  }
  const options = gitPortOptions(repoRoot, { mutation: true });
  const worktrees = createGitWorktree(options);
  let checkout = checkoutPathForBranch(repoRoot, ownBranch);
  const created = !checkout;
  if (!checkout) {
    const parent = path.join(options.trustedMain, '.fgos/runtime/git-catchups');
    fs.mkdirSync(parent, { recursive: true });
    checkout = path.join(parent, crypto.randomUUID());
    worktrees.create({ path: checkout, branch: ownBranch, base: resolveRefSha(repoRoot, ownBranch), operationId: crypto.randomUUID() });
  }
  const custody = acquireSync(createLockScope('catchup-source'), 'dispatch-cwd', {
    fgosDir: path.join(options.trustedMain, '.fgos'), cwd: checkout,
  });
  if (custody.result !== 'acquired') {
    throw new MergeError(`cannot catch up "${ownBranch}": source checkout custody is held`, { branch: ownBranch, code: 'lock-held', lock: 'dispatch-cwd' });
  }
  const held = [custody.handle];
  const sync = createGitSync({ ...options, repoPath: checkout });
  const operationId = crypto.randomUUID();
  let prepared;
  try {
    // No destination slot is held here. Sync alone owns the source index/ref
    // under its verified checkout custody, and pins the observed target OID.
    prepared = sync.prepare({ operationId, target: pinned, message: `catch-up: merge ${target} into ${ownBranch}`, files: [...files.values()] }, held);
    if (prepared.state === 'conflicted-open') {
      const conflictedFiles = prepared.resolverGrant;
      sync.abort({ operationId }, held);
      return { outcome: 'conflict', conflictedFiles };
    }
    if (!['prepared', 'up-to-date'].includes(prepared.state)) {
      return { outcome: 'merge-refused', reason: `Sync preparation returned ${prepared.state}` };
    }
    provisionDependencies(checkout);
    runWorktreeSetupCommands(checkout, repoRoot);
    const check = await runGoalCheck(item, checkout, timeoutMs);
    if (!check.passed) {
      if (prepared.state === 'prepared') sync.abort({ operationId }, held);
      return { outcome: 'verify-fail', timedOut: check.timedOut, exitStatus: check.status, output: check.output };
    }
    if (prepared.state === 'prepared') {
      const finished = sync.continue({ operationId }, held);
      if (finished.state !== 'done') return { outcome: 'merge-refused', reason: `Sync continuation returned ${finished.state}` };
    }
    return { outcome: prepared.state === 'up-to-date' ? 'already-caught-up' : 'merged', catchupHead: resolveRefSha(checkout, 'HEAD'), output: check.output };
  } catch (err) {
    // Abort only the recorded owned operation. Native Sync preserves foreign
    // changes and refuses unknown effects; never fall through to raw abort.
    if (prepared?.state === 'prepared' || prepared?.state === 'conflicted-open') {
      try { sync.abort({ operationId }, held); }
      catch (abortError) { err.abortError = abortError; throw err; }
    }
    // The reason is Git's own refusal text when Git refused (G-067).
    const native = nativeError(err);
    const stderr = Buffer.from(native.stderr ?? []).toString('utf8').trim();
    return { outcome: 'merge-refused', reason: stderr || String(native.cause ?? err.message) };
  } finally {
    if (created) {
      try {
        const tip = resolveRefSha(checkout, 'HEAD');
        worktrees.remove({ path: checkout, expectedTip: tip, deliveredTo: resolveRefSha(repoRoot, ownBranch), evidenceDigest: crypto.createHash('sha256').update(JSON.stringify({ operationId, tip })).digest('hex'), operationId: crypto.randomUUID() }, held);
      } catch (err) {
        process.stderr.write(`fgos: catchup checkout retained at "${checkout}": ${err.message}\n`);
      }
    }
    custody.handle.release();
  }
}

const isFgosPath = (p) => p === '.fgos' || p.startsWith('.fgos/');

/** The bytes of each of `paths` at the commit or tree `revision`, or null
 * where the path is absent there, read through Inspect in bounded batches.
 * A path that cannot be read as a blob is an error, never an absence: a
 * declared candidate file must carry the exact bytes or nothing. */
function readPathsAt(repoRoot, revision, paths) {
  const found = new Map();
  for (let at = 0; at < paths.length; at += 4096) {
    const batch = paths.slice(at, at + 4096);
    const reads = inspectGit(repoRoot).pathsAtRevision({ revision, paths: batch.map((p) => [...Buffer.from(p)]), maxBlobBytes: 32 * 1024 * 1024 });
    for (const { path: rawPath, value } of reads) {
      const relPath = Buffer.from(rawPath).toString('utf8');
      if (value.kind === 'present') found.set(relPath, Buffer.from(value.bytes));
      else if (value.kind === 'absent') found.set(relPath, null);
      else throw new MergeError(`reading "${relPath}" at ${revision} failed: ${value.kind}`);
    }
  }
  return found;
}

/** Inspect's `mergeTree` of `source` onto `target` (two exact OIDs): the
 * merged tree and the paths it left conflicted. */
function readMergeTree(repoRoot, target, source) {
  let fact;
  try {
    fact = inspectGit(repoRoot).mergeTree({ target, source });
  } catch (err) {
    throw new MergeError(`reading the merge of ${source} onto ${target} failed: ${err.message}`);
  }
  return { tree: fact.tree, conflictedPaths: fact.conflictedPaths.map(p => Buffer.from(p).toString('utf8')) };
}

/** The `.fgos` paths whose bytes differ between two trees (or commits). */
const changedStorePaths = (repoRoot, before, after) => diffPaths(inspectGit(repoRoot), before, after, { prefix: '.fgos' });

/** Which of `paths` carry `merge=union` in `target`'s attributes. */
function unionPathsAt(repoRoot, target, paths) {
  if (paths.length === 0) return new Set();
  const facts = inspectGit(repoRoot).attributes({ revision: target, attribute: 'merge', paths: paths.map(p => [...Buffer.from(p)]) });
  return new Set(facts.filter(f => f.value === 'union').map(f => Buffer.from(f.path).toString('utf8')));
}

/**
 * The one fgOS store rule for a merge of `source` onto `target` (ADR0020: a
 * worker branch never owns `.fgos`), shared by Land candidates and Sync
 * catchup. Every conflicted `merge=union` `.fgos` path in `conflictedPaths`,
 * and every `.fgos` path the merged `tree` changes against `target` that the
 * branch did not write since its take point (or that is `merge=union`),
 * keeps the target's bytes (or its absence), declared into `files`. Returns
 * the conflicted `.fgos` paths it could not resolve and the changed ones the
 * branch really wrote; the caller decides what those mean.
 */
function declareStoreFiles(repoRoot, item, { target, source, tree, conflictedPaths }, files) {
  const declare = (relPath, bytes) => files.set(relPath, { path: relPath, bytes: bytes === null ? null : [...bytes] });
  const conflictedUnion = unionPathsAt(repoRoot, target, conflictedPaths.filter(isFgosPath));
  const unresolved = conflictedPaths.filter((p) => !conflictedUnion.has(p));
  const resolvable = conflictedPaths.filter((p) => !unresolved.includes(p));
  const kept = readPathsAt(repoRoot, target, resolvable);
  for (const p of resolvable) declare(p, kept.get(p));
  const takenAt = item.lastAttempt?.branchHeadAtTake ?? item.branchHeadAtTake;
  const changed = changedStorePaths(repoRoot, target, tree).filter((p) => !files.has(p) && !conflictedPaths.includes(p));
  const keptBytes = readPathsAt(repoRoot, target, changed);
  // A path the branch did not change since its take point is inherited
  // staleness, never the worker's own write: same bytes (or absence) at both.
  let atTake = null;
  let atSource = null;
  if (takenAt && changed.length > 0) {
    try {
      atTake = readPathsAt(repoRoot, takenAt, changed);
      atSource = readPathsAt(repoRoot, source, changed);
    } catch {
      atTake = null; // an unreadable take point proves nothing unchanged
    }
  }
  const sameBytes = (a, b) => (a === null || b === null ? a === b : a.equals(b));
  const union = unionPathsAt(repoRoot, target, changed);
  const written = [];
  for (const p of changed) {
    const unchangedOnBranch = atTake !== null && sameBytes(atTake.get(p), atSource.get(p));
    const kept = keptBytes.get(p);
    if (kept !== null && (unchangedOnBranch || union.has(p))) declare(p, kept);
    else if (kept === null && unchangedOnBranch) declare(p, null);
    else written.push(p);
  }
  return { unresolved, written };
}

/**
 * The trusted-side resolutions a Land candidate of `source` onto `target`
 * needs, as declared candidate files, read from a read-only
 * `git merge-tree` of the two exact OIDs: a decision-id collision on the
 * decision index is renumbered and unioned, and the store rule
 * (`declareStoreFiles`) keeps the target's `.fgos` bytes. Anything else
 * returns the outcome the merge verbs already report: `conflict`, or
 * `fgos-write-rejected` with the paths a branch tried to write under `.fgos`.
 */
export function declareLandFiles(repoRoot, item, target, source) {
  const { tree, conflictedPaths } = readMergeTree(repoRoot, target, source);
  const files = new Map();
  const declare = (relPath, bytes) => files.set(relPath, { path: relPath, bytes: bytes === null ? null : [...bytes] });
  let selfResolved = false;
  if (conflictedPaths.length === 1 && conflictedPaths[0] === DECISION_INDEX_PATH) {
    const classification = classifyDecisionIndexText(readPathsAt(repoRoot, tree, [DECISION_INDEX_PATH]).get(DECISION_INDEX_PATH)?.toString('utf8') ?? '');
    if (!classification) return { outcome: 'conflict' };
    const port = inspectGit(repoRoot);
    const targetFiles = new Set(treePaths(port, target, 'docs/decisions/'));
    const sourceFiles = treePaths(port, source, 'docs/decisions/');
    const idRenames = new Map();
    let nextId = nextFreeDecisionId(repoRoot, [target, source]);
    for (const oldId of classification.collidingIds) {
      const oldPath = sourceFiles.find((f) => f.match(DECISION_FILE_RE)?.[1] === oldId && !targetFiles.has(f));
      if (!oldPath) return { outcome: 'conflict' };
      const newPath = `docs/decisions/${nextId}-${oldPath.match(DECISION_FILE_RE)[2]}.md`;
      declare(oldPath, null);
      declare(newPath, Buffer.from(renumberDecisionText(readPathsAt(repoRoot, source, [oldPath]).get(oldPath).toString('utf8'), oldId, nextId)));
      idRenames.set(oldId, { newId: nextId, newPath });
      nextId = String(parseInt(nextId, 10) + 1).padStart(4, '0');
    }
    declare(DECISION_INDEX_PATH, Buffer.from(rebuildDecisionIndex(classification, idRenames)));
    selfResolved = true;
  }
  const { unresolved, written: rejected } = declareStoreFiles(repoRoot, item, {
    target, source, tree, conflictedPaths: selfResolved ? [] : conflictedPaths,
  }, files);
  if (unresolved.length > 0) return { outcome: 'conflict' };
  if (rejected.length > 0) return { outcome: 'fgos-write-rejected', paths: rejected, ...(selfResolved && { selfResolved }) };
  return { files: [...files.values()], selfResolved };
}

/**
 * Land `item`'s branch on its target through the native Land transaction,
 * the one publisher of every runner merge: root into the trunk, leaf into
 * `fgw/<root>`, a nested root into its parent, a promoted member into its
 * integration branch. Land's session on the destination's full-ref slot,
 * not a caller-held slot, excludes other merges into that target through
 * candidate construction, verification and publication. Work's own event
 * files are committed through its declared checkpoint and its project stream
 * is sealed before Land starts; nothing is swept into the land. After
 * publication Work promotes the branch's event stream and reports the result
 * as `promotion` on the merged outcome. A stale publication is returned once, and
 * Work owns settlement; publication authorizes no candidate cleanup.
 */
export async function landRunnerItem(repoRoot, item, {
  branch = branchNameFor(item.id),
  target = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot),
  timeoutMs,
  lockWaitMs = DEFAULT_LOCK_WAIT_MS,
  ownFileSet = null,
  operationId = crypto.randomUUID(),
} = {}) {
  const destination = `refs/heads/${target}`;
  const fgosDir = path.join(repoRoot, '.fgos');
  const mergeSlot = ['merge-slot', { fgosDir, ref: encodeURIComponent(destination) }, `merge slot of "${destination}"`];
  const lockHeld = ([lock, params, label]) => {
    const listed = lockHolders(lock, params);
    const holders = listed.kind === 'list' ? listed.holders.map((h) => h.pid) : [];
    return new MergeError(`cannot merge "${branch}" into "${target}": ${label} is held by another process${holders.length ? ` (pid ${holders.join(', ')})` : ''}.`, {
      branch, targetRef: target, code: 'lock-held', holders, lock,
    });
  };
  // No-wait refuses a held slot before any read; Land's own try stays the decision.
  if (lockWaitMs === 0 && probe(mergeSlot[0], mergeSlot[1]).result === 'held') throw lockHeld(mergeSlot);
  // Only a destination the main checkout holds involves its index at all.
  const onMain = checkedOutRef(repoRoot) === destination;
  if (onMain && mergeHeadExists(repoRoot)) return { outcome: 'merge-blocked-other-item', branch };
  // Without the lock wait, no-wait still refuses in milliseconds when the
  // main checkout Land would publish into is busy, instead of after a full
  // verify that cannot publish.
  if (onMain && lockWaitMs === 0) {
    try {
      await withMainCheckout(new LockScope('land-runner-item'), 'precheck', () => {}, { fgosDir });
    } catch (err) {
      throw toMergeLockError(err, { branch });
    }
  }
  sealProjectBeforeLand(fgosDir, branch);
  // Trusted-side resolutions are bytes bound to the target they were read
  // against; only then is that target pinned, otherwise Land pins its own.
  const pinned = resolveRefSha(repoRoot, target);
  const source = resolveRefSha(repoRoot, branch);
  const declared = declareLandFiles(repoRoot, item, pinned, source);
  if (declared.outcome) return { ...declared, branch };
  const { files, selfResolved } = declared;
  // Read the paths this branch brings before it lands: afterwards the target
  // contains it and the diff that names them is empty (tsk-2ypd).
  const landedFiles = changedFiles(repoRoot, item, { trunk: target });
  const options = gitPortOptions(repoRoot, { mutation: true });
  const port = createGitLand(options);
  // A result that published nothing carries the `abandoned` settlement, so
  // its candidate is released like a delivered one once Work durably records
  // that result (Git spec §9, M4).
  const settled = (result, settlementKind = 'abandoned') => {
    const landSettlement = landSettlementFor(options, operationId, settlementKind);
    return landSettlement ? { ...result, landSettlement } : result;
  };
  let phase = 'prepare';
  const result = await (async () => { try {
    const { candidate, receipt: previous } = await port.prepare({
      operationId,
      waitMs: lockWaitMs,
      request: {
        source,
        ...(files.length > 0 && { target: pinned }),
        destination,
        message: `merge ${branch} into ${target}`,
        squash: false,
        footprint: ownFileSet ? [...ownFileSet] : null,
        subtree: null,
        files,
      },
    });
    if (previous) {
      return settled({ outcome: 'merged', branch,
        check: { passed: true, status: 0, timedOut: false, skipped: true, output: `publication already verified and recorded by Land operation ${operationId}; awaiting Work settlement` },
        receipt: previous }, 'delivered');
    }
    // Eligibility still belongs to Work, decided against the exact source and
    // target Land pinned for this candidate, never a target read before it.
    const skipRedundantChecks = mergedTreeAlreadyVerified(repoRoot, item, candidate.source, candidate.target);
    let check;
    if (!skipRedundantChecks) {
      try {
        provisionDependencies(candidate.worktree);
        runWorktreeSetupCommands(candidate.worktree, repoRoot);
      } catch (err) {
        return settled({ outcome: 'verify-fail', branch, check: { passed: false, status: 1, timedOut: false, output: err.message } });
      }
      check = await runGoalCheck(item, candidate.worktree, timeoutMs);
      if (check.passed) {
        // The repo-invariant gate runs on the exact tree about to land.
        const invariant = await runInvariantChecks(readInvariantCheckCommands(repoRoot), candidate.worktree, timeoutMs);
        if (!invariant.passed) return settled({ outcome: 'verify-fail', branch, check: invariantFailureAsCheck(invariant), ...(selfResolved && { selfResolved }) });
      }
    } else {
      check = {
        passed: true, status: 0, timedOut: false, skipped: true,
        output: `verify skipped: the merged tree is identical to ${item.branchHeadAtReturn}, already verified green at return (${target} is an ancestor of "${branch}" or advanced only on paths it never touched, and the branch tip has not moved since)`,
      };
    }
    if (!check.passed) return settled({ outcome: 'verify-fail', branch, check, ...(selfResolved && { selfResolved }) });
    phase = 'publish';
    const receipt = await port.publish({
      source: candidate.source, target: candidate.target,
      candidate: candidate.candidate, treeDigest: candidate.treeDigest,
      evidenceDigest: crypto.createHash('sha256').update(JSON.stringify({ item: item.id, check })).digest('hex'),
    }, { waitMs: lockWaitMs });
    return settled({ outcome: 'merged', branch, check, receipt, ...(selfResolved && { selfResolved }) }, 'delivered');
  } catch (err) {
    let detail;
    try { detail = JSON.parse(err.message); } catch { detail = {}; }
    const cause = detail.cause;
    if (cause === 'land-already-merged' || cause === 'land-identical-tips') {
      // A prior run landed this branch and stopped before Work recorded it.
      // Bare ancestry is not proof the content is there (tsk-15k), and every
      // 'merged' outcome still carries a fresh verify of the target's tree.
      const mismatchedPaths = branchContentMismatch(repoRoot, branch, target);
      if (mismatchedPaths.length) return { outcome: 'verify-fail', branch, check: { passed: false, status: null, output: `integrity check failed: "${branch}" is an ancestor of ${target} but its own content is not reflected there for: ${mismatchedPaths.join(', ')} — a prior merge likely discarded this branch's changes (e.g. a manually-resolved "git merge -s ours") while still recording it as a parent` } };
      const verified = await withTargetCheckout(repoRoot, target, onMain, async (tree) => {
        const check = await runGoalCheck(item, tree, timeoutMs);
        if (!check.passed) return { outcome: 'verify-fail', branch, check };
        const invariant = await runInvariantChecks(readInvariantCheckCommands(repoRoot), tree, timeoutMs);
        if (!invariant.passed) return { outcome: 'verify-fail', branch, check: invariantFailureAsCheck(invariant) };
        return { outcome: 'merged', branch, check };
      });
      return verified;
    }
    if (cause === 'land-conflict-aborted') return settled({ outcome: 'conflict', branch });
    if (cause === 'main-checkout-dirty-mid-merge') return settled({ outcome: cause, branch });
    if (cause === 'foreign-target-checkout') {
      throw new MergeError(`cannot merge "${branch}" into "${target}": "${target}" is checked out in another worktree, and Land never moves a branch behind another index. Finish or remove that checkout, then retry.`, {
        branch, targetRef: target, code: cause,
      });
    }
    if (typeof cause === 'string' && cause.startsWith('lock-acquire-unavailable')) {
      // Land waits for its own full-ref slot at prepare and for main at publish.
      throw lockHeld(phase === 'prepare' ? mergeSlot : ['main-checkout', { fgosDir }, 'main checkout (land)']);
    }
    // Preserve Land's stale result, including operation identity and recovery
    // evidence. Never re-run verification or CAS against a different target.
    if (detail.errorClass === 'stale' || cause === 'land-target-changed' || cause === 'land-cas-lost') throw err;
    // A publication whose effect is unknown is never claimed abandoned: no
    // Work result is recorded, the candidate stays, and Land recovery
    // decides what happened before this id is published again.
    if (phase === 'publish') {
      throw new MergeError(`cannot tell whether "${branch}" was published into "${target}": Land operation ${operationId} failed during publication (${err.message}). Run \`fgos doctor --fix\` (git-land-recovery) to settle it, then approve again.`, {
        branch, targetRef: target, code: 'land-effect-unknown', operationId,
      });
    }
    return settled({
      outcome: 'merge-failed-unclassified', branch,
      error: { message: err.message, stderr: err.stderr ?? null, status: err.status ?? null },
    });
  } finally {
    port.close();
  } })();
  if (result.outcome !== 'merged') return result;
  // Promotion and drift detection run after publication, outside the
  // publication's error handling: neither failure turns a land into a failed
  // merge.
  const promotion = promoteAfterLand(fgosDir, branch);
  let postLand;
  try {
    postLand = detectPostLandDrift(repoRoot, listWork(fgosDir), item, { target, landedFiles, sessions: listSessions(repoRoot) });
  } catch (err) {
    postLand = { landed: item.id, target, landedFiles, error: `post-land drift detection failed: ${err.message}` };
  }
  return { ...result, promotion, postLand };
}

/**
 * Work's seal-before-land policy (Event Store spec §16): everything Work has
 * acknowledged is on the project ref before this land can publish anything,
 * and the promotion that follows always has a published project to follow.
 * Nothing is published yet, so a store that cannot seal refuses the land.
 */
function sealProjectBeforeLand(fgosDir, branch) {
  try {
    prepareWorkStore(fgosDir, fgosDir).store.seal('project', []);
  } catch (err) {
    throw new MergeError(`cannot merge "${branch}": sealing Work's events before the land failed (${err.message})`, {
      branch, code: 'event-seal-failed',
    });
  }
}

/**
 * Promote the landed branch's event stream into the project once the land is
 * published. The land already happened, so a failure here is a recorded
 * result, never a throw: `{ stream, error, retryable: true }` rides on the
 * `merged` outcome, and the same call is safe to repeat (a stream the project
 * already names is left alone).
 */
export function promoteAfterLand(fgosDir, branch) {
  let stream = null;
  try {
    stream = `branch:${branchKey(branch)}`;
    const { store } = prepareWorkStore(fgosDir, fgosDir);
    const promoted = promoteLandedStreams(store, stream, String(resolveWriterIdentity(fgosDir).id), []);
    return { stream, promoted: promoted.length > 0 };
  } catch (err) {
    return { stream, error: { code: err.code ?? null, message: err.message }, retryable: true };
  }
}

/** Work owns promotion policy; Git Land knows nothing about event streams.
 * `stream` is the branch stream's name (`branch:<branchKey>`); the stream is
 * promoted through its last own event unless the project already names it. */
export function promoteLandedStreams(store, stream, writer, heldRanks) {
  if (!store.maintenance(heldRanks).streams.some((row) => row.stream === stream)) return [];
  const read = store.read({ streams: ['project', stream], project: false }, heldRanks);
  const throughSeq = Math.max(0, ...read.events.filter((event) => event.stream === stream && event.origin === store.ownOrigin).map((event) => event.seq));
  if (!throughSeq || read.events.some((event) => event.type === 'store.promote' && event.payload?.stream === stream && event.payload.throughSeq >= throughSeq)) return [];
  return [store.promote({ branch: stream, throughSeq, cursor: read.cursor.cover, writer }, heldRanks)];
}

/** Work's unique settlement identity `(repoIdentity, operationId,
 * settlementKind)` for a Land operation (Git spec §9 step 6, M4), or null
 * when Land journalled nothing under `operationId`: then there is no
 * candidate to release, and an unreadable journal keeps whatever it holds. */
function landSettlementFor(options, operationId, settlementKind) {
  let operation;
  try {
    operation = createGitRecovery(options).inspectOperation({ operationId });
  } catch {
    return null;
  }
  return { repoIdentity: operation.repoIdentity, operationId, settlementKind };
}

/**
 * Release a Land operation's candidate, pins and journal once Work has
 * durably recorded its result, delivered or abandoned (Git spec §9 cleanup
 * admission, M4): `acknowledgement` names that durable record. Cleanup
 * never negates the result, so a failure comes back as a warning, and Land
 * itself retains whatever it cannot prove safe to remove.
 */
export function acknowledgeLand(repoRoot, operationId, acknowledgement) {
  let port;
  try {
    port = createGitLand(gitPortOptions(repoRoot, { mutation: true }));
    return port.recover({ operationId, consumerAcknowledgement: acknowledgement }).warnings;
  } catch (err) {
    return [`land-cleanup-deferred: ${err.message}`];
  } finally {
    port?.close();
  }
}

/**
 * The acknowledgement Land stores for a result Work recorded in `event`: the
 * event's own hash. The hash covers the event's origin and sequence, so two
 * machines that each recorded their own result for the same item name
 * different acknowledgements. An event without a hash (a legacy record) names
 * nothing durable: the empty value is refused by Land, which keeps the candidate.
 */
export function landAcknowledgement(event) {
  return typeof event?.h === 'string' && event.h ? `work-event:${event.h}` : '';
}

/** The Land operations whose result `payload` records: a delivery's settlement identity, or the
 * `landOperationIds` that a blocked move or an engine decision carries. A decision that only
 * prepares an operation (`landOperation`) records no result and names nothing here. */
function settledLandOperations(payload) {
  return [payload?.landSettlement?.operationId, ...(Array.isArray(payload?.landOperationIds) ? payload.landOperationIds : [])]
    .filter((id) => typeof id === 'string' && id.length > 0);
}

// Retained Land operations one sweep looks at before it reports an incomplete scan.
const RETAINED_LAND_SCAN_BOUND = 10_000;

/**
 * Release every retained Land candidate whose result Work has durably
 * recorded, however late: a release that was deferred (busy merge slot or
 * main checkout) or a command that died between recording and releasing.
 * The Work event that recorded the operation (matched on its operation id)
 * supplies the acknowledgement; a candidate with no such event stays,
 * because the acknowledgement is never guessed. Nothing throws: what cannot
 * be listed, read or released comes back in `warnings`, and Land itself
 * keeps whatever it cannot prove safe to remove.
 *
 * Reading Work's history costs a full read, so it happens only when Land
 * reports at least one retained candidate.
 *
 * @returns {{released: string[], warnings: string[]}}
 */
export function releaseRecordedLand(repoRoot) {
  const released = [];
  const warnings = [];
  let candidates;
  try {
    const scan = createGitRecovery(gitPortOptions(repoRoot, { mutation: true })).listRetainedLand({ bound: RETAINED_LAND_SCAN_BOUND });
    candidates = scan.candidates;
    if (!scan.complete) warnings.push(`land-release-incomplete-scan: more than ${RETAINED_LAND_SCAN_BOUND} Land operations; some candidates were not looked at`);
  } catch (err) {
    return { released, warnings: [`land-release-skipped: ${err.message}`] };
  }
  if (candidates.length === 0) return { released, warnings };
  const recordedBy = new Map();
  try {
    for (const event of readRawEvents(path.join(repoRoot, '.fgos'))) {
      if (typeof event?.h !== 'string' || !event.h) continue;
      for (const operationId of settledLandOperations(event.payload)) if (!recordedBy.has(operationId)) recordedBy.set(operationId, event);
    }
  } catch (err) {
    return { released, warnings: [...warnings, `land-release-skipped: reading Work's history failed (${err.message})`] };
  }
  for (const { operationId } of candidates) {
    const event = recordedBy.get(operationId);
    if (!event) continue;
    const failed = acknowledgeLand(repoRoot, operationId, landAcknowledgement(event));
    if (failed.length === 0) released.push(operationId);
    else warnings.push(...failed.map((warning) => `${operationId}: ${warning}`));
  }
  return { released, warnings };
}

/** The ref the main checkout has checked out, or null when it is detached. */
function checkedOutRef(repoRoot) {
  const main = realpathOrSelf(repoRoot);
  return gitWorktrees(repoRoot).find((row) => realpathOrSelf(Buffer.from(row.path).toString('utf8')) === main)?.branch ?? null;
}

/**
 * Run `fn` on a tree holding `target`'s tip: the main checkout itself when it
 * has the target checked out, otherwise a disposable detached checkout made
 * (and provisioned like a Land candidate) and removed through the Worktree
 * port.
 */
async function withTargetCheckout(repoRoot, target, onMain, fn) {
  if (onMain) return fn(repoRoot);
  const checkout = createVerifyCheckout(repoRoot, resolveRefSha(repoRoot, target));
  try {
    return await fn(checkout);
  } finally {
    try { removeWorktree(repoRoot, checkout, { force: true }); }
    catch (err) { process.stderr.write(`fgos: verification checkout retained at "${checkout}": ${err.message}\n`); }
  }
}
