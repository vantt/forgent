# HARDEN root plan: closing report and handoff of the layers above T5

Kind of record: stateful. Written 2026-11-18 by `lead:HARDEN` from the nine layer closing reports, their baselines, the plan's owner-decision list and checks of source on main `0981437d2`. It closes the root plan `plans/261021-1118-harden-low-layers-bottom-up` (phase 07). No code was changed.

## 1. Outcome

Every layer from T0 to T6, T8, T9 and Packaging-Distribution has its own closing report and is closed (T3a and T3b closed through their landing reports, see section 4). T7 Work Lifecycle was never hardened: decision 78 held it last and no T7 council or baseline exists. Section 6 is the single handoff table for the layers above T5; section 7 lists what the owner must still decide.

Size at close, net lines per layer as each closing report counts them (counting rules differ per report; read the layer section before comparing):

| Layer | Node | Rust | Tests | Source |
|---|---|---|---|---|
| T0 | -382 | +327 | +207 | closing T0 §4 |
| T1 | -1 248 | +541 | -1 928 | closing T1 §3 |
| T2 | -76 | +490 | +2 044 | closing T2 §3 |
| T3a, T3b | not recorded | part 2 of T3b about -190 | not recorded | landing reports |
| T4 | code -2 062 in total (Node and Rust together, see section 4) | see section 4 | see section 4 | closing T4 §3 |
| T5 | -3 375 | +101 | -3 693 | closing T5 §3 |
| T6 | +44 | not recorded | +695 | closing T6, decision 73 |
| T8 | -979 | not recorded | -2 438 | closing T8 |
| T9 | +2 136 | +617 | +3 026 | closing T9 §2 |

The "better, not bigger" test (net at most zero per language) was met by T0 plus T1, T4, T5 and T8, and missed by T2, T6 and T9. Each miss was put to the owner and accepted (T2 Q8c, T6 decision 73, T8 decision 85 Q4); the T9 misses have no recorded owner answer (section 7).

## 2. Whole-suite wall time against phase 00

Re-measured on 2026-11-18 by the lead, on the owner's decision (option B). Command `npm test` in the main checkout at main `a7719c357` (the two docs commits of this plan on top of `794f75274`), fg-server2, 24 CPUs, started 14:13:27, ended 14:27:18.

| Measure | Value |
|---|---|
| Wall time | 13 min 51 s (830.99 s); the runner's own test duration 769.6 s |
| CPU | 862 percent of one core; user 4 783 s, system 2 387 s; peak resident 3.4 GB |
| Tests | 8 480 run, 8 444 pass, 8 fail, 28 skipped, 0 cancelled |
| Load average at start, end | 5.11 at start; 16.6 (5-minute figure) at end, because other lanes ran tests at the same time |
| Phase 00 baseline | T0 baseline report quotes 8 724 tests and 145 doctor rows; it records no whole-suite wall time (`research-261021-1210-harden-t0-baseline.md`), so there is no like-for-like pair to compare |

Read this figure by load class (HL-29): the machine was shared during the run, so 13 min 51 s is an upper bound for a quiet machine, not a quiet measurement. It is recorded as the first whole-suite wall time of record for the program.

Failures: 8 at the full run. Re-run on their own after the suite finished, 6 pass (they failed only under the shared load: `facade-multiprocess` predecessor kill wait, `fanout-batch-runner-commit`, `loop-rununit` stray-write, `spawn-worker` dispatch depth, `release-tree` R3, `test-select` detached HEAD). Two reproduce alone:
- `test/cli/fgos-workflow.test.mjs:90` expects `workflow start --plan` to be an unknown flag, but the OPS-METRICS lane landed `workflow start --plan <dir>` at 13:34 (board line 2026-11-18 13:34). The test is stale against main; the owner is the metrics lane.
- `test/setup/instruction-projections.test.mjs:232` reports `.fgos/instructions/effective/repo.json` and the `AGENTS.md` managed block as stale. Not caused by this plan (it changed only plans files). Owner and cause not yet traced.

Nothing here is a regression of a HARDEN layer as far as the evidence shows, but both reds sit on main today.

## 3. Layers T0 to T2

### T0: process facts door (merged `7d1f1c1b2`, 2026-10-21)

#### (a) Before / after

Latency (second machine, ext4; before at load about 8, after at load about 3; B0 then C0 section 3).

| Call class | Before (B0 s1) | After (C0 s3) |
|---|---|---|
| Judge, warm p50 / p95 | 4.1 / 7.3 us | 5.3 us p50; p95 not recorded |
| Judge, cold p50 / p95 | 87 / 97 us | 33 us p50; p95 not recorded |
| `resolveHolderLiveness`, warm p50 / p95 | 7.7 / 10.1 us | 5.1 us p50; p95 not recorded |
| Observe a process (route spawn before) p50 / p95 | 1.33 / 1.50 ms | 4.7 us p50; p95 not recorded |
| Durable replace, p50 | 14.45 ms (Rust), 5.47 ms (Node, file fsync only) | 10.4 ms (file and directory fsync) |
| Create-only loser, p50 | about 10 ms (B0 gives 10.38 ms for the Rust winner path; C0 states "about 10 ms") | 5.2 ms |
| Canonical JSON small / 200 keys, p50 | 2.0 us / 171 us (Node) | 4.0 us / 384 us (slower; fixed in T1) |
| First door load | not recorded | 17.7 ms |

Size, tests, doctor, backlog, parallel paths.

| Item | Before | After |
|---|---|---|
| LOC Rust src (B0 s2) | process 5 334, host-runtime 6 302, canonical-json 87, durable-file 333 | net +327 (C0 s4); totals not recorded |
| LOC Node | `process-identity.mjs` 158 lines (B0 s2) | 27 lines, 6 exports (C0 s1); layer net -382 (C0 s4) |
| LOC tests | Rust tests dir: 2 279 / 2 261 / 0 / 297 (B0 s2) | net +160 Node, +47 Rust (C0 s4); totals not recorded |
| Tests and wall time | 179 cargo tests pass, 30.1 s; `help-routes` 28 dev-door spawns, 119.3 s in suite (B0 s3) | `npm test` 8 724 tests, 2 red (both pass alone), cargo 1 red (passes alone); wall time not recorded (C0 s5) |
| Doctor rows | 145 rows, 40.7 s; `coordination-abandoned-claims` present (B0 s4) | 145 rows reported after activation with that row gone (C0 s5); doctor wall time not recorded |
| Backlog rows | `p-e6425aa9` (c) and `p-3c7681b8` proposed (B0 s5) | `p-3c7681b8` stays open (C0 s7); `p-e6425aa9` not recorded |
| Parallel paths per job | 14 liveness sites, 33 rename sites, 7 canonical twins (B0 s2, plan phase 01 inventory) | one liveness door (nine `kill(pid,0)` judges deleted); 11 Node durable sites moved onto `durable-file` (6 replace, 5 create-only); two canonical twins moved after byte-equality over 12 865 documents, 0 mismatches (C0 s1) |

#### (b) Net delta vs estimate (C0 s4)

| Part | Estimate | Measured |
|---|---|---|
| Node src bin scripts | -472 | -382 |
| Rust src | +66 | +327 |
| Node tests | -97 (Node and Rust tests together) | +160 |
| Rust tests | (in the same estimate) | +47 |
| Contracts | not estimated | -21 |
| Code and tests | about -500 | about +150 |

The close criterion "net <= 0" was missed. Growth came from the three N-API namespaces of the owner-approved door (about +230 Rust), `Unknown` handling (+47), the `step` field in durable-file errors (+79), and red tests for seven Highs (about +320). The owner (2026-10-21 23:37, "(c)") moved the trim into T1, so T0 plus T1 end at or below 0 (C0 owner answers). L records the same.

#### (c) Findings (C0 s2)

Accepted and closed, with the red test and phase: F-A1 plus RT-M4 (gateway stop, High), F-A3 (`stop-processes-inside`, High), RT-M3 (`lock-fence` null equals null, High; a pin test only, not reproducible from outside), RT-M1 (subreaper on the caller, High), RT-M2 (`Unknown` folded to `Empty`, High), RT-M5 (missed callers and Windows `bootId`, High), S-E1 (nine liveness judges, High), plus the Medium/Low group (S-A1/F-A5, F-A2, F-A4, RT-M6, RT-M7, S1, S-E2/S4, S-E6, S-F1 to F3, S-G1 and G2, S-C1, RT-M8, S-D1), all fixed in phases 3 to 6. Rejected findings: none are listed in C0. The arbitration report is the owner of accept/reject reasons and was outside the files read.

#### (d) Owner-approved exceptions to zero Node deciding logic

None recorded by name in C0. C0 s1 says `component-boundary.md` gains rows with "the accepted exceptions" but does not name them. P decision 3 (owner): the state store's hot mutex stays in Node until WORK lands. Naming the T0 exceptions needs `docs/platform/component-boundary.md`.

#### (e) Refuted hypotheses

- Route spawn for the hot-lock waiter loop (phase 01 Q1 option a): B0 s1 measured 1.33 ms against a 4.1 us leaf, about 300 times, so a route cannot serve the loop; the in-process door was chosen.
- Moving no-fsync or create-only sites onto `durable-file` is free: B0 s1 shows 10 to 15 ms against 20 to 40 us; the choice was made per class.
- "Rust canonical JSON is faster so the move costs nothing": refuted for N-API in C0 s3. The crate alone is 49 us, but through N-API a 200-key object took 384 us against 171 us (2.2 times slower). The speed seat predicted it, the red-team disputed it. Fixed in T1 (45.5 us, C1 s2).
- RT-M3 reproducing from outside: not reproducible; kept as a pin (C0 s2).
- Phase verification found five real regressions before merge (C0 s5, two itemised). After close, TEST found one missed: the manifest rewrite in `stageLauncherDoor` made `npm test` exit 1 on the `.fgos` leak check (C0 s5b); fix on `harden/t0-fix-manifest-rewrite`.

#### (f) Proposed additions (owner picks, P decisions 5 to 7)

Picked: doctor per-row timing in `fgos doctor --json` (owner pick 2b, 2026-10-21 15:46; delivered in T9 phase 07, per L). Declined: `durable-file::replace_atomic`, a per-machine bwrap probe cache.

---
### T1: holder-lock, identity, convention (merged `c56f1eae3`, 2026-10-22)

#### (a) Before / after (B1, C1 s2; load about 0.25 before, about 2 after)

