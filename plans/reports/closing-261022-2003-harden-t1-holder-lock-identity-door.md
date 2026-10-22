# HARDEN T1 closing report: holder-lock, identity and convention on the in-process door

Big lead `forgent-a8`, 2026-10-22 20:05 (Asia/Saigon).
- Sub-plan: [261022-0851-harden-t1-holder-lock-identity-door](../261022-0851-harden-t1-holder-lock-identity-door/plan.md).
- Arbitration: [council-261022-0245](council-261022-0245-harden-t1-arbitration.md).

T1 is merged to main as `c56f1eae3`, from the close branch `harden/t1-close`, which carries the integration branch `harden/t1-holder-lock-door` plus main. It is **active on the second machine since 19:58**: release `sha256:a424fc0f0c431ebd85b882c44dcb923184f814e64292a717e89fe718a95c691d`, previous `sha256:d241ec95…`. The owner machine lands it by the [guide](guide-261022-2003-harden-t1-owner-machine-landing.md). T0's phase 7 (the SEAT carry list) is closed inside T1 phase 6.

## 1. What changed

- **Holder-lock behind the in-process door** on Linux and macOS:
  - The combined addon `packages/git/node-addon` gains a `holderLock` namespace, gated by a one-shot `take()` capability: `lockFd`, `probe`, `guarantee`, `drainChild`, `clearDomain`, `releaseFd`, `holders` (process tuples, with an `origin` decided in Rust), `twoProcessProbe`, `stateRoot`.
  - No Node lock call spawns the host any more. Windows keeps `hold-transport.mjs` and `route/hold.rs`, because the supervisor's domain handover needs them (red-team RT-M3).
- **Red-team constraints built in:**
  - A description handed to `spawnWithLocks` is marked handed-over, and its parent release is a plain close (RT-M2).
  - Other releases settle through `releaseFd` and return `{settled, killed, pids}` instead of throwing.
  - Every acquire carries its own full creation mark (RT-M4).
  - `lock-fence` reads one holder list instead of scanning twice (RT-M7).
