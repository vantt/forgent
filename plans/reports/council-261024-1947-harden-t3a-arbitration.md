# HARDEN T3 part 04a arbitration: Agent protocol and Observe

Big lead `lead:HARDEN` `claude-p74h@fg-server2`, 2026-10-24 20:00 (Asia/Saigon), main `6abe80070`.

**Inputs:**
- the [brief](council-261024-1927-harden-t3a-council-brief.md) and the [baseline](research-261024-1927-harden-t3a-baseline.md);
- four seat reports:
  - [correctness](council-261024-1935-harden-t3a-seat-correctness.md) (opus);
  - [speed](council-261024-1935-harden-t3a-seat-speed.md) (sonnet);
  - [simplicity](council-261024-1935-harden-t3a-seat-simplicity.md) (sonnet);
  - [red-team](council-261024-1935-harden-t3a-seat-redteam.md) (opus).

**Evidence the big lead re-checked directly on main:**
- **The direct outcome machine is unwired.**
  - `supervise.rs` uses only `adapter.activity_from` (`:252`) and `newest_result`.
  - No production `*.rs` outside `packages/agent-protocol` calls `classify`, `Outcome` or `BlockedReason`.
- **Usage limit is dropped on purpose.** `terminal-outcomes.v1.json:15` reads "usage-limit is a direct-mode blocked reason only; a terminal adapter reports a usage limit as needs-human".
- **The lazy migration treats an unreadable store as empty.**
  - `friction.rs:141` is `read_all_json(root, "friction").unwrap_or_default()`.
  - `friction.rs:291` is `let _ = run_lazy_migration(...)` under the store lock.
  - The correctness seat's 3 → 9 duplication repro follows from these two lines.
- **The outbox read is unbounded.** `terminal/mod.rs:155,175,180` call `std::fs::read` on the newest `result-N.json` with no type or size check. It also sleeps with `std::thread::sleep` outside `AgentIo::pause` (`:160`, `:179`).
- **The 35 s test is a fixed sleep.** `store_lock_multiprocess.rs:169` is `std::thread::sleep(Duration::from_secs(31))`.
- **Two environment reads in production code.** `friction.rs:40` reads `FGOS_CALLER_PID`, which nothing in `src`, `bin`, `apps` or `packages` sets. `store_lock.rs:36` reads `FGOS_NOW`, a test clock. Both are production code paths.
- **`run-result` is T5's crate** (plan.md phase table), and the slow scan lives there (`run-result/rust/src/lib.rs:568`).
- **`packages/secrets` has a redactor** (`redaction.rs:42` `mask`), but it masks declared secret names and values, not arbitrary text.

## 1. Outcome in one paragraph

The agent protocol claims to be the outcome authority, but it is not. Its direct-mode verdict was never wired, and its terminal adapter recognises a used-up quota and then reports it as `needs-human`. So Node re-reads the pane later with wide regexes. Text the agent itself printed can therefore quarantine an account until a person clears it (RT-01: reproduced at the classifier, inferred at settle).

Observe's friction store is the weakest of its four stores:
- one bad byte stops every read;
- every later write re-appends all 752 legacy records (reproduced);
- a torn append silently swallows the next record (reproduced);
- `friction migrate` runs unlocked (reproduced);
- settlement compares timestamps as strings (reproduced);
- three of the four stores follow symlinks in a git-tracked folder.

The hardened code already exists in the same crate, in `eval_journal.rs`.

The three slow `metrics` routes (1.0 to 1.4 s) are slow because they parse 295 MB of `result.json` into `Value` when they use ten small fields; a typed read measured 7.5 times faster. The doctor row parses the same data a second time in Node.

About 1,150 lines can go without an owner call, about 650 more with one, and about 780 more after the Work cutover plus one release.

## 2. Part A: target shape (for owner approval, then into each spec)

### 2.1 Agent protocol (`packages/agent-protocol`)

