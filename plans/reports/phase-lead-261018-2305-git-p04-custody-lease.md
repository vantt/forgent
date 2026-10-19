# Git phase 04: custody lease and successor admission

Base: `476d06d39`, branch `git/p04-custody`. Rechecked local main `7e358733c`: its only additional commit is coordinator documentation; the phase's production inputs are unchanged. Q5 belongs wholly to this phase. No board edit, commit, review dispatch, activation or landing was performed. Impact-analysis: inactive (zero registered providers).

## Implementation by requirement

| Requirement | Change / evidence | State |
|---|---|---|
| 1. One lease per Unit | `runUnit` owns the acquired cwd handle through rounds, provider failover, commit, persisted result and handoff; its outer `finally` closes it on every throw. `acquireAttemptLocks` accepts that handle and releases only its own attempt copy at binding. Standalone Assignments retain their lease until settlement. | Implemented; kernel/pidns end-to-end failover and exact exceptional-path vectors still need host execution. |
| 2. Domain on every lease | All mutating envelopes carry `cwdLeaseFile`; Unix declares the same existing predecessor record before GO. Windows carries `cwdLeaseOwner`, the existing lock-hold request endpoint: the still-holding helper must acknowledge `declare-domain` before GO. A dead helper cannot authorize a late start. Supervisor death still permits the producer to continue for adopt. | Unix real-process test passes; Windows implementation and real-host test added, not executed here. |
| 3. Recorded handoff | Rust `Handle.clear_domain()` and Node `handle.clearDomain()` observe empty without killing, validate held authority/resource, and remove only the unchanged record before release. Unknown-launch/recovery throws preserve the record. | Real live-domain refusal and subsequent empty-domain clearing pass. |
| 4. Admission | One `admitSuccessor` does the existing read-only predecessor observation, refuses best-effort/unknown records and maps unprovable acquisition to `custody-predecessor-unknown`. An allowed-kind check under the kernel lock closes the observation/acquire race. Recovery details name `git-worktree-recovery`, preserve, new-worktree. Unsupervised/inline writing producers refuse with `custody-domain-required`. | **Incomplete:** Workflow's fresh-worktree redispatch and an actual doctor `git-worktree-recovery` check are not wired; see write-scope blocker below. |
| 5. Commit children | Commit and sync git/hook children use the existing `runBorrowed` port with the same custody handle. Unix staging supplies stdin through that port; Windows uses bounded literal path batches under its existing null-stdin contract. Replaced Unix lock resources refuse before borrow. | Real git/hook FIFO tests pass, including controller SIGKILL while git retains exclusion. |
| 6. Shared cwd | Mutation plus `--force-shared-cwd` refuses with `custody-required`; read-only sharing still runs concurrently. Recovery parks custody refusals rather than retrying the old tree. | Real Assignment concurrency/refusal tests pass. |
| 7. Documentation | Updated holder-lock §3/§8/§19, run-supervisor §4, runner history, existing contract documents and CHANGELOG. No new predecessor record type, lock row, config default or environment switch. | Written; does not claim complete phase acceptance. |

## Producer-path audit

| Producer door | Domain source | Lease / refusal |
|---|---|---|
| Unit → Assignment → `cli-spawn` (direct) | Envelope-selected `linux-gate`, `linux-pgroup`, `macos-tree` or `windows-job`; supervisor binding before GO | Receives Unit handle; standalone Assignment acquires through its attempt scope. |
| Unit → Assignment → `herdr-spawn` (terminal) | Same supervisor containment/binding; terminal socket hands existing descriptions to the gate | Same handed handle; no second herdr acquire. |
| Direct `executeExecutorCli`, non-supervisor adapter | No declared supervised domain | Mutating launch refuses; explicit read-only sharing remains available. |
| Native/inline writing Unit | External harness cannot supply the supervised domain | `custody-domain-required`; no writing inline seat starts. |
| Sync-only Unit / runner commit | Trusted controller; git and hook children borrow the cwd handle | Holds custody before sync; no producer process needed. |

## Reverified prior art / changed facts

The phase file's `8cbe3084f` line references are stale. At this branch's base, `acquireAttemptLocks` was still at `direct-launch.mjs:49`, Assignment acquisition at `assignment-runner.mjs:2134`, Windows-only `cwdLeaseFile` at `:2429`, and both-copy release at `:2468`. Unix `Locks::complete` still retained fd 4 without its path, and `declare_on_lease` was a no-op. The supervisor still released its own copy at gate exit; this remains correct because the controller now retains its copy.

6.3 (`340cc7d85`) already routed both direct and herdr terminal Assignments through the supervisor. The remaining `cli.mjs:651` acquire belonged to the generic unsupervised executor door, not the terminal Assignment path. It is now refused for mutation. 6.4 (`eb4778c6c`, `a742c101a`) already added cancel-on-signal, the Unit controller seat, adopt-based resume and superseding cancelled attempts. Those paths remain; the new outer custody cleanup wraps their existing control cleanup. The bare verification `execSync` block is untouched.

Reused: holder-lock acquisition, predecessor record and observation route, `runBorrowed`, existing helper request/result files, supervisor domain declaration and binding, and the existing attempt acquisition scope. Missing prior art: there is no implemented `git-worktree-recovery` check/Workflow custody redispatch door in this base. No competing recovery mechanism was invented.

## Validation and reproduction

