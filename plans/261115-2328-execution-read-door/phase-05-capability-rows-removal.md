# Phase 05: the business capability rows leave the standard; capability names become labels

Start after: 02, 03, 14 landed **and the owner's answers to Q2, Q3 and Q4** (this is the one phase that waits on the
owner; every other phase proceeds). Never at the same time as 09 (both edit `assignment-runner.mjs`) or 11 (both edit
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
skills route through. Q2-Q4 decide those; this phase carries out the answers.

## Requirements

1. Delete the rows the answers select from `core/config-standard/runner.yaml`: all 37 under Q3 (a) or (b); under Q3 (c)
   all but the rows the Work path and the coding skills route through (the set `rg` finds in `src/runner/work-*.mjs`,
   `domains/coding/**` and `core/skills/**` as `--for`/`--capability`/candidate names; listed in the report, each kept
   row becomes `debt` in phase 12's "capability rows hold jobs and tool abilities" row with `retiredBy: S7`).
2. Each deleted council and marketing row's `tier` and `rigor` go into the workflow units that name the capability:
   `rigor` as the unit's `rigor` (unless the unit already declares one at least as strong), `tier` as the unit `tier`
   (14). Ceilings (`maxTier: frontier` of `architecture:{shape,critique,synthesize}`) follow Q4.
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
4. Per the Q3 answer, the named consumers (F10): coding doctrine (`domains/coding/skills/fgos-coding-planning/SKILL.md`,
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

- `runner.capabilities` in the standard holds the five rows (plus the Q3 (c) debt rows, if chosen); the Req 5 table
  shows only answered differences; `seat-binding-dry-bind` passes for the seven council workflows;
  `rg -n "DEFAULT_CAPABILITY_SLOTS" src test` finds nothing.

## Risks / rollback

- A review or debug seat loses `host-write-denied` (M x H): Req 5 shows the confinement anchor per unit kind.
- Work coding dispatch changes (M x H): Req 5's `decide --work` rows; Q3 (c) keeps the Work path whole.
- Revert: one commit series (data, two lint rules, one catalog).
