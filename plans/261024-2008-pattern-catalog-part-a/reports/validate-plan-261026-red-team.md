# Red-team: plan validation of Part A phases 03–05

Reviewed worktree: `/home/vantt/projects/forgent-worktrees/cook-part-a`
HEAD: `43eedd9dd45e1146248909ae7fcc1d112928de4d` (Merge origin/main into cook/pattern-catalog-part-a)
Producer report: `.../producer/2/runs/01/worker-output/outbox/agent-report.md`
Mutation: read-only. No workspace edit. No test run, build, fetch, or lifecycle verb.

## Verdict

**findings** — the plan (phases 03–05 + scout/plan.md residue) is not executable as written against this HEAD. The producer’s high findings hold under independent re-check. A few producer phrasing misses do not overturn them. One extra medium plan miss is added below.

## Method

Re-read plan.md, phase-03/04/05, scout-facts.md, and the producer report. Confirmed symbols and paths in live sources (`src/config/facade.mjs`, `src/runner/dispatch/config.mjs`, loops/seat-resolver/run, setup/registrations, core schema/standard, packages/config rust tests/fixtures, architecture guard). Checked existence of every explicit phase-03/04 fixture path named for conversion. Confirmed deleted symbols/paths by absence + history (`2d587bb9b`, `38361f01d`, `2973f9177`, `8b8e5f23b`). `git status` clean before/after.

## Confirmed producer findings (independent evidence)

### P1 High — Branch B still executable in phase 03 despite U1 “Branch A only”

**Stale:** phase-03 G1 still selects A/B; Branch B column; steps 3/5 on `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`, `sanitizeGlobalLayer`, `fillShippedLayer`; writes still name `DEFAULT_RUNNER_CONFIG` / `FRESH_PROJECT_RUNNER_CONFIG`; risk row on Branch B fill. plan.md CFG gate (≈47–49), risk 2 (≈97), red-team A-1/A-4 (≈106–111) still talk fetch/Branch B/`global-config.mjs`. scout fact 2 still says facade not wired and loaders/merge path live.

**Now:** `src/config/facade.mjs` exports `readConfig` / `readStandardValue`. `config.mjs:29,199–215` loads only via `readConfig`; no write-on-read. `DEFAULT_RUNNER_CONFIG`, `loadRunnerConfigFromDir`, `ensureRunnerConfigForDir`, `sanitizeGlobalLayer`, `src/config/global-config.mjs` absent under `src/`. History: `2d587bb9b`, `fd30f9d4f`/`38361f01d`.

**Change:** unconditional Branch A; delete Branch B column/steps/fill proof/risk; gate = local facade wiring + whether catalog keys exist; refresh scout fact 2 and plan CFG residue. Keep CFG/SEAT coordination.

**Producer nit:** U1 itself does **not** claim “tests still use `DEFAULT_RUNNER_CONFIG`”. That residue is in phase-03/scout, not the U1 decision body. Refresh target is still correct.

### P2 High — `shippedCatalog()` should use `readStandardValue`, not re-parse YAML

**Stale:** phase-03 3b / CFG point 8: parse `core/config-standard/runner.yaml` like `TIER_LADDER_URL`, with facade standard reader as future option.

**Now:** `readStandardValue(path)` at `facade.mjs:62–63`. Runner already uses it (`config.mjs:179`). Patterns test derives standard via it (`dispatch-config-patterns.test.mjs:13–18`).

**Change:** keep adapter module for pure phase-05 boundary; body = `readStandardValue('runner')` (or narrower paths) → frozen `{ patterns, loops }`. Drop direct YAML/parseYaml path.

### P3 High — retired-key refusal must cover both runner input doors

**Stale:** Branch A table maps Config refusals only inside `loadRunnerConfigForDir`; helper described on raw runner object whose Branch B call sites are gone.

**Now:** `loadRunnerConfigForDir` rethrows ConfigDoorError code (`:203–206`). `loadRunnerConfig(configPath)` (`:223–241`) parses a named file and only `validateRunnerConfigShape` — no Config schema/standard layer. Pattern tests use this door. `packages/config/rust/src/validate.rs` appends child names for `required` only, not `additionalProperties`; values omitted from refusals.

**Change:** specify standalone-file path and Config-refusal classification separately; prove retired keys identifiable without values; project/global + named-file; mixed old/new; preserve other Config codes.

### P4 High — doctor caller must move with cumulative rule in phase 03

**Stale:** plan ownership “registrations.mjs 03 (tests only)”; phase-03 step 4 claims `registrations.mjs:91` imports only `VALID_CHECKER_SEATS` + marker.

