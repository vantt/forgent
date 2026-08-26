# plan.md — tsk-17m

Mode: tiny

Flag count: 0 (auth/authorization/data-model/audit-security/external-
systems/public-contracts/cross-platform/existing-covered-behavior/
weak-proof/multi-domain — none apply). Docs-only prose reconciliation
across 2 already-identified files, every citation line-verified live
(`RESEARCH.md` round 1). No CONTEXT.md exists for this item — discovery's
verdict was `clear` (D2), which skips `exploring` and its CONTEXT.md by
design; the task's own description (post-distill, seq 4) already carries
every locked-decision-equivalent fact this plan needs, cited below.

## Approach

Single honest piece, no split. Two doc edits, both scoped to prose/table
content, no code or logic change:

1. `docs/specs/runner.md` (~lines 1787-1868, "Lớp còn thiếu" section +
   "Kế hoạch triển khai (5 pha)" table):
   - Rewrite the opening sentence at line 1789 ("Hôm nay CHƯA có lớp
     quyết định nào tự động áp quy tắc 1-4 ở trên.") so the tense reflects
     that 4/5 phases are done (tsk-1ni/27y/53h/3ik) and Pha 5 (tsk-6db) is
     deliberately deferred/YAGNI — not "still entirely open". Keep the
     original 4-factor vision prose intact (historical value); only the
     framing changes.
   - Add one clarifying line: what shipped (tsk-53h/tsk-3ik) is a
     deliberate NARROWING of the original 4-factor LLM-judgment vision —
     3 factors resolved mechanically at config-time (agentType-shaped vs
     command-shaped, D0033's cli-spawn-shaped-always-wins), leaving exactly
     1 runtime factor ("am I a live soul with Task-tool access right now")
     collapsed into the caller's own self-declared `--has-live-task-access`
     flag (never probed/guessed) — cite
     `src/runner/dispatch/mechanism.mjs:42` (`decideDispatchMechanism`) and
     `:82` (`decideExecutorDispatchMechanism`) as evidence, both confirmed
     live in RESEARCH.md round 1.
   - Add a status column/note to the 5-phase table (lines 1852-1868): done
     for Pha 1-4, deferred/YAGNI for Pha 5.

2. `docs/architect/dispatch-control-plane-redesign.md` (Problem Statement,
   line 15, the `a `decide` command...` bullet): add one short
   cross-reference sentence pointing at `docs/specs/runner.md`'s "Lớp còn
   thiếu" section (path + heading name), stating `decide` is the result of
   D0026's 4 done phases, with Pha 5 (agy) the one deliberately-deferred
   remainder. Zero existing cross-reference confirmed in RESEARCH.md round
   1 (`rg` for the 5 tsk-ids and "D0026" in this file returned no hits).

No alternatives considered beyond this — the task description already
names the exact edit points and acceptance criteria; there is no design
space to explore for a prose-accuracy fix.

**Risk map:** standard risk (docs-only), no proof point needed — this is
not a behavior change, so there is nothing for `fgos-coding-validating` to
prove against running code. The one thing worth re-confirming before
`executing` is that the cited line numbers still match (docs can drift
between planning and execution) — a one-line `rg` re-check at
implementation time covers this, not a separate proof point.

## Shape

Both edits stay inline prose/table edits in the two files above — no new
files, no renamed sections, no structural reshuffle. Order: edit
`runner.md` first (the source-of-truth narrative), then
`dispatch-control-plane-redesign.md` (the cross-reference depends on
`runner.md`'s section heading staying "Lớp còn thiếu" — unchanged by this
plan).

## Split decision

No split. One piece, one item, stays as `tsk-17m` itself through
`executing`.

## Outstanding questions

None.
