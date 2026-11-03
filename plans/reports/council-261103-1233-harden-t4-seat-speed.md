# HARDEN T4 council: speed seat (Run Supervisor + Launch gate)

HEAD `a1e903f39`, branch `main`, machine fg-server2, 2026-11-03 12:33 to 12:47 (Asia/Saigon). Seat: cost per attempt and per seat launch, test wall time of this layer, doctor row cost. Read-only except this report. Private cargo dir `/home/vantt/projects/forgent-worktrees/harden-t4-speed-cargo` (deleted at the end).

## What I ran

- One real direct seat launch (`direct-cutover.test.mjs`, test "a real run carries the configured kill grace…", one `fgos run` of the fixture agent), three times: plain, under `strace -f -e execve`, under `strace -f -e execve,exit_group`. A fourth time with kept fixtures (scratchpad fixture root) to read the publish times of the attempt files. Nothing started outside the test's own fixture.
- Re-ran `fgos internal attempt-step settle-attempt|finalize-home` six times each on the kept, already settled fixture attempt (idempotent paths), plus one `node --cpu-prof` of `finalize-home`.
- Module-graph count (`strace -e openat`) and import time of `attempt-step.mjs` and each step module; SHA-256 time of the debug and release addons.
- Every Rust test of `supervise_terminal_fake_herdr` alone; source reading of `gate_pid1.rs`.
- `terminal-cutover.test.mjs` once through a scratchpad launcher (per-test times; see the caveat in section B-9).
- Each doctor row of this layer called alone from the activated release payload, twice at load 35 and twice at load 4, plus `strace -c -e execve`.
- Load average moved between 4 and 36 during the session (other sessions). Every number below names its load band; relative numbers held in both bands.

## Part A: target shape (speed lens)

**Run Supervisor** (`fgos-run-supervisor`): authority for one attempt's lifecycle after handover: locks, domain, gate start, watch (soft deadline, idle, output limit, cancel), receipt, the step chain, `closed.json`, and the adopt door. I agree with spec sections 5 to 8. Its own hot path is cheap: one 50 ms tick (`supervise.rs:168`) opens two capture files and reads `cancel-requested.json`, which is noise next to the agent. Adopt, sweep, `attempt-step` and the gate are parts of this one component, not separate components. They share the envelope, the lock and the receipt contracts, and they live in one crate and one spec.

**Launch gate**: part of the run supervisor (`gate.rs`, `gate/unix.rs`, `gate/windows.rs`). Per attempt it costs one bwrap plus one host exec (measured 13 ms from the sandbox exec to the agent exec in the strace of one launch). There is nothing to buy there.

**Where the cost of an attempt really is** (one direct launch, fixture agent, `fgos run` total 2.69 s under strace, 2.93 s without; table from `execve`/`exit_group` timestamps):

| Phase | Wall | Owner layer |
|---|---|---|
| Node CLI bootstrap to first child | 0.24 s | T5/host |
| 27 confined git calls (bwrap + git, 6 to 7 ms each) + seat-binding route | 0.48 s window, about 0.2 s of execs | T2 (R2) / T5 |
| Confinement probe harness: 11 bwrap + `node -e` probes | 0.69 s | T5 (Dispatch Confinement) |
| supervise to gate to agent exec | 0.03 s | **T4** |
| agent (fixture) | 0.34 s | — |
| `settle-attempt` step (host exec, then Node) | 0.36 s strace / 0.47 s plain | **T4 launcher**, T5 work |
| `finalize-home` step | 0.23 s strace / 0.30 s plain | **T4 launcher**, T5 work |
| receipt to `closed.json` (plain run: 16.014 to 16.783) | 0.77 s | **T4** |

So this layer's own process cost is the two (direct) or three (terminal) Node step processes. Their fixed cost is dominated by loading the native addon, which hashes the whole addon file in every process, not by Node start or by the Rust route (B-1).

**Node budget after the move** (speed lens only; the simplicity seat sets the final numbers): `attempt-step.mjs` stays a thin entry with lazy step imports (at most 100 lines, 3 exports). The step logic itself belongs to the Execution Core (`settleRunOutcome`) and to Dispatch Confinement (`finalizeAttemptHome`, trust store), which are T5 code. Moving them to Rust now would be moving T5 logic from T4. The supervisor contract does not change. Size target from this lens: Rust unchanged, Node −10 to −20 lines, tests −35 s of Rust wall time and fewer time-based waits.