**Now:** `registrations.mjs:85` imports `validateRunnerPatternsShape`; `checkRunnerPatternsConfig` (`:476–483`) validates only `effectiveSection(...).patterns`. Doctor fixture still writes old `defaultRule`/`reviewed` shape (`registrations.test.mjs:797–843`). No `VALID_CHECKER_SEATS` / seatBinding marker import in registrations today.

**Change:** put `registrations.mjs` in phase-03 writes; move doctor call to owner validation of patterns+loops when the cumulative rule moves; update doctor fixture in 3c; keep phase-09 resolver wiring distinct.

### P5 Medium — deleted/moved paths and stale line refs

**Confirmed missing/moved:**
- `test/setup/tier-ladder-comment.test.mjs` — gone (`8b8e5f23b`)
- `EXPECTED_RUNNER_DEFAULT` — absent from `registrations.test.mjs` (file ~901 lines; phase cites 1154–1190)
- `patterns/solo.mjs`, `patterns/architecture-guard.test.mjs` — loops live at `execution/loops/` (`2973f9177`)
- `validateRunnerPatternsShape` at `config.mjs:1254` (phase “today” still cites ~1469)
- marker `SEAT_BINDING_SCHEMA_VERSION` at `:247` (not :290)
- reviewed maxRounds reads at `reviewed.mjs:136,167` (phase-04 still :113,144)
- run seat sites at `run.mjs:713,736` (phase-04 cites :703,:726)
- snapshot still patterns-only (`run.mjs:149–165`) — loops hash still needed

**Present as intended new files:** `retired-config-keys.mjs`, `shipped-catalog.mjs`, `patterns/catalog.mjs`, `catalog.test.mjs` — absent.

**Phase-03/04 fixture paths** listed for conversion (run-verb, e2e-consumer, failover-fixture, playbook-observable-order, workflow-fixture-repo, run-case-admission, run-posture, run-sync, run.test, seat-resolver.test, advisory-m-contracts, architecture-advisory-workflow, config-snapshot-hash, tier-fallback, config-seat-binding-layers, loop modules/tests) — all exist.

### P6 High — 3a Node gate cannot pass before validator/fixture slice

**Stale:** verify 3a runs `dispatch-config-patterns.test.mjs` immediately after data/Rust.

**Now:** that test asserts standard `defaultRule`, old `reviewed` tuning, whitelist (`:27–37`). JS validator allows only `defaultRule|reviewed|seatBinding`, marker exactly 1 (`config.mjs:1254–1276`). Schema `seatBinding.schema` `const: 1` (`runner.schema.yaml` ~234). Standard still `schema: 1` + old patterns shape.

**Change:** one coherent data+validator+assertion slice, or keep 3a Rust-only and defer the Node gate; schema must accept markers 1 and 2 while standard supplies 2. Do not skip/weaken assertions.

### P7 Medium — Rust fixture write scope incomplete vs conditional two-file list

**Confirmed:** `authoring_equivalence.rs:191–220` pins SHA256 + differences/standard-only. `golden_migrate.rs:171–178` pins kept/redundant/retired/doc_converted counts. `registry-defaults.v1.json` about-text: runner belongs to authoring equivalence; defaults keys are 13 non-runner sections — runner-only edit need not touch registry-defaults. Saved `reports/phase-03a-take2-uncommitted.patch` is not landed code.

**Change:** name authoring-source + golden_migrate when they move; inspect registry-defaults, don’t gratuitously edit; migration.v1.json retirement path owns with U6/phase 09; revalidate any saved patch on this HEAD.

### P8 High — phase 04 drops config maxRounds fallback before phase 06 wires defaults

**Stale:** phase-04 req 8: loops use only `params?.maxRounds ?? DEFAULT_MAX_ROUNDS`; “config defaults resolved upstream.” Phase 05 has no production callers; phase 06 first wires `resolveCollaboration`.

**Now:** `loops/index.mjs:36–44` still `resolvePattern` → loops. `reviewed.mjs:136,167` and `seatLaunchesOf` (`seat-resolver.mjs:262`) still `params ?? cfg.patterns.reviewed.maxRounds ?? 2`. After phase 03 relocates to `loops.reviewed`, phase 04 removing that fallback makes a configured `maxRounds: 1` become 2 until phase 06.

**Change:** keep config fallback through 04/05; remove atomically with upstream resolution in 06 (or one slice). Param tables / checkerPlanOf can still land in 04.

### P9 Medium — phase 05 layer/provenance vs Config field origins

**Stale:** `checkCatalog({ shipped, effective, layers? })` with name-level layer labels from phase 03.

