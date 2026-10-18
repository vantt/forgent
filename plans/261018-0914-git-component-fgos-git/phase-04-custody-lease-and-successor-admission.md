# Phase 04: custody lease across the runner commit, successor admission

- **Depends on:** plan 6.3 landed (it owns `assignment-runner.mjs`, `cli.mjs` and the supervisor crate until it lands); open question Q5 answered or defaulted (who owns the lease extension: this plan or 6.4).
- **Branch / worktree:** `git/p04-custody`, `.claude/worktrees/git-p04`.
- **Model / effort:** opus, rigor critical; 20h.
- **Parallel with:** phase 02. **Collides with:** plan 6.4 (owns `run.mjs`, `assignment-runner.mjs`, `recovery-planner.mjs`); see Q5.
- **Landing:** stop-everything on every workspace and machine of the owner's list (Event Store Q2, shared as Event Store M2) (holder-lock §12 quiesce), because an older controller commits with no lease and leaves no predecessor record, which a new successor would read as a handoff (red team FM2).

## Context

- Spec §6 (Q2 lease extension, successor admission, M3/P-CUSTODY fold), §5 rank 30 row and opaque-handle rule, §15 V-CUSTODY, M3; §17 prohibited claims about a free lease; §18 item 5.
- Holder-lock §3 (acquire runs predecessor admission), §5, §8 (record `<lock>.predecessor.json`, step 0 release rule, step 4 overwrite), §19.
- Code facts (re-verified at `8cbe3084f`):
  - controller takes attempt 15 and cwd 30 in `acquireAttemptLocks` (`src/run-supervisor/direct-launch.mjs:47-73`) and closes both copies right after binding (`src/runner/dispatch/assignment-runner.mjs:2486-2494`);
  - the envelope names `cwdLeaseFile` only on Windows (`assignment-runner.mjs:2456-2458`); Unix `Locks::complete` keeps only fd 4, no path, and `declare_on_lease` is a no-op (`packages/run-supervisor/rust/src/supervise/unix.rs:43-56`);
  - supervisor releases its copy at gate exit (`supervise.rs:339-340`);
  - runner commit runs later in the controller with no lease and plain `execFileSync` git children (`src/runner/execution/run.mjs:676-690`, `:802-806`; `commit-unit-work.mjs:90`, `:430`); the provider-limit failover loop re-dispatches in the same worktree inside one `run.mjs` call (`run.mjs:780-800`);
  - holder-lock admission judges a `linux-pgroup` or `macos-tree` record `Empty` from a dead leader and an empty group, so a `setsid` escapee is invisible (`packages/holder-lock/rust/src/predecessor.rs:180-183`; `packages/process/rust/src/containment/mod.rs:231-253`); unconfined attempts use `linux-pgroup`, darwin uses `macos-tree` (`direct-launch.mjs:175`).

## Requirements