| Call | Before (B1) | After (C1 s2) |
|---|---|---|
| Holder-lock acquire plus release, uncontended | p50 1.36 ms, p95 1.52 ms | p50 99 us (14 times faster); p95 not recorded |
| Hot mutex `withStateTx`, empty | p50 19.6 us, p95 29.1 us | 20.3 us p50 (unchanged) |
| `resolveWriterIdentity`, cached | 0.9 us p50, 1.7 us p95 | 1.2 us |
| `resolveWriterIdentity`, uncached | 1.41 ms (spawn) | 36 us |
| `resolveStateRoot`, unpinned | 0.8 us p50, 2.1 us p95 | 1.3 us |
| Canonical JSON, 200 keys | 384 us (T0 after) | 45.5 us |
| Pre-commit hook, lock step | one route spawn | about 3 ms (two native routes) |
| `fgos identity --pid` / `fgos convention name` (not touched by T1) | 1.41 / 1.38 ms | 2.1 to 2.8 / 4.9 ms (slower; handed to T9/IDENT) |

| Item | Before | After |
|---|---|---|
| LOC Node `src bin scripts .githooks` | not recorded in total | net -1 248 |
| LOC Rust | not recorded in total | net +541 (inline tests included) |
| LOC tests | not recorded in total | Node -1 751, Rust -177 |
| LOC `src/holder-lock` | 2 499 (C1 s3) | 1 784 (budget 1 650, missed); Windows hold transport 498 kept |
| Tests and wall time | not recorded | `npm test` 8 623 pass, 0 fail, no `run-tests: ERROR`; cargo green; wall time not recorded |
| Doctor rows | not recorded in total; holder-lock rows 9 | 142 rows, 11 not passed (10 pre-existing, one `git-mutation-one-door` from CFG); holder-lock rows 5 |
| Backlog rows | not recorded | not recorded |
| Parallel paths per job | Node `/proc` holder scan plus Rust, Node two-process probe, Node pid classifier, `lock-fd` route modes, two `state-root` resolvers, Node cutover fences, `lock-fence` scanning twice | one holder list; one door for lock, identity and state root; those paths deleted (C1 s1) |

#### (b) Net delta vs estimate

Net total about -2 789 (C1 s3). The T1 arbitration estimate for Rust was +80 to +150 (as quoted in C1 s3); measured +541. The Node and tests estimates are not recorded in the files read. T0 plus T1 about -2 640, which meets the owner's T0+T1 <= 0 target. `src/holder-lock` 1 784 against a 1 650 budget is missed. Rust grew because logic moved from Node into Rust (lock door, origin classifier, identity door, R7/R8 fixes with proofs), as the owner accepted on 12:05.

#### (c) Findings

C1 has no accept/reject table. Closed and fixed: S-F1, HL-N8/N9, T0-R1 (canonical JSON N-API cost), T0-R2 (`durable-file-mode-invalid`), R3 (bwrap refusal line; OPC carries the classification), RT-M2, RT-M4, RT-M5, RT-M6, RT-M7, RT-M8, RT-M9, RT-M10, R7 (probe unlock-before-close race, from TEST), R8 (predecessor admission bounded to 2000 ms, from OPC); ledger rows closed: R1, R3, R7, R8, H16, H18, H19 (counter part), H21. Phase-6 closed T0's SEAT carry list. Rejected: none listed. Owner decision 12 removed `lock.predecessorKillWaitMs`. Reasons for accept/reject sit in `council-261022-0245-harden-t1-arbitration.md` (not read).

#### (d) Named exceptions to zero Node deciding logic

- Windows keeps `hold-transport.mjs` and `route/hold.rs` (498 lines), because the supervisor's domain handover needs them (RT-M3, evidence-based; P decision 17: replacing it is input for T4's council, not a commitment).
- The hot mutex stays in Node until WORK (P decision 3; H22 and H23 go to WORK).
- The Rust Git-WAL tombstone stays, by GIT's evidence (C1 s1). That is Rust, not a Node exception.
- Owner decision 10: the checkout `node bin/fgos.mjs` channel is unsupported for process, lock and identity verbs (a channel decision, not an exception).

#### (e) Refuted hypotheses

- B1 point 3: identity and state-root are already sub-microsecond in Node, so moving them adds N-API cost. The measured cached cost was 0.9 to 1.2 us with no regression; the uncached path fell from 1.41 ms to 36 us.
- "Removing the identity cache is harmless": it tripled `withStateTx`; the timing test had been moved to hide it (C1 s4, regression 5).
- The close verify of 8 623 green was not proof: after close TEST found the same-writer settle tests failing 5 of 6 runs (millisecond collision once claiming became spawn-free) and `active-release-drift-check.test.mjs:328` failing deterministically (C1 s4b). Fixed in `e870235c1` and `4003c00a4`. Cause of the second miss unconfirmed.
- HL-F1 (hot mutex costs 6 to 10% more): B1 measured about 2 us at 19.6 us; owner decision 11 set an absolute bound instead.

#### (f) Proposed additions

Write-once self record for the hot mutex: sent to WORK as an idea, not built (P decision 13, H22). T1 owner ask on 2026-10-22 22:45 "1a 2c 3b 4a": the other proposed-addition picks are not itemised in the files read. Windows hold-transport replacement: input to T4, not committed (decision 17).

---
### T2: Git and terminal-control (merged `a01f725bf`, 2026-10-23; closed 2026-10-24 10:05)

#### (a) Before / after (C2 s2; load 2 to 5 from other leads, only same-moment pairs mean anything; no quiet re-measure at close)

| Call | Before | After |
|---|---|---|
| Refs/Worktree/config admission at 322 chains, p50 | 32.3 ms | 15.8 ms |
| Publication ceremony Git children per seal | 13 steady, 15 first | 10 |
| `resolve_head` children | born 3, unborn 4, missing commit 3 | born 2, unborn 3, missing commit 2 |
| Event Store read with attached HEAD, children | 11 | 9 |
| Contained children per worktree add | 15 | 13 |
| `list_refs` one among 1 300, p50 | 7.56 ms | 0.86 ms |
| Terminal allocate herdr commands, 1 to 4 live panes | 8, 12, 16, 20 | 6, 7, 8, 9 |
| `attach` herdr commands | 4 | 2 (3 after ownership check move) |
| Doctor `inspectGit` per run | 7 to 8 | 4 (5 with non-origin remote) |
| `loop.test` B/A (WORK branch over T2) | 1.83 | 1.41 (not a T2 speed-up alone) |
| Worktree add p50 | 169 to 301 ms across phases; no real change under load | fsync per add about 22 to 23 unchanged |

p95 figures: not recorded. Not re-measured at close: doctor wall time, terminal `capabilities` op, `worktree-admin-multiprocess.test.mjs` wall time, and `test-proof-inventory --cli-cost` totals.

| Item | Before | After |
|---|---|---|
| LOC Node src bin scripts | not recorded in total | net -76 |
| LOC Rust src | not recorded in total | net +490 (inline tests counted as Rust) |
| LOC tests | not recorded in total | net +2 044 |
| JSON contracts and fixtures | not capped | +1 941 |
| Node budgets | | `src/git` 216 lines in 12 files and `terminal-control-checks.mjs` 120 met; `git-checks.mjs` 169 vs 150, `client.mjs` 235 vs 200, `config.mjs` 111 vs 100 missed |
| Tests and wall time | `cargo test -p fgos-git` 294 pass (after each slice) | whole-suite counts and wall time not recorded |
| Doctor rows | Git 10, terminal 3 | Git 6, terminal 2, 140 rows total, 10 not passed |
| Backlog rows | not recorded | `p-djrgdijd2c` opened; `p-txiatvrts4` implemented in this landing, row still reads proposed |
| Parallel paths per job | two remote scheme ladders; six layout-cause ladders; two WAL failure spellings; 17 `core.fsync=all` sites each hand-written; Node Land retry loop; raw herdr pane access outside the port | one remote door; one layout-cause function; one `From<WalError>`; one fsync helper; Land wait in Rust; pane access behind the port except the worker session-server start (C2 s1, s6) |

#### (b) Net delta vs estimate

| Part | Ceiling | Plan floor (phases 1 to 9) | Measured |
|---|---|---|---|
| Node | <= -120 | about -245 | -76 (missed by 44) |
| Rust src | <= 0 | about -145 | +490 (missed) |
| Tests | <= 0 | about +200 (expected about -55) | +2 044 (missed) |
| Layer | <= -120 | not recorded | +2 458 |

Causes (C2 s3): post-ceiling owner picks (port moves Rust +220 and tests +144; even-split about +145 Rust; labels +50; A1; A2), Land wait +127 (estimate +45), head-in-listing about +55 Rust and +261 tests, macOS +40, phase 1 red tests +813 against +260 estimated, test retirements Node -105 against expected -280. Owner answer 2026-10-24 10:05, "Q8c": Rust growth accepted, test overrun folds through TEST's D4 move-down (H29); closed (P decision 28 per C2). The big lead landed before checking the table, which C2 s7 records as an error.

#### (c) Findings

