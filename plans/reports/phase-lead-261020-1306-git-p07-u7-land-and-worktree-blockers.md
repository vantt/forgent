Worktree blockers are resolved, and the Work event adapter is migrated. The coordinated Land caller cutover remains blocked. Continued from `9d4c96e6b`; no staging, commit, activation, full npm test or E3 was performed.

| Item | Disposition / implementation | Evidence |
|---|---|---|
| A1 | Done. Forced clean session removal uses existing SafeRestore under checkout custody, retaining old HEAD at `refs/fgos/git-operations/<restore-id>/candidate` and its unacknowledged snapshot before resetting to the recorded start commit. Removal does not acknowledge that evidence. Success warns with both locations; subsequent cleanup refusal includes them in its error. Dirty removal restores the store link and keeps registry/checkout. SafeRestore/WAL now represent detached identity as `HEAD`, including recovery. | Full session file; detached retention/dirty refusal/recovery/removal regression in worktree-ports; Rust SafeRestore. |
| A2 | Done for WAL-proven ownership. Inspected prune from the partial commit checks exact successful create evidence, registration identity/backlinks and native residue, records WorktreeRemove before effects, and preserves unknown registrations. Added recognition of native `COMMIT_EDITMSG`, which the two committed-work fixtures actually leave. Missing detached history without a delivery ref preserves its registration rather than dropping the only history root. No global prune or registry-only ownership shortcut. | Both former missing-directory failures pass; Rust owned/unowned/unknown-residue and detached-history regressions pass. |
| A3 | Done. Reuse one operation-local, admin-held Worktree inventory for nesting and HEAD facts instead of rereading every unrelated config/HEAD on every create; reciprocal topology and rebase/bisect reservations still use the existing checks. Native `git worktree add` checks occupancy again at effect. Retained the partial commit's stamp-validated operation facts. No lock, custody, timeout, assertion or reach guarantee was relaxed. | Final unchanged 8-process / 160-worktree test passes in **69.482 s** untraced, under its original 240 s timeout; the earlier traced inventory variant passed in 179.135 s. |
| A4 | Done in the partial commit, reviewed and retained. Work import counting compares resolved import identity; `restore.mjs` no longer suffix-matches `store.mjs`. | Architecture suite passes. |
| B1 | Blocked. `withLockRetry` is a single call supplying a lock-acquisition wait budget, not a stale-destination retry policy. History shows `a54f85f5b` intentionally removed the earlier lock-contention retry/backoff. Even that retired loop retried only `lock-held`, not destination movement. Reintroducing it or creating stale retries would violate the brief's instruction not to invent a policy. | Current `lock-wait.mjs`, approve/sync-root call sites, and `git show a54f85f5b -- src/runner/lock-wait.mjs`. |
| B2 | Blocked by B1. Current callers still rely on the ephemeral wrapper's publication and cleanup. Removing it independently would break them and violate the same-change caller migration requirement. Neither the old CAS wrapper nor kept-checkout path is claimed closed. | Unit-4/5 dependency findings remain applicable. |
| B3 | Done for claim. Work truncation/timing preparation occurs before main 50; the claim then borrows its live main handle into Checkpoint. New shards use declared ScopedCommit, preserving the existing new-shard behavior without broadening tracked-only Checkpoint. No release/reacquire. Main checkpoint's raw Git writer is deleted. Remaining merge callers still prepare under their old slot and belong to the blocked cutover. | Claim tests, real borrowed-hook checkpoint tests; added assertion proves truncation marks advance even when another holder keeps main locked and claim admission refuses. |
| B4 | Done. Reviewed the partial commit's spec-first exact `.fgos/events/archive/<name>.manifest.json` class, main-50 validation and WORK deletion note. Verified add/checkpoint/delete and invalid-location/traversal refusals. | Native legacy-event adapter tests pass through the owned hook. |
| B5 | Partial. Truncation readers use bounded Inspect facts, including the existing last-path-commit timestamp read. Committed-object read errors remain errors rather than becoming an empty baseline. Verified compaction publishes exact baseline, original, archive and manifest paths through the Work ScopedCommit adapter after releasing state60; the old stage/rm bodies are deleted. Main checkpoint uses the same adapter. Merge/promote/verb/bin migration, event sweep and post-CAS restage remain open with B1/B2. Land has no new implicit sweep. | Event/Inspect/architecture tests; ordinary ScopedCommit producer exclusions remain tested. |

