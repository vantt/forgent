# HARDEN T4 council, seat "simplicity" (Run Supervisor + Launch gate)

HEAD `a1e903f39` (main), fg-server2, 2026-11-03. Lens: one door, one authority, Node/Rust duplicates, dead and legacy paths, layering, contract clarity, smallest shape that keeps every behaviour (design principles 1, 2, 6, 7, 8; RUL104). Read-only: no source, spec, test or config edited. Every size is an estimate from the lines named; re-measure before cutting.

What I ran: `sed`/`rg`/`wc` over every file in scope (Rust crate src and test titles, `src/run-supervisor/**`, the supervisor parts of `assignment-runner.mjs`, `run-lock.mjs`, `transport.mjs`, `terminal-slot.mjs`, `herdr-round.mjs`, `apps/fgos/src/main.rs:203-209`, `src/setup/run-supervisor-checks.mjs`, registrations 2059-2100). Two measurements: module load time of each step module (`node -e "await import(...)"`, 3 runs each) and the four `--probe` routes of the activated host (0.01-0.02 s each). No cargo build, no test run, so no private cargo dir was created.

## Headline

1. Provider-stop wording is judged in three places for one attempt: the Rust terminal adapter names an outcome, `settle-attempt.mjs:105-133` re-reads the pane and re-judges it with its own six patterns, and `settlement.mjs:633-652` re-judges the same text (screen glued into `stderrText` at `settle-attempt.mjs:205`) with `provider-auth-failure.mjs`. The owner-approved T3a delete (decision 30) removes only the second one. One authority needs the third one cut too (S1).
2. The crate has two doors where it should have one: the gate's own argv parser, reporter and exit constants (`gate.rs:46-146`) next to `route.rs`, its own envelope verifier (`gate.rs:184-194`, which skips the `protocolId` check) next to `envelope::read_verified`, and four `/proc` readers (`supervise/terminal.rs:268-302`, `gate/unix.rs:640-664`) beside T0's `facts::relations()` / `relation_of()`.
3. The direct and terminal watch loops repeat the same three blocks (AGENT frame, heartbeat, stop escalation), and the heartbeat file has no production reader at all.
4. The Windows/macOS dead-field warnings are symptoms, not lint: the attempt writer id travels three ways and the Windows gate applies only two of them (S9). Grouping the terminal-only gate fields into one optional struct removes four warnings without `allow`.
5. Legacy: `legacy-sweep.mjs`, the `legacy-attempts-stuck` row and its fix, and the `abandon-legacy` recover intent are one mechanism whose only remaining input is pre-supervisor runs still marked `running`. The row passes on this machine. It can be deleted once the owner machine's three workspaces show the same (Q1).

## Part A. Target shape

### Run Supervisor (one component; the Launch gate, the adopt door, the sweep and `attempt-step` are parts of it, not separate components)

