---
phase: 01
title: "Door: the capability read port, crate slice, persona, rigor, minCheckers, aliases"
status: pending
effort: 3h
depends_on: []
---

# Phase 01 — Door

## Context

Read first: `plan.md` (census, field table), `docs/platform/seat-binding/spec.md` §3, §6.2-6.4, §16;
`src/runner/execution/bind.mjs`, `seat-resolver.mjs:70-160`, `seat-policy.mjs`; `src/runner/dispatch/config.mjs:370-380`.
Worktree: linked worktree on branch `capability-reads-one-door` from `origin/main` (the big lead creates it).
Impact analysis: run `fgos tool query --capability impact-analysis --status present`; if present, run
`impact` upstream on `capabilityEntriesOf`, `capabilityRigorOf`, `registeredCapabilityOf`, `seatConfigOf`,
`deriveOperationCapability` and record blast radius in the phase report; if inactive or stale, say so and
cross-check with `rg`.

## Requirements

1. New module `src/runner/execution/capability-config.mjs`: pure (no I/O, no clock), header
   `// Architecture guard: pure. The only module that reads runner.capabilities.`; imports only
   `../rigor.mjs`. It is the one reader of every capability field (plan.md "Field ownership").
2. Exports (each replaces existing inline code; no other export):

| Export | Semantics (must equal today's) | Replaces |
|---|---|---|
| `catalogOf(cfg)` | `cfg.capabilities ?? cfg.runner?.capabilities`; `{}` when not a plain object | section access in the validator and the run record (callers switch in 03, 02) |
| `capabilityNamesOf(cfg)` | `Object.keys(catalogOf(cfg))` | enumeration sites (03, 04, 05) |
| `hasCapabilityEntry(cfg, name)` | own key with a truthy value | `operation-capability.mjs:26`, `resolve.mjs:113` |
| `isCapabilityDeclared(cfg, cap)` | exact or `<prefix>:*` object entry exists | `registrations.mjs:1919` |
| `registeredCapabilityOf(cfg, name)` | moved verbatim from `config.mjs:375-379` | — |
| `capabilityPersonaOf(cfg, cap)` | first of exact, `<prefix>:*` with a truthy `persona` -> `{ persona, key }`, else `null` | `bind.mjs:72` |
| `capabilityRigorOf(cfg, cap)` | moved verbatim from `seat-resolver.mjs:91-97` (RangeError text unchanged) | — |
| `capabilityMinCheckersOf(cfg, cap, { inherit = true })` | inherit: first of exact, prefix with `minCheckers !== undefined` -> `{ key, minCheckers }`; `inherit:false`: exact entry only; else `null` | `seat-resolver.mjs:139,144`, `legacy-seat-read.mjs:47`, `registrations.mjs:696-705` |
| `capabilityVerifyOf(cfg, cap)` | exact entry's `verify`, raw | `loops/verify.mjs:18` |
| `capabilityConfinementOf(cfg, cap)` | exact entry's `confinement`, raw | `request.mjs:315-337`, `resolve.mjs:90-130`, `registrations.mjs:2999-3013,3514-3528` |
| `capabilityServesOf(cfg, name)` | exact entry's `serves`, raw | `registrations.mjs:1960-1962` |
| `capabilityDescriptionOf(cfg, cap)` | exact `description` ?? prefix `description` ?? `null` | `bin/fgos.mjs:2399` |
| `preferOf(cfg, cap)` | exact entry's `prefer`, raw (string, list or undefined) | `resolve.mjs:67,238`, `seat-binding-checks.mjs:41-42` |
| `hasPreferPool(cfg, cap, { inherit = true })` | inherit: exact or prefix entry has a usable `prefer` (non-blank string or non-empty list; today's `hasUsablePrefer`); `inherit:false`: the exact entry only | `registrations.mjs:1931` (inherit), `seat-binding-checks.mjs:41` (exact) |
| `bindingTasteOf(runner)` | the crate slice moved from `seat-policy.mjs:23-49` (`scopeOf`, `capabilityOf`, object filter) | `seatConfigOf`'s capability part |

   Private helpers: `entriesOf` (today's `capabilityEntriesOf`), `hasUsablePrefer`. Own-key lookups use
   `Object.hasOwn`; this differs from today only for a capability literally named `__proto__` (today it
   matches `Object.prototype`); record that in the report as an intended change.
3. Switch the door's own files now: `seat-policy.mjs` `seatConfigOf` calls `bindingTasteOf(runner)` (the
   `SEAT_CONFIG_KEYS` part stays); `bind.mjs` `resolvePersona` takes `capabilityPersonaOf(runnerConfig, unit?.capability)`
   instead of `capEntries` (source string stays `capability:${key}`); `seat-resolver.mjs` imports
   `capabilityRigorOf`, `capabilityMinCheckersOf` from the port, deletes its own `capabilityRigorOf`, and
   `checkerPlanOf` uses `capabilityMinCheckersOf` for both the config and `DEFAULT_CAPABILITY_CONFIG`.
   Keep `capabilityEntriesOf` and `hasUsablePrefer` exported from seat-resolver for now (only
   `registrations.mjs` and `seat-binding-checks.mjs` still import them); phase 04 deletes them.
4. Move `registeredCapabilityOf` out of `config.mjs` into the port; update its importers
   `src/runner/dispatch/decide.mjs:10` and `src/workflow/propose-validate.mjs:16` (import line only).
5. `src/runner/dispatch/plan.mjs:18`: import `capabilityRigorOf` from the port (import line only).
6. `src/runner/operation-capability.mjs:24-26`: `hasCapabilityEntry(runnerConfig, domainCapability)`.
   Retier it in `docs/architecture-manifest.json` from `0` to `5` (its importers are tier 5 `plan.mjs` and
   tier 7 `work-dispatch.mjs`; a tier-0 file cannot import tier 5). Add the manifest row
   `src/runner/execution/capability-config.mjs: kernel`.
7. Equivalence evidence script (not a test): `plans/261114-2051-capability-reads-one-door/reports/equivalence/compare-capability-reads.mjs`
   with `--base <checkout> --head <checkout> --out <file>`. For each checkout it imports that checkout's
   modules and, for two configs — the effective runner section of a fresh temp project (shipped standard)
   and of this repo (`loadRunnerConfigForDir`, dev host via `FGOS_HOST_BIN`) — records for every name in the
   union of declared names plus probes (`code:review`, `review`, each alias, `nope:x`):
   `seatConfigDigestOf(cfg).digest`; `effectiveRigorOf({capability}, cfg)`; `checkerPlanOf` for each rigor
   with the shipped `checkersByRigor`; `registeredCapabilityOf` (base: `config.mjs`, head: port);
   `verifyCommandOf({capability}, cfg)`; `resolveExecutorAndOverrides(cfg, name)` (result or error text);
   `resolveCapabilityDetailsFromHints` for each executor id and for `hints.candidates = [name]`;
   `deriveOperationCapability` for each prefix domain; `buildConfinementRequest` requirement (anchor, mode,
   policy) or error text; `bind()` of a producer seat `{unit:{id, capability:name, writes:[]}}` with session
   `{headless:true, postureAtLaunch:true}` minus `bindingInput.hostVersion`. Errors are recorded as text,
   never thrown. Output is canonical JSON; the script prints a diff count and exits 1 on any difference.
   Questions whose function does not exist yet at a checkout are skipped with a note (none expected).
   This is the reproducible equivalence proof; it stays in the reports directory.

## Files

- Create: `src/runner/execution/capability-config.mjs` (~120 lines), `test/runner/execution/capability-config.test.mjs`,
  `plans/261114-2051-capability-reads-one-door/reports/equivalence/compare-capability-reads.mjs`
- Modify: `src/runner/execution/seat-policy.mjs`, `src/runner/execution/seat-resolver.mjs`,
  `src/runner/execution/bind.mjs`, `src/runner/dispatch/config.mjs` (delete `registeredCapabilityOf` only),
  `src/runner/dispatch/decide.mjs` (import), `src/workflow/propose-validate.mjs` (import),
  `src/runner/dispatch/plan.mjs` (import line 18 only), `src/runner/operation-capability.mjs`,
  `docs/architecture-manifest.json`, `test/runner/execution/seat-resolver.test.mjs` (move rigor cases out)
- Delete: none

## Tests

- New owning proof `test/runner/execution/capability-config.test.mjs` — one test per lookup rule, each title
  naming its behaviour: exact before prefix; a capability with no colon has no prefix line; the bare verb is
  never consulted; alias resolves to its key, own key wins; `hasCapabilityEntry` own keys only; string and
  list `prefer` and blank string for `hasPreferPool`, with and without inherit; `minCheckers: []` is defined (clears); inherit off
  reads the exact entry only; absent section and `{runner:{capabilities}}` nesting; `bindingTasteOf` keeps
  only `tier, maxTier, prefer, roles, personas, seats` and normalizes a string `prefer` to a list;
  invalid rigor throws the same RangeError text. Fixture: a frozen JS object in the test with the shapes of
  this repo's `.fgos/config.yaml` (string `prefer` on `impact-analysis`, list with invocation pins, aliases,
  confinement, `code:*` with `roles`/`seats`/`minCheckers`, `persona`, `verify`, `serves`). Why no
  existing test proves it: these rules were spread over five modules with no common proof.
- Retired: the two `capabilityRigorOf` assertions in `test/runner/execution/seat-resolver.test.mjs:64-65` (inside the effective-rigor test, which stays) -> owned by
  `capability-config.test.mjs` (same assertions, moved). `effectiveRigorOf` cases stay in seat-resolver.test.
- Unchanged owners re-run: seat-policy, bind, explain, seat-resolver, checker plan, dispatch decide.

## Steps

1. Run the equivalence script's base side once on the untouched branch to make sure it executes (base = head).
2. Write the port and its test (test first: red, then green).
3. Switch seat-policy, bind, seat-resolver, operation-capability; move `registeredCapabilityOf`; fix imports.
4. Manifest rows; `node scripts/run-tests.mjs test/architecture.test.mjs`.
5. Run the focused gate list; run `compare-capability-reads.mjs --base <781537524 worktree> --head .`;
   save `reports/equivalence/phase-01.json` and the printed diff count (must be 0).
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
  test/workflow/propose.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
```
Plus every other test that imports a touched file (`rg -l "seat-policy.mjs|seat-resolver.mjs|bind.mjs|dispatch/config.mjs|decide.mjs|propose-validate.mjs|dispatch/plan.mjs|operation-capability.mjs" test`).
Rust: not touched.

## Net size

src: +~120 (port) −~35 (moved/inlined code) ≈ +85; tests: +~110, −7.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A moved lookup subtly changes (nesting, own-key) | M x H | owning test per rule; equivalence script diff 0 over both configs incl. `bind()` |
| `bind.mjs` persona source string changes provenance | L x M | keep `capability:${key}`; explain tests cover it |
| Tier/layer guard refuses the new import | L x L | port is kernel, imports only `rigor.mjs`; retier `operation-capability.mjs` |
| Import graph test pins `config.mjs` imports | L x M | run `dispatch-reconciliation-import-graph.test.mjs`; `config.mjs` gains no import in this phase |

## Rollback

Revert the phase commit on the integration branch; no data or config written.

## Success criteria

All gates green; equivalence diff 0 (report saved); port is the only definer of the listed functions
(`rg "function registeredCapabilityOf|function capabilityRigorOf"` finds only the port).