Run from this worktree. No script hardcodes `CARGO_TARGET_DIR` or copies the Cargo registry.

```sh
cargo build --locked -p fgos
cargo test -p fgos-run-supervisor -p fgos-holder-lock
cargo clippy --locked -p fgos-run-supervisor -p fgos-holder-lock --all-targets -- -D warnings

mkdir -p /tmp/fgos-work/p04-state /tmp/fgos-work/p04-fixtures
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
export FGOS_STATE_ROOT=/tmp/fgos-work/p04-state/fgos
export XDG_STATE_HOME=/tmp/fgos-work/p04-state
export FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/p04-fixtures
node --test test/runner/custody-lease-commit.test.mjs test/runner/custody-successor-admission.test.mjs test/runner/assignment-cwd-mutex-concurrency.test.mjs test/runner/claim-capacity-race.test.mjs test/holder-lock/*.test.mjs test/runner/recovery.test.mjs test/run-supervisor/windows-custody.test.mjs
node --test test/runner/custody-lease-commit.test.mjs test/runner/custody-successor-admission.test.mjs test/runner/assignment-cwd-mutex-concurrency.test.mjs test/runner/recovery.test.mjs test/run-supervisor/windows-custody.test.mjs
node --test test/runner/execution/commit-unit-work.test.mjs test/runner/execution/run-sync.test.mjs test/runner/execution/run.test.mjs test/runner/execution/run-provider-failover.test.mjs test/runner/execution/patterns/architecture-guard.test.mjs test/architecture.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID npm test
```

- Rust component tests and clippy pass on Linux. Existing pidns cases internally print `no-bwrap-pidns` skips when run with `--nocapture`; their reported harness success is **not** proof that those vectors ran. The new Unix lease-record test really runs with the portable domain.
- Targeted custody/Assignment/recovery set: **47 pass, 0 fail, 1 Windows skip**. It includes real flock, FIFO-blocked git hooks, controller SIGKILL during commit, a real setsid escapee after unconfined controller death, 20 successor generations with two attempts each, live-domain clear refusal, and unsupervised producer refusal. The 20-repeat check is component-level exclusion, not a claim that full V-CUSTODY/M3 passed.
- Required Node list plus recovery/Windows test: **142 pass, 11 fail, 21 skip** before the final added unsupervised-refusal case. Failures: four missing release-fgctl fixtures, six host-process scans unavailable inside this PID namespace, and one historical v1 payload fixture that imports missing `yaml`. Logs: `/tmp/fgos-p04-node.log`.
- Commit/sync/run/architecture group: **104 pass, 41 fail, 24 skip**. Required confinement probes fail because this sandbox cannot create user/PID namespaces. Logs: `/tmp/fgos-p04-run-core.log`.
- Full npm suite ran: **7,572 pass, 428 fail, 132 skip** (8,197 reported tests), plus a store-leak diagnostic for generated `.fgos/runtime/git-addon/native-addon.json`. It is not green. Failures include namespace/host-scan/terminal restrictions, missing release artifacts, and old direct mutating-executor expectations now refused by the required custody contract. No clean baseline was measured, so these are not all asserted pre-existing. Logs: `/tmp/fgos-p04-npm-test.log`.
- Initial attempts without the standard writable state/fixture overrides also failed on read-only host state and `/var/tmp`. The overrides above relocate fixtures/state; they do not disable a production check. `npm ci --ignore-scripts` found no package dependencies; it does not repair the historical v1 payload fixture.
- Full pidns/controller-death admission, end-to-end provider-limit failover, exact `launch-unknown`/superseded/unreconciled release vectors, and Windows/macOS behavior remain unproven here. Do not claim V-CUSTODY complete or land this phase from these results.

## Blocker, deviations and deferred work

Requirement 4 cannot be completed within this Assignment's write scope: `src/workflow/runner.mjs` currently catches a failed resume and records failure; it does not redispatch a custody-unknown Unit in a fresh worktree. Its corresponding `test/workflow/units-runner.test.mjs` is also outside scope. The requested named recovery check would need the setup/doctor registry (`src/setup/checks.mjs`, outside scope) coordinated with the Git recovery owner; the current error only carries recovery metadata. These paths were not written and are listed in the result claim's `needsWrites`.

Other explicit gaps: migrate old direct-mutation test fixtures to the supervised door while preserving their transport assertions; run the host-only matrix and Windows request/ack race test; then coordinator review and stop-everything landing. The Unit lease is acquired in its Unit scope before producer preparation/sync, while per-attempt scopes take only attempt locks when a handle is supplied (standalone Assignments still take 15→30 together). This uses existing scope semantics and avoids a second acquire; it differs from the phase's wording that the Unit acquisition itself occurs through the attempt scope.

MDView preview attempts failed: its database is read-only in this sandbox.

No new feature proposals were implemented. The Windows acknowledgement is an extension of the existing helper request channel, required to avoid both a pre-GO late-start race and changing 6.4's supervisor-death adoption behavior.

Status: BLOCKED
Summary: Custody lifetime, recorded handoff, fail-closed admission and borrowed runner commits are implemented in scope with real Linux evidence. Workflow redispatch/doctor wiring, legacy fixture migration and host-only acceptance remain incomplete.
Concerns/Blockers: write scope excludes required Workflow/setup callers; full suite is not green; Windows/macOS/pidns acceptance is outstanding.
Context refs:
- (none)