- **Authority for:** the life of one attempt after the handover: verifying envelope v3, the attempt-directory layout and one-time publication, binding, soft and idle deadlines, the receipt, running the steps and their receipts, `closed.json`, and the adopt door with its recovery matrix and scan. The gate is the authority for the agent's process root, its IO, the hard ceiling, reaping and `gate-exit.json`. Agree with spec §1-§8.
- **Contract and ports:** inbound, the four internal routes at protocol 1 (spec §10). Outbound, `fgos-process` (containment and facts, including `relations()`), `fgos-holder-lock` (attempt lock, predecessor record), `fgos-agent-protocol` (direct activity plus `classify`, terminal adapter), `fgos-terminal-control` (by key), `fgos-durable-file` (publish), `fgos-identity` (clock). No other OS access, and no `/proc` reads of its own (S5).
- **Rust/Node boundary:** Node keeps the controller half (it writes the envelope because it alone knows argv, confinement and the brief), the adopt client, the cancel registry (signals of the Node process), the two config readers, the doctor checks, and three step payloads. Those payloads are Execution Core and confinement logic, not supervisor logic (settle = Run Result Evaluator door, finalize-home = confinement authority, cleanup-trust = trust store), so under proposal §4.3 they move with T5, not T4. After T4, Node decides nothing about attempt lifecycle beyond calling the routes. The single exception left is `awaitSettledResult` calling adopt once the supervisor is gone (`direct-launch.mjs:381-394`), which is a trigger, not a judgement.
- **Node budget after T4:** `src/run-supervisor` drops from 1 493 lines and 78 exports to about 1 230 lines and about 70 exports (legacy-sweep −154, screen judging −50, duplicate step checks −25, duplicate settled-result reader −12, sweep wrapper folded −15). The supervisor part of `assignment-runner.mjs` gets 0 new lines; the separate dead branch (S8) is −115 and SEAT-scheduled.
- **Delete list:** see section 4.
- **Doctor rows kept:** `run-supervisor-route` (absorbs `process-containment` if T0 agrees, Q3), `runtime-socket-dir`, `run-attempts-stuck`, and `run-supervisor-config` (a merge of `gate-kill-grace` with `cancel-wait`). `units-awaiting-resume` is a unit-state row and belongs to Execution Core (T5). `legacy-attempts-stuck` goes. That is 8 rows → 4 (or 5), with no condition lost (section 5).
- **Size target:** Rust src 4 677 → about 4 500. Rust tests 4 757 → about 4 100. Node 1 493 → about 1 230. Node tests 4 107 → about 3 300.

**Code and spec disagree:**
- (a) Spec §5.3 "Idle in a pane" (`spec.md:148`) and its decision line (`:352`) still count a `working` status as activity. Since `16150dca1` only a change in the letters on the screen counts (`supervise/terminal.rs:439-449`).
- (b) The route contract still lists `lock-scan` (`internal-route.run-supervisor.v1.json:90`), and spec §15 admits it does not exist.
- (c) Spec §7 says the attempt-step route "execs the Node payload". In fact the payload re-verifies everything the route already verified (S7).
- (d) Spec §3 says nothing decides from `supervisor-heartbeat.json`, and nothing reads it (S6).

## Part B. Findings

"Read" means established from the source with its callers searched. "Measured" means I ran it. Nothing here was reproduced as a failing run, so nothing is rated above Medium.

