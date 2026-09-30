# unit/P8b-js — claude-only execution report

Branch: `unit/P8b-js`, commit `649682f4e` (worktree
`.claude/worktrees/dispatch-engine-liveness-p8b-js-supervisor-rename`).

## Scope

JS-side half of Phase 8's C4 rename: `src/runner/dispatch/cli-spawn-supervisor.mjs`
→ `src/runner/dispatch/detached-run-supervisor.mjs`, reflecting the
`detached-run-supervisor` vocabulary decided against Rust's
`bound-invocation-supervisor` (`unit/P8b-rust`, already merged).

## What changed

**File**: `git mv` to `detached-run-supervisor.mjs`. Header comment rewritten to
name the `detached-run-supervisor` role explicitly and reference the Rust
`bound-invocation-supervisor` counterpart for contrast, mirroring
`bound_invocation_supervisor.rs`'s own header style.

**Renamed generic (non-adapter-specific) exported symbols**, all defined in this
file itself (re-exports from `proof-helpers.mjs`/`process-identity.mjs` left
untouched):

| Old | New |
|---|---|
| `startSupervisorProcess` | `startDetachedRunSupervisorProcess` |
| `runSupervisor` | `runDetachedRunSupervisor` |
| `publishSupervisorBinding` | `publishDetachedRunSupervisorBinding` |
| `readSupervisorBinding` | `readDetachedRunSupervisorBinding` |
| `publishWorkerBinding` | `publishDetachedRunWorkerBinding` |
| `readWorkerBinding` | `readDetachedRunWorkerBinding` |
| `publishAdapterReceipt` | `publishDetachedRunAdapterReceipt` |
| `readAdapterReceipt` | `readDetachedRunAdapterReceipt` |
| `isBoundProcessAlive` | `isDetachedRunProcessAlive` (also disambiguates from the unrelated Rust "bound-invocation" vocabulary) |
| `SupervisorBindingPathCollisionError` | `DetachedRunSupervisorBindingPathCollisionError` |
| `WorkerBindingPathCollisionError` | `DetachedRunWorkerBindingPathCollisionError` |
| `ReceiptPathCollisionError` | `DetachedRunReceiptPathCollisionError` |

**Left unchanged, per the task's explicit constraint**: `isCliSpawnRunStillWorking`,
`isHerdrSpawnRunStillWorking` (adapter-specific liveness checks, already
confirmed good names), the `'cli-spawn'`/`'herdr-spawn'` adapter identifier
string literals, `reconcileCliSpawnRun` (adapter-specific, contains its own
duplicate/dead-code copy inside this file that nobody else imports --
pre-existing, out of scope, its two internal `isBoundProcessAlive` call sites
were updated to the new name since that helper itself was renamed), and the
on-disk data-contract literals (`cli-spawn-supervisor-binding.v1`,
`cli-spawn-worker-binding.v1`, `cli-spawn-adapter-receipt.v1`,
`cli-spawn-launch-envelope.v1`) since those are serialized artifact contracts
read by other files via exact string match, not code symbols -- renaming them
would be a schema/compat change, not a symbol rename.

**Import sites updated** (16 files found via `grep -rl "cli-spawn-supervisor" src/
test/ --include="*.mjs"`, matching the Lead's own prior grep exactly):
`assignment-runner.mjs`, `transport.mjs`, `reconcile-cli-spawn.mjs`,
`settlement.mjs`, `confinement/attestation-store.mjs` (comment only),
`herdr-round.mjs` (comment only), `process-identity.mjs` (comment only),
`visibility-session.mjs` (comment only), `reconciliation-planner.mjs` (comment
only), and 6 test files (`assignment-dispatch.test.mjs`,
`cli-spawn-reconciliation.test.mjs`, `dispatch-confinement-authority.test.mjs`,
`dispatch-reconciliation-import-graph.test.mjs`, `herdr-reconciliation.test.mjs`,
`herdr-round-reconcile.test.mjs`). Each rename was done as a targeted,
context-verified `Edit` (or, for the 25 mechanical call-site substitutions
inside `cli-spawn-reconciliation.test.mjs` alone, a single-file `sed` restricted
to the exact already-grep-verified renamed identifiers via `\b` word
boundaries -- never a blind cross-repo find-and-replace, and never touching the
`'cli-spawn'`/`'herdr-spawn'` substrings).

**Real gap found and fixed, not part of the original 16-file list**:
`docs/architecture-manifest.json` is a machine-maintained one-row-per-real-file
registry (`test/architecture.test.mjs`'s "đủ sổ" invariant) that had 2 duplicate
rows keyed by the old filename (pre-existing duplicate-key data hygiene issue,
not introduced here, not fixed beyond the rename itself -- both rows renamed
identically since JSON.parse already collapses duplicate keys to the same
value). Missing this broke `test/architecture.test.mjs`'s "đủ sổ" and "import
một chiều xuống" checks (ENOENT reading the renamed-away path) on the first
full-suite run; fixed and reverified.

## Tests

- `node --test test/runner/cli-spawn-reconciliation.test.mjs`: 21/21 pass.
- `node --test` on all 5 other directly-touched test files: 157/157 pass.
- `node --test test/architecture.test.mjs`: 13/13 pass (after the manifest fix;
  failed before it).
- Full suite twice (`env -u CLAUDE_CODE_SESSION_ID npm test`): first run caught
  the architecture-manifest gap; second run after the fix: 7994 tests, 7921
  pass, 0 fail, 8 skipped, 65 todo, exit 0.

## Verification

Full-repo `grep` for every old symbol name and the old filename across
`src/`+`test/` returns zero matches except the intentionally-untouched data
contract literals (confirmed by direct inspection of each remaining hit).
`resolvedAdapter === 'cli-spawn'` / `'herdr-spawn'` call sites in
`assignment-runner.mjs` confirmed unchanged. `isCliSpawnRunStillWorking` (6
refs) / `isHerdrSpawnRunStillWorking` (4 refs) confirmed unchanged.

## Status

DONE. Committed on `unit/P8b-js` (`649682f4e`). Ready for Lead's independent
re-verification and merge -- this closes the track's last remaining unit per
the plan's own "Remaining for this track's own close" note.

Status: DONE
Summary: JS-side detached-run-supervisor rename complete across file + 12 generic symbols + 16 importers + architecture-manifest.json; full suite green (7994 tests, 0 fail) after fixing a manifest gap the rename itself surfaced.
Concerns/Blockers: none.
