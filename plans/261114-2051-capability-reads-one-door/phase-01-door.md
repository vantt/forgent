---
phase: 01
title: "Door: the capability read port, crate slice, persona, rigor, minCheckers, aliases; equivalence harness"
status: pending
effort: 4h
depends_on: []
---

# Phase 01 — Door

## Context

Read first: `plan.md` (Facts, Census, Field ownership, Section rule, Intended deltas);
`docs/platform/seat-binding/spec.md` §3, §6.2-6.4, §16; `src/runner/execution/bind.mjs`,
`seat-resolver.mjs:70-160`, `seat-policy.mjs`; `src/runner/dispatch/config.mjs:370-380`.
Worktree: linked worktree on branch `capability-reads-one-door` from `origin/main` (the big lead creates it).
Impact analysis: `fgos tool query --capability impact-analysis --status present`; if present, run `impact`
upstream on `capabilityEntriesOf`, `capabilityRigorOf`, `registeredCapabilityOf`, `seatConfigOf`,
`resolvePersona`, `deriveOperationCapability` and record the blast radius in the phase report; if inactive or
stale, say so and cross-check with `rg`.

## Requirements

1. New module `src/runner/execution/capability-config.mjs`: pure (no I/O, no clock), header comment
   `// Architecture guard: pure. The only module that reads runner.capabilities; it answers per field and never
   returns an entry object.` It imports only `../rigor.mjs`. The header names the two section rules (below).
2. Section rules (plan.md "Section rule"):
   - flat: `runner.capabilities`, own keys only (`Object.hasOwn`). Used by every function except the five below.
   - `entriesOf(cfg, cap)` (private; today's `capabilityEntriesOf`, moved verbatim incl. its
     `cfg.capabilities ?? cfg.runner?.capabilities` tolerance, own keys, non-null object values): exact, then
     `<prefix>:*` (text before the first colon; no prefix line without a colon; never the bare verb).
     Used by `capabilityPersonaOf`, `capabilityRigorOf`, `minCheckersOf`, `isCapabilityDeclared`, `hasPreferPool`.
3. Exports (each replaces existing inline code; no other export):

