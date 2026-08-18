# Storytelling-material probe (tsk-1hy) — plan

Mode: **small** — 0 flags apply (no auth, no authorization, no data-model
change, no audit/security surface, no external system, no public contract
— D1 explicitly keeps this out of `bin/fgos.mjs` and `package.json` `files`
— no cross-platform concern, no existing covered behavior touched, no weak
proof area, single domain). Footprint is two files plus one optional
report directory, no gray areas left open (`CONTEXT.md`'s "Outstanding
questions" is `None`). Per `fgos-routing`'s Mode gate, this sits at the
`tiny`/`small` boundary; `small` fits better than `tiny` because the
script's own logic (two independent read passes, five-pattern boilerplate
filter, before/after counting, grouping) is more than "one direct task",
even though the file count is small.

Impact-analysis posture (D9, `CONTEXT.md`): GitNexus present, freshly
checked. Not load-bearing here — this piece adds one brand-new script and
one brand-new test file; it edits no existing symbol, so there is no
blast radius to measure.

## Approach

One piece, no split. `scripts/probe-storytelling-material.mjs`:

1. Resolve the main-checkout root the same way `scripts/measure-verify-
   cost.mjs`/`scripts/verify-fanout-overlap.mjs` already do (`git
   rev-parse --path-format=absolute --git-common-dir`, D2), then read
   `.fgos/events.jsonl` via `readEvents` (`src/state/events.mjs`).
2. Vista (a): filter raw events to `type === 'work.move'` carrying
   `payload.ask` (D3) — the same field `src/state/replay.mjs:196-236`
   folds into `view.gates[id].ask`.
3. Vista (b): filter raw events to `type === 'decision'`
   (`src/state/replay.mjs:318-336`), group by `payload.rationale` text,
   keep only rationales whose group size is exactly 1. Before that
   filter, drop the five named boilerplate strings from D4 by exact
   match. Print the boilerplate-vs-real count both before and after
   (item's own acceptance criterion — "chứng minh bằng số lượng
   trước/sau khi lọc").
4. Group each vista for readability (D5, implementer's free choice —
   grouping by item id keeps both vistas traceable back to a work item,
   the most direct way to cite a real example later) and print to
   stdout. Write an optional Markdown report under
   `docs/history/compound-learn-artifact-registry/reports/` only if it
   turns out to help answer the probe question (D6) — not a required
   deliverable of this piece.
5. This session's own follow-up, after the script runs against the real
   log: read a real sample from each vista and answer the probe question
   — does the material show a real arc/turning point/disagreement, or is
   it just unusable notes — with verbatim quotes (D3, item's own
   acceptance criterion). This step is NOT inside the script; it is the
   actual deliverable `fgos-coding-implement` reports back.

Alternatives rejected: none carried into `CONTEXT.md` as a real
alternative — D1's two real reasons (probe-not-permanent, `bin/fgos.mjs`
footprint conflict) already rule out a `bin/fgos.mjs` verb; no other
architectural shape was on the table for a read-only probe.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Reading `.fgos/events.jsonl` from a worktree | light — matches an existing, already-proven pattern (D2, two sibling scripts already do this) | none needed beyond the item's own verify; no new risk introduced |
| Boilerplate filter correctness | light — five patterns are literal strings from the item's own pre-measured data (D4), not inferred | test asserts filtered/kept counts against a synthetic fixture (D8) that includes at least one instance of each of the five patterns plus at least one genuine single-occurrence rationale |
| Probe verdict quality (the real deliverable, step 5 above) | not a code risk — a judgment call this session makes after running the script, using real quotes | verified by presence of verbatim quotes in the final report to the user, not by `verify` |

No medium/high risk identified — nothing here carries to `fgos-coding-validating`
beyond confirming the plan and fixture design are real.

## Files touched

- `scripts/probe-storytelling-material.mjs` (new)
- `test/scripts/probe-storytelling-material.test.mjs` (new)
- `docs/history/compound-learn-artifact-registry/reports/` (new, only if
  a report turns out useful)

## Order

Single step — write the script and its test together (the test drives the
filter/grouping logic, per D8's fixture-based convention), then run it
once against the real repo log to produce the probe's actual answer.

## Outstanding questions

None
