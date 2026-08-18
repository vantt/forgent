# plan.md — tsk-2y4

Mode: tiny

Flag count: 0 (no auth, no authorization, no data-model change, no
audit/security surface, no external systems, no public contract, no
cross-platform concern, no multi-domain touch; the one test this changes
already exercises covered behavior, but the fix aligns the test with
already-shipped behavior rather than changing behavior itself, and the
evidence for the fix direction is not weak — see RESEARCH.md). 0 flags →
tiny, single file, one direct task, no gray areas.

No `docs/history/dispatch-gather-capacity-stale-test/CONTEXT.md` exists:
tsk-2y4 took the discovery `clear` edge (see the item's own decision log,
"discovery caller-supplied: clear=true"), which skips `exploring` entirely
— there was never a person-facing decision round for this item, so there
is no `CONTEXT.md` to cite. The grounding for this plan is
`RESEARCH.md`'s Round 1 finding instead, cited below.

## Approach

The chosen path: rewrite the one failing test block in
`test/runner/dispatch.test.mjs` (lines 651-660, "the committed
.fgos/config.json runner section declares the gather capacity...") to
assert `capacities.gather` is `undefined`, mirroring the immediately
preceding test at lines 645-648 ("...no longer declares a
coding-classify-intake capacity...") which already handles the exact same
situation (an intentionally-retired capacity) with the correct pattern.

Rejected alternative: delete the test outright with no replacement. Not
chosen — the file already has a house style for documenting a retired
capacity (assert absence + a one-line rationale citing what retired it),
and following that style keeps the regression-proofing this test block was
originally for (nothing silently re-adds a `gather` entry) — a bare
deletion drops that guard entirely, which the file's own established
pattern says was not the intent when a capacity was intentionally retired.

Rejected alternative: leave the test failing / wait on tsk-5tm. Not chosen
— `RESEARCH.md` Round 1 grounds this: tsk-5tm's own D6 decision states
gather's removal is permanent (framed as "revert to pre-tsk-2ie5
behavior"), and none of tsk-5tm's 6 planned children reintroduce a
gather-purpose capacity. There is no pending redesign this test could
honestly wait for.

**Risk map:**

| Component | How risky | What would prove it |
|---|---|---|
| `test/runner/dispatch.test.mjs` (one `test()` block, ~14 lines) | light — test-only edit, no production code touched, exact precedent already exists in the same file | `node --test test/runner/dispatch.test.mjs` passing, with the rewritten block visibly following the `coding-classify-intake` pattern |

Impact-analysis posture (`CLAUDE.md`'s capability gate,
`fgos tool query --capability impact-analysis --status present`): GitNexus
registered and `present` on this machine (`full`). Not invoked for this
piece — the change is a test assertion rewrite, not an edit to any
production symbol (function/class/method) GitNexus's `impact` tool
resolves against, so there is nothing to run it on.

**Files touched:** `test/runner/dispatch.test.mjs` only.

**Order:** single piece, no ordering question — `fgos graph --json`'s
`criticalPath`/`topUnblock` are not informative here (this item has no
other queued piece to sequence against; `topUnblock` was skipped in this
run's own graph output as unrelated to a single-piece tiny item).

## Shape

One direct change: replace the test block currently asserting
`capacities.gather` exists (lines 651-660) with a test asserting it does
NOT exist, in the same style as the `coding-classify-intake` precedent
(lines 645-648):

```js
test('the committed .fgos/config.json runner section no longer declares a gather capacity (tsk-5tm D6): removed as the only cross-provider path with no recorded architectural reason to keep it -- the real reason it existed (parallelization) is already covered by the native Task tool; tsk-5tm-2 removed it, tsk-5tm\'s remaining children do not reintroduce it', () => {
  const cfg = committedRunnerConfig();
  assert.equal(cfg.capacities?.gather, undefined, 'capacities.gather should no longer exist -- removed permanently per tsk-5tm D6');
});
```

Concrete cases already covered by this shape: the boundary case (capacity
absent) is exactly what the rewritten assertion proves; there is no
existing-behavior regression risk (production code is untouched); no
concurrent-access or partial-failure surface applies to a single
synchronous assertion in a test file.

## Split decision

No split. One honest piece of work — a single test block rewrite in a
single file. The item proceeds as itself; `fgos-coding-validating` should
read this as pass-through.

## Outstanding questions

None