| id | axis | sev | status | file:line | what is wrong | fix shape |
|---|---|---|---|---|---|---|
| S1 | E/F | Med | read | `settle-attempt.mjs:84-133,200-205`; `settlement.mjs:633-652`; Rust terminal adapter | Three judges of "provider stop" per attempt. Deleting only `settle-attempt.mjs:84-129` (T3a hand-over) leaves the pane screen inside `stderrText` (`:205`), and settlement then re-matches it for dead login or quota. The adapter's name would still be overruled by a regex. | The receipt reason (`terminal:blocked:login\|usage-limit`, and the direct `classify` once wired) is the only judge. The settle step maps reason → outcome in one table, and the screen tail goes only into the person-facing message and `stderr.log`. `settlement.mjs:633-652` reads `adapterOutcome` and no longer re-matches the text for a supervised attempt. SEAT-scheduled (settlement.mjs). |
| S2 | E | Med | read | `gate.rs:46-146` vs `route.rs:1-123` | The gate has its own `ArgsError`, `parse_args`, `report`, and `EXIT_USAGE/VERSION/ENVELOPE/INTERNAL` constants. All are copies of `route.rs`, two flag parsers in one crate. | Parse the gate's argv with `route::Flags` (`--lock-fds` is a value flag) and report through `route::refuse/report`. Keep only `EXIT_NO_GO`. About −50 lines. |
| S3 | F | Med | read | `gate.rs:184-194` vs `envelope.rs:341-356` | The gate re-implements envelope verification without the `protocolId == 1` check that spec §3 says every reader makes. | `load_config` starts from `envelope::read_verified`. About −10 lines, and the gate gains the missing check. |
| S4 | E | Med | read | `supervise.rs:476-523` vs `supervise/terminal.rs:370-421` | The AGENT-frame read with the `agent-binding.json` publish, the heartbeat, and the "gate outlived grace → `kill_all`" escalation are written twice. They already differ: the terminal loop has no output-limit cause, and no comment says whether that is on purpose. | One small `WatchTick` shared by both loops (frames, stop escalation). State the terminal output-limit exemption in one line. About −35 lines. |
| S5 | E/layering | Med | read | `supervise/terminal.rs:268-302`; `gate/unix.rs:640-664` | `parent_of`, `within`, `namespace_init_under` and `descendants_of_self` read `/proc/<pid>/stat`, `status` and `children` directly. T0's `facts::relations()` and `relation_of()` (`process/rust/src/facts.rs:443-455`) already give the parent. Only the `NSpid` and zombie-state facts are missing there. | Read the parent through `relation_of` and descendants through `relations()`. Add `state` (one char) and `nspid_depth` to T0's `Relation`, the lowest layer that owns these facts. About −35 here, +10 in T0. |
| S6 | D | Low | read | `supervise.rs:499-502`; `supervise/terminal.rs:388-391`; spec §3 | `supervisor-heartbeat.json` is written every 5 s by both loops. No file under `src`, `bin`, `apps` or another crate reads it; one test asserts it exists (`supervise_lifecycle.rs:62`). | Delete both writers and the assertion, and fix the spec line. `agent-binding.json` stays: it is forensic, written once, and used as a sync point by five test files. |
| S7 | E/C | Low | measured | `attempt-step.mjs:13-16,34-49,66-71`; `step-support.mjs:23-35`; `attempt_step.rs:231-255` | The Node step re-checks the envelope digest, that the step exists and `payloadRoot`, all of which the Rust route checked before it `exec`ed Node. Only the release-manifest cross-check (`:45-48`) is Node-only. All three step modules are imported statically, so every step loads every step's graph. Measured: whole entry 0.12-0.19 s, finalize-home alone 0.07-0.09 s, cleanup-trust alone 0.04-0.06 s. | Use a dynamic `import()` per step: 0 net lines, about −60 ms per direct seat and −150 ms per terminal seat. Drop the re-verify and keep the manifest check: about −25 lines. |
| S8 | D/E | Med | read | `assignment-runner.mjs:1731-1735,2173-2290`; `transport.mjs:620-664,700` | `supervised` is `cli-spawn` or `herdr-spawn`, so the else-branch, where the controller settles itself, is reached only by the `http` adapter. Its own comment says no executor dispatches through `http` (`transport.mjs:345-350`). The branch's "herdr round names the real reason" handling (`:2219-2222`) can never fire: `herdrSpawnAdapter` only refuses (`transport.mjs:676-682`). It is a second settle door in the controller, against "the controller never settles". | Delete the `http` adapter and the else-branch. A non-supervised adapter is then refused by name at `:1733`. About −115 Node lines and −40 in transport. SEAT-scheduled. Owner nod: the `http` port was kept as a pluggability proof (D13), Q2. |
| S9 | A/F | Low | read, unreproduced | `direct-launch.mjs:199`; `assignment-runner.mjs:2087`; `gate/unix.rs:547-553`; `gate/windows.rs:189-221` | The writer id travels in `launch.env`, in the side-file env and in `envelope.identity`, and only the Unix gate applies the third (including `env_remove FGOS_PARENT_WRITER_ID`). This is the msvc `identity` dead field. A parent id inherited in `attempt.env` with no lineage would survive on Windows only. | One path: `identityEnv` in Node removes `FGOS_PARENT_WRITER_ID` when there is no parent, and the gate drops `Config.identity` with its re-apply. About −12 Rust, +1 Node. |
| S10 | F | Low | read | `gate.rs:149-176`; `supervise.rs:176-185`; `supervise/terminal.rs:251` | Windows dead fields `terminal`, `mutating`, `outbox_dir`, `orphan_settle` (plus `identity`, S9) and `Watch.outbox`, and macOS `sandboxed`. The first four are terminal-only inputs. | `Config.terminal: Option<TerminalGate {mutating, outbox_dir, orphan_settle}>`, where the Windows gate refuses `Some` by name (`terminal-mode-unsupported`). Move `outbox` into the terminal `Plan`. Make `sandboxed` a Linux-only argument of `namespace_init_under`. No `allow`; ±0 lines. |
| S11 | F | Low | read, unreproduced | `gate/unix.rs:381-389`; `agent-protocol direct/mod.rs:64-79`; Node `resolveWorkerArtifactPath(.., /^result-(\d+)\.json$/)` | Three rules for "a result file is there". The gate accepts `result-007.json` and requires it to parse. The receipt's `outboxPresent` rejects leading zeros and never parses. Node accepts leading zeros. For `result-007.json` the gate stops with `orphan-result`, `outcome_for` gives `gate-lost` (`supervise.rs:65-71`), and settle still finds a claim, so the pane is retained and the run is settled as a result. | The gate and the receipt use the agent-protocol reader (name rule plus parse). Node already defers to the receipt where it can. About −8 lines. |
| S12 | E | Low | read | `settle-attempt.mjs:40-49` vs `direct-launch.mjs:337-344` | Same "sound settled result" reader written twice. | Use one export. −10 lines. |
| S13 | E | Low | read | `supervise/terminal.rs:530-536` vs `supervise.rs:288-299`; `gate/unix.rs:148-160` vs `supervise/terminal.rs:162-180` | `start-refused.json` is published by two functions, and `peer_uid` is defined twice. | One `record_start_refusal`; `peer_uid` moves to `go_channel.rs`. −20 lines. |
| S14 | E | Low | read | `sweep.mjs:1-24` | A 24-line file whose only job is to catch the error of `adoptScan` (3 callers). | Fold it into `client.mjs` as `sweepAttempts`. −15 lines, one file fewer. |
| S15 | E | Low | read | `legacy-sweep.mjs:336-345` vs `adopt.rs:110-113` | Node restates the host's `legacy-run` rule ("the host's own rule"). Two authorities, held together by a comment. | Goes with the legacy deletion (section 4). If the deletion is refused, read the state from `adoptScan --probe-only` instead. |
| S16 | layering | info | read | `run-lock.mjs:1-384` | The seed delete list names "run-lock.mjs holder logic". In fact it is the run-control epoch/token ledger of Execution Core (unit control, recover, settlement CAS) and holds no attempt-lifecycle decision. | Rejected as a T4 item, with this source. Review it at T5. |
| S17 | E | info | read | `transport.mjs:386-618` | `cliSpawnAdapter` is a second process-supervision engine (timeout, idle, output budget, group kill) for short calls (probes, judges, goal check). It is not attempt lifecycle, so it is out of T4. | Hand to T5: whether short calls run as `direct` attempts without adopt. |

