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

## Round 2 — 2026-08-18 (validating: proof-surface check on the child's verify command)

**Asked:** does a bare `node scripts/check-decision-citation-drift.mjs
--write-baseline` actually reproduce the real 1788/73 baseline, as
`plan.md`'s first draft of the child verify command assumed?

**Checked:** ran it for real, then diffed the committed baseline file.

**Found — a real footgun, not just a documentation gap.** A bare
`--write-baseline` (no other flags) wrote a baseline with only **1128
findings across 12 files** — silently dropping 660 real findings across
61 files, because the script's default scan roots (`docs/backlog.md` +
`docs/specs/*.md` only, per `check-decision-citation-drift.mjs`'s own
`parseArgs`) never cover `.agents/skills/**` or
`plugins/fgOS/skills/**`, which together hold most of the remaining
files in the real baseline. Caught before it landed: `git diff --stat`
on the baseline file showed 782 line deletions from one dry-run command;
reverted with `git checkout -- scripts/check-decision-citation-drift.baseline.json`
before anything was committed.

The correct invocation (found in `docs/history/self-contained-id-
references/plan.md:205`, an existing precedent for this same script) is:

```
node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions \
  --backlog docs/backlog.md --specs-dir docs/specs \
  --skills-dir .agents/skills --skills-dir plugins/fgOS/skills [--write-baseline]
```

Verified live: the bare form (no `--write-baseline`) reports "no new
findings (1788 baselined)" (exit 0); the full form with
`--write-baseline` reproduces the exact 1788-finding/73-file baseline
(`git status` shows no diff afterward).

**Fixed:** `plan.md`'s child verify command now uses the full flag set
above. Any later child spec for this item's remaining backlog must use
the same full command — never a bare `--write-baseline` — or it will
silently corrupt the baseline the same way.