- **Authority.** It is the only place that turns what an agent CLI shows (screen, capture, exit, outbox) into a named outcome, in both launch modes. The outcome travels with the evidence line that decided it. It owns the one list of provider wordings: dead login, used-up quota, trust dialog. No Node file matches provider, CLI or screen wording. The Node budget for outcome naming is 0 lines once T4 and T5 have consumed the change.
- **Contract.** `blocked(trust-dialog | login | usage-limit)`, `ready`, `delivered`, `delivery-unknown`, `completed`, `needs-human`, `exited`.
  - The terminal adapter reports `blocked(usage-limit)`. The enum value already exists in `agent-protocol.v1.json`. The `wire.usageLimit` exclusion line of `terminal-outcomes.v1.json` is superseded, and every consumer moves in the same change (L10).
  - In direct mode, the supervisor calls `classify` once at exit.
  - In both modes the receipt reason is rendered by one function in the protocol crate. The four receipt reasons now outside the contract are listed in it (B-A7).
- **Wording rule.** A wording joins the Rust list only with a recorded vector, and it is anchored to the CLI's error region or line start, as quota already is. Login matching becomes anchored too (RT-09). Node's extra generic phrases (`rate limit`, `try again`, `too many requests`, `model is at capacity`) join only if a captured screen shows the CLI printing them in its own error region. Unanchored, they are the cause of RT-01, so they must not move into Rust.
- **Ports.**
  - `AgentIo` keeps `send`, `screen`, `inspect`, `now_ms` and `pause`. `read` and `activity` are deleted (no caller).
  - `Outbox` reads results no-follow, regular files only, with a size cap, through `fgos_durable_file::open_beneath(..).read(max)`. On Windows it checks the type and size of the opened file.
  - Outbox waits go through `pause`, and `newest_complete` and `newest_unreadable` use one stability rule.
- **Delete:**
  - `StdinPolicy` and `stdin_policy` (Node hard-codes `null`);
  - the five identical direct adapter structs (they become one `match` on generic or named blocks);
  - the Codex override;
  - the `Event` versus `Output` split if no consumer appears;
  - unused `TerminalOutcome::to_json`, if the shared receipt renderer replaces it.
- **Doctor.** No row of its own. `agent-cli-project-trusted` stays a machine fact.
- **Size ceiling, HARDEN commits only.**
  - Rust: −60 or less net in the crate. The bounded read and the usage-limit variant (about +30) are paid by the deletions.
  - Supervisor wiring: at most +20 lines in T4's crate.
  - Node: the deletions land with T4 and T5, not here.

### 2.2 Observe (`packages/observe`, its host wiring, `src/observe/*`)

- **Authority.** The one writer and reader of `.fgos/observe/<store>/<writer>.jsonl` for friction, cases, evals and snapshots. The one computer of metrics and the scorecard sections that have a producer: `runs`, `tokens`, `faults`, `work`, `case`, `commits`, discussions and entropy.
- **One shard door, from `eval_journal.rs`'s hardened pair.**
  - **Append:** one `write_all(line + "\n")`, no-follow, regular files only, and a shard that does not end in `\n` is healed first.
  - **Read:** bounded per line, and a bad line is named and skipped, never fatal and never silent.
  - **Applies to:** friction, case and snapshot. Their three hand-written appenders and the second reader are deleted.
  - **On Windows:** check the opened handle, instead of `create_new` (RT-06).
- **Friction rules.**
  - **Lazy migration:**
    - it fails closed on a read error;
    - it takes the store lock itself, or a guard argument;
    - it leaves the `record` and `resolve` write path. The explicit, locked `friction migrate` stays for its one release, and the whole fence then goes (D17, with WORK).
  - **Settlement:** compares parsed instants. Within one writer shard, file order breaks ties. Cross-machine skew is written into the spec as a known limit.
  - **Root:** one root rule in Rust (the main checkout).
- **Rust/Node boundary.** `friction-client.mjs` builds argv, passes `detail` on stdin, calls `invokeHost` and logs a fault on transport failure. It keeps no value lists and no defaults; a host refusal rethrows. Budget: about 60–70 lines and 2 exports, down from 194.
- **Plumbing:**
  - one flag parser for the 12 verbs, so `--k=v`, unknown flags and bad numbers behave one way, and `--json` is accepted as a no-op;
  - one descriptor, provider and projector arm for `observe.metrics` and `observe.friction`;
  - one `now_iso`, with the clock injected in tests. `FGOS_NOW` and `FGOS_CALLER_PID` are deleted (AGENTS.md L5: no test-only switch);
  - `metrics runs` reads only the `run-result` source;
  - `UnitSummarySource` stops being an `ObservationSource`;
  - the dead `classification` fallback in `compute_runs` goes.
