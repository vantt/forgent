# P01 - Portable Test Runner And CI Proof

**Capability:** `code:implement`

**Depends on:** P00

## Purpose

Restore one cross-platform full-suite door on Node >=18 and make CI execute the
tests instead of failing during command parsing, per TFC-D02 and TFC-D04.

## Read First

`decision-lock.md`, `package.json`, `.github/workflows/ci.yml`, the P00 trace,
and the CI artifacts under
`plans/reports/artifacts/260915-npm-test-baseline-224f0803/`.

## File Lease

- Add: `scripts/run-tests.mjs`
- Add: `test/scripts/run-tests.test.mjs`
- Edit: `package.json`, `.github/workflows/ci.yml`, `CHANGELOG.md`
- Must not edit: `engines.node`, Rust jobs, external-consumer behavior, test
  contents outside the new runner's own tests

## Requirements

R1. Recursively discover every `*.test.mjs` below `test/` using Node built-ins.
R2. Sort and de-duplicate paths deterministically; pass them to `node --test` as
   argv elements without shell interpolation.
R3. Set `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` in the spawned child's merged env.
R4. Refuse zero discovered tests with a non-zero status and actionable message.
R5. Forward supported runner arguments/reporting options without allowing a
   caller to bypass the full file set through the default `npm test` door.
R6. Keep `npm test` semantics as full suite and use the same runner on all CI OSes.
R7. Tests prove discovered count equals the files actually present in a fixture
   tree and in the repository inventory.

## Adversarial Checks

- Spaces, quotes, backslashes, symlinks, and platform separators in paths.
- Accidental inclusion of fixtures that merely contain `.test.mjs` text.
- Argument ordering that makes Node interpret a file as an option.
- Windows env assignment regression.
- A reporter destination or forwarded option causing zero files to run.

## Verification

```sh
node --test test/scripts/run-tests.test.mjs
npm test
```

Remote acceptance additionally requires a CI run in which Ubuntu, macOS, and
Windows each report a non-zero test count. Cargo failures are recorded
separately and do not masquerade as test-lane execution failures.

## Acceptance

Node >=18-compatible APIs only; local full suite green; zero-selection test
green; repository inventory equality green; CI test lanes demonstrably enter
the Node test runner on all three OSes. Without authority to trigger CI, leave
the cell at its external-proof gate rather than claiming completion.

## Risks And Rollback

Risk is a portable-looking wrapper that silently selects fewer files. Roll back
`npm test` to its prior command only if the wrapper cannot prove R4/R7; the CI
defect then remains explicitly open and P02 must not start.

## Handoff

Record runner argv/env examples, discovered file count, local full-suite output,
and CI run links or the exact pending external gate. P02 uses this runner for
every sample.
