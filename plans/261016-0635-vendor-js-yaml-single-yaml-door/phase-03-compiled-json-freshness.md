---
phase: 3
title: "Doctor checks compiled.json freshness"
status: completed
priority: P2
effort: "1h"
dependencies: [1]
---

# Phase 3: Doctor checks `compiled.json` freshness

## Goal

Now that the parser is always present, doctor check `domain-registry-compiled`
also reports a `compiled.json` that no longer matches its YAML, everywhere,
not only where the `yaml` package happens to resolve.

## Context (scouted)

- `compiled.json` stays (decision in plan.md): runtime reads it at import time
  (`src/state/domain-registry.mjs:62-100`), the build is
  `scripts/build-domain-registry.mjs` (`npm run build:domains`), drift is
  guarded by `test/state/domain-registry-compiled.test.mjs`.
- The doctor check (`src/setup/registrations.mjs:1496-1530`) only verifies the
  file exists and parses; its comment says the freshness half needs `yaml`.

## Files

- Modify: `scripts/build-domain-registry.mjs` (export the pure compile function
  if it is not exported already)
- Modify: `src/setup/registrations.mjs` (`checkDomainRegistryCompiled`)
- Modify: tests for the check

## Steps

1. Ensure the compile logic (registry gate: only directories with
   `registry.yaml`; sorted workflow files) is a pure exported function. If
   setup may not import from `scripts/` under the manifest rules, move the
   function into `src/state/` next to `domain-registry.mjs` (its owner) and
   have the script call it.
2. In the doctor check, for each domain with `registry.yaml`, compile from YAML
   inside a try; report `domains/<d>/compiled.json is stale — run npm run
   build:domains` when it differs, and `domains/<d>/<file>: cannot be parsed:
   …` when the YAML is malformed. Update the comment at `:1496-1498`.
3. Tests: stale compiled file → named stale problem; malformed workflow YAML →
   named parse problem and doctor still lists every check; fresh → pass.

## Verification

- `node --test test/state/domain-registry-compiled.test.mjs` and the check's tests.
- `node bin/fgos.mjs doctor` in the worktree reports the check as passing.
