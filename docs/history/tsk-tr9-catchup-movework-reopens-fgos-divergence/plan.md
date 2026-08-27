# plan.md — tsk-tr9

Mode: tiny

0 of the mode-gate flags apply (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain) —
this item requires no code change at all, only closing an already-fixed
bug with evidence. No exploring round ran (discovery verdict was `clear`
— see `RESEARCH.md`), so there is no separate CONTEXT.md; the discovery
verdict itself is the locked basis for this plan.

## Approach

`RESEARCH.md` (Round 1) already grounds the whole approach: the bug
tsk-tr9 reports is already fixed on `main`, landed 2026-08-24 in commit
`10e44585` ("fix(merge): resolve .fgos-only merge conflicts instead of
aborting"), and this item's own branch (`fgw/tsk-tr9`, `branchHeadAtTake
09a3a28d1a`) already inherits that commit. Two regression tests already
exist and pass, explicitly named for this item:
`test/runner/merge.test.mjs:1974` and `:1984` — both titled `(tsk-tr9
regression)`. The item that originally surfaced this bug (tsk-2tmk)
merged cleanly ~5h after the fix landed and is now `status:
retrospective`.

No alternative path considered: since the fix, its tests, and downstream
confirmation are all already real and passing, re-implementing or
re-designing anything here would just be scope creep on an item whose
underlying defect no longer exists. Risk map: none — no code, no
behavior, and no public contract changes; nothing here touches auth,
data, or external systems. Files touched: only this feature's own
`docs/history/` pair (`plan.md`, `RESEARCH.md`).

## Shape

This is a single honest piece (pass-through, no split): confirm the fix
already covers the reported scenario (done in `RESEARCH.md`), record the
finding, and hand off to `fgos-coding-validating` to check the plan
against reality before `fgos discover`/`return` closes the item out.
Execute's own job is limited to re-running the already-passing regression
verify below — no source file changes are expected during `executing`.

**Proof surface:** `node --test --test-name-pattern="tsk-tr9 regression"
test/runner/merge.test.mjs` (already synced onto `work.verify` at
discovery, and already confirmed green in `RESEARCH.md`).

## Outstanding questions

None
