# Phase 17: Pre-commit config check, lock rows, `dispatch-decide` on a config refusal

Depends on 07 (D's native `fgos config check`). Suggested executor: sonnet. Three file-disjoint sub-steps. Board shared: `.githooks/pre-commit` and `src/setup/holder-lock-checks.mjs` (HARDEN, MAIL): post first.

## Files it may touch

`.githooks/pre-commit`, `src/setup/holder-lock-checks.mjs`, `scripts/dispatch-decide-hook.mjs`, and their tests (phase 00 names the existing hook test files, for example `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`, and the lock-row test).

## Design

- **Pre-commit (C15, spec section 11):** when a staged path is `.fgos/config.yaml` or `.fgos/config.json` (or the global names in a worktree-less case is out of scope), run `<host> config check` through the host the hook already resolves (`resolveActiveHostBin`, `:560`, the same cold-client pattern as `identityData` at `:117`), cwd the committing toplevel, with the hook's timeout and `killSignal`. Non-zero exit refuses the commit and prints the refusal ids from the JSON envelope (file, line, column, path; no values). **No host binary found: warn and continue**, as the lock check does (`:154`). The check validates the working-tree file (what `fgos config check` reads), stated in the message; a staged-only check is not built.
- **Lock rows:** `LOCK_FILES` (`holder-lock-checks.mjs:208`) gains `'project-config'` -> `<fgosDir>/locks/project-config.lock` and `'global-config'` -> `<lockRoot>/global-config.lock` (B's registry rows, `packages/holder-lock/contracts/lock-registry.v1.json`); the existing registry-vs-`LOCK_FILES` test fails today if a row has a lock file and no entry, which is the proof.
- **`dispatch-decide` (C14):** the hook imports `decideExecutorCli` in process and fails open on any throw (`:63-65`, header `:20-23`). Add one branch: a thrown error for which the facade's `isConfigRefusal(err)` is true (or a `RunnerConfigError` carrying a `config-*` code) returns a block whose message names the refusal ids and `fgos config check`; every other failure (stdin, door unavailable, timeout) stays fail-open. Exit code 2 as for the existing block. Update the header comment to say both rules.

## Steps

1. Merge `origin/main`; `impact` on `decideBlock`; edit; add cases: hook refuses a commit that stages a config file with a refusal (real temp repo, real host from the launcher env), allows a clean one, warns without a host; hook script blocks on a broken project config and still allows when the addon is missing.
2. Run the hook test files and `test/setup/holder-lock-checks*.test.mjs` through the launcher.

## Owning proofs

Hook refusal and warn: the hook test; lock rows: the registry test; hook fail-closed rule: one case in the dispatch hook's existing test file.

## Risk / rollback

Risk: a broken config blocks all Agent calls (L x M, intended by spec; the message names the fix). Rollback: revert the hook edit; the others are independent.