Hypotheses I rejected:
- `herdr-round.mjs:480-495` (`followPaneScreen`) is display only and decides nothing.
- `runtime-dir.mjs` and the Rust `AttemptSocket::bind` check the same directory rules on purpose: Node creates the directory and doctor fixes it, while Rust refuses at the trust boundary. This is accepted duplication across a boundary, so it is not a finding.

## 3. Migration table

| Node part | What it decides | Move? | Reason | Order | Node budget after |
|---|---|---|---|---|---|
| `settle-attempt.mjs` screen judging (`:84-133`) | provider stop from screen text | delete (Rust adapter already names it) | two judges (S1) | 1, after the 04a contract change and the captured screen vectors | −50 |
| `settlement.mjs:633-652` stderr re-match for supervised attempts | provider stop from text | delete for supervised attempts; the receipt reason decides | third judge (S1) | 2, SEAT slot | −15 (SEAT) |
| `attempt-step.mjs` and `step-support.mjs` re-verify | envelope validity | delete (the route decides) | duplicate (S7) | 3 | −25 |
| `legacy-sweep.mjs`, `findLegacyStuck` | legacy-run rule, death proof | delete | dead input once Q1 holds (S15) | 4, after the owner-machine check | −154 |
| `client.mjs listOpenAttemptDirs` | which directories are attempts | not now | thin lister; moving the walk into `adopt --scan-root` is an option (+15 Rust / −22 Node), not required | — | 0 |
| `direct-launch.mjs` controller half | envelope, locks, spawn, wait | no | writer of the envelope; Execution Core knowledge | — | 0 |
| `cancel-registry.mjs` | Node signal → cancel file | no | the Node process's own signals | — | 0 |
| `gate-kill-grace.mjs` | config value, validation | no | config facade adapter | — | 0 |
| `steps/settle-attempt`, `finalize-home`, `cleanup-trust` | work result, credential, trust store | not in T4 | upper-layer logic (Evaluator, confinement) | T5 | — |
| `runtime-dir.mjs` | socket directory rules | no | setup/doctor create it; Rust re-checks at bind | — | 0 |

