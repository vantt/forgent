// frozen-judge.mjs — fgOS's post-execution frozen-judge equivalent (STR63).
//
// bee's own frozen-judge (.bee/bin/lib/cells.mjs, decision 0018) flags a
// worker that rewrote the test suite, CI config, lockfiles, or manifests
// WITHOUT declaring those files in its own scope. fgOS already had both
// ingredients bee's check needs — an item's declared `footprint` and its
// actual changed files — but nothing composed them (docs/history/
// str63-frozen-judge-fgos/CONTEXT.md D1). This module is that composition:
// advisory only, never blocks anything (STR63 cos: "advisory, không tự
// fail, giống tinh thần frozen-judge").
//
// Pattern list ported from bee's FROZEN_JUDGE_PATTERNS (CONTEXT.md D2 chose
// verbatim-port for the smallest scope); the ".bee/config.json"-specific
// entry is dropped (fgOS has no .bee/), a ".fgos/"-specific entry is a
// noted follow-up, not in scope here.
import { normalizePath } from '../util/normalize-path.mjs';

export const FROZEN_JUDGE_PATTERNS = [
  { rule: 'test sources', pattern: /(^|\/)(tests?|__tests__|specs?)\// },
  { rule: 'test file', pattern: /\.(test|spec)\.[a-z]+$/i },
  { rule: 'snapshot', pattern: /(^|\/)__snapshots__\/|\.snap$/i },
  {
    rule: 'CI config',
    pattern: /(^|\/)\.github\/workflows\/|(^|\/)\.gitlab-ci\.yml$|(^|\/)Jenkinsfile$|(^|\/)azure-pipelines\.yml$|(^|\/)\.circleci\//i,
  },
  {
    rule: 'lockfile',
    pattern:
      /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|uv\.lock|go\.sum|composer\.lock|Gemfile\.lock)$/i,
  },
  {
    rule: 'package manifest',
    pattern: /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|composer\.json|Gemfile)$/i,
  },
  {
    rule: 'test config',
    pattern: /(^|\/)(jest\.config|vitest\.config|playwright\.config|karma\.conf|pytest\.ini|tox\.ini|phpunit\.xml)[^/]*$/i,
  },
];

/**
 * Frozen-judge check: judge-pattern files changed outside the item's
 * declared `footprint`. Footprint entries match by EXACT path only — the
 * same semantics footprintOverlap already uses (graph-metrics.mjs, plain
 * Set membership), no directory-prefix or glob support: `footprint` has
 * never carried either convention in fgOS.
 *
 * @param {string[]} changedFiles - actual files changed by this return/approve
 * @param {string[]} footprint - the item's declared footprint (may be absent)
 * @returns {{file:string, rule:string}[]} hits — empty means the judge is intact.
 */
export function frozenJudgeHits(changedFiles, footprint = []) {
  const declared = new Set((Array.isArray(footprint) ? footprint : []).map(normalizePath));
  const hits = [];
  for (const raw of Array.isArray(changedFiles) ? changedFiles : []) {
    const file = normalizePath(raw);
    if (!file) continue;
    const match = FROZEN_JUDGE_PATTERNS.find(({ pattern }) => pattern.test(file));
    if (!match) continue;
    if (declared.has(file)) continue;
    hits.push({ file, rule: match.rule });
  }
  return hits;
}

/**
 * Footprint-diff advisory (tsk-2ig, D3/D5 of docs/history/parallel-
 * decomposition-footprint-avoidance/CONTEXT.md — mức 1, advisory-only):
 * broadened sibling of `frozenJudgeHits` that flags ANY changed file
 * outside the item's declared `footprint`, not just the
 * `FROZEN_JUDGE_PATTERNS` subset — this is a SEPARATE function, never a
 * modification of `frozenJudgeHits` (D5: the existing narrow check's
 * behavior stays byte-for-byte unchanged).
 *
 * D5's exemption: an item with NO declared footprint (absent or empty
 * array) is exempt entirely — returns `[]` regardless of the diff.
 * Flagging every file in that case would be 100% of the diff, which is
 * not a signal (no declared baseline to diverge FROM), only guaranteed
 * noise — the opposite of `frozenJudgeHits`'s own fallback (which, for
 * the narrower judge-pattern set only, treats an absent footprint as
 * "check everything" since that subset is rare enough in a typical diff
 * to stay a real signal there).
 *
 * @param {string[]} changedFiles - actual files changed by this return/approve
 * @param {string[]} footprint - the item's declared footprint (may be absent)
 * @returns {{file:string}[]} hits — empty means every changed file is
 *   inside the declared footprint (or footprint was never declared, D5).
 */
export function footprintDiffHits(changedFiles, footprint = []) {
  const declaredList = Array.isArray(footprint) ? footprint : [];
  if (declaredList.length === 0) return []; // D5: absent footprint = exempt
  const declared = new Set(declaredList.map(normalizePath));
  const hits = [];
  for (const raw of Array.isArray(changedFiles) ? changedFiles : []) {
    const file = normalizePath(raw);
    if (!file) continue;
    if (declared.has(file)) continue;
    hits.push({ file });
  }
  return hits;
}
