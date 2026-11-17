# Phase 05: the business capability rows leave the standard; capability names become labels

Start after: 02, 03, 14 landed and S4 is on main (the owner's Q2, Q3, Q4 answers are in; Q2 and Q3 are stopgaps, see
plan.md "Owner decisions"). Never at the same time as 09 (both edit `assignment-runner.mjs`) or 11 (both edit
`registrations.mjs`): whichever starts first lands first. Rules:
[phase-lead-rules.md](phase-lead-rules.md). Facts: F6, F7, F10. Worktree `erd-p05`, report slug `erd-p05-capability-rows`.
Effort: 3d.

## Context

Step 2 of the owner's 2026-11-14 decision (`docs/platform/vision.md` section 6): the 34 business rows and 3 prefix
wildcards (F6) go; what remains is the tool abilities and the generic jobs; "a project with no capability rows still
runs". 03 moved role taste to `runner.roles`; 14 lets a registered workflow unit declare its tier. The red team showed
the rows carry more than taste (F10): decide routing (`purposeSeatOf` needs a row's own `prefer`), the `code:*`
confinement and invocation pins, the `maxTier: frontier` ceiling of three architecture rows, the default red-team
checker keyed by `code`, a second curated catalog (`DEFAULT_CAPABILITY_SLOTS`), and the names the Work path and coding
skills route through. The owner answered Q2 = (a), Q3 = (c) and Q4 = (a) (2026-11-17); Q2 and Q3 are stopgaps (real fixes: p-bjmoxexuwi, p-nnbfsrxcss);
this phase carries out exactly those answers.

## Requirements

1. Q3 = (c). Delete from `core/config-standard/runner.yaml` the 28-29 council, business and marketing rows of the F6
   census (`architecture:*` 5, `business:*` 5, `delphi:*` 2, `group-cognition:*` 3, `nominal-group:*` 4, `marketing:*`
   3 plus its wildcard, and the other business names no coding path routes through). Keep, as the coding rows the Work
   path and skills route through: `fgos-coding-implement`, `code:implement`, `code:review`, `code:debug`, `code:test`,
   `code:refactor`, `docs:write`, the `coding:*` wildcard and the `code:*` wildcard (default red-team checker key). The
   lead confirms the kept set with `rg` for `--for`/`--capability`/candidate names in `src/runner/work-*.mjs`,
   `domains/coding/**` and `core/skills/**`, lists it in the report, and moves a row between deleted and kept only
   when `rg` shows a route through it (the 28-29 count is the owner's estimate). Each kept row becomes `debt` in phase
   12's "capability rows hold jobs and tool abilities" row with `retiredBy: S7` and a reason citing p-nnbfsrxcss
   ("stopgap: the coding rows' behaviour gets a proper home, no debt left").
1a. Q2 = (a). Drop each deleted row's own `prefer` order, the `seats.producer` orders and tier of
   `architecture:{critique,synthesize}` (`tierFallback` decides; those seats take the unit tier), and the differing
   red-team order of `marketing:*`. Keep the coding red-team order and the reviewer order globally in
   `runner.roles` (03). Leave a one-line note beside `runner.roles` that this is a stopgap tracked by p-bjmoxexuwi.
   Q4 = (a): this repo's `maxTier` becomes `frontier` in `.fgos/config.yaml`.
2. Each deleted council and marketing row's `tier` and `rigor` go into the workflow units that name the capability:
   `rigor` as the unit's `rigor` (unless the unit already declares one at least as strong), `tier` as the unit `tier`
   (14). Ceilings (`maxTier: frontier` of `architecture:{shape,critique,synthesize}`) follow Q4 = (a).
3. D9, labels: a capability with no row binds as a unit seat through `runner.personas`/`runner.roles`, the workflow
   tier and `tierFallback`. Decide's purpose rule does not change: a name without its own `prefer` pool is never
   routed out of process (`plan.mjs:354-395`), so a custom `subagent_type` keeps being allowed by the hook. Consumers:
   - `src/workflow/propose-validate.mjs:159` and `src/report/capability-plan-lint.mjs:492-498,713-714` accept a label;
     both still refuse a tool ability whose tool executor is absent.
   - `DEFAULT_CAPABILITY_SLOTS` (`registrations.mjs:1651-1735`) is deleted (L10: one catalog); the plan lint's
     registered set is read through `capability-config.mjs`; `test/setup/capability-catalog-doctrine.test.mjs` and
     `test/report/capability-plan-lint.test.mjs:21` move to the standard file as their source.
   - Doctor `workflow-capabilities-configured` (Node body, `bridge:S6b`): fails only for a tool ability without its tool
     executor; the "no prefer pool" warning goes.
   - Strict confinement (`dispatch/config.mjs:736-755`) checks rows only; show on the post-change tree whether a
     strict-mode project refuses a label seat at launch; if not, the strict check refuses a workflow unit whose label
     has no row, by name (strict means every capability declares confinement).
4. Per Q3 = (c) (kept coding rows stay; only consumers of the deleted names change), the named consumers (F10): coding doctrine (`domains/coding/skills/fgos-coding-planning/SKILL.md`,
   `domains/coding/skills/fgos-coding-implement/{SKILL.md,references/implement-and-collaboration.md}`,
   `domains/coding/slice-kinds.yaml`, `core/skills/_shared/{capability-catalog,capability-matching,planning-capability-awareness,executor-dispatch-fallback}.md`,
   `core/skills/fgos-run/SKILL.md`, `core/skills/fgos-cook/references/{case-and-doors,propose}.md`), `propose.mjs:450`
   (gate command), `seat-binding-checks.mjs:28` (`CORE_CAPABILITIES`), `registrations.mjs:1866`
   (`RUNNER_LOOP_CAPABILITY_USES`), `assignment-runner.mjs:897` (default capability), `seat-resolver.mjs:35-38,114-118`
   (default red-team checker key), `command-registry.mjs:1597,2692` (examples); `npm run build:skills` after doctrine edits.
5. Before/after table, taken **after** the rows are deleted, for every council unit, the marketing workflow units and one
   coding plan unit of each kind: tier and its source, rigor, checker plan, confinement anchor, invocation, prefer
   source; plus `decide --for <name> [--needs-soul --has-live-task-access]` and the hook verdict for every deleted name,
   and `decide --work` for a coding executing and a reviewer item. Every difference is explained by an owner answer;
   an unexplained one stops the landing (report to the plan lead).

## Files

- Modify: `core/config-standard/runner.yaml`, the council and marketing workflow files (unit `tier`/`rigor`),
  `src/workflow/propose-validate.mjs`, `src/report/capability-plan-lint.mjs`, `src/setup/registrations.mjs`
  (`DEFAULT_CAPABILITY_SLOTS`, `workflow-capabilities-configured`, and per Q3 `RUNNER_LOOP_CAPABILITY_USES`), per Q3 the
  files of Req 4, `src/runner/dispatch/config.mjs` (strict check, if Req 3 needs it), generated renders, their tests,
  `packages/config/rust/tests/{golden_standard.rs,authoring_equivalence.rs}` if they name a removed row,
  `test/suite-baseline.json`, mutation census.
- Delete: none. Tests retired: "unregistered capability refused", "no prefer pool warns", and the
  `DEFAULT_CAPABILITY_SLOTS` cases; owners named in the report.
- Net size: about -450 config lines, -120 / +60 Node, doctrine text edits.

## Acceptance

- `runner.capabilities` in the standard holds the five rows plus the Q3 (c) kept coding rows as `debt`; the Req 5 table
  shows only answered differences; `seat-binding-dry-bind` passes for the seven council workflows;
  `rg -n "DEFAULT_CAPABILITY_SLOTS" src test` finds nothing.

## Risks / rollback

- A review or debug seat loses `host-write-denied` (M x H): Req 5 shows the confinement anchor per unit kind.
- Work coding dispatch changes (M x H): Req 5's `decide --work` rows; Q3 = (c) keeps the Work path whole.
- Revert: one commit series (data, two lint rules, one catalog).