The exact main-only legacy event declaration admits already-pending event bytes, including new shards present at preflight. Without this, a freshly captured producer baseline silently excludes those shards and the old checkpoint assertion fails. This is confined to declared legacy event paths under main 50; normal producer exclusions and other `.fgos` protections remain intact. The spec records this distinction. The guard module is classified as infra because its Work policy now consumes typed Git facts. No new default, environment switch or runtime dependency was introduced.

Performance evidence: the prior interrupted sample reported about 703 Git launches, 3 bwrap probes and 45k contention polls; it was not a complete stress run. The earlier completed 160-operation diagnostic trace contains 6,233 Git launches (38.96 per requested create, including startup/fixture probes), 176 host launches and 8 bwrap probes. The eight bwrap exec-to-observed-exit intervals total 15.37 ms; these are capability probes, not per-Git bwrap launches. A separate 3-process/12-create diagnostic records 556 Git launches including startup and 12 admin acquisitions: aggregate contention wait 6,760.19 ms, median 631.16 ms, maximum 1,045.70 ms. Traces remain at `/tmp/fgos-work/u7-stress-v2.strace` and `u7-admin-probe.strace`; the final unchanged 69.482 s stress test, with reciprocal topology/rebase/bisect checks retained, is the acceptance evidence. A new detached rebase/bisect reservation regression passes; final Rust Worktree and clippy reruns also pass. No per-spawn `Reach::Everyone` was added.

E6: no original assertion is retired. A source-line comparison confirms every previous assertion line remains verbatim in the five changed legacy suites except the explicitly approved dirty-refusal assertion below. The four coordinator-authorized retargets are:

| Fixture | Old text/expectation | New text/expectation | Spec |
|---|---|---|---|
| Diverged session | `force removes it, knowingly discarding the dangling commit` | Force still removes checkout/registry; additional assertions require the warning and retained ref to resolve to the exact detached SHA. | §11 line 483; G-193 effective rule line 1144. |
| Missing create checkout | `createWorktree reclaims ... a path that is already gone ... instead of throwing` | `createWorktree prunes a missing checkout with owned create evidence and preserves its branch`; every original assertion remains. | §11 line 481. |
| Missing claim checkout | `createClaimWorktree falls through ... when the registered path is gone` | `createClaimWorktree prunes an owned missing registration before allocating a fresh checkout`; every original assertion remains. | §11 line 481. |
| Guarded session removal | Clean divergent fixture expected `/delivery-unreachable/`. | Dirty fixture expects `/dirty/`; all original link/checkout/registry preservation checks remain, plus exact dirty-byte preservation. | §11 lines 481/483; continuation approval. |

Other E6 families are kept: Worktree, session, claim, event guard/compaction, legacy declarations, ScopedCommit and architecture. Checkpoint fixtures receive the real activation fence; the successful compaction fixture uses an actual repository containing `.fgos/`. Those are fixture/channel retargets, with original assertions retained and new native-effect assertions added. Merge/promote/verb/kept-checkout E6 remains open; no whole-phase conformance or zero-production-allowlist claim is made.

Census closures: rows 705–707 (`main-fgos-checkpoint`, `events-compaction`, `events-jsonl-truncation-guard`) now contain no Git spawn bodies. Their test Git calls are disposable fixture setup/proof. Unit-5 worktree-cluster typed operations retain their classification, with the cleanup/prune/performance blockers above closed. Census rows 44–45 (`merge`, `promote-engine`), merge verbs/bin call sites, and the worktree publication-wrapper subrow remain open. Prior art reused: `9d4c96e6b`, `54f365861` (Worktree/SafeRestore and operation pins), `9c8308897` (Refs pin door), and unit-2/3's temporary Work declaration. Impact-analysis: inactive (zero providers).

Verification used `/tmp/fgos-work/u7-state` (mode 700), the checkout host and `ensureGitAddon()`'s checkout-owned staged manifest. Exact command pattern:

```sh
export FGOS_STATE_ROOT=/tmp/fgos-work/u7-state
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
cargo build --locked -p fgos
node --input-type=module - <<'JS'
import { ensureGitAddon } from './test/helpers/git-addon.mjs';
import { spawnSync } from 'node:child_process';
ensureGitAddon();
const files = [
  'test/state/events-jsonl-truncation-guard.test.mjs',
  'test/state/events-compaction.test.mjs',
  'test/git/legacy-event-adapter.test.mjs',
  'test/git/inspect.test.mjs', 'test/architecture.test.mjs'];
process.exitCode = spawnSync(process.execPath, ['--test', ...files],
  {stdio:'inherit', env:process.env}).status ?? 1;
JS
cargo test --locked -p fgos-git --test worktree --test safe_restore --test scoped_commit_sync --test inspect
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
git diff --check
```

Results: event/Inspect/architecture **82/82**; sequential full session + claim **47/47**; checkpoint borrower subset **2/2**; new claim guard-order assertion **1/1**, detached rebase/bisect reservation regression **1/1**. Rust **53 passed / 1 intentionally ignored child harness**; clippy and whitespace pass. The broad nine-file Node run was **192/193**, with the 20-session test exceeding its unchanged 30 s admin wait under aggregate load; its complete session-file rerun passed in the sequential 47-test run. The broad run includes passing full Worktree, Worktree-port, ScopedCommit and compaction families. This contention observation remains a concern, not a changed timeout.

The traced stress command used the same staged environment (the final rerun omitted strace):

```sh
strace -f -qq -tt -e trace=execve,clock_nanosleep \
  -o /tmp/fgos-work/u7-stress-v2.strace \
  node --test --test-name-pattern='8 processes' test/runner/worktree-admin-multiprocess.test.mjs
```

An actual `run-resume-order.test.mjs` attempt is refused here at `nested-write-from-confined-worker`; it is not passing lifecycle evidence. Outer-session recipe (unit 6), after completing the blocked Land integration:

```sh
export FGOS_STATE_ROOT=/var/tmp/fgos-p07-u7-state
export FGOS_TEST_FIXTURE_ROOT=/var/tmp/fgos-p07-u7-fixtures
mkdir -p "$FGOS_STATE_ROOT" "$FGOS_TEST_FIXTURE_ROOT"
chmod 700 "$FGOS_STATE_ROOT" "$FGOS_TEST_FIXTURE_ROOT"
cargo build --locked -p fgos
export FGOS_HOST_BIN="${CARGO_TARGET_DIR:-$PWD/target}/debug/fgos"
node --input-type=module - <<'JS'
import fs from 'node:fs';
import { ensureGitAddon } from './test/helpers/git-addon.mjs';
import { spawnSync } from 'node:child_process';
ensureGitAddon();
const runner = fs.readdirSync('test/runner').filter(name =>
  /^(merge.*|loop.*|promote-engine|land-vs-manual-commit|worktree.*|session|claim-port|claim-capacity-race|concurrent-claim-eventlog-loss|repo-locks-multiprocess)\.test\.mjs$/.test(name)
).map(name => `test/runner/${name}`);
const files = [...runner,
  'test/runner/execution/run.test.mjs',
  'test/runner/execution/run-sync.test.mjs',
  'test/runner/execution/run-resume-order.test.mjs',
  'test/direct/merge-gate.test.mjs', 'test/cli/fgos-post-merge.test.mjs',
  'test/e2e/main-checkout-borrow-hook.test.mjs'];
process.exitCode = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files],
  {stdio:'inherit', env:process.env}).status ?? 1;
JS
```

The program-board lane update is outside this unit's write scope: coordinator must update `plans/261017-1313-fgos-platform-program-board/plan.md`. MDView preview was attempted for the spec; its database is read-only in this sandbox.

Status: BLOCKED
Summary: Closed the worktree cleanup, inspected-prune, performance and import-check blockers, and migrated the Work event adapter. Land callers still require the coordinated publication cutover and an explicit stale-retry policy resolution.
Concerns/Blockers: B1's required existing retry policy does not exist; B2 and the remaining B5 caller migration depend on resolving that contract. Busy-host session contention and outer-session lifecycle/merge verification remain open.