- **Run scan cost.** The scan deserializes `result.json` into a small typed struct holding only the fields it uses (S-1, about 1.0 s to about 0.13 s of parse).
  - **Where:** this is code in `run-result` (T5's crate).
  - **Why T3 takes it now:** it is local to one function, changes no contract, and is the whole cost of T3's routes.
  - **T5's part:** T5 is told; no other T5 work is pulled forward.
- **Doctor rows.**
  - `observe-dir-writable`: kept.
  - `observe-host-resolvable`: kept, with its probe moved from `friction ping`, which reads nothing, to a read of the store. An unreadable store then fails it (B-O6).
  - `observe-run-coverage`: kept. Its Node half is owner question Q2.
  - `observe-friction-migrated`: kept until the fence goes (D17).
  - No row is added.
- **Size ceiling, HARDEN commits only, Rust src.**
  - −700 or less without the owner's Q3.
  - −1,300 or less with Q3.
  - Tests −150 or less.
  - Node −120 or less (client and doctor).
  - D17 (about −780) is counted when it lands, with WORK.

## 3. Disagreements and verdicts

| Point | Seats | Verdict | Source |
|---|---|---|---|
| Direct `classify`: delete it (simplicity F1) or wire it (correctness B-A1, red-team RT-07) | split | **Wire it.** | The owner's 2026-10-21 rule: T0–T4 end with no deciding logic in Node. Deleting it would make Node the permanent authority for direct mode. Wiring needs about 15 supervisor lines (T4) and lets T5 delete `exitedOnDeadCredential` and `exitedOnQuota` plus `provider-auth-failure.mjs`. Q1 asks the owner because it sets the contract. |
| Widen Rust's wording to Node's six generic phrases (simplicity F6/Q2) | simplicity only | **Rejected as stated.** Anchored and vector-backed only (§2.1). | RT-01 is reproduced: unanchored generic phrases over agent text cause the false quarantine. Moving them into Rust moves the bug. |
| Merge `observe-host-resolvable` into `observe-run-coverage` (simplicity F24) | simplicity only | **Rejected.** | The two rows answer different questions: coverage never reads the friction store. B-O6 shows the store can be broken while every row passes, so the row is kept and its probe becomes a store read. |
| `observe-friction-migrated` through a new read-only host check (red-team RT-19, correctness P1) | red-team, correctness | **Not taken.** | The row retires with the fence (D17). A new check form would be an addition that lives one release. |
| Take the `result.json` typed read in T3 although `run-result` is T5 (speed S-1) | speed | **Taken in T3.** | One function, no contract change, and the whole cost of T3's routes. A prefix-only read is rejected because it relies on key order with no writer contract. |
| Retire `store_lock_multiprocess.rs`'s 31 s and 5 s tests | all four | **Retire the 31 s test now.** The 5 s timeout test is reshaped onto `acquire_store_lock_within` with a short wait. | The speed seat inferred the holder-lock ownership from file names. Correctness names the owners: holder-lock `tests/multiprocess.rs:62` `wait_ms_times_out_and_nothing_is_kept` and `:46`. The sub-plan confirms both before deleting. |
| `FGOS_NOW` in production | red-team RT-13 vs simplicity F19 (keep it, make snapshot honour it) | **Delete it**, and inject the clock. | AGENTS.md L5 forbids test-only switches in product code. |

## 4. Decisions made by the big lead inside the approved frame

1. **Red tests come first.** No High is left unreproduced (loop step 9). The sub-plan's first phase reproduces the inferred halves as committed red tests:
   - RT-01's settle half: a terminal `needs-human` whose later screen holds agent text with "rate limit" settles as `provider-limit`;
   - RT-02's supervisor stall: a FIFO result blocks the watch;
   - B-A1's screen-changed case.

   Where a red test must live in T4 or T5 code, it is written there and handed over with the fix.
2. **Fix order inside 04a:**
   1. the shard door plus the friction fixes (B-O1 to B-O5, RT-03 to RT-05), one change;
   2. the agent-protocol contract and outbox (RT-02, RT-08, RT-09, RT-17, RT-20, B-A4, B-A7, the deletions);
   3. the plumbing deletions (D11, D13 to D16, D18, D19);
   4. the run-scan typed read (S-1, both sides of the doctor row once Q2 is answered);
   5. the spec updates (`docs/platform/agent-protocol/spec.md` §4 and §8, `docs/specs/observe.md`, the component-boundary rows).
3. **The lazy migration leaves the write path in T3** (B-O7). This removes friction's per-write read of `.fgos/events*.jsonl`, which helps the cutover rather than colliding with it. WORK is told before it lands.
4. **The `--json` no-op flag is accepted on Observe verbs** (RT-15). It removes a refusal and adds no feature.
5. **The receipt-reason renderer moves into the protocol crate** (RT-08). The supervisor calls it; T4 wires the call.
6. **No doctor row is added.** No proposed addition is built before the owner picks.

## 5. Hand-offs (recorded in the receiving plan in the same turn)

| To | What | When |
|---|---|---|
| T4 (run supervisor, phase 05) | Wire `classify` into the direct receipt. Call the protocol's reason renderer. Delete `settle-attempt.mjs:84-129`'s screen re-read and regexes in favour of a name→outcome table. Retire the screen cases in `attempt-steps.test.mjs`. | after the 04a contract change lands |
| T5 (dispatch, phase 06) | Delete `provider-auth-failure.mjs` and its test, `settlement.mjs:633-652`'s stderr rules, `provider-capacity.mjs:948-1009`'s text rules, and the probe patterns (`provider-credential-probe.mjs:24`, `provider-account-probe.mjs:26-27,136`). Unify the stale-result guard and claim lookup with `newest_result` (B-A5). Note: T3 changed `run-result`'s scan (S-1). | phase 06 |
| WORK | D17: the legacy friction fence (`run_lazy_migration`, `legacy_friction.rs`, `friction migrate`, `checkObserveFrictionMigrated`), about −780, one release after the cutover. Also the `.fgos/observe/.lock/TOMBSTONE` fence. | cutover + one release |
| Identity owner | RT-21: `pid-<N>` shard names are not unique across machines in a git-tracked folder. This applies only if the shard writer id can fall back to a pid. | open item |

## 6. Owner ask 1 (batched; template `core/skills/_shared/decision-question.md`)

Sent to the owner in Vietnamese in the session; summary:

- **Q1. Approve the Part A shapes (§2.1, §2.2), including the outcome contract.** In terminal mode the protocol names `blocked(usage-limit)`, and the direct verdict is wired, not deleted. Recommendation: approve.
- **Q2. The doctor's Node twin in `observe-run-coverage`.** It re-implements run admission in Node and re-parses 295 MB, about 0.5 s per doctor run. The spec keeps that independence on purpose.
  - (a) Keep it and only make its parse typed.
  - (b) Drop the Node scan. The shared `run-layout/expected.json` fixture becomes the one proof.

  Recommendation: (b), because of the owner's rule of no deciding logic in Node at T0–T4.
- **Q3. Remove the scorecard sections that are constant or always zero** from `metrics harness`: `complexity`, `sessions`, `friction: "n/a (pre-F5)"` and `entropy.counts.frictions`. Also retire the unbuilt `coordination-session` contract. Nothing reads them, and `complexity` also reads about 494 k lines per call. Recommendation: remove.
- **Q4. Proposed additions (owner picks; none recommended now):**
  - A1: redact friction `detail` before append, or keep it in an untracked side file (RT-16). This is a leak class; nothing has leaked today. The existing `secrets` `mask` covers only declared secrets.
  - A2: a size cap on `result.json` in the run scan.
  - A3: a `friction --check` that names bad lines.
  - A4: a named `terminal:delivery-unknown:not-ready` reason.
- **Q5. Landing slot.** HARDEN self-lands 04a on fg-server2 after the Work cutover has landed, in a window agreed with WORK and TEST. The owner machine follows a guide at a time the owner names.

## 7. Red-team summary

All three High findings stand. RT-01, which the correctness seat calls B-A1, and RT-02 each still have an inferred half that becomes a red test first. RT-03 (B-O1) is reproduced end to end by the correctness seat. The red-team corrected the baseline on two points: Rust never names usage-limit in terminal mode, and there are seven Node wording lists, not two or three. No build defect was found on Windows or macOS for either crate. RT-06, the Windows eval appender failing on its second record, is a behaviour defect inferred from code and is fixed by the shard door.

## Unresolved questions

- Q1–Q5 above.
- Does holder-lock's own suite own "a live holder keeps the lock past 30 s"? The sub-plan checks this before retiring the 31 s test.
- Can `invokeHost` surface a host refusal code? F23's thin client depends on it, and the sub-plan checks it.
