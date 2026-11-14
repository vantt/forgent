---
title: "Capability reads through one door (step 1 of the capability-rows decision)"
description: "Every reader of runner.capabilities goes through bind() or one named read port next to it, enforced by an architecture test; config, bindings and reads stay identical."
status: pending
priority: P2
effort: 14h
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

- One module, `src/runner/execution/capability-config.mjs` (new, next to `bind.mjs`), is the only code in
  `src/`, `bin/`, `scripts/` that dereferences the `capabilities` section of a runner config, and it hands out
  answers per field, never an entry object.
- Every field of a capability entry has exactly one reading function (table below); the Config load validator
  also asks through those functions (no shape-check exception).
- Binding fields (`tier`, `maxTier`, `prefer` order, `roles`, `personas`, `seats`) reach the Rust crate
  (`packages/seat-binding/rust`, the authority) through one slice builder; callers that need the outcome use
  `bind()`'s result (`binding.persona`, `binding.tier`, provenance).
- A rule in `test/architecture.test.mjs` fails any other file that reads `runner.capabilities` and names the
  door to use. It lands in the same change as the last reader move (the integration branch lands on main once),
  so it never starts red and nothing can regress afterwards.

## Constraints / non-goals

- No key added, removed or renamed in `core/config-standard` or `core/config-schema`; every existing project
  config works unchanged. No Rust change (crate untouched; Rust gates N/A; a phase that finds it must touch
  Rust is outside this frame: stop and ask the big lead).
- No new field on the binding (`BIND_CONTRACT_VERSION` stays `v1alpha1`, `bind.mjs:21`).
- Not in scope: step 2 (rows removal, per-persona/per-role table), tool registry, terminal-control
  capabilities, execution-contract capability hints (Census, out of scope).
- Do not edit `main`, `CHANGELOG.md` (no user-visible change), `Cargo.lock`.

## Facts and prior art (answered before design)

| Question | Answer (evidence) |
|---|---|
| Was there a capability lookup module before? | `src/runner/capability-match.mjs` (b81719fca, 2026-09-27) was deleted on purpose with DemandFacts in 6527596eb (2026-10-01). Not revived. |
| Bare-verb fallback (`code:review` -> `review`)? | Removed on purpose in 3133ed474 (2026-10-21, seat-binding spec §6.3). Stale comments still claim it: `src/runner/work-dispatch.mjs:449-453` (fixed in phase 03) and `src/setup/registrations.mjs:1866-1868` (fixed in phase 04). |
| Who owns lookup rules today? | `capabilityEntriesOf` (`src/runner/execution/seat-resolver.mjs:75-83`, exact then `<prefix>:*`, accepts `{runner:{capabilities}}` too); `registeredCapabilityOf` (`src/runner/dispatch/config.mjs:375-379`, own key or alias); crate `entries()` (`packages/seat-binding/rust/src/policy.rs:24-35`) for binding fields. Three ad-hoc copies: `resolveAlias` (`src/runner/dispatch/resolve.mjs:38-47`), `isKnownCapabilityName` (`src/runner/dispatch/plan.mjs:28-32`), plan-lint `isCapabilityDeclared` (`src/report/capability-plan-lint.mjs:135-143`). Reused: the two rule implementations move into the port; the copies are deleted. |
| What does the crate read? | `CapabilityEntry { tier, maxTier, prefer, roles, personas, seats }` (`packages/seat-binding/rust/src/model.rs:232-247`), fed by `seatConfigOf` (`src/runner/execution/seat-policy.mjs:43-51`). |
| Schema keys of one capability | closed (`additionalProperties: false`): `description, aliases, prefer, rigor, persona, minCheckers, verify, serves, confinement, tier, maxTier, roles, personas, seats` (`core/config-schema/runner.schema.yaml`, `$defs.capability`). `loop`, `promise`, `invariants` are pattern/workflow keys, not capability keys. |
| Rust readers of `runner.capabilities` | only the seat-binding crate. `packages/config/rust` validates by schema generically; `host-runtime` "capabilities" are host authority capabilities (other meaning). |
| Which input shapes reach the readers? | Every production caller passes the flat runner section: `loadRunnerConfigForDir` (`config.mjs`), `effectiveSection(cwd,'runner')` (`registrations.mjs`), `configSnapshot.runner` (`run.mjs`), `checkSeatBindingDryBind` -> `loadRunnerConfig` (`seat-binding-checks.mjs:98-113`). The `{runner:{capabilities}}` tolerance exists only in `seat-resolver.mjs:77`, `seat-binding-checks.mjs:37`, plan-lint `:478` and the `seat-policy.mjs:44` unwrap. |
| `DEFAULT_CAPABILITY_SLOTS` (`src/setup/registrations.mjs:1710-1781`) | a second copy of catalog rows in code, a definer (tests and plan-lint message), not a reader. Left for step 2. |

