---
title: "Capability reads through one door (step 1 of the capability-rows decision)"
description: "Every reader of runner.capabilities goes through bind() or one named read port next to it, enforced by an architecture test; config, bindings and reads stay identical."
status: pending
priority: P2
effort: 19.5h
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
- Choosing an executor for a purpose goes through `bind()` (`purposeSeatOf` in `src/runner/dispatch/plan.mjs`);
  the first-`prefer` chooser in `resolveExecutorAndOverrides` and the string-only reverse `prefer` match are
  deleted (big lead decision 2026-11-14: a second chooser is a worse one-door violation than a field reader).
- Rows in the one-door `doors` table (`docs/architecture-manifest.json`, checked by `test/architecture.test.mjs`,
  added by F0 phase 01) fail any other file that reads `runner.capabilities` or picks an executor from `prefer`,
  and name the door to use. It lands in the same change as the last reader move (the integration branch lands on main once),
  so it never starts red and nothing can regress afterwards.

## Constraints / non-goals

- No key added, removed or renamed in `core/config-standard` or `core/config-schema`; every existing project
  config works unchanged. No Rust change (crate untouched; Rust gates N/A; a phase that finds it must touch
  Rust is outside this frame: stop and ask the big lead).
- No new field on the binding (`BIND_CONTRACT_VERSION` stays `v1alpha1`, `bind.mjs:21`).
- Not in scope: step 2 (rows removal, per-persona/per-role table), tool registry, terminal-control
  capabilities, execution-contract capability hints (Census, out of scope).
- Do not edit `main`, `CHANGELOG.md`, `Cargo.lock`. Phases 01-05 and 07 change nothing a user sees; phase 06 changes
  what `fgos dispatch decide --for` answers in the cases of Q2 (the big lead decides the CHANGELOG line at landing).

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
| 16 | `resolve.mjs:66-71` (capabilities preferring an executor) | prefer (raw, `===` match) | deleted (Q3) | 06 |
| 17 | `resolve.mjs:90-130` | confinement, existence | port `capabilityConfinementOf`, `hasCapabilityEntry` | 03 |
| 18 | `resolve.mjs:237-262` `resolveExecutorAndOverrides` purpose branch (callers `plan.mjs:453,468,476,507`, `mechanism.mjs:82`, `resolve.mjs:274`, `work-dispatch.mjs:445`) | prefer (exact, first entry) — a second executor chooser | deleted; `purposeSeatOf` -> `bind()` (Q1, Q2) | 06 |
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

## Intended deltas (each recorded, tested in its owning file and allowlisted in the equivalence run; the three marked Q reach real config shapes and wait for the owner)

| Delta | Today | After | Why no real input is affected |
|---|---|---|---|
| Capability named after an `Object.prototype` member (`constructor`, `toString`, `valueOf`, `hasOwnProperty`, `__proto__`, …) | truthy lookups (`resolve.mjs:40,113`, `operation-capability.mjs:26`, `seat-resolver.mjs:80`) treat it as declared | not declared (`Object.hasOwn`) | config comes from JSON/YAML: inherited names are never declared keys; makes purpose and confinement selection prototype-safe |
| (Q1) Tool-only purpose | `prefer[0]` of the row | the `kind: tool` executor whose `for` names it; none -> unconfigured | real shape: owner question Q1 |
| (Q2) Purpose whose first `prefer` entry cannot run here | `decide`/Work name `prefer[0]` | `bind()`'s executor, or `unavailable` with the refusal; bound invocation; `bindingSource: 'seat-binding'` | real shape: owner question Q2 |
| (Q3) String `prefer` naming an executor without a matching `for` | that capability becomes a candidate | it does not | real shape: owner question Q3 |
| Non-object entry (`foo: null`, `foo: "x"`) | some sites treat it as declared, others not | one rule: declared only when a non-null object (arrays count, as the doctor rows do today) | schema refuses a non-object entry at load (`additionalProperties.$ref capability`, `type: object`) |
| `bindCapabilityPostures` given `{runner:{capabilities}}` | reads the nested section (`seat-binding-checks.mjs:37`) | flat only | its one caller passes the flat section from `loadRunnerConfig` (`seat-binding-checks.mjs:98-113`) |
| String-valued `aliases` | `registeredCapabilityOf` substring-matches (`config.mjs:378`); `resolveAlias` ignores it | ignored (`Array.isArray`) | schema: `aliases` is an array |
| plan-lint given an odd config shape: neither `runner` nor `capabilities` (raw catalog), or `runner` without `runner.capabilities` | raw catalog read as the catalog; `runner` without a catalog falls back to top-level `capabilities`, else skips the check (`capability-plan-lint.mjs:478`) | the section is `config.runner ?? config`; no catalog means every unit is unregistered | no caller passes one: bin passes the flat runner section (`bin/fgos.mjs:2376,2388`), tests pass `{runner:{capabilities}}` (`test/report/capability-plan-lint.test.mjs:464,625,681`) or nothing |