## 4. Delete list

- **Mechanisms:**
  - `legacy-sweep.mjs` (154).
  - `checkLegacyAttemptsStuck` and `fixLegacyAttemptsStuck` (about 40).
  - The `abandon-legacy` intent in `recovery-planner.mjs:44,98-146,240-260,423` (about 45).
  - The `abandon-legacy` entry of `recover-actions.v1.json` and the `legacy-holders` evidence type.
  - `legacy-run` stays readable in adopt, and the value `abandoned-legacy` stays readable in `unit-state` for runs already settled. The state stays because removing it would change how old directories read.
  - The supervisor heartbeat writers (S6).
  - The gate's duplicate parser and reporter (S2) and verifier (S3).
  - The `/proc` readers (S5).
  - `sweep.mjs` (S14).
  - The `http` adapter and the non-supervised branch of `executeAssignment` (S8, Q2).
- **Checks:** the Node re-verify in the step (S7).
- **Doctor rows:** `legacy-attempts-stuck` and its fix. `gate-kill-grace` and `cancel-wait` merge into one row (section 5).
- **Contracts:** `lock-scan` in `internal-route.run-supervisor.v1.json:90-` and spec §15's first bullet.
- **Tests:**
  - `legacy-sweep.test.mjs` (6 tests).
  - `inspect-recover-adopt` tests "a run from before the supervisor reads legacy-run" (keep it as the read-only proof), "abandon-legacy settles ..." ×2 and "a unit whose only attempt the legacy sweep settled" (retire 3).
  - `resume-adopts` 9, and the guard line at `assignment-enumerator-guard.test.mjs:85`.
  - Also see section 6.
- **Instruction and spec text:** spec §8 step 2 parenthesis, §9.1 `legacy-run` row, §14 `legacy-attempts-stuck` row, §5.3 idle sentence (fix), and the `legacy-attempts-stuck` mentions in `runner.md`, `distribution.md`, `reading-map.md` and `setup-doctor-registry.md`.
- **Additions, and what each one replaces:**
  - S5 adds `state` and `nspid_depth` to T0 `Relation`, replacing four private `/proc` parsers.
  - S10 adds the `TerminalGate` struct, replacing five loose fields.

## 5. Doctor table