**Why the seat-binding landing did not move the other field readers.** The seat-binding program
(`plans/261020-2132-seat-binding-component/`; crate dc65c1049 2026-10-20, host route and Node client
d08948c86 2026-10-21, routing 3133ed474) scoped its authority to one question, "which executor, model, effort,
tier and account does this agent seat run on" (spec §1, §3), and said in §6.2 "Khoá capability hiện có
(`description`, `aliases`, `confinement`, `serves`, `persona`, `minCheckers`, `verify`) giữ nguyên": the
non-ranking keys were deliberately left on their existing paths, and tool-served capabilities kept theirs
(§1). That was intended for that program, but it left no owner for "who reads the catalog", and no guard was
added, so readers kept spreading after it landed: `registeredCapabilityOf` arrived in 8c915a8b2 (2026-11-03)
for the proposal check, the doctor posture section gained its own catalog read (`seat-binding-checks.mjs`, cfff2aa7f, 2026-11-06). This plan gives
the catalog one reading door and makes the rule mechanical so it cannot drift again.

## Census: in-scope readers (`runner.capabilities`, seat-binding catalog)

| # | Site | Field | New door | Phase |
|---|---|---|---|---|
| 1 | `src/runner/execution/seat-policy.mjs:23-49` (`scopeOf`, `capabilityOf`, `seatConfigOf`) | tier, maxTier, prefer, roles, personas, seats | `bindingTasteOf` -> crate | 01 |
| 2 | `src/runner/execution/seat-resolver.mjs:75-83` `capabilityEntriesOf` | section, lookup rule | port (private `entriesOf`) | 01 move, 04 delete |
| 3 | `seat-resolver.mjs:86-89` `hasUsablePrefer` | prefer | port (private) | 01 move, 04 delete |
| 4 | `seat-resolver.mjs:91-97` `capabilityRigorOf` | rigor | port `capabilityRigorOf` | 01 |
| 5 | `seat-resolver.mjs:139,144` `checkerPlanOf` | minCheckers | port `minCheckersOf` | 01 |
| 6 | `src/runner/execution/bind.mjs:72,360` `resolvePersona` | persona | port `capabilityPersonaOf`; result `binding.persona` | 01 |
| 7 | `src/runner/dispatch/config.mjs:375-379` `registeredCapabilityOf` | aliases | moves to port | 01 |
| 8 | `src/runner/dispatch/decide.mjs:10,47` | aliases (import) | port | 01 |
| 9 | `src/workflow/propose-validate.mjs:16,158` | aliases (import) | port | 01 |
| 10 | `src/runner/dispatch/plan.mjs:18,121-122,371` | rigor (import) | port | 01 |
| 11 | `src/runner/operation-capability.mjs:24-26` | existence | port `hasCapabilityEntry` | 01 |
| 12 | `src/runner/execution/loops/verify.mjs:18` `verifyCommandOf` | verify | port `capabilityVerifyOf` | 02 |
| 13 | `src/runner/execution/legacy-seat-read.mjs:47` | minCheckers (exact, stored snapshot) | port `ownMinCheckersOf` | 02 |
| 14 | `src/runner/execution/run.mjs:100` `snapshotRunnerConfig` | whole section (record + hash) | port `catalogOf` | 02 |
| 15 | `src/runner/dispatch/resolve.mjs:36-47` `resolveAlias` | aliases | port `registeredCapabilityOf` | 03 |
| 16 | `resolve.mjs:66-71` (capabilities preferring an executor) | prefer (raw, `===` match) | port `capabilityNamesOf` + `preferOf` | 03 |
| 17 | `resolve.mjs:90-130` | confinement, existence | port `capabilityConfinementOf`, `hasCapabilityEntry` | 03 |
| 18 | `resolve.mjs:237-238` `resolveExecutorAndOverrides` | prefer (exact, first entry) | port `preferOf` | 03 |
| 19 | `src/runner/dispatch/plan.mjs:28-32,492` `isKnownCapabilityName` | aliases | delete; port `registeredCapabilityOf` | 03 |
| 20 | `src/runner/dispatch/confinement/request.mjs:315-337` | confinement | port `capabilityConfinementOf` | 03 |
| 21 | `src/runner/dispatch/config.mjs:562-582,701-773` load validator | taste keys, prefer sites, confinement, aliases | port `bindingTasteOf`, `capabilityConfinementOf`, `registeredCapabilityOf`, `capabilityNamesOf` | 03 |
| 22 | `src/setup/registrations.mjs:696-705` | minCheckers (exact) | port `capabilityNamesOf` + `ownMinCheckersOf` | 04 |
| 23 | `registrations.mjs:1916-1937` `evaluateWorkflowCapabilities` | existence (exact or prefix), prefer | port `isCapabilityDeclared`, `hasPreferPool` | 04 |
| 24 | `registrations.mjs:1958-1962` `checkCapabilityServesValid` | serves | port `capabilityServesOf` | 04 |
| 25 | `registrations.mjs:2980-3013` row `confinement-policies-declared` | section presence, entry shape, confinement | port `catalogOf` (presence), `hasCapabilityEntry`, `capabilityConfinementOf` | 04 |
| 26 | `registrations.mjs:3508-3528` row `confinement-strict-readiness` | same | same | 04 |
| 27 | `src/setup/seat-binding-checks.mjs:37-47` `bindCapabilityPostures` | prefer | port `capabilityNamesOf`, `hasOwnPreferPool`, `preferOf` | 04 |
| 28 | `src/workflow/propose.mjs:449` | verify (`code:implement`), truthy | port `capabilityVerifyOf` | 05 |
| 29 | `src/report/capability-plan-lint.mjs:135-143,478,631` | names, aliases, prefix | port | 05 |
| 30 | `bin/fgos.mjs:2358-2359` (`plan-lint`) | names | port `capabilityNamesOf` | 05 |
| 31 | `bin/fgos.mjs:2399` (`plan-lint` output) | description (exact, then `<prefix>:*`) | port `capabilityDescriptionOf` | 05 |