**Spec vs code (speed-relevant):**
- Spec section 3 (line 81) has `attempt-step` refuse `envelope-invalid` and puts that refusal in the host route. The Node entry checks the digest a second time (`step-support.mjs:133`), right after the route checked it (`attempt_step.rs:23`). That is two doors for one check (B-4).
- Spec section 7 says the step env holds "`FGOS_STATE_ROOT`, the project root; no secrets". The envelope actually forwards every `FGOS_*` variable of the controller (`direct-launch.mjs:146`; the measured fixture had 16 keys, `FGOS_GIT_SPAWN_SPY_LOG` and `FGOS_CLAUDE_COMMAND` among them). This is not a speed problem. I name it for the correctness seat.

## Part B: findings

**B-1 (Medium, test speed; reproduced). Every Node step process hashes the whole native addon. With the 185 MB debug addon that tests stage, that is 125 to 190 ms per process, and it is the largest fixed cost of a step.**
- `src/native/door.mjs:52-56` reads and SHA-256s the addon file once per process (`verified` is a per-process Map). The step reaches the door at once, because `readEnvelope` (`step-support.mjs:133`) calls `computeSha256Digest` → `canonicalJson` → `nativeDoor()` (`door.mjs:97`).
- CPU profile of `finalize-home` with nothing to do: 346 ms in total, 180 ms inside `loadNativeAddon` (92.7 ms `read`, 80.4 ms `hash.update`), 115 ms module loading, and the step's own work under 10 ms.
- Debug addon `.fgos/runtime/git-addon/<id>/fgos.node`: 184 614 456 bytes, hashed in 124 to 127 ms at load 4 and 185 to 195 ms at load 24. Release addon: 16 373 904 bytes, 16 to 17 ms.
- So in production a step's fixed cost is about 20 ms (host exec, exec'd into Node on Unix, `attempt_step.rs:61`) + 40 ms import + 17 ms hash + its work, about 80 to 100 ms. In tests it is 3 to 4 times that. Each seat launch has 3 (direct) or 4 (terminal) door-loading Node processes (controller, settle, finalize, cleanup-trust), so tests pay about 0.4 to 0.7 s per launch in hashing alone. This explains most of R5's "150–250 ms per attempt-step".
- The owner is T0/TEST (native door, test staging), not T4. I record it here because it is what R5 measured. The fix must not be a test-only branch (AGENTS.md L5 q5). See proposed addition P-1.

**B-2 (Medium, test speed; reproduced). The confinement probe harness costs 0.69 s on every test launch, because each fixture project has a fresh state root.**
- In the launch: 11 `bwrap` + `node -e` probes, 221.208 to 221.900 s in `ex2.txt`. The cache is keyed by fingerprint and stored under `<stateRoot>/attestations` with a 1 h TTL (`attestation-store.mjs:160-169, 273`). Fixtures set `HOME`/`XDG_STATE_HOME` per project (`direct-harness.mjs:86`), so every project misses the cache. In production the cache hits within the hour.
- Owner T5 (Dispatch Confinement) and TEST. Fixture-only remedy: harnesses that do not test probing set the existing production variable `FGOS_CONFINEMENT_ATTESTATION_STORE_PATH` (`attestation-store.mjs:161`) to one store per test file. Estimate about 0.7 s × most of the 466 launches; unreproduced at suite scale.

**B-3 (Medium, user and test latency; reproduced). `fgos run` waits for `finalize-home` after the result exists: 0.30 to 0.33 s per attempt.**
- `direct-launch.mjs:376-379` waits for `closed.json` after `result.json`. Plain-run file times: `result.json` 16.450, `steps/finalize-home.json` 16.782, `closed.json` 16.783. The wait is right: credential write-back must finish before the next attempt copies the login (`authority.mjs:1900`). The remedy is a cheaper step (B-1, B-5), not dropping the wait. Each multi-step workflow pays it once per step.

**B-4 (Low, one door; reproduced by reading). The Node step re-verifies the envelope the host route verified microseconds earlier.**
- `attempt_step.rs:23-37` does `read_verified`, the host-bin check and the step-id check, and then execs. `attempt-step.mjs:66-71` + `step-support.mjs:125-136` repeat the digest, the step id and the payload root, and `verifyPayload` (`attempt-step.mjs:34-49`) re-reads the release manifest (235 KB). The speed gain from removing this is small: settle and finalize load the addon anyway for durable writes. Its value is one door and one fewer reason to load the addon in `cleanup-trust`. Keep the Node `payload-missing` check only if the route cannot prove the same thing (it already checks `entry.is_file()` under `payloadRoot`, `attempt_step.rs:42-46`).

