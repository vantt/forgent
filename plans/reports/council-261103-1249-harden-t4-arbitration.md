# HARDEN T4 arbitration: Run Supervisor + Launch gate

- **Big lead:** lead:HARDEN (`claude-p74h@fg-server2`), 2026-11-03, main `a1e903f39`.
- **Inputs:** [baseline](research-261103-1212-harden-t4-baseline.md); seats [correctness](council-261103-1233-harden-t4-seat-correctness.md), [speed](council-261103-1233-harden-t4-seat-speed.md), [simplicity](council-261103-1233-harden-t4-seat-simplicity.md), [red-team](council-261103-1233-harden-t4-seat-redteam.md).
- **Status:** arbitration done; owner ask 1 in §6. No code is changed before the owner answers §6 Q1.

## 1. Verdict in one paragraph

The layer has the right shape: one Rust crate owns the attempt after handover, and the gate is the process root. Four seats found no layering break. They found two High holes on agent-controlled input (a FIFO in the outbox or as the claim), one High Windows custody gap, and a set of duplicate doors inside the crate. Every fix reuses a door that already exists. The layer shrinks: about Node −350, Rust −30, tests −250 (§5).

## 2. Part A: target shapes (for owner approval)

**Run Supervisor** (`packages/run-supervisor/rust`, one process per attempt).
- **Authority:** the attempt from binding to `closed.json`: the attempt directory layout, receipt outcome (including the provider verdict at a deadline stop), step runner, soft and idle deadlines, adopt.
- **Parts, not components:** adopt door, sweep (folds into `client.mjs`), `attempt-step` launcher (all four seats agree).
- **Contract:** envelope v3, `receipt.v1`, `step-receipt.v1`, `gate-go.v1`, the internal routes; `lock-scan` leaves the route contract (it does not exist).
- **Ports:** containment and facts (T0), attempt lock (T1), terminal-control by key (T2), agent-protocol adapters and `FsOutbox` (T3).
- **Hostile-input rule (red-team):** every read of a path the agent can write goes through one bounded, no-follow, non-blocking reader: `FsOutbox` in Rust, the existing `O_NOFOLLOW`+`fstat`+cap reader in Node. One "newest result" rule, in the protocol crate.
- **No orphan children:** every child except the gate dies with the supervisor.
- **Node after T4:** `src/run-supervisor` ≤ 1 150 lines outside `steps/` bodies (from 1 493): controller envelope build and lock handover (`direct-launch.mjs`), Ctrl-C policy (`cancel-registry.mjs`), thin route client (`client.mjs`). Node decides nothing about the receipt outcome or the attempt lifecycle. Step bodies (`settle-attempt`, `finalize-home`, `cleanup-trust`) are Execution Core and confinement code and stay Node until T5.
- **Doctor rows kept (8 → 5, then 4):** `run-supervisor-route` (absorbs `process-containment`), `runtime-socket-dir`, `run-attempts-stuck` (absorbs the `units-awaiting-resume` warning), `run-supervisor-config` (absorbs `gate-kill-grace` and `cancel-wait`), and `legacy-attempts-stuck` only until Q2 lands.

**Launch gate** (same crate, `fgos internal gate`).
- **Authority:** process root of the agent, its IO, hard ceiling, emptying the domain, `gate-exit.json`, orphan branch.
- **Constraint:** the ceiling path never blocks on agent-controlled IO.
- **One door:** the gate parses argv through `route::Flags`, verifies its envelope through `envelope::read_verified` (gains the missing `protocolId` check), and reads process relations through T0's `facts` door. Node 0.