Callers that already go through a door and need no change: `src/runner/dispatch/assignment-runner.mjs:309`
(`seatConfigDigestOf`); `src/runner/execution/patterns/catalog.mjs:387` (`checkerPlanOf`);
`src/runner/execution/unit-run-start.mjs:442` (`effectiveRigorOf`); `verifyCommandOf` callers
`src/workflow/case-gate.mjs:18,66`, `src/runner/execution/loops/history-outcome.mjs:8,39`,
`src/runner/execution/loops/reviewed.mjs:10`, `src/runner/execution/loops/solo.mjs:7,38`,
`src/runner/execution/run.mjs:23,540,572`; resolve.mjs callers `src/runner/work-compat.mjs:71`,
`src/runner/dispatch/mechanism.mjs:82`, `src/runner/work-dispatch.mjs:445`.

## Census: out of scope (other meanings of "capability")

- Tool executors and registry (`src/state/tool-registry.mjs`, `fgos tool query --capability`, impact-analysis presence): tool abilities, not the seat catalog.
- Terminal control (`src/terminal-control/client.mjs:209,256`, `src/terminal-control/config.mjs`, `src/setup/terminal-control-checks.mjs:54-78`, `src/runner/dispatch/worker-session-boot.mjs:41-54`, `src/setup/registrations.mjs:2278`): herdr driver features.
- Execution-contract hints (`src/runner/dispatch/execution-contract.mjs:174-397`, `src/runner/dispatch/assignment.mjs:499-570`): `contract.capabilities` string list.
- Distribution manifest (`scripts/build-rust-distribution.mjs:88,452,483`, `scripts/lib/dev-host-manifest.mjs:30`, `scripts/git/e3-bench.mjs:768`): `git-wal-v1` release features.
- Host-runtime authority gate (`packages/host-runtime/rust/src/authority_gate.rs`): admitted provider capabilities.
- Prose/messages only: `src/runner/agent-definitions.mjs:239`, `src/workflow/case-gate.mjs:69`, `src/runner/execution/run.mjs:577`, `src/runner/execution/dry-bind.mjs:18`, `src/runner/dispatch/provider-capacity.mjs:20` (redaction key list), `scripts/project-agents.mjs:168`, `src/verbs/dispatch/show-run.mjs:12`.

