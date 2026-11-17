---
title: "S5, the Execution read door: bind, the executor model, decide, hook and agents in Rust"
description: "One bind() in Rust over a written executor-model contract; dispatch decide/explain, hook dispatch-decide and agents native; the bridge:S5 doctor rows in Rust; capability step 2 (business rows out, runner.personas and runner.roles, unit tier) with the councils' move to a domain."
status: pending
priority: P1
effort: 38.5d (16 executable phases; longest chain 01 -> 04 -> 07 -> 09 -> 10 -> 12, about 18.5d)
branch: plan/execution-read-door
tags: [refactor, one-door, rust, host, execution, seat-binding, capabilities]
blockedBy: [rust-verb-migration-s4]
blocks: [rust-verb-migration-s6a]
created: 2026-11-15
---

# S5, the Execution read door

Source: row S5 of `plans/261114-2051-rust-verb-migration-program/plan.md` (on `origin/main` `8337d8788`), the S4 item
for S5 (`plans/261115-1501-rust-verb-migration-s4/plan.md` "Items for the program plan", S4 head `2f490135f`), and the
owner's 2026-11-14 decision in `docs/platform/vision.md` section 6 (capability step 2 rides with S5). Facts, census and
prior art: [phase-00-facts.md](phase-00-facts.md). Rules for every phase lead: [phase-lead-rules.md](phase-lead-rules.md).

## Outcome

- **One `bind()`**, composed in Rust (`packages/execution`, crate `fgos-execution`) over a written executor-model
  contract (Execution owns it); Seat Binding keeps ranking; Node S6a callers ask the host route and re-derive nothing.
- `fgos dispatch decide`, `fgos dispatch explain`, `fgos hook dispatch-decide` and `fgos agents` are native; their
  Node arms and use cases are gone. The program row's `tool` verb no longer exists (retired by `bf1a44f8d`); its lookup
  moves with decide.
- Seven of the eight `bridge:S5` doctor rows are judged in Rust; the eighth (`seat-binding-route`) stays on the bridge
  as `bridge:S6a`, with the Node callers it probes for (D15). Parity ran on S4's fixtures.
- Capability step 2: the business rows leave `core/config-standard/runner.yaml` (all 37, or all but the coding rows the
  Work path routes through, Q3); persona and role preferences live in `runner.personas` and `runner.roles`; a registered
  workflow unit declares its `tier`; capability names without a row are labels that bind as unit seats; the councils
  live in a named domain; D-ADR0072's persona-file rule stands; a Config repair moves old keys.
- `doors` rows: "bind a seat" allows only the Rust bind plus the facade's named callers (each with its owner step);
  every Node twin left for launch is `debt` with its `retiredBy`; the kept coding rows are `debt` with `retiredBy: S7`
  and a reason citing p-nnbfsrxcss.

