---
title: "Capability reads through one door (step 1 of the capability-rows decision)"
description: "Every reader of runner.capabilities goes through bind() or one named read port next to it; config, bindings and reads stay identical."
status: pending
priority: P2
effort: 12.5h
branch: plan/capability-reads-one-door
tags: [runner, seat-binding, config, refactor, one-door]
blockedBy: []
blocks: []
created: 2026-11-14
---

# Capability reads through one door

Owner decision 2026-11-14, step 1 (`docs/platform/vision.md:169-182`, section 6 "Known gaps"):
every reader of `runner.capabilities` goes through `bind()` (`src/runner/execution/bind.mjs:568`)
or its result. The config does not change. Step 2 (removing the 37 business-named rows) is out of scope.

Base: `origin/main` 781537524. All `file:line` below are at that commit.

## Outcome

- One module, `src/runner/execution/capability-config.mjs` (new, next to `bind.mjs`), is the only
  code in `src/`, `bin/`, `scripts/` that dereferences the `capabilities` section of a runner config.
- Every field of a capability entry has exactly one reading function (table below).
- Binding fields (`tier`, `maxTier`, `prefer` order, `roles`, `personas`, `seats`) reach the Rust crate
  (`packages/seat-binding/rust`, the authority) through one slice builder; Node callers that need the
  outcome use `bind()`'s result. `binding.persona` already carries the persona answer.
- A mechanical guard in `test/architecture.test.mjs` keeps it that way.

## Constraints / non-goals

- No key added, removed or renamed in `core/config-standard` or `core/config-schema`; every existing
  project config works unchanged. No Rust change (crate untouched; Rust gates N/A unless a phase finds it
  must touch Rust, which is outside this frame: stop and ask).
- No new field on the binding (`BIND_CONTRACT_VERSION` stays `v1alpha1`, `bind.mjs:22`).
- Not in scope: step 2 (rows removal, per-persona/per-role table), the tool registry, terminal-control
  capabilities, execution-contract capability hints (see Census, out of scope).
- Do not edit `main`, `CHANGELOG.md` (no user-visible change), `Cargo.lock`.

## Facts and prior art (answered before design)

| Question | Answer (evidence) |
|---|---|
| Was there a capability lookup module before? | `src/runner/capability-match.mjs` (b81719fca, 2026-09-27) was deleted on purpose with DemandFacts in 6527596eb (2026-10-01). Not revived. |
| Bare-verb fallback (`code:review` -> `review`)? | Removed on purpose in 3133ed474 (2026-10-21, seat-binding spec §6.3). Stale comment still claims it: `src/runner/work-dispatch.mjs:448-452`; fixed in phase 03. |
| Who owns lookup rules today? | `capabilityEntriesOf` (`src/runner/execution/seat-resolver.mjs:75-83`, exact then `<prefix>:*`); `registeredCapabilityOf` (`src/runner/dispatch/config.mjs:375-379`, key or alias); crate `entries()` (`packages/seat-binding/rust/src/policy.rs:24-35`) for binding fields. Three more ad-hoc copies: `resolveAlias` (`src/runner/dispatch/resolve.mjs:38-47`), `isKnownCapabilityName` (`src/runner/dispatch/plan.mjs:28-32`), `isCapabilityDeclared` (`src/report/capability-plan-lint.mjs:135-143`). Reused: the two rule implementations move into the port; the copies are deleted. |
| What does the crate read? | `CapabilityEntry { tier, maxTier, prefer, roles, personas, seats }` (`packages/seat-binding/rust/src/model.rs:232-247`), fed by `seatConfigOf` (`src/runner/execution/seat-policy.mjs:43-51`). |
| Schema keys of one capability | closed (`additionalProperties: false`): `description, aliases, prefer, rigor, persona, minCheckers, verify, serves, confinement, tier, maxTier, roles, personas, seats` (`core/config-schema/runner.schema.yaml`, `$defs.capability`). `loop`, `promise`, `invariants` are pattern/workflow keys, not capability keys. |
| Rust readers of `runner.capabilities` | only the seat-binding crate. `packages/config/rust` validates by schema generically; `host-runtime` "capabilities" are host authority capabilities (other meaning). |
| `DEFAULT_CAPABILITY_SLOTS` (`src/setup/registrations.mjs:1710-1781`) | a second copy of catalog rows in code, a definer (tests and plan-lint message), not a reader. Left for step 2. |