**B-5 (Low, speed; reproduced). `attempt-step.mjs` eagerly imports all three steps: 121 modules and 36 173 lines for any step.**
- `attempt-step.mjs:14-16`. Alone: `cleanup-trust` loads 19 modules (13 to 14 ms), `finalize-home` 60 (21 to 28 ms), `settle-attempt` 111 (37 to 44 ms); the entry loads 121 (40 to 42 ms; low load). Lazy `await import()` of the one named step saves 15 to 30 ms per finalize or cleanup-trust step. The diff is about zero lines.

**B-6 (Medium, Rust test wall; reproduced). Two Rust tests own 93 s of the crate's 128 s, and cargo runs the test binaries one after another.**
- `gate_pid1.rs:173` loops a fixed 57 s (`while begin.elapsed() < 57s`, sampling every 150 ms) to show that 200 short orphans leave no zombie. The proof needs more than 150 processes seen (`:187`) and no zombie older than 600 ms (`:182`). Making the orphans churn faster with a shorter run reaches the same counts; how short is unmeasured.
- `supervise_terminal_fake_herdr::an_idle_agent_with_unchanged_invalid_result_stops_and_releases_custody` takes 36.1 s alone, because `UnreadableWait::expired` hard-codes 30 000 ms (`supervise/terminal.rs:627`). The unit test `unreadable_wait_requires_unchanged_bytes_and_consecutive_idle_polls` (`terminal.rs:747-759`) already owns the 30 s rule with a fake clock. The integration test repeats the timing and adds only the receipt reason and the custody release.
- The other tests of that binary: 19.5 s (`only_new_words…`, real 6 s idle), 16.4 s (`blind`, real 16 s soft deadline), 10.4 s (`shell never ready`), 8.8 s, 6.8 s, 5.5 s, 3.2 s, 2.7 s, 0.9 s (load 30). The binary's wall is its slowest test.

**B-7 (Low, doctor; reproduced). This layer's eight rows cost 0.25 to 0.45 s at load 4 and 3.3 s at load 35, out of a 51 s doctor.**
- Load 4, ms: process-containment 4–5, run-supervisor-route 15–17, runtime-socket-dir 1–2, run-attempts-stuck 53–79, gate-kill-grace 28–29, legacy-attempts-stuck 23–24, units-awaiting-resume 145–261, cancel-wait 0–1. 23 host execs in total.
- `units-awaiting-resume` spawns one blocking `adopt --probe-only` per unit (`run-supervisor-checks.mjs:401-406`, about 17 spawns here). `adoptScan` already judges many directories in one process (`client.mjs:101-109`).
- `process-containment` and `run-supervisor-route` both spawn `supervise --probe` (`run-supervisor-checks.mjs:88, 112`): 5 spawns for 2 rows.
- `run-attempts-stuck` walks the assignments tree twice (`:294` then `adoptScan` → `listOpenAttemptDirs`), and `legacy-attempts-stuck` walks it a third time. Each walk takes 36 to 51 ms (280 open attempt directories, 11 851 directories). Not worth more than the fold in the doctor table.

**B-8 (Low, controller; reproduced). Polling in the controller while an attempt runs.**
- `awaitSettledResult` ticks every 25 ms (`direct-launch.mjs:27, 395`) and tails both capture files, which the supervisor also tails every 50 ms. Measured 4.1 µs wall and 4.9 µs CPU per tick, about 0.02 % of a core. **Hypothesis rejected:** this costs nothing worth changing.
- With an `onChunk` observer, `followPaneScreen` (`herdr-round.mjs:474-494`) does a blocking `spawnSync` of the host (`terminal-control/client.mjs:116`) every 3 s, about 400 host spawns per 20-minute pane attempt, while the supervisor already samples the screen every 1 s (`supervise/terminal.rs:55`). It is display only. Low.
- Once the supervisor is gone, `awaitSettledResult` calls `adoptRun` (a blocking `spawnSync`, `client.mjs:38`) every 250 ms for up to 60 s (`direct-launch.mjs:30-31, 386-392`). That is at most 240 blocking spawns, only on the failure path. Low.

**B-9 (info; my artifact, not a finding).** The confined terminal-cutover test failed after 60 s in my launcher, because my fixture root sat under `/tmp`, which the sandbox mounts as tmpfs. In the baseline (`run-tests`) it passes. Per-test times from the same run: 4.2, 4.2, 3.6, 6.7 (agent never started), 1.9, 2.0, 4.1, 4.0 s. So one terminal seat launch in tests costs about 4 s.

