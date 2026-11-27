# Phase 2: Per-CLI credential source reds

## Inputs

- `reports/phase-01/verdict.md` (the rows owned by phase 2).
- `test/runner/provider-per-cli-credential-sources.test.mjs`.
- `src/runner/dispatch/provider-capacity.mjs`, `provider-credential-renewal.mjs`, `provider-credential-probe.mjs`,
  `confinement/drivers/bwrap.mjs`, `confinement/resources.mjs`.
- Commit `410f9ab4af` (provisioning and renewal write-back resolve the lease per invocation) and its message.
- Runner spec under `docs/platform/runner/` (credential stores per CLI).

## Footprint

- `src/runner/dispatch/provider-capacity.mjs`
- `src/runner/dispatch/provider-credential-renewal.mjs`
- `src/runner/dispatch/provider-credential-probe.mjs`
- `src/runner/dispatch/confinement/drivers/bwrap.mjs`
- `src/runner/dispatch/confinement/resources.mjs`
- `test/runner/provider-per-cli-credential-sources.test.mjs`
- `plans/261127-0829-red-tests-before-release/reports/phase-02/**`

## Steps

1. If phase 1 shows this file green, write `reports/phase-02/result.md` ("green at <tip>, no change", citing
   `reports/phase-01/listed-files.log`) and stop.
2. For each failing case, find the cause before changing code (bugfix workflow: prove the cause first). The known
   shapes are: `account "acct" declares no credential source for CLI "unknown"` (provisioning gets no lease for an
   unpinned per-CLI account), `lock-busy` on renewal, and a probe that does not call through the CLI's store.
3. Fix production code, or the fixture when the test builds a state that production can never reach. Never delete an
   assertion, add a skip or add an env switch.
4. Write `reports/phase-02/result.md`: cause, fix, and the commit.

## Verify

Unconfined (see the plan's runner requirement):
`node scripts/run-tests.mjs test/runner/provider-per-cli-credential-sources.test.mjs` exits 0. Then also run every
`test/runner/` file that imports a changed module (`rg -l` the module name in `test/`). All must pass.

## Rollback

Revert the phase commit.
