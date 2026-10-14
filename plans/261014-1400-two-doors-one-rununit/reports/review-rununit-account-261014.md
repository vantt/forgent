# Review: rununit account pin + partial-writes retry stop (feat/rununit-account)

Scope: `git diff main...feat/rununit-account` (a1f69644e, dc22a2e51), 12 files, +494/-16.
Focused tests run: `account-pin.test.mjs`, `run-provider-failover.test.mjs` (28/28 pass), `run-verb.test.mjs -t account` (4/4 pass). `npm test` not run (as instructed).

## Verdict

No HIGH defects. The lease path is real: `dispatchBound` hands `executeAssignment` a config narrowed by `configPinnedToAccount` (run.mjs:428), `executeAssignment` uses `opts.runnerConfig` as-is (assignment-runner.mjs:1231), and the lease keys the same normalized bucket. The in-dispatch capacity fallback (`attemptProviderCapacityFallback`) cannot route a pinned seat to another executor, because runUnit's `assignment.policy` never carries `fallbackExecutors` (assignment-policy.mjs:211,389). Resume keeps the recorded binding (and its `account`), and `--account` is refused together with `--resume`. Four MEDIUM issues need a decision or fix before the pin and the stop are trustworthy.

## MEDIUM

**M1. A pinned stop hides partial writes, so a later resume runs on top of them.** run.mjs:703-705
`if (bound.account) return stopRetry('account-pinned', …)` runs before the partial-writes check at line 706. A pinned writing seat that changed the worktree and then hit its limit returns `reason: 'account-pinned'`, with no `paths` and no `headMoved`. The message tells the person "pin another account or wait". After the quarantine ends, a `--resume` re-dispatches the same attempt, and a fresh worker meets the half-done work without knowing it. Change (B) was written to prevent exactly this.
Fix: run `writesSince` for pinned seats too, and attach `paths`/`headMoved` (or use reason `partial-writes`, with the pin noted in the detail) whenever the baseline differs.

**M2. Read-only checker seats get a baseline, which gives false `partial-writes` stops.** run.mjs:655
The gate is `writeScope.length > 0` (the unit), not `!readOnly` (the seat). In `reviewed`, checkers and the `verify` command run at the same time (reviewed.mjs:300-333), and `verify` executes in the worktree (run.mjs `verify`, `execSync(verifyCmd, { cwd: worktree })`).
Scenario: the verify command writes a non-ignored file (a formatter `--write`, an updated snapshot, a coverage or report file). Meanwhile the reviewer hits a quota. `writesSince` blames the reviewer, and its rotation is blocked even though its own sandbox wrote nothing. The new test "a read-only seat of a writing unit still rotates" passes only because nothing else writes during it.
Fix: capture the baseline only when `!readOnly`. The confinement is what guarantees a read-only seat wrote nothing, which matches the brief ("read-only … keep current rotation").

**M3. The baseline survives a resume, so a "keep/finish, then resume" run can never rotate again.** run.mjs:655 (the `!attempts[attemptNo].writeBaseline` guard)
The stop message tells the person to "keep, finish or undo the changes, then resume". On resume, the same attempt index is re-dispatched and its old baseline is reused. If the person kept or committed the partial work, every later provider limit on that attempt compares against the pre-stop baseline. The kept files, or the moved HEAD, then trigger `partial-writes` again even when the relaunched worker wrote nothing. Rotation is silently off for the rest of that attempt.
Fix: re-take the baseline when a resumed run re-launches an attempt whose `retryStopped` is set, or more simply on every launch. Add a resume test for the "keep" and "undo" paths.

**M4. `--account` makes every `reviewed`/`panel` run refuse.** bin/fgos.mjs:2787-2795, run.mjs:213-216, bind.mjs:373
The CLI writes `account` onto every override and adds an unscoped one, so every seat is pinned. Checkers bind with `independentOf: ['producer']`, so a checker always lands on a different provider family. `resolveAccountPin` then refuses it (`account-pin-unknown`), and `assertAccountPinsBeforeRun` throws for the whole run. Separately, the pin does not steer candidate choice. `--account b1` (provider beta) on a capability whose prefer pool starts with alpha is refused rather than bound to beta, which is codified by the test "an account of another provider is refused". The only way to pin the producer alone is a hand-written scoped `--override`.
This is consistent with a strict reading of the brief, but it makes `--account` effectively solo-only. Decision needed, with three options:
- (a) Apply `--account` only to seats whose bound provider owns the account, and refuse only if none does.
- (b) Scope `--account` to the producer.
- (c) Keep the current behavior and document "solo or same-provider seats only" in the registry description and the spec.
Separately, decide whether the pin should filter the candidate pool to the account's provider.

