# Phase 05: the 37 business capability rows leave the standard; capability names become labels

Start after: 02 and 03 landed. Wave 2. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F6, F7.
Worktree `erd-p05`, report slug `erd-p05-capability-rows`. Effort: 2.5d. Owner questions Q2 and Q3: the phase runs
with their defaults; another answer changes only data (config standard, skill text).

## Context

Step 2 of the owner's 2026-11-14 decision (`docs/platform/vision.md` section 6): the 34 business rows and 3 prefix
wildcards of `runner.capabilities` (F6) go; what remains is the tool abilities (`impact-analysis`, `pane-labeling`)
and the generic jobs (`execute`, `review`, `advise`); "a project with no capability rows still runs". 02 moved the
councils' tier and rigor into their workflows; 03 moved role taste to `runner.roles`. Today three consumers refuse a
capability without a row (F6): `src/workflow/propose-validate.mjs:159`, `src/report/capability-plan-lint.mjs:492-498,713`,
doctor `workflow-capabilities-configured` (`registrations.mjs:1903`, `bridge:S6b`).

## Requirements

1. `core/config-standard/runner.yaml`: delete the 34 business rows and the 3 `<prefix>:*` rows (F6 list). Per Q3
   default (a): the `review` row takes `code:review`'s `prefer` (`openai#codex-cli-bwrap`, `claude#claude-cli-bwrap`)
   so a review seat keeps its bwrap pins under `host-write-denied`; `execute` keeps its own `prefer` (the writer order
   the `code:*` rows repeated). No other row changes.
2. D9, capability names are labels: a capability with no row binds through the job-less defaults (Seat Binding:
   `roles`/`personas` tables, workflow seat tier, `tierFallback`). `propose-validate.mjs:159` and
   `src/report/capability-plan-lint.mjs:492-498,713` stop refusing an unregistered name; they still refuse a tool ability whose tool
   executor is absent (the rule for `kind: tool`, unchanged). Doctor `workflow-capabilities-configured` (Node body,
   still `bridge:S6b`): fails only for a tool ability without a tool executor; the "no prefer pool" warning goes
   (with no rows it would warn on every step). Wording names labels, not "unregistered capability".
3. Coding and marketing doctrine (Q3 default (a)): `domains/coding/skills/fgos-coding-planning/SKILL.md`,
   `domains/coding/slice-kinds.yaml`, `core/skills/_shared/{capability-catalog,capability-matching,planning-capability-awareness,executor-dispatch-fallback}.md`,
   `core/skills/fgos-run/SKILL.md`, `core/skills/fgos-cook/references/case-and-doors.md` name the generic jobs
   (`execute` for implement/test/refactor/docs, `review` for review/debug) plus a unit `tier`/`rigor` where the old row
   carried one (`docs:write` tier `flagship` becomes the unit's tier). `npm run build:skills` regenerates the render
   surfaces. `domains/marketing/workflows/content-publish.yaml` keeps its `marketing:*` names as labels (its rows held
   only `prefer`).
4. Work dispatch (S7, isolated): no Work code changes. Record in the report how each Work candidate list
   (`work-compat.mjs:38-54`, `work-dispatch.mjs` `coding:discover`) now resolves (the first registered candidate is the
   phase job, e.g. `execute`), with the tier it gets before and after; a tier that drops is reported to the plan lead,
   who asks the big lead before landing.
5. The persona `rigor` field and per-business `prefer` orders are not carried anywhere (Q2 default (a)); the report
   lists every dropped `prefer` with its row.

## Files

- Modify: `core/config-standard/runner.yaml`, `src/workflow/propose-validate.mjs`, `src/report/capability-plan-lint.mjs`,
  `src/setup/registrations.mjs` (the `workflow-capabilities-configured` body only), the doctrine files of Req 3,
  generated skill renders, their tests (`test/setup/checks-doctor-config.test.mjs:260-302`, the plan-lint and
  propose-validate tests `rg -l "capability-plan-lint|propose-validate" test` lists, `test/helpers/config-fixture.mjs:56-107`
  if it names a removed row), `packages/config/rust/tests/{golden_standard.rs,authoring_equivalence.rs}` if they name a
  removed row, mutation census.
- Delete: none. Tests retired: cases asserting "unregistered capability refused" and "no prefer pool warns", owner now
  the label rule's cases in the same files (named in the report).
- Net size: about -400 config lines, -40 / +30 Node, doctrine text edits.

## Steps

1. Red: plan-lint and propose-validate cases for a label without a row (accepted) and a tool ability without its tool
   (refused). 2. Delete the rows; update the consumers. 3. Doctrine text and renders. 4. Work resolution table.
5. Gates plus `test/workflow/*.test.mjs`, `test/setup/checks-doctor-config.test.mjs`, `cargo test -p fgos-config`.

## Acceptance

- `core/config-standard/runner.yaml` `runner.capabilities` holds exactly `impact-analysis`, `pane-labeling`, `advise`,
  `execute`, `review`; a project config with no `capabilities` key runs `fgos dispatch explain --for architecture:frame`
  and the doctor row `seat-binding-dry-bind` (which dry-binds every workflow unit, `src/setup/seat-binding-checks.mjs`)
  passes for the seven council workflows, without a refusal.
- `rg -n "code:review|code:implement|docs:write|code:test|code:debug|code:refactor" core domains --glob '!**/compiled.json'`
  finds only historical notes the report lists.

## Risks / rollback

- A review or debug seat loses its bwrap confinement (M x H): Req 1 moves the pins to `review`, whose
  `host-write-denied` confinement is unchanged; the report shows one dry bind each.
- Work tier drops (M x M): Req 4 table; big lead decides before landing.
- Revert: one commit series (data and two lint rules).