**R5 verdict.** The 1.2 s seat cost splits as: CLI bootstrap 0.24 s, git 0.2 s, probes 0.7 s (tests only, cold cache), and the steps 0.6 to 0.8 s, of which about 0.4 to 0.5 s is addon hashing at debug size. Moving `attempt-step` into Rust would save the 40 ms Node import and nothing else unless settle, finalize and trust also move. Those are T5 logic. From the speed lens, an in-host step is not worth it for users (about 0.1 s per step in production against agent runs of minutes). For tests, B-1 and B-2 are the levers, about 1 s per launch together.

## Migration table

| Node part | Decides | Move | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `attempt-step.mjs` + `step-support.mjs` | which step runs; re-checks the envelope | No (shrink) | thin entry; the duplicate check goes to the route (B-4) | after 04a settle change | ≤ 100 lines, lazy imports |
| `steps/settle-attempt.mjs` | evaluator inputs, terminal screen judging | Not to T4 Rust | the screen judging goes per the 04a hand-over; the evaluator is T5 | 04a item first | −46 (screen code) |
| `steps/finalize-home.mjs`, `cleanup-trust.mjs` | credential write-back, trust removal | Not now | T5 confinement and agent trust stores; 13 + 30 lines | T5 | unchanged |
| `direct-launch.mjs` polling and adopt loop | when the controller reads the result | No | read-only client; the cost is measured as noise (B-8) | — | unchanged |
| `client.mjs` `adoptRun`/`adoptScan` | none (route client) | No | adapter | — | unchanged |
| `run-supervisor-checks.mjs` units row | per-unit probe | No (batch via `adoptScan`) | B-7 | with the doctor fold | −0 to −10 |

## Delete list (speed lens)

- `step-support.mjs` envelope digest re-check and `attempt-step.mjs` `verifyPayload` (the route owns them, B-4), after the correctness seat confirms the route covers `payload-missing`.
- The eager step imports at `attempt-step.mjs:14-16` (replaced by one `await import`).
- Time-based waits: the fixed 57 s loop (`gate_pid1.rs:173`); the integration copy of the 30 s unreadable window (keep the unit test as the owner); `sleep(4_000)` at `crash-matrix-adopt-resume.test.mjs:256` (wait for the delivery record instead, if one is published; unverified).
- One of the two `supervise --probe` spawns in doctor (fold, below).

## Doctor table

| Condition | Row today | Keeps it after the fold |
|---|---|---|
| no host / route missing / protocol mismatch | run-supervisor-route | **run-supervisor** (one row with one probe pass: routes + containment) |
| containment kernel / best-effort warn / unsupported fail | process-containment | **run-supervisor** (same probe answer) |
| socket dir missing, wrong owner, mode, orphan socket (+fix) | runtime-socket-dir | runtime-socket-dir |
| v3 attempt with no holder and no `closed.json` (+fix) | run-attempts-stuck | run-attempts-stuck |
| pre-supervisor run left running (+fix) | legacy-attempts-stuck | run-attempts-stuck if the R4 policy deletes legacy-sweep; otherwise unchanged |
| units awaiting resume (warn) | units-awaiting-resume | units-awaiting-resume (batched probe) |
| `dispatch.gateKillGraceMs` invalid | gate-kill-grace | **dispatch-timing** (one config row) |
| `dispatch.cancelWaitMs` invalid or shorter than the grace | cancel-wait | **dispatch-timing** |

8 rows → 5 (or 4); no condition is lost. Each row stays under 0.3 s at load 4.

## Tests table

| Behaviour | Owning proof | Duplicate | Time-based wait | Move down? |
|---|---|---|---|---|
| unreadable result ends after 30 s idle | `terminal.rs` unit `unreadable_wait_requires…` | `supervise_terminal_fake_herdr::an_idle_agent_with_unchanged_invalid_result…` (36 s) | real 30 s | keep the unit test; the integration case keeps only the reason wiring, if a shorter path exists, else retire |
| gate reaps orphans, no zombies | `gate_pid1::a_long_attempt_with_many_orphans…` | none | fixed 57 s loop | shorten |
| idle counts only new words | `supervise_terminal_fake_herdr::only_new_words…` | Node `terminal-groups`? (not checked) | real 6 s idle | — |
| soft deadline during blind time | `…blind_time…` | — | real 16 s | lower soft/idle if the 1 s sampling allows (unmeasured) |
| step fixed cost (launch) | no test; measured here | — | — | — |
| crash rows (`crash-matrix-adopt-resume`, 158 s, 30 tests) | e2e matrices; Rust twins per the baseline 3.1 | yes, per the baseline 3.1 | `sleep(4_000)` :256; harness polls 5 to 20 ms | each row is about 2 launches × 2 to 4 s; B-1 + B-2 cut about 1 s per launch |

