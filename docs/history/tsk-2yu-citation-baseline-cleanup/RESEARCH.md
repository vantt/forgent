# Research — tsk-2yu (citation-format baseline cleanup)

## Round 1 — 2026-08-18

**Asked:** Are the citation-drift baseline numbers cited in tsk-2yu's own
description still accurate live, and what governs the fix pattern for each
violation kind?

**Checked:**
- `scripts/check-decision-citation-drift.baseline.json` (parsed directly,
  73 top-level file keys, each value an array of `"<kind>:<id>:<line>"`
  strings) — computed totals/breakdown/per-file counts from the live file.
- `scripts/check-decision-citation-drift.mjs:1-25` — header comment naming
  the two finding kinds and the fix contract for each.

**Found:**
- Live baseline: 1788 total findings across 73 files. Matches the item
  description exactly.
- Kind breakdown (computed from the `<kind>:` string prefix on every
  entry): `d-local-outside-home` 1418 (79.3%), `bare-citation` 370 (20.7%).
  Matches the item description's 79%/21% split exactly. No `dead-framing`
  entries present (matches "0 today").
- Top 2 files by count: `docs/specs/work-state.md` 425,
  `docs/specs/runner.md` 412 — sum 837/1788 = 46.8% ≈ "47%" as described.
  Confirmed live, not stale.
- Fix contract per kind, per `check-decision-citation-drift.mjs:9-20`
  (script's own header comment, not just the item description's
  paraphrase):
  - `bare-citation`: an `ADR<n>`/`RUL<n>` id with no one-line gloss right
    after it — mechanical-ish fix, add `"<ID> (<one-line gloss>)"`, still
    needs real understanding of what the id means to write an accurate
    gloss.
  - `d-local-outside-home`: a `D<n>` id (a decision *local* to one
    CONTEXT.md) cited anywhere outside its own home file — script comment
    says explicitly "the only correct fix is inlining the content and
    deleting the id", citing "decision 0017" as the source of that rule.
    This matches the item description's framing verbatim; the rule lives
    in the script's own comment, not a separate decision doc to open.
- No open product/scope decision blocks moving forward: the item's own
  description already states the goal (real content fixed, not baseline
  re-stamped) and already recommends — as a strong suggestion, not a
  locked call — that planning split this into per-file/per-kind children
  starting with a top-2/3-file proof-of-approach slice. That split
  decision belongs to the `planning` stage itself (which file(s) first,
  how many children, how big each slice), not something `discovery` needs
  to pre-resolve.

**Still open:** none for discovery's own purpose. `planning` still has a
real judgment call to make (how to slice 1788 findings into digestible
children), but that is squarely in-scope for `planning`, not a gap
`discovery`/`exploring` needs to close first.