- **The pre-commit hook** is a cold client of the activated host. It runs the native `lock-fd --borrowed-check`, then `lock-fd --shared-try`, then `fgos identity --json`, which costs about 3 ms per commit.
- **Writer identity:**
  - It now goes through the same door (`sessionIdentity.resolve` and `mintAttempt` on `fgos-identity`, IDENT's renamed crate), with a per-process cache keyed on the three env inputs the Rust rule reads.
  - Its `/proc/<pid>/stat` parsing moved to `fgos_process::facts::relation_of`.
  - `fgos internal identity mint-attempt` is deleted.
  - There is now one hot-section depth counter, `hotLockDepth()`; SEAT's `state-lock-held.mjs` and `noteLockHeld` are gone.
- **Deleted:**
  - the Node cutover fences (`fences.mjs`, the `lock-fences` row and fix, five test files). The Rust Git-WAL tombstone stays, by GIT's evidence; its condition now lives in `git-operation-journal`.
  - the Node `/proc` holder scan, the Node two-process probe and the Node pid classifier;
  - the replaced `lock-fd` route modes;
  - the `internal state-root` route and its Node fallback;
  - the `lock.predecessorKillWaitMs` key (owner decision 12);
  - the dead `fgosDir` argument of `resolveStateRoot`.
- **Doctor:** the holder-lock rows go from 9 to 5. `lock-kernel-semantics`, `lock-borrow-vectors` and `lock-holders` remain, plus `writer-identity-resolvable` and `convention-conformance`. Every condition of the removed rows lives on in a surviving row.
- **Fixes:**
  - S-F1: an unjudgeable hot-mutex holder now names `lock-record-unreadable` and the fence.
  - HL-N8/N9: one reclaim read with one bytes compare.
  - The Windows retry and release paths.
  - T0-R1: canonical JSON takes a string, with a validating replacer.
  - T0-R2: `durable-file-mode-invalid`.
  - R3: bwrap's own refusal line now appears in the containment error. OPC carries this, plus its `containment-mount-refused` classification.
  - The Lows: RT-M5, RT-M6, RT-M8, RT-M9 and RT-M10.
  - Two races found during T1:
    - R7, from TEST: private probes now unlock before they close, so a sibling thread's fork can no longer keep a released lock.
    - R8, from OPC: predecessor admission, kill included, is bounded by the single 2000 ms wait.
- **Checkout channel:** owner decision 10 makes the checkout `node bin/fgos.mjs` channel unsupported for process, lock and identity verbs, and AGENTS.md now says so. The dev door is `node scripts/run-rust-dev-host.mjs`.

## 2. Before and after

Second machine, ext4 NVMe, release builds, load ≈ 2. Baseline: [research-261022-0138](research-261022-0138-harden-t1-baseline.md).

| Call | Before | After |
|---|---|---|
| Holder-lock `acquireSync` + `release`, uncontended | 1.36 ms (a host spawn) | **99 µs** (p50), 14× faster |
| Hot mutex `withStateTx`, empty | 19.6 µs | 20.3 µs (unchanged) |
| `resolveWriterIdentity`, cached | 0.9 µs | 1.2 µs |
| `resolveWriterIdentity`, uncached | 1.41 ms (spawn) | 36 µs (door) |
| `resolveStateRoot`, unpinned | 0.8 µs (cached route answer) | 1.3 µs (door answer kept per input set) |
| Canonical JSON, 200 keys | 384 µs (T0) | **45.5 µs** |
| Pre-commit hook, lock step | one route spawn | ≈ 3 ms (two native routes) |

Two host routes got slower, though T1 does not touch them: `fgos identity --pid` went from 1.41 to 2.1–2.8 ms, and `fgos convention name` from 1.38 to 4.9 ms. Main's host is heavier at start-up since IDENT's `provider` feature pulls `fgos-git`. This is handed to T9/IDENT; see §6.

## 3. Net size

The figures are `git diff --numstat origin/main harden/t1-close`, so they count T1's own changes only.

| Part | Net |
|---|---|
| Node `src bin scripts .githooks` | **−1 248** |
| Node tests | **−1 751** |
| Rust src, including inline `#[cfg(test)]` | +541 |
| Rust tests | −177 |
| Contracts | −154 |
| **Code and tests** | **≈ −2 789** |

T0 (≈ +150) and T1 together come to ≈ −2 640, which meets the owner's T0+T1 ≤ 0 target. Rust grew more than the arbitration's +80…+150 because the logic moved from Node into Rust, as owner decision 12:05 accepted: the lock door, the origin classifier, the identity door, and the R7/R8 fixes with their proofs. `src/holder-lock/` is 1 784 lines (from 2 499), which is above the 1 650 budget; the 498-line Windows hold transport stays.

## 4. Verification

- **Final close run on `harden/t1-close` (main merged in):**
  - `npm test`: 8 623 pass, 0 fail, no `run-tests: ERROR` line.
  - `cargo test --workspace`: green.
  - clippy `-D warnings`: clean for holder-lock, identity, node-addon and process.
  - Windows check (`x86_64-pc-windows-msvc`): clean for `fgos-process`, `fgos-holder-lock` and `fgos-identity --no-default-features`. `fgos-git` has never built for msvc; that is an open Git item, not a T1 regression.
- **Independent verify at each phase caught six real regressions before merge:**
  1. run-tests took its queue lock before staging the addon.
  2. The hook paid a Node start per commit, 1.08–5.4 s.
  3. A phase-4 import widened the reconcile closure.
  4. The checkout script `build-rust-distribution.mjs` could not resolve the state root, which caused 73 reds.
  5. Removing the identity cache tripled `withStateTx`, and the timing test had been moved to hide it.
  6. The unpinned `resolveStateRoot` marshalled the whole env, at 125 µs.

  Two of the big lead's own mistakes are recorded: a shared Cargo target dir between two checkouts, and a merge command that failed silently. Memory has been updated.
- **Doctor on this machine after activation:** 142 rows, 11 not passed.
  - Ten were already failing at the previous landing.
  - The new one is `git-mutation-one-door`, the 5 `unresolved-binary` sites of CFG commit `03c99bc61` on main. It is CFG's and not T1's (OPC's bisect). This is the first release here that carries it.
  - Every `lock-*`, `identity-*`, `writer-identity-resolvable`, `process-containment` and `git-operation-journal` row passes.
- **Smoke:** `dispatch decide`, gateway start/status/stop, `lock fence gateway` (free, nothing signalled), `fgos identity` (source `env`), a read-only gemini run, and a writing claude run that committed `5aafa4c98` through ScopedCommit (worktree removed). The commit of this report in the main checkout went through the new pre-commit hook.

## 5. Behaviour and format changes

- The config key `lock.predecessorKillWaitMs` is gone, and 2000 ms is fixed everywhere. Configs that still carry the key are not rewritten; the key is ignored.
- Doctor rows `lock-fences`, `lock-predecessor-kill-wait`, `lock-record-unreadable` and `state-root` are gone. Their conditions now sit in `lock-kernel-semantics` and `lock-holders`.
- The `fgos internal state-root` and `fgos internal identity mint-attempt` routes are gone. `fgos identity` and `fgos lock-status` stay.
- `node bin/fgos.mjs` run from a checkout refuses process, lock and identity verbs by name (`addon-not-shipped`), and points to the dev door.
- The lock registry has lost its `fence`, `fenceNote`, `v1Path` and `v1Shape` columns.
- Nothing changes on disk for the hot record, the predecessor record or `activation.json`.

## 6. Hand-offs and open items

| # | Item | To |
|---|---|---|
| H17, H24 | Two host-binary resolvers; the host's `.fgos` walk; the gateway's `node bin/fgos.mjs` branch | T9 (parent plan phase 07) |
| H22, H23 | Write the self record once per process (idea); `withStateTx`'s `finally` against the settle outcome | WORK. They rebase onto `c56f1eae3`, and were told on 10-22 20:00 |
| — | `fgos identity` / `fgos convention` host routes got slower on main (1.4 → 2.1–4.9 ms) | T9 / IDENT, to measure the host's start-up |
| — | `git-mutation-one-door` red on every release built from main | CFG (`03c99bc61`), already reported by OPC |
| — | `fgos-git` does not build for Windows (`custody_lock_path`, `libc`) | Git, open since phases 05–06 |
| H15 | Owner-machine landing of T0 and Git durability | Git reviewer (OPC); this T1 guide builds from current main and so carries them |

The T1 ledger rows that close here are R1 (HL-N8/N9), R3 (in OPC's form), R7, R8, H16, H18, H19 (the counter part) and H21.

## 7. Rollback

1. Stop everything.
2. `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:d241ec95d06e4a01056a14f5be3fefaf1a994a07d19d68c788f4e3e618ef4c22`.
3. Restore `.fgos/distribution.json` and both configs from `.fgos/runtime/tmp/landing-harden-t1-this-machine/`.
4. `cp fgctl.prev ~/.local/bin/fgctl`.

The previous release reads every on-disk format T1 leaves behind. Reverting `c56f1eae3` on main works only until another lane builds on it; after that, fix forward.

## Unresolved questions

1. Does the owner want the 498-line Windows hold transport replaced in a later layer, once the supervisor has another way to receive a domain (RT-M3)? T1 kept it, by evidence.