## Answers on received items

1. **Worker session-server ownership (T2 §2.3).** From the speed lens: no. The session server is shared across attempts and outlives each one. The supervisor is one process per attempt, so owning the server would add start and judge cost to every attempt. Today it costs nothing per attempt. Keep it with the controller side (terminal-control's named exception).
2. **R5 / `attempt-step` in Node vs Rust.** Answered above. Measured per step: host exec about 5 ms, then exec into Node (no second process on Unix). Node import 40 ms. Addon hash 17 ms (release) or 125 to 190 ms (debug). The work: settle about 0.2 s, finalize under 10 ms. Do B-5 and B-4 now. P-1 and B-2 get most of TEST's 25 to 35 % without moving T5 logic into the T4 crate.
3. **Windows hold transport (RT-M3).** Speed-neutral. `declare_via_holder` (`supervise/windows.rs:83-107`) runs once per mutating attempt (a file request and a 5 ms poll for up to 5 s). The decision belongs to the correctness and simplicity seats. I cannot measure it on Windows.
4. **Agent outcome wiring and `settle-attempt.mjs` screen judging.** Speed: `paneScreenOf` (`settle-attempt.mjs:84-95`) does one host spawn (`terminal-control/client.mjs:116`) per terminal settle. If the receipt carries the classified `terminal:blocked:<reason>` per 04a, settle no longer needs the screen for the outcome. It still uses the screen as stdout and stderr evidence (`:202-205`), so the spawn stays unless the supervisor writes its last screen sample into the attempt directory (the supervisor already samples it every 1 s). Owner pick.
5. **Windows/macOS dead-field warnings.** No speed impact. Gate the fields with their users' cfg (`gate.rs:149-168` Config, `supervise.rs:176-185` `outbox`, `supervise/terminal.rs:251` `sandboxed`), as the baseline confirms.

## Proposed additions (owner picks; kept separate)

- **P-1. Debug-size addon in tests (T0/TEST).** Problem: B-1, 125 to 190 ms × every door-loading Node process of the suite. Options:
  (a) stage the release-profile addon for tests (`ensureReleaseArtifacts` already builds it for release-tree tests);
  (b) shrink the dev addon (`debug = "line-tables-only"` or split debuginfo for `fgos-node-addon`);
  (c) carry the verified identity across processes.
  Benefit: about 0.4 to 0.7 s per seat launch in tests, and the same for every other test process that touches the door. It replaces nothing and adds no code path for (a) and (b). (c) adds a mechanism, so I do not recommend it.
- **P-2. One Node process for the consecutive Node steps of an attempt.** Problem: 2 to 3 Node starts per attempt (B-3). The route takes a list of step ids and emits one line per step, and the runner publishes receipts in order. Benefit: 1 or 2 fewer Node starts per attempt (about 0.1 s in production, about 0.3 s in tests). It replaces the per-step spawn in `steps.rs` `run_step` for Node steps, and it changes the `step-receipt.v1` `stepProcess` contract. Recommend only if P-1 is not taken.
- **P-3. Supervisor publishes its last pane screen.** It replaces the settle step's `paneScreenOf` host spawn and the controller's 3 s `followPaneScreen` spawns (B-8) with a file the supervisor already has in memory. Benefit: small. Mostly one reader of the pane instead of three.

## Net size estimate (my proposals, without P-x)

Node −10 to −25 lines (B-4, B-5, the doctor units batch); Rust about 0 (cfg gates ±5); tests −30 to −60 lines (one integration case, the shorter zombie loop, a fixed sleep). Rust test wall about −80 s of 128 s (the 57 s loop to about 10 s, the 36 s case retired or shortened). Node test wall depends on P-1 and B-2 (estimate −1 s per seat launch; unreproduced at suite scale). Doctor rows 8 → 5.

## Notes

- `scripts/run-tests.mjs <file>` restaged `.fgos/runtime/git-addon/<id>/` (the same as any focused run). No full suite was running (checked with `ps`).
- Every timing above was taken with other sessions on the machine. The load band is named where it mattered.