| Row today | Fail/warn condition | Kept by |
|---|---|---|
| `process-containment` | `kernel` pass; `best-effort` warn on Linux (mount-refused or no userns variants); info elsewhere; no driver fails | itself, or `run-supervisor-route` if T0 hands it over (one probe answer already carries `containment`; today the same `supervise --probe` spawns twice) |
| `run-supervisor-route` | no host binary; any of 4 routes missing or a protocol mismatch | `run-supervisor-route` |
| `runtime-socket-dir` | missing warns; not a directory, wrong owner, loose mode or orphan socket fails; fix | `runtime-socket-dir` |
| `run-attempts-stuck` | `needs-adopt`/`open` attempts fail, with a reason naming the release that is gone; host or adopt unavailable warns; fix adopts | `run-attempts-stuck` |
| `gate-kill-grace` | unreadable config, non-integer or below 1000 fails | `run-supervisor-config` (one reader, one snapshot) |
| `cancel-wait` | unreadable config, non-integer, below 1000, or shorter than the grace fails | `run-supervisor-config` |
| `legacy-attempts-stuck` | settleable legacy run fails; kept runs warn | removed with its mechanism (conditions gone, not moved); precondition Q1 |
| `units-awaiting-resume` | warns listing resume commands | stays, re-homed to the T5 (unit state) row set; not a supervisor condition |

## 6. Tests table

| Behaviour | Owning proof (lowest layer) | Duplicates to retire |
|---|---|---|
| soft deadline / cancel / full lifecycle / host-bin mismatch / cwd lease freed at gate exit | `supervise_portable.rs` (driver-independent supervisor logic) | the same four titles in `supervise_lifecycle.rs` (keep its namespace-descendant soft-deadline and output-budget tests); Node `direct-crash-matrix` 3, 4, 5 |
| step order / 75 retry / timeout kill / skip with receipt | `steps_portable.rs` plus `steps_runner.rs::a_step_holds_no_lock_description` | `steps_runner.rs` order, 75 and timeout tests (3) |
| hard ceiling, SIGTERM-ignored grace | `gate_portable.rs` | `gate_ceiling.rs` same two titles (keep its other-boot test) |
| two adopters, exactly-once steps | `adopt_concurrency.rs` | `crash-matrix-adopt-resume` "two adopters at once" per row (about 14 of 30 tests; one wiring proof stays), `direct-crash-matrix` 6, `sweep` "two adopters" |
| abandoned-not-started via adopt | `adopt_matrix.rs` | `direct-crash-matrix` 7c |
| no lock descriptor reaches the agent or a step | `gate_pid1.rs`, `supervise_portable.rs`, `steps_runner.rs` | `direct-crash-matrix` 8, and the `direct-cutover` env line, which asserts the same absence through Node |
| controller-side behaviour (Ctrl-C cancel, `--resume`, binding wait, cancel registry) | Node (`direct-crash-matrix` 1, 2, 2b, 7a/b/d, 9; `resume-adopts`; `cancel-registry`) | none, Node-only |
| screen → provider-limit cases | moves to agent-protocol vectors (T3a) | `attempt-steps.test.mjs:320-330` screen cases; `terminal-cutover:112-123` re-points at a captured screen |

- **Harness duplication:** `tests/support/` and `tests/portable/` both define `wait_for`, `wait_until`, `Options`, `Attempt`, `Gate`, `start_gate`, `send_go`, `start_agent`, `wait_exit` and `alive` (about 1 400 lines together). Propose one harness parameterised by driver, about −400 lines.
- **Time-based waits:** the 57 s and 36 s binaries wait on real deadlines (baseline §3.2). Retiring the Node rows above takes about 14 tests out of the 158 s floor file `crash-matrix-adopt-resume`. Estimated −60 to −80 s of the batch floor; not measured.

## 7. Received items