Everything else is byte-identical, including the proposal's truthy `verify` check (`propose.mjs:449`).

## Phases

| Phase | Title | Effort | Depends on | Status |
|---|---|---|---|---|
| [01](phase-01-door.md) | Door: the read port, crate slice, persona, rigor, minCheckers, aliases; equivalence harness and base evidence | 4h | - | pending |
| [02](phase-02-execution-readers.md) | Execution readers: verify, legacy decoder, run record | 1h | 01 | pending |
| [03](phase-03-dispatch-readers.md) | Dispatch readers: purpose resolution, confinement request, plan, load validator | 3h | 01 | pending |
| [04](phase-04-setup-doctor-readers.md) | Setup/doctor readers; delete old seat-resolver lookups | 2h | 01 | pending |
| [05](phase-05-workflow-report-cli-readers.md) | Workflow proposal, plan-lint, CLI | 1.5h | 01 | pending |
| [06](phase-06-purpose-executor-through-bind.md) | Purpose -> executor through `bind()`; first-prefer chooser and reverse match deleted | 6h | 01, 03; owner answers Q1-Q3 | pending |
| [07](phase-07-guard-docs-equivalence.md) | The door made mechanical: rows in the `doors` table, docs, final equivalence | 2h | 02, 04, 05, 06; F0 phase 01 on main | pending |

## Parallel map

```
01 ──┬── 02 ───────────────┐
     ├── 03 ── 06 (Q1-Q3) ─┤
     ├── 04 ───────────────┼── 07 ── land
     └── 05 ───────────────┘    ▲
                                │
     F0 phase 01 (doors table) on main
```

- 01 alone first (it creates the port every other phase imports and moves helpers with all their importers).
- 02, 03, 04, 05 run at the same time: file sets are disjoint (checked below).
- 06 starts when 03 is merged (same files: `resolve.mjs`, `plan.mjs`, `work-dispatch.mjs`) and the owner has
  answered Q1-Q3; it runs beside 02, 04, 05 (disjoint from them). Its questions block only 06; 01-05 go ahead.
- 07 last, after 02, 04, 05, 06 are merged and F0 phase 01
  (`plans/261114-2051-rust-verb-migration-program/phase-01-manifest-artifact.md`, the `doors` table) is on main;
  rebase the integration branch on main first. 07 builds no guard: it adds rows to F0's table.
- Landing: each phase merges into the integration branch `capability-reads-one-door` (01; 02-05 in any order; 06
  after 03; 07). After every merge the big lead runs the union of the merged phases' focused gates plus
  `test/architecture.test.mjs`. The branch lands on main once, so the rows and the last reader move land in the
  same change. Interim (01 merged, 04 not): `capabilityEntriesOf`/`hasUsablePrefer` exist in both the port
  (private) and seat-resolver; 04 deletes the seat-resolver copy. Nothing lands on main in between.
- Port changes after 01: a phase that needs one stops and asks the big lead, who grants one writer at a time for
  `capability-config.mjs` and its test; never two phases at once.

Hot files, one writer at a time (serial by dependency, never parallel):