## Field ownership (one field, one reader)

| Field | Reader (port) | Consumers |
|---|---|---|
| tier, maxTier, roles, personas, seats | `bindingTasteOf` -> crate | `bind()` result; load validator (taste keys, prefer sites) |
| prefer | order and pins: `bindingTasteOf` -> crate; raw value and presence: `preferOf`, `hasPreferPool` (exact or prefix), `hasOwnPreferPool` (exact) | bind; doctor rows 23, 27; dispatch purpose resolution 16, 18 |
| persona | `capabilityPersonaOf` | `bind()` -> `binding.persona` |
| rigor | `capabilityRigorOf` | `effectiveRigorOf` (seat-resolver, the effective-rigor authority) |
| minCheckers | `minCheckersOf` (exact or prefix), `ownMinCheckersOf` (exact) | `checkerPlanOf`; legacy decoder and doctor info |
| verify | `capabilityVerifyOf` | `verifyCommandOf` (run, reviewed/solo loops, workflow gate RUL-WF-32/35, `docs/platform/workflow/spec.md:334,340`); proposal check |
| confinement | `capabilityConfinementOf` | confinement request, purpose resolution, load validator, doctor rows 25-26 |
| aliases | `registeredCapabilityOf` | decide, dispatch plan, purpose resolution, proposal, plan-lint, load validator |
| serves | `capabilityServesOf` | doctor `capability-serves-valid` |
| description | `capabilityDescriptionOf` | `fgos plan-lint` unit output (`bin/fgos.mjs:2399`); no other code reader |
| (names, existence) | `capabilityNamesOf` (own keys), `hasCapabilityEntry` (own key, non-null object), `isCapabilityDeclared` (exact or prefix) | enumeration and existence sites |
| (whole section) | `catalogOf` (raw value) | only the run record (`run.mjs:100`) and the presence test of doctor rows 25-26, guarded by a caller table |

Section rule: the port reads the flat runner section's own `capabilities`. The exact-then-prefix lookups
(`entriesOf`: persona, rigor, minCheckersOf, isCapabilityDeclared, hasPreferPool) keep today's extra tolerance of
`{runner:{capabilities}}` (moved verbatim from `seat-resolver.mjs:77`); every other function stays flat-only as its
callers are today, so no reader widens (the host-run `verify` in particular never reads a nested section).
The two rules are named in the port header; removing the nested tolerance is a step 2 cleanup.

Why a port and not new binding fields: the bind result is per seat and recorded (`bindingInput`, replay);
confinement, verify, aliases and serves are asked where no seat is bound (doctor, proposal, purpose resolution,
launch-time confinement) and adding them would change the recorded binding contract. Why Node and not the
crate: the crate's scope is agent seats only (spec §1, §3); a host exec per confinement or alias read would add
cost on every launch (spec §13 budget); every reader is Node today. When Execution moves to Rust the port moves whole.

## Intended deltas (inputs no caller produces; each is recorded, tested and allowlisted in the equivalence run)

