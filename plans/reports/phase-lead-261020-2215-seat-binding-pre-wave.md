# Seat binding pre-wave: dev-door host resolution and record fence

## 1. Outcome

Two changes, both inert for current records and activations.

- **Dev door host resolution.** Chosen form: the dev door exports `FGOS_HOST_BIN` naming the staged host (`devHostEnv` in `scripts/run-rust-dev-host.mjs`). No change to `resolveActiveHostBin`, so there is no second path. Reason: every Node client (`host-bin.mjs`, `host-bin-path.mjs`, `session-identity.mjs`, `native.mjs`, run supervisor, terminal control) already honours `FGOS_HOST_BIN` first. The manifest form would need a new reader of `entries.fgos`, which is relative to the release root, and would only cover the one resolver.
- **Forward record fence.** `src/runner/execution/run.mjs` resume path refuses a `unit.json` whose `seatSchema` is present (this release knows none) with `RunnerConfigError` code `record-from-newer-release`, message naming `seatSchema`. The check runs right after the record is read and before it is validated or acted on. Read-only inspection (`unit-state.mjs`, `unit-summary.mjs`) is untouched.

## 2. Files

- `scripts/run-rust-dev-host.mjs`
- `src/runner/execution/run.mjs`
- `test/scripts/run-rust-dev-host-staging.test.mjs` (env builder test)
- `test/runner/execution/run.test.mjs` (resume refusal test, record left untouched)
- `CHANGELOG.md` (Unreleased line)

## 3. Adopt entries checked

`src/run-supervisor/` does not read `unit.json`. `assignment-runner.mjs` and `work-dispatch.mjs` read it only for worktree and assignment checks and do not resume; left unchanged. `recordInlineRun` reads and rewrites a record but is not a resume; not fenced (unit-record fields it does not know are preserved by the spread write).

## 4. Verification

- Verified by running: `test/scripts/run-rust-dev-host-staging.test.mjs` and `test/util/host-bin-path.test.mjs` (8 pass); the new resume-refusal test in `run.test.mjs` passes alone (98 s on a loaded machine).
- Full suite result is in the lead summary.

## 5. Notes for the board

Must be activated on forgentX, mdview, mcp-skill-hub and the second machine before the seat landing phase starts.