- **Worker session-server ownership (T2 §2.3).** No for the run supervisor. A supervisor lives for one attempt, while the herdr session server outlives attempts and serves many panes (`worker-session-boot.mjs:118-`, called from `herdr-round.mjs:36`). The supervisor only consumes the endpoint (`terminal_slot.rs:391-426`). If ownership moves, it belongs to terminal-control's herdr driver as a server-ensure capability. Until then, keep T2's named exception.
- **R5 seat launch cost / `attempt-step`.** On Unix the route is already one process: the host `exec`s Node (`attempt_step.rs:267-272`). The cost is Node start-up plus the module graph. Measured: a step that loads all three step modules costs 0.12-0.19 s; finalize-home alone 0.07-0.09 s; cleanup-trust alone 0.04-0.06 s. In T4, lazy imports (S7) save about 60 ms per direct seat and about 150 ms per terminal seat, against a seat cost of about 1.2 s. Moving the steps into the host is not a T4 move: their logic is the Evaluator, confinement and trust store (T5). Batching steps into one Node process would break one receipt per step (spec §7), so I advise against it.
- **Windows hold transport (RT-M3).** The supervisor's `declare-domain` request (`supervise/windows.rs:288-312`) is one of three operations of the hold helper. `borrow` (git children through `run_borrowed`) and `clear-domain` (`holder-lock route/hold.rs:236-262`) remain whatever T4 does, so `hold-transport.mjs` cannot be deleted from this layer. Recommendation: keep it, and close RT-M3 as "not a T4 lever".
- **Agent outcome wiring and `settle-attempt.mjs` screen judging.** Agree with decision 30, with one addition (S1): stop feeding the screen into `stderrText` for classification. Otherwise `settlement.mjs:633-652` stays a third judge. Order: 04a contract and captured vectors, then the settle table, then the settlement cut (SEAT slot).
- **Windows/macOS dead fields.** See S9 and S10. The `identity` field shows a real three-way travel of the writer id. The other fields are terminal-only and are grouped behind `Option<TerminalGate>`, with a named Windows refusal. No `allow`.

## 8. Proposed additions (owner picks)

- **P1. `state` and `nspid_depth` on T0's `Relation`.** Problem: four private `/proc` parsers in L4 (S5). Benefit: one process-fact door, −25 lines net, and macOS and Windows get a `None` answer instead of a hidden Linux path.
- **P2. `adopt --scan-root <dir>`.** Problem: Node holds the attempt-layout rule (`client.mjs:75-95`) that spec §2 gives to Rust. Benefit: one layout authority, −7 lines net. It replaces the stdin list of `--scan`, which goes in the same change (L10).

## 9. Net size estimate for my proposals

| Area | Δ |
|---|---|
| Node `src/` (T4-owned) | −265 (legacy −240 incl. recovery-planner and checks, S1 −50, S7 −25, S12 −10, S14 −15; overlaps counted once) |
| Node `src/` SEAT-scheduled | −170 (S1 settlement −15, S8 −155) |
| Rust src | −200 (S2 −50, S3 −10, S4 −35, S5 −35 net of +10 in T0, S6 −6, S9 −12, S11 −8, S13 −20, misc −24) |
| Tests | −650 to −800 (Node about −450: legacy 6+3+1 tests, crash-matrix dupes about 18 tests, screen cases; Rust about −250 to −350: lifecycle/steps/ceiling dupes plus one harness) |
| Layer total | about −1 300 to −1 450, inside the phase estimate |

## Unresolved questions

- Q1. Do the owner machine's three workspaces (forgentX, mdview, mcp-skill-hub) all report `legacy-attempts-stuck` as pass with nothing kept? That is the precondition for deleting the legacy path. If any kept runs exist, settle them once with the current fix, then delete.
- Q2. Is the `http` executor adapter still wanted as the D13 pluggability proof? If not, S8 deletes it and the controller's second settle door.
- Q3. Does T0 hand `process-containment` to this layer? If yes, fold it into `run-supervisor-route` (one probe). If not, keep the row and share the probe answer.
- Q4. The failing `run-attempts-stuck` row on this machine (`unit-run-1792482363495-797e4401`, from 2026-10-19): should `doctor --fix` adopt it now, or should a correctness seat look at why the step chain stays open?

Status: DONE
Summary: Simplicity review of T4 with target shape, 17 findings (none above Medium), migration, delete, doctor and test tables, and answers on all received items. Net estimate for the layer is about −1 300 to −1 450 lines.
Concerns/Blockers: Deleting the legacy path depends on the owner machine (Q1). S1 and S8 touch SEAT-owned files.
