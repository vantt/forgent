---
status: in-progress
created: 2026-10-20
---

# Pattern `debate` and role `judge`

Owner 2026-10-20 12:37: "pattern debate làm ngay"; 12:48: role `judge` added. Context: [Seat Binding draft](../reports/spec-draft-261020-1017-seat-binding-component.md) §3.0.1 and the owner answers section.

## Why

Dialectical Inquiry today (`core/workflows/group-cognition.yaml`, step `dialectical-inquiry`) runs the `reviewed` pattern: a red-team attacks a thesis, nobody builds a counter-plan, nobody rules. The method needs two sides arguing from opposite assumptions and an independent ruling. `synthesizer` merges; a `judge` chooses (or rules a side wrong) with reasons.

## Prior art

- No `debate` pattern exists. Collaboration patterns: `solo`, `reviewed`, `panel` (`src/runner/execution/patterns/`).
- A mission-lite "debate" mode existed and was deleted with mission-lite (`626e057b1`, coordination session store). Read it for ideas only; do not restore it.

## Shape

| Seat (role id today) | Role | Does | Model rule |
|---|---|---|---|
| `thesis` | producer | argues the position the unit states (or the strongest current answer) | blind in round 1 |
| `antithesis` | producer | reverses the thesis's load-bearing assumptions and argues the best opposing plan, never a straw man | blind in round 1; prefers a family different from `thesis` |
| `judge` | judge | reads both sides (and rebuttals), rules: which side holds, which claims fail, the decision and what would change it | read-only; **must** be a family different from both sides |

Rounds: round 1 blind arguments; round 2 (default on, `params.rebuttal: false` turns it off) each side reads the other's round-1 argument and answers it; then the judge. Seat role tasks are overridable through `params.roleTasks` like the other patterns; personas through the unit/overrides as today.

Seat naming follows the vocabulary the owner accepted (panel members are producers; seats carry their own names). Until Seat Binding lands, seat ids are the role strings the runner already uses (`thesis`, `antithesis`, `judge`); the role classification (`producer` vs read-only checker-like `judge`) is explicit in the pattern, not inferred from a name prefix.

## Units

| # | Unit | Done when |
|---|---|---|
| 1 | `src/runner/execution/patterns/debate.mjs` + registration (`index.mjs`, presets if a preset helps, every pattern-name validator incl. `src/workflow/definition.mjs`, guide schema, doctor rows that enumerate patterns such as `workflow-pools-satisfy-independence` / `blind-steps-use-proven-pools`) | unit tests: blind round 1, rebuttal sees only the other side, judge sees both, judge family ≠ both sides (refusal named when impossible), resume reuses passed seats like `panel` |
| 2 | `bind()` role classification: `judge` is read-only and out-of-process like a checker; `thesis`/`antithesis` like panel members (one place, no prefix guessing added) | bind tests |
| 3 | `group-cognition` step `dialectical-inquiry` uses `debate` (persona per side as today's lens text); `action-synthesis` reads the judge's ruling | workflow definition tests + `fgos workflow start group-cognition --dry-run`-style check if one exists |
| 4 | Specs: `docs/specs/workflow.md` (patterns), `docs/specs/runner.md` (roles, independence), CHANGELOG | doc guards green |

Live proof (big lead): one real `group-cognition` run, or a one-off unit with `pattern: debate`, three different families seated.

## Reversal trigger

- If judges merely restate one side (no ruling, no failing claims named) in the first real runs, add a required ruling schema to the judge's claim before using it more widely.
