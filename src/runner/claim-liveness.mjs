// D1/D4 (docs/history/session-claim-liveness/CONTEXT.md): the "is this
// claim's worktree still being actively touched" signal -- real file/commit
// activity, never session/process identity or claim-age. Reused by
// claim-port.mjs's stale-claim reclaim pre-check (D2/D5).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { branchNameFor, findCheckoutPath } from './worktree.mjs';
import { STALE_DOING_DEFAULTS } from '../state/graph-metrics.mjs';

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

/**
 * D4: `max(last commit time on the claim's fgw/<id> branch, newest mtime
 * among the files `git status --porcelain` lists in its current worktree)`,
 * epoch ms -- or `null` when the signal is unreadable (branch doesn't
 * exist, no live worktree registered for it, or a git call fails).
 *
 * `null` is deliberately never coerced to 0/Infinity: a caller must treat
 * it as inconclusive (D5), the same as a genuinely recent timestamp --
 * never as "ancient enough to reclaim" by accident.
 *
 * The `:!.fgos` status exclusion mirrors `isCheckoutDirty`
 * (`worktree.mjs`) -- ADR0020's own `.fgos` removal on checkout must never
 * look like real activity.
 */
export function lastActivityAt(repoRoot, id) {
  const branch = branchNameFor(id);

  let commitTs;
  try {
    const raw = git(repoRoot, ['log', '-1', '--format=%ct', branch]).trim();
    const seconds = Number.parseInt(raw, 10);
    if (Number.isFinite(seconds)) commitTs = seconds * 1000;
  } catch {
    return null; // branch doesn't exist -- nothing to measure at all
  }

  let porcelainWorktrees;
  try {
    porcelainWorktrees = git(repoRoot, ['worktree', 'list', '--porcelain']);
  } catch {
    return commitTs ?? null;
  }

  const worktreePath = findCheckoutPath(porcelainWorktrees, branch);
  if (!worktreePath) return commitTs ?? null; // branch exists, no live checkout -- commit time is all there is

  let statusOutput;
  try {
    // tsk-f8f: `-z` (NUL-terminated records), not the human-readable
    // newline format -- `git status --porcelain` (no `-z`) C-style-quotes
    // any path containing whitespace or other "unusual" characters (`??
    // "my file.txt"`), which the old `trimmed.split(/\s+/).pop()` parse
    // took literally, yielding a fragment like `file.txt"` (a lone
    // trailing quote character) that never matches a real file --
    // `statSync` fails, the entry is silently skipped, and that file's
    // mtime never contributes to the activity signal. `-z` mode never
    // quotes paths at all (verified empirically: a path with spaces comes
    // through raw, byte-for-byte), so there is no escape/quote format to
    // parse in the first place.
    statusOutput = git(repoRoot, ['-C', worktreePath, 'status', '--porcelain', '-z', '--', ':!.fgos']);
  } catch {
    return commitTs ?? null;
  }

  let newestMtime;
  // Each record is `XY<space>path`, NUL-terminated -- never newline-
  // terminated, so a path itself containing a literal newline (unusual,
  // but valid on POSIX filesystems) can never be mistaken for a record
  // boundary either, a second correctness gain `-z` gives for free. A
  // rename/copy record (X or Y is 'R'/'C') is followed by ONE MORE
  // NUL-terminated token, the origin path -- consumed and discarded here,
  // exactly mirroring the old code's own behavior of taking only the
  // destination path for a "orig -> path" rename line, never the origin.
  const records = statusOutput.split('\0').filter((entry) => entry.length > 0);
  for (let i = 0; i < records.length; i += 1) {
    const entry = records[i];
    const statusCode = entry.slice(0, 2);
    const filePath = entry.slice(3);
    if (statusCode.includes('R') || statusCode.includes('C')) {
      i += 1; // skip the origin-path token that follows a rename/copy record
    }
    try {
      const mtime = fs.statSync(path.join(worktreePath, filePath)).mtimeMs;
      if (newestMtime === undefined || mtime > newestMtime) newestMtime = mtime;
    } catch {
      // Listed by status but unreadable/deleted between the two calls --
      // skip it rather than aborting the whole signal over one entry.
    }
  }

  const candidates = [commitTs, newestMtime].filter((value) => value !== undefined);
  return candidates.length > 0 ? Math.max(...candidates) : null;
}

/**
 * D2/D3: is the claim on `id` conclusively quiet as of `now`? `claimRole`
 * selects the threshold bucket the same way `classifyStaleDoing`
 * (`graph-metrics.mjs`) already does for its own advisory -- `runner` gets
 * the short `agentMs` grace, everything else gets the long `humanMs` grace.
 * D3 reuses `STALE_DOING_DEFAULTS` as-is rather than a separate, more
 * conservative pair.
 *
 * An unreadable signal (`lastActivityAt` returns `null`) is never
 * conclusive -- this returns `false`, the same outcome as genuinely recent
 * activity, so the caller's fallback (refuse exactly as today) covers both.
 */
export function isReclaimEligible(repoRoot, id, claimRole, { now = Date.now(), thresholds = STALE_DOING_DEFAULTS } = {}) {
  const activityAt = lastActivityAt(repoRoot, id);
  if (activityAt === null) return false;
  const thresholdMs = claimRole === 'runner' ? thresholds.agentMs : thresholds.humanMs;
  return now - activityAt > thresholdMs;
}
