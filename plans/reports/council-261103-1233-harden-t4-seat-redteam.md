# HARDEN T4 council: red-team seat (Run Supervisor + Launch gate)

Main `a1e903f39` (baseline was measured on `e078ca201`; no change to this layer's files between them), 2026-11-03 12:33 to 13:20 (Asia/Saigon), fg-server2. Read-only, except this report and scratch files in the session scratchpad. I read every line of `packages/run-supervisor/rust/src`, `src/run-supervisor`, the attempt parts of `assignment-runner.mjs`, `herdr-round.mjs`, `transport.mjs`, `terminal-slot.mjs`, `run-lock.mjs` (the parts the settle step uses), and the doctor checks. I ran no cargo test: load average was 14 to 33 because of other sessions. The private cargo dir was never created.

## What I ran

| Command | Purpose | Writes |
|---|---|---|
| `rg`, `sed`, `git log`, `find`, `wc` | reading | none |
| The activated release's `fgos internal gate` in terminal mode, under `script` for a pty, driven by a Python fake supervisor (HELLO, GO with the lock fd over `SCM_RIGHTS`, `BRIEF_DELIVERED`, then close) | reproduce RT4-01 | scratchpad only; every process ended and checked |
| `node` with `resolveWorkerArtifactPath` and `fs.readFileSync` over a `mkfifo`'d `result-1.json`, under `timeout 5` | reproduce RT4-02 (primitive) | scratchpad only |
| `adoptRun(..., {probeOnly: true})` and `findLegacyStuck` over a scratch attempt dir | reproduce RT4-05 | none (`--probe-only`) |
| A key-name census of `protected/attempt-secrets.json` (names only, no values printed) and of the 280 open attempt dirs | RT4-07, RT4-05 | none |

## Challenges to the baseline and the brief

1. **The seed delete list is wrong about `legacy-sweep.mjs`.** It is not only for runs from before the supervisor. A current attempt whose controller dies between `run.json: running` and the envelope is also `legacy-run`, and only the legacy sweep settles it (RT4-05). Deleting it as "pre-6.2" loses that.
2. **The spec is stale on pane idle.** Spec §5.3 says "the idle timer counts a changed screen and a `working` status as activity". Since `16150dca1` the code hashes only letters and ignores `working` (`supervise/terminal.rs:441-449`).
3. **The baseline's "Node-only: settle step and outbox judging"** hides that there are three outbox readers with three naming rules, two of them unhardened (RT4-01, RT4-02, RT4-09).

## Part A: target shape (red-team constraints)

**Run Supervisor** (crate `fgos-run-supervisor`; Node controller half `direct-launch.mjs`, steps). Authority: the attempt after handover, which means binding, watch, receipt, steps, `closed.json` and adopt. I agree with the spec's ownership table. Constraints:
- **Hostile input rule.** Every read of a path the agent can write (outbox, capture files, `gate-exit.json`) goes through one bounded, no-follow, non-blocking reader. In Rust that reader is the protocol's `FsOutbox` over `fgos_durable_file::open_beneath`. In Node it is the `O_NOFOLLOW` plus `fstat` plus cap pattern that already exists twice (`direct-launch.mjs:302`, `settle-attempt.mjs:29`).
- **No orphan children.** Every child the supervisor starts, except the gate (which must outlive it by design), dies with the supervisor, or adopt can see it.
- **Adopt's "empty" proof covers the agent.** On best-effort drivers it must cover the agent, not only the gate (RT4-06).
- Adopt door, sweep and `attempt-step` are **parts** of this component, not components. `sweep.mjs` (24 lines) is a wrapper of `adoptScan` and folds into `client.mjs`.
- **Node budget after the layer:** `src/run-supervisor` ≤ 1 350 lines (from 1 493). Rust is about flat.

**Launch gate** (`gate.rs`, `gate/*`). This is a separate process role in the same crate, not a separate component. Authority: the process root, the agent's IO, the hard ceiling, and `gate-exit.json`. Constraint: **the ceiling path must never block on agent-controlled IO.** Today it can (RT4-01). The gate also verifies the envelope through `envelope::read_verified` instead of its own copy (RT4-12).

**Doctor rows kept:** 6 (see the doctor table). **Size target:** Rust ±0, Node −150 to −430, tests −200 to −400.

## Part B: findings

R means reproduced, I means inferred from `file:line`. A file owned by the SEAT lane is marked SEAT.

| Id | Axis | Sev | R/I | file:line | What goes wrong | Fix shape |
|---|---|---|---|---|---|---|
| RT4-01 | A, B | **High** | **R** | `gate/unix.rs:381-389` (`std::fs::read` of every `result-<N>.json`), called at `:465`; ceiling check `:477` sits after it in the same loop | **A FIFO in the outbox switches off the hard ceiling.** In terminal mode, once the supervisor is gone after the brief, the gate polls the outbox with a blocking read. The agent can write its outbox (`bwrap.mjs:633`, the outbox is a writable bind). With `mkfifo outbox/result-1.json` the gate, which is pid 1 or the subreaper, blocks in `open(2)`. It then never reaps, never stops the agent and never publishes `gate-exit.json`. It also holds the attempt lock and the cwd lease, so adopt reads `running` forever. SIGTERM does not help (`SA_RESTART`). Reproduced with the released binary: ceiling at +6 s. The plain agent was stopped at 5.8 s with `stoppedBy: hard-ceiling`. The FIFO agent was still alive at 14 s with no `gate-exit.json`. The T3 RT-02 fix hardened `FsOutbox` but missed this second reader. | Delete `outbox_has_result` and ask `FsOutbox::newest_complete` (hardened, size-capped) for the result. Rust −9 lines. The owning proof stays in `terminal_vectors.rs` (FIFO case exists). Add one wiring case to the existing orphan test in `supervise_terminal_fake_herdr.rs`. |
| RT4-02 | A, B, C | **High** | R (primitive), I (chain) | `settlement.mjs:551-553` (SEAT) `fs.readFileSync(agentResultPath)`; `settle-attempt.mjs:190`; `direct-launch.mjs:32` (10 min step timeout); `client.mjs:152` (10 min route timeout, SIGKILL); `execution/run.mjs:627` (sweep at every run start); `steps.rs:227` (step in its own session) | **One FIFO stalls every later `fgos run` for about 10 minutes, in both modes.** The settle step reads the agent's claim with a blocking read that follows links. Reproduced: `readFileSync` on the FIFO never returns (`timeout` exit 124). The step runs into `stepTimeoutMs`, leaves no receipt, and the attempt stays open. Every `fgos run` begins with `sweepAttempts`, a synchronous `adopt --scan`, and the scan reruns the step. The route's 10 min timeout equals the step's, so `spawnSync` SIGKILLs adopt and leaves the step process (its own session) blocked for ever. Each run adds one such process. A symlinked `result-N.json` is also followed to any host file, so the settlement can accept another run's claim. | Read the claim with the existing Node bounded reader (`O_RDONLY\|O_NOFOLLOW\|O_NONBLOCK`, `fstat` is a file, size cap). Make the route timeout longer than the sum of the step timeouts, or the scan cheaper than the steps. Node about +5, the helper is reused. Owning proof in the settlement test file (SEAT). |
| RT4-03 | B, A | Medium | I | `steps.rs:223-230` (setsid, no parent-death signal); `adopt.rs:128-147` (emptiness = gate domain only); `authority.mjs:1896-1908` (no lock around write-back and `rmSync`) | **A step outlives a killed supervisor and adopt runs it a second time at once.** A step is not in the attempt domain and does not hold the lock. So after a `kill -9` of the supervisor mid-step, adopt sees the lock free and the domain empty, and starts the same step while the first is still running. Two `settle-attempt` processes write `exit.json` and `evidence.json` non-atomically (the CAS saves `result.json` only). Two `finalize-home` processes race write-back against `rmSync`, and a renewed refresh token can be lost. | Arm `fgos_process::control::arm_parent_death_signal` (exists) in the step `pre_exec` on Linux (Rust +3). Windows is already covered: the step's kill job closes with the supervisor. On macOS a residual remains. One case in `steps_runner.rs`. |
| RT4-04 | B, F | Medium | I | `direct-launch.mjs:26` (`BINDING_WAIT_MS` 30 000); budgets `terminal-control route.rs:48-49` (5 s + 10 s), `supervise.rs:171` (15 s); `assignment-runner.mjs:2128`; `run.mjs:1617-1625` | **The controller's binding wait equals the sum of the supervisor's own terminal start budgets.** The budgets are a 10 s shell handshake, 5 s to identify the process and 15 s for HELLO, which is 30 s plus herdr call time. A slow but valid pane binds after the controller has thrown `launch-unknown`. The unit is settled `execution-failure` while the agent runs and settles, and its writes are never committed. Same family as backlog `p-d2dc4f2e` (attach there). | Derive the wait from the same budgets plus slack, or keep waiting while the child is alive with no `start-refused.json`. A constant becomes a computed value; no new mechanism. |
| RT4-05 | B, D | Medium | **R** (classification) | `assignment-runner.mjs:1315` (`running`), `:1807` (attempt lock), `:2088` (envelope); `adopt.rs:111`; `legacy-sweep.mjs:110-118`; spec §9.1 resume refuses `attempt-legacy-run` | **The window between `run.json: running` and the envelope is owned only by the legacy sweep.** The window includes confinement preparation, credential provisioning into a marker-v2 home (`bwrap.mjs:597-606`) and pane allocation. If the controller dies there, the attempt is `legacy-run` for adopt and refused by resume. Reproduced: a dir with `attempt.lock` and `run.json: running` and no envelope gives adopt `legacy-run`, and `findLegacyStuck` lists it. The marker-v2 home (a credential copy) is skipped by the orphan-resources check (spec §8) and never adopted (inferred). Not seen on this machine today: 0 of 280 open dirs. | Do not delete the legacy sweep and its row until adopt closes a "lock, no envelope" attempt as `abandoned-not-started`. Finalizing its home needs a design question for the owner. |
| RT4-06 | A, B | Medium | I | `gate/unix.rs:595-601` (direct agent `setsid`); `process linux.rs:309` (domain = gate's group); `containment/mod.rs:265-267` (adopt judges with `seen = []`); `supervise/terminal.rs:604-607` admits the gap | **On `linux-pgroup` the recorded domain never contains the agent.** The gate moves the agent out of its own group at spawn, so only the gate's subreaper scan covers it. If the gate dies (OOM, outside kill), adopt judges the record empty. It then finalizes the home of a live agent and frees the attempt while the agent still writes. The process spec names only "a descendant that calls setsid" as the escape. | Adopt also judges the agent tuple the supervisor already publishes in `agent-binding.json` (`supervise.rs:478-483`). This extends the judge without a new file, Rust about +10. |
| RT4-07 | A (data) | Medium | R (count) | `direct-launch.mjs:236-238`; no remover (`rg sideFile`); `bwrap.mjs:559` (`--ro-bind / /`); `resources.mjs:581` (only machine-private roots hidden) | **Side files are kept for ever, and other agents can read them.** This machine holds 497 `attempt-secrets.json` files. Their key names include `GLM_OPENROUTER_API_KEY`, `CLAUDE_CODE_MESSAGING_TOKEN` and the run-control token. A confined, non-blind agent can read every other attempt's side file (same uid, read-only root). The spec says "never copied elsewhere" but sets no lifetime. | `finalize-home` removes the side file. It runs only after `settle-attempt` has its receipt, so the settle recovery row still has its token. Node +2. That the "secret env" is the whole controller env is a confinement item, out of this layer. |
| RT4-08 | C, E | Medium | I | `supervise/terminal.rs:392-404` (carrier and screen sample once a second), `:685`, `:694` (inspect every 700 ms); `herdr.rs:295` (one exec per call); `herdr-round.mjs:58` (idle 20 min); `runner.yaml:796` (soft deadline 15 min) | **About 3 herdr processes a second per pane seat, for the whole attempt.** The once-a-second screen sample feeds only the idle timer, and pane idle (20 min) is longer than the default soft deadline (15 min). With the default config it can never fire first. A pane that keeps changing its words (Claude's rotating spinner verbs) also never reads idle. | Sample only when the idle deadline can come before the soft deadline, and reuse the drive loop's own screen reads. A decision for the owner if idle in panes should simply go. |
| RT4-09 | E, F | Low | I | `agent-protocol direct/mod.rs:64-79` (plain decimal); `gate/unix.rs:386` (any digits); `worker-artifacts.mjs:39-60` (`\d+`, three directories, legacy name); `settle-attempt.mjs:151` | **Three "newest result" rules.** With `result-01.json`, the receipt says `outboxPresent: false`, but the settle step finds a claim and settles a timeout or a cancel as exit 0. | One rule in the protocol crate. Node reads the path the receipt names. |
| RT4-10 | B | Low | I | `run-supervisor-checks.mjs:176-196`, `:219-229` | **The orphan-socket fix can unlink a live socket.** It reads `/proc/net/unix` before it lists the directory, so a supervisor that binds between the two loses its live socket. The attempt then fails closed as `terminal-gate-silent`. It runs on `fgos setup` and `doctor --fix` during a launch. | List the directory first, then read the table. 0 lines. |
| RT4-11 | C, D | Low | R (read) | `run-supervisor-checks.mjs:89`, `:111` | `process-containment` spawns the same `supervise --probe` that `run-supervisor-route` already ran. | Fold into one row (doctor table). |
| RT4-12 | E | Low | R (read) | `gate.rs:184-194` against `envelope.rs:369-384` | The gate has its own envelope check, without the `protocolId` check. | Use `read_verified`. Rust −8. |
| RT4-13 | B | Low | I | `supervise/terminal.rs:597-600` | The loop has no bound when `domain_is_empty` keeps answering `Unknown` after the one `kill_all`. | Bound it by the kill wait, then publish with what is known. |

**Rejected hypotheses, recorded so the next review skips them:**
- **PID reuse.** Every signal goes through a tuple with start time (`signal_by_identity`, `judge`). Only the gate's `descendants_of_self` kill uses a bare pid, from a scan taken a moment before (`gate/unix.rs:627-630`). Low.
- **A forged `gate-exit.json`.** The gate rewrites it in place after the domain is empty (`gate.rs:354-355`). The direct gate has no blocking read the agent controls, so it reaches that rewrite.
- **Lock theft through `/proc/1/fd/3`.** Opening it gives a new file description, which holds no flock.
- **A stranger on the GO socket.** It must be the same uid, and it can only cost 5 s of the 15 s HELLO budget (`terminal.rs:131-135`).
- **Two adopters.** Covered by the kernel lock and the receipts (`adopt_concurrency`).

## Migration table

| Node part | What it decides | Move? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `direct-launch.mjs` | locks, envelope, binding wait, result wait | no | The controller is Node. It decides nothing about lifecycle once bound. | RT4-04 now | ≤ 400 |
| `steps/settle-attempt.mjs:84-133` screen judging | `provider-limit` and `blocked` from pane text | yes, into the receipt reason (protocol, Rust) | Agent-controlled text (T3 RT-01). See answer 4 for the timeout arm. | after 04a | ≤ 195 |
| `attempt-step.mjs`, `step-support.mjs`, `finalize-home`, `cleanup-trust` | run the step bodies through Node doors (settlement, confinement authority, trust store) | no | The bodies are Execution Core and confinement code. Rust would have to own settlement (T5). | none | ≤ 200 |
| `cancel-registry.mjs`, `cancel-opt-in.mjs` | the controller's own signal handling | no | Per-controller state | none | ≤ 153 |
| `client.mjs` + `sweep.mjs` | thin route client, listing open dirs | fold `sweep` into `client` | One door | with T4 | ≤ 125 |
| `legacy-sweep.mjs` | settles `legacy-run` through the recover door | not yet | Owns the pre-envelope window (RT4-05) | after adopt owns that window | 154, then 0 |
| `gate-kill-grace.mjs`, `runtime-dir.mjs` | config reader; socket dir create and check | no | Config and setup are Node | none | ≤ 152 |
| `transport.mjs:386-664` `cliSpawnAdapter` | unsupervised agent spawn, idle and timeout in Node | delete after proof | `supervised` covers `cli-spawn` (`assignment-runner.mjs:1732`). The only production way in is the non-supervised branch (`:2181`). Inferred dead (L10). | T4/T5 | −280 |
| `run-lock.mjs`, `herdr-round.mjs`, `terminal-slot.mjs` | run control (T5); pane preparation before handover; client helpers | no | Not attempt lifecycle after handover | none | unchanged |

## Delete list

- `gate/unix.rs` `outbox_has_result` (RT4-01). `gate.rs` `load_config`'s digest copy (RT4-12).
- `settle-attempt.mjs` `SCREEN_LIMIT_PATTERNS`, `screenSaysProviderStop`, `paneScreenOf`, and the screen cases in `attempt-steps.test.mjs`, after 04a and only with answer 4 in place.
- `sweep.mjs`, folded into `client.mjs`. Its callers are `run.mjs:627`, `loop.mjs:1317` and `run-supervisor-checks.mjs:316`.
- `cliSpawnAdapter` and its tests, once a reviewer confirms with `rg` that no production path reaches it.
- Doctor: `process-containment` folds into `run-supervisor-route`, and `cancel-wait` into `gate-kill-grace` (gate 8).
- Spec: the stale "`working` status counts as activity" line in §5.3.
- **Not** deletable now: `legacy-sweep.mjs` and `legacy-attempts-stuck` (RT4-05).

## Doctor table

| Condition | Row today | Kept by |
|---|---|---|
| route missing or protocol mismatch (fail) | `run-supervisor-route` | `run-supervisor-route` |
| driver `kernel` (pass), `best-effort` (warn on Linux, info elsewhere), none (fail) | `process-containment` | `run-supervisor-route` (same probe answer, one spawn per route) |
| socket dir missing (warn), not a directory, wrong owner, loose mode or orphan socket (fail); fix | `runtime-socket-dir` | `runtime-socket-dir` (RT4-10 order fix) |
| v3 attempt with the lock free and no `closed.json` (fail, release-gone reason); fix | `run-attempts-stuck` | `run-attempts-stuck` |
| grace below 1000 or not an integer (fail) | `gate-kill-grace` | `run-supervisor-config` (renamed `gate-kill-grace`) |
| cancel wait below 1000, not an integer, or shorter than the grace (fail) | `cancel-wait` | `run-supervisor-config` |
| legacy run settleable (fail), kept (warn); fix | `legacy-attempts-stuck` | `legacy-attempts-stuck` (until adopt owns the window) |
| units awaiting resume (warn) | `units-awaiting-resume` | `units-awaiting-resume` |

8 rows become 6, and no condition is lost. The failing `run-attempts-stuck` row on this machine (release removed, 10-19) is a permanent red by the verified 10-19 decision (5). I would not reverse it; the owner may choose to accept a closing path for it (proposed addition A5).

## Tests table

| Behaviour | Owning proof | Duplicate or retire |
|---|---|---|
| Outbox reads refuse a FIFO, a link or an oversized file | `agent-protocol tests/terminal_vectors.rs` | Gate wiring: one case in the existing orphan test of `supervise_terminal_fake_herdr.rs`, no new file |
| A step dies with its supervisor | `steps_runner.rs` (+1 case) | none |
| Soft deadline, cancel, supervisor killed midway, hard ceiling, two adopters, no binding gives `abandoned-not-started`, no lock description reaches the agent | Rust (`supervise_lifecycle`, `supervise_crash`, `gate_ceiling`, `adopt_concurrency`, `adopt_matrix`, `gate_terminal_socket`) | `direct-crash-matrix` rows 2, 2b, 4, 5, 7c and 8 duplicate them and can retire. **Keep row 3 or row 6 as the one wiring proof** of the controller's `awaitSettledResult` → `adoptRun` loop; no Rust test owns that loop. |
| Resume after controller death | `crash-matrix-adopt-resume` (158 s, 30 tests over a 3-body matrix) | Collapse the mode×row matrix to one case per distinct resume branch of spec §9.1 (about 8). |
| Terminal screen to outcome | protocol vectors (04a) | the `attempt-steps` screen cases retire |
| Time-based waits | `gate_pid1` (57 s of fixed 150-300 ms sleeps), `supervise_terminal_fake_herdr` (36 s), `support/` and `portable/` each define `wait_for`/`wait_until` | Merge the two helper modules. The deadlines themselves are real bounds; shorten them through the envelope, not by sleeping less. |
| Controller binding wait against terminal budgets (RT4-04) | `direct-cutover` "waitForBinding names…" | Extend it with a binding published after 30 s while the child is alive |

## Answers on the received items

1. **Worker session-server (T2 §2.3).** The run supervisor should not own it. The session server is shared by every pane of a session, and the supervisor is one process per attempt that exits at `closed.json`. Owning it would tie one shared carrier to one attempt's lifetime, and an attempt end or a supervisor kill would take the other seats' panes with it. Keep it in terminal-control, as T2 decided.
2. **R5, seat launch cost.** On Unix each step is one process: the host route `exec`s node in place (`attempt_step.rs:451-456`). Direct mode runs two Node steps; terminal mode runs three plus the builtin. Running the step in-process in the controller is not allowed: the spec forbids the controller to settle, and a dead controller must not lose the settle. Moving the steps into the host means rewriting settlement in Rust (T5). The one cut that keeps every guarantee is to run all Node steps of a pass in one Node process, with one receipt per step, published by the runner from one stdout line per step. That saves about 150-250 ms of one start per seat, roughly 15 %, not 25-35 %. It is a contract change to `step-receipt.v1`, so it goes to the owner as A4. Not measured under this load.
3. **Windows hold transport (RT-M3).** I found no other way to hand the domain over that keeps the guarantee. Dropping the helper means the controller releases the cwd lease and the supervisor re-acquires it. That opens the window spec §15 already names for the attempt lock (a second dispatch takes the worktree first), and it widens it to the worktree. Keep the helper. Unreproduced (no Windows machine).
4. **Agent outcome wiring and settle screen judging.** Three constraints for the 04a or T4 change:
   - (a) `classify` over capture text is the same agent-controlled-text risk in Rust. It must read only the last N lines, require a non-zero exit, and never override an outbox result, because "outbox wins" (spec §6).
   - (b) **The timeout arm from `6035c018c` must survive.** Today a seat stopped at its soft deadline while showing a quota screen settles `provider-limit` only through `terminalAdapterOutcome(…, timedOut)` (`settle-attempt.mjs:129`). If the regexes go, the supervisor must ask the adapter once at a deadline stop and put the verdict in `receipt.reason`. Otherwise failover silently stops on timeouts.
   - (c) The name→outcome table must default unknown reasons to `blocked` (a person), never to success.
5. **Windows and macOS warnings.** Gate `Config.{terminal, mutating, outbox_dir, orphan_settle, identity}` and `Watch.outbox` behind `#[cfg(unix)]`, parsed only there. Windows still refuses a terminal envelope before the gate runs (`supervise.rs:408-411`). On darwin, `sandboxed` in `gate_tuple` goes into the existing `let _ = stream;` line of the non-Linux branch. No `allow` attribute. Re-run `cargo check` for both targets in the gate.

## Proposed additions (owner picks; each names what it replaces)

- **A1. Adopt judges the published agent tuple on best-effort drivers (RT4-06).** Problem: a live agent's home is removed and the worktree is freed. Evidence: `gate/unix.rs:595-601`. Benefit: the guarantee matches the spec. It replaces nothing; it extends the existing judge.
- **A2. Adopt closes a "lock, no envelope" attempt (RT4-05).** Problem: a current attempt can be settled only by the legacy sweep. Benefit: `legacy-sweep.mjs` (154 lines), its row, its fix and 6 tests can then go. It replaces the legacy sweep.
- **A3. Deadline-stop classification in the terminal supervisor (answer 4b).** It replaces the settle step's screen regex on the timeout arm.
- **A4. One Node process for all steps of a pass (R5).** It replaces N Node starts per seat with one. Contract change.
- **A5. A named close for attempts whose release was removed.** Problem: a permanent doctor red. It reverses the verified decision of 2026-10-19 (5), so it goes to the owner as a decision question, not a fix.

## Net size estimate (my proposals)

Node: −60 (screen judging) −24 (sweep fold) −15 (doctor folds) +5 (bounded claim reader) +3 (binding wait) +2 (side-file removal), which is about **−90**. It is **−370** if `cliSpawnAdapter` is proven dead, and −240 more with A2.
Rust: −9 (gate reader) −8 (gate envelope check) +3 (parent-death signal on steps) +6 (cfg for dead fields) +10 (A1) +15 (A3), which is about **+17**.
Tests: −200 to −400 (Node crash-matrix duplicates and the matrix collapse) +40 (three wiring or owner cases), which is about **−160 to −360**. Layer total is ≤ 0.

## Unresolved questions

- macOS and Windows clock pairing. The controller writes deadlines from `os.uptime()` (`direct-launch.mjs:132`); the gate reads `CLOCK_MONOTONIC` on macOS and `GetTickCount64` on Windows (`gate.rs:262-279`). They match on Linux (both are `/proc/uptime`, 10 ms). I did not verify the other two.
- Is pane idle meant to be effectively off by default (answer for RT4-08)?
- `cliSpawnAdapter`: does any `executeExecutorCli` caller outside the non-supervised branch reach it in production? `rg` found only tests and re-exports.

Status: DONE_WITH_CONCERNS
Summary: Two High findings. RT4-01 is reproduced with the released gate: a FIFO in the outbox switches off the hard ceiling in the terminal orphan branch. RT4-02 is reproduced at its primitive: a FIFO claim makes the settle step hang, which stalls every later `fgos run` for about 10 minutes. RT4-05, reproduced, shows that `legacy-sweep` cannot be deleted as pre-supervisor-only code.
Concerns/Blockers: No cargo or Node test runs, because the machine load was 14 to 33. RT4-02's full chain, RT4-03, RT4-04 and RT4-06 are inferred.
