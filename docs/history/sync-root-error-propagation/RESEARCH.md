# Research: sync-root's merge-failed-unclassified error propagation (tsk-3tv)

## Round 1 — 2026-08-24 (fgos-researching, called from fgos-coding-discovering)

**Asked:** Does this repo already have an established fix pattern for
surfacing `mergeRunnerItem`'s captured `error` field when its outcome is
`merge-failed-unclassified`, so `sync-root.mjs`'s generic fallback branch
can be fixed consistently? Is there existing test coverage that a fix
would need to satisfy? Does the friction record shape support an
arbitrary extra field?

**Checked (repo search):**

- `src/verbs/merge/sync-root.mjs` (`runAndReport`, lines 107-188): three
  named outcome branches (`conflict`, `fgos-write-rejected`,
  `verify-fail`), then one generic guard (line 147: `if (result.outcome
  !== 'merged')`) that catches everything else — `merge-failed-
  unclassified`, `lock-lost-mid-merge`, `merge-blocked-other-item` (only
  reached when it is not intercepted by the earlier
  `withMergeEphemeralWorktree`/`catchupResult` branches around line 213+;
  the top-level call at line 254 can still surface it directly). This
  generic guard writes only `result.outcome` into the friction `detail`
  string and the CLI response's `reason` field — never reads
  `result.error`.
- `src/runner/merge.mjs` line 1352-1365: `mergeRunnerItem` returns `{
  outcome: 'merge-failed-unclassified', branch, error: { message, stderr,
  status } }` on a real git-merge failure (two call sites, decision-index
  auto-resolve failure and the general catch). Line 1296:
  `merge-blocked-other-item` returns `{ outcome, branch }` — **no**
  `error` field. Line 1495: `lock-lost-mid-merge` returns `{ outcome,
  branch }` — **no** `error` field either. So `result.error` is present
  ONLY for `merge-failed-unclassified`, never for the other outcomes the
  same generic guard also has to catch — a fix must treat `result.error`
  as optional, not assume every unrecognized outcome carries one.
- `src/verbs/merge/approve.mjs` already has the exact precedent for
  reading `result.error` on this same outcome, in two places (a per-root
  merge path at line 567-583, and a cross-root/main path at line
  744-762). Quoting the first:

  ```js
  if (result.outcome === 'merge-failed-unclassified') {
    // tsk-18a D1: git merge --no-commit --no-ff failed but never
    // created MERGE_HEAD -- not a real textual conflict, so this
    // gets its own reason instead of being folded into
    // 'merge-conflict'. Real stderr/exit-code carried through so
    // this is actually diagnosable, unlike the static
    // 'merge-conflict' detail string.
    moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-failed-unclassified', role: 'system' });
    addFriction(dir, {
      id,
      disposition: 'blocked',
      errorClass: 'merge-failed-unclassified',
      layer: 'state',
      attempts: 1,
      detail: `git merge --no-commit --no-ff ${result.branch} into ${rootBranch} failed without a real conflict (exit ${result.error.status}): ${result.error.stderr || result.error.message}; merge aborted, ${rootBranch} unchanged`,
    });
    return { id, mode: 'merge', to: 'blocked', reason: 'merge-failed-unclassified', target: rootBranch, error: result.error };
  }
  ```

  This is a DEDICATED outcome branch (own `errorClass:
  'merge-failed-unclassified'`), not a generic-guard fix — approve.mjs
  handles `merge-failed-unclassified` by name, distinct from its own
  fallback for anything else.

- `test/cli/fgos-merge.test.mjs` line 1160: `'sync-root outcome guard
  catches merge-failed-unclassified and records unhandled-outcome
  friction (tsk-12o)'` — this existing, PASSING test drives
  `merge-failed-unclassified` all the way through sync-root's *generic*
  guard (not a dedicated branch) and asserts `frictions.some((f) =>
  f.errorClass === 'sync-root-unhandled-outcome')` (line 1209). A second
  test right after, line 1218 (`tsk-3df`), drives `lock-lost-mid-merge`
  through the SAME generic guard with the SAME `errorClass ===
  'sync-root-unhandled-outcome'` assertion (line 1244-1245) — this
  outcome carries no `result.error` at all (per the merge.mjs read
  above).
- `src/state/store.mjs` line 1392 `addFriction`: no fixed schema beyond
  requiring a non-empty `id` and running `assertValidDocType` — the
  payload is appended to the event log as-is (`work.friction` event
  type), so an extra field or a richer `detail` string needs no shape
  migration.

**Finding — resolves the ambiguity:** the item's own suggested direction
("thread `result.error` through in the generic fallback branch") is the
right one, NOT approve.mjs's dedicated-branch pattern. Turning
`merge-failed-unclassified` into its own named branch in sync-root.mjs
(mirroring approve.mjs's `errorClass: 'merge-failed-unclassified'`) would
break the existing tsk-12o test's `errorClass ===
'sync-root-unhandled-outcome'` assertion for no real gain, since the
generic guard already correctly and uniformly catches every unrecognized
outcome (including two — `lock-lost-mid-merge`, `merge-blocked-other-item`
— that never carry an `error` field). The correct, minimal fix: keep the
single generic guard and its existing `errorClass:
'sync-root-unhandled-outcome'`, but when `result.error` is present, fold
its `stderr || message` (and `status` when present) into the friction
`detail` string and add an optional `error: result.error` field to both
the friction payload and the CLI response object — guarded by presence
(`result.error ? ... : ...`), never assumed to exist for every outcome
this guard catches.

**Verify:** `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test
test/cli/fgos-merge.test.mjs` — covers the existing `tsk-12o`
(`merge-failed-unclassified`, must gain an assertion that the friction
detail/CLI response now carries the real git stderr) and `tsk-3df`
(`lock-lost-mid-merge`, must keep passing unchanged — no `error` field on
that outcome) cases in one file, the narrowest scope that exercises both
outcomes through the same generic guard.

**Verdict:** clear.
