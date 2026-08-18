---
type: context
title: Revive gate-bypass — wire the `## Outstanding questions` convention into the artifact-writing skills
tags: []
timestamp: 2026-08-08T00:00:00.000Z
source_capture_ids: []
---

# Revive gate-bypass — wire the `## Outstanding questions` convention into the artifact-writing skills

## Feature boundary

`gate-bypass.mjs`'s `canAutoApprove` requires `hasOpenItems(artifactText)` to
return `false`, which in turn requires the artifact (`CONTEXT.md` or
`plan.md`) to carry a section whose heading matches
`/^##\s*Outstanding questions\s*$/im` exactly (nothing appended on that
line) with a body starting `None` (case-insensitive). Neither
`.claude/skills/fgos-coding-exploring/SKILL.md` nor
`.claude/skills/fgos-coding-planning/SKILL.md` — the two skills that actually write
`CONTEXT.md`/`plan.md` — ever instructed the writing session to include this
section. Result: the bypass mechanism is enabled (`level: standard`) but
almost never fires (6/366 = 1.6% of history, 0 since 2026-08-07).

This item's boundary is exactly the two `SKILL.md` files' own prose
(teaching them to write the section that already works when present) plus
`test/state/gate-bypass.test.mjs` (regression coverage for the existing
`hasOpenItems`/`canAutoApprove` behavior). It does **not** touch
`src/state/gate-bypass.mjs` itself — `hasOpenItems`'s fail-closed regex is
an intentional, already-decided design (D2/D4,
`docs/history/gate-bypass/CONTEXT.md`), never loosened here.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The `## Outstanding questions` heading stays literal English, unchanged, in both `CONTEXT.md` and `plan.md` — never translated or reworded. `hasOpenItems`'s regex is fixed (out of this item's scope to edit) and already the dominant convention: 128/197 existing `CONTEXT.md` files match it exactly, including `docs/history/gate-bypass/CONTEXT.md` itself (the mechanism's own decision doc). The one near-miss found in scout (`docs/history/context-md-enforcement-scope/CONTEXT.md:83`, `## Outstanding, deferred to a follow-up item`) is a pre-existing outlier that never matched the regex either — left untouched, not this item's footprint. |
| D2 | `plan.md` follows the identical section shape as `CONTEXT.md`: a trailing `## Outstanding questions` heading (nothing appended on that line) with body `None` when nothing is outstanding, or a list of real open items otherwise. `hasOpenItems` is the same generic function applied to whichever artifact text is passed — there is no separate convention to invent for `plan.md`. Only 1/189 `plan.md` files match today (`docs/history/gate-approve-vs-movenext-semantics/plan.md`); the near-miss `docs/history/tsk-49a-runner-claim-race/plan.md` uses `## Outstanding questions carried to fgos-coding-validating`, which fails the regex's end-of-line anchor — direct proof the heading must be literal, not merely "start with the phrase." In the common case this section reads `None` in `plan.md`, since `fgos-coding-planning`'s own step 6 (Mid-planning `CONTEXT.md` gap) already routes any newly-discovered *material* question back into `CONTEXT.md`'s decision log before `plan.md`'s own gate is reached; only non-material, un-Assumption-worthy leftovers would ever populate this section with real content. |
| D3 | Tighten the item's `verify` field to match `docs/how-to/write-verify-for-a-skill-prose-change.md`'s required shape (`npm test && POSITIVE && NEGATIVE`), since this item edits `.claude/skills/**/SKILL.md` paths: `npm test` (full suite — the glob `test/**/*.test.mjs` already includes `test/state/gate-bypass.test.mjs`, so the item's original narrower `node --test test/state/gate-bypass.test.mjs` added nothing `npm test` doesn't already cover, and `npm test` is this repo's standard DoD proof per `AGENTS.md`) `&&` a heading-anchored grep in each `SKILL.md` `&&` a NEGATIVE proving `src/state/gate-bypass.mjs` itself was never touched by this item's diff — a mechanical, verifiable enforcement of this item's own "never loosen `hasOpenItems`" constraint, not just a stated intent. |

**Implementation-time correction to D3:** the heading-anchored grep first
written as `grep -q "^## Outstanding questions"` only matches a heading at
true column 0. The instruction each `SKILL.md` needed to carry a literal
example of the heading to stay unambiguous (trap #5), and that example is
naturally indented inside a numbered-list code block (3 spaces, matching
this repo's own list-continuation style) — so the real line in each
`SKILL.md` reads `   ## Outstanding questions`, which the original anchor
never matched. Corrected to `grep -Eq "^[[:space:]]*## Outstanding
questions[[:space:]]*$"` — still a heading-shaped-line-only match (trap #5
still honored: a bare, unanchored `"Outstanding questions"` substring check
would have been weaker), just tolerant of leading indentation. This does
not touch `hasOpenItems` itself or D1/D2 — `hasOpenItems`'s own regex reads
`CONTEXT.md`/`plan.md` at column 0 (a real top-level artifact section,
never inside a numbered list), so it was never affected by this bug.

## Pinned terms

- **The convention** — a trailing `## Outstanding questions` section (exact
  heading, nothing else on that line) whose body is `None` (case-insensitive,
  optionally followed by more prose on the same line, e.g. `None — all
  material product decisions locked`) when nothing is outstanding, or a real
  list of open items otherwise.
- **Artifact** — either `CONTEXT.md` (written by `fgos-coding-exploring`) or
  `plan.md` (written by `fgos-coding-planning`); `hasOpenItems` is generic over
  both, the two `SKILL.md` files just never taught their own writer to
  produce the section.

## Scout evidence

- `src/state/gate-bypass.mjs:112-122` (`hasOpenItems`) — the exact regex
  (`/^##\s*Outstanding questions\s*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/im`) and
  the `/^none\b/i` body check. `canAutoApprove` (line 130) short-circuits to
  `false` whenever `hasOpenItems` returns `true`.
- `grep -n "Outstanding" .claude/skills/fgos-coding-exploring/SKILL.md
  .claude/skills/fgos-coding-planning/SKILL.md` — zero matches in either file
  today, confirming the item's stated root cause.
- `rg -l "^## Outstanding questions" docs/history --glob "CONTEXT.md" | wc -l`
  → 128; same for `--glob "plan.md"` → 2, but only
  `docs/history/gate-approve-vs-movenext-semantics/plan.md` matches the
  regex exactly — `docs/history/tsk-49a-runner-claim-race/plan.md`'s
  `## Outstanding questions carried to fgos-coding-validating` fails the anchor,
  confirmed by direct regex test.
- `docs/history/context-md-enforcement-scope/CONTEXT.md:83` — the one
  pre-existing heading-wording variant found (`## Outstanding, deferred to
  a follow-up item`), also a non-match, left untouched (out of this item's
  footprint; scope creep to fix would be a separate follow-up).
- `docs/history/context-md-enforcement-scope/CONTEXT.md` D1-D4 — the
  neighboring item (`tsk-47e`, `executing`) enforces that an item **has** a
  non-empty `CONTEXT.md` at all (`docsRef` presence). This item enforces
  what the **content inside** an already-present artifact must contain to
  pass `hasOpenItems`. Two different layers of the same artifact
  discipline — not overlapping, not conflicting.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — required
  `verify` shape for any item touching `.claude/skills/**/SKILL.md`;
  informed D3.
- `package.json:23` — `"test": "node --test 'test/**/*.test.mjs'"`, confirms
  `npm test` already runs `test/state/gate-bypass.test.mjs`.
- Impact-analysis capability gate: `fgos tool query --capability
  impact-analysis --status present` → `gitnexus`, `status: present`.
  Posture: **full**. Informational only — this item edits skill prose, not
  a code symbol GitNexus's graph would blast-radius, so this does not
  reshape any decision above.
- No prior `judgeDiscovery` verdict recorded for `tsk-5hg`
  (`view.discovery["tsk-5hg"]` empty) — nothing to reconcile against.

## Canonical references

- `docs/history/gate-bypass/CONTEXT.md` — D1-D5, the original mechanism
  design; D2/D4 are why `hasOpenItems` itself is out of scope here.
- `docs/history/gate-question-quality-and-routing/DISCUSSION.md#task-revive-gate-bypass`
  — this item's own originating discussion thread (vòng 7-8), including the
  Q17 evidence this `CONTEXT.md` resolves.
- `docs/how-to/write-verify-for-a-skill-prose-change.md` — verify shape for
  skill-prose items.

## Outstanding questions

None — both candidate product decisions (Q17a heading wording, Q17b
plan.md section shape) were fully resolved from scout evidence: the
`hasOpenItems` regex is fixed and off-limits to loosen, and the repo's own
existing 128/197 `CONTEXT.md` convention plus the two near-miss variants
found (`context-md-enforcement-scope/CONTEXT.md:83`,
`tsk-49a-runner-claim-race/plan.md`) converge on one answer rather than
conflicting — no business judgment or reversibility risk remained for a
person to weigh in on.