## Census: in-scope readers (`runner.capabilities`, seat-binding catalog)

| # | Site | Field | New door | Phase |
|---|---|---|---|---|
| 1 | `src/runner/execution/seat-policy.mjs:23-49` (`scopeOf`, `capabilityOf`, `seatConfigOf`) | tier, maxTier, prefer, roles, personas, seats | `bindingTasteOf` -> crate | 01 |
| 2 | `src/runner/execution/seat-resolver.mjs:75-83` `capabilityEntriesOf` | section, lookup rule | port (private) | 01 move, 04 delete |
| 3 | `seat-resolver.mjs:86-89` `hasUsablePrefer` | prefer | port (private) | 01 move, 04 delete |
| 4 | `seat-resolver.mjs:91-97` `capabilityRigorOf` | rigor | port `capabilityRigorOf` | 01 |
| 5 | `seat-resolver.mjs:139,144` `checkerPlanOf` | minCheckers | port `capabilityMinCheckersOf` | 01 |
| 6 | `src/runner/execution/bind.mjs:72,360` `resolvePersona` | persona | port `capabilityPersonaOf`; result `binding.persona` | 01 |
| 7 | `src/runner/dispatch/config.mjs:375-379` `registeredCapabilityOf` | aliases | moves to port | 01 |
| 8 | `src/runner/dispatch/decide.mjs:10,47` | aliases (import) | port | 01 |
| 9 | `src/workflow/propose-validate.mjs:16,158` | aliases (import) | port | 01 |
| 10 | `src/runner/dispatch/plan.mjs:18,121-122,371` | rigor (import) | port | 01 |
| 11 | `src/runner/operation-capability.mjs:24-26` | existence | port `hasCapabilityEntry` | 01 |
| 12 | `src/runner/execution/loops/verify.mjs:18` `verifyCommandOf` | verify | port `capabilityVerifyOf` | 02 |
| 13 | `src/runner/execution/legacy-seat-read.mjs:47` | minCheckers (exact, stored snapshot) | port `capabilityMinCheckersOf(…, {inherit:false})` | 02 |
| 14 | `src/runner/execution/run.mjs:100` `snapshotRunnerConfig` | whole section (record + hash) | port `catalogOf` | 02 |
| 15 | `src/runner/dispatch/resolve.mjs:36-47` `resolveAlias` | aliases | port `registeredCapabilityOf` | 03 |
| 16 | `resolve.mjs:66-71` (capabilities preferring an executor) | prefer (raw, string match) | port `capabilityNamesOf` + `preferOf` | 03 |
| 17 | `resolve.mjs:90-130` | confinement, existence | port `capabilityConfinementOf`, `hasCapabilityEntry` | 03 |
| 18 | `resolve.mjs:237-238` `resolveExecutorAndOverrides` | prefer (exact, first entry) | port `preferOf` | 03 |
| 19 | `src/runner/dispatch/plan.mjs:28-32` `isKnownCapabilityName` | aliases | delete; port `registeredCapabilityOf` | 03 |
| 20 | `src/runner/dispatch/confinement/request.mjs:315-337` | confinement | port `capabilityConfinementOf` | 03 |
| 21 | `src/runner/dispatch/config.mjs:701,732-753,769-773` load validator | every field (shape only) | section via port `catalogOf`; stays the Config load check | 03 |
| 22 | `src/setup/registrations.mjs:696-705` | minCheckers (exact) | port | 04 |
| 23 | `registrations.mjs:1916-1937` `evaluateWorkflowCapabilities` | existence (exact or prefix), prefer | port `isCapabilityDeclared`, `hasPreferPool` | 04 |
| 24 | `registrations.mjs:1958-1962` `checkCapabilityServesValid` | serves | port `capabilityServesOf` | 04 |
| 25 | `registrations.mjs:2980-3013` confinement-policies row | confinement | port | 04 |
| 26 | `registrations.mjs:3508-3528` strict-confinement row | confinement | port | 04 |
| 27 | `src/setup/seat-binding-checks.mjs:37-47` `bindCapabilityPostures` | prefer | port `capabilityNamesOf`, `preferOf` | 04 |
| 28 | `src/workflow/propose.mjs:449` | verify (`code:implement`) | `verifyCommandOf` (the gate's own reader) | 05 |
| 29 | `src/report/capability-plan-lint.mjs:135-143,478,631` | names, aliases, prefix | port | 05 |
| 30 | `bin/fgos.mjs:2358-2359` (`plan-lint`) | names | port `capabilityNamesOf` | 05 |
| 31 | `bin/fgos.mjs:2399` (`plan-lint` output) | description (exact, then `<prefix>:*`) | port `capabilityDescriptionOf` | 05 |

Callers that already go through a door and need no change: `src/runner/dispatch/assignment-runner.mjs:309`
(`seatConfigDigestOf`), `src/runner/execution/patterns/catalog.mjs:387` (`checkerPlanOf`),
`src/runner/execution/unit-run-start.mjs:442` (`effectiveRigorOf`), `src/workflow/case-gate.mjs:66` (`verifyCommandOf`),
`src/runner/work-compat.mjs:71`, `src/runner/dispatch/mechanism.mjs:82`, `src/runner/work-dispatch.mjs:445` (resolve.mjs functions).

## Census: out of scope (other meanings of "capability")

- Tool executors and registry (`src/state/tool-registry.mjs`, `fgos tool query --capability`, impact-analysis presence): tool abilities, not the seat catalog.
- Terminal control (`src/terminal-control/client.mjs:209,256`, `src/terminal-control/config.mjs`, `src/setup/terminal-control-checks.mjs:54-78`, `src/runner/dispatch/worker-session-boot.mjs:41-54`, `src/setup/registrations.mjs:2278`): herdr driver features.
- Execution-contract hints (`src/runner/dispatch/execution-contract.mjs:174-397`, `src/runner/dispatch/assignment.mjs:499-570`): `contract.capabilities` string list.
- Distribution manifest (`scripts/build-rust-distribution.mjs:88,452,483`, `scripts/lib/dev-host-manifest.mjs:30`, `scripts/git/e3-bench.mjs:768`): `git-wal-v1` release features.
- Host-runtime authority gate (`packages/host-runtime/rust/src/authority_gate.rs`): admitted provider capabilities.
- Prose/messages only: `src/runner/agent-definitions.mjs:239`, `src/workflow/case-gate.mjs:69`, `src/runner/execution/run.mjs:577`, `src/runner/execution/dry-bind.mjs:18`, `src/runner/dispatch/provider-capacity.mjs:20` (redaction key list), `scripts/project-agents.mjs:168`, `src/verbs/dispatch/show-run.mjs:12`.

## Field ownership (one field, one reader)

| Field | Reader | Who consumes the answer |
|---|---|---|
| tier, maxTier, roles, personas, seats | `bindingTasteOf` (port) -> crate | `bind()` result (`binding.tier`, provenance) |
| prefer (order, pins) | `bindingTasteOf` -> crate; raw presence/value: `preferOf`, `hasPreferPool` | bind; doctor rows 23, 27; dispatch purpose resolution 16, 18 |
| persona | `capabilityPersonaOf` | `bind()` -> `binding.persona` |
| rigor | `capabilityRigorOf` | `effectiveRigorOf` (seat-resolver, the effective-rigor authority) |
| minCheckers | `capabilityMinCheckersOf` | `checkerPlanOf`, legacy decoder, doctor info |
| verify | `capabilityVerifyOf` | `verifyCommandOf` (`loops/verify.mjs`), which the run, the gate (RUL-WF-32/35, `docs/platform/workflow/spec.md:334,340`) and the proposal check use |
| confinement | `capabilityConfinementOf` | confinement request, purpose resolution, doctor rows 25-26 |
| aliases | `registeredCapabilityOf` | decide, dispatch plan, purpose resolution, proposal, plan-lint |
| serves | `capabilityServesOf` | doctor `capability-serves-valid` |
| description | `capabilityDescriptionOf` | `fgos plan-lint` unit output (`bin/fgos.mjs:2399`); no other code reader |
| (section, shape) | `catalogOf` | only the Config load validator (`config.mjs`) and the run record (`run.mjs`), guarded by a caller table |

Why a port and not new binding fields: the bind result is per seat and recorded (`bindingInput`, replay);
confinement, verify, aliases and serves are asked where no seat is bound (doctor, proposal, purpose
resolution, launch-time confinement) and adding them would change the recorded binding contract. Why Node and
not the crate: the crate's scope is agent seats only (spec §1, §3); a host exec per confinement or alias read
would add cost on every launch (spec §13 budget); every reader is Node today. When Execution moves to Rust
the port moves whole.

## Phases

| Phase | Title | Effort | Depends on | Status |
|---|---|---|---|---|
| [01](phase-01-door.md) | Door: the read port, crate slice, persona, rigor, minCheckers, aliases | 3h | - | pending |
| [02](phase-02-execution-readers.md) | Execution readers: verify, legacy decoder, run record | 1h | 01 | pending |
| [03](phase-03-dispatch-readers.md) | Dispatch readers: purpose resolution, confinement request, plan, validator | 3h | 01 | pending |
| [04](phase-04-setup-doctor-readers.md) | Setup/doctor readers; delete old seat-resolver lookups | 2h | 01 | pending |
| [05](phase-05-workflow-report-cli-readers.md) | Workflow proposal, plan-lint, CLI | 1.5h | 01 | pending |
| [06](phase-06-guard-docs-equivalence.md) | Guard, docs, final equivalence | 2h | 02, 03, 04, 05 | pending |

## Parallel map

```
01 ──┬── 02 ──┐
     ├── 03 ──┤
     ├── 04 ──┼── 06
     └── 05 ──┘
```

- 01 alone first (it creates the port every other phase imports and moves helpers with all their importers).
- 02, 03, 04, 05 run at the same time: file sets are disjoint (each phase file lists them; checked below).
- 06 last: it writes the guard that is only true once 02-05 are in.
- Landing: phases merge into the integration branch `capability-reads-one-door` in order 01, then 02-05 in any
  order, then 06; the big lead lands the branch once. Interim (01 landed, 04 not): the private lookup helpers
  exist in both the port and seat-resolver; 04 deletes the seat-resolver copy. Nothing lands on main in between.

Hot files, one writer at a time (serial by dependency, never parallel):

| File | Writers, in order |
|---|---|
| `src/runner/execution/seat-resolver.mjs` | 01, then 04 |
| `src/runner/dispatch/config.mjs` | 01, then 03 |
| `src/runner/dispatch/plan.mjs` | 01 (import line), then 03 |
| `src/setup/registrations.mjs` | 04 only (01 does not touch it) |
| `docs/architecture-manifest.json` | 01 only |
| `test/architecture.test.mjs` | 06 only |
| `test/runner/execution/capability-config.test.mjs` | 01 only (02-05 add no cases: they only switch callers) |
| `plans/.../reports/equivalence/compare-capability-reads.mjs` | 01 only (06 runs it) |

File-disjointness of 02-05 (Modify sets): 02 {loops/verify.mjs, legacy-seat-read.mjs, run.mjs};
03 {resolve.mjs, plan.mjs, confinement/request.mjs, config.mjs, work-dispatch.mjs};
04 {registrations.mjs, seat-binding-checks.mjs, seat-resolver.mjs};
05 {propose.mjs, capability-plan-lint.mjs, bin/fgos.mjs}. No overlap. 05's `propose.mjs` imports
`loops/verify.mjs`, whose exported name and signature 02 keeps unchanged.

## Collision risk (with plans/261114-2051-rust-verb-migration-program, step F0)

That plan was not readable at planning time (not pushed). Files of this plan likely shared with Rust host work:

| File | Phase here | Why it may collide |
|---|---|---|
| `docs/architecture-manifest.json` | 01 | every new `.mjs` file adds a row; retier of `src/runner/operation-capability.mjs` |
| `test/architecture.test.mjs` | 06 | new guard test |
| `bin/fgos.mjs` | 05 | 2 lines in `plan-lint`; verb migration moves verbs out of this file |
| `src/setup/registrations.mjs` | 04 | doctor rows; host foundations may add readiness rows |
| `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md`, `docs/reading-map.md` | 06 | pointer and gap lines |

Mitigation: rebase before each phase, keep edits to these files minimal and line-local, one writer per file
inside this plan; the big lead orders landings if F0 writes the same files.

## Acceptance criteria

1. Guard (phase 06): no file in `src/`, `bin/`, `scripts/` except `src/runner/execution/capability-config.mjs`
   reads the `capabilities` property of a runner config; `catalogOf` is called only from `dispatch/config.mjs`
   and `execution/run.mjs`. The guard has a self-check that catches a planted violation.
2. Equivalence (phases 01 and 06): `compare-capability-reads.mjs --base <781537524 checkout> --head <branch>`
   over the shipped standard config (fresh temp project) and this repo's `.fgos/config.yaml` prints an empty
   diff for every capability name x every public question (list in phase 01), plus equal `seatConfigDigestOf`
   digests; `fgos doctor --json` rows `workflow-capabilities-configured`, `capability-serves-valid`,
   `seat-binding-dry-bind`, `seat-binding-route`, the confinement rows and the runner-config info row print the
   same messages at base and head. Output saved under `reports/equivalence/`.
3. Owning proof: `test/runner/execution/capability-config.test.mjs` proves every lookup rule once
   (exact, `<prefix>:*`, alias, own-key only, string vs list `prefer`, absent section, `{runner:{…}}` nesting).
4. `npm test` and `cargo test --workspace` green on the integration branch (big lead, at landing).
5. No change in `core/config-standard/`, `core/config-schema/`, `packages/`, `apps/`, `CHANGELOG.md`, `Cargo.lock`.
6. Docs: seat-binding spec states the one-door rule and points at the port; vision bullet records step 1 landed.

## What step 1 leaves ready for step 2

- One module lists every question asked of a capability row; removing rows means changing the answers in one
  place and the crate slice, not hunting 18 files.
- Two leftovers that step 2 removes with the rows (recorded, not done here, because they change behaviour):
  `resolveExecutorAndOverrides` picks a purpose's executor from the first `prefer` entry without `bind()`
  (`src/runner/dispatch/resolve.mjs:237-262`), a second chooser next to the crate; and the reverse match at
  `resolve.mjs:66-71` compares `prefer` to an executor id as a string, so a list-shaped `prefer` never matches.
  `DEFAULT_CAPABILITY_SLOTS` (`src/setup/registrations.mjs:1710`) duplicates rows in code.

## Ideas (not done; RUL104: owner chooses)

- The two doctor confinement rows (25, 26) re-check what the load validator already refuses
  (`config.mjs:732-756`); one could go. Benefit: less doctor code. Evidence: same predicates.
- `bind.mjs` is 607 lines against the 600 budget in seat-binding spec §16. Not touched beyond the persona line.

## Owner questions

None. Every fork was settled by the hard requirements (config unchanged, same reads) or by code evidence;
each decision and its reason is in this file or the phase files.

## Red Team Review

(filled after red-team)

## Validation Log

(filled after validation)
