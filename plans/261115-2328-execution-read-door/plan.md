---
title: "S5, the Execution read door: bind, the executor model, decide, hook and agents in Rust"
description: "One bind() in Rust over a written executor-model contract; dispatch decide/explain, hook dispatch-decide and agents native; the eight bridge:S5 doctor rows in Rust; capability step 2 (business rows out, runner.personas and runner.roles) with the councils' move to a domain."
status: pending
priority: P1
effort: 30d (12 executable phases; longest chain 01 -> 04 -> 06 -> 09 -> 10 -> 12, about 17d)
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
  contract (Execution owns it); Seat Binding keeps ranking; Node S6a callers ask the host route, never re-derive.
- `fgos dispatch decide`, `fgos dispatch explain`, `fgos hook dispatch-decide` and `fgos agents` are native
  (`route_kind`/`native_subcommands` in `command-routes.json`); their Node arms and use cases are gone. The program
  row's `tool` verb no longer exists (retired by `bf1a44f8d`); its lookup (`toolProvidersOf`) moves with decide.
- The eight `bridge:S5` doctor rows are judged in Rust and leave the bridge; their parity ran on S4's fixtures.
- Capability step 2: the 37 business rows (34 rows + 3 `<prefix>:*`) leave `core/config-standard/runner.yaml`;
  persona and role preferences live in `runner.personas` and `runner.roles`; capability names without a row are labels
  that still bind; the councils live in a named domain with their own tier and rigor; D-ADR0072's persona-file rule stands.
- `doors` rows: "bind a seat" allows only the Rust bind plus the named Node callers (each reason names S6a, or S7/S6b
  where that is the owner); "derive executor facts" lists the Node launch twins as debt `retiredBy: S6a`.

