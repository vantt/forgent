# recording-points-audit — plan

**Item:** tsk-ma4
**Decisions:** `docs/history/recording-points-audit/CONTEXT.md` (D1, D2)

## 1. Mode

Flag count against the mode gate: auth (no), authorization (no), data
model (no), audit/security (no — this audits *fgOS's own capture design*,
not a security surface), external systems (no), public contracts (no code
or schema changes at all), cross-platform (no), existing covered behavior
(no — nothing in the test suite is touched), weak proof around the area
(no), multi-domain (no). **0 flags.**

**Mode: small.** Not `tiny`, because the deliverable — one report file —
still requires several concrete, non-optional evidence-gathering steps
(D1's widened grep, Column B's own two-source read, a real measured
comparison table, a three-part definitive conclusion) rather than one
direct edit. Not `standard` or above: no gray areas remain (CONTEXT.md's
D1/D2 already closed both), no code is touched, and the whole item
collapses to a single artifact with a single verify command.

`fgos graph --json` confirms tsk-ma4 sits on real leverage (`topUnblock`:
unblocks 1 item, newly unblocks 2 — i.e. tsk-4op and whatever sits behind
it), which is why the report's conclusion has to be a real yes/no/estimate,
not a hedge.

## 2. Approach

One report, no split — this is a single honest piece of work producing
`plans/reports/<slug>-recording-points-audit-report.md` (slug: session's
choice, must match the item's `verify` glob
`plans/reports/*recording-points*-report.md`).

Order (each step feeds the next, no parallel-worthy pieces to compare via
`--what-if`):

1. **Column A — verify the six named + D1's wider search.** Confirm each
   citation is still accurate at its stated file:line (RUL13
   `src/runner/claim-port.mjs:150-160` + `src/runner/loop.mjs:712-722` +
   `bin/fgos.mjs:1448/1493`; RUL21 `composeLearning` at
   `src/state/store.mjs:497-503`; friction at
   `src/state/store.mjs:668-676`; `gates[id]` at
   `src/state/replay.mjs:166-172`). Then grep `docs/specs/work-state.md`
   and `src/` for any other capture point (other RUL-numbered rules, other
   append-only fields) not already in the six. Record what the wider
   search adds or confirms nothing new.
2. **Column B — what synthesis needs.** Cite `gate-dialogue-continuity`
   D3 (why / exchange-points / tradeoffs — three-part settle record) and
   `fgos-coding-compounding` SKILL.md's real input contract (`fgos check <id>` +
   `docs/history/<feature>/`, §1 of that skill). Per D2, also read the bee
   doc-types-lifecycle report and pull its concrete precedent (which of
   bee's 11 doc types are generated mid-lifecycle vs. at close, and what
   that implies for "batch at close loses the why").
3. **Comparison table.** Side by side, cite real evidence for where each
   column is thin — same measured-not-guessed bar the item itself sets
   (its own 2026-07-29 scan: 108 items / 23 docsRef / 17 CONTEXT.md dirs /
   3 acceptance — re-verify these live rather than reusing stale numbers,
   since the executing session runs on a later date).
4. **Conclusion — answer (a)/(b)/(c) definitively**, per the item's own
   acceptance clause 4: is there a real gap and where; does STR70a need to
   land before tsk-4op or does the gap sit elsewhere; if STR70a is needed,
   a rough size for its D4 prerequisite (fold `actor` into the gate
   record — scope in files/area touched, not an implementation diff).
5. **Verify.** `ls plans/reports/*recording-points*-report.md` (or the
   item's own current `verify` string) resolves to the written file.

Risk map: the only real risk is the report drifting into speculation
instead of citing real evidence (the item's own named failure mode) — no
proof point needed at `fgos-coding-validating` beyond confirming every claim in
the report traces to a file:line or a real count, per D1/D2.

## 3. Shape

Small-mode plan: the five steps above are the whole shape. No child
items — this collapses to one report, one verify command, no split
candidates worth comparing via `fgos graph --what-if`.

## 4. Cases worth proving against

- Every Column A citation still resolves at the stated file:line (code
  may have moved since the item was written).
- The wider D1 grep genuinely turns up nothing new, or genuinely finds an
  uncited mechanism — either outcome is a valid, honest result.
- The comparison table's ratios are recomputed live, not copied from the
  item's stale 2026-07-29 snapshot.
- The conclusion picks a side on (a)/(b)/(c) — a report that only lists
  evidence without answering the three questions fails acceptance clause
  4 outright.
