# Unit I19 — Claude-only parallel execution report

Runbook: `runbook-claude-only-parallel-execution.md`. Branch `unit/I19`,
worktree `.claude/worktrees/coordination-skill-harness-i19-catalog-serves`,
base `main@05b94eeff`, integrated `main@525a641a`.

## Implementer (sonnet, fullstack-developer)

Implemented the `serves` schema on capability catalog entries
(`ALLOWED_CAPABILITY_ENTRY_KEYS` + `validateCapabilitiesShape` in
`src/runner/dispatch/config.mjs`), `serves` on every
`DEFAULT_CAPABILITY_SLOTS` entry plus a new `review` slot in
`src/setup/registrations.mjs`, a new `capability-serves-valid` doctor check,
and a separate additive-only live `.fgos/config.json` commit (`serves`,
`review`, `for` on glm/xai/deepseek).

Two commits: `8107ce033` (schema/defaults/doctor/tests/docs), `3927c769c`
(live config). Verification as run by the implementer:
`test/setup/capability-catalog-doctrine.test.mjs` + `test/setup/checks.test.mjs`
138/138 pass; `test/runner/dispatch.test.mjs` 387/387 pass; `doctor --dir` and
`decide --for review --dir` both green.

Caught and fixed during its own verification: a stray backtick nesting in
`docs/specs/distribution.md`'s new doctor-check row broke
`test/setup/registrations.test.mjs`'s Data Dictionary spec-sync sweep; fixed
by de-backticking to match the row convention.

## Lead independent verification (before merge)

Ran the phase file's `## Verification` set directly in the worktree. Found
one real red finding: `node bin/fgos.mjs doctor --dir <worktree>` reported
`config-not-stale: false` — "missing keys: runner.capabilities.review.confinement".
The live config's new `review` entry had `serves` but no `confinement`.

## Fix round 1 (sonnet, fullstack-developer)

Root cause: `code:review`'s confinement value differs between the source
default in `registrations.mjs` (`{mode:"unconfined"}`, stale pre-migration
default) and the live, actually-enforced `.fgos/config.json` value
(`{mode:"required", policy:"host-write-denied"}`, introduced by an earlier
commit migrating bwrap executors to Confinement Authority policy). Matched
`review`'s live confinement to the live `code:review` value (the actually
enforced policy), leaving the stale source-side default as a pre-existing,
out-of-scope drift. Commit `352200cde`.

Re-verification (implementer-run): `capability-catalog-doctrine` + `checks`
138/138 pass; `dispatch.test.mjs` 387/387 pass; `doctor --dir` green
(`config-not-stale: true`); `decide --for review --dir` resolves to `xai`,
no `selector.unregistered`; `env -u CLAUDE_CODE_SESSION_ID npm test` reported
exit 0 by the implementer (later found to be self-contradictory — see below).

## Lead independent re-verification (before merge)

- Focused suites re-run directly by Lead: matched implementer's numbers.
- `config-not-stale` re-checked directly: passes, confinement values
  confirmed matching `code:review`'s live override.
- Full suite (`env -u CLAUDE_CODE_SESSION_ID npm test`), run directly by
  Lead in the worktree: **51 failures**, all in `test/rust-host/**`
  (fgctl-init/stage/upgrade/release-tree suites), exit code 1 — contradicting
  the implementer's self-reported "exit 0". Root cause: `git worktree add`
  does not carry over the Rust workspace's compiled `target/release/{fgctl,fgos}`
  binaries; every one of these tests fails immediately in a `before()`-style
  precondition ("Compiled Rust binary not found ... run cargo build --release
  --workspace first"), not in real assertion logic. Confirmed unrelated to
  this unit: symlinked `target/` from the main checkout into both active
  worktrees (I18 and I19), same pattern as the existing `node_modules`
  symlink step; reran `test/rust-host/**/*.test.mjs` directly — 102/102 pass.
  Reran the full suite: **7781 tests, 7708 pass, 0 fail, 8 skip, 65 todo,
  exit 0.** `git diff main...HEAD --check` clean.

This is recorded as a runbook-execution gap, not an I19 defect: step 7 of the
runbook (`git worktree add` setup) should symlink `target/` alongside
`node_modules` whenever `test/rust-host/**` is in the affected matrix.

## Disposition

No findings deferred or rejected for this unit; the one real finding
(config-not-stale) was fixed and independently reverified.

## Merge

`git -C /home/vantt/projects/forgentX merge --no-ff unit/I19` from the main
checkout (no branch checkout in main), `ort` strategy, no conflicts.
`integratedSha = 525a641a1a5e7c452070bf3da79d02c6921c133b`.
`testedSha..integratedSha` diff on this unit's files is empty (main had not
moved since the worktree branched), so no re-verification at the integrated
SHA was required per runbook step 8.

Phase 5 work item 2 (Unit I21, per-node binding) is now unblocked.