Non-goals: no new verb, flag or behaviour beyond the owner's step 2 (RUL104); launch, lease, transport and confinement
stay Node until S6a; Work code (S7) is not changed (`decide --work` reaches it through S4's bridge); no automatic
config-key migration mechanism (Q4); `fgos tool` is not revived.

## Decisions taken from evidence (no owner question needed)

| ID | Decision | Evidence |
|---|---|---|
| D1 | New crate `fgos-execution` (`packages/execution/rust`, contracts beside it), pure with small port traits; host adapters in `apps/fgos/src/wiring/` | F3: no executor-model owner exists; Seat Binding's spec excludes transport, confinement, personas (`seat-binding/spec.md:66-72`); `agent-protocol` holds adapters only; design principles 3, 7 |
| D2 | The Node route keeps its name `fgos internal seat-binding`, moves from the pure crate to host wiring, protocol 1 -> 2, ops `bind`, `explain`, `plan`, `ladder`; the old request shape and `route.rs` go in the same change | one Node client exists (`client.mjs`); doctor row id `seat-binding-route` stays meaningful; L10 |
| D3 | Rust bind takes the runner section from the request when a Node caller holds a run's snapshot, from `fgos-config` for native verbs | `run.mjs` loads config once per run; replay compares a config digest (`assignment-runner.mjs:309`) |
| D4 | Lease state is Dispatch's port: Node callers send an account-state overlay; Rust reads only the declared inventory | `seat-binding/spec.md` section 3 ("account state as a port; adapter provider-capacity"); `bind.mjs:211-247` |
| D5 | One dispatch decider, in Rust (route op `plan`); `compileDispatchPlan` keeps only the launch policy around it | callers `assignment-runner.mjs:1215` (S6a), `fanout-batch.mjs:75` (S7); a Node twin of the decision would be a second door |
| D6 | `decide --work` gets the Work hint through one new operation of S4's Node rows bridge, deleted with the bridge at S7 | the hint needs the Node-only domain registry (`work-compat.mjs:24`, `work-dispatch.mjs:279`); S4 Q3 (a) put init's Work step on the same bridge |
| D7 | Executor facts that Node launch code still needs (`familyOf`, `credentialStoreOf`, `renderedEffortLevels`, posture, effective rigor, herdr presence, generated-paths shape, agent listing) stay as declared twins reading the contract's vectors, `retiredBy: S6a` | launch is S6a's scope; the F0 twin pattern (`retiredBy`, one vector file) |
| D8 | The councils' move belongs in S5 and lands before the rows go; it does not have to precede S5 | F7: the loader already finds domain workflows (`loader.mjs:25-37`), no code prerequisite; workflows already declare `rigor` and seat `tier`; vision ties the rows to the move |
| D9 | A capability name with no row is a label that binds through `runner.personas`/`runner.roles`, the workflow seat tier and `tierFallback`; only a tool ability without its tool is refused | vision: "a project with no capability rows still runs"; F6 consumers |
| D10 | Doors rows and docs at the close (one writer of `doors`); deleting phases only drop their files' manifest entries | model plan D6; hot-file rule |
| D11 | Moved config keys are refused by name by the schema; this repo's config moves through the config door in 03; other machines follow the landing guide (Q4 offers an automatic fix) | `packages/config/rust/src/migrate.rs:1-10` migrates JSON to YAML only, so a key-move rule would be a new mechanism (RUL11: building a tool is a decision question); owner: machines upgrade together |
| D12 | S5 starts when S4 is on main; no S5 phase runs beside S4 | program rule "layers stay serial"; owner 2026-11 "one T at a time" |
| D13 | The `node src/runner/dispatch.mjs decide` alias goes with the Node decide (L10); `AGENTS.md` loses its sentence | `dispatch/cli.mjs:21,166`; one door |
| D14 | Parity runner restored on the integration branch only and deleted at close, as S4 does | S4 plan file set ("Tests (transitional, never reach main)") |

## Phases

| # | Phase | Owns (writes) | Start after | Effort | Status |
|---|---|---|---|---|---|
| 00 | [Facts, census, prior art](phase-00-facts.md) | (record only) | - | done | done |
| 01 | [Executor-model contract](phase-01-executor-model-contract.md) | `docs/platform/runner/contracts/executor-model.md`, `packages/execution/contracts/{executor-model,bind}.v1.json`, `test/runner/dispatch/executor-model-vectors.test.mjs`, `docs/platform/component-boundary.md`, runner pointers, `docs/reading-map.md` | S4 landed | 1.5d | pending |
| 02 | [Councils to a domain](phase-02-councils-to-domain.md) | `core/workflows/*` -> `domains/council/**`, references, renders | S4 landed | 1.5d | pending |
| 03 | [Taste tables `runner.personas`, `runner.roles`](phase-03-seat-binding-config-shape.md) | `packages/seat-binding/**` (model, policy, explain, golden), `core/config-schema/runner.schema.yaml`, standard roles/seats blocks, `capability-config.mjs`, `seat-policy.mjs`, `dispatch/config.mjs`, `agent-definitions.mjs`, `.fgos/config.yaml`, `docs/platform/seat-binding/spec.md`, `vision.md` | S4 landed; lands after 02 | 3d | pending |
| 04 | [Crate and executor model](phase-04-crate-executor-model.md) | `packages/execution/rust/{Cargo.toml,src/{lib,ports,executor_model}.rs,tests/golden_executor_model.rs}`, root `Cargo.toml`, `Cargo.lock` | 01 | 2.5d | pending |
| 05 | [Capability rows removal](phase-05-capability-rows-removal.md) | `core/config-standard/runner.yaml` rows, `propose-validate.mjs`, `capability-plan-lint.mjs`, `workflow-capabilities-configured` body, coding/marketing doctrine, renders | 02, 03 | 2.5d | pending |
| 06 | [Bind in Rust](phase-06-bind-in-rust.md) | `packages/execution/rust/src/{bind,explain,accounts}.rs`, `tests/golden_bind.rs` | 04, 03 | 3d | pending |
| 07 | [Decide, tools, hook verdict in Rust](phase-07-decide-tools-hook-in-rust.md) | `packages/execution/rust/src/{decide,tools,hook}.rs`, `tests/golden_decide.rs` | 04; lands after 06 | 2.5d | pending |
| 08 | [Agents listing in Rust](phase-08-agents-listing-in-rust.md) | `packages/execution/rust/src/agents.rs`, `contracts/agents.v1.json`, `tests/golden_agents.rs`, `test/runner/agent-listing.test.mjs` | 04 | 1.5d | pending |
| 09 | [Route protocol 2 and Node callers](phase-09-route-and-node-callers.md) | `apps/fgos/src/wiring/seat_binding.rs`, `main.rs` route line, `apps/fgos/Cargo.toml`, seat-binding `route.rs` (delete), `client.mjs`, `bind.mjs`, `seat-policy.mjs` (delete), `plan.mjs`, `mechanism.mjs` (delete), `assignment-runner.mjs` digest line, `unit-run-start.mjs`, `account-pin.mjs` | 06, 07, 05 | 4d | pending |
| 10 | [Native verbs](phase-10-native-verbs.md) | host `main.rs` providers, `routing.rs`, `cli_projector.rs`, `catalog.rs`, annotations, generated routes, `command-registry.mjs`, `verb-exit.mjs`, `bin/fgos.mjs`, `runner/hook.mjs`, `dispatch/{hook,decide,cli}.mjs`, `dispatch.mjs`, `explain.mjs`, `doctor-bridge.mjs` + contract, `AGENTS.md` sentence, `ARM_STATIC_IMPORTS`, parity runner | 09, 08 | 4d | pending |
| 11 | [Doctor rows](phase-11-doctor-rows.md) | `packages/execution/rust/src/checks.rs`, `contracts/checks.v1.json`, `apps/fgos/src/wiring/doctor/{execution,mod}.rs`, `doctor-registry.v1.json`, `registrations.mjs` (eight rows), omp/agy row modules | 05, 07, 09 | 2.5d | pending |
| 12 | [Doors, docs, close](phase-12-doors-docs-close.md) | `docs/architecture-manifest.json` `doors`, seeded cases, docs, `CHANGELOG.md`, `docs/backlog.md`, program S5 row, guide | 01-11 | 2d | pending |

## Parallel map

```text
wave 1:  01 contract      02 councils      03 taste tables (lands after 02)
wave 2:  04 crate (01)    05 rows out (02, 03)
wave 3:  06 bind (04, 03)   07 decide (04; lands after 06)   08 agents (04)
wave 4:  09 route + Node callers (06, 07, 05)
wave 5:  10 native verbs (09, 08)   11 doctor rows (05, 07, 09)
wave 6:  12 close (all)
```

- At the same time: 01, 02, 03; 04 with 05; 06, 07, 08; 10 with 11.
- Must wait: 03's landing for 02 (seat tiers move before the `seats` blocks go); 05 for 02 and 03; 06 for 03's crate
  shape; 07's purpose path for 06; 09 for 06, 07 and 05; 10 for 09 and 08; 11 for 05, 07, 09; 12 for all.
- Critical path 01 -> 04 -> 06 -> 09 -> 10 -> 12: 1.5 + 2.5 + 3 + 4 + 4 + 2 = 17 lead-days.
- Hot files, one writer at a time (landings serialized by OPC's MERGE order; the later lander rebases and regenerates):
  mutation census (every code phase), `test/suite-baseline.json` (01, 08, 09, 10, 11), `packages/execution/rust/src/lib.rs`
  (04 creates; 06, 07, 08, 11 add one `pub mod` line), `apps/fgos/src/wiring/mod.rs` (09, 10), `apps/fgos/tests/cli_tests.rs`
  (10, 11 add cases), `docs/architecture-manifest.json` (09, 10, 11 entry deletions; 12 doors), `apps/fgos/src/main.rs`
  (09 then 10), `src/setup/registrations.mjs` (05 then 11), `core/config-standard/runner.yaml` (03 then 05),
  `src/runner/execution/capability-config.mjs` (03, then 05 if needed, then 11), `docs/reading-map.md` (01 then 12).
  Every other file has exactly one owner.

## Data flow

Native verb: argv -> host routing (native lane) -> adapter reads the effective runner section (`fgos-config`), the
project root (invocation-root door), the assignment record (run-dirs door) or the Work hint (S4 bridge, `--work` only),
machine facts (PATH helper, backend registry via the global-directory door, herdr env) -> `fgos-execution`
(`executor_model` -> `bind`/`explain`/`decide`/`hook`/`agents`, ranking by `fgos_seat_binding::bind`) -> answer ->
`fgos.v1` envelope (or the hook protocol's exit code and text).
Node S6a caller: `bind.mjs` facade -> `{ask, runner snapshot, session, walk, accountState?}` -> `client.mjs` ->
`fgos internal seat-binding --protocol 2` -> the same `fgos-execution` functions -> binding (with the config digest) ->
caller. Doctor: host doctor engine -> `wiring/doctor/execution.rs` -> `fgos-execution::checks` -> row results.

## Test matrix

| Layer | Proof (owner) | Phase |
|---|---|---|
| Executor facts (family, mechanism, credential store, efforts, posture, governance, missing CLI, tool `for`) | `golden_executor_model.rs` over `executor-model.v1.json` | 04 |
| Node launch twins agree with the contract | `test/runner/dispatch/executor-model-vectors.test.mjs` (same vectors) | 01 |
| Ranking with `runner.personas`/`runner.roles` precedence | `packages/seat-binding/contracts/seat-binding.golden.v1.json` (one case per precedence row) | 03 |
| Moved per-capability keys refused by name | `packages/config/rust/tests/golden_validate.rs` | 03 |
| Bind, walk chain, explain answer, refusals, config digest | `golden_bind.rs` over `bind.v1.json` | 06 |
| Decide (every selector), tool posture, hook verdict | `golden_decide.rs` over `bind.v1.json` | 07 |
| Agent listing | `golden_agents.rs` over `agents.v1.json`; Node twin: one test in `agent-listing.test.mjs` | 08 |
| Route protocol 2 wiring, Node facade round trip | `test/seat-binding/client.test.mjs` (one wiring test) | 09 |
| Native verbs end to end, no Node child, hook protocols | `apps/fgos/tests/cli_tests.rs` (one case per verb), parity tables (transitional) | 10 |
| Eight doctor rows | `golden_checks.rs` over `checks.v1.json`; registry exact-set tests; per-row parity (transitional) | 11 |
| Labels bind; tool ability without tool refused | plan-lint and propose-validate tests; `checks-doctor-config.test.mjs` | 05 |
| Councils keep tier and rigor after the move | before/after dry-bind table; `test/workflow/core-workflow-seats.test.mjs` | 02 |
| Only the door binds, decides, derives | `test/architecture.test.mjs` live `checkDoors` plus seeded caught/passed cases per new row | 12 |
| Census matches the tree | `test/setup/git-mutation-census.test.mjs` | every code phase |
| Whole system | `cargo test --workspace`, one full `npm test` on the integration head (big lead's queue) | before landing on main |

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| The native PreToolUse verdict blocks or allows a call differently | M x H | hook vectors cover every branch; parity per protocol/format; non-config failures still allow (10) |
| Old Node payload meets the protocol-2 host, or the reverse | H x M | client refuses `host-version-mismatch` by name; host and payload activate in one window (landing) |
| Binding drift on the run path after the Node facade switch | M x H | vectors recorded from today's Node (01); before/after bindings in 09's report |
| A machine's config still holds `capabilities.<x>.{roles,personas,seats}` | H x M | refused by name; landing guide; Q4 |
| A review/debug seat loses bwrap confinement when `code:review`/`code:debug` go | M x H | `review` row takes the pins (05, Q3 default); dry bind per seat in 05's report |
| Work dispatch tiers drop when coding rows go | M x M | 05 Req 4 table; big lead decides before landing; Work code untouched |
| Per-row `prefer` orders lost (council and business rows) | H x L | owner's direction accepts it; listed in 05's report; Q2 |
| Twins drift before S6a deletes them | M x M | one vector file read by both sides (D7); doors debt with `retiredBy: S6a` |
| `decide --work` now needs Node through the bridge | L x L | same as today (Node), named cause when Node is missing; deleted at S7 |
| Parallel census/suite-line conflicts | H x L | regenerate-never-merge |
| S1 lands in between and edits `HookKind` | M x L | collision table; second lander rebases |

## Collision table

| Shared file or area | This plan | Other plan or lane | Mitigation |
|---|---|---|---|
| `src/setup/**`, `registrations.mjs`, `apps/fgos/src/wiring/doctor/**`, `doctor-registry.v1.json`, `doctor-bridge.mjs` | 05, 10, 11 | COOK S4 (`origin/rust-verb-migration-program/s4`, phases 04, 05, 07, 10, 12 open) | S5 starts after S4 lands (D12); re-read list in phase 00 |
| `apps/fgos/src/{main.rs,routing.rs}`, `catalog.rs`, `cli_projector.rs`, `command-registry.mjs`, `bin/fgos.mjs`, `verb-exit.mjs` | 09, 10 | S4 (same files), program S1 (hook kinds, `routing.rs` `HookKind`, hook registry entry, `src/runner/hook.mjs`) | after S4; with S1 the second lander rebases and regenerates routes |
| `docs/architecture-manifest.json`, `test/architecture.test.mjs` | 09, 10, 11 (entries), 12 (doors, seeded cases) | S4 rows; any lane adding a door row | additive; rebase and rerun `test/architecture.test.mjs` |
| `packages/git/contracts/mutation-census.v1.json` | every code phase | every product change on main | regenerate, never hand-merge |
| `packages/host-runtime/contracts/{command-routes,command-manifest}.json` | 10 | S4, S1 | regenerate after the other lander |
| `test/suite-baseline.json` | 01, 08, 09, 10, 11 | MAIL CI shards (`origin/mail/ci-shards-p01`/`p02`: shards weighted by its `fileCpu`), TEST lane | regenerate; if the shards land first, the refresh rule in their reading-map row applies |
| `docs/reading-map.md` | 01, 12 | MAIL shards p02 (the `test/` row), S4 close | different rows; rebase |
| `scripts/run-tests.mjs`, `.github/workflows/ci.yml` | not touched | MAIL shards | none; new test files are picked up by the shard planner |
| `docs/backlog.md`, `CHANGELOG.md` | 12 | S4 close, every lane | big lead serializes |
| `docs/platform/seat-binding/spec.md`, `docs/platform/runner/**`, `docs/platform/vision.md` | 01, 03, 12 | board: HARDEN, DOC | message DOC before landing if a DOC branch is open |
| `core/config-standard/runner.yaml`, `core/config-schema/runner.schema.yaml` | 03, 05 | any lane adding a config key | rebase; schema golden tests |
| `domains/**/compiled.json` | 02 | any domain edit | regenerate |
| `.agents/skills`, `plugins/fgOS/skills` renders | 02, 05 | any skill edit | `npm run build:skills` after rebase |
| `packages/execution/**` (new) | 01, 04, 06, 07, 08, 11 | none | - |

## Integration and landing

Integration branch `execution-read-door/integration` from post-S4 `origin/main`. Each phase lands there after OPC MERGE
on its pushed head. When 12 is in, the plan lead (big lead's queue) runs `cargo test --workspace` and one full
`npm test` on the integration head and tells `forgent-6a` the head; the big lead lands it on main as one series. The
host route protocol changes (D2), so landing on main is followed in the same window by: build, stage and activate the
release on this machine; `fgos doctor` through the installed shim; a board line; the owner-machine guide (12) linked
on the board. Machines upgrade together (owner).

## Rollback

Each phase is one revertible commit series (regenerate census and suite line on the reverted tree). Revert order: 12,
then 10 and 11, then 09, then 06-08, then 04 and 05, then 01-03. Reverting 09 after an activation needs the release
rebuilt and reactivated (protocol). Reverting 03 reverts this repo's config move with it. Reverting 05 restores the
rows; 02 can stay (the councils carry their own tier and rigor either way).

## Acceptance (measurable)

1. `rg -n "executorFacts|launchViewOf|accountViewOf|seatConfigOf|familyKeyed|resolvePersona|decideDispatchHook|explainCapability|decideExecutorCli" src bin` finds nothing; `src/runner/execution/seat-policy.mjs`, `src/runner/dispatch/{hook,mechanism}.mjs`, `src/runner/execution/explain.mjs`, `packages/seat-binding/rust/src/route.rs` do not exist.
2. `command-routes.json`: `dispatch.native_subcommands` contains `decide`, `explain`; `hook.native_subcommands` contains `dispatch-decide`; `agents.route_kind` is `native`.
3. With a failing `node` on `PATH`, `fgos dispatch decide --for review --needs-soul`, `fgos dispatch explain --for review`, `fgos hook dispatch-decide` (Claude payload) and `fgos agents list` answer (cli_tests).
4. `doctor-registry.v1.json` has no `bridge:S5` owner; the eight rows are in `inRust`.
5. `core/config-standard/runner.yaml` `runner.capabilities` keys are exactly `impact-analysis`, `pane-labeling`, `advise`, `execute`, `review`; the schema has top-level `personas` and `roles` and no per-capability `roles|personas|seats`.
6. The seven council workflows load from `domains/council/workflows/` with unchanged tier and rigor per unit.
7. `test/architecture.test.mjs` green with the rows "bind a seat", "derive executor facts", "decide a dispatch", "retired Node S5 code" and their seeded cases; every Node twin is `debt` with `retiredBy: S6a`.
8. `npm test` and `cargo test --workspace` green on the integration head; program S5 row marked landed.

## Ideas (not in scope; each needs the owner's pick, RUL104)

- Refuse every model field in persona files (`model`, `effort`, `executor`, `account`), not only `tier`/`prefer`: the
  vision says "persona files still carry no model fields" while `personaModelTasteProblem` refuses two
  (`agent-definitions.mjs:233-240`). Gain: one rule matches the doctrine. Cost: about 0.5d and a check of existing
  persona files.
- A key-move rule in Config (`fgos config migrate` moving renamed keys): gain on every future rename; cost: a new
  mechanism (Q4).
- `advisor` persona resolves nowhere (`architecture-advisory.yaml:27,89`): a backlog row to find where it should live.

## Owner questions (batch)

None blocks a phase: every phase runs with the default stated; another answer changes data, not code.

### Q1: what is the councils' domain called?

- **What is happening:** phase 02 moves the seven council workflows (`architecture-advisory`, `-reopen`,
  `business-discussion`, `council-lite`, `delphi`, `group-cognition`, `nominal-group`) from `core/workflows` into a
  domain, as `docs/platform/vision.md` section 6 directs ("move into a named domain").
- **Cause:** the vision names no domain; today only `coding` and `marketing` exist.
- **Options:** (a) `domains/council` (the word the vision and board use; 0 extra cost); (b) `domains/deliberation`
  (names the method family rather than one format; same cost); (c) split by method (architecture advisory vs
  structured group methods): two domains, about +0.5d, and personas may need a domain each.
- **Recommendation:** (a): one domain, the owner's own word; renaming later is a `git mv` and a regenerated registry.
- **Scope of the answer:** the directory name and `owningDomain` only; workflow names do not change.

### Q2: taste that has no place once the 37 rows go

- **What is happening:** phase 05 deletes the 37 rows. Tier and rigor move into the council workflows (02); role
  taste moves to `runner.roles` (03). Three kinds of taste have no single place: each row's own `prefer` order (five
  architecture orders differ from the three common shapes), the seat-level `prefer [openai, claude]` of
  `architecture:critique`, and the red-team order, which differs between `code:*` `[xai, claude, openai]` and
  `marketing:*` `[claude, openai]` while `runner.roles.red-team` holds one.
- **Cause:** the owner's rule "each kind of customization has exactly one place" keys taste by persona or role, not by
  capability.
- **Options:** (a) drop the per-row orders; `tierFallback` and `runner.roles` decide; red-team keeps the coding order
  (cost: council seats may land on another family first; no work); (b) carry each differing order into
  `runner.personas` for the personas those steps name (about +0.5d; only works where a step names a persona, and it
  changes those personas' taste everywhere); (c) keep this repository's own taste as project rows in
  `.fgos/config.yaml` (one override row per job is allowed), outside the shipped standard (about +0.5d; the rows live
  only where the owner wants them).
- **Recommendation:** (a), matching the stated direction; if specific council seats matter, (c) for those few.
- **Scope of the answer:** what phase 05 writes into the standard and this repo's config; no code changes.

### Q3: what do coding plans name once `code:*` rows go?

- **What is happening:** coding skills and shared docs tell planners to name `code:implement`, `code:review`,
  `code:test`, `code:debug`, `code:refactor`, `docs:write` (F6). `code:review`/`code:debug` carry
  `host-write-denied` confinement and bwrap invocation pins; `docs:write` carries tier `flagship`.
- **Cause:** step 2 keeps only the generic jobs and tool abilities as rows.
- **Options:** (a) plans name the generic jobs (`execute` for implement/test/refactor/docs, `review` for review/debug)
  plus a unit tier where the old row had one; the `review` row takes `code:review`'s pins (about 1d of doctrine text,
  already in 05); (b) keep the `code:*` names as labels with no row: they bind through defaults and **lose** the review
  confinement and pins (0 cost now, a weaker review seat); (c) keep `code:review` and `code:debug` as the one allowed
  job-override rows each (0.2d; two business names stay in the standard against the direction).
- **Recommendation:** (a): keeps the confinement, follows the direction, and the doctrine text changes once.
- **Scope of the answer:** phase 05's doctrine edits and the `review` row; Work dispatch code is untouched either way.

### Q4: moved config keys: refuse by name, or fix automatically?

- **What is happening:** after 03, a config that still writes `runner.capabilities.<x>.roles|personas|seats` is
  refused by the schema; `fgos config check` names each path. This repo's file is moved in 03; other projects and
  global files on each machine must be moved by hand following the landing guide.
- **Cause:** Config's `migrate` only converts JSON to YAML (`migrate.rs:1-10`); there is no key-move mechanism.
- **Options:** (a) refuse by name plus the guide (0 extra cost; every machine is upgraded together by the owner);
  (b) a `fgos doctor --fix` repair in the config group that moves the keys through the config write door (about 1.5d;
  a new fix, reusable for later renames); (c) a general key-move rule in `fgos config migrate` (about 2.5d; a new
  mechanism in Config).
- **Recommendation:** (a): one machine owner, few files, a clear refusal; (b) only if other projects are many.
- **Scope of the answer:** how machines move the keys; the schema change itself is the owner's 2026-11-14 decision.
