# Phase 05 report: business capability rows leave the standard; capability names become labels

Branch `execution-read-door/p05` (base `origin/main` 8b4602f5c). Owner answers applied: Q2 (a), Q3 (c), Q4 (a).

## What changed

- `core/config-standard/runner.yaml`: 26 rows deleted (architecture 5, business 5, delphi 2, group-cognition 3,
  nominal-group 4, marketing 3, `coding:explore|plan|validate|implement`); their own `prefer` orders, tiers, rigor
  and `maxTier` go with them. The `architecture:{critique,synthesize}` producer-seat orders and the `marketing:*`
  red-team order were already gone on main (phase 03). Comment beside `runner.roles`: stopgap, backlog p-bjmoxexuwi.
  Comment above the kept coding rows: stopgap, backlog p-nnbfsrxcss.
- Council units carry the moved values: `architecture:frame` unit rigor high + tier flagship; `shape` rigor critical +
  tier flagship; `critique` rigor high + tier flagship; `synthesize` (both workflows) rigor high -> critical (the row's
  critical was already the effective rigor) + tier flagship; `explain` (both) rigor critical + tier flagship;
  `business:synthesize` and both `delphi:synthesize` units tier standard.
- `.fgos/config.yaml`: `maxTier: frontier` (Q4).
- Labels (D9): `unservedToolAbilityOf` (tool-providers.mjs, owning test in `test/runner/dispatch/tool-providers.test.mjs`).
  A capability is a tool ability when a `kind: tool` executor lists it in `for` (name or alias); it is refused only
  when none of those tools is probed present or stale. Any other capability is a label, whatever its row holds
  (rows with only confinement, tier, rigor, a description, or empty). (Review F1: the first cut defined it as a row
  with no prefer and no serves, which caught ordinary label rows; replaced.) Consumers: `propose-validate.mjs` (code `capability-tool-unserved`, was `capability-unregistered`),
  `capability-plan-lint.mjs` (code `capability.tool-unserved`, was `capability.unregistered`; API now takes the
  runner config, `bin/fgos.mjs` passes it), doctor `workflow-capabilities-configured` (fails only for an unserved tool
  ability; the no-prefer-pool warning and `RUNNER_LOOP_CAPABILITY_USES` are gone).
- `DEFAULT_CAPABILITY_SLOTS` deleted (`rg -n DEFAULT_CAPABILITY_SLOTS src test` finds nothing). Unused lookups
  `isCapabilityDeclared`, `hasPreferPool` deleted.
- Strict confinement: shown on the post-change tree that a label seat launched unconfined in strict mode
  (`buildConfinementRequest`, omitted branch); it is now refused at launch by name (`confinement-policy-missing`).
  The lookup is exact-key, so an alias of a confined row is refused too; the message says an alias does not count
  (review F4).
- Phase 14 nits: `checked.mjs` ladder check kept with a comment (definition-time error naming step and unit);
  `unit.mjs` doc comment says outside-input builders must call `assertNoUnitTier`.
- Doctrine: `capability-catalog.md`, `planning-capability-awareness.md`, `fgos-cook/references/propose.md`,
  `fgos-architecture-panel/SKILL.md`; renders rebuilt (`npm run build:skills`). Docs: doctor how-to row, packaging spec
  row, doctor-registry description, runner subcomponent spec `docs:write` line, the advise/execute reference doc.
- Rust fixtures: `authoring-source.config.json` reshaped (removed rows dropped, `coding:implement` keeps only its
  prefer; new sha in `repo-differences.v1.json`); `golden_migrate.rs` redundant count 232 -> 166 and shrink factor
  5 -> 4 (the pinned source is 490 lines shorter); `golden_standard.rs` pool test reads the top-level
  `roles`/`personas` tables (the per-capability groups no longer exist) with threshold `>= 10`.

## Kept / deleted rows with rg evidence

| Row | Kept? | Evidence |
|---|---|---|
| `fgos-coding-implement` | debt | `work-dispatch.mjs` `workDispatchHint` -> `executorIdForWork` = the step skill; decide --work binds through its prefer pool |
| `code:implement` | debt | `work-compat.mjs:51` curated executing candidate; `propose.mjs` gate command; skills `decide --for code:implement` |
| `code:review` | debt | `work-compat.mjs:57` reviewer candidate; `host-write-denied` confinement |
| `code:test`, `code:debug`, `code:refactor`, `docs:write` | debt | `domains/coding/slice-kinds.yaml`, `fgos-coding-planning/SKILL.md`, `capability-catalog.md`, `fgos-run/SKILL.md` |
| `coding:discover` | debt (moved from deleted) | `work-dispatch.mjs:450-455` names the step Unit `${domain}:${step}`; computed for discovery and exploring stages (checked with `resolveCapabilityIdentityDetails` for kinds feature/task/spike) |
| `coding:*`, `code:*` | debt | tier advanced; `code:*` is the default red-team checker key (`seat-resolver.mjs:35-38`) |
| `coding:explore|plan|validate|implement` | deleted | no literal route; the computed Work names are `discover`, `<kind>`, `fgos-coding-planning`, `code:implement`, never these |
| council, business, marketing (22) | deleted | only workflow units name them; they are labels now |

The owner's estimate was 28-29; the evidence gives 26 deleted (the `marketing:*` wildcard was already gone). Proposed
phase-12 debt entry for every kept row: `kind: debt`, `retiredBy: S7`, reason "stopgap: the coding rows' behaviour gets
a proper home, no debt left (p-nnbfsrxcss)".

## Before/after table (taken after deletion)

Before = this tree's effective config with origin/main's deleted rows put back and `maxTier: flagship`, plus
origin/main's workflow files; after = this tree. Script output below, summarized; full output kept with the lead
on request.