| Export | Semantics | Replaces |
|---|---|---|
| `catalogOf(runner)` | raw `runner?.capabilities` value (may be undefined or any value) | `run.mjs:100` (as `catalogOf(cfg) \|\| {}`, byte-identical to `cfg.capabilities \|\| {}`); presence test of doctor rows 25-26 |
| `capabilityNamesOf(runner)` | own keys of the flat section; `[]` when it is not a non-null object | enumeration sites |
| `hasCapabilityEntry(runner, name)` | own key whose value is a non-null object (arrays count, as the doctor rows treat them today) | `operation-capability.mjs:26`, `resolve.mjs:113`, doctor rows 25-26 skip/malformed test |
| `isCapabilityDeclared(cfg, cap)` | `entriesOf(cfg, cap).length > 0` | `registrations.mjs:1919`; plan-lint (with `registeredCapabilityOf`) |
| `registeredCapabilityOf(runner, name)` | `name` when `hasCapabilityEntry`, else the first key (insertion order) whose entry has `Array.isArray(aliases) && aliases.includes(name)`, else `undefined` | moved from `config.mjs:375-379`; replaces `resolveAlias`, `isKnownCapabilityName`, the validator's name set |
| `capabilityPersonaOf(cfg, cap)` | first of `entriesOf` with a truthy `persona` -> `{ persona, key }`, else `null` | `bind.mjs:72` |
| `capabilityRigorOf(cfg, cap)` | moved verbatim from `seat-resolver.mjs:91-97` (RangeError text unchanged) | — |
| `minCheckersOf(cfg, cap)` | first of `entriesOf` with `minCheckers !== undefined` -> `{ key, minCheckers }`, else `null` | `seat-resolver.mjs:139,144` |
| `ownMinCheckersOf(runner, name)` | the exact entry's `minCheckers` (raw, `undefined` when absent) | `legacy-seat-read.mjs:47`, `registrations.mjs:696-705` |
| `capabilityVerifyOf(runner, cap)` | the exact entry's `verify`, raw | `loops/verify.mjs:18`, `propose.mjs:449` |
| `capabilityConfinementOf(runner, cap)` | the exact entry's `confinement`, raw | `request.mjs:315-337`, `resolve.mjs:90-130`, validator, doctor rows 25-26 |
| `capabilityServesOf(runner, name)` | the exact entry's `serves`, raw | `registrations.mjs:1960-1962` |
| `capabilityDescriptionOf(runner, cap)` | exact `description` ?? `<prefix>:*` `description` ?? `null` (flat) | `bin/fgos.mjs:2399` |
| `preferOf(runner, cap)` | the exact entry's `prefer`, raw (string, list or undefined) | `resolve.mjs:67,238`, `seat-binding-checks.mjs:41-42` |
| `hasPreferPool(cfg, cap)` | some of `entriesOf` has a usable `prefer` (non-blank string or non-empty list; today's `hasUsablePrefer`) | `registrations.mjs:1931` |
| `hasOwnPreferPool(runner, name)` | the exact entry has a usable `prefer` | `seat-binding-checks.mjs:41` |
| `bindingTasteOf(runner)` | the crate slice moved from `seat-policy.mjs:23-49` (`scopeOf`, `capabilityOf`, non-null object filter) over the flat section | `seatConfigOf`'s capability part; validator taste keys and prefer sites (phase 03) |

   "Exact entry" = own key of the flat section with a non-null object value (`hasCapabilityEntry`). Every
   intended delta of plan.md follows from these definitions; nothing else may differ.
4. Switch the door's own files now:
   - `seat-policy.mjs` `seatConfigOf`: keeps its runner unwrap and `SEAT_CONFIG_KEYS`; `config.capabilities = bindingTasteOf(runner)`.
   - `bind.mjs` `resolvePersona`: takes `capabilityPersonaOf(runnerConfig, unit?.capability)` instead of
     `capEntries` (source string stays `capability:${key}`); drop `capabilityEntriesOf` from the import at `bind.mjs:19`.
   - `seat-resolver.mjs`: imports `capabilityRigorOf`, `minCheckersOf` from the port, deletes its own
     `capabilityRigorOf`; `checkerPlanOf` uses `minCheckersOf` for the config and for `DEFAULT_CAPABILITY_CONFIG`.
     Keep `capabilityEntriesOf` and `hasUsablePrefer` exported for now (only `registrations.mjs` and
     `seat-binding-checks.mjs` still import them); phase 04 deletes them.
5. Move `registeredCapabilityOf` out of `config.mjs` into the port; update importers `src/runner/dispatch/decide.mjs:10`
   and `src/workflow/propose-validate.mjs:16` (import line only).
6. `src/runner/dispatch/plan.mjs:18`: import `capabilityRigorOf` from the port (import line only).
7. `src/runner/operation-capability.mjs:24-26`: `hasCapabilityEntry(runnerConfig, domainCapability)`.
8. `docs/architecture-manifest.json`: file row `src/runner/execution/capability-config.mjs: kernel` and tier
   override `"src/runner/execution/capability-config.mjs": 0` (as `src/runner/rigor.mjs` has), so tier-0
   `operation-capability.mjs` may import it. No other row changes.
9. Equivalence harness (evidence, not a test):
   `plans/261114-2051-capability-reads-one-door/reports/equivalence/compare-capability-reads.mjs`
   `--base <path> --head <path> --out <dir>`.
   - Refuses unless both paths appear in `git worktree list` (or are the main checkout).
   - Runs each side in its own child process (`node` with that checkout's modules, `FGOS_HOST_BIN` set to the
     same activated host binary for both) and compares canonical JSON.
   - Inputs: (a) effective runner section of a fresh temp project (shipped standard) and (b) of this repo, both via
     that side's `loadRunnerConfigForDir`; (c) a synthetic matrix built in the script from (a): `verify` on
     `code:implement`, on `code:*`, whitespace-only, nested under `{runner:{capabilities}}`; `persona` and
     `minCheckers` on an exact and a prefix entry, `minCheckers: []`; string, list, pinned and blank `prefer`;
     a `null` and a string entry; string `aliases`; alias collision; a capability with no colon; prototype names
     (`constructor`, `toString`, `hasOwnProperty`, `__proto__`) as capability and executor ids; both
     `capabilities` and `runner.capabilities` present.
   - Questions per name (union of declared names, every alias, `code:review`, `review`, `nope:x` and the
     prototype names): `seatConfigDigestOf(cfg).digest`; `effectiveRigorOf`; `checkerPlanOf` for each rigor with
     the shipped `checkersByRigor`; `registeredCapabilityOf` (base `config.mjs`, head port); `verifyCommandOf`;
     `resolveExecutorAndOverrides`; `resolveCapabilityDetailsFromHints` per executor id and for
     `hints.candidates=[name]`; `deriveOperationCapability` per prefix domain; `buildConfinementRequest`
     (anchor, mode, policy); `compileDispatchPlan` with `purpose: name` (reasonCodes, executorId);
     `snapshotRunnerConfig` hash; the legacy checker decoder (through `legacy-seat-read.mjs`'s exported reader);
     `validateRunnerConfigShape` (pass, or error text); `lintPhaseUnits` on a unit list naming every probe;
     the proposal refusal list for one writing slice; `bind()` of a producer seat
     `{unit:{id, capability:name, writes:[]}}`, session `{headless:true, postureAtLaunch:true}`, minus
     `bindingInput.hostVersion`. Every error is recorded as text, never thrown.
   - A question missing at head is a failure; missing at base is skipped with a note. Differences listed in
     plan.md "Intended deltas" are matched by an explicit allowlist in the script (each entry names the delta row);
     anything else is a failure. Exit 1 on any failure.
   - Full outputs go to `.fgos/runtime/tmp/capability-equivalence/`; committed evidence is only
     `reports/equivalence/<run>.summary.json`: per input and question, the digest at base and head and the
     allowlisted delta names. No binding body, account or path is committed.
10. Base doctor evidence for phases 04/07: at base run `npm run fgos:dev -- doctor --json` (base checkout) and save
    the messages of rows `runner-patterns-config`, `workflow-capabilities-configured`, `capability-serves-valid`,
    `confinement-policies-declared`, `confinement-strict-readiness`, `seat-binding-dry-bind`, `seat-binding-route`
    to `.fgos/runtime/tmp/capability-equivalence/doctor-base.json` and their digests to
    `reports/equivalence/doctor-base.summary.json`.

## Files

- Create: `src/runner/execution/capability-config.mjs` (~130 lines), `test/runner/execution/capability-config.test.mjs`,
  `plans/261114-2051-capability-reads-one-door/reports/equivalence/compare-capability-reads.mjs`,
  `reports/equivalence/phase-01.summary.json`, `reports/equivalence/doctor-base.summary.json`
- Modify: `src/runner/execution/seat-policy.mjs`, `src/runner/execution/seat-resolver.mjs`,
  `src/runner/execution/bind.mjs`, `src/runner/dispatch/config.mjs` (delete `registeredCapabilityOf` only),
  `src/runner/dispatch/decide.mjs` (import), `src/workflow/propose-validate.mjs` (import),
  `src/runner/dispatch/plan.mjs` (import line 18 only), `src/runner/operation-capability.mjs`,
  `docs/architecture-manifest.json`, `test/runner/execution/seat-resolver.test.mjs` (import line 6 and the two
  moved assertions)
- Delete: none

## Tests

- New owning proof `test/runner/execution/capability-config.test.mjs`, one test per rule, each title naming its
  behaviour: exact before prefix, no prefix line without a colon, bare verb never consulted; nested section read
  only by the exact-then-prefix lookups, never by `capabilityVerifyOf`/`capabilityConfinementOf`/`preferOf`;
  alias resolves to its key, own key wins, string `aliases` ignored; prototype names are not declared; a `null`
  or string entry is not an entry, an array entry is; string, list and blank `prefer` for both pool functions;
  `minCheckers: []` is defined (clears); `ownMinCheckersOf` ignores the prefix entry; `bindingTasteOf` keeps only
  `tier, maxTier, prefer, roles, personas, seats` and normalizes a string `prefer` to a list; invalid rigor
  throws the same RangeError text. Fixture: a frozen object in the test with the shapes of this repo's
  `.fgos/config.yaml` (string `prefer` on `impact-analysis`, list with invocation pins, aliases, confinement,
  `code:*` with `roles`/`seats`/`minCheckers`, `persona`, `verify`, `serves`). Why no existing test proves it:
  these rules were spread over five modules with no common proof.
- Retired: the two `capabilityRigorOf` assertions in `test/runner/execution/seat-resolver.test.mjs:64-65` (inside
  the effective-rigor test, which stays) -> owned by `capability-config.test.mjs` (same assertions, moved).
- Unchanged owners re-run: seat-policy (slice and digest), bind, explain, seat-resolver, checker plan, dispatch decide.

## Steps

1. Write the harness; run it with `--base` = `--head` = the untouched worktree (must report 0 failures); save
   the doctor base (req 10).
2. Write the port and its test (test first: red, then green).
3. Switch seat-policy, bind, seat-resolver, operation-capability; move `registeredCapabilityOf`; fix imports.
4. Manifest row; `node scripts/run-tests.mjs test/architecture.test.mjs`.
5. Focused gates; run the harness `--base <781537524 worktree> --head .`; commit `phase-01.summary.json`.
6. `git diff --stat` before commit: only the files listed above. Commit, push the branch.

## Gates

```
node scripts/run-tests.mjs test/runner/execution/capability-config.test.mjs test/runner/execution/seat-resolver.test.mjs \
  test/runner/execution/seat-policy.test.mjs test/runner/execution/bind.test.mjs test/runner/execution/explain.test.mjs \
  test/runner/execution/bind-tier-composition.test.mjs test/runner/execution/bind-committed-config.test.mjs \
  test/runner/execution/run-gate.test.mjs test/runner/execution/loops/reviewed.test.mjs test/runner/execution/loops/debate.test.mjs \
  test/workflow/core-workflow-seats.test.mjs test/runner/runner-schema-vocabulary.test.mjs \
  test/runner/dispatch.test.mjs test/runner/dispatch-plan-policy.test.mjs test/runner/assignment-dispatch.test.mjs \
  test/runner/dispatch-reconciliation-import-graph.test.mjs test/runner/operation-choice.test.mjs \
  test/workflow/propose.test.mjs test/workflow/propose-validate.test.mjs test/setup/seat-binding-dry-bind.test.mjs \
  test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
```
Plus every other test importing a touched file (`rg -l "seat-policy.mjs|seat-resolver.mjs|bind.mjs|dispatch/config.mjs|decide.mjs|propose-validate.mjs|dispatch/plan.mjs|operation-capability.mjs" test`).
Rust: not touched.

## Net size

src: +~130 (port) −~35 (moved/inlined) ≈ +95; tests: +~130, −2 assertions; harness ~250 (plan reports, not shipped).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A moved lookup subtly changes | M x H | owning test per rule; harness over standard, repo and edge matrix, two processes, allowlisted deltas only |
| `bind.mjs` persona provenance string changes | L x M | keep `capability:${key}`; explain tests |
| Tier/layer guard refuses an import | L x L | port kernel layer, tier override 0, imports only `rigor.mjs` |
| Import graph test pins module imports | L x M | `dispatch-reconciliation-import-graph.test.mjs`; `config.mjs` gains no import in this phase |
| Harness leaks machine facts into git | L x M | only digests committed; full output under `.fgos/runtime/tmp` |

## Rollback

Revert the phase merge on the integration branch only while 02-06 are not merged (plan.md Rollback).

## Success criteria

All gates green; harness 0 failures (summary committed); `rg "function registeredCapabilityOf|function capabilityRigorOf" src`
finds only the port.