Non-goals: no new verb or flag; no behaviour change beyond the owner's step 2 (RUL104: a port keeps behaviour, even a
known defect, which becomes a backlog row); launch, lease, transport and confinement stay Node until S6a; Work code
(S7) is not changed (`decide --work` reaches it through S4's bridge); `fgos tool` is not revived.

## Decisions taken from evidence (no owner question needed)

| ID | Decision | Evidence |
|---|---|---|
| D1 | New crate `fgos-execution` (`packages/execution/rust`, contracts beside it), pure with small port traits; host adapters in `apps/fgos/src/wiring/`. Extending `fgos-seat-binding` was rejected | F3: no executor-model owner exists; Seat Binding's spec excludes transport, confinement, personas (`seat-binding/spec.md:66-72`); `agent-protocol` holds adapters only; design principles 3, 7 |
| D2 | The Node route keeps its name `fgos internal seat-binding`, moves from the pure crate to host wiring, protocol 1 -> 2 (protocol checked before op), ops `bind`, `explain`, `plan`, `preflight`, `digest`, `ladder`; every request carries its runner section; the crate's own input protocol stays 1 | one Node client (`client.mjs`); route checks op before protocol today (`route.rs:46-53,70-76`); crate protocol check `lib.rs:45-53`; L10 |
| D3 | Rust bind takes the runner section from the request (Node callers' run snapshot); native verbs read it through `fgos-config` in process | `run.mjs` loads config once per run; replay digest (`assignment-runner.mjs:300-314`) |
| D4 | Account state is a port Seat Binding owns whose adapter is Dispatch's `provider-capacity` (Node until S6a): Node sends the adapter's read keyed by the lease document's provider keys; Rust maps pools to keys | `seat-binding/spec.md:67`; `provider-capacity.mjs:609-612`; `bind.mjs:211-247` |
| D5 | Rust decides for the native verb and for every selector that binds a seat (route op `plan`); Node `compileDispatchPlan` keeps the bind-free selectors (executor id, assignment, Work hint) for launch and fanout as a declared twin on the same vectors, `retiredBy: S6a` | those selectors spawn no host today (`assignment-runner.mjs:1215-1222`, `fanout-batch.mjs:68-80`); moving them adds a spawn per candidate |
| D6 | `decide --work` gets the Work hint through one new operation of S4's Node rows bridge, deleted with the bridge at S7 | the hint needs the Node-only domain registry (`work-compat.mjs:24`, `work-dispatch.mjs:279`); S4 Q3 (a) put init's Work step on the same bridge |
| D7 | Facts Node launch code still needs stay as declared twins reading the contract's vectors, `retiredBy` their owner step: `withDefaultExecutor`, `familyOf`, `lookupExecutor`, governance, `capabilityConfinementOf`, `credentialStoreOf`, `renderedEffortLevels`, posture, `decideExecutorDispatchMechanism`, effective rigor, herdr presence, `validateRunnerConfigShape`, `validateGeneratedPathsShape`, backend registry, account inventory and `legacyStateKey`, agent listing (unless 11 retires it) | launch is S6a's scope; the F0 twin pattern |
| D8 | The councils' move belongs in S5 as a pure data move; it need not precede S5 | F7: loader finds domain workflows (`loader.mjs:25-37`); no code prerequisite |
| D9 | A capability name without a row is a label that binds as a unit seat; decide's purpose rule is unchanged (only a purpose with its own `prefer` pool routes out of process), so the hook keeps allowing custom `subagent_type`s | F10 (`plan.mjs:354-395,577-592`, `dispatch/hook.mjs:56`); changing the rule would block every custom agent type |
| D10 | Doors rows and docs at the close (one writer of `doors`), patterns anchored on imports and definitions after enumerating every hit | model plan D6; red-team: `\bbind\(` matches 24 unrelated files |
| D11 | Moved config keys get a Config repair (`move-capability-taste`, phase 13) in Config's existing repair mechanism; refusing by name alone would make the hook block every Task call until a person edits the file | `packages/config/rust/src/repair.rs`, `doctor-rows.v1.json`; `dispatch/hook.mjs:50-54` |
| D12 | S5 starts when S4 is on main; no S5 phase runs beside S4 | program "layers stay serial"; owner "one T at a time" |
| D13 | The `node src/runner/dispatch.mjs decide` alias and `scripts/dispatch-decide-hook.mjs` go with the Node decide and hook, with every live mention | `dispatch/cli.mjs:21,166`; `scripts/dispatch-decide-hook.mjs:1-6`; F10 list |
| D14 | Parity runner restored on the integration branch once (09) and deleted at close | S4 file set ("never reach main") |
| D15 | `seat-binding-route` stays Node (`bridge:S6a`) | its rule ("probe the binary the Node client runs") needs a Node payload (`client.mjs:11-14,43-50`); a Rust copy would be an undeclared twin |
| D16 | Landing preconditions: no run in flight and no open mutating assignment; then activate; then `fgos doctor --fix` in every project | protocol 2 meets old payloads (`client.mjs:43-50`); the replay digest slice changes (F10); 13's repair |
| D17 | A registered workflow unit may declare `tier` (14); units files keep refusing it | owner direction "a workflow step declares the tier and rigor it needs"; `unit.mjs:10`, `seat-resolver.mjs:346-366` |
| D18 | The council domain is not a Work domain: no `registry.yaml`, no `compiled.json` | `domain-compile.mjs:22-26`, `domain-registry.mjs:66-82` |
| D19 | The native hook has its own lane outcome and normalizer (ported from `normalizeHookPayload`), cross-platform, exit 2 to block, a panic allows; the mailbox hook is not reused | mailbox lane is unix-only and exits 0 always (`wiring/mod.rs:14-18`, `mailbox_hook.rs:4-6`); `src/runner/hook.mjs:28-44` |
| D20 | The native decide, explain and hook run the runner's semantic config check (ported `validateRunnerConfigShape`) and treat its refusals as config refusals | `dispatch/config.mjs:714-777`; otherwise the guard turns fail-open |

## Phases

| # | Phase | Owns (writes) | Start after | Effort | Status |
|---|---|---|---|---|---|
| 00 | [Facts, census, prior art](phase-00-facts.md) | (record only) | - | done | done |
| 01 | [Executor-model contract](phase-01-executor-model-contract.md) | `docs/platform/runner/contracts/executor-model.md`, `packages/execution/contracts/executor-model.v1.json`, `test/runner/dispatch/executor-model-vectors.test.mjs`, `component-boundary.md` row, runner pointers, `docs/reading-map.md` | S4 landed | 1.5d | landed on main |
| 02 | [Councils to a domain](phase-02-councils-to-domain.md) | `core/workflows/*` -> `domains/council/**`, references, renders | S4 landed | 1d | landed on main |
| 13 | [Config repair for moved taste](phase-13-config-taste-move-fix.md) | `packages/config/contracts/doctor-rows.v1.json`, `packages/config/rust/src/{repair,doctor}.rs` + tests. Exists because step 2 would otherwise make a refused config block every agent Task call; repairs only the retired per-capability keys; stop and ask the plan lead if it grows | S4 landed | 1.5d | landed on main |
| 14 | [Workflow unit tier](phase-14-workflow-unit-tier.md) | `src/workflow/definition.mjs`, `seat-resolver.mjs`, `unit.mjs` (message), workflow spec, one line of seat-binding spec 6.1. Exists because step 2 would otherwise drop checker seats to the default tier; adds only the tier declaration on registered workflow units; stop and ask the plan lead if it grows | S4 landed | 1.5d | landed on main |
| 03 | [Taste tables](phase-03-seat-binding-config-shape.md) | `packages/seat-binding/**` (model, policy, explain, golden), schema, standard roles/seats blocks, `capability-config.mjs`, `seat-policy.mjs`, `dispatch/config.mjs`, `agent-definitions.mjs`, `.fgos/config.yaml`, seat-binding spec 6, `vision.md` | S4 landed; lands after 02, 13, 14 | 3d | landed on main |
| 04 | [Crate and executor model](phase-04-crate-executor-model.md) | `packages/execution/rust/{Cargo.toml,src/{lib,ports,executor_model}.rs,tests/golden_executor_model.rs}`, root `Cargo.toml`, `Cargo.lock` | 01, 15 | 2.5d | pending |
| 05 | [Capability rows removal](phase-05-capability-rows-removal.md) | standard rows, council/marketing unit tier+rigor, `propose-validate.mjs`, `capability-plan-lint.mjs`, `registrations.mjs` (catalog, workflow row), Q3 consumers | 02, 03, 14 S4 on main; never beside 09 or 11 | 3d | pending |
| 06 | [Bind in Rust](phase-06-bind-in-rust.md) | `packages/execution/contracts/bind.v1.json`, `src/{bind,explain,accounts}.rs`, `tests/golden_bind.rs` | 04, 03 | 3.5d | pending |
| 07 | [Decide, config check, tools, hook in Rust](phase-07-decide-tools-hook-in-rust.md) | `packages/execution/contracts/decide.v1.json`, `src/{runner_check,decide,tools,hook}.rs`, `tests/golden_decide.rs`, one vector test in `test/runner/dispatch.test.mjs` | 04, 03; lands after 06 | 4d | pending |
| 08 | [Agents listing in Rust](phase-08-agents-listing-in-rust.md) | `src/agents.rs`, `contracts/agents.v1.json`, `tests/golden_agents.rs`, `test/runner/agent-listing.test.mjs` | 04, 03 | 1.5d | pending |
| 09 | [Route protocol 2 and Node callers](phase-09-route-and-node-callers.md) | `apps/fgos/src/wiring/seat_binding.rs`, `main.rs` route line, `apps/fgos/Cargo.toml`, crate `route.rs` (delete), `client.mjs`, `bind.mjs`, `seat-policy.mjs` (delete), `plan.mjs`, `assignment-runner.mjs` (replay digest), `unit-run-start.mjs`, `account-pin.mjs`, parity runner | 06, 07; never beside 05 | 4d | pending |
| 10 | [Native verbs](phase-10-native-verbs.md) | host `main.rs` providers, `routing.rs`, `cli_projector.rs`, `catalog.rs`, annotations, generated routes, `command-registry.mjs`, `verb-exit.mjs`, `bin/fgos.mjs`, `runner/hook.mjs`, `dispatch/{hook,decide,cli}.mjs`, `dispatch.mjs`, `explain.mjs`, `scripts/dispatch-decide-hook.mjs`, `doctor-bridge.mjs` + contract, alias mentions, `ARM_STATIC_IMPORTS`, parity tables | 09, 08 | 4d | pending |
| 11 | [Doctor rows](phase-11-doctor-rows.md) | `src/checks.rs`, `contracts/checks.v1.json`, `wiring/doctor/{execution,mod}.rs`, `doctor-registry.v1.json`, `registrations.mjs` (rows), omp/agy row modules | 07, 08, 09; never beside 05 | 2.5d | pending |
| 15 | [Legacy invocation and launch code](phase-15-legacy-invocation-code-removal.md) | `provider-capacity.mjs` (credential store inference), `assignment-runner.mjs` (one line), `runner.schema.yaml` (duplicate launch fields), their tests and fixtures. Pure deletion (V4); stop and ask the plan lead if it needs a data change | S4 landed; lands before 04; never beside 05 or 09 | 1.5d | pending |
| 16 | [llmAccounts-only reader](phase-16-llm-accounts-only-reader.md) | `provider-capacity.mjs`, `llm-accounts.mjs`, schema entry `providers.<p>.accounts` (V3 code). Gated on design-lap's board line "all machines on llmAccounts" | that line; 06 landed; never beside 09 | 1d | pending |
| 12 | [Doors, docs, close](phase-12-doors-docs-close.md) | `docs/architecture-manifest.json` `doors`, seeded cases, docs, `CHANGELOG.md`, `docs/backlog.md`, program S5 row, guide | all | 2.5d | pending |

## Parallel map

```text
wave 1:  01 contract   02 councils   13 config repair   14 unit tier   15 legacy code   03 taste tables (lands after 02, 13, 14)
wave 2:  04 crate (01, 15)                           05 rows out (02, 03, 14; S4 on main)
wave 3:  06 bind (04, 03)   07 decide (04, 03; lands after 06)   08 agents (04, 03)
wave 4:  09 route + Node callers (06, 07)   16 llmAccounts-only reader (design-lap line, 06; not beside 09)
wave 5:  10 native verbs (09, 08)   11 doctor rows (07, 08, 09)
wave 6:  12 close (all)
```

- At the same time: 01, 02, 03, 13, 14; 04 with 05; 06, 07, 08; 10 with 11.
- Must wait: 03's landing for 02, 13, 14; 04 for 01; 05 for 02, 03, 14; 06, 07, 08 for 04 and 03; 07's
  purpose path for 06; 09 for 06, 07; 10 for 09, 08; 11 for 07, 08, 09; 12 for all. 05 never runs beside 09 or 11
  (shared `assignment-runner.mjs`, `registrations.mjs`): whichever starts first lands first.
- Critical path 01 -> 04 -> 07 -> 09 -> 10 -> 12: 1.5 + 2.5 + 4 + 4 + 4 + 2.5 = 18.5 lead-days. 05 is off it.
- Hot files, one writer at a time (landings serialized by OPC's MERGE order; the later lander rebases and regenerates):
  mutation census (every code phase), `test/suite-baseline.json` (01, 08, 09, 10, 11, 05), `packages/execution/rust/src/lib.rs`
  (04 creates; 06, 07, 08, 11 add one `pub mod` line), `apps/fgos/src/wiring/mod.rs` (09, 10), `apps/fgos/tests/cli_tests.rs`
  (10, 11 add cases), `docs/architecture-manifest.json` (09, 10, 11 entry deletions; 12 doors), `apps/fgos/src/main.rs`
  (09 then 10), `src/setup/registrations.mjs` (05, 11), `src/runner/dispatch/assignment-runner.mjs` (05, 09),
  `core/config-standard/runner.yaml` (03 then 05), `docs/platform/seat-binding/spec.md` (14, then 03, then 12),
  `src/runner/execution/seat-resolver.mjs` (14 then 05), `src/runner/execution/capability-config.mjs` (03, 05, 11),
  `test/runner/dispatch.test.mjs` (07, then 10), `docs/reading-map.md` (01 then 12), the transitional parity runner (09
  creates; 10 and 11 add separate table files). Every other file has exactly one owner.

## Data flow

Native verb: argv -> host routing (native lane, or the hook's own lane) -> adapter: project root (invocation-root
door), config root (worktree config first) and effective runner section (`fgos-config`), the assignment record
(`open_beneath`, capped) or the Work hint (S4 bridge, `--work` only), machine facts (PATH helper, backend registry,
herdr env) -> `fgos-execution`: `runner_check` -> `executor_model` -> `bind`/`explain`/`decide`/`hook`/`agents`
(ranking by `fgos_seat_binding::bind`) -> answer -> `fgos.v1` envelope, or the hook protocol's text and exit code.
Node S6a caller: `bind.mjs` facade -> `{ask, runner snapshot, session (pathEnv), walk, accountState?}` -> `client.mjs`
-> `fgos internal seat-binding --protocol 2` -> the same functions -> binding (with the digest it was bound under) ->
caller; pre-admission asks `preflight`; replay asks `digest` before rebinding. Doctor: host doctor engine ->
`wiring/doctor/execution.rs` -> `fgos-execution::checks` -> row results.

## Test matrix

| Layer | Proof (owner) | Phase |
|---|---|---|
| Executor facts (default executor, family, lookup, governance, capability confinement, mechanism, credential store, efforts, posture, missing CLI, account inventory, tool `for`) | `golden_executor_model.rs` over `executor-model.v1.json` | 04 |
| Node launch twins agree with the contract | `test/runner/dispatch/executor-model-vectors.test.mjs` (same vectors) | 01 |
| Unit tier recommendation (seat, then unit) | workflow definition and seat-resolver tests | 14 |
| Moved taste keys repaired, conflicts stop by name | Config crate repair tests | 13 |
| Ranking with `runner.personas`/`runner.roles` precedence | `seat-binding.golden.v1.json` (one case per precedence row) | 03 |
| Old per-capability keys refused | `packages/config/rust/tests/golden_validate.rs` | 03 |
| Bind, walk chain, explain, pre-admission facts, digest bytes (cross-language) | `golden_bind.rs` over `bind.v1.json` | 06 |
| Runner semantic check, decide (every selector), tool posture, hook normalization and verdict | `golden_decide.rs` over `decide.v1.json` | 07 |
| Node bind-free selectors agree with Rust | one vector test in `test/runner/dispatch.test.mjs` | 07 |
| Agent listing | `golden_agents.rs` over `agents.v1.json`; Node twin test while the twin lives | 08 |
| Route protocol 2, Node facade round trip | `test/seat-binding/client.test.mjs` (one wiring test) | 09 |
| Native verbs end to end, no Node child, hook protocols on every CLI | `apps/fgos/tests/cli_tests.rs` (one case per verb), parity tables (transitional) | 10 |
| Moved doctor rows | `golden_checks.rs` over `checks.v1.json`; registry exact-set tests; per-row parity (transitional) | 11 |
| Labels bind; decide routing per name; council tier, rigor, checker plan, confinement after the rows go | 05's before/after table; plan-lint and propose-validate tests; `checks-doctor-config.test.mjs` | 05 |
| Councils found in the domain; Work domain set unchanged | `core-workflow-seats.test.mjs`; domain registry test | 02 |
| Only the door binds, decides, derives | `test/architecture.test.mjs` live `checkDoors` plus seeded caught/passed cases per new row | 12 |
| Census matches the tree | `test/setup/git-mutation-census.test.mjs` | every code phase |
| Whole system | `cargo test --workspace`, one full `npm test` on the integration head (big lead's queue) | before landing on main |

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The native PreToolUse verdict blocks or allows differently | M x H | own normalizer and exit contract (D19), semantic config check (D20), hook vectors per CLI and per failure class, parity per protocol/format |
| Config with old taste keys makes the hook block every Task call | H x H | 13's repair; guide runs `doctor --fix` right after activation (D16); conflicts stop by name |
| Old payloads or in-flight assignments meet protocol 2 / the new digest | H x M | landing precondition: nothing in flight (D16); client maps an old host's answer to `host-version-mismatch` |
| Binding drift on the run path after the facade switch | M x H | vectors recorded from Node on the post-03 tree (06, 07); 09's measurement and end-to-end runs |
| Step 2 drops a seat's tier, ceiling, confinement or checker | M x H | 14 (unit tier), Q4 (ceiling), Q3 (coding rows), 05's after-deletion table with checker plan and confinement anchor |
| Work coding dispatch changes | M x H | Q3; 05's `decide --work` rows; Work code untouched |
| Twins drift before S6a deletes them | M x M | one vector file read by both sides (D7); doors debt with `retiredBy` |
| A door pattern too broad or too narrow | M x M | 12 enumerates hits first, anchors patterns, seeded cases |
| Parallel census/suite-line conflicts | H x L | regenerate-never-merge |
| S1 lands in between and edits `HookKind` | M x L | collision table; second lander rebases |
| The landed S4 bridge needs an operation dispatch for `--work` | M x M | re-read item 2; +0.5d in 10 |
| Phases 13 and 14 add mechanisms and grow beyond their purpose (a general config-key migration; more unit keys or a ceiling) | M x M | each exists only to keep step 2 from breaking the hook (13) or dropping checker seats to the default tier (14); 13 repairs only the retired per-capability keys, 14 adds only the unit `tier` on registered workflows; stop rule in both: the phase lead stops and asks the plan lead if the work grows past that |

## Collision table

| Shared file or area | This plan | Other plan or lane | Mitigation |
|---|---|---|---|
| `src/setup/**`, `registrations.mjs`, `apps/fgos/src/wiring/doctor/**`, `doctor-registry.v1.json`, `doctor-bridge.mjs` | 05, 10, 11 | COOK S4 (`origin/rust-verb-migration-program/s4`, phases 04, 05, 07, 10, 12 open) | S5 starts after S4 lands (D12); re-read list in phase 00 |
| `apps/fgos/src/{main.rs,routing.rs}`, `catalog.rs`, `cli_projector.rs`, `command-registry.mjs`, `bin/fgos.mjs`, `verb-exit.mjs`, `src/runner/hook.mjs` | 09, 10 | S4; program S1 (hook kinds, `HookKind`, hook registry entry) | after S4; with S1 the second lander rebases and regenerates routes |
| `docs/architecture-manifest.json`, `test/architecture.test.mjs` | 09, 10, 11 (entries), 12 (doors, seeded cases) | S4 rows; any lane adding a door row | additive; rebase and rerun `test/architecture.test.mjs` |
| `packages/git/contracts/mutation-census.v1.json` | every code phase | every product change on main | regenerate, never hand-merge |
| `packages/host-runtime/contracts/{command-routes,command-manifest}.json` | 10 | S4, S1 | regenerate after the other lander |
| `test/suite-baseline.json` | 01, 05, 08, 09, 10, 11 | MAIL CI shards (`origin/mail/ci-shards-p01`/`p02`, shards weighted by its `fileCpu`), TEST lane | regenerate; if the shards land first, their refresh rule (reading-map `test/` row) applies |
| `docs/reading-map.md` | 01, 12 | MAIL shards p02 (the `test/` row), S4 close | different rows; rebase |
| `scripts/run-tests.mjs`, `.github/workflows/ci.yml` | not touched | MAIL shards | none; new test files are picked up by the shard planner |
| `docs/backlog.md`, `CHANGELOG.md` | 12 | S4 close, every lane | big lead serializes |
| `docs/platform/seat-binding/spec.md`, `docs/platform/runner/**`, `docs/platform/workflow/spec.md`, `docs/platform/vision.md` | 01, 03, 12, 14 | board: HARDEN, DOC | message DOC before landing if a DOC branch is open |
| `core/config-standard/runner.yaml`, `core/config-schema/runner.schema.yaml`, `packages/config/**` | 03, 05, 13 | any lane adding a config key | rebase; schema and repair golden tests |
| `.fgos/config.yaml` (tracked) | 03 | the main checkout's uncommitted local edits (session `git status`) | landing guide reconciles them before the pull; never overwrite |
| `.agents/skills`, `plugins/fgOS/skills` renders | 02, 05, 10 | any skill edit | `npm run build:skills` after rebase |
| `packages/execution/**` (new) | 01, 04, 06, 07, 08, 11 | none | - |

## Integration and landing

Integration branch `execution-read-door/integration` from post-S4 `origin/main`. Each phase lands there after OPC MERGE
on its pushed head. When 12 is in, the plan lead (big lead's queue) runs `cargo test --workspace` and one full
`npm test` on the integration head and tells `forgent-6a` the head; the big lead lands it on main as one series (no
release is activated from the integration branch, so payload and host never meet halfway). Landing on main follows D16
on each machine: nothing in flight; reconcile the main checkout's local `.fgos/config.yaml` edits; build, stage and
activate in one window; `fgos doctor --fix` in every project; `fgos doctor` through the installed shim; a board line;
the owner-machine guide (12) linked on the board. Machines upgrade together (owner).

## Rollback

Each phase is one revertible commit series (regenerate census and suite line on the reverted tree). Revert order: 12,
then 10 and 11, then 09, then 06-08, then 04 and 05, then 03, then 01, 02, 13, 14. Reverting 09 after an activation
needs the release rebuilt and reactivated and nothing in flight (protocol). Reverting 03 reverts this repo's config
move with it; a machine whose config 13 already moved needs 13's move reversed by hand (`fgos config set/unset`), so
03 and 13 are reverted together only before activation. Reverting 05 restores the rows; 02 and 14 can stay.

## Acceptance (measurable)

1. `rg -n "executorFacts|launchViewOf|accountViewOf|seatConfigOf|familyKeyed|resolvePersona|decideDispatchHook|explainCapability|decideExecutorCli" src bin scripts` finds nothing; `src/runner/execution/seat-policy.mjs`, `src/runner/dispatch/hook.mjs`, `src/runner/execution/explain.mjs`, `scripts/dispatch-decide-hook.mjs`, `packages/seat-binding/rust/src/route.rs` do not exist.
2. `command-routes.json`: `dispatch.native_subcommands` contains `decide`, `explain`; `hook.native_subcommands` contains `dispatch-decide`; `agents.route_kind` is `native`.
3. With a failing `node` on `PATH`, `fgos dispatch decide --for review --needs-soul`, `fgos dispatch explain --for review`, `fgos hook dispatch-decide` (each CLI's payload) and `fgos agents list` answer (cli_tests); `decide --work` names the bridge cause.
4. `doctor-registry.v1.json` has no `bridge:S5` owner; the seven rows are in `inRust`; `seat-binding-route` is `bridge:S6a`; `layers` names no module as S5.
5. `runner.capabilities` in the standard holds the rows the Q3 answer leaves; the schema has top-level `personas` and `roles` and no per-capability `roles|personas|seats`; a registered workflow unit accepts `tier`.
6. The seven council workflows load from `domains/council/workflows/`; 05's after-deletion table shows only differences an owner answer explains.
7. `test/architecture.test.mjs` green with the rows "bind a seat", "derive executor facts", "decide a dispatch", "execution doctor judgments", "capability rows hold jobs and tool abilities", "retired Node S5 code" and their seeded cases; every Node twin is `debt` with its `retiredBy`.
8. `npm test` and `cargo test --workspace` green on the integration head; program S5 row marked landed; the close report records the port pace for the program's Q2.

## Ideas (not in scope; each needs the owner's pick, RUL104)

- Refuse every model field in persona files (`model`, `effort`, `executor`, `account`), not only `tier`/`prefer`: the
  vision says "persona files still carry no model fields" while `personaModelTasteProblem` refuses two
  (`agent-definitions.mjs:233-240`). Gain: one rule matches the doctrine. Cost: about 0.5d.
- "Find a program on PATH" has three Rust implementations (`packages/config/rust/src/detect.rs:92`,
  `packages/run-supervisor/rust/src/attempt_step.rs:82`, `packages/git/rust/src/driver.rs:294`) and no `doors` row; S5
  reuses one (09). Gain of gathering them: one door; cost about 1d (RUL11: outside this scope, its own item).
- `advisor` persona resolves nowhere (`architecture-advisory.yaml:27,89`): a backlog row to find where it should live.

## Owner questions (batch)

All four are answered (2026-11-17); no phase waits on the owner. Q2 and Q3 are stopgaps with tracked real fixes.

### Q1: what is the councils' domain called?

**Status: answered 2026-11-17: (a) `council`.**

- **What is happening:** phase 02 moves the seven council workflows (`architecture-advisory`, `-reopen`,
  `business-discussion`, `council-lite`, `delphi`, `group-cognition`, `nominal-group`) from `core/workflows` into a
  domain, as `docs/platform/vision.md` section 6 directs ("move into a named domain").
- **Cause:** the vision names no domain; today only `coding` and `marketing` exist.
- **Options:** (a) `domains/council` (the word the vision and board use; no extra cost); (b) `domains/deliberation`
  (names the method family; same cost); (c) two domains (architecture advisory vs structured group methods): about
  +0.5d.
- **Recommendation:** (a): one domain, the owner's own word; renaming later is a `git mv`.
- **Scope of the answer:** the directory name and `owningDomain`; workflow names do not change. Default (a) if unanswered.

### Q2: taste that has no place once the rows go

**Status: answered 2026-11-17 (relayed by HARDEN): (a). TEMPORARY (stopgap), real fix tracked in p-bjmoxexuwi.**

- **What is happening:** phase 03 moves role taste to one `runner.roles` table and phase 05 deletes the business rows.
  Three kinds of taste have no single place: each row's own `prefer` order (five architecture orders differ from the
  three common shapes); the producer seats of `architecture:critique|synthesize` (`seats.producer`: `tier: frontier`,
  `prefer [openai, claude]`); and the red-team order, which differs between `code:*` and `marketing:*` in the standard
  and in this repo's config (`[openai, xai]` vs `[claude]`; plus `reviewer [xai, openai]`), while `runner.roles` holds
  one value that now applies to every capability, councils included.
- **Cause:** the owner's rule "each kind of customization has exactly one place" keys taste by persona or role, not by
  capability or seat.
- **Options:** (a) drop the per-row and per-seat orders (`tierFallback` decides), give those producer seats the
  unit tier, and keep the coding red-team order and the reviewer order globally (no work; council seats may land on
  another family first, red-team seats of non-coding units change order); (b) as (a), but carry each differing order
  into `runner.personas` for the personas those steps name (about +0.5d; only where a step names a persona, and it
  changes that persona everywhere); (c) keep this repository's own taste as project override rows for the few jobs that
  matter (about +0.5d; lives only where the owner wants it).
- **Recommendation:** (a), matching the stated direction; add (c) for any council seat whose family order matters.
- **Scope of the answer:** what 03 and 05 write into the standard and this repo's config; no code.

### Q3: what happens to the coding rows the Work path and coding skills route through?

**Status: answered 2026-11-17 (relayed by HARDEN): (c). TEMPORARY (stopgap), real fix tracked in p-nnbfsrxcss.**

- **What is happening:** `fgos-coding-implement`, `code:implement`, `code:review`, `code:debug`, `code:test`,
  `code:refactor`, `docs:write`, `coding:*` are business rows, but they also carry behaviour: decide routes
  `--for code:implement` only because the row has a `prefer` pool (skills tell agents to do this,
  `fgos-coding-implement/SKILL.md:64`); Work dispatch names `fgos-coding-implement` and `code:review` (`work-dispatch.mjs:301`,
  `work-compat.mjs:57`); `code:review`/`code:debug` carry `host-write-denied` confinement and bwrap pins;
  `fgos-coding-implement` pins `gemini#omp-herdr`; the default red-team checker is keyed by `code`/`code:*`
  (`seat-resolver.mjs:35-38`); `coding:*` and `docs:write` carry tiers `advanced`/`flagship`.
- **Cause:** step 2 keeps only generic jobs and tool abilities as rows, and the owner set Work aside until its turn.
- **Options:** (a) rename everywhere now: skills, plans and Work's coding data name `execute`/`review` plus a unit
  tier; the `review` row takes the bwrap pins; the red-team default is re-keyed (about 2.5d; Work behaviour changes now,
  against "Work later"); (b) delete all the rows, Work untouched: Work's coding dispatch and the skills' `decide --for
  code:implement` lose their routing and review loses its confinement until S7 (no extra cost; a regression now);
  (c) delete the 28-29 council, business and marketing rows now; keep the coding rows the Work path and skills route
  through as named `debt` (`retiredBy: S7`) and remove them with the coding cutover (no extra cost; step 2 is complete
  except those rows).
- **Recommendation:** (c): it keeps confinement, routing and Work whole, and the remaining rows go with the Work step
  the owner already scheduled.
- **Scope of the answer:** which rows 05 deletes and which consumers it edits (F10 list); Work code is untouched under
  every option except (a).

### Q4: where does the architecture seats' `frontier` ceiling go?

**Status: answered 2026-11-17: (a) raise this repo's `maxTier` to `frontier`.**

- **What is happening:** `architecture:{shape,critique,synthesize}` carry `maxTier: frontier`, which lets their
  frontier seats (`architecture-advisory.yaml:39`, the two `seats.producer`) run above this repo's `maxTier: flagship`
  (`.fgos/config.yaml:176`). Once the rows go, a workflow can recommend `frontier` but cannot raise the ceiling, so
  those seats run at `flagship`.
- **Cause:** `maxTier` is the project's budget lever; the rows were the only per-capability exception.
- **Options:** (a) raise this repo's `maxTier` to `frontier` (only those architecture seats ask for `frontier`, so no
  other seat changes; no work); (b) accept `flagship` for them (cheaper runs, a weaker architecture panel); (c) a
  workflow-unit ceiling key (about 1d; a new budget mechanism).
- **Recommendation:** (a): same behaviour as today, no mechanism.
- **Scope of the answer:** this repo's project config (05 writes it); other projects keep their own `maxTier`.

## Owner decisions

Owner answers of 2026-11-17 (about 08:40), relayed by HARDEN and confirmed by the owner in the COMMUNICATION window at 08:34 the same day.

| Item | Decision | Effect |
|---|---|---|
| Q1 | The default: the councils' domain is `council` | Phases 02, 13 and 14 keep the name as written |
| Q4 | The recommendation: raise this repo's `maxTier` to `frontier` | Phase 05 writes it into this repo's config; other projects keep their own |
| Item 5 | The COMMUNICATION lane may lead the S5 phases | They still wait for S4 to be on main (D12) |
| Item 6 | Regenerate the four stale `.claude/agents` files (backlog p-bazzipipk5) | Consequence: the model lines drop and the agents run on the session's model; if the generator should write a model, that is its own item |
| Q2 | (a), relayed by HARDEN (not yet seen by the owner in the COMMUNICATION window). Owner: "ok with the recommendation, but it is only a stopgap". Drop the per-row `prefer` orders, the architecture producer-seat orders and tier, and the differing red-team order; the coding red-team order and the reviewer order are kept globally. **TEMPORARY (stopgap), real fix tracked in p-bjmoxexuwi** (priority medium: where provider taste per job or seat lives, if it needs a home at all) | Phase 05 writes it; council seats may land on another family first |
| V2, V3, V4 split | Owner, 2026-11-17 10:53 (relayed by HARDEN, not yet seen by the owner in the COMMUNICATION window): invocation and account config standardization is split between design-lap (forgentx-46: per-machine config and accounts to the new shapes (V1, V3 data), the invocation naming rule (V7, superseding agent-confinement spec.md:413), the agy stopgap (V5)) and S5 (code). V6 needs nothing. | S5 takes **V2** (invocation choice an explicit rule, generic forms preferred, pins hard, decided in the Rust bind or seat-binding rank, not the herdr-first override `bind.mjs:166-171`): folded into 06 (rule) and 09 (override deleted); stops if V7's naming rule is not on the board. **V4** (delete `credentialStoreOf` inference, duplicate executor-level launch fields in the schema, `FGOS_HERDR_PROMPT_DELIVERY`): phase 15. **V3 code** (delete the `providers.<p>.accounts` reader and schema entry): phase 16, gated on design-lap's board line "all machines on llmAccounts". Nothing starts before S4 is on main |
| Q3 | (c), relayed by HARDEN, same owner words. Delete the 28-29 council, business and marketing rows; the coding rows that Work and the skills route through stay as named `debt` entries with `retiredBy: S7`. **TEMPORARY (stopgap), real fix tracked in p-nnbfsrxcss** (priority high: the coding rows' behaviour gets a proper home, with no debt left) | Phase 05 writes it; the `debt` reason cites p-nnbfsrxcss |

## Red Team Review

Four reviewers (failure modes, assumptions, security, scope and contracts), 2026-11-15/16. 36 findings, deduplicated
to 20; 19 accepted (several partly), 1 rejected. Every accepted finding is applied in the files listed.

| # | Finding (severity, reviewers) | Disposition | Applied in |
|---|---|---|---|
| 1 | Labels do not bind on the decide path; removing rows flips hook routing (Critical, 3) | Accept: decide's purpose rule stays (D9); 05 checks decide and hook per deleted name; coding routing is Q3 | D9, 05, Q3, contract (01) |
| 2 | Moved config keys make the hook block every Task call (Critical) | Accept: Config repair in its existing mechanism (13), guide runs `doctor --fix` (D11, D16) | 13, 03, 12, D11 |
| 3 | Council `frontier` seats capped once rows go; before/after table taken too early (Critical) | Accept: Q4; 05's table after deletion | Q4, 05 |
| 4 | Native hook drops `validateRunnerConfigShape` refusals (High) | Accept: ported, config-refusal class (D20) | 07, 10, 01 |
| 5 | New Rust reads skip the hostile-input reader; assignment id path escape; registry env override (High) | Accept: `open_beneath` + cap, one-segment id, override kept as today | 09, 10, 01 |
| 6 | Mailbox hook lane/parser unfit (unix-only, exit 0, other root rule) (High, 2) | Accept: own lane and normalizer (D19) | 07, 10 |
| 7 | Units cannot carry `tier`; checker seats lose the row tier (High) | Accept: unit-level tier (14, D17) | 14, 05 |
| 8 | Coding rows carry routing, confinement, red-team default, omp pin; 20 consumers missed (High, 2) | Accept: Q3 with full costs; 05 lists every consumer | Q3, 05, F10 |
| 9 | Replay digest changes; in-flight assignments refused; digest read ambiguous (High, 3) | Accept: `digest` op before rebind; drain precondition (D16) | 06, 09, 12 |
| 10 | Old payloads mid-run meet protocol 2 (High) | Accept: drain precondition; old host answer mapped to mismatch | D16, 09 |
| 11 | Pre-admission helpers have no answer to read (High, 2) | Accept: `preflight` op | 06, 09 |
| 12 | Account overlay needs pool derivation in Node (High) | Accept: overlay keyed by the lease document's provider keys | 06, D4 |
| 13 | `plan` op adds spawns per dispatch and fanout (High, 2) | Accept: route only for binding selectors; bind-free selectors a Node twin (D5) | 09, 07, D5 |
| 14 | Vectors recorded before 03/05 change the shape (High) | Accept: 06/07/08 record their vectors on the post-03 tree, own files | 01, 06, 07, 08 |
| 15 | `compiled.json` needs `registry.yaml`, which would make a Work domain (High, 2) | Accept: no registry, not a Work domain (D18) | 02 |
| 16 | Undeclared twins: governance, lookup, capability confinement, `withDefaultExecutor`, config root, `pathEnv` (High, 2) | Accept: D7 list, contract, vectors, door patterns | 01, 04, 06, 07, 12 |
| 17 | Door patterns broad (`\bbind\(` hits 24 files) and Acceptance 7 wrong (High) | Accept: enumerate hits, anchored patterns, `retiredBy` per owner | 12 |
| 18 | Alias, legacy hook script and their consumers left behind (High) | Accept: full list, script deleted with a doctor check | 10, 11, D13 |
| 19 | S4 registry `layers` left saying S5; `seat-binding-route` cannot be judged in Rust; `ladder`/no-runner branch dead; parity runner double-restored; `mechanism.mjs` contradiction (Medium, 3) | Accept: layers rewritten; row stays `bridge:S6a` (D15) so `ladder` is used; no-runner branch dropped; 09 restores the runner once; `mechanism.mjs` stays a twin | 11, 09, D2, D15 |
| 20 | Labels escape strict confinement; global red-team taste removes review pins (High) | Partly accept: strict check refuses an unrowed label (05 Req 3); taste scope widening goes to Q2. Reject the "pins lost" part: posture carrying is a crate filter on invocations (`bind.mjs:155-172`), not a `prefer` pin, and decide judges posture at launch by design (`plan.mjs` `bindWorkSeat`, `postureAtLaunch`) | 05, Q2 |

Rejected without the evidence filter: none (every finding cited file:line).

### Whole-Plan Consistency Sweep

Decision deltas: seven rows move, `seat-binding-route` stays (`bridge:S6a`); route ops are six and carry the runner
section; bind-free selectors stay a Node twin, so `mechanism.mjs` stays; vectors split into `executor-model` (01),
`bind` (06), `decide` (07), `agents` (08), `checks` (11); no `compiled.json` for the council domain; council tier and
rigor move in 05 (not 02) through 14's unit tier; 05 waited on Q2-Q4 (all answered 2026-11-17, see Owner decisions); Q4 is now the ceiling question and the config-key
question became decision D11 (phase 13). Searched all plan files for `bind.v1.json` in 01, `compiled.json`,
`eight rows`, `mechanism.mjs is deleted`, `no-runner`, `none added per dispatch`, `Q4: moved config keys`,
`06 Req 3 ... phase 09 switches`: remaining hits are in this review section only, where they name what changed.

## Validation Log

### Verification Results
- Claims checked: 96 (planner self-check of every phase plus the reviewers' fact-check lists)
- Verified: 91 | Failed: 5 | Unverified: 0
- Tier: Full
- Failures (all corrected): `src/workflow/capability-plan-lint.mjs` (actual `src/report/capability-plan-lint.mjs`,
  refusal at :713-714); "run-dirs door reads the assignment record" (`run_dirs.rs:54-63` lists directories only);
  "the plan names a hostile-input reader" (added: `open_beneath`); `.fgos/config.yaml` "two red-team blocks" (three
  role blocks, `:90-116`); "a domain without `registry.yaml` gets a `compiled.json`" (`domain-compile.mjs:22-26`).

### Decisions (validate interview)

This plan runs as a delegated planner with no live owner channel; the critical questions were settled from evidence
(D1-D20). The four that depend on owner intent (domain name, lost taste, coding rows and Work, the frontier ceiling)
are Q1-Q4; all four are answered (2026-11-17); Q2 and Q3 are stopgaps tracked by p-bjmoxexuwi and p-nnbfsrxcss.
