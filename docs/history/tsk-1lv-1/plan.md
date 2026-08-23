# PLAN: tsk-1lv-1 — fgos decision requires --relation, write-time citation sweep on supersede

Status: **delivered-pending-approve** (implemented, verified, returned;
this file satisfies the risk:heavy plan-evidence gate before `fgos
approve` lands it on `fgw/tsk-1lv`).

## Context

Split child 1 of 6 from `tsk-1lv` (parent docsRef:
`docs/history/canonical-decision-projection/`). Full design lives there —
`DISCUSSION.md` §6 (`#design`) + §7 (`#task-decision-relation-and-sweep`),
`plan.md`'s risk map row 1 and split-children entry 0, `CONTEXT.md` D2/D3/
D4/D8. This file does not repeat that reasoning — it records this child's
own shape and what actually shipped.

## Shape

- `fgos decision` (CLI verb, `bin/fgos.mjs`) now requires `--relation
  none|supersedes:<id>|touches:<id>` — every write declares its relation to
  prior decisions explicitly (D2). Enforced at the CLI layer only:
  `addDecision` (`src/state/store.mjs`) stays lenient so engine bookkeeping
  (`kind:'engine'`, `resolveDiscovery`/`resolvePlan`) and every existing
  test fixture calling it directly are unaffected (CONTEXT.md D4 —
  "bookkeeping máy ... không đổi").
- Text that reads like a supersession (`supersedes?|superseded|replaces?|
  overrides?|no longer applies|instead of the previous`, case-insensitive)
  without `--relation supersedes:<id>` is refused — closes STR72's own root
  cause (a supersession narrated only in prose the machine never saw).
- `--relation supersedes:<id>` runs a write-time citation sweep, widened
  from the pre-existing `docs/backlog.md`+`docs/specs/*.md`-only scope to
  `docs/**`+`src/**`+`plugins/**` (`scripts/check-decision-citation-drift.mjs`'s
  new `collectWideSourceFiles`/`findWideCitationFindings` exports). A
  dangling citation of the old id (no mention of the new one on the same
  line) is surfaced in the CLI's own JSON output (`danglingCitations`),
  non-blocking — task 5's 4-door (retrospective-time) is the close-time
  gate, not this write (D7: "fgos approve KHÔNG bị gate").
- `touches:<id>` exercises the same required-relation machinery but does
  not run the sweep (nothing is being superseded, so there is no
  "dangling" concept to check).

## Blast radius handled beyond the parent plan's declared footprint

Making `--relation` required breaks every existing CLI caller of `fgos
decision`, not just `addDecision`'s function callers —
`docs/how-to/find-every-caller-before-requiring-a-cli-flag.md`'s own
playbook (written from the `tsk-63c` precedent for this exact class of
change) was followed: a full-repo grep for the invocation shape itself
found 4 canonical D-ID-minting skills, `merge-loop`'s own call,
`command-registry.mjs`'s schema/example, and 8 test files asserting exit
`0`. All updated in the same commit — see `iron-law-evidence.md`'s own
"Blast-radius note" for the full list and why this was mechanical, not a
redesign.

## Acceptance criteria

- `node bin/fgos.mjs decision "supersedes old X" --rationale "..."` (no
  `--relation`) is refused, exit 4.
- The same call with `--relation supersedes:0012` succeeds, exit 0.
- `node --test test/state/decision-relation.test.mjs` — 20/20 green (unit
  coverage for `parseDecisionRelation`/`decisionTextLooksLikeSupersession`/
  `collectWideSourceFiles`/`findWideCitationFindings`, plus CLI-level
  coverage for the refuse/pass/sweep behavior).
- Full `npm test` (3502 tests) clean except two pre-existing, unrelated
  `test/runner/dispatch.test.mjs` failures caused by this worktree not
  carrying a committed `.fgos/config.json` (ADR0020) — confirmed present
  before this item's own changes.

## Dependencies

None (`deps: []` on the split-children entry) — this is the foundation
piece every other tsk-1lv child (2-5) depends on for the `--relation`/
`scope` field it establishes.

## Links

- `docs/history/canonical-decision-projection/plan.md` — parent plan,
  §Risk map row 1, §Split children entry 0.
- `docs/history/canonical-decision-projection/DISCUSSION.md` §6/§7.
- `docs/history/tsk-1lv-1/iron-law-evidence.md` — Iron Law proof + full
  blast-radius list.