| Delta | Today | After | Why no real input is affected |
|---|---|---|---|
| Capability named after an `Object.prototype` member (`constructor`, `toString`, `valueOf`, `hasOwnProperty`, `__proto__`, …) | truthy lookups (`resolve.mjs:40,113`, `operation-capability.mjs:26`, `seat-resolver.mjs:80`) treat it as declared | not declared (`Object.hasOwn`) | config comes from JSON/YAML: inherited names are never declared keys; makes purpose and confinement selection prototype-safe |
| Non-object entry (`foo: null`, `foo: "x"`) | some sites treat it as declared, others not | one rule: declared only when a non-null object (arrays count, as the doctor rows do today) | schema refuses a non-object entry at load (`additionalProperties.$ref capability`, `type: object`) |
| `bindCapabilityPostures` given `{runner:{capabilities}}` | reads the nested section (`seat-binding-checks.mjs:37`) | flat only | its one caller passes the flat section from `loadRunnerConfig` (`seat-binding-checks.mjs:98-113`) |
| String-valued `aliases` | `registeredCapabilityOf` substring-matches (`config.mjs:378`); `resolveAlias` ignores it | ignored (`Array.isArray`) | schema: `aliases` is an array |
| plan-lint given an odd config shape: neither `runner` nor `capabilities` (raw catalog), or `runner` without `runner.capabilities` | raw catalog read as the catalog; `runner` without a catalog falls back to top-level `capabilities`, else skips the check (`capability-plan-lint.mjs:478`) | the section is `config.runner ?? config`; no catalog means every unit is unregistered | no caller passes one: bin passes the flat runner section (`bin/fgos.mjs:2376,2388`), tests pass `{runner:{capabilities}}` (`test/report/capability-plan-lint.test.mjs:464,625,681`) or nothing |

Everything else is byte-identical, including the proposal's truthy `verify` check (`propose.mjs:449`) and the
string-only reverse `prefer` match (`resolve.mjs:66-71`).

## Phases

| Phase | Title | Effort | Depends on | Status |
|---|---|---|---|---|
| [01](phase-01-door.md) | Door: the read port, crate slice, persona, rigor, minCheckers, aliases; equivalence harness and base evidence | 4h | - | pending |
| [02](phase-02-execution-readers.md) | Execution readers: verify, legacy decoder, run record | 1h | 01 | pending |
| [03](phase-03-dispatch-readers.md) | Dispatch readers: purpose resolution, confinement request, plan, load validator | 3h | 01 | pending |
| [04](phase-04-setup-doctor-readers.md) | Setup/doctor readers; delete old seat-resolver lookups | 2h | 01 | pending |
| [05](phase-05-workflow-report-cli-readers.md) | Workflow proposal, plan-lint, CLI | 1.5h | 01 | pending |
| [06](phase-06-guard-docs-equivalence.md) | The door made mechanical (architecture rule), docs, final equivalence | 2.5h | 02, 03, 04, 05 | pending |

## Parallel map

```
01 ──┬── 02 ──┐
     ├── 03 ──┤
     ├── 04 ──┼── 06
     └── 05 ──┘
```

- 01 alone first (it creates the port every other phase imports and moves helpers with all their importers).
- 02, 03, 04, 05 run at the same time: file sets are disjoint (checked below).
- 06 last: the architecture rule is only true once 02-05 are in.
- Landing: each phase merges into the integration branch `capability-reads-one-door` (01, then 02-05 in any
  order, then 06). After every merge the big lead runs the union of the merged phases' focused gates plus
  `test/architecture.test.mjs` on the integration branch. The branch lands on main once, so the rule and the
  last reader move land in the same change. Interim (01 merged, 04 not): `capabilityEntriesOf`/`hasUsablePrefer`
  exist in both the port (private) and seat-resolver; 04 deletes the seat-resolver copy. Nothing lands on main in between.
- Port changes after 01: a phase that needs a port change stops and asks the big lead, who grants one writer at
  a time for `capability-config.mjs` and its test; never two phases at once.

Hot files, one writer at a time (serial by dependency, never parallel):

