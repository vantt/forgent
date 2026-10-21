# HARDEN T0 closing report: the process-facts door

Big lead `forgent-a8`, 2026-10-21 22:15 (Asia/Saigon). Sub-plan: [261021-1547-harden-t0-process-facts-door](../261021-1547-harden-t0-process-facts-door/plan.md). T0 is merged to main as `7d1f1c1b2` (from integration branch `harden/t0-process-facts-door`, tip `4f0af9172`) and **active on the second machine since 22:06** (release `sha256:613dfa8406d2fddef5a54ee71bc708e8b02796d40dfd25751bb385d4bbf4da07`, previous `sha256:ffe66288…`). The owner machine follows the [landing guide](guide-261021-2213-harden-t0-owner-machine-landing.md) at a time the owner picks. Phase 7 (the SEAT carry list) is open and waits for SEAT to land.

## 1. What changed

- **One door for process facts.** Every liveness judgement, observation and signal in Node goes through one in-process door into the Rust process crate (`src/native/door.mjs`, combined addon `packages/git/node-addon`). The loader verifies the addon per process; no route spawns on any hot path. `src/runner/dispatch/process-identity.mjs` went from 158 to 27 lines with 6 exports.
- **Deleted:**
  - the `fgos internal process-observe` route, its contract and Node client;
  - the nine `kill(pid, 0)` judges;
  - `lock-fence`'s Node signal-by-identity;
  - bare-pid kills in `gateway-control` and `stop-processes-inside`;
  - the dead `coordination-abandoned-claims` doctor row;
  - `facts::start_time` and `kcmp_same_file`.
- **Containment:**
  - `LinuxPgroup` no longer makes its caller a subreaper;
  - `Unknown` and unreadable members never fold into `Empty`;
  - there is now one `/proc/<pid>/stat` parser, and boot id and pid namespace are read once per process.
- **Durable writes and canonical JSON:**
  - 11 Node sites that already fsynced now go through `durable-file`: 6 replace and 5 create-only, each create-only site with a race proof;
  - the crate's create-only loser skips the directory fsync, and every error names its step and effect;
  - two canonical twins moved onto the door after a byte-equality run over 12 865 persisted documents (0 mismatches).
- **Specs:**
  - the process spec carries the approved shape, and §8 is superseded by name;
  - `component-boundary.md` gains rows for durable-file and canonical-json, with the accepted exceptions.

## 2. Findings closed (arbitration §3)

| Finding | Severity | Red test (phase 1) | Fixed in |
|---|---|---|---|
| F-A1 + RT-M4: gateway stop kills a foreign pid, stalls on zombies, loses its registry | High | `test/runner/gateway-control.test.mjs` 3 cases | phase 3 (`205f8a584`), durable registry phase 5 |
| F-A3: `stop-processes-inside` reuse window | High | `test/runner/stop-processes-inside.test.mjs` | phase 3 |
| RT-M3: `lock-fence` `null === null` | High | pin (not reproducible from outside); proven through the production path | phase 3 |
| RT-M1: subreaper on the caller | High | `containment_pgroup.rs` `spawn_in_never_makes_the_caller_a_subreaper` | phase 4 (`d33e6c9e0`) |
| RT-M2: `Unknown` folded to `Empty` | High | `linux.rs` `pgroup_state_reports_unknown_…` | phase 4 |
| RT-M5: missed callers, Windows `bootId` | High | `cancel-registry.test.mjs`, `direct-cutover.test.mjs` (pin) | phase 3 |
| S-E1: nine liveness judges | High | `test/process/one-door.test.mjs` | phase 3, allowlist trimmed phase 6 |
| S-A1/F-A5, F-A2, F-A4, RT-M6, RT-M7, S1, S-E2/S4, S-E6, S-F1–3, S-G1–2, S-C1, RT-M8, S-D1 | Medium/Low | owning tests per phase report | phases 3–6 |

## 3. Before / after (second machine, ext4, release build, load ≈ 8 before vs ≈ 3 after)

| Call class | Before | After |
|---|---|---|
| Judge, warm p50 / cold p50 | 4.1 µs / 87 µs (Node leaf) | 5.3 µs / **33 µs** |
| `resolveHolderLiveness`, warm | 7.7 µs | **5.1 µs** |
| Observe a process (the Windows path used a route spawn) | 1.33 ms | **4.7 µs** |
| `selfRecord` | — | 1.0 µs |
| Durable replace | 14.5 ms (Rust) / 5.5 ms (Node, file fsync only) | 10.4 ms (file and directory fsync) |
| Create-only, loser | ≈ 10 ms | **5.2 ms** |
| Canonical JSON, small / 200 keys | 2.0 µs / 171 µs (Node) | 4.0 µs / **384 µs (slower)** |
| First door load (import, verify, dlopen) | — | 17.7 ms |

Raw output: `/tmp/fgos-work/harden-t0-remeasure.txt` (before: [baseline](research-261021-1210-harden-t0-baseline.md)).

