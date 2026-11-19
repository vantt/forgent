# Phase 02: tier-0 leaves out of the deleted directories

Wave 2. Depends on: 0. Effort 1d. Lands on the integration branch. Moves only; no behaviour change.

## Context

Three tier-0 leaves live in directories phases 20 and 21 delete (P19, design principle 2):

- `src/run-supervisor/payload-root.mjs` (52 lines; `OWN_PAYLOAD_ROOT`, `realpathOrNull`, `releasePayloadRoot`,
  `releasePayloadManifest`; tier 0 by `docs/architecture-manifest.json:55`; layer entry `:1859`; re-checked on `f031ab0c8`). Importers:
  `src/native/door.mjs:7`, `src/event-store/consumers.mjs:5`, `src/seat-binding/client.mjs:21`, `src/workflow/loader.mjs:12`,
  `src/verbs/dispatch/inspect.mjs:10` (missed on `b5b237534`), `src/run-supervisor/{direct-launch:24,attempt-step:11}.mjs`,
  `src/runner/execution/unit-run-record.mjs:12`; tests naming the
  path: `test/event-store/consumers.test.mjs:32`, `test/run-supervisor/attempt-steps.test.mjs:19`,
  `test/runner/dispatch-reconciliation-import-graph.test.mjs:219` (V14). Target `src/util/payload-root.mjs` (P8).
- `src/runner/dispatch/stop-processes-inside.mjs` (82 lines; a thin Node user of `src/native/process-identity.mjs:20`,
  which is the addon `process` namespace). Importers: `scripts/run-tests.mjs:31`, `scripts/lib/test-file-watchdog.mjs:28`,
  `scripts/run-rust-dev-host.mjs:9`, `test/helpers/process-tmp-root.mjs:14` (named by about 610 test files on `f031ab0c8`),
  `src/runner/dispatch/confinement/cleanup.mjs:13`, `src/runner/dispatch/worker-home.mjs:42`; layer entry
  `docs/architecture-manifest.json:1881`; tests
  `test/runner/stop-processes-inside.test.mjs`, `test/scripts/run-rust-dev-host-staging.test.mjs`. Target
  `src/native/stop-processes-inside.mjs` beside `process-identity.mjs` (V6, F14): `npm test` and `npm run fgos:dev`
  keep needing only the addon, never a built host; the engine (phase 11) uses `fgos-process` directly and ports no copy.
- `src/runner/execution/capability-config.mjs` (157 lines; tier 0 by manifest `:67`, layer `:1642`; imports only
  `src/runner/rigor.mjs`). Importers outside the deleted dirs: `bin/fgos.mjs:2274` (dynamic `import()`), `src/runner/operation-capability.mjs`,
  `src/setup/{executor-profile-warnings,registrations,seat-binding-checks}.mjs`, `src/workflow/propose.mjs`,
  `test/helpers/executor-model-vectors.helper.mjs`, `test/state/domain-registry-compiled.test.mjs`; inside:
  `src/runner/dispatch/{cli,config,confinement/request,plan,resolve,tool-providers}.mjs`,
  `src/runner/execution/{legacy-seat-read,loops/verify,run,seat-resolver}.mjs`; test
  `test/runner/execution/capability-config.test.mjs`. Target `src/runner/capability-config.mjs`, beside its only
  dependency `rigor.mjs` and `operation-capability.mjs` (both tier-0 overrides in `src/runner/`; S7 retires them).
  The doctor registry also names the old path: its `layers` map (`packages/distribution/contracts/doctor-registry.v1.json:145`,
  step `S6a`) and the `judge` lists of `workflow-capabilities-configured` (`:483`), `confinement-policies-declared`
  (`:664`) and `confinement-strict-readiness` (`:726`); `test/architecture.test.mjs` ("every layer is a file",
  `:2091`) fails on a stale path, so this phase rewrites them (key renamed, step kept `S6a`).

## Requirements

- `git mv` each file to its target, content unchanged (`OWN_PAYLOAD_ROOT` stays `../..`, same depth; the other two
  have no path arithmetic). `git mv test/runner/execution/capability-config.test.mjs test/runner/capability-config.test.mjs`.
- Every importer imports the new path; no re-export left behind.
- Manifest, same change (V4): drop the old tier entries (`:55` and the `src/runner/execution/capability-config.mjs: 0`
  line `:67`) and layer entries (`:1642`, `:1859`, `:1881`); add the new paths; rewrite every `doors` entry naming the
  old paths: the two rows whose job text names `src/runner/execution/capability-config.mjs` (`:968`, `:1048`) and the
  `allowed`/`path` entries `:976`, `:1199`.
- Doctor registry, same change: rename the four `src/runner/execution/capability-config.mjs` entries above to
  `src/runner/capability-config.mjs` (layers step stays `S6a`; the rows keep their owners).
- Wave 2 note: no other wave-2 phase edits Node files or `doctor-registry.v1.json` (its other writers, 15 and 17, sit
  in waves 5 and 6).

Footprint added by the 2026-11-19 re-check (plan.md table too): `src/verbs/dispatch/inspect.mjs`,
`packages/distribution/contracts/doctor-registry.v1.json`.

## Steps

1. `rg -n "payload-root|stop-processes-inside|capability-config" src bin scripts test docs apps packages` and list
   every hit (on `f031ab0c8`: the importers above plus `packages/distribution/contracts/doctor-registry.v1.json` and the
   generated `mutation-census.v1.json`, `test/suite-baseline.json`).
2. Move, rewrite imports, update the manifest and test paths; regenerate the census and suite baseline.
3. Gates: `test/architecture.test.mjs`, the tests importing any changed file (at least
   `test/runner/stop-processes-inside.test.mjs`, `test/scripts/run-rust-dev-host-staging.test.mjs`,
   `test/runner/capability-config.test.mjs`, `test/event-store/consumers.test.mjs`), `test/setup/git-mutation-census.test.mjs`.

## Validation

`ls src/run-supervisor/payload-root.mjs src/runner/dispatch/stop-processes-inside.mjs src/runner/execution/capability-config.mjs`
fails for each; `rg -n "run-supervisor/payload-root|dispatch/stop-processes-inside|execution/capability-config" src bin scripts test docs/architecture-manifest.json packages/distribution/contracts/doctor-registry.v1.json`
empty; architecture test green.

## Risk and rollback

Risk: a release-tree path list names an old file (packaging); step 1 covers `packages/`. Risk: the 614 tests using the
process helper break on a bad import; the helper's own test plus one full-suite sample in the gate. Rollback: revert
the commit.
