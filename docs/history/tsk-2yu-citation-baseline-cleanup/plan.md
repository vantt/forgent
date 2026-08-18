# Plan — tsk-2yu: citation-format baseline cleanup

Mode: **standard**

Lane decided via `fgos-routing`'s Mode-gate direct-entry fallback (no
`CONTEXT.md` exists — discovery verdict was `clear`, which skips
`exploring` — and no lane was handed off in prose along the `/fgOS:pick`
→ `fgos-coding-driving` → `fgos-coding-discovering` → this skill path).
Flag count against the hard-gate list (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof, multi-domain): **0** — this is
prose-only editing with no runtime/security/contract surface. But the
item is not "a couple of files, one direct task" either (tiny/small's own
description) — it is 1788 individually-judged content fixes across 73
files, several of them load-bearing spec docs. 0 flags with disqualifying
scale reads as **standard**: story-sized cleanup work, not a single
mechanical task.

## Locked decisions

None — `CONTEXT.md` does not exist for this item (discovery verdict
`clear` skipped `exploring`). See RESEARCH.md round 1 for the grounding
evidence this plan cites instead.

## Approach

**Goal (from the item's own description):** real content fixed, not the
baseline re-stamped to hide it.

**Real evidence (RESEARCH.md round 1, 2026-08-18):** the baseline is
1788 real findings across 73 files, live-verified: `d-local-outside-home`
1418 (79.3%), `bare-citation` 370 (20.7%), `dead-framing` 0. Top file:
`docs/specs/work-state.md` (425, 23.8% of total). `check-decision-
citation-drift.mjs:9-20`'s own header comment (not just the item's
paraphrase) documents the fix contract per kind:
- `bare-citation` — add `"<ID> (<one-line gloss>)"` right after the bare
  `ADR<n>`/`RUL<n>` id. Needs real understanding of what the id means to
  write an accurate gloss, but mechanical in shape.
- `d-local-outside-home` — a `D<n>` id (local to one CONTEXT.md) cited
  outside its own home file. "The only correct fix is inlining the
  content and deleting the id" (script's own comment, citing "decision
  0017"). Not mechanical: each one needs a real read of what that D-id
  said and a real rewrite.

**Why this cannot be one pass.** 1788 individually-judged content edits
is not "smallest honest plan" as a single piece — the item's own
description already says so explicitly, and recommends starting with a
top-2-3-file slice to learn real per-occurrence effort before committing
to a full plan for the remaining backlog.

**Scoping the first slice smaller than the description's own suggestion.**
The description's "top 2-3 files" framing is hedged ("a reasonable first
slice", "very likely") — a recommendation, not a locked decision. Picking
the single largest file (`docs/specs/work-state.md`, 425 findings, 23.8%
of the total, both kinds represented) gives the same calibration signal
— real per-occurrence effort, in a load-bearing spec file, across both
finding kinds — as a 2-3-file slice would, at roughly half the risk
surface and with a cleanly reviewable single-file diff. This keeps the
first execution slice to one file / one commit, matching `fgos-coding-
implement`'s own "one commit per item" convention, rather than
front-loading an unverified effort estimate across multiple files at
once.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `docs/specs/work-state.md` content edits | Low runtime risk (prose only, no code/behavior change) but real correctness risk per-occurrence (a wrong D-id inline, or a wrong gloss, silently misinforms a future reader) | The child's own verify: re-run the checker with `--write-baseline` and confirm this file's own baseline entry count drops to 0 — plus a human/agent spot-read of a sample of the actual inlined content against the D-id's real source, since the checker only detects *absence* of the citation-format defect, never *correctness* of the inlined prose |
| Baseline ratchet (`scripts/check-decision-citation-drift.baseline.json`) | Low — `--write-baseline` mechanically re-snapshots current findings | `git diff --stat` on the baseline file after the write-baseline run should show only removals for this file's entries, no additions elsewhere |

Impact-analysis capability gate (`CLAUDE.md`): not invoked — this slice
touches only Markdown prose in `docs/specs/work-state.md`, no
symbol/function/behavior GitNexus indexes. `impact-analysis: inactive`
for this plan (no blast-radius proof point depends on it).

**Files touched:** `docs/specs/work-state.md` (content edits, 425
occurrences), `scripts/check-decision-citation-drift.baseline.json`
(regenerated via `--write-baseline` after the fixes land).

## Split

One child this round — the calibration slice. The remaining 1363
findings across 72 files are deliberately NOT specced here: the item's
own description asks for the first slice's real effort to be known
before the rest is planned, and inventing 72 more child specs now, before
that signal exists, would be estimating in advance exactly what the
description says not to do. tsk-2yu stays anchored by this one child
until it lands; the remaining backlog gets its own planning round once
the first slice's real numbers are in.

```json
[
  {
    "title": "Fix citation-format violations in docs/specs/work-state.md",
    "verify": "node scripts/check-decision-citation-drift.mjs --write-baseline && node -e \"const d=require('./scripts/check-decision-citation-drift.baseline.json'); const n=(d['docs/specs/work-state.md']||[]).length; if(n!==0){console.error('still',n,'findings in work-state.md'); process.exit(1);} console.log('work-state.md citation findings: 0');\"",
    "action": "Fix all 425 citation-format findings in docs/specs/work-state.md per check-decision-citation-drift.mjs's own documented fix contract (script header, lines 9-20): for each bare-citation finding, add a one-line gloss right after the ADR<n>/RUL<n> id; for each d-local-outside-home finding, inline the real decision content the D<n> id refers to at the citing location and delete the id. This is tsk-2yu's own proof-of-approach slice — the largest single file (23.8% of the 1788-finding total) — chosen to calibrate real per-occurrence effort before planning the remaining 72-file backlog.",
    "footprint": ["docs/specs/work-state.md", "scripts/check-decision-citation-drift.baseline.json"],
    "kind": "chore",
    "risk": "standard"
  }
]
```

## Outstanding questions

None