Accepted and fixed (C2 s4, owning proofs named there): CF01 to CF06, CF08, CF09 (flags pinned, no ordering witness; proof is OPC's reading review; power-cut script not run), CF10 (residual: parent-side snapshot, not at fork), RT01 and F-7, E-5, F-5, Land wait in Node, F-C4, F-C5 and A2, A1, pane access outside the port (E-10, E-11, E-12, E-17), dead surface (E-26, F-8, E-14, E-13, E-15, E-16), E-1, E-3, F-1, E-6, E-20, E-21, E-24, Q3 and Q4.

Rejected, not reproduced, or kept:
- CF07: not reproduced (`redact` uses `from_utf8_lossy`; no fixture can inject a read timeout without a new seam).
- F-C3, two `git var` children kept (D-T2-9): they let a later-appearing absent config file invalidate the floor record; hand derivation would copy git's lookup and lose a fail-closed code; saving is one or two children once per process.
- WAL digest twin kept (D-T2-10): T0 leaf prints numbers via f64 and sorts by UTF-16, WAL keeps exact integers and sorts by bytes.
- Slice B (compat fields): `CheckoutProof.old_index` written `null`, struct `deny_unknown_fields`, Restore defaults read.
- Phase 5C trims dropped because each weakens a spec rule; smaller keeps listed in C2 s4.
- F-C1 (compaction of Worktree and Refs chains) left T2: OPC rounds 2 and 3 found new defects, each fix needed a new mechanism, steady-state cost about 4 fsyncs (about 47 ms per chain) to save about 0.09 ms per chain; kongming and OPC agreed. Work is `p-djrgdijd2c`.
- F-C2 (fewer fsyncs per add) withdrawn by owner (decision 23).
- A3, A4, A5 not taken (decision 21); Slices A and C of phase 8 built but not merged (census lines must read zero); slice 12 did not run (WORK's `work/es-cutover` not on main).

#### (d) Named exceptions to zero Node deciding logic

- The grace-versus-agent-ready timeout rule and the `retainFailedPaneMs` shape stay in the Node terminal adapter (D-T2-7, C2 s5), recorded as a T5 input (H26).
- The Rust `checkpoint_tracked_files` stays until WORK's `work/es-cutover` lands (H28); Rust, not Node.
- The only raw herdr exec left is the worker session-server start, named in the spec and handed to T4 (H25).
- The placement fallback by count stays as a documented degraded mode with a doctor row (C2 s4).
- Whether the owner named any of these as exceptions in those words: not recorded in C2.

#### (e) Refuted hypotheses

- Speed seat baseline for worktree add (184 ms, 25 fsync, 19 children): at the track tip phase 4 measured 11.5 contained children before and after its change, so 19 no longer held; fsyncs per add unchanged.
- Owner-approved fsync cut (phase 10): 25 to 23 fsyncs, p50 191.4 to 189.4 ms within noise; chained directory syncs cost almost nothing while a flush after new metadata costs about 5 ms; withdrawn (decision 23).
- Arbitration lines reversed by evidence: two `git var` children stay; WAL digest twin stays.
- F-C1 compaction: expected to save time, measured net cost per add.
- `loop.test` 1.83 to 1.41 is not a T2 speed-up (gain spread across WORK's own waves).
- CF07 not reproduced.
- Independent verifies caught what leads' own runs missed: `resolve_head` could pair one branch's commit with another's name (fixed, `tests/head_switch.rs`), and a shared native-state list would have blocked restore during a bisect (`dc756d2af`).

#### (f) Proposed additions (owner picks)

Taken: A1 (retained-chain count and oldest age in the journal row) and A2 (one repository handle/fact cache per process) (P decision 21). A3 left for a separate item; A4 and A5 not taken. Owner-requested layout and naming review produced even-split default (decision 24), label format and further layout picks (decisions 22 to 27; Q5 label format discussed later). Worktree fsync cut taken then withdrawn (decisions 19, 23). Operation-records fsync block (about 64 of 172 ms per add) noted as a possible later addition, not T2.

---
### Misses to carry into the root report (L section 5 and C0, C1, C2)

- T0: net <= 0 missed (+150), trimmed in T1; five phase regressions caught; the missed `.fgos` leak ERROR line after close.
- T1: `src/holder-lock` 1 784 vs 1 650; two tests red after close, fixed.
- T2: all three ceilings missed, landed before checking the table, owner accepted via Q8c.
- Lessons section 5 did not itemise misses beyond the numbers table, which agrees with the figures above (T0 -382/+327/+207; T1 -1 248/+541/-1 928; T2 -76/+490/+2 044). Note: L gives T0 tests +207 (+160 Node, +47 Rust), consistent with C0.

## 4. Layers T3 to T5

T3a and T3b have no closing report. After-numbers below come from the three landing reports; before-numbers and findings from the baselines and arbitration reports.

### T3 after-numbers from the landing reports

| Metric | T3a (agent protocol/observe) | T3b (Event Store) incl. part 2 |
|---|---|---|
| LOC Rust net vs estimate | not recorded (estimate not recorded) | part 2 only: Rust src net about -190 (C, header) |
| LOC Node net | Node friction client 194 -> ~80 lines (A, Outcome/Observe) | not recorded |
| LOC test net | not recorded | not recorded |
| Total size | A: release 858 files | part 2: 46 files, about +400/-500, 17 commits (C, header); B: release 861 files |
| Tests (cargo) | 1614 pass, 0 fail (A, Verification: Gate); Observe cargo test ~6 s vs 35 s before (A, Tests) | 1629 pass, 1 fail, IDENT test, same on main (B, Full gate); part 2: 291 pass (event-store+identity+work-state), cli_tests 41 pass (C, Verification) |
| Tests (npm) | 8573 pass, 5 fail, 33 skipped; the 5 also fail on clean main (A) | 8682 tests, 8584 pass, 0 fail, 33 skipped, 65 todo (B) |
| Suite wall time | not recorded (only observe cargo ~6 s) | not recorded |
| Routes p50/p95 | not recorded (no p50/p95; `metrics coverage`/`runs` 0.17 s vs ~1.0 s before, A, Metrics) | not recorded (`metrics coverage` 0.18 s, B step 5) |
| Doctor rows | 148 total, 10 not passed (A, step 4); observe-run-coverage ~0.18 s vs ~1.5 s | 149 total, 10 not passed (B, step 4); part 2: event-store rows 10 -> 8 (C, item 4) |
| Backlog rows | not recorded (Owner Q3 open, no row id) | added p-zsy3fmbcpd (non-Linux refusal), p-nykfevjxqf (secret masking, not built) (B); p-duxnm52lzh (C, Left for others) = 3 rows named |
| Findings accepted/rejected | not recorded as counts; OPC MERGE (A, Reviews) | not recorded as counts; part 2 lead:ES one round of changes R1-R3, N1 (C header); OPC one Low fixed (B, Reviews) |
Note: census shows 5 undeclared sites in both landings (A Clippy and census; B Census).

### T3a: Agent protocol and Observe

Closed: S3a `closedNote`: phases 01-06 landed 2026-10-24 at `48a45a5f5`, phase 07 landed 2026-10-25 at `8622c1066`; Event Store edges closed in `b17ee1bd4`. Frontmatter `status: done`.

#### (a) Before / after

"Before" is T3aB (main `330c5242a`, 2026-10-24 19:28-19:34, load 2.3-2.6, fg-server2). "After": not recorded in any source read (no closing report, no re-measure table found).

| Row | Before (T3aB) | After |
|---|---|---|
| Routes, cold p50/p95 ms (warm in brackets) | `metrics ping` 12.4/14.0 (8.9/10.2); `metrics case list` 13.0/13.6 (9.7/9.9); `metrics faults` 13.6/18.2 (9.2/10.2); `metrics eval list` 39.1/43.1 (33.7/38.2); `metrics discussions` 49.8/67.3 (41.9/61.7); `metrics outcomes` 58.4/72.2 (54.4/61.0); `metrics entropy` 58.0/69.2 (50.1/58.2); `friction ping` 33.7/39.5 (31.1/35.0); `friction show` 37.6/43.0 (27.7/34.4); `friction list` 49.9/55.3 (45.2/57.2); `friction rank` 48.1/57.8 (48.0/53.7); `metrics coverage` 1 052.8/1 064.2 (1 034.1/1 054.8); `metrics runs` 1 341.1/1 527.3 (1 274.3/1 299.1); `metrics harness` 1 432.2/2 644.9 (1 332.2/1 901.6) | not recorded. Plan target only: `metrics coverage|runs|harness` "about one third of today" (S3a Outcome; an estimate, not a measurement) |
| Rust tests | 78 pass (16 agent-protocol, 62 observe); about 37 s test time, 46.1 s wall incl. fresh compile; `store_lock_multiprocess` 35.01 s of it (6 tests) | not recorded. Plan: retire the 31 s test now, reshape the 5 s timeout test (A3a section 3) |
| Node tests (owning files) | Observe-only + protocol-only files 880 lines, 42 tests (grep count, not run); no Node wall time taken | not recorded |
| LOC Rust src | agent-protocol 1 288 (17 files); observe 6 364 (26 files) | not recorded |
| LOC Rust tests | agent-protocol 684; observe 1 305 | not recorded |
| LOC Node | `src/observe/friction-client.mjs` 194; `settle-attempt.mjs` 251; `usage-parsers.mjs` 199; `provider-adapter.mjs` 714; `provider-auth-failure.mjs` 66; `trust-store.mjs` 634 | not recorded. Plan: Observe client about 70 lines with no lists (S3a Outcome) |
| Doctor rows | 5 touching the layer: `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` (all pass), `agent-cli-project-trusted` (fail, machine state); whole doctor 140 checks, 12 fail, 62.9 s | not recorded. `observe-friction-migrated` retires with the fence (H33, landed `774cc6bba` per PL row 04; A3a section 3) |
| Backlog rows | 1 open (`p-d2dc4f2e`), 1 loosely related (`p-c3a41d07`); none names Observe | not recorded |
| Parallel paths per job | Quota/login wording in Rust (`direct/mod.rs`) and Node (`provider-auth-failure.mjs`, `settle-attempt.mjs`); the red-team counted seven Node wording lists, not two or three (A3a section 7); screen limit patterns Node-only and wider than Rust; reason strings re-parsed by Node regex; shard stores: friction/case/eval/snapshot with the hardened door only in `eval_journal.rs`; run coverage deliberately twice (Rust + Node `scanAssignmentLayout`) | Plan target: one outcome authority in both launch modes; one shard door for four stores; Node coverage scan dropped (D31). Landing of each: not recorded here |

#### (b) Measured net delta vs estimate

Measured: not recorded (L5 gives "n/a" for Node, Rust and tests for T3). Estimates only, from S3a "Size" (HARDEN commits; measured delta was to go in each phase report, which I did not read):

| | agent-protocol Rust src | Observe Rust src | Other Rust | Node | Tests |
|---|---|---|---|---|---|
| Sum without Q3 | -55 | -370 | +15 | -165 | +130 (Observe-owned +20) |
| Ceiling (A3a section 2) | <= -60 (at risk, -5) | <= -700 (at risk) | supervisor <= +20 | <= -120 | Observe <= -150 (at risk) |
| Phase 07 (Q3 = remove, taken by D37) | 0 | -560 | 0 | 0 | -335 |
| Sum with Q3 | -55 | -930 | +15 | -165 | -205 (Observe-owned -315) |
| Ceiling with Q3 | | <= -1 300 (at risk) | | | met by estimate |

The plan itself flagged three of the ceilings as missed by estimate and said the red-team round added code (directory preflight on every store, torn-tail policy, Windows helper in `fgos-durable-file`, stability loop, typed read). Whether any ceiling was met after landing: not recorded.

#### (c) Findings, accepted / rejected (A3a section 3, quoted verdicts)

Seat verdicts recorded:

- Accepted: wire the direct-mode `classify` rather than delete it (simplicity F1 overruled; reason: owner's 2026-10-21 rule that T0-T4 end with no deciding logic in Node; wiring about 15 supervisor lines; lets T5 delete `exitedOnDeadCredential`, `exitedOnQuota`, `provider-auth-failure.mjs`).
- Rejected as stated: widening Rust wording to Node's six generic phrases (simplicity F6/Q2); reason: RT-01 reproduced, unanchored phrases over agent text cause false quarantine; only anchored, vector-backed wordings join Rust.
- Rejected: merge `observe-host-resolvable` into `observe-run-coverage` (F24); the rows answer different questions, store can break while all rows pass (B-O6).
- Not taken: new read-only host check for `observe-friction-migrated` (RT-19, P1); the row retires with the fence (D17).
- Taken in T3: `result.json` typed read (speed S-1) although `run-result` is T5; one function, no contract change; a prefix-only read rejected (relies on key order).
- Accepted: retire the 31 s `store_lock_multiprocess` test now; reshape the 5 s one onto `acquire_store_lock_within`.
- Accepted: delete `FGOS_NOW` from product code and inject the clock (RT-13 over simplicity F19); L5 forbids test-only switches.
- Big-lead decision: the `--json` no-op flag is accepted on Observe verbs (RT-15).
- Red-team summary (A3a section 7): all three High findings stand (RT-01 and RT-02 have an inferred half that became a red test first; RT-03 reproduced end to end); no Windows/macOS build defect found.

Count of findings (raw, accepted, rejected): not recorded in A3a or any T3 file read. The HARDEN plan's "37 raw, 20 deduplicated, 18 accepted, 2 partly rejected" at PL line 373 belongs to a different review (the plan review), not T3.

#### (d) Owner-approved exceptions to "zero Node deciding logic in T0-T4"

None named for T3a in the sources read. The rule was used as a decision input (D30: direct classify wired, not deleted). Note the baseline's own residue that the plan leaves in Node and hands to T5: `provider-auth-failure.mjs`, `usage-parsers.mjs` (token usage has no Rust twin), folder-trust seeding `trust-store.mjs`. Whether the owner accepted these as named exceptions: not recorded (the hand-offs are in A3a section 5, not read).

#### (e) Refuted hypotheses

- Baseline claim "two or three" wording lists: the red-team found seven Node lists (A3a section 7).
- Baseline premise that Rust names usage-limit in terminal mode: false; Rust reports a recognised quota as `needs-human` (A3a section 1, red-team correction).
- Speed seat's inference of which holder-lock tests own the multiprocess behaviour, drawn from file names: corrected by the correctness seat (owners named `tests/multiprocess.rs:46`, `:62`); the sub-plan was to confirm before deleting (A3a section 3).
- Baseline observation that the three slow routes are "scan cost": refined by speed seat to parse cost, 295 MB of `result.json` parsed into `Value` for ten fields; a typed read measured 7.5 times faster (A3a section 1).

#### (f) Proposed additions, owner pick (D30-D32, D37)

| Item | Owner answer |
|---|---|
| Q1 shapes incl. outcome contract | "Q1 duyet" (D30): approved |
| Q2 drop Node scan in `observe-run-coverage` | "Q2 dong y" (D31): taken |
| Q3 remove constant/always-zero `metrics harness` sections and unbuilt `coordination-session` contract | first open ("what does it mean"), then "04a-Q3 bo" (D37): taken, phase 07 ran |
| Q4 A1 redact friction `detail` before append | not built now (D32), listed under "Additions waiting for the owner" |
| Q4 A2 size cap on `result.json` in run scan | not built now (D32) |
| Q4 A3 `friction --check` naming bad lines | not built now (D32) |
| Q4 A4 named `terminal:delivery-unknown:not-ready` reason | not built now (D32) |
| Q5 landing slot | "Q5 dong y" (D32): self-land on fg-server2 after the Work cutover |

---

### T3b: Event Store

Closed: no T3b `closedNote`. PL row 04: 04b part 1 landed on fg-server2 2026-10-25 (`8622c1066`); part 2 landed 2026-10-25 22:31 on main `843ed0483` (lead:ES APPROVE, OPC MERGE); H33 with D4-D7, D13, D14 left; H33 landed `774cc6bba`, T3 closed 2026-10-28 14:44, D13 waits for a section 23.2 run.

#### (a) Before / after

"Before" is T3bB (main `c7522c86d`, 2026-10-24 23:52 to 10-25 00:20, load 0.7, spikes 11-15). "After": not recorded.

| Row | Before (T3bB) | After |
|---|---|---|
| Routes p50/p95 | `fgos help` 37/42 ms; `fgos list` (269 items) 843/898 ms, 11 git children, 1 node; `fgos show` 777/964 ms; `fgos events status` 633/653 ms, 16 git children. With a sync due: one `list` 2 970 ms. Write path (benchmark, dev profile under strace): 1 session store increment 27.9/31.5 ms, 3 fsyncs per append; 10 sessions 23.5/43.1; 15 sessions 30.5/38.1; 20 sessions FAILED (`hot-lock-timeout` after 5 000 ms). CLI-level write path: could not be measured (fresh clone refused with `git-wal-unreadable: repository-identity-changed`, cause not found) | not recorded |
| Tests and wall time | Rust 182 pass, 1 ignored, 30 suites, `cargo test -p fgos-event-store` 42.4 s wall; Node 5 files run: 63 pass, 18.4 s wall (15.2 s test time); whole Node set 25 files / 134 tests in `test/event-store` (3 045 lines) plus 6 files / 25 tests in `test/state`, `test/setup` | not recorded |
| LOC Rust | crate src 7 757 (31 files); addon `event_store.rs` 779 | not recorded. A3b plan: delete list after the fence release about -1 450 src, about -1 150 test lines |
| LOC Rust tests | 9 007 (32 files; ratio 1.16) | not recorded |
| LOC Node | 1 243 in 21 files (facade 417, `src/state` consumers 258, verbs 410, setup 126, detached child 32) plus 723 benchmark script lines | not recorded |
| Doctor rows | 10 store rows, all pass (`event-store-git-version`, `-open-root`, `-machine-id`, `-refspec`, `-unsealed`, `-integrity`, `-sync`, `-native-addon`, `-legacy-layout`, `-orphan-branches`); 3 setup fixes; 1 config default; whole doctor 148 rows, 12 fail (none the store's), 57 s | not recorded. Plan: merge `event-store-native-addon` into `-integrity` if the contract version is checked there (A3b section 3); `observe-friction-migrated` retires with H33 |
| Backlog rows | 0 open rows name the store (`p-txiatvrts4` done; `p-djrgdijd2c` is Git WAL); 3 open follow-ups in the ES plan (H33, H31-A test, stray shards, dead union settlement) | not recorded. Later: backlog `p-nykfevjxqf` (masking) created by D38 |
| Windows/macOS | msvc: 11 test targets fail to compile (24 error sites) and 1 lib warning; darwin clean | not recorded |
| Parallel paths per job | Node duplicates of Rust: config defaults/validation, sync/seal-due policy, unsealed-age thresholds, damaged-history code list, refspec overlap logic, legacy decode/parity, `replay.mjs` fold (827 lines) vs Rust `event_reader.rs`, lock-rank guards; every `list` pays store lifecycle | not recorded |

#### (b) Measured net delta vs estimate

Measured: not recorded (L5 "n/a"). Estimate quoted in A3b: after the fence release the delete list is about -1 450 src and about -1 150 test lines (about -780 lines for H33 alone per T3bB section 6); three cuts could be made at once. Whether achieved: not recorded here.

#### (c) Findings, accepted / rejected (A3b section 3)

- "Is the 20-session `hot-lock-timeout` a real limit?" Verdict: both seats right. CLI path holds the lock briefly (20 parallel `fgos edit` pass); the benchmark's 20 tight writers hit a polling lottery (no queue, 5 s deadline, about 50 ms hold, 20 ms rewriting the 8.5 MB view under the lock). The store does not need this lock for its invariants.
- Proposal to cut two of three per-append fsyncs (speed S-1, p50 16.2 to 8.4 ms): not taken in 04b; proposed to WORK; it reverses pinned `p02_review.rs:76-111` and durability is WORK's semantics.
- Delete `promote::abandon` (no caller): big lead deletes, no owner call under RUL104.
- Merge or drop `event-store-native-addon` row: merge only if no condition is lost.
- Rollback export D5 timing: at the H33 fence release with D4, D6, D7 (owner's standing "fences live one release" rule).
- `fgctl init` failure in a fresh clone: out of 04b, new item for Distribution.
- WAL refuses 775 `.git/fgos` under the name `repository-identity-changed`, and about 300+ machine refs give `wal-record-too-large`: Git area, OPC; rename the refusal, write the ref-count limit into the Git spec.
- WORK decisions (A3b tail): RT2 keep store id on a move, only a changed machine id refused by name (accepted); due sync of read verbs moves to the detached child (accepted).
- Store invariants held: no lost, duplicated or reordered event in any run (A3b section 1).

Counts of findings: not recorded.

#### (d) Owner-approved exceptions to "zero Node deciding logic in T0-T4"

- The state store hot mutex (`src/state/hot-lock.mjs`) stays in Node until WORK lands: owner decision 3 (2026-10-21 12:05, PL), expected candidate named in the plan's success criteria. It is the cause of the benchmark's 20-session timeout and WORK owns it (A3b section 3 says the store does not need the lock). Applies to T1/T3b boundary.
- The Work fold `src/state/replay.mjs` (827 lines) and the lifecycle trigger code in `bin/fgos.mjs` stay on the consumer side (T3bB section 1, "not counted"): owner-accepted as an exception: not recorded.
- D34 (Work stays Linux-only, store test targets gated to Linux) is a platform scope decision, not a Node-logic exception.

#### (e) Refuted hypotheses

- Baseline's "20-session row fails, cause unknown on release": released runs split into "20 parallel CLI edits pass" (correctness) vs "benchmark fails in 21 of 24 release runs" (speed); resolved as polling lottery, not a store defect (A3b section 3).
- Baseline suspicion that the unexplained `repository-identity-changed` refusal in a fresh clone is an identity bug: A3b attributes it to the 775 mode misnamed (`wal.rs:43`, `:1076-1081`); reproduced by red-team/correctness, not diagnosed in the baseline (T3bB section 2).
- Seat claim that all store invariants might be at risk: none found (A3b section 1: failures sit at the edges).

#### (f) Proposed additions, owner pick (D33-D38, D43, D46-D47)

| Item | Owner answer |
|---|---|
| Q1 shape (edge rule, identity rule) | "Q1 duyet" (D33): approved |
| Q2 Work on macOS | "Q2 a" (D34): Linux-only, backlog item for later |
| Q3 secret leaked into pushed event | "Q3 a+c" (D35), superseded by D38 ("2"): masking at append not built (secrets door has no production consumer); manual remedy documented in spec known limits; masking = backlog `p-nykfevjxqf` |
| Q4 landing | "Q4 ok" (D36): self-land on fg-server2 after WORK reviews |
| Cut two of three fsyncs | not taken in 04b; proposal to WORK; outcome: not recorded |
| H33 + D4-D7, D13, D14 package | "3a" (D43): HARDEN takes it, deletes rollback export D5 in the same release; landed `774cc6bba` |
| R13 Git-call cuts per operation | D46 (b then a), D47 option (a): stop at in-process cuts; no on-disk cache, OPC Phase B closed |

---

### T4: Run Supervisor and Launch gate

Closed: T4C (main `abbc4a98e`), measured 2026-11-04 17:35-17:55; owner decision 76(a) accepted the 1 057-line miss and ordered the Rust test time cut to <= 50 s. All phase P01-P07 on main.

#### (a) Before / after (T4C section 2; before = T4B, `e078ca201`; after = `abbc4a98e`)

| Row | Before | After |
|---|---|---|
| Routes p50/p95 | four internal routes (`supervise`, `gate`, `adopt`, `attempt-step`): not timed (need a real attempt). Seat launch about 1.2 s (TEST evidence, not re-measured) | routes still not timed; doctor check functions: `run-supervisor-route` 17-29 ms, socket dir 2-5 ms, stuck attempts 188-217 ms (503 attempt dirs); `attempt-step` entry import 41.0 to 2.5 ms (`finalize-home` 40.0 to 25.8, `cleanup-trust` 40.5 to 11.7, `settle-attempt` 39.8 to 37.3); seat launch time: not measured (forbidden to dispatch). Release recorded by L5: Rust tests 127.9 to 72.9 to 46.7 s (after speed lead) |
| Rust tests, count and time | 134 (17 unit, 117 integration); 126-128 s wall | 149 (19 unit, 130 integration); 72.9 s wall (71.4 s summed) at close, criterion <= 50 s not met at close; 46.7 s after the speed lead (L5, decision 76a: met) |
| Node tests (`test/run-supervisor`) | 171 tests / 20 files; batch 158.9 s test, 165 s wall; per-file sum 561 s | 138 tests / 19 files (137 pass, 1 skipped Windows); batch 118.6 s test, 120.6 s wall; per-file sum 321.4 s |
| LOC Rust src | 4 677 (17 files) | 6 575 raw (17 files); about 4 935 without the workspace rustfmt commit `c37d76811` (+2 092/-452) |
| LOC Rust tests | 4 757 | 7 147 raw; about 5 140 without rustfmt (+2 570/-564) |
| LOC Node `src/run-supervisor` | 1 192 outside `steps/` (1 493 with, 15 files) | 1 057 outside (1 351 with, 13 files); targets <= 1 150 (met after P05), <= 1 000 after P07 (missed by 57; accepted D76a) |
| LOC Node attempt supervision in `src/runner/dispatch` | 3 998 (5 files) | 3 830 |
| Doctor rows | 8 (7 pass, 1 fail) | 4 (`run-supervisor-route`, `runtime-socket-dir`, `run-attempts-stuck`, `run-supervisor-config`), all pass; `run-attempts-stuck` now warns for a removed release (D59 3b). Whole doctor: 51.2 s/150 rows (activated release) vs 87.7 s/147 rows (dev door, not like for like; plain release still lists the 8 old ids: 60.6 s/152) |
| Backlog rows | 2 proposed touch the layer (`p-d2dc4f2e`, `p-4bkfiw7d3j`), `p-e6425aa9` stale | not recorded as a count. Open: H-T4c row (closed later as `p-xbxdc6acdo` by T5, T5C section 4) and a row for the two accepted known limits (T4C section 4: "no row today") |
| Parallel paths per job | doors duplicated inside the crate (route flags vs gate `parse_args`, own `/proc` reads, two watch ticks, screen judging in Node `settle-attempt` plus settlement re-judge, `legacy-sweep`/`sweep`, `supervisor-heartbeat.json` writer with no reader, non-supervised branch, `http` adapter, dead result ladder) | acceptance greps return nothing for `fn parse_args|fn report|EXIT_*` in `gate.rs`, `"/proc` in the crate src, `supervisor-heartbeat`, `httpAdapter|'http'`, `legacy-sweep|sweepLegacy|abandon-legacy|legacy-attempts-stuck` (T4C section 1); `paneScreenOf` kept only for the person-facing capture. Windows warnings: msvc 2 (6 dead fields), darwin 1 before; after: reported clean by P06/P07 leads, not re-run by T4C |

#### (b) Measured net delta vs estimate (T4C section 3; `git show --numstat` per commit)

| Set | Node src | Rust src | Rust tests | Node tests | Estimate (Node / Rust / tests) |
|---|---|---|---|---|---|
| Phases P01-P07 (24 commits) | -1 090 | +213 | +404 | -1 589 | -618 / -55 / -523 |
| All T4 commits listed (34, incl. dead ladder `d333328ec`, pane idle `16150dca1`, before-plan work) | -1 103 | +242 | +503 | -1 633 | not planned for the extras |

Layer total of the phases: -2 062 code lines vs estimate -1 196; criterion 8 (<= 0) met. Node src beat the estimate by 472 (P05 deleted the `http` adapter, `executeExecutorCli` and `via: api` together); Rust src +268 over estimate (-55 planned, +213 actual); Rust tests +404 because red tests were added and not offset on the Rust side. Rustfmt commit excluded (+4 662/-1 016 in the crate). L5 repeats these figures.

#### (c) Findings, accepted / rejected (A4 sections 3-4, T4C)

Accepted (A4 section 3; severity, reuse door): RT4-01 High (gate reads outbox via `FsOutbox::newest_complete`), RT4-02 High (bounded no-follow claim read, SEAT file), B-1 High Windows (adopt ends a domain only when the bound gate is dead), B-2 Med (no GO written = `abandoned-not-started`), RT4-03, RT4-06, RT4-07 (497 files, delete side file), B-4, B-5 = RT4-04, S1 (supervisor asks the adapter once at a deadline stop, receipt carries the verdict, then delete Node screen judging), S2-S5/S12-S14 duplicates folded, S6 heartbeat deleted, S7 lazy step import, S9/S10, B-7, B-8-B-10, B-12 spec drift, speed B-6 (replace 57 s fixed loop and 30 s wait by existing clock-driven proof), test retirements. Three proofs reproduced (RT4-01, RT4-02 inferred chain, RT4-07, B-2), several inferred or Windows-only. Count: not recorded in A4/T4C.

Rejected or routed (A4 section 4): delete `legacy-sweep.mjs` now (RT4-05 reproduced the window, became Q2 and then D59 2a); delete `cliSpawnAdapter` (S17: it supervises short calls, T5 decides; later T5 closed H-T4e without change); A4 one Node process for all steps (speed: host share about 13 ms, cost is addon hash); delete `run-lock.mjs` holder logic (S16: it is Execution Core's ledger). Routed: speed B-1 (addon hash per process) to T9/Packaging H13 and TEST; speed B-2 (probe cache miss in tests) to TEST; correctness B-6 (`cleanup-trust` lost update) to T5.

#### (d) Owner-approved exceptions to "zero Node deciding logic in T0-T4"

- Worker session server stays in terminal-control: "T2's exception stands" (A4 section 2, "all seats agree"; supervisor lives for one attempt, server for many). Owner approval is the approval of shapes D59 (1a).
- Windows hold transport `src/holder-lock/hold-transport.mjs` stays (A4 section 2: proves the lease is held when the domain is recorded, also serves `borrow` and `clear-domain`); D76(g) "Windows support for `fgos-git` and the Windows hold transport stays".
- Node step modules (`settle-attempt`, `finalize-home`, `cleanup-trust`) remain Node under the `attempt-step` route: A4 says porting settlement is T5; T4 takes only the lazy import. Explicit owner exception naming this: not recorded; covered only by D59 (1a) approving the target shapes.
- Not an authority exception but a size one: Node `src/run-supervisor` 1 057 vs <= 1 000 accepted, D76(a).
- Accepted deviation (T4C section 7, OQ-2 a): `attempt-intent.json` is replaced on each launch and removed by the controller, not written once.

#### (e) Refuted hypotheses

- "Delete `legacy-sweep.mjs` now": refuted by RT4-05 (a controller dying between `run.json: running` and the envelope leaves `legacy-run`, only the sweep settles it); resolved by adopt closing it (D59 2a).
- "R5: Rust `attempt-step` already exists so step cost is Rust": refuted by T4B section 5/A4 section 2: the route only starts a Node child; supervisor's own share about 13 ms, the cost is Node start plus whole-addon hashing in every step process.
- "Two Node children per seat" (TEST figure): not re-derived, T4B says so.
- "One Node process for all steps of a pass" (red-team A4): rejected on speed's measurement.
- `p-6f17c807` (pane agent starts in runDir): closed, not reproduced (T4B section 7).
- Baseline suspicion of a test leak (`run-tests: ERROR ... leaked`): attributed to other sessions' real runs in the shared checkout, not proven per file (T4B section 2.2; T4C section 2 again names only `.fgos/runtime/mailbox/mail-taken`).
- Unverified at close: H-T4a/H-T4b board lines (T4C section 5).

#### (f) Proposed additions and owner picks (D59, D60, D76)

T4 has no "proposed additions" table in A4 or T4C. Owner questions and answers: Q1 "1a 2a 3b 4a 5a 6a" (D59: shapes approved; adopt closes not-started; `run-attempts-stuck` warns; non-supervised branch and `http` adapter deleted; idle sampling only when it can precede the soft deadline; self-land plus guide); Q2 (a) side files of closed attempts deleted on fg-server2; OQ-1 (a), OQ-2 (a), `cargo fmt` (a) (D60, one format-only commit `c37d76811`, then `cargo fmt --check` in every lane's land gate); D58 pane idle counts letters only (`16150dca1`); D76(a) cut Rust test time only. Open at close (T4C section 8): H-T4g spec/reading-map/backlog lines wait for DOC Land; 1 057 vs 1 000 (later accepted); Rust test time (later cut to 46.7 s); P06 kept direct row 8; hand-offs H-T4a to H-T4f recorded in T4C section 5, receivers' confirmations not verified.

---

### T5: Execution Core, Dispatch and Confinement, Seat Binding, Run Result

Closed: T5C (main `57149ebe9`, measured 2026-11-06 20:07-20:35) plus addenda: P14 (D69) 2026-11-06 21:5x and P04 half B landed 2026-11-08 (`bbbf52f00..27759bb01`); "T5 is closed 2026-11-08: every phase row of the sub-plan is landed".

#### (a) Before / after (T5C section 2; before = T5B `af19e6de6`; after = `57149ebe9` unless marked P14)

| Row | Before | After |
|---|---|---|
| Routes p50/p95 (activated release, 30 runs, load 1.1-2.0) | `seat-binding ladder` 1.7/4.6 ms; `bind` 2.1/4.5; `dispatch --help` 123/134; `dispatch reconcile plan` 128/133; `inspect --provider-capacity` 155/171; `show-run` 211/221; `decide claude` 232/260; `explain --for implementation` 247/268; `dispatch inspect --cwd .` 4 972/5 030 (912 run dirs). Dev door `dispatch --help` 8 917 ms. `fgos run`/`runUnit`: not measured | `dispatch inspect --cwd .` 3 795 ms p50 of 6 runs (3 749-3 971), 526 run dirs, load 1.1; `dispatch --help` 129 ms (3 runs); other routes not re-measured; launch handover (from today's attempt records, no fresh run): direct 0.020-0.512 s (7), terminal 0.445-1.123 s (23). Seat host spawns per doctor 559 to 183 |
| Tests and wall time (Node layer set) | 134 files, 2 435 tests, 0 fail; batch 144.2 s test / 162.7 s wall (load 0.6-8.5); per-file sum 669 s | 109 files, 1 891 tests, 0 fail, 0 `run-tests: ERROR`; batch 163.8 s test / 165.4 s wall (load 4.6-5.4); per-file sum 592.6 s test / 818 s wall at load 1.4-35.6 (not comparable). File sets differ (110 vs 109 by the baseline name rule). `run.test.mjs` 87 tests 139.6 s to 78 tests 156.3 s (load 3.6); failover file 30 tests 123.6 s to 6 tests 20.6 s; `bind.test.mjs` 64 tests to 34 tests 0.8 s. Rust: seat-binding 13, run-result 30 tests, 6.5 s both warm. P14: `run.test.mjs` split in four files (78 tests unchanged); post-P14 timings: not recorded |
| LOC Node, execution | `src/runner/execution` 32 files 7 670; `run.mjs` 1 629 | 33 files 7 590; `run.mjs` 975; P14: 6 453 (budget 7 000 met) |
| LOC Node, dispatch | outside `confinement/` 54 files 21 133; `assignment-runner.mjs` 2 202; `executeAssignment` 1 135; `config.mjs` 2 105; `run-result.mjs` 1 396; `confinement/` 10 files 6 455; `bind.mjs` 563; `dispatch.mjs` 69 | 44 files 16 937; 1 472; 277; 861; 1 110; 10 files 5 972 (budget 5 950 missed by 22 at close); 590 (budget 520 missed); `dispatch.mjs` 10 lines. P14 (addendum): `confinement/` 5 642, `bind.mjs` 514, `authority.mjs` 1 314 to 984, no function over 300 lines |
| LOC Rust | seat-binding src 2 551, tests 170, golden 82 cases; run-result src 1 139, tests 1 514 | seat-binding src 2 551, tests 170, golden 96 cases; run-result src 1 073, tests 1 514 |
| Functions over 300 lines | 14 (largest `executeAssignment` 1 135, `runUnitBody` 1 018) of 1 795 scanned | 7 of 1 706 at close; 0 after P14 |
| Doctor rows | layer's rows by id pattern 42 (3 fail); whole doctor 147 rows, 9 fail, 89 s (dev door) | 32 (30 pass; 2 fail, machine state); whole: activated release 134 rows, 7 fail, 58.2 s; dev door 133 rows, 95.5 s. Per-row time: not recorded this time |
| Backlog rows | 16 open rows touch the layer | not recorded as a count. Closed or created in T5C section 4: `p-xbxdc6acdo` (H-T4c, created and closed), `p-a189ff31` closed, `p-3e6b1a52` closed, `p-8da4b370` partly closed, `p-d2dc4f2e` annotated; new `p-i2nsdjgwuz`, `p-tslryr3buq` |
| Parallel paths per job | outcome derivation twice (Node `run-result.mjs` and Rust `derive_outcome`); shadow binder; two quota-wording copies plus text judge; ten hand-rolled temp-and-rename sites; `executeThroughConfinement` and `finalizeConfinementResources` dead doors (503 lines), 2 dead modules (227), 29 dead exports; `dispatch.claim` driver actions with no writer; seat tests restating the golden set (about 190 Node tests) | derivation once in Rust through the addon (V3 only writer; deviation: `deriveEvidenceFloor` stays Node); acceptance greps: no `runner/dispatch/` import from `src/native|state|holder-lock`, only two steps files import it in `src/run-supervisor`; `herdr-deadlines.mjs` gone; barrel `dispatch.mjs` is a 10-line `decide` entry; text judge removed (P07 `4597694c0`); seat decisions owned by the golden table (82 to 96 cases). Hand-rolled atomic writes, shadow binder deletion (batch C, T5C section 2 row), `dispatch.claim` deletion: stated as accepted in A5 and visible in the Received table; per-site confirmation: not recorded in T5C |

#### (b) Measured net delta vs estimate (T5C section 3)

| Set | Node src | Rust src | Rust tests | Node tests | Estimate |
|---|---|---|---|---|---|
| Phases P02-P12 with fixes (49 commits) | -1 680 | +101 | +267 | -2 196 | plan budget Node <= -1 300, Rust <= +150, tests <= -1 000 |
| Whole HARDEN T5 (70 commits, incl. batches A-D, R-1, B-3) | -3 375 | +101 | +267 | -3 960 | A5: Node about -2 450 to -2 850, Rust 0, tests about -1 800 to -2 100 |

Net (T5C section 8, criterion 8): Node -3 375 and tests -3 693 met; Rust +101 inside the plan's <= +150 but not <= 0. "Other" +1 429 (golden cases +547, run-outcome vectors +390, config fixtures +431) is not counted by the plan. Over their estimates: P02 (analyzer +187), P03 (two security review rounds), P05 (D66), P06, P10 (Node -16 vs -250). Beat: P11, P09, P07 tests. Budget misses at close (and closed by P14, D69): `src/runner/execution` 7 590 vs 7 000; `confinement/` 5 972 vs 5 950; `bind.mjs` 590 vs 520; seven functions over 300 lines. L5 repeats these figures.

#### (c) Findings, accepted / rejected (A5 sections 3-4; T5C)

Accepted (A5 section 3, representative): R-1 Critical (write-back authority, fixed before plan: `harden/fix-writeback-authority`); B-2 High (`unit-run-history` defaults an uninterpretable result to `ok`/`pass`, now `execution-failure`); R-2 = B-1 = H-T4c High (297 of 400 seeds lost, closed by D66); R-3 High (project config can switch confinement off, `x-fgos-scope: both`); R-5 High (confined read of login stores, D61 3b masks); S-1 High (460 discarded spawns, 559 to 183 measured); S-2 High (inspect re-reads, in-process cut); dead doors/modules/exports; the two giant functions; R-4 (FIFO reads through `readAgentFileSync`); B-5..B-14; shadow binder deletion; ten atomic-write sites; type rules to the schema; text judge removal; `lock-wait.mjs`; seat tests to facade wiring (-700).

Rejected or held (A5 section 4): outcome derivation to Rust through the addon (simplicity option A) rejected as a fix, listed as addition A5, later taken by owner D62; delete `herdrSpawnAdapter` outright (name and `locus` read; registration kept, body shrinks); `legacyPersonaProjection` delete (`p-3e6b1a52`) held, may serve old records `legacy-seat-read.mjs` keeps (later closed in T5C); routed: S-3 and S-4 test items to TEST, S-6 refresh-ahead to backlog (unreproduced), `.fgos/assignments` retention to Workflow backlog. Layer total <= 0 in every answer combination (A5 section 5).

Count of findings: not recorded. T5C section 9 lists accepted deviations by phase (P02-P12), all accepted by the coordinator.

#### (d) Owner-approved exceptions to "zero Node deciding logic in T0-T4"

Not applicable to T5 itself (outside T0-T4), but the T0-T4 residues T5 inherited: H-T4c/d/e/f all answered (T5C section 6). Exceptions the plan recorded for T5: D66 supersedes D63: fgOS still writes `~/.claude.json` (add-only, with the new `agent-trust-store` lock beyond the wording of D66; T5C acceptance criterion 4 names it). `deriveEvidenceFloor` stays in Node (no Rust twin, one consumer; P08 deviation 1). `src/runner/dispatch.mjs` kept as a documented 10-line alias (P11 deviation 1). `herdrSpawnAdapter` kept as a name-registered refusal.

#### (e) Refuted hypotheses

- A5 verdict 1: "No seat found a fault in the Rust crates"; confirmed by measurement (seat-binding and run-result tests 0.04 s, T5B section 2.1).
- Baseline's "slow tests are sleeps" refuted: the slow files are real seat launches (about 4 s each), top 5 files 58 percent of summed time (T5B).
- Baseline `p-a189ff31` (confined worker reads gateway token): "likely fixed in effect" (token moved to `private/gateway-token`) then proven by a confined read and closed (T5C section 4).
- Decision 63's premise (no claude layout in the renewal door, so one path for claude panes): wrong; superseded by D66 (T5C section 7).
- P04 half B: "executor values can become global-only now": waited for the owner-made config move (D64), landed 2026-11-08.
- Test-time result: `run.test.mjs` got slower per test (139.6 s to 156.3 s at load 3.6), cause not measured (T5C section 2).
- `spawn-worker.test.mjs` flake candidate (1 of 18): which test failed was not captured (T5B).
- Not proven: T5C section 8 criterion 7 "land gate green" rests on phase reports; not re-run in the closing report.

#### (f) Proposed additions and owner picks (A5 section 4; D61, D62, D64, D66, D69)

| Item | Owner answer |
|---|---|
| A1 `bind-many` route | not taken (D62) |
| A2 injectable dispatch port for `runRole` | not taken (D62) |
| A3 architecture guard: lower layers never import `src/runner/dispatch` | taken (D62), built in P02 |
| A4 no-undef pass in the gate | taken (D62), P02 |
| A5 Run Result derivation in Rust through the addon | taken (D62), P08; Node -180 est |
| A6 network namespace unshare for read-only policies | recorded as backlog `p-x4qeqdvfl5`, outside T5 (D62) |
| A7 host-only record beside each private home | taken (D62), P03 |
| A8 probe gate before write-back | taken (D62), P03 |
| Q1 claude trust store (D61 1a, then D63, then D66 "ok" on (c)) | landed (P05) |
| Q2 project may only tighten confinement; command/args global-only (D61 2b; D64 UQ-1 a) | half A landed; half B landed 2026-11-08 |
| Q3 masks hide every login store (D61 3b) | landed (P03) |
| Q4 shapes (D62 "a") | approved |
| Q5 self-land on fg-server2, owner machine by guide (D61 5a) | followed |
| D65 doctor roles (1a 2b 3a), D67 T5 first then T6/T7, D68 one-word answers (c) | outside T5 or landed (D68 P09) |
| D69 "1b, 2a" P14 cut and config move | P14 landed; config move done on fg-server2, fg-server, design-lap |

Open items at close (T5C section 10): P04 half B (landed later), seat-start follow-ups (`harden/t5-seat-start`: omp setup-wizard classifier, `omp-natives-present` row, `ForegroundNotAgent` instrumentation, `workflow resume` rerun; owner HARDEN), budgets not met (closed by P14), flaky tests during lands (mailbox-live-confined, `triggers.test.mjs`, account-lock tests under load, `gate_portable.rs:37`), pane-renewed xai/claude logins need hand recovery (accepted D76(e)), CFG follow-up project-settable `launchConfinement.contract`/`controls`/`grants` (D76(f) HARDEN reviews), read-only `bin/install/packages` bind-back note, stale comment `runtime-inspection.mjs:118-131`. Hand-offs H-T5a (test split; done by HARDEN in P14), H-T5c (`--wait` on `take`/`pick`, Work, receiver unconfirmed), H-T5d, H-T5e, H-T5f.

---

### Cross-layer cautions for the root report

- The counting rule differs by report (L5 header): T4 counts Rust inline tests per its own table; T5 counts inline `#[cfg(test)]` as Rust src; T3 has no counted delta. Do not sum T3 into any total; say "not recorded".
- T4 raw crate totals include the workspace rustfmt commit; use the T4C per-commit numstat table as authority.
- Load differed between baseline and after in several rows (T4C node batch, T5C per-file loop at load up to 35.6); the closing reports say these are not like for like.
- Whole-suite wall time versus phase 00 is a root-level number and is not in any of these files.

## 5. Verification done by the lead on main `0981437d2`

Source checks, no tests run. The `EchoProvider` operation descriptor is still in the production catalog (`packages/host-runtime/rust/src/catalog.rs:117-121`); `RouterPolicy` is still an empty struct (`operation_provider_router.rs:29`); the admission gate still carries its own "tautological" known-limitation comment (`authority_gate.rs`, `allow_catalog_policies`). A `fgos doctor --json` run at 13:48 failed its Node rows bridge after 30 s on this machine under load from other lanes; it says nothing about the layers and was not repeated.

## 6. Handoff table: T6, T7, T8, T9, Packaging-Distribution

Sources: `plans/261021-1118-harden-low-layers-bottom-up/{plan.md,phase-07-closing-and-handoff.md}`, the five closing reports, `plans/reports/decision-261118-1308-harden-owner-questions.md`, board `plan.md` WORK row, `docs/backlog.md`, and rg/git checks on main `0981437d2` (each marked with file:line). "Last measurement SHA" is the main SHA the layer's own closing report measured, not a fresh run; no new measurement was taken for this draft.

### 1. Table

| Row | Layer status and closing report | Items found but not owned (still open, or done and unconfirmed) | Open owner decisions touching it | Backlog rows | Last measurement (main SHA) |
|---|---|---|---|---|---|
| **T6 Workflow** (guide + case) | Closed. Closing report `plans/reports/closing-261108-1838-harden-t6-workflow.md` (board log.md:490 says closed 2026-11-08 21:58, final wave P16-P20 on `21e52e58c`). Phase 20 step 2 settled 2026-11-18: owner chose A, no plain-run retention rule (evidence `plans/reports/decision-261118-1308-harden-owner-questions.md`, lead-supplied). Phase 17 (settle wins) done in `6b45c34c5` although its phase file front matter still says `pending` (decision-261118:5). | (a) Run-output size cap for the Execution Core (arbitration addition 5, not taken, decision 71 6a): T5 owns it, not confirmed. (b) Ledger and admission size pass waits for `wf-coding-cutover` (closing idea 3). (c) Size gap accepted: Node +44, tests +695 at close (decision 73, board log.md:490). (d) Closing ideas 9-11 (one workflow test fixture, parallel order-guard presets, launch-failure test hook): not verified as done or declined. | Decision 73 accepted the size gap. Plain-run retention: A chosen 2026-11-18, so the measurement is still owed (`p-tslryr3buq` clause: nobody has run the measure command on owner machine or fg-server, per decision-261118:21; fg-server2 reading 234 dirs / 196 MB, informational). Owner-machine steps: `capabilities.code:implement.verify` before `fgos workflow gate`. | `p-tslryr3buq` (plain-run dirs never removed; per option A the measurement is recorded and the row closed: not verified that it was closed), `p-d2dc4f2e` (herdr seat never starts; stays open per T6 closing) | `1ff899aac` plus close commit, release `6f1fd31f3850…`; final wave `21e52e58c` (closing report; fg-server2) |
| **T7 Work Lifecycle** (WORK lane) | **Not hardened, no baseline measured.** Decision 78 (2026-11-09 10:08): council on the Work layer first; "Work stays last", opens only after T8 and the non-Work arms of T9. T8 and T9 are closed, but no T7 council, baseline or report exists (`ls plans/reports` finds none; no HARDEN T7 plan dir). The WORK lane (Event Store cutover ES 09-11) closed 2026-10-25 (board plan.md WORK row: "done 2026-10-25, lane đóng"; lead role now `lead:ES`, `claude-ursc@fg-server2`); the upper Work layer (dashboard, human communication, requirements, progress) is "đợt sau, chưa mở". | Hand-offs to the held WORK lane: H22 (write-once self record for the hot mutex), H23 (`finally` in `withStateTx`, `hot-lock.mjs:227-332`, needs three-line correction for the settle outcome; WORK recorded 10-22 18:40, but its rebase is superseded by the cutover close: not verified that it landed). Authority audit items listed as "Work later" (T9 plan lines 75-76): AU-26 gate-bypass level read twice (Rust gate door), AU-27 status and stage vocabularies (Work core, domain registries). T9 left the Work arms in `bin/fgos.mjs` (`p-xpc327btjz`). T8 left `loadDomainsFromDisk` walk in `src/state/domain-registry.mjs` (`p-bxahsop7em`) and the Work domain walk (decision 85 Q2: "Work batch"). | Decision 78 frame (storage core plus human touch points: lifecycle, gate/questions, artifacts; one core, apps per domain) is the recorded input only. Whether to open the T7 council now: decided 2026-11-18 (owner answer relayed by `forgent-c0`), option B: Work stays deferred until after the packaging release. Decision 87 (2026-11-12) deferred "the Work batch" until after the packaging and unit-run-result release; that release status: not verified. | `p-xpc327btjz`, `p-bxahsop7em`, `p-wgbzcazoak` (fold `fgos ask`, Workflow gates and five-part checker into the owner-question store, "when the Work layer resumes"), `p-g7yn3j7q4x` (WORK and COOK), `p-djznnfrbbe`, `p-shtdt7wpfh`, `p-lwdpukgwhd`, `p-uz3hc7gz37`, `p-zpgzqdoy4z` (coding-workflow guard rows, from the backlog grep: lane ownership of each not verified) | none (never measured at layer level) |
| **T8 Skill/Domain** | Closed. `plans/reports/closing-261109-1752-harden-t8-skill-domain.md`. Verdict: size met (Node -979, tests -2438), three budgets missed (`project-agents.mjs` 286 vs 275, citation guard 508 vs 503, quiet-load test time): accepted by owner, decision 85 Q4. Closing gap AU-22 (one domain authority) closed by T9 P25 `47b721427` / `86647c9b9` (decision-261118:7); AU-21 closed by `75978e0fa`. | Backlog by owner: `p-bxahsop7em` (WORK), `p-vcoaluq6ix` and `p-ojh4dcf6f2` (OPC), `p-tgqxcemygh` (Packaging), `p-bv4xcs2xdl` (doctor wording, HARDEN), `p-g7yn3j7q4x` (WORK and COOK). Cross-lane steps the T8 report marks unconfirmed: DOC was not told of three doc edits; no OPC review line for the P09 and P12 census diffs. Release activation and smoke on fg-server2/forgentX/fg-server by guide: not verified. Pre-existing red: `active-release-drift-check` fixture without compiled `fgctl` (needs an owner). New: `p-pgmxt7n7hx` (domain registry does not list existing domains, unsure classification defaults to `coding`, found 2026-11-17). | None open from HARDEN's list (decision 79 Q1-Q8, 85 Q4 all answered). Decision 79 Q4: domain doctrine payload-only, no project extension. | `p-bxahsop7em`, `p-vcoaluq6ix`, `p-ojh4dcf6f2`, `p-tgqxcemygh`, `p-bv4xcs2xdl`, `p-g7yn3j7q4x`, `p-pgmxt7n7hx` (existence of each id in `docs/backlog.md` not individually verified except `p-bxahsop7em` line 202 and `p-pgmxt7n7hx` line 10) | `666e9737b` plus close commit (2026-11-09, fg-server2) |
| **T9 Host & Surface** | Closed 2026-11-13/14, DONE_WITH_CONCERNS. `plans/reports/closing-261113-1947-harden-t9-host-surface.md`. Head `2788a0d0f`, measured 2026-11-14 on a release build staged from the tree (not an installed release; load 3-4 vs 25-34 at baseline). Misses: entry still loads 211 modules (target cut 10 ms), `fgos doctor --json` 14 990 ms vs 12 s target, net size positive (Node +2136, Rust +617, tests +3026 over 84 commits). | See section 2 for every old phase-07 input. From the closing report section 5: `usage` of the attempt still `null`; Work arms and Work REST/MCP argv; `return` near-copies; `src/verbs/state/edit.mjs:41,48` node hint; seat-binding doctor rows spawn host 98 and 84 times; `lock-status` 349 ms; `getMainFgosDir` five Git processes; legacy ledger/seat readers deleted one release after landing (`p-7y75kf54rh`); `unit-summary` carries three Unit facts in v3 (another lane); owner/fg-server steps for the claude seat store and packaging release; `instruction-registry` domain walk keeps the project root. DOC hand-off: `docs/explanation/fgos-preflight-verb.md` is now a retired page; the board names owner `forgentx-5f` and the T9 report says no such session runs. | T9 misses (211 modules, doctor 15 s, Node +550 over estimate): ACCEPTED 2026-11-18 (owner answer relayed by `forgent-c0`), T9 closes. Arbitration section 5 owner ideas: untouched, still "for the owner to choose" (section 4). Q3 (decision 81): KEEP `external_process`; wire-up must run provider processes confined. | `p-xpc327btjz`, `p-eiwz6yypdg`, `p-7kxvzimrbp`, `p-s5mliyp335`, `p-7y75kf54rh`, `p-rypvkc3kai` (herdr resolves shim path itself), `p-265qfonr5w` (recursion-guard drop in six places) | `2788a0d0f` (closing report, staged release build, 2026-11-14) |
| **Packaging-Distribution** (`fgctl`, `src/setup`) | Closed 2026-11-12. `plans/reports/closing-261112-1817-harden-packaging-distribution.md`. Measured on main `e182dec72`, release assets tag `v0.2.0-p13final`, fg-server2 scratch HOME. MUST fails 42 to 14 open; partial 31 to 18. | 14 open MUST fails with closers: UX-01 (arm64/macOS), CMD-08 (`fgos` exit 4 vs 2), DOC-02 (doctor exit 0 whatever), CMD-07 (flag parity), UX-14 (`config edit`), CFG-01/03 (XDG, `paths --json`), UPD-01/PRN-04 residual (fgctl refresh marker), INS-15 (`install.sh --uninstall`), INS-04 residual, ONB-09/TST-04, RS-03 (no LTO, measured and not taken). "Open items for T9" list: see section 3. Known red then: V7n addendum test; `check-decision-citation-drift` five findings in document-identity spec (Documentation lane). Findings: `fgctl` refuses `v0.2.0-rc.5` (`git-addon-missing`); `TMPDIR` under `/dev/shm` fails `confinement-probe-freshness`; `omp` `PI_CONFIG_DIR` relative path is layout-dependent. | Q-A (usage exit 4 vs 2) and Q-B (doctor exit code) are settled in `docs/platform/packaging-distribution/spec.md:197` (exit 4 kept; doctor 0, 1 with `--strict`), closed 2026-11-18; owner ideas table (about 16 rows) "nothing built unless the owner picks it"; decision 80 Q5 (no arm64 until a real machine needs it). Open owner decision in this plan: H11 canonical-JSON pair (see section 3). | `p-pvs4go2qei`, `p-yfpixqfmdq`, `p-xagoeec2i4`, `p-g3erqtmmib`, `p-xtawpgzvjy`, `p-wn7ss4iyab`, `p-ls4tuvflrd`, `p-qqcf5lqqtn`, `p-wzpwaigt6j` (`fgos version` spawns Git, found later), `p-hrvbtwxhpi` (shell-profile line into a temp dir, 2026-11-17) | `e182dec72` (closing report) |

### 2. Old phase-07 inputs for T9: verified one by one (main `0981437d2`)

| Input | Verdict | Evidence |
|---|---|---|
| **H13** each CLI call verifies the release once | **Done in part, cache declined.** Host no longer self-hashes the running file nor re-reads the addon; 25 MB still hashed, about 16-32 ms host overhead; no cross-process record, by owner decision 81 Q4. | `plans/reports/lead-261109-1820-harden-t9-p12-host-verify.md:7,18`; `apps/fgos/src/legacy_exec.rs:174` (`verify_release_files_except_running`); closing report section 2.4, 6. Node loader addon hash: not verified. TEST (`forgent-f8`) is owed a ping from whoever lands H13 (ledger H3): **no confirmation found, open**. |
| **H14** retire `npm install -g github:vantt/forgent` | **Done.** | `README.md:112` ("is retired"); `docs/platform/packaging-distribution/spec.md:49,91`; ledger row H14 says closed 2026-11-12 (packaging P07). `docs/specs/distribution.md` no longer exists. Whether to block the channel: refused by the host, not blocked at npm level. |
| **H17** two host-bin resolvers, host `.fgos` walk | **Done for the resolver; walk not fully verified; ledger row not closed.** | `src/util/host-bin.mjs:17-24` is one call into `resolveActiveHostBin`, doc comment "Never another checkout's host"; P02 report `lead-261109-1839-harden-t9-p02-root-door.md:15,38` (cross-checkout fallback removed, tests re-fixtured). Still two files (`host-bin.mjs`, `host-bin-path.mjs`) but one authority. Old `main.rs:123-143` walk no longer at that location (`rg ancestor apps/fgos/src/main.rs`: no hit); the invocation-root door P02 replaces it (not independently verified). |
| **H24** gateway `node bin/fgos.mjs` branch | **Done.** | `apps/fgos-gateway/src/gateway.rs:365-369` uses `herdr_fgos_common::fgos::fgos_command`; `:1403-1404` "no usable shim is a 503 naming `fgctl init`, never a node fallback"; P13 report `lead-261109-1839-harden-t9-p13-command-builder.md:16`; `build_fgos_command` has no remaining hit. |
| **H9a** `providers/external_process/**` delete candidate | **Declined by owner, still present.** | Decision 81 Q3: «giữ, cái này quan trọng» (plugin extension point, plan.md decision 81). Directory still at `packages/host-runtime/rust/src/providers/external_process`, tests `packages/host-runtime/rust/tests/external_process_*.rs`. Open condition: provider processes must run confined when wired. |
| **H9b** test `EchoProvider` / `test.fixture.echo` in production host | **Partly done.** | `apps/fgos/src/main.rs`: no `EchoProvider` reference (rg). Still in the crate: descriptor `packages/host-runtime/rust/src/catalog.rs:117-125` (and `:450` asserts it is in the catalog), `EchoProvider` in `providers/builtin.rs`, tests in `invocation_service.rs:947+`. So the fixture operation still ships in the production catalog: **open**. |
| **H9c** tautological admission gate | **Still open.** | `packages/host-runtime/rust/src/authority_gate.rs:~131-146` still carries the "Known limitation ... tautological" comment; `invocation_service.rs:393` still builds `CallerAdmission::allow_catalog_policies(snapshot.catalog())`. Not mentioned in the T9 closing report. |
| **H9d** empty `RouterPolicy` | **Still open.** | `packages/host-runtime/rust/src/operation_provider_router.rs:29` `pub struct RouterPolicy;` ("empty placeholder ... never referenced by selection logic"). |
| **H9e** `command-routes-drift` spawn on every doctor run | **Gone by deletion, not by in-process call.** | No `command-routes-drift` string left in `src`, `scripts`, `apps`; row removed in the readiness-only doctor work (`ff6947580`, `f87c02e28`; the 21 repo rows moved to `npm test`, decision 65). `checkCommandRoutes` remains a script function (`scripts/export-command-selectors.mjs:404,484`). Condition now owned by tests: not individually verified. |
| **H10** doctor per-row timing in `fgos doctor --json` (owner pick 2b) | **Not found, open.** | No `elapsedMs`, `durationMs` or timing field in `src/setup`, `apps/fgos/src/wiring/doctor`, or the contracts (rg). T9 closing report does not list it. Doctor still 15 s vs 12 s target, so the need remains. |
| **H11** release-manifest canonical-JSON producer/verifier pair | **Declined with a comment, ledger not closed.** | `scripts/build-rust-distribution.mjs:39` "Not the door's canonicalJson: this producer digests the manifest before any addon exists to load"; Rust twin `packages/distribution/rust/src/verify.rs:46`. Two implementations remain by packaging decision. |

### 3. Packaging "Open items for T9": current state

| Item | State on main `0981437d2` |
|---|---|
| Host literal `exit(4)` sites read the exit table | Done: no `exit(4)` in `apps/fgos/src`; commit `304321d5f` (one versioned table read by Node and host). |
| `renderGuide` / `renderFlagLines` out of `bin/fgos.mjs` | Done: no definition left in `bin` or `src` by rg (new location not named; not verified). |
| Node `version` arm and registry entry | **Open:** `src/cli/command-registry.mjs:140` still has `name: 'version'`. |
| First-run text in three places | **Open / not verified:** `apps/fgos/src/main.rs` and `apps/fgctl/src/help.rs` still mention first-run; single source not confirmed. |
| `findExecutableOnPath` twice plus four PATH walkers | **Open / not verified:** one Node definition at `src/runner/paths.mjs:173`; the Rust copy and other walkers not checked. |
| `is_store_entry_name` in `store.rs` | **Open:** no hit in `packages/distribution`. |
| Did-you-mean third copy `p-xtawpgzvjy` | **Open:** backlog row at `docs/backlog.md:105`. |
| Global agent wiring reverse ledger | Declined (decision 80 Q2 (a)). |
| Doctor row catalog held twice (`p-pvs4go2qei`) | Open, Documentation lane. |

### 4. Hand-off ledger items without receiver confirmation (treat as open)

Ledger = `plan.md` "Hand-off ledger". Rows whose last cell shows no receiver confirmation, restricted to those above T5 or touching the rows above:

- **H3** (TEST): "whoever lands H13 owes TEST a ping": no ping recorded.
- **H9, H10, H11, H13, H17, H24** (HARDEN phase 07, "recorded here"): self-recorded only; per section 2, H10 and H9b/c/d are unfinished, H11 declined in code, H13/H17/H24 done in code but the ledger rows carry no closure line.
- **H12** (DOC): "waiting for `forgentx-5f` to record it in plan 260925"; T9 closing report says no such session runs. Open.
- **H19** (SEAT then T1 phase 6) and **H20** (T5 phase 06): no confirmation text in the row. Not above T5 but unconfirmed.
- **H22** (WORK, held lane): "recorded in its board row" only; open until T7.
- **H23** (WORK): recorded by WORK 10-22 18:40 on a branch; whether it landed after the cutover: not verified.
- **H15** (GIT reviewer reassignment) recorded 10-22; not above T5.

Closed with evidence in the ledger (not re-listed as open): H1, H2/H3 recorded, H4-H8, H14, H16, H21, H27, H28, H30-H33, and H18, H25, H26, H29 recorded by their receivers.

### 5. Caveats

- Whole-suite re-measure for every row above: `npm test` at main `a7719c357` on 2026-11-18, 13 min 51 s, 8 480 tests, 8 444 pass, 8 fail (6 pass alone under no load, 2 reproduce: stale `workflow start --plan` test and stale instruction projections), shared machine load 5 to 17. Detail in section 2. It is the first whole-suite wall time of record; the rows keep their own last-measurement SHAs.

- T6 closing date: the lead says 2026-11-18; the report and board log say 2026-11-08 21:58 for the close with phase 20 unresolved until the 2026-11-18 owner answer. Both stated above.
- I did not run tests, doctor, or timing; all "now" claims are source greps and git log at `0981437d2`.
- Backlog row ids come from `docs/backlog.md` grep and the closing reports; only the ones with line numbers above were seen in the file.


## 7. Open owner decisions and unresolved questions

1. The whole-suite wall time was measured under shared load (section 2); a quiet-machine re-run is optional. Two reds on main need an owner: the stale `workflow start --plan` test (metrics lane) and the instruction projections.
2. DECIDED 2026-11-18 (owner answer relayed by `forgent-c0`, not heard directly by the lead): the T9 misses (211 modules at entry, doctor 15 s against 12 s, Node +550 over estimate) are accepted and T9 closes.
3. DECIDED AND DONE 2026-11-18 (owner chose 1, 2 and 4; plan `plans/261118-1818-harden-t9-leftovers`): doctor row timing (`8a754445e`), echo fixture out of the production catalog (`817d322f6`), empty `RouterPolicy` deleted (`d9fedea48`); the admission gate stays deferred (backlog p-ltwb2h3k6s). Current state: of the four T9 inputs, three are built and on main (listed above) and the fourth, the tautological admission gate, is deliberately deferred and tracked as backlog `p-ltwb2h3k6s` (`docs/backlog.md`); nothing in this list is waiting for an owner pick.
4. DECIDED 2026-11-18 (same relay): option B, Work stays deferred until after the packaging release; no T7 council now.
5. CLOSED: Packaging Q-A and Q-B are already settled in `docs/platform/packaging-distribution/spec.md:197` (checked by the lead): `fgos` keeps exit 4 for usage errors, `fgos doctor` exits 0 and 1 with `--strict`. `fgctl` follows the packaging standard.
6. Ledger rows H3, H9 to H13, H17, H22, H23, H24 carry no receiver closure line, and H12 names a session (`forgentx-5f`) that does not run.
7. The T6 close date is 2026-11-08 in the T6 closing report and board; 2026-11-18 is the owner's answer on phase 20 step 2 (option A, no plain-run retention rule). The stale front matter of the T6 phase files (phase 17 among them) was closed against its commits in the status pass of backlog `p-nnidbiq3l2`.
8. T0 named exceptions, accept/reject reasons for T0 and T1, and T1 Node/test estimates sit in `docs/platform/component-boundary.md` and the arbitration reports, which this report did not read.
9. The S6a planner and the sibling plan-row edits are not decided; they are not part of phase 07.