**One regression, recorded rather than hidden.** Canonical JSON through N-API is 2.2× slower than the Node twin for a 200-key object. The Rust crate alone takes 49 µs; the marshalling across N-API costs the rest. The speed seat predicted this, and the red-team disputed it. Every caller is cold (once per run or proof), so the practical cost is under 1 ms per run, but it misses the ≤ 80 µs budget the simplicity seat set. Carried to T1 as finding T0-R1.

## 4. Net size (HARDEN commits only, the T0 merge `7d1f1c1b2^1..7d1f1c1b2`)

| Part | Expected (sub-plan) | Measured |
|---|---|---|
| Node `src bin scripts` | −472 | **−382** |
| Rust src (including ≈ 60 lines of `#[cfg(test)]` modules) | +66 | **+327** |
| Node tests | (−97 together with Rust tests) | **+160** |
| Rust tests (`tests/`) | | **+47** |
| Contracts | | −21 |
| **Code and tests** | ≈ −500 | **≈ +150** |

**The layer misses its close criterion "net Δ ≤ 0".** Where the growth comes from:
- the three N-API namespaces of the owner-approved door (≈ +230 Rust, the cost the owner accepted on 12:05);
- `Unknown`/unreadable handling in containment (+47 Rust);
- the `step` field in durable-file errors (+79 Rust);
- red tests for seven Highs that no test owned before (≈ +320, including ≈ 110 for the gateway);
- race proofs for each create-only site.

Node shrank by 382. The owner decides whether this is accepted (owner ask 2).

## 5. Verification

- **Independent full run on a fresh worktree of `4f0af9172`:**
  - `npm test`: 8 724 tests, 2 red, and both pass alone: `loop.test` real concurrency (TEST's known flake) and `session.test` concurrent createSession (20/20 alone, twice);
  - `cargo test --workspace --no-fail-fast`: one red, `event-store sync_review` (`KernelLockHeld`), which passes alone 3/3; T0 does not touch `packages/event-store`, and the lead went to GIT/ES.
- **After activation, doctor through the shim:**
  - 145 rows, with `coordination-abandoned-claims` gone and `process-containment` passing;
  - every git and lock row passes except `git-land-recovery`, which fails identically on main before T0 (GIT fixed it in `406a81f98`).
- **Smoke:**
  - gateway start/status/stop works;
  - `lock fence gateway` on a free lock reports `free` with no signal (0.2 s);
  - one real `fgos run` attempt passes (gemini, 20 s).
- **Phase verification caught five real regressions,** each fixed by its lead before merge:
  - phase 2: cargo ran per selected test run; the scratch worktree used another checkout's release;
  - phase 3: the dev launcher built inside the fixture checkout, and the dev-host addon load failed.

## 6. Behaviour and format changes (previous release compatibility)

- Gateway registry entries gain the process tuple. The previous release reads `pid` and `port` and ignores the rest. An old pid-only entry reads as `IdentityUnknown` and is never signalled (`gateway-stop-identity-unknown`).
- An attempt step started with a bare environment exits 70 (fail-closed); production passes every `FGOS_*` variable.
- The npm/GitHub install channel is not supported. The door refuses there by name (`process-door-not-shipped`), as Git does (owner OQ-2).
- `durable-file` error texts now name the step. Create-only losers no longer fsync the directory. Reconcile hashes drop `undefined` members (byte-equal over the corpus).

## 7. Open items and hand-offs

- **Phase 7 (SEAT carry list):** waits for SEAT to land. T0 keeps the `isProcessAlive`/`resolveHolderLiveness` re-exports used by `assignment-runner.mjs`, plus `run.mjs:51` and `unit-summary.mjs:196`. It must be done before T1 closes.
- **T0-R1 (to T1):** the canonical JSON N-API cost (§3).
- **T0-R2 (to T1, Low, axis F):** the durable door's `mode` argument is required, and leaving it out gives a raw N-API `NumberExpected`, not a named error.
- **Owner machine:** the landing guide, including the canonical corpus run on all three workspaces before activation.
- **Already in the HARDEN ledger:**
  - H11, the canonical pair handed to T9/Packaging;
  - H12, the DOC lane, file list posted;
  - H13 and H14, to T9;
  - R1, HL-N8/N9, to T1.
- **Backlog `p-3c7681b8` stays open:** deleting the doctor row does not fix tests leaking coordination sessions.

## 8. Rollback

Before T1 merges, stop everything, then run `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:ffe662884ca4cef59bce1368dfc6d354537ffbd1dd33efe6674852167c7ae3bd` and restore `.fgos/distribution.json` and both configs from `.fgos/runtime/tmp/landing-harden-t0-this-machine/` (check `before.sha`). Revert `7d1f1c1b2` on main and record the revert SHA; a later re-merge must revert the revert first. Gateways started by the new release are stopped first (`fgos gateway stop`). After T1 has merged on top, roll forward with a fix instead.

## Unresolved questions

1. Accept T0's net growth of ≈ +150 lines with the reasons in §4, or require a trimming pass before T1 opens? (owner ask 2)
2. When does the owner machine land (guide)? (owner ask 2)
