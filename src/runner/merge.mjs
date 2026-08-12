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
// MERGE MECHANICS (spike-proven, .bee/spikes/pr-lifecycle, see
// docs/history/pr-lifecycle/reports/validation-s1-gate.md): `git merge
// --no-commit --no-ff <branch>` stages the merge without committing; a
// conflict is reported by a nonzero exit and undone with `git merge
// --abort`, restoring the tree byte-for-byte (spike "merge-abort-probe").
// When the merge stages cleanly, the item's OWN verify runs on the now-
// staged, still-uncommitted tree (goal-check.mjs, D3's "merge sạch" second
// clause) BEFORE any commit is made (spike "nocommit-probe"); a red verify
// is undone the exact same way, `git merge --abort` — main never holds a
// broken merge commit, on any exit path. Only "pull"/"legacy" items skip the
// merge step entirely: their code is already on main (D4), so approve only
// re-runs their verify directly against the current tree.
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

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { branchNameFor, branchExists, reclaimOrphanedCheckout } from './worktree.mjs';
import { runGoalCheck, runInvariantChecks, invariantFailureAsCheck } from './goal-check.mjs';
import { readInvariantCheckCommands } from '../config/shared-config-file.mjs';
import { normalizePath } from './frozen-judge.mjs';
import { acquireMainCheckoutLock, renewMainCheckoutLockIfOwn, HELD, AMBIGUOUS, DEFAULT_TTL_MS, formatLockDurationMs } from './main-checkout-lock.mjs';
import { resolveWriterIdentity } from './session-identity.mjs';
import { listSessions } from './session.mjs';
import { listWork } from '../state/store.mjs';
import { openLeavesSharingTarget, classifyPostLandDrift } from '../state/graph-harness.mjs';

/** Raised only for a genuinely unexpected git failure (e.g. `git merge
 * --abort` itself failing) — never for a conflict or a red verify, which are
 * defined outcomes returned normally (see mergeRunnerItem below). */
export class MergeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MergeError';
    this.errorClass = 'merge-fail';
    this.category = 'merge-fail';
    Object.assign(this, details);
  }
}

// stdio: pipe (tsk-56t): explicit, not execFileSync's own default — without
// it, a failing git call (e.g. "not a git repository" from a non-git cwd)
// prints straight through to this process's real stderr in addition to
// landing on the thrown error's own `.stderr`/`.message`, which every caller
// here already reads instead. Found via isMainWorktree(process.cwd()) newly
// reachable from a plain non-git dir (tsk-56t D2's read-verb warning) —
// no caller's behavior changes, since none relied on the live leak.
//
// maxBuffer (tsk-648): optional, default undefined — Node's own 1 MiB
// default applies exactly as before when omitted, so every existing call
// site (none of which passes it) stays byte-identical. Only reviewDiff's
// two full-diff calls below pass an explicit, larger value: a full `git
// diff` (unlike every `--name-only` call in this file) can exceed 1 MiB
// once a branch is hundreds of commits stale, which throws ENOBUFS.
function git(repoRoot, args, { maxBuffer } = {}) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...(maxBuffer === undefined ? {} : { maxBuffer }),
  });
}

// reviewDiff's own ceiling for a full (non-`--name-only`) diff — generous
// on purpose: a local git subprocess call isn't memory-constrained the way
// a network payload is, and a text diff this large from a normal repo is
// already an outlier. Callers can still override it via opts.maxBuffer
// (e.g. a test proving the ENOBUFS-diagnosis path deterministically,
// without needing an actually-hundreds-of-commits-stale diff).
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
  if (err.code === 'ENOBUFS') {
    return (
      `${label} exceeds the ${DIFF_MAX_BUFFER}-byte diff limit — ` +
      'the branch is likely very stale relative to its merge target (many commits behind); ' +
      'sync/rebase it before reviewing.'
    );
  }
  return `computing ${label} failed: ${err.message}`;
}

/** Resolve `repoRoot`'s trunk branch name without assuming `'main'`: prefers
 * the remote `origin/HEAD` target (what the repo host itself calls its
 * default branch), then falls back to whichever of `main`/`master` exists
 * locally as a branch, then to the literal `'main'` when neither signal is
 * available (e.g. a brand-new repo with no commits yet on either name). */