## LOW

- **L1. The dry-bind simulation's session differs from the real one.** dry-bind.mjs:28 / run.mjs:208-212. The real `runRole` sets `herdrPresent: detectHerdrPresent()` and `blind`, but the simulation (CLI path, no `options.session`) uses `herdrPresent` undefined and passes no `blind`. A candidate approved only through a herdr invocation, or a unit with `blind: true`, can simulate a different executor than the real bind. The result is a false refusal before the run, or a pin that is only refused at bind time (`policy-refusal` after the unit run exists).
- **L2. Baseline capture is uncaught and reads whole files into memory.** run.mjs:655-658, partial-writes.mjs:26. The post-limit comparison is wrapped in try/catch, but the launch-time `worktreeSnapshot` is not. A dirty file that cannot be read (EACCES), or one over 2 GiB (`readFileSync` RangeError), makes the whole `runUnit` throw, where before this change it would have run. Each attempt also hashes every untracked file synchronously and persists the map in `unit.json`, which is slow and bloats the file on worktrees with many non-ignored untracked files. Use a streamed hash or size+mtime, and fall back to "unknown → stop at limit time" instead of throwing.
- **L3. Known blind spots.** Gitignored paths are not seen, and submodule content is not seen either (`--ignore-submodules=dirty`). This is acceptable but is not stated in the spec.
- **L4. The pin pre-check does not verify the account's login store for the bound invocation's CLI.** The lease's `cli` filter (assignment-runner.mjs:1647) can still refuse at dispatch, after the unit run exists. The stop then reads "pin another account or wait", which is misleading for a missing login store and for a credential fault. Consider checking `credentialSourceForCli` in `resolveAccountPin`.
- **L5. `capacityProviderOf` and the lease can disagree on the provider.** `capacityProviderOf` derives the provider with `deriveProviderFamily(entry)` and its default command `'claude'`. The lease uses `policy.providerModel`, or `resolveProviderFamilyForExecutor`, which reads the CLI command. For an executor with no `provider`/`providerModel` whose command is not claude, the pin is validated and narrowed against `claude` while the lease reads another bucket, so the pin is silently ignored. This is pre-existing code moved out of account-rotation.mjs, but the pin now depends on it. Current `~/.fgos/config.json` executors all declare `providerModel`.
- **L6. `snapshotRunnerConfig` now runs earlier.** It moved ahead of ref resolution (run.mjs:325). It can write missing default keys into `.fgos/config.json` even when the run is then refused for a bad ref. The impact is minor.

## Test gaps

- No test where HEAD moves with a clean tree (a worker commit), the only case `headMoved` alone catches.
- No test that a writing seat on a clean worktree still rotates after the baseline was added. The existing rotation tests appear to use read-only units; please confirm.
- No pinned and partial-writes test (M1), no checker-plus-verify concurrency test (M2), and no resume-after-`partial-writes` test (M3).
- No test of `--account` with `--pattern reviewed` (M4); the behavior is untested whichever way it is decided.
- No CLI test that `--override` holding `account` together with `--resume` is refused or ignored. It is currently silently ignored, as all `--override` is on resume (pre-existing).

## Docs / DoD

- The change is user-visible (`fgos run --account`, a new `fallbackExhausted.reason` of `account-pinned` / `partial-writes`), but there is no `CHANGELOG.md` `[Unreleased]` line and no `docs/specs/runner.md` RUL entry. AGENTS.md requires both. They may belong to a later docs lane; please confirm.

## Verified non-issues

- Lease bypass via the internal capacity fallback: not reachable from runUnit (no `fallbackExecutors` in `assignment.policy`).
- Provider normalization in `configPinnedToAccount`, `providerAccountInventory` and the lease: all three go through `normalizeProviderFamily`, so `openai-codex` and `openai` map to the same bucket.
- `healthy` in `inspectProviderCapacity` means "not quarantined" only (provider-capacity.mjs:1072), so a busy account is not misreported as quarantined.
- Rename, delete, revert-to-clean and re-touch of an already-dirty file are all detected by `writesSince` (key-presence check plus content hash, `--untracked-files=all`).

Status: DONE_WITH_CONCERNS
Summary: The pin goes through the lease with no bypass, and the partial-writes stop works for the tested solo writer. Four MEDIUM holes remain: a pinned stop hides partial writes, read-only checkers get false stops from a concurrent verify, a stale baseline persists across resume, and `--account` refuses every reviewed/panel run. Tests and the CHANGELOG/spec entries are missing for these.
