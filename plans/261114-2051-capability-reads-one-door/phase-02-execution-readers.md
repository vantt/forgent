---
phase: 02
title: "Execution readers: verify command, legacy checker decoder, run record"
status: pending
effort: 1h
depends_on: [01]
parallel_with: [03, 04, 05]
---

# Phase 02 — Execution readers

## Context

Port `src/runner/execution/capability-config.mjs` exists (phase 01). Read `plan.md` census rows 12-14 and the
field table. The verify command is what the reviewed loop, the run summary and the workflow gate run
(`docs/platform/workflow/spec.md:334,340`, RUL-WF-32/35; `src/workflow/case-gate.mjs:66` calls `verifyCommandOf`).
Its behaviour stays: the unit's own `verify` wins, else `capabilities.<capability>.verify` by exact key (no
prefix inheritance), a blank command is no command. Impact analysis as in phase 01 on `verifyCommandOf`,
`legacyCheckers`, `snapshotRunnerConfig`.

## Requirements

1. `src/runner/execution/loops/verify.mjs:17-20` `verifyCommandOf(unit, cfg)`:
   `const command = unit?.verify || capabilityVerifyOf(cfg, unit?.capability);` — rest unchanged. Export name
   and signature unchanged (phase 05 and `case-gate.mjs` call it).
2. `src/runner/execution/legacy-seat-read.mjs:47`: `...(capabilityMinCheckersOf(cfg, unit?.capability, { inherit: false })?.minCheckers || [])`.
   The decoder reads a stored snapshot (`configSnapshot.runner`), exact key only, as today.
3. `src/runner/execution/run.mjs:100` `snapshotRunnerConfig`: `capabilities: catalogOf(cfg)`. The recorded
   object and its hash must be byte-identical for any config the loader returns (`cfg.capabilities || {}` vs
   `catalogOf`: both give the declared object, `{}` when absent).

## Files

- Modify: `src/runner/execution/loops/verify.mjs`, `src/runner/execution/legacy-seat-read.mjs`, `src/runner/execution/run.mjs`
- Create/Delete: none

## Tests

No new test: behaviour unchanged and already owned —
`test/runner/execution/loops/reviewed.test.mjs` and `test/runner/execution/run-verify-pin.test.mjs` (verify
resolution), `test/runner/execution/legacy-seat-read.test.mjs` (legacy decoder),
`test/runner/execution/config-snapshot-hash.test.mjs` (record hash). Lookup rules are owned by
`capability-config.test.mjs` (phase 01). Retired: none.

## Gates

```
node scripts/run-tests.mjs test/runner/execution/loops/reviewed.test.mjs test/runner/execution/loops/solo.test.mjs \
  test/runner/execution/run-verify-pin.test.mjs test/runner/execution/legacy-seat-read.test.mjs \
  test/runner/execution/config-snapshot-hash.test.mjs test/runner/execution/run-gate.test.mjs \
  test/runner/execution/run-pre-admission.test.mjs test/runner/execution/run-summary-resume.test.mjs \
  test/state/domain-registry-compiled.test.mjs test/workflow/case-verbs.test.mjs test/architecture.test.mjs
node scripts/doc-health.mjs
node scripts/check-decision-citation-drift.mjs
```
Plus `rg -l "loops/verify.mjs|legacy-seat-read.mjs|execution/run.mjs" test` (every test reading a touched file).
Rust: not touched.

## Net size

src: ~0 (three expressions swap, three import lines added). Tests: 0.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Snapshot hash changes and old records look drifted | L x H | `config-snapshot-hash.test.mjs`; equivalence script compares the record hash of both configs (phase 06 run) |
| Prefix inheritance creeps into verify | L x M | `capabilityVerifyOf` is exact-key by contract (phase 01 test) |

## Rollback

Revert the phase commit; nothing persisted changes shape.

## Success criteria

`rg "capabilities" src/runner/execution/loops/verify.mjs src/runner/execution/legacy-seat-read.mjs src/runner/execution/run.mjs`
shows only comments and message text; gates green.
