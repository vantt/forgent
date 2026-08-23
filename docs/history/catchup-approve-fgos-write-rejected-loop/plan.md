# Plan: point `fgos-write-rejected` at its existing recovery playbook (tsk-2f6)

Mode: tiny

0 hard-gate flags apply (no auth, authorization, data model, audit/
security weakening, external system, public contract, cross-platform,
multi-domain concerns) — this changes only the free-text `detail` string
attached to an already-tested, already-enforced block outcome; the
enforcement itself (`fgosPaths.length > 0` → abort + block) is untouched.
`fgos graph --json` shows `tsk-2f6` with no deps and size-1 component — no
ordering concerns, one direct task.

## Approach

Honors D1/D2/D3 (`CONTEXT.md`): drop the "approve should distinguish
which side changed `.fgos/*`" idea entirely (D1 — proven unnecessary),
make the `fgos-write-rejected` block detail always point at
`docs/how-to/fix-fgos-write-rejected-merge-block.md` (D2), and add no
repeat-counter/loop-detection state (D3).

The `fgos-write-rejected` outcome from `mergeRunnerItemLocked`
(`src/runner/merge.mjs:1227-1236`) is consumed at three call sites that
each hand-assemble the same one-line template — `${branch} staged a
change under .fgos/ (${paths}); merge aborted, ${target} unchanged —
ADR0020`:

- `src/verbs/merge/approve.mjs:593` (root-branch variant)
- `src/verbs/merge/approve.mjs:759` (main-branch variant)
- `src/verbs/merge/sync-root.mjs:127` (sync-root variant)

Rejected alternative: editing each of the 3 call sites' template strings
independently — works, but repeats the same doc-pointer suffix 3 times
(DRY violation for a one-line addition that's easy to drift out of sync
later). Chosen instead: extract one shared formatter in `merge.mjs` (the
module that already owns the `fgos-write-rejected` outcome shape) and
call it from all three sites.

No test currently asserts on the exact `detail` string (`grep -rn
"staged a change under" test/` → no hits); only the structured
`outcome`/`paths` fields are asserted (`test/runner/merge.test.mjs:1387`
`assert.equal(result.outcome, 'fgos-write-rejected')`), which this change
does not touch. Risk: light.

## Shape

1. Add `formatFgosWriteRejectedDetail(branch, paths, targetLabel)` to
   `src/runner/merge.mjs`, exported alongside `abortMergeIfPossible` (same
   module, same pattern — a small shared helper other merge-outcome
   consumers already import from here). Returns the existing template with
   one sentence appended: `See docs/how-to/fix-fgos-write-rejected-merge-block.md
   for the recovery steps.`
2. Replace the 3 hand-assembled template strings (`approve.mjs:593`,
   `approve.mjs:759`, `sync-root.mjs:127`) with calls to this helper,
   passing each site's own `branch`/`paths`/target-label values unchanged.
3. Add one new unit test asserting the helper's output includes the doc
   path — the concrete case worth proving: a caller reading the block
   detail text can find the playbook without re-deriving it.

Verify: `npm test` (existing suite must stay green — proves the
structured `outcome`/`paths` fields are untouched — plus the new
assertion on the helper's own output).

## Outstanding questions

None