| File | Writers, in order |
|---|---|
| `src/runner/execution/capability-config.mjs` + its test | 01 (later only via the big lead's one-writer grant) |
| `src/runner/execution/seat-resolver.mjs` | 01, then 04 |
| `src/runner/dispatch/config.mjs` | 01, then 03 |
| `src/runner/dispatch/plan.mjs` | 01 (import line), then 03, then 06 |
| `src/runner/dispatch/resolve.mjs`, `src/runner/work-dispatch.mjs` | 03, then 06 |
| `src/runner/dispatch/mechanism.mjs` | 06 only |
| `src/setup/registrations.mjs` | 04 only |
| `docs/architecture-manifest.json` | 01 (file row), then 07 (`doors` rows) |
| `plans/.../reports/equivalence/compare-capability-reads.mjs` | 01, then 06 (allowlist and probes; 07 runs it) |

File-disjointness of the parallel set (Modify sets): 02 {loops/verify.mjs, legacy-seat-read.mjs, run.mjs};
03 then 06 {resolve.mjs, plan.mjs, confinement/request.mjs (03), config.mjs (03), work-dispatch.mjs, mechanism.mjs (06)};
04 {registrations.mjs, seat-binding-checks.mjs, seat-resolver.mjs};
05 {propose.mjs, capability-plan-lint.mjs, bin/fgos.mjs}. No overlap between 02, 04, 05 and the 03->06 chain.
`work-dispatch.mjs` (tier 7, Work) is written only by 03 (comment) and 06 (one call site); no other phase touches it.

## Collision risk (with plans/261114-2051-rust-verb-migration-program, step F0)

Read from `origin/plan/rust-verb-migration-program` 3509d10f3 (phase 01 only; other F0 phases' file lists are the big lead's to cross-check).

| File | Phase here | F0 | Handling |
|---|---|---|---|
| `docs/architecture-manifest.json` | 01 (file row), 07 (`doors` rows) | F0 phase 01 adds the `doors` array and its first row; later F0 phases add rows | 07 waits for F0 phase 01 on main; both edits are additive rows |
| `test/architecture.test.mjs` | none | F0 phase 01 adds the `doors` check | this plan no longer edits it |
| `bin/fgos.mjs` | 05 | F0 phase 01 edits `publicManifestEntries`/`handleHelp` (`bin/fgos.mjs:3825-3989`) | 05 edits only the `plan-lint` case (2324-2405); rebase first |
| `src/setup/registrations.mjs` | 04 | not in F0 phase 01 | big lead checks later F0 phases |
| `docs/platform/seat-binding/spec.md`, `docs/platform/vision.md` | 07 | not in F0 phase 01 | additive lines |

Mitigation: rebase before each phase; edits line-local and additive; one writer per file inside this plan; the
big lead orders landings if F0 writes the same files.

## Acceptance criteria

1. Mechanical door (phase 07, rows in F0's `doors` table): no product file except
   `src/runner/execution/capability-config.mjs` reads the `capabilities` property of a runner config; executor
   choice from `prefer` happens only in the seat-binding crate (`preferOf`/`normalizePreferCandidates`/`bindingTasteOf`
   called only from their listed files); `resolveExecutorAndOverrides` and `capability.prefer` appear nowhere;
   `catalogOf` only in the port, `run.mjs` and `registrations.mjs`. A violation fails naming the row's job (the door
   to use), the file and the line.
1b. Purpose choice (phase 06): `fgos dispatch decide --for`, `decide --work`, a positional row name and the Work unit
   build get their executor from `bind()` (`purposeSeatOf`); `decide --for <label> --needs-soul --has-live-task-access`
   for a label with no own pool stays `in-process`.
2. Equivalence (phases 01, 06 and 07): `compare-capability-reads.mjs` runs base (781537524) and head each in its own
   child process over the shipped standard config, this repo's config and a synthetic edge matrix (phase 01),
   and reports zero differences outside the Intended deltas allowlist (including the Q1-Q3 deltas); doctor rows (phase 01 list) print the
   same messages at base and head. Committed evidence is digests and diff summaries only.
3. Owning proof: `test/runner/execution/capability-config.test.mjs` proves each lookup rule and each intended
   delta once.
4. `npm test` and `cargo test --workspace` green on the integration branch (big lead, at landing).
5. No change in `core/config-standard/`, `core/config-schema/`, `packages/`, `apps/`, `CHANGELOG.md`, `Cargo.lock`.
6. Docs: seat-binding spec states the one-door rule, its §15 records step 1, §16 points at the port; vision bullet records step 1 landed.

## Rollback

Before landing: revert merges on the integration branch in reverse order (07; 06; 05, 04, 03, 02 in any order with 06
before 03; then 01); 01 cannot be reverted while any of 02-06 is merged. After landing: revert the single landing merge on main.
No data, config or record format changes (the run-record hash is proven identical).

## What step 1 leaves ready for step 2

- One module lists every question asked of a capability row; removing rows means changing answers in one place
  and the crate slice, not hunting 18 files; the `doors` rows keep new readers out.
- No executor chooser outside the crate is left (phase 06), so step 2 changes rows, not choosers.
- Leftovers for step 2: the nested `{runner:{capabilities}}` tolerance of `entriesOf`; the `fgos-coding-implement`
  indirection (a Work step skill that is itself a capability row, resolved through `purposeSeatOf` and handed to
  the unit as a soft `prefer`); `DEFAULT_CAPABILITY_SLOTS` (below).
- `DEFAULT_CAPABILITY_SLOTS` (`src/setup/registrations.mjs:1710-1781`) is not a pure copy of catalog rows, so it is
  kept for step 2 (big lead's rule). It differs from the shipped catalog: interim `confinement: { mode: 'unconfined' }`
  on `advise`, `review`, `code:review`, `code:debug` where the catalog says `required`/`host-write-denied` for
  `advise` and `review`; its own descriptions; no `prefer`; `docs:write` and the generated Workflow slots with
  their own wording. No product code reads it at run time: its readers are three test files
  (`test/report/capability-plan-lint.test.mjs:16-21`, `test/setup/capability-catalog-doctrine.test.mjs:13-65`,
  `test/runner/dispatch-confinement-p04.test.mjs:26,856-861`) and one message string that tells users to register
  a capability there (`src/report/capability-plan-lint.mjs:714`, wrong: nothing reads it). Deleting it means moving
  those doctrine tests onto the shipped catalog and resolving the confinement contradiction, which is the row
  rewrite step 2 does; the misleading message goes with it.

## Ideas (not done; RUL104: owner chooses)

- The proposal accepts a whitespace-only `code:implement.verify` (`propose.mjs:449`, truthy) that the gate it
  predicts refuses (`case-gate.mjs:66`, trimmed). Asking `verifyCommandOf` in both would align them. Kept
  identical here because step 1 must not change reads.
- Doctor confinement rows 25-26 re-check what the load validator refuses (`config.mjs:732-756`); one could go.
- `policyId in cfg.confinementPolicies` (`config.mjs:738`) and `customPolicies[policyId]`
  (`registrations.mjs:3017,3524`) accept `Object.prototype` names as policy ids (pre-existing; schema pattern `\S`).
- `bind.mjs` is 607 lines against the 600 budget in seat-binding spec §16.

## Owner questions

Three questions, all from phase 06 (the purpose chooser). They block only phase 06; phases 01-05 run without them.
Each says what a yes authorizes.

### Q1. Which door answers a purpose served only by a tool executor (`impact-analysis`, `pane-labeling`)?

- **What is happening:** `fgos dispatch decide --for impact-analysis` answers `gitnexus` today by taking the first
  `prefer` entry of the row (`resolve.mjs:237-262`). Phase 06 deletes that chooser, and `bind()` cannot take its
  place for these purposes: the seat-binding crate refuses a seat whose candidates are all tool executors
  (`not-an-agent-seat`, `packages/seat-binding/rust/src/rank.rs:228-244`; spec §1 limits Seat Binding to agent seats).
- **Cause:** checked the crate, the spec scope and both configs. This repo's and the global config already declare
  the same fact a second way: each tool executor names its capability in `for` (`gitnexus: for: [impact-analysis]`,
  `herdr: for: [pane-labeling]`), which the tool registry (`src/state/tool-registry.mjs:93-115`, `fgos tool query
  --capability`) already uses. A 2026-08 decision (D5, `docs/history/capability-capacity-remodel/CONTEXT.md`, quoted in
  `resolve.mjs:210-223`) said an executor's own `for` never binds a purpose, only `prefer` does; it was written for
  agent executors (`agy`), but its text covers tools too.
- **Options:**
  - A. Tool purposes resolve through the tool registry's `for`: when `bind()` refuses `not-an-agent-seat`, the first
    `kind: tool` executor whose `for` names the purpose. Gain: one fact in one place (the tool registry already owns
    "which tool serves X"); no Rust change; step 2 can drop `prefer` from tool rows. Harm: narrows D5 for tool
    executors; a project whose tool executor lacks `for` but whose row has `prefer` gets `unconfigured` (here and in
    the global config every tool declares `for`). Cost: ~15 lines in `plan.mjs`, 2 test cases.
  - B. Extend the seat-binding crate to answer tool-only seats with the first tool candidate. Gain: literally one
    chooser for everything. Harm: widens a recorded authority (D-ADR0072 scope, spec §1/§3) and needs a new D-ADR;
    a Rust change with fmt, clippy, msvc and aarch64-apple-darwin gates. Cost: ~60 lines Rust plus golden vectors,
    spec edits, about 1 day.
  - C. Keep a tool-only `prefer[0]` reader as the one named exception in the `doors` row. Gain: no behaviour change.
    Harm: a second chooser stays, against the big lead's decision. Cost: ~10 lines.
- **Recommendation:** A. It removes a duplicate fact instead of adding authority, and matches step 2's direction
  (tool rows remain as abilities; the generic jobs keep the agent pools).
- **Scope of the answer:** a yes to A authorizes phase 06 requirement 2's tool branch and recording D5's narrowing in
  seat-binding spec §15. It does not authorize removing `prefer` from tool rows (step 2) or touching the crate.

### Q2. May `decide` and the Work unit build name the executor `bind()` would actually run, instead of the row's first `prefer` entry?

- **What is happening:** after phase 06 a purpose's executor is `bind()`'s answer. For real configs this differs
  from today when the first `prefer` entry cannot run on this machine or at this tier: its CLI is not installed, its
  family has no cell at the row's tier, its accounts are quarantined, governance disallows it, or it cannot carry
  the posture. Today `decide` names that executor anyway, and its tier/model policy is silently dropped as
  `policy.executor-mismatch-ignored` (`plan.mjs:388-393`); after, it names the next usable one, or answers
  `unavailable` with the refusal. Also: the reported invocation becomes the bound one (for example the herdr
  invocation when herdr is present, where an unpinned first entry reports none today); `bindingSource` becomes
  `seat-binding` instead of `capability.prefer`; the Work unit's soft `prefer` (`work-dispatch.mjs:502`) becomes the
  bound executor.
- **Cause:** traced every caller (phase 06 table). The standard `execute` and `fgos-coding-implement` rows start
  with `gemini`, so a machine without its CLI is a real case.
- **Options:**
  - A. Accept: `decide` answers what will run. Gain: one chooser; `decide` stops naming executors that cannot
    start; tier, model and executor agree. Harm: `decide --for` now depends on machine state (CLIs, accounts), as
    `fgos run` already does; tests need fake CLIs on PATH. Cost: inside phase 06's 6h.
  - B. Keep `prefer[0]`. Gain: no change. Harm: the second chooser stays (the big lead rejected this). Cost: none.
- **Recommendation:** A.
- **Scope of the answer:** a yes authorizes the listed `decide`/Work answer changes and a CHANGELOG line at landing
  (the big lead writes it). It does not change how `fgos run` or workflows bind (already `bind()`).

### Q3. The reverse `prefer` match: delete it, or make it match list-shaped `prefer`?

- **What is happening:** `resolveCapabilityDetailsFromHints` adds every capability whose `prefer` equals the
  executor id as a candidate capability (`resolve.mjs:66-71`), but only a string `prefer` can match. The big lead
  asked for it to be fixed.
- **Cause:** a list-aware fix would make every row that lists an executor a candidate: about 30 standard rows list
  `claude`. The rules then pick the first candidate with required confinement (`resolve.mjs:89-96`), so a
  Work-driven dispatch with no explicit purpose would get `advise` or `review` (both `confinement: required`) as its
  capability. Today the match fires only for this repo's `impact-analysis: prefer: gitnexus`, and `gitnexus`
  declares `for: [impact-analysis]`, which the tool branch (`resolve.mjs:57-63`) already adds. The match infers a
  capability from an executor, which the same function forbids for agent executors (`resolve.mjs:55-56`).
- **Options:**
  - A. Delete it. Gain: no capability inferred from `prefer`; one reader less; nothing changes for this repo or the
    standard config. Harm: a project with a string `prefer` naming an executor that lacks a matching `for` loses that
    candidate (a schema-valid, real shape). Cost: −7 lines, 1 test case.
  - B. Match any list entry. Gain: literal fix. Harm: Work-driven capability identity changes broadly on real
    configs (above); confinement anchors move. Cost: ~5 lines, plus re-proving every Work dispatch's capability.
  - C. Keep string-only. Harm: the asymmetry stays (rejected by the big lead).
- **Recommendation:** A.
- **Scope of the answer:** a yes authorizes phase 06 requirement 5 and its delta row; nothing else in capability
  identity resolution changes.

## Red Team Review

### Session — 2026-11-14
**Findings:** 31 raw from 4 reviewers (Failure Mode, Assumption, Scope/Contract, Security/Fact), deduplicated to 15 (13 accepted or partly accepted, 2 rejected)
**Severity breakdown (deduplicated):** 0 Critical, 8 High, 7 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---|---|---|---|
| 1 | `catalogOf` nesting fallback widens flat-only readers, incl. host-run `verify` | High | Accept: flat-only section; nested tolerance only where it exists today (`entriesOf`) | plan, 01, 02 |
| 2 | Plan-lint precedence claim false; raw-catalog branch removal unproven | High | Accept: precedence via `config.runner ?? config`; deletion recorded with caller evidence | plan (Intended deltas), 05 |
| 3 | Load validator keeps raw field reads; "one field one reader" overclaimed | High | Accept: validator asks port functions; `catalogOf` limited to run record + doctor presence | plan, 03, 07 |
| 4 | Equivalence script blind: two well-formed configs, missing questions, no doctor base, unusable plan-lint base | High | Accept: synthetic matrix, added questions, doctor base in 01, plan-lint base on an existing plan dir | 01, 04, 05, 06 |
| 5 | Doctor confinement rows' malformed/skip/presence branches not reproducible | High | Accept: `hasCapabilityEntry` = non-null object; `catalogOf` for presence | 01, 04 |
| 6 | Own-key change affects all `Object.prototype` names, not only `__proto__` | Medium | Accept: Intended deltas table + probes + tests | plan, 01 |
| 7 | Three existence rules presented as one; alias substring | Medium | Accept: one existence predicate, `Array.isArray(aliases)`, deltas recorded | plan, 01, 03 |
| 8 | `inherit` flag defaults to prefix inheritance | Medium | Accept: split names (`minCheckersOf`/`ownMinCheckersOf`, `hasPreferPool`/`hasOwnPreferPool`) | 01, 02, 04 |
| 9 | `propose.mjs` whitespace change violates "same reads" | Medium | Accept: keep truthy check through port; alignment moved to Ideas | 05, plan |
| 10 | Retier of `operation-capability.mjs` | Medium | Accept: port gets tier override 0 like `rigor.mjs`; no retier | 01 |
| 11 | Guard gaps: string-literal access, rename destructuring, file-level exemptions | Medium | Accept, then reshaped by the second amendment: receiver lookbehinds and the three read shapes in the `doors` row patterns, door named in the row's job | 07 |
| 12 | Harness fragility (one process, silent skips), evidence privacy, unregistered base path | Medium | Accept: child process per side, missing-at-head fails, digests only committed, base must be a registered worktree | 01, 06 |
| 13 | Rollback order, merged-branch gates, late port amendments | Medium | Accept: reverse-order rollback, union gate after each merge, one-writer grant for the port | plan |
| 14 | Collapse per-field functions into `entryOf(cfg, name)` | High | Reject: it hands out entries and moves field reads back to callers, the opposite of the owner's "one field, one reader"; existence functions merged instead (row 7) | - |
| 15 | Field-level lexical guard (`.prefer`, `.confinement`, …) | High | Reject: those names are shared with executor/invocation/unit/template shapes (`executor.confinement`, `unit.verify`, `template.persona`), so the rule would be mostly false positives; the port never returns an entry, and the `catalogOf` caller table closes the only path to raw entries | - |

Fact-check fixes applied: `BIND_CONTRACT_VERSION` is `bind.mjs:21`; `seat-resolver.test.mjs:6` import line added to phase 01;
full `verifyCommandOf` caller list added above. Docs scope trimmed: `docs/reading-map.md` dropped (spec §16 pointer suffices).

### Amendment — 2026-11-14 (big lead review of 4c25ea79e)

Applied: (1) the purpose chooser moves into step 1 as phase 06 (`purposeSeatOf` -> `bind()`; lookup branches 1-3 of
`resolveExecutorAndOverrides` stay as `lookupExecutor`, branch 4 deleted; every caller listed); (2) the reverse match
is deleted (Q3; the list-aware fix was analysed and is option B); (3) `DEFAULT_CAPABILITY_SLOTS` kept for step 2 with
the reason (What step 1 leaves ready); (4) the guard covers executor choice from `prefer`; (5) the real-shape deltas
are owner questions Q1-Q3. Second amendment: the guard is rows in F0's `doors` table (phase 07), not a mechanism of
its own; the earlier receiver-level self-check is dropped (F0's check owns its proof).

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