**Received items, settled (all seats agree):**
- Worker session server stays in terminal-control (T2's exception stands): the supervisor lives for one attempt, the server for many.
- Windows hold transport stays: it proves the lease is still held when the domain is recorded, and it also serves `borrow` and `clear-domain`.
- R5 seat cost: the supervisor's own share is about 13 ms. The cost is Node start plus hashing the whole native addon in every step process (speed B-1: 125–190 ms per process with the 185 MB debug addon in tests, about 17 ms released), the confinement probe cache miss in tests (0.69 s), and the steps' own work. `attempt-step` in Rust means porting settlement, which is T5. T4 takes the lazy step import only.
- Settle-step screen judging: deleted in one change with the receipt naming the provider stop (see S1 below).
- Windows/macOS dead fields: `#[cfg(unix)]` on the terminal-only inputs, parsed only on Unix; no `allow`.

## 3. Part B: accepted findings

| Id(s) | Sev | Repro | Fix (reused door) | Owner of file |
|---|---|---|---|---|
| RT4-01 | High | yes, released gate | Gate asks `FsOutbox::newest_complete` instead of its own blocking `std::fs::read`; with S11/RT4-09 one "newest result" rule | T4 |
| RT4-02 | High | primitive yes, chain inferred | Settlement reads the claim with the existing bounded no-follow reader; adopt route timeout above the sum of step timeouts | **SEAT** (`settlement.mjs`) |
| B-1 | High | no (Windows only) | Adopt ends a domain only when the gate named in the binding is judged dead (existing judge); extend `supervise_portable` with a non-probe adopt while the agent runs; fix spec §11 Windows row | T4 |
| B-2 | Med | yes | No GO written → `finish(not_started=true)`, receipt `abandoned-not-started` (+4 Rust lines) | T4 |
| RT4-03 | Med | inferred | Steps armed with the existing `arm_parent_death_signal` on Linux (Windows already covered by the job) | T4 |
| RT4-06 | Med | inferred | Adopt also judges the agent tuple already published in `agent-binding.json` on best-effort drivers (extends the judge; no new file) | T4 |
| RT4-07 | Med | yes (497 files here, mode 0600) | `finalize-home` deletes the attempt's side file after settle has its receipt (+2 Node) | T4 |
| B-4 | Med | inferred | Ctrl-C writes `cancel-requested.json` for a launching attempt too; deletes the wait-then-cancel branch | T4 |
| B-5 = RT4-04 | Med | inferred | Binding wait derived from the Rust start budgets plus slack, written once in the spec | T4 |
| S1 + RT4 answer 4 | Med | read | Supervisor asks the terminal adapter once at a deadline stop and writes the verdict in `receipt.reason` (keeps `6035c018c`'s behaviour); then delete `settle-attempt.mjs` screen judging, the screen glued into `stderrText`, and settlement's re-judge of that text. One change with the 04a wiring | T4 + **SEAT** |
| S2, S3 = RT4-12, S4, S5, S12, S13, S14 | Med/Low | read | Duplicate doors in the crate and in Node folded into the existing one (route flags, `read_verified`, one watch tick, T0 `facts`, one settled-result reader, one start-refusal writer, sweep into client) | T4 |
| S6 | Low | read | Delete `supervisor-heartbeat.json` writers (no production reader) and its one assertion | T4 |
| S7 = speed B-5 | Low | measured | Lazy import of the one step module (≈60 ms per direct seat, 150 ms per terminal seat); drop the Node envelope re-check the Rust route already made | T4 |
| S9, S10 | Low | read | Writer id applied the same way on Windows; dead fields behind `cfg(unix)` | T4 |
| B-7 = RT4-10 | Low | read | Socket check lists the directory before reading `/proc/net/unix` | T4 |
| B-8, B-9 = RT4-13, B-10 | Low | read | Spawn error from `ErrorKind`; `kill_all` retried each tick; kill a step's group before reaping it | T4 |
| B-12 | Low | read | Spec drift: pane idle line (§5.3), `lock-scan`, Windows lock row | T4 (spec after DOC Land) |
| speed B-6 | Med | measured | `gate_pid1` 57 s fixed loop and the 30 s real wait in `supervise/terminal.rs:627` replaced by the clock-driven proof that already exists (≈80 s off the crate) | T4 |
| Tests | — | — | Retire Node crash-matrix rows Rust already owns, keep one wiring row of `awaitSettledResult → adoptRun`; collapse `crash-matrix-adopt-resume` to one case per resume branch; one wait helper | T4 |

## 4. Rejected or routed elsewhere (with source)

- **Delete `legacy-sweep.mjs` now** (seed list, correctness, simplicity): rejected. Red-team RT4-05 reproduced that a current attempt whose controller dies between `run.json: running` and the envelope is `legacy-run` and only the legacy sweep settles it. Becomes Q2.
- **Delete `cliSpawnAdapter`** (red-team): rejected for T4. Simplicity S17: it supervises short calls (probes, judges, goal check), not attempts; T5 decides.
- **A4, one Node process for all steps of a pass** (red-team): rejected. Speed measured the host share at about 13 ms and the fixed cost per step as the addon hash, which the lazy import and P-1 address without a `step-receipt.v1` change.
- **Delete `run-lock.mjs` holder logic** (seed list): rejected, simplicity S16: it is Execution Core's run-control ledger.
- **Routed:** speed B-1 (addon hash per Node process) → T9/Packaging ledger H13 and TEST (debug addon in tests); speed B-2 (probe cache miss in tests, fixture fix through the existing attestation store variable) → TEST; correctness B-6 (`cleanup-trust` read-modify-rename of `~/.claude.json` without a lock) → T5, backlog row; S8 non-supervised branch → Q4.

## 5. Net size (HARDEN commits, estimate)

| | Node | Rust | Tests |
|---|---|---|---|
| Accepted fixes and folds | about −190 | about −30 | about −250 |
| Q2 (a) legacy sweep replaced by adopt | −154 more | +15 | −60 |
| Q4 (a) non-supervised branch | about −120 more (SEAT) | 0 | about −30 |

Layer total ≤ 0 in every answer combination.

## 6. Owner ask 1

1. **Target shapes of §2** as written.
2. **Legacy sweep** (RT4-05): (a) adopt closes an attempt that has its lock and no envelope as `abandoned-not-started`, its prepared home is finalized by the existing `finalize-home` step, then `legacy-sweep.mjs`, its row and fix go; (b) keep the legacy sweep.
3. **Attempt whose release was removed** (the one red `run-attempts-stuck` row here since 10-19; `01a93d9ae` made it a named fail whose remedy is to restore the paths): (a) keep the fail (decision of 10-19); (b) the row warns instead of failing and names the attempt; (c) proposed addition P1: `fgos dispatch recover` gets an intent that closes such an attempt under its lock when the lock is free, the domain empty and the paths gone (Rust +30, Node +15).
4. **The non-supervised branch** of `executeAssignment` (reached only by the `http` adapter, which no executor uses; kept as a pluggability proof): (a) delete it with the `http` adapter (SEAT-scheduled); (b) keep.
5. **Pane idle under the default timeout** (`runner.timeoutMs` default 15 min < pane idle 20 min, so idle never fires first by default; each pane seat costs about 3 herdr processes a second): (a) sample the screen only while the idle deadline can come before the soft deadline; keep 20 min; (b) leave as is.
6. **Landing slot:** fg-server2 self-lands each sub-phase in an announced quiet window; the owner machine follows a Vietnamese guide at a time the owner picks.