**Now:** `readConfig` origins are field-path (`facade.mjs:46–48`). Loader currently requests only `runner.modelPolicies` and `runner.rigorToTier` origins (`config.mjs:203`). Snapshot provenance is per path (`snapshot.rs` provenance/origins). Deep-merged entries can span layers; name-level label cannot name an offending invariant field’s layer; merged effective cannot show overridden invalid lower-layer values.

**Change:** validate effective vs shipped floors; attribute via offending field origin; define name-level `pin.pattern.layer` separately; if raw per-layer validation required, document missing door — no Config import in pure catalog.

### P10 Medium — cited architecture guard no longer covers `patterns/`

**Stale:** phase-05 + scout fact 4 cite patterns architecture guard for no `runner/dispatch` import.

**Now:** `test/runner/execution/loops/architecture-guard.test.mjs` scans only `src/runner/execution/loops` (`:7,22–25`). New `patterns/catalog*.mjs` is outside that scan. `test/architecture.test.mjs` / manifest still relevant but the cited guard does not prove catalog purity.

**Change:** extend/own a guard for `patterns/catalog*.mjs` (+ optional split); include any changed guard in phase-05 writes; keep Config adapter in dispatch/infra.

### Producer “what remains valid” — confirmed

Shipped runner data still old shape (no catalog eight names, no `runner.loops`). `checkerSeatsOf` + unconditional code red-team still at `seat-resolver.mjs:109–120`. Catalog module absent. `legacy-seat-read.mjs:40` still reads `cfg.patterns.reviewed.checkersByRigor` for old records. Snapshot omits loops. Serial ownership of seat-resolver/run still real.

## Additional finding (producer under-called)

### A1 Medium — phase 04 step 4 caller inventory is slightly wrong

**Stale instruction:** phase-04 step 4: re-grep callers; lists re-export `execution/case-admission-port.mjs:19` among `resolveSeats(` / `seatLaunchesOf(` callers as if both.

**What code says:** `case-admission-port.mjs:19` re-exports **only** `seatLaunchesOf`, not `resolveSeats`. Live `resolveSeats(` production callers: four loops + `run.mjs:713` + internal `seatLaunchesOf`. `seatLaunchesOf(`: `run.mjs:736` + re-export + tests/workflow ports.

**What to change:** fix the step-4 inventory to “seatLaunchesOf re-export only”; keep the re-grep instruction. Low severity vs P1–P8, but a worker following the list literally will search for a non-existent resolveSeats re-export.

## Producer report quality

| Area | Assessment |
|---|---|
| Branch A live / Branch B dead | Correct, well evidenced |
| readStandardValue door | Correct |
| Dual load doors + schema path limits | Correct |
| Doctor/registrations ownership | Correct; step-4 import claim even more wrong than stated (no VALID_CHECKER_SEATS import at all) |
| Deleted tests/paths | Correct |
| 3a Node gate ordering | Correct (static prediction, labeled as such) |
| Rust fixture scope | Correct; registry-defaults about-text confirmed |
| maxRounds fallback gap 04→06 | Correct, high risk |
| layers/origins | Correct |
| architecture guard scope | Correct |
| U1 / DEFAULT_RUNNER_CONFIG wording | Slight misattribution to U1 body |
| case-admission-port resolveSeats | Missed (A1) |
| Claimed no workspace mutation | Consistent with clean status here |

No producer high finding overturned. No evidence producer edited the workspace.

## Bottom line for the plan owner

Do **not** dispatch phase 03 as written. Minimum plan edits before execution: strip Branch B; wire shipped catalog through `readStandardValue`; cover both load doors for retirement; include registrations doctor migration; fix 3a verify ordering / marker 1+2; retain loops config fallback until phase 06; fix deleted paths and line refs; define catalog layer attribution; extend purity guard to `patterns/`. Then re-validate.

## Evidence refs (workspace)

- `src/config/facade.mjs` (readConfig, readStandardValue, ConfigDoorError)
- `src/runner/dispatch/config.mjs` (loadRunnerConfigForDir, loadRunnerConfig, validateRunnerPatternsShape)
- `src/runner/execution/loops/{index,reviewed}.mjs`, `seat-resolver.mjs`, `run.mjs`, `legacy-seat-read.mjs`
- `src/setup/registrations.mjs`, `test/setup/registrations.test.mjs`
- `test/runner/dispatch-config-patterns.test.mjs`
- `test/runner/execution/loops/architecture-guard.test.mjs`
- `core/config-schema/runner.schema.yaml`, `core/config-standard/runner.yaml`
- `packages/config/rust/src/validate.rs`, `tests/authoring_equivalence.rs`, `golden_migrate.rs`, `registry_defaults.rs`
- `packages/config/contracts/fixtures/registry-defaults.v1.json`
- plans under `plans/261024-2008-pattern-catalog-part-a/`