export function detectTrunk(repoRoot) {
  try {
    const ref = git(repoRoot, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).trim();
    if (ref.startsWith('origin/')) {
      return ref.slice('origin/'.length);
    }
  } catch {
    // no origin remote, or origin/HEAD isn't set locally — fall through
  }

  for (const candidate of ['main', 'master']) {
    try {
      git(repoRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${candidate}`]);
      return candidate;
    } catch {
      // candidate branch doesn't exist locally — try the next one
    }
  }

  return 'main';
}

/** Whether every path on a `git status --porcelain` line sits inside
 * `.fgos/` — exported so bin/fgos.mjs's own working-tree-clean check
 * (`return`'s pull-door gate) can apply the identical exclusion instead of
 * re-deriving the porcelain-parsing rule.
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
 * as blocking: `null` (the default, every existing caller) keeps this line
 * blocking exactly like before — the fail-safe direction. When a `Set` is
 * given, a non-`.fgos/` path also counts as ignorable when it is outside
 * that set — an unrelated dirty/untracked file (a different session's work,
 * or anything not in the item's own committed-diff-plus-footprint scope)
 * never blocks `return`/`approve` again; a path that IS in the set still
 * blocks, whether that is a real re-dirtied conflict (D2) or the item's own
 * not-yet-committed work inside a declared `footprint` (D3). */
export function isFgosOnlyStatusLine(line, prefix = '', ownFileSet = null) {
  const pathPart = line.slice(3);
  const paths = pathPart.includes(' -> ') ? pathPart.split(' -> ') : [pathPart];
  const fgosPath = `${prefix}.fgos`;
  const fgosDirPrefix = `${prefix}.fgos/`;
  const isFgosPath = (p) => p === fgosPath || p.startsWith(fgosDirPrefix);
  if (paths.every(isFgosPath)) {
    return true;
  }
  return ownFileSet !== null && paths.every((p) => isFgosPath(p) || !ownFileSet.has(p));
}

/** Build the `ownFileSet` `isFgosOnlyStatusLine`/`isWorkingTreeClean` take
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
 * excluded: it's a live store with its own write door, mutated by the very
 * take/return/approve lifecycle operations this gate guards (each appends an
 * event as part of the same call), so it never signals an actually-dirty
 * code tree — only a manual `.fgos/events.jsonl` commit made that true
 * before this exclusion existed.
 *
 * `scope` picks git's own pathspec: `'whole-repo'` (the default) runs `git
 * status --porcelain` with no pathspec — `approve` is expected to see the
 * entire main tree's cleanliness, not just its own subtree. `'subtree'` runs
 * `git status --porcelain -- .` instead, scoping the scan to `repoRoot`'s
 * own subtree — `return`'s per-item gate, where an unrelated uncommitted
 * file elsewhere in the repo must never block returning THIS item.
 *
 * Either way `repoRoot` is not guaranteed to be the git top-level
 * (`isMainWorktree` above tolerates a subdirectory of the main worktree;
 * `return`'s cwd is the item's own working directory, same reasoning), and
 * either way git still reports paths top-level-relative — verified
 * empirically for both pathspec forms — so the `.fgos/` exclusion needs the
 * same top-level-relative prefix `isFgosOnlyStatusLine` takes, computed here
 * via `git rev-parse --show-prefix` regardless of scope.
 *
 * `ownFileSet` (tsk-598, D2/D3) is threaded straight through to
 * `isFgosOnlyStatusLine` — omitted (`null`, the default), every existing
 * caller keeps today's exact whole-tree-blocks-on-anything behavior. */
export function isWorkingTreeClean(repoRoot, ownFileSet = null, { scope = 'whole-repo' } = {}) {
  const prefix = git(repoRoot, ['rev-parse', '--show-prefix']).trim();
  const statusArgs = scope === 'subtree' ? ['status', '--porcelain', '--', '.'] : ['status', '--porcelain'];
  return git(repoRoot, statusArgs)
    .split('\n')
    .filter((line) => line.trim() !== '')
    .every((line) => isFgosOnlyStatusLine(line, prefix, ownFileSet));
}

function realpathOrSelf(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/**
 * Whether `repoRoot` IS the repo's main working tree — never a linked
 * worktree, registered through `fgos session start` (session.mjs) or ad-hoc
 * (a plain `git worktree add` run by hand, invisible to `sessions.json`).
 * `approve`'s registry-based guard only ever caught the registered case; an
 * ad-hoc worktree slipped through the exact same risk untouched — a merge
 * landing on that worktree's own checkout, or a goal-check verifying its own
 * (possibly stale/divergent) tree, while the item is still reported "done" /
 * "verified on main" (P44).
 *
 * The check is structural, not registry-based, so it catches both: a main
 * worktree's git-common-dir sits directly inside its own toplevel (its
 * parent IS the toplevel); a linked worktree's common-dir resolves to the
 * MAIN repo's `.git`, whose parent is the main repo root — never the linked
 * worktree's own toplevel.
 *
 * A `repoRoot` that is not a git repository at all (legacy-item tests, or a
 * plain directory `approve` is otherwise happy to degrade against) has no
 * worktree concept to violate — trivially "main", fail-open, matching how
 * every other legacy-source path in `approve` already tolerates a non-git
 * cwd.
 */
export function isMainWorktree(repoRoot) {
  let toplevelRaw;
  try {
    toplevelRaw = git(repoRoot, ['rev-parse', '--show-toplevel']).trim();
  } catch {
    return true;
  }
  const toplevel = realpathOrSelf(toplevelRaw);
  const commonDirRaw = git(repoRoot, ['rev-parse', '--git-common-dir']).trim();
  const commonDirAbs = path.isAbsolute(commonDirRaw) ? commonDirRaw : path.resolve(repoRoot, commonDirRaw);
  const commonDirParent = realpathOrSelf(path.dirname(commonDirAbs));
  return toplevel === commonDirParent;
}

/** Classify a proposed `item` into its diff/merge source (see module doc). */
export function classifySource(repoRoot, item) {
  if (branchExists(repoRoot, branchNameFor(item.id))) {
    return 'runner';
  }
  if (typeof item.headAtTake === 'string' && item.headAtTake && typeof item.headAtReturn === 'string' && item.headAtReturn) {
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
      diff = git(repoRoot, ['diff', `${trunk}...${branch}`], { maxBuffer });
    } catch (err) {
      throw new MergeError(diffFailureMessage(`diff for branch "${branch}"`, err), { branch });
    }
    return { source, diff, warnings: [] };
  }

  if (source === 'pull') {
    const range = `${item.headAtTake}..${item.headAtReturn}`;
    let diff;
    let commitCount;
    try {
      diff = git(repoRoot, ['diff', range], { maxBuffer });
      commitCount = parseInt(git(repoRoot, ['rev-list', '--count', range]).trim(), 10) || 0;
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
  let out;
  try {
    out = git(repoRoot, ['diff', '--name-only', `${trunk}...${branch}`]);
  } catch (err) {
    throw new MergeError(`computing changed files for branch "${branch}" failed: ${err.message}`, { branch });
  }
  return out.split('\n').filter((line) => line !== '');
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
 * Classify whether `repoRoot`'s currently-conflicted merge (mid `git merge
 * --no-commit --no-ff`, called only from the conflict branch below) is a
 * self-resolvable decision-ID collision. Requires: the ONLY conflicted path
 * is `docs/decisions/0000-index.md` (any other conflicted path, or more
 * than one, is never this shape), and every conflict hunk in it is a pure
 * two-sided row INSERTION -- both `oursLines` and `theirsLines` are
 * non-empty, share no identical line (a same-row edit reads as one side
 * repeating what the other kept, which this never treats as a safe
 * insertion), and every line on both sides matches the index's own `|
 * [NNNN](file.md) | ... |` row shape. Returns `null` for anything else --
 * a real content dispute, a non-index conflict, or a hunk this classifier
 * cannot confidently read as "two independent new rows" -- so the caller's
 * only choice on `null` is the pre-existing abort-and-report path.
 */
export function classifyDecisionIndexCollision(repoRoot) {
  const paths = git(repoRoot, ['diff', '--name-only', '--diff-filter=U'])
    .split('\n').filter(Boolean);
  if (paths.length !== 1 || paths[0] !== DECISION_INDEX_PATH) {
    return null;
  }
  const raw = fs.readFileSync(path.join(repoRoot, DECISION_INDEX_PATH), 'utf8');
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
 * `ref`'s `docs/decisions/` (the index file itself, id "0000", excluded --
 * it is the index, never a decision record). Mirrors the how-to's own "read
 * the highest existing number on disk and add one" rule, just against
 * `ref` (always `HEAD`/main here, per this function's only caller) instead
 * of a person reading it by hand. */
export function nextFreeDecisionId(repoRoot, ref) {
  const files = git(repoRoot, ['ls-tree', '-r', '--name-only', ref, '--', 'docs/decisions/'])
    .split('\n').filter(Boolean);
  let max = 0;
  for (const f of files) {
    const m = f.match(DECISION_FILE_RE);
    if (m && m[1] !== '0000') {
      max = Math.max(max, parseInt(m[1], 10));
    }
  }
  return String(max + 1).padStart(4, '0');
}

/** Rename `branch`'s colliding decision file from `oldId` to `newId` on
 * disk (`git mv`, so the rename lands staged in the in-progress merge) and
 * rewrite its own frontmatter `title:` line and its `# NNNN — ...` heading
 * line to cite `newId` instead -- the two mechanical, always-present
 * self-references every decision doc carries (confirmed against this
 * repo's own decision docs' template). A `supersedes`/`superseded_by`
 * cross-reference to a DIFFERENT decision's id is deliberately left
 * untouched (it names another doc, not this one) -- and free-text prose
 * that happens to cite the doc's own old number by hand is a documented,
 * illustrative-not-exhaustive residual limitation here, the same honest
 * "MINH HỌA, không đóng khung" stance `iron-law.mjs`'s own module list
 * already takes, not a silent gap. */
export function renumberDecisionFile(repoRoot, oldPath, newId) {
  const m = oldPath.match(DECISION_FILE_RE);
  if (!m) {
    throw new MergeError(`renumberDecisionFile: "${oldPath}" is not a docs/decisions/NNNN-slug.md path`, { oldPath });
  }
  const [, oldId, slug] = m;
  const newPath = `docs/decisions/${newId}-${slug}.md`;
  git(repoRoot, ['mv', oldPath, newPath]);
  const abs = path.join(repoRoot, newPath);
  const oldIdRe = new RegExp(`\\b${oldId}\\b`);
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
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
  fs.writeFileSync(abs, lines.join('\n'));
  git(repoRoot, ['add', newPath]);
  return { oldId, newId, oldPath, newPath };
}

/** Rebuild `docs/decisions/0000-index.md`'s conflicted text with every
 * conflict hunk replaced by the union of both sides' rows, sorted
 * numerically by decision id -- `idRenames` (a `Map<oldId, {newId,
 * newPath}>`, only ever populated for `theirs`-side ids that collided with
 * an `ours` id) rewrites a renamed row's `[oldId](oldPath)` link to
 * `[newId](newPath)` before sorting. Writes the file and stages it; never
 * touches any other path. */
export function resolveDecisionIndexConflict(repoRoot, classification, idRenames) {
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

  fs.writeFileSync(path.join(repoRoot, DECISION_INDEX_PATH), rebuilt);
  git(repoRoot, ['add', DECISION_INDEX_PATH]);
}

/**
 * Attempt to auto-resolve a decision-ID-collision conflict already
 * classified by `classifyDecisionIndexCollision` (the caller passes its
 * non-null result). Renumbers every `branch`-side colliding decision file
 * to the next free id after `HEAD`'s own (never touching `HEAD`'s already-
 * landed numbering), then rewrites the index conflict with both sides'
 * rows unioned. Never throws on an ordinary "couldn't find the branch-side
 * file" mismatch -- returns `false` so the caller falls back to the
 * pre-existing abort-and-report path exactly like a `null` classification
 * would; only a real git-command failure inside the helpers above
 * propagates, the same "only a genuine bug throws" contract every other
 * git call in this module already keeps.
 */
export function autoResolveDecisionIndexCollision(repoRoot, branch, classification) {
  if (classification.collidingIds.length === 0) {
    resolveDecisionIndexConflict(repoRoot, classification, new Map());
    return true;
  }
  const headFiles = new Set(
    git(repoRoot, ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'docs/decisions/']).split('\n').filter(Boolean),
  );
  const branchFiles = git(repoRoot, ['ls-tree', '-r', '--name-only', branch, '--', 'docs/decisions/'])
    .split('\n').filter(Boolean);

  const idRenames = new Map();
  let nextId = nextFreeDecisionId(repoRoot, 'HEAD');
  for (const oldId of classification.collidingIds) {
    const theirsFile = branchFiles.find((f) => {
      const m = f.match(DECISION_FILE_RE);
      return m && m[1] === oldId && !headFiles.has(f);
    });
    if (!theirsFile) {
      return false; // doesn't match the expected shape -- fall back safe
    }
    const renamed = renumberDecisionFile(repoRoot, theirsFile, nextId);
    idRenames.set(oldId, renamed);
    nextId = String(parseInt(nextId, 10) + 1).padStart(4, '0');
  }
  resolveDecisionIndexConflict(repoRoot, classification, idRenames);
  return true;
}

/**
 * Attempt to merge a runner item's branch into `repoRoot`'s current checkout
 * (checked clean by the caller first). The git call itself is target-
 * agnostic — no trunk is hardcoded — so per D3 (fan-out-parallel) this
 * generalizes to whichever branch the caller has checked out: `main` for a
 * root->main merge, or `fgw/<root>` for a leaf->parent merge. Every path is
 * either "outcome: merged" (verify passed on the staged tree, merge
 * committed) or a defined non-throwing outcome — "conflict", "verify-fail",
 * or "fgos-write-rejected" — with the merge already cleanly aborted, the
 * checkout untouched. Only a failure to even run `git merge --abort` itself
 * throws (a real bug).
 *
 * FGOS-WRITE-REJECTED (ADR0020): a worker's `fgw/<id>` branch must never
 * carry a change under `.fgos/` — the store's single write door stays the
 * `fgos` CLI verbs run against `repoRoot`, never a worker's own commit
 * (`0005`). `worktree.mjs`'s `createWorktree` no longer checks out `.fgos/`
 * into a worker's worktree at all (same ADR), so this should never trigger
 * in practice — this check is the mechanical, trusted-side wall for the
 * residual case (a worker `mkdir`s a fresh `.fgos/` itself and commits it)
 * that a missing checkout alone can't prevent. Checked on the STAGED diff
 * after `--no-commit --no-ff` lands cleanly — the exact paths *this* merge
 * introduces relative to current HEAD, correct for both a root->main merge
 * and a leaf->parent merge without needing to know either branch's trunk.
 */
// HEARTBEAT_INTERVAL_MS (tsk-4l8): this call holds `acquireMainCheckoutLock`
// across the entire `mergeRunnerItemLocked` call below, including
// `runGoalCheck`'s verify run — measured up to ~185s in practice, exceeding
// `DEFAULT_TTL_MS` (180s). Without a periodic renew, a contender's own
// acquire attempt judges this still-live holder's lock as stale once its
// age exceeds ITS OWN `ttlMs` (main-checkout-lock.mjs's `held = pidLive &&
// withinTtl` is evaluated with the CONTENDER's ttlMs, not this holder's),
// regardless of who wrote the record — the exact race this item
// investigated. Derived as a fraction of `DEFAULT_TTL_MS` (not a second
// fixed constant) so the two stay proportional if the TTL is ever retuned
// again; a third of the TTL leaves a comfortable margin (renews at ~60s
// against a 180s window) even if one renew tick is delayed.
const HEARTBEAT_INTERVAL_MS = Math.floor(DEFAULT_TTL_MS / 3);

export async function mergeRunnerItem(repoRoot, item, { timeoutMs, lockRoot = repoRoot } = {}) {
  const branch = branchNameFor(item.id);

  // tsk-2ypd (D4): read the paths this branch brings BEFORE merging. Once it
  // lands, `target` contains `branch`, so `git diff target...branch` is empty
  // and this set can no longer be recovered.
  const postLandTarget = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot);
  const postLandFiles = changedFiles(repoRoot, item, { trunk: postLandTarget });

  // The pre-commit hook only locks the final `git commit` — everything
  // before it (`git merge --no-commit`, the .fgos-write check, verify) ran
  // unprotected, so a concurrent session's own merge/commit could land in
  // that window and resolve MERGE_HEAD out from under this one (observed:
  // "no merge to abort" on the *abort* call itself, not just the commit).
  // Acquiring here, before the first git call, closes that gap by holding
  // the same lock the hook already enforces for the commit alone — same
  // identity (`resolveWriterIdentity`) as the hook resolves inside the
  // child `git commit` process it spawns, so D6 self-recognition lets that
  // later, in-process-tree acquisition succeed as a refresh, never a
  // self-deadlock — true whenever an env session id resolves the identity
  // (the primary path; every session actually contending on this checkout
  // observed during this fix carried one). The bare-terminal ancestor-walk
  // fallback (session-identity.mjs) resolves relative to each process's OWN
  // pid, so this call (from the approve process) and the hook's later call
  // (from its own child pid, several hops deeper) are not guaranteed to
  // land on the same ancestor and could in principle self-refuse. This is
  // the same "best-effort only" limitation session-identity.mjs already
  // documents for that fallback, now newly reachable from here too — not a
  // regression in kind, just a second call site inheriting a known gap.
  // tsk-2eq: `lockRoot` defaults to `repoRoot` (root->main approve's own
  // call site, unaffected) but a leaf->parent approve passes the real repo
  // root here explicitly while `repoRoot` itself stays the ephemeral
  // worktree used as the git-op cwd below. Resolving `fgosDir` off a bare
  // `repoRoot` would point inside that ephemeral worktree — a directory
  // `createWorktree` (worktree.mjs) already strips `.fgos/` from per
  // ADR0020 — so `acquireMainCheckoutLock` would silently recreate it
  // fresh every call and never actually contend with the real
  // `<repoRoot>/.fgos/main-checkout.lock` a concurrent leaf merge holds.
  const fgosDir = path.join(lockRoot, '.fgos');
  const identity = resolveWriterIdentity(fgosDir).id;
  // releaseOnExit (tsk-45z point 2): approve's own job is over once this
  // process exits, so a crash/interrupt mid-merge should release the lock
  // immediately rather than leaving the next writer to wait out the TTL —
  // unlike `.githooks/pre-commit`'s intentional lingering acquire, this
  // caller's `finally` below already always calls `lock.release()` itself
  // on the happy path; releaseOnExit only adds the crash/SIGINT/SIGTERM net
  // on top of that.
  const lock = acquireMainCheckoutLock(fgosDir, { identity, ttlMs: DEFAULT_TTL_MS, releaseOnExit: true });
  if (lock.status === HELD) {
    const ttlPart = lock.remainingTtlMs != null
      ? `, expires in ${formatLockDurationMs(lock.remainingTtlMs)}`
      : ', no TTL window known';
    throw new MergeError(
      `cannot merge "${branch}": main checkout is locked by another live session (${lock.holderPid}, held ${formatLockDurationMs(lock.lockAgeMs)}${ttlPart}).`,
      { branch, code: 'lock-held', remainingTtlMs: lock.remainingTtlMs, holderPid: lock.holderPid, lockAgeMs: lock.lockAgeMs },
    );
  }
  if (lock.status === AMBIGUOUS) {
    throw new MergeError(`cannot merge "${branch}": main checkout lock is ambiguous (unparseable lock file) — refusing per fail-closed policy.`, { branch, code: 'lock-ambiguous', lockAgeMs: lock.lockAgeMs });
  }

  // Heartbeat (tsk-4l8): renews the lock's timestamp every
  // HEARTBEAT_INTERVAL_MS for as long as this call holds it, so its age
  // never approaches DEFAULT_TTL_MS no matter how long the wrapped call
  // (in particular runGoalCheck, called from within mergeRunnerItemLocked)
  // actually runs. `.unref()`'d so a lingering timer never blocks process
  // exit; `renewMainCheckoutLockIfOwn` only ever writes when this call's
  // own `identity` still owns the record, so a lock legitimately reclaimed
  // out from under a crashed/hung holder is never resurrected by a stray
  // tick. Cleared in the same `finally` that already releases the lock —
  // covers every exit path (success, verify-fail, a thrown exception)
  // exactly like `lock.release()` already does.
  const heartbeat = setInterval(() => {
    renewMainCheckoutLockIfOwn(fgosDir, identity);
  }, HEARTBEAT_INTERVAL_MS);
  heartbeat.unref();

  let result;
  try {
    result = await mergeRunnerItemLocked(repoRoot, item, branch, { timeoutMs });
  } finally {
    clearInterval(heartbeat);
    lock.release();
  }

  // Detection runs here, AFTER the lock is released: it is read-only work
  // that must never widen the critical section this whole design exists to
  // narrow. Only a landed merge can have put anything behind.
  if (result.outcome !== 'merged') {
    return result;
  }
  return {
    ...result,
    postLand: detectPostLandDrift(repoRoot, listWork(path.join(lockRoot, '.fgos')), item, {
      target: postLandTarget,
      landedFiles: postLandFiles,
      // lockRoot, never repoRoot: a leaf->parent merge runs in an ephemeral
      // worktree whose own `.fgos/` is stripped at setup (ADR0020,
      // worktree.mjs's finishWorktreeSetup), so only lockRoot reaches the
      // one real store.
      sessions: listSessions(lockRoot),
    }),
  };
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
function isAlreadyMerged(repoRoot, branch, ref) {
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', branch, ref]);
    return true;
  } catch (err) {
    if (err.status === 1) {
      return false;
    }
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
 *  - `HEAD` is an ancestor of `branch` — main has not advanced past the
 *    fork, so merging `branch` yields `branch`'s own tree. Verified
 *    empirically during this item's validating pass: with main an ancestor,
 *    the tree staged by `git merge --no-commit --no-ff` is byte-identical
 *    to the branch tip's tree; once main advances by even one commit, it is
 *    not, and this returns false so the full checks run.
 *  - the branch tip still equals `branchHeadAtReturn` — the SHA whose tree
 *    actually passed. Without this, a commit pushed onto the branch after
 *    `return` would ride in unverified.
 *
 * Deliberately SUFFICIENT, not necessary: it skips only where identity is
 * provable, and false-negatives (running checks that would have passed)
 * cost time, while a false-positive would land an unverified tree on main.
 * A main-source return is never eligible — it records `headAtReturn`, not
 * `branchHeadAtReturn`, and this returns false for it.
 */
function mergedTreeAlreadyVerified(repoRoot, item, branch) {
  if (typeof item.branchHeadAtReturn !== 'string' || !item.branchHeadAtReturn) return false;
  let branchTip;
  try {
    branchTip = git(repoRoot, ['rev-parse', branch]).trim();
  } catch {
    return false;
  }
  if (branchTip !== item.branchHeadAtReturn) return false;
  return isAlreadyMerged(repoRoot, 'HEAD', branch);
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
  const mergeCommits = git(repoRoot, ['log', '--merges', '--ancestry-path', '--reverse', '--format=%H', `${branch}..${ref}`])
    .split('\n')
    .filter((line) => line !== '');
  if (mergeCommits.length === 0) {
    return [];
  }
  const firstMerge = mergeCommits[0];
  let base;
  try {
    base = git(repoRoot, ['merge-base', branch, `${firstMerge}^1`]).trim();
  } catch {
    return []; // no shared history to diff against — fail open, nothing to compare
  }
  const introducedPaths = git(repoRoot, ['diff', '--name-only', `${base}..${branch}`])
    .split('\n')
    .filter((p) => p !== '');
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
  const changedByMerge = new Set(
    git(repoRoot, ['diff', '--name-only', `${firstMerge}^1`, firstMerge, '--', ...introducedPaths])
      .split('\n')
      .filter((p) => p !== ''),
  );
  return introducedPaths.filter((p) => !changedByMerge.has(p));
}

// tsk-2j9 D1/D2: a genuine `git merge --no-commit --no-ff branch` no-op
// (branch already an ancestor of HEAD by the time this call runs -- the
// TOCTOU window between `isAlreadyMerged`'s pre-check above and this call,
// e.g. a main-checkout writer that bypasses `acquireMainCheckoutLock`)
// exits 0 with "Already up to date." and creates no `MERGE_HEAD`. Every
// abort call below used to run unconditionally on that path and crash with
// "fatal: There is no merge to abort (MERGE_HEAD missing)" instead of
// returning the outcome the code was already about to return. Guarding on
// `MERGE_HEAD`'s existence closes that gap without changing any call
// site's own error message or returned outcome on every already-covered
// case -- this only ever changes behavior when there was nothing to abort.
function mergeHeadExists(repoRoot) {
  try {
    git(repoRoot, ['rev-parse', '--verify', 'MERGE_HEAD']);
    return true;
  } catch {
    return false;
  }
}

export function abortMergeIfPossible(repoRoot) {
  if (!mergeHeadExists(repoRoot)) {
    return;
  }
  try {
    git(repoRoot, ['merge', '--abort']);
  } catch (err) {
    // tsk-18a D2: a concurrent process resolving the SAME writer identity
    // (main-checkout-lock.mjs's D6 self-recognition "refresh" path treats
    // it as this call's own session, so tsk-2eq's lock never contends
    // against it) can clear MERGE_HEAD in the window between the check
    // above and this abort call -- empirically reproduced: two genuinely
    // separate processes forced to share one resolved identity, real git
    // ops racing on one shared checkout, "no merge to abort" on this exact
    // line. If MERGE_HEAD is gone NOW, the abort's own goal -- no merge
    // left in progress -- is already satisfied, whatever cleared it;
    // treat this exactly like the up-front no-op case above, never as a
    // fatal failure. Any OTHER abort failure (MERGE_HEAD still present)
    // is a real one and still propagates unchanged.
    if (!mergeHeadExists(repoRoot)) {
      return;
    }
    throw err;
  }
}

async function mergeRunnerItemLocked(repoRoot, item, branch, { timeoutMs }) {
  // tsk-3yl D1: still run the real goal-check here, even though nothing
  // will be staged/committed — every 'merged' outcome must carry a real,
  // freshly-executed verify result (both callers in bin/fgos.mjs read
  // `result.check.output` unconditionally on this path), and a HEAD that
  // drifted since the original merge landed still deserves a real check
  // before this is declared done again.
  if (isAlreadyMerged(repoRoot, branch, 'HEAD')) {
    // tsk-15k D1: bare ancestry is not proof the content is really there —
    // see branchContentMismatch above. Checked before the goal-check so a
    // discarded-content case never gets a chance to pass on a coincidentally
    // weak verify command.
    const mismatchedPaths = branchContentMismatch(repoRoot, branch, 'HEAD');
    if (mismatchedPaths.length > 0) {
      return {
        outcome: 'verify-fail',
        branch,
        check: {
          passed: false,
          status: null,
          output: `integrity check failed: "${branch}" is an ancestor of HEAD but its own content is not reflected there for: ${mismatchedPaths.join(', ')} — a prior merge likely discarded this branch's changes (e.g. a manually-resolved "git merge -s ours") while still recording it as a parent`,
        },
      };
    }
    const check = await runGoalCheck(item, repoRoot, timeoutMs);
    if (!check.passed) {
      return { outcome: 'verify-fail', branch, check };
    }
    // tsk-516 (CONTEXT.md D3/D4): this path already merged earlier, so the
    // tree here IS main's own — a repo invariant broken by this branch is
    // exactly what must not be declared 'merged' again. D5's skip never
    // applies here: HEAD has already absorbed the branch, so the tree under
    // test is not the branch tip's tree.
    const invariant = await runInvariantChecks(readInvariantCheckCommands(repoRoot), repoRoot, timeoutMs);
    if (!invariant.passed) {
      return { outcome: 'verify-fail', branch, check: invariantFailureAsCheck(invariant) };
    }
    return { outcome: 'merged', branch, check };
  }

  // tsk-4hj D1/D2/D3: a MERGE_HEAD already on disk BEFORE this call ever
  // runs belongs to a DIFFERENT item's in-progress or abandoned merge --
  // git itself refuses ("You have not concluded your merge") whenever
  // this is true, regardless of which branch it belongs to, so this call
  // never gets a chance to attempt anything of its own. Must be checked
  // here, before the git merge attempt below: the existing post-call
  // `mergeHeadExists` read further down (tsk-18a D1) cannot tell "created
  // BY this call" apart from "already there before it ran" -- both read
  // the same boolean at the same post-failure moment. Must never call
  // `abortMergeIfPossible` on this path -- that would discard the OTHER
  // item's merge state, exactly the data-loss bug this decision exists
  // to close.
  if (mergeHeadExists(repoRoot)) {
    return { outcome: 'merge-blocked-other-item', branch };
  }

  let selfResolved = false;
  try {
    git(repoRoot, ['merge', '--no-commit', '--no-ff', branch]);
  } catch (err) {
    // tsk-3mv-1 D1a: before giving up, check whether this is the one
    // content-agnostic conflict shape proven self-resolvable (a
    // decision-ID collision on docs/decisions/0000-index.md) -- never
    // attempted for any other conflict shape, and never left half-resolved
    // on any failure along this path (falls through to the exact same
    // abort below).
    const classification = classifyDecisionIndexCollision(repoRoot);
    if (classification && autoResolveDecisionIndexCollision(repoRoot, branch, classification)) {
      selfResolved = true;
    } else {
      // tsk-18a D1: MERGE_HEAD only exists when git actually staged a real
      // conflict -- captured BEFORE the abort below, which deletes it as a
      // side effect of succeeding. Any OTHER failure of this merge call
      // (e.g. an untracked file colliding with a path `branch` introduces)
      // never creates MERGE_HEAD at all; blindly reporting 'conflict' on
      // every failure would misclassify that case and discard the real
      // git error entirely.
      const genuineConflict = mergeHeadExists(repoRoot);
      try {
        abortMergeIfPossible(repoRoot);
      } catch (abortErr) {
        throw new MergeError(`merge of "${branch}" failed and "git merge --abort" itself failed: ${abortErr.message}`, { branch });
      }
      if (genuineConflict) {
        return { outcome: 'conflict', branch };
      }
      return {
        outcome: 'merge-failed-unclassified',
        branch,
        error: { message: err.message, stderr: err.stderr ?? null, status: err.status ?? null },
      };
    }
  }

  const stagedPaths = git(repoRoot, ['diff', '--name-only', '--cached'])
    .split('\n')
    .filter((p) => p !== '');
  const fgosPaths = stagedPaths.filter((p) => p === '.fgos' || p.startsWith('.fgos/'));
  if (fgosPaths.length > 0) {
    try {
      abortMergeIfPossible(repoRoot);
    } catch (abortErr) {
      throw new MergeError(
        `merge of "${branch}" staged a change under ".fgos/" and "git merge --abort" itself failed: ${abortErr.message}`,
        { branch, fgosPaths },
      );
    }
    return { outcome: 'fgos-write-rejected', branch, paths: fgosPaths, ...(selfResolved && { selfResolved }) };
  }

  // tsk-516 (CONTEXT.md D1/D5): when the tree this merge produces is
  // provably the tree `return` already verified, running the checks again
  // is a duplicate of a result already known — the "no test thừa" half of
  // this item. Both the item's own verify AND the repo-invariant checks are
  // skipped together: same tree, same answer, and skipping one while
  // re-running the other would be an arbitrary split.
  //
  // Read before the staged-tree checks below but AFTER the merge itself:
  // both refs it reads (HEAD, the branch tip) are untouched by
  // `git merge --no-commit`, so its answer is the same either side of it.
  //
  // A skipped check still returns a real, honest `check` object — both
  // callers in bin/fgos.mjs read `result.check.output` unconditionally
  // (see the header of the already-merged branch above), and a person
  // reading a merge report deserves to see WHY nothing ran rather than a
  // blank pass.
  const skipRedundantChecks = mergedTreeAlreadyVerified(repoRoot, item, branch);
  const check = skipRedundantChecks
    ? {
        passed: true,
        status: 0,
        timedOut: false,
        skipped: true,
        output: `verify skipped: the merged tree is identical to ${item.branchHeadAtReturn}, already verified green at return (HEAD is an ancestor of "${branch}" and the branch tip has not moved since)`,
      }
    : await runGoalCheck(item, repoRoot, timeoutMs);
  if (!check.passed) {
    try {
      abortMergeIfPossible(repoRoot);
    } catch (abortErr) {
      throw new MergeError(`post-merge verify failed for "${branch}" and "git merge --abort" itself failed: ${abortErr.message}`, { branch });
    }
    return { outcome: 'verify-fail', branch, check, ...(selfResolved && { selfResolved }) };
  }

  // tsk-516 (CONTEXT.md D3/D4): the repo-invariant gate, on the tree that is
  // actually about to land on main — the exact state that went red and STAYED
  // red across later merges in the tsk-1m0 case this item exists for. Hard
  // gate, not advisory: the checks are deterministic (no flake surface to
  // absorb), and an advisory here is what already failed once.
  if (!skipRedundantChecks) {
    const invariant = await runInvariantChecks(readInvariantCheckCommands(repoRoot), repoRoot, timeoutMs);
    if (!invariant.passed) {
      try {
        abortMergeIfPossible(repoRoot);
      } catch (abortErr) {
        throw new MergeError(`post-merge repo-invariant check failed for "${branch}" and "git merge --abort" itself failed: ${abortErr.message}`, { branch });
      }
      return { outcome: 'verify-fail', branch, check: invariantFailureAsCheck(invariant), ...(selfResolved && { selfResolved }) };
    }
  }

  try {
    git(repoRoot, ['commit', '--no-edit']);
  } catch (err) {
    try {
      abortMergeIfPossible(repoRoot);
    } catch (abortErr) {
      throw new MergeError(
        `verify passed for "${branch}" but "git commit" failed, and "git merge --abort" itself failed: ${abortErr.message} (commit error: ${err.message})`,
        { branch, stderr: err.stderr ?? null, status: err.status ?? null },
      );
    }
    throw new MergeError(`verify passed for "${branch}" but "git commit" failed: ${err.message}`, {
      branch,
      stderr: err.stderr ?? null,
      status: err.status ?? null,
    });
  }
  return { outcome: 'merged', branch, check, ...(selfResolved && { selfResolved }) };
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
 * FORCE DELETE (tsk-1p9 D8): `git branch -D`, not `-d`. By the time this
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
  try {
    reclaimOrphanedCheckout(repoRoot, branch);
  } catch (err) {
    warnings.push(`worktree cleanup failed for "${branch}": ${err.message}`);
  }
  try {
    git(repoRoot, ['branch', '-D', branch]);
  } catch (err) {
    warnings.push(`branch delete failed for "${branch}" (left in place, harmless): ${err.message}`);
  }
  return { warnings };
}