| File | Writers, in order |
|---|---|
| `src/runner/execution/capability-config.mjs` + its test | 01 (later only via the big lead's one-writer grant) |
| `src/runner/execution/seat-resolver.mjs` | 01, then 04 |
| `src/runner/dispatch/config.mjs` | 01, then 03 |
| `src/runner/dispatch/plan.mjs` | 01 (import line), then 03 |
| `src/setup/registrations.mjs` | 04 only |
| `docs/architecture-manifest.json` | 01 only |
| `test/architecture.test.mjs` | 06 only |
| `plans/.../reports/equivalence/compare-capability-reads.mjs` | 01 only (06 runs it) |

File-disjointness of 02-05 (Modify sets): 02 {loops/verify.mjs, legacy-seat-read.mjs, run.mjs};
03 {resolve.mjs, plan.mjs, confinement/request.mjs, config.mjs, work-dispatch.mjs};
04 {registrations.mjs, seat-binding-checks.mjs, seat-resolver.mjs};
05 {propose.mjs, capability-plan-lint.mjs, bin/fgos.mjs}. No overlap.

## Collision risk (with plans/261114-2051-rust-verb-migration-program, step F0)

That plan was not readable at planning time (not pushed). Files of this plan likely shared with Rust host work:

| File | Phase here | Why it may collide |
|---|---|---|
| `docs/architecture-manifest.json` | 01 | one new row (`capability-config.mjs`: layer `kernel`, tier override `0`); F0 may add rows |
| `test/architecture.test.mjs` | 06 | new rule block; F0 may add guards |
| `bin/fgos.mjs` | 05 | three line-local edits in `plan-lint`; verb migration moves verbs out of this file |
| `src/setup/registrations.mjs` | 04 | doctor rows; host foundations may add readiness rows |
| `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md` | 06 | rule, pointer and gap lines |

Mitigation: rebase before each phase; edits line-local and additive; one writer per file inside this plan; the
big lead orders landings if F0 writes the same files.

## Acceptance criteria

1. Architecture rule (phase 06): no file in `src/`, `bin/`, `scripts/`, `domains/`, `core/` except
   `src/runner/execution/capability-config.mjs` reads the `capabilities` property of a runner config; a violation
   fails with the file, line and "read it through src/runner/execution/capability-config.mjs (or bind())". Only
   named receivers of the other meanings are exempt. `catalogOf` is called only from `execution/run.mjs` and
   `setup/registrations.mjs`. A self-check proves the rule catches planted violations.
2. Equivalence (phases 01 and 06): `compare-capability-reads.mjs` runs base (781537524) and head each in its own
   child process over the shipped standard config, this repo's config and a synthetic edge matrix (phase 01),
   and reports zero differences outside the Intended deltas allowlist; doctor rows (phase 06 list) print the
   same messages at base and head. Committed evidence is digests and diff summaries only.
3. Owning proof: `test/runner/execution/capability-config.test.mjs` proves each lookup rule and each intended
   delta once.
4. `npm test` and `cargo test --workspace` green on the integration branch (big lead, at landing).
5. No change in `core/config-standard/`, `core/config-schema/`, `packages/`, `apps/`, `CHANGELOG.md`, `Cargo.lock`.
6. Docs: seat-binding spec states the one-door rule, its §15 records step 1, §16 points at the port; vision bullet records step 1 landed.

## Rollback

Before landing: revert merges on the integration branch in reverse order (06, then 05..02 in any order, then 01);
01 cannot be reverted while any of 02-05 is merged. After landing: revert the single landing merge on main.
No data, config or record format changes (the run-record hash is proven identical).

## What step 1 leaves ready for step 2

- One module lists every question asked of a capability row; removing rows means changing answers in one place
  and the crate slice, not hunting 18 files; the architecture rule keeps new readers out.
- Leftovers step 2 removes with the rows (behaviour changes, so not here): `resolveExecutorAndOverrides` picks a
  purpose's executor from the first `prefer` entry without `bind()` (`resolve.mjs:237-262`), a second chooser;
  the reverse match at `resolve.mjs:66-71` compares `prefer` with `===`, so a list-shaped `prefer` never matches;
  the nested `{runner:{capabilities}}` tolerance of `entriesOf`; `DEFAULT_CAPABILITY_SLOTS`
  (`registrations.mjs:1710`) duplicates rows in code.

## Ideas (not done; RUL104: owner chooses)

- The proposal accepts a whitespace-only `code:implement.verify` (`propose.mjs:449`, truthy) that the gate it
  predicts refuses (`case-gate.mjs:66`, trimmed). Asking `verifyCommandOf` in both would align them. Kept
  identical here because step 1 must not change reads.
- Doctor confinement rows 25-26 re-check what the load validator refuses (`config.mjs:732-756`); one could go.
- `policyId in cfg.confinementPolicies` (`config.mjs:738`) and `customPolicies[policyId]`
  (`registrations.mjs:3017,3524`) accept `Object.prototype` names as policy ids (pre-existing; schema pattern `\S`).
- `bind.mjs` is 607 lines against the 600 budget in seat-binding spec §16.

## Owner questions

None. Every fork was settled by the hard requirements (config unchanged, same reads) or by code evidence; each
decision and its reason is in this file or the phase files.

## Red Team Review

### Session — 2026-11-14
**Findings:** 31 raw from 4 reviewers (Failure Mode, Assumption, Scope/Contract, Security/Fact), deduplicated to 15 (13 accepted or partly accepted, 2 rejected)
**Severity breakdown (deduplicated):** 0 Critical, 8 High, 7 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---|---|---|---|
| 1 | `catalogOf` nesting fallback widens flat-only readers, incl. host-run `verify` | High | Accept: flat-only section; nested tolerance only where it exists today (`entriesOf`) | plan, 01, 02 |
| 2 | Plan-lint precedence claim false; raw-catalog branch removal unproven | High | Accept: precedence via `config.runner ?? config`; deletion recorded with caller evidence | plan (Intended deltas), 05 |
| 3 | Load validator keeps raw field reads; "one field one reader" overclaimed | High | Accept: validator asks port functions; `catalogOf` limited to run record + doctor presence | plan, 03, 06 |
| 4 | Equivalence script blind: two well-formed configs, missing questions, no doctor base, unusable plan-lint base | High | Accept: synthetic matrix, added questions, doctor base in 01, plan-lint base on an existing plan dir | 01, 04, 05, 06 |
| 5 | Doctor confinement rows' malformed/skip/presence branches not reproducible | High | Accept: `hasCapabilityEntry` = non-null object; `catalogOf` for presence | 01, 04 |
| 6 | Own-key change affects all `Object.prototype` names, not only `__proto__` | Medium | Accept: Intended deltas table + probes + tests | plan, 01 |
| 7 | Three existence rules presented as one; alias substring | Medium | Accept: one existence predicate, `Array.isArray(aliases)`, deltas recorded | plan, 01, 03 |
| 8 | `inherit` flag defaults to prefix inheritance | Medium | Accept: split names (`minCheckersOf`/`ownMinCheckersOf`, `hasPreferPool`/`hasOwnPreferPool`) | 01, 02, 04 |
| 9 | `propose.mjs` whitespace change violates "same reads" | Medium | Accept: keep truthy check through port; alignment moved to Ideas | 05, plan |
| 10 | Retier of `operation-capability.mjs` | Medium | Accept: port gets tier override 0 like `rigor.mjs`; no retier | 01 |
| 11 | Guard gaps: string-literal access, rename destructuring, file-level exemptions | Medium | Accept: string pre-check, rename form, receiver-level exemptions, door named in message | 06 |
| 12 | Harness fragility (one process, silent skips), evidence privacy, unregistered base path | Medium | Accept: child process per side, missing-at-head fails, digests only committed, base must be a registered worktree | 01, 06 |
| 13 | Rollback order, merged-branch gates, late port amendments | Medium | Accept: reverse-order rollback, union gate after each merge, one-writer grant for the port | plan |
| 14 | Collapse per-field functions into `entryOf(cfg, name)` | High | Reject: it hands out entries and moves field reads back to callers, the opposite of the owner's "one field, one reader"; existence functions merged instead (row 7) | - |
| 15 | Field-level lexical guard (`.prefer`, `.confinement`, …) | High | Reject: those names are shared with executor/invocation/unit/template shapes (`executor.confinement`, `unit.verify`, `template.persona`), so the rule would be mostly false positives; the port never returns an entry, and the `catalogOf` caller table closes the only path to raw entries | - |

Fact-check fixes applied: `BIND_CONTRACT_VERSION` is `bind.mjs:21`; `seat-resolver.test.mjs:6` import line added to phase 01;
full `verifyCommandOf` caller list added above. Docs scope trimmed: `docs/reading-map.md` dropped (spec §16 pointer suffices).

### Whole-Plan Consistency Sweep

Swept plan.md and phases 01-06 for: `inherit`, `catalogOf` callers, `isCapabilityDeclared`, `reading-map`,
`retier`, `whitespace`, `bind.mjs:22`, `hasUsablePrefer`. All occurrences reconciled with the decision deltas
above; no unresolved contradiction.

## Validation Log

### Verification Results
- Claims checked: 47 (planner re-grep 18 + Fact Checker 29)
- Verified: 44 | Failed: 3 (fixed: bind.mjs line, plan-lint precedence, plan-lint :631 shape) | Unverified: 0 open
- Tier: Full (6 phases)
- Owner interview: none needed (no open owner question; see Owner questions)
