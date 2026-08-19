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
of the total) instead of 2-3 files already halves the risk surface and
keeps the first execution slice to one file / one commit, matching
`fgos-coding-implement`'s own "one commit per item" convention.

**Validating found an even smaller honest path (reality gate, "smaller
path" dimension).** `docs/specs/work-state.md`'s 425 findings are not one
uniform kind: 124 `bare-citation` (add a one-line gloss — mechanical
shape) and 301 `d-local-outside-home` (inline real content and delete the
id — genuine research+rewrite per occurrence). Lumping both into one
child muddies the calibration signal the item's own description asks
for: "how long each occurrence actually takes" cannot be read cleanly off
an average of two very different effort profiles. **Revised first slice:
`bare-citation` findings in `docs/specs/work-state.md` only (124
findings)** — the true smallest calibration step, with a clean,
single-kind effort signal. The file's remaining 301
`d-local-outside-home` findings are deferred to the same follow-on
planning round as the other 72 files, not specced as a second child now
(a second child touching the same file concurrently would also risk a
footprint collision with the first, which a single-kind-then-defer split
avoids entirely).

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `docs/specs/work-state.md` bare-citation edits (124) | Low runtime risk (prose only, no code/behavior change) but real correctness risk per-occurrence (a wrong or misleading one-line gloss silently misinforms a future reader) | The child's own verify: re-run the checker with `--write-baseline` and confirm this file's own `bare-citation` entry count drops to 0 — plus a human/agent spot-read of a sample of the actual glosses added against the real `ADR<n>`/`RUL<n>` id they describe, since the checker only detects *absence* of the citation-format defect, never *correctness* of the gloss text |
| Baseline ratchet (`scripts/check-decision-citation-drift.baseline.json`) | Low — `--write-baseline` mechanically re-snapshots current findings | `git diff --stat` on the baseline file after the write-baseline run should show only `bare-citation` removals for this file's entries, no additions elsewhere, and the file's `d-local-outside-home` entries unchanged |

Impact-analysis capability gate (`CLAUDE.md`): checked live —
`fgos tool query --capability impact-analysis --status present` reports
GitNexus registered and `present` (posture `full`, not `inactive`: a
provider IS registered on this machine). No proof point in this plan
leans on blast-radius evidence though, and correctly so — this slice
touches only Markdown prose in `docs/specs/work-state.md`, no
symbol/function GitNexus indexes exist for a citation-format edit to
break. `impact-analysis: full (unused — no code-symbol change in this
slice)`.

**Files touched:** `docs/specs/work-state.md` (content edits, 124
`bare-citation` occurrences), `scripts/check-decision-citation-drift.baseline.json`
(regenerated via `--write-baseline` after the fixes land).

## Split

One child this round — the calibration slice, revised to a single kind
(see "Validating found an even smaller honest path" above). The
remaining 1664 findings (301 `d-local-outside-home` in `work-state.md` +
1363 across the other 72 files) are deliberately NOT specced here: the
item's own description asks for the first slice's real effort to be
known before the rest is planned, and inventing more child specs now,
before that signal exists, would be estimating in advance exactly what
the description says not to do. tsk-2yu stays anchored by this one child
until it lands; the remaining backlog gets its own planning round once
the first slice's real numbers are in.

```json
[
  {
    "title": "Fix bare-citation findings in docs/specs/work-state.md",
    "verify": "node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e \"const d=require('./scripts/check-decision-citation-drift.baseline.json'); const remaining=(d['docs/specs/work-state.md']||[]).filter(e=>e.startsWith('bare-citation:')); if(remaining.length!==0){console.error('still',remaining.length,'bare-citation findings in work-state.md'); process.exit(1);} console.log('work-state.md bare-citation findings: 0');\"",
    "action": "Fix the 124 bare-citation findings in docs/specs/work-state.md per check-decision-citation-drift.mjs's own documented fix contract (script header, lines 9-20): add a one-line gloss right after each bare ADR<n>/RUL<n> id, in the shape \"<ID> (<one-line gloss>)\". This is tsk-2yu's own proof-of-approach slice, narrowed at validating to the single easier kind in the largest file (work-state.md, 23.8% of the 1788-finding total) so the calibration signal is not muddied by mixing it with d-local-outside-home's much heavier real-rewrite effort. work-state.md's own 301 d-local-outside-home findings are deferred to the follow-on planning round, same as the other 72 files.",
    "footprint": ["docs/specs/work-state.md", "scripts/check-decision-citation-drift.baseline.json"],
    "kind": "chore",
    "risk": "light"
  }
]
```

## Outstanding questions

None