- Every council and marketing seat: **tier identical** (source moves from `capabilities.<x>.tier` to
  `workflow:<id>/<unit>`); `architecture-advisory/shape-proposals/system` stays `frontier` (before: row `maxTier`;
  after: this repo's `maxTier: frontier`, Q4). Effective rigor identical (source text only). Checker plans identical.
  Confinement anchor `none` before and after. No seat refused.
- Executor/invocation: producer seats whose row had its own `prefer` now take `tierFallback.<tier>` (Q2): e.g.
  `architecture:frame` openai#pi-cli-bwrap -> claude#claude-cli-bwrap; `architecture:critique` producer xai -> claude
  and its reviewer/red-team move to keep families distinct; `architecture:shape` system openai -> claude,
  alternative claude -> openai. Checker seats keep `roles.reviewer`/`roles.red-team` as prefer source.
- Coding plan units (contract, platform, code, test, docs, docs follow-up): **identical** in every column.
- `decide --for <deleted name>`: out-of-process (row prefer) -> unavailable `selector.unregistered,capability.unknown`;
  with `--needs-soul --has-live-task-access`: out-of-process -> in-process, so the hook goes block -> allow (D9; Q3).
  `coding:implement` is unchanged because this repo's project config keeps its own row.
- `decide --work`: coding executing item and reviewer item unchanged (out-of-process gemini; step capability
  `code:implement` / `code:review`); discovery item unchanged.
- `seat-binding-dry-bind` on this tree: passed, 59 seats of 27 Workflow units bind (all seven council workflows).
  Note: the row read the main checkout's workflow files as project definitions, so the per-unit table above (which
  reads this tree's files) is the evidence for the new unit tiers.

Every difference is explained by Q2, Q3 or Q4; none unexplained.

## Retired test -> owner now

| Retired | Owner now |
|---|---|
| doctrine "P2-runtime slots carry no pin", "review is a curated slot with no pin" | behaviour removed (curated catalog deleted; standard rows carry taste) |
| doctrine "no two DEFAULT_CAPABILITY_SLOTS entries identical serves" | `test/setup/checks.test.mjs` capability-serves-valid |
| confinement p04 "R7 read-only slots unconfined" | behaviour removed (catalog deleted; standard rows declare host-write-denied) |
| doctor "names a capability config lacks", "prefix entry / bare verb", "warns no prefer pool", "clean with prefer pool" | `checks-doctor-config.test.mjs` "label passes" and "fails only for an unserved tool ability" |
| plan-lint phase units "flags every unit as unregistered", "exact key and prefix entry" | `capability-plan-lint.test.mjs` "lintPhaseUnits accepts a label and warns on a tool ability..." |
| capability-config `isCapabilityDeclared`/`hasPreferPool` assertions | behaviour removed (functions deleted); the tool-ability rule is owned by `tool-providers.test.mjs` |
| bind-committed-config claude-first cases for architecture/business rows | same test on `coding:discover` (dropped orders: Q2) |

## Gates run

- After review (F1, F4) and merging origin/main with a regenerated census: tool-providers, propose, propose-validate,
  capability-plan-lint, cli plan-lint, checks-doctor-config, yaml-parse-failures, capability-config,
  dispatch-confinement-policies, seat-binding-dry-bind, capability-catalog-doctrine, bind-committed-config,
  advisory-m-contracts, discussion-workflows, git-mutation-census, architecture, doc-health,
  check-decision-citation-drift, setup/checks: all green, no ERROR lines.

- Red commit c695a480d pushed first. Green head below.
- Node, one file per run via `scripts/run-tests.mjs`: 126 files (every file using the config fixture helpers,
  `useDistinctFamilies`, the touched modules, or a deleted name): 123 green first run; 3 fixed
  (bind-committed-config, yaml-parse-failures, advisory-m-contracts: fixture gets a `critical` checker row since its
  synthesis unit now declares critical) and green on rerun. Standard gates green: git-mutation-census, architecture,
  doc-health, check-decision-citation-drift, setup/checks. `git-one-door-scan`: 0 undeclared; census regenerated.
- Rust: `cargo fmt --all --check`, `cargo clippy -p fgos-config --all-targets -D warnings`, `cargo test -p fgos-config`,
  `cargo check -p fgos-config` for x86_64-pc-windows-msvc and aarch64-apple-darwin: green.

## Left / for others

- `src/cli/command-registry.mjs` plan-lint description ("unregistered capability shape") and the
  `explain --for architecture:synthesize` example are stale text; the manifest is regenerated only by phase 10, so I
  left both for it (the example still works: explain of a label).
- Phase 12: doors row "capability rows hold jobs and tool abilities" (debt entries above); specs still naming deleted
  symbols: `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:193` (`RUNNER_LOOP_CAPABILITY_USES`),
  `docs/platform/config/spec.md:161` and `docs/platform/seat-binding/spec.md:476` (`DEFAULT_CAPABILITY_SLOTS`); the
  CHANGELOG line must say another project with `maxTier: flagship` now has its architecture frontier seats capped at
  flagship. Lines added to the phase 10 and phase 12 files.
- `docs/reference/runner-capabilities-advise-execute-slots.md` still describes a retired `advise-execute-capabilities-configured`
  check (pre-existing, out of scope).

## Proposed `## [Unreleased]` line

- Council, business and marketing capability rows are gone from the standard; a workflow step names its capability as
  a label and declares its own tier and rigor. Propose, plan-lint and doctor refuse only a tool ability no tool
  executor serves; a strict-confinement project refuses a label seat at launch.

## Unresolved questions

- None.

Status: DONE