1. **One lease per unit run.** `runUnit` in `run.mjs` acquires the `dispatch-cwd` lease once for a writing unit (through `acquireAttemptLocks`'s scope) and owns it until the last attempt's commit, its receipt and the handoff; every attempt of that run (including provider-limit failover) is handed the same description, never a second acquire in the same process. Released in one `finally` that covers every throw path of `executeAssignment` (`launch-unknown`, `run-control-superseded`, `run-unreconciled`). `direct-launch.mjs` gains a release of the attempt copy only. The herdr door (`cli.mjs:652`, `:798`), if 6.3 leaves it, takes the handed lease instead of acquiring.
2. **Domain declared on the lease, every platform.** The envelope carries `cwdLeaseFile` on every platform; Unix `Locks` stores it; `declare_on_lease` writes the holder-lock predecessor record on the lease file, as Windows does. No new record type (spec §6: no Custody entity).
3. **Recorded handoff.** After the commit receipt the controller, still holding the lease and with the attempt's domain observed empty (gate exit, supervisor receipt), clears its own predecessor record through a new holder-lock call `clear_domain(handle)` (Node facade `handle.clearDomain()`), then releases. This is holder-lock §8 step 0 made explicit: a holder clears only its own record and only after its domain is empty. An absent record therefore means "handed off or no producer ran".
4. **Admission rule** (one function, `admitSuccessor` in `src/runner/dispatch/cwd-lock.mjs`), run before the producer of a writing unit starts:
   - read the predecessor state with the existing read-only route (`fgos internal lock-fd --predecessor-state <lease>`): a record whose kind is best-effort (`linux-pgroup`, `macos-tree`) → `custody-predecessor-unknown` without acquiring;
   - otherwise acquire: holder-lock proves a `linux-gate` or `windows-job` domain empty or kills it and waits; `held (predecessor-domain-not-empty)` → `custody-predecessor-unknown`;
   - a mutating producer whose attempt would run without a declared domain is refused at start with `custody-domain-required`; step 1 lists every producer path with its domain source.
   `custody-predecessor-unknown` preserves the worktree (reported by `git-worktree-recovery`); a workflow-managed unit is re-dispatched in a new worktree; `fgos run --worktree <path>` stops with the cause.
5. **Git children carry the lease now.** From this phase the Node commit core runs every git and hook child of the runner commit through `runBorrowed(custody, …)` (spec §6: a dying caller must not free the worktree while git writes). On Windows the borrow replaces the lease's single predecessor record with the git job; the producer domain is already proven empty at gate exit, so nothing is lost; requirement 3 clears it after the commit.
6. **`--force-shared-cwd` with writes** is refused with `custody-required`; read-only sharing unchanged. CHANGELOG line.
7. **Docs:** holder-lock §8 (holder clears its own record) and §19 bullet; run supervisor spec §4 (controller keeps its copy; `cwdLeaseFile` on all platforms); runner spec history with a link to Git §6.

## Files

| Action | File |
|---|---|
| edit | `src/runner/execution/run.mjs` (lease per unit run, failover, resume admission, `--force-shared-cwd`), `src/runner/execution/commit-unit-work.mjs` and `unit-sync.mjs` (git children through `runBorrowed`) |
| edit | `src/runner/dispatch/assignment-runner.mjs` (envelope `cwdLeaseFile`, accept the handed lease), `src/run-supervisor/direct-launch.mjs` (attempt-copy release), `src/runner/dispatch/cwd-lock.mjs` (`admitSuccessor`), `src/runner/dispatch/cli.mjs` (only if 6.3 left the herdr acquire) |
| edit | `packages/run-supervisor/rust/src/supervise/unix.rs`, `packages/run-supervisor/contracts/envelope.v3.json` (`cwdLeaseFile` all platforms) |
| edit | `packages/holder-lock/rust/src/port.rs` and `predecessor.rs` (`clear_domain`), `src/holder-lock/index.mjs` (`clearDomain`) |
| create | `test/runner/custody-lease-commit.test.mjs`, `test/runner/custody-successor-admission.test.mjs`, `packages/run-supervisor/rust/tests/unix_lease_record.rs` |
| edit | `docs/platform/holder-lock/spec.md` §8, §19; `docs/platform/run-supervisor/spec.md` §4; `docs/specs/runner.md` history; `CHANGELOG.md` |

## Steps

1. Record the Q5 outcome on the board; audit every path that starts a mutating producer after 6.3 (direct, terminal, any other adapter) with its domain source; list them in the phase report.
2. Envelope `cwdLeaseFile`, Unix `declare_on_lease`, holder-lock `clear_domain` with tests.
3. Lease per unit run, attempt hand-over, failover, throw paths.
4. `admitSuccessor` and refusals; `runBorrowed` for commit children.
5. `--force-shared-cwd`; docs; CHANGELOG; opus review; stop-everything landing.

## Validation

```bash
cargo test -p fgos-run-supervisor -p fgos-holder-lock
node --test test/runner/custody-lease-commit.test.mjs test/runner/custody-successor-admission.test.mjs test/runner/assignment-cwd-mutex-concurrency.test.mjs test/runner/claim-capacity-race.test.mjs test/holder-lock/*.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p04 build> npm test
```

Vectors (real `flock`, pipe barriers):
- **V-CUSTODY / M3:** lease held from producer start through commit and handoff (a second dispatch is refused during the commit); provider-limit failover reuses the lease (no self-exclusion); a failed round followed by the next round on the same worktree; controller SIGKILLed with a live producer descendant (`setsid` too): pidns (`linux-gate`) → successor waits for the gate, then is admitted only with the domain empty; unconfined (`linux-pgroup`) and darwin (`macos-tree`) → `custody-predecessor-unknown` and a new worktree; controller killed during `git commit` → the borrowed git child keeps the lease until it exits; supersede and `launch-unknown` throws release the lease; a producer path without a domain → `custody-domain-required`.
- **P-CUSTODY:** no overlapping writer after admission over 20 repeats.

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Owner keeps the lease fold in 6.4 (Q5) | Medium × Medium | This phase then supplies only requirements 2-4 and the vectors; 6.4 does 1, 5, 6 against this contract. |
| Every unconfined or macOS controller death strands a worktree | Medium × Low | Expected fail-closed (spec §6); new worktree keeps the item moving; doctor count. Signal: count grows → prioritise containment drivers (outside this plan). |
| Longer lease hold delays the next round on that worktree | Medium × Low | Hold covers only the commit; measured in E3. |

## Rollback

Revert and reactivate through stop-everything. A predecessor record left on a lease file is judged by holder-lock as before, by the older release too.
