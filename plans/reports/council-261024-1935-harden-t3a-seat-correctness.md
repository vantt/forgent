# HARDEN T3 part 04a council: correctness seat

HEAD `330c5242a` (main), 2026-10-24 19:35 to 19:50 (Asia/Saigon). Lens: correctness and stability (axes A, B, with F where a contract names an outcome wrongly). Read-only. The only file written in the repository is this report.

## What I ran

- Read every line of `packages/agent-protocol/rust/src/**`, the protocol call sites in `packages/run-supervisor/rust/src/supervise.rs` and `supervise/terminal.rs`, `packages/observe/rust/src/{friction,friction_cli,shard,store_lock,provider,lib}.rs`, `metrics_cli/{mod,coverage,runs}.rs`, the write paths of `eval_journal.rs`, `case_journal.rs` and `metrics_cli/snapshot.rs`, `sources/claude_transcripts.rs` (observations), `apps/fgos/src/main.rs` (root and stdin), `cli_projector.rs` (observe arms), `wiring/*`, and on the Node side `settle-attempt.mjs`, `provider-auth-failure.mjs`, `friction-client.mjs`, `invokeHost` (`src/util/host-bin.mjs`), `settlement.mjs:600-670`, `provider-capacity.mjs:958-1011`, `worker-artifacts.mjs:39-69`, `herdr-round.mjs:1-40,330-460`, `checkObserveFrictionMigrated` (`registrations.mjs:5860-5960`). I did not read `usage-parsers.mjs`, `provider-adapter.mjs` or `trust-store.mjs` line by line; I classified them from `rg` hits only.
- Read-only commands: `rg`, `git log -S`, `fgos friction show tsk-3ti </dev/null` and `fgos friction show work:tsk-3ti </dev/null`, `node -e` calls on the exported matchers of `provider-auth-failure.mjs` and on `recordFriction` against a nonexistent dir (it throws before any host call).
- Reproductions outside the repository: a scratch crate in the session scratchpad depending on `fgos-observe` and `fgos-work-state` by path, built with `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t3a-seat-correctness-target`. Every write went to temp dirs or a scratchpad copy of `.fgos/events*` and `.fgos/observe/friction`. A one-line Rust program under `strace` showed the syscalls of `writeln!`.
- Timing: one release-build run at load average 9.2 (1 min) / 15.3 (5 min) at 19:43.

## Part A: target shape

### Agent protocol (`fgos-agent-protocol`)

- **Authority.** It is the one place that turns what a CLI shows into a named outcome, in both launch modes: `ready`, `blocked(trust-dialog|login|usage-limit)`, `delivered`, `delivery-unknown`, `completed`, `needs-human`, `exited`. It also owns the provider wordings for a dead login and a used-up quota. Today it is that authority only for terminal readiness and delivery. The direct-mode verdict is never called (B-A1), and the terminal quota verdict is thrown away and re-derived in Node (B-A1, B-A2).
- **Contract and ports.** `agent-protocol.v1.json` and `terminal-outcomes.v1.json`. The port `AgentIo` keeps `send`, `screen`, `inspect`, `now_ms` and `pause`. `read` and `activity` have no caller (B-A6). The receipt `reason` carries the named outcome for both modes (`terminal:…` exists today; `direct:blocked:<reason>` is the missing half). That way Node consumes a name and never re-reads a screen or capture tail.
- **Rust/Node boundary.** No Node file decides an outcome. Node keeps:
  - account rotation and quarantine policy, which act on a named outcome (T5);
  - token-usage parsing (`usage-parsers.mjs`, not an outcome; T5 decides its future).

  Node budget for outcome naming after T4/T5 land: 0 lines.
- **Delete list.** See the delete table.
- **Doctor rows.** None of its own. `agent-cli-project-trusted` is a machine fact, as the brief says.
- **Size target.** Rust −60 to −100 lines: collapse the five identical direct structs and drop the dead port methods and `StdinPolicy`. Wiring the direct verdict in T4 adds about 15 lines in the supervisor. On the Node side, −66 (`provider-auth-failure.mjs`) and about −60 (`settle-attempt.mjs:84-129`), landing in T4/T5.

### Observe (`fgos-observe`)

- **Authority.** It is the one writer and reader of `.fgos/observe/<store>/<writerId>.jsonl` for friction, cases, evals and snapshots, and the one computer of metrics and the scorecard. Today the friction store has a weaker write and read discipline than the eval store in the same crate (B-O1, B-O2). Node also keeps a validation twin (B-O5) and a migration-cursor twin (B-O6).
- **Contract and ports.**
  - the `observe.*.v1.json` contracts;
  - `ObservationSource`, `WorkObservationSource`, `LegacyFrictionSource`, `CoverageScanner`, `UnitSummaryScanner`;
  - one shard append helper and one bounded shard reader for every store. These already exist as `eval_journal.rs:open_append_shard` and `read_bounded_line`; friction, snapshot and case should use them.
- **Rust/Node boundary.** Node keeps only `invokeHost` calls: `recordFriction` and `resolveFriction` build argv and log a fault on host failure. No layer, disposition, doc-type or reason lists stay in Node. Node budget: `friction-client.mjs` about 60 lines and 2 exports, down from 194 lines.
- **Delete list.** See the delete table. The lazy legacy migration on every write retires after its one release (owner: fences and drains live one release).
- **Doctor rows.** Four today. Keep three:
  - `observe-dir-writable`;
  - `observe-host-resolvable`, with its probe changed from `friction ping` to a read so that an unreadable store fails it;
  - `observe-run-coverage`, whose cost is the speed seat's question.

  Retire `observe-friction-migrated` together with the lazy migration, or back it by Rust (proposed addition P1).
- **Size target.** Rust friction −150 to −200 lines: the migration path, three subject-kind match copies (`friction.rs:300-307,351-358,438-444`) and the reader replaced by the shared one. Node −130 lines (client) and −100 lines (doctor twin). The tests are covered in the tests table.

## Part B: findings

| Id | Axis | Severity | Repro | file:line | What goes wrong | Fix shape |
|---|---|---|---|---|---|---|
| B-O1 | A, B | **High** | reproduced | `shard.rs:145-153` (`?` on open/`lines()`), `friction.rs:141` (`read_all_json(...).unwrap_or_default()`), `friction.rs:291,342` (`let _ = run_lazy_migration`) | One unreadable friction shard breaks the store. The cause can be invalid UTF-8, for example a torn write that cuts a multi-byte Vietnamese char (see B-O2), or a shard removed between `read_dir` and `open`. Then `list`, `show` and `rank` all fail (`Err("stream did not contain valid UTF-8")`). Worse, the migration reads the store as **empty**, so every following `record`/`resolve` re-appends every legacy record again. Repro: 3 legacy records became 9 after two writes. On this repo that is 752 duplicated records per friction write, and they are git-tracked. | Use one bounded line reader for all shards: reuse `eval_journal.rs:read_bounded_line`, report invalid lines and keep going. The migration fails closed when the store cannot be read: it returns `Err` and never treats an unreadable store as empty. `record`/`resolve` print a named warning instead of `let _`. Extend the owning unit tests in `friction.rs`. |
| B-O2 | A, B | Medium | reproduced | `friction.rs:124` and `metrics_cli/snapshot.rs:77` (`writeln!`), `shard.rs:158` (skips unparsable lines silently); kill source `src/util/host-bin.mjs:10,94-100` (5 s `execFileSync` timeout) vs `store_lock.rs:10` (5 s lock wait) | `writeln!` on a `File` issues two `write(2)` calls, the line and then `"\n"` (strace: `write(3, "{\"a\":1}", 7)`, `write(3, "\n", 1)`). A host killed between them leaves an unterminated line. The **next** record is appended onto it, the glued line fails to parse and is dropped silently. Repro: `record(b)` returned `ok:true` while `list` showed only `a`. Node kills the host after 5 s, exactly the length of the lock wait, so the kill lands at the same moment the host acquires the lock. The named `observe-lock-timeout` never reaches Node; Node reports a generic exec error. | Use one append helper: a single `write_all(line + "\n")` (as `case_journal.rs:219-225` and `eval_journal.rs:313-315` do), and heal a shard that does not end in `\n` before appending. Make Node's timeout larger than the lock wait, or have the host give up before Node kills it, so the named code survives. The lock budget is T1's, so take the numbers from the T1 lock spec. |
| B-O3 | A | Medium | reproduced | `friction_cli.rs:38-39` (no lock) vs `friction.rs:290,341` (lock) | `friction migrate` runs `run_lazy_migration` without the store lock. Two migrations, or a migration racing a `record`, both read the same "already migrated" set and both append. Repro: 3 legacy records became 6. `doctor` itself tells users to run `friction migrate` while runners record friction. | The migration takes the lock itself, or takes a `&StoreLockGuard` argument so the callers that already hold the lock do not take a second kernel lock on a new open file description (that would time out against itself). |
| B-O4 | A | Medium | reproduced | `friction.rs:471-475` (`show`), `friction.rs:524-527` (`rank`) | Whether a record is settled is decided by **string** order of `ts`: a resolve settles every record whose `ts` is strictly smaller. Reproduced failures:<br>1. equal stamps never settle (`FGOS_NOW` set: record then resolve gives `unsettled:1`);<br>2. migrated legacy stamps without millis sort after later millis stamps (`…10:00:00Z` record vs `…10:00:00.500Z` resolve gives `unsettled:1`).<br>Inferred: shards are git-tracked across three machines (`observe.md:91`), so clock skew makes a resolve made on a lagging machine miss the records it was meant to settle. | Compare parsed instants, not strings. Within one writer shard, file order is the causal order and decides ties. Cross-machine skew remains and should be written into the spec as a known limit. |
| B-O5 | E, F | Medium | reproduced | `src/observe/friction-client.mjs:12-28` vs `friction.rs:13-30` | Node keeps its own copy of the layer, disposition, doc-type and reason lists, and the copies have drifted: Node refuses `layer: "spec"`, which Rust accepts (`node -e` printed `invalid layer "spec"`). Node also decides defaults (`layer 'state'`, `producer 'work'`, `errorClass 'unknown'`, `:64-88`). | Delete the Node lists; Rust is the one validator. Node keeps argv building and fault logging. |
| B-O6 | B, F | Medium | reasoned (Node `readFileSync(…, 'utf8')` never throws on bad bytes; JSON errors are skipped) | `registrations.mjs:5860-5960`; `observe-host-resolvable` probes `friction ping` (reads nothing) | The doctor re-implements the migration cursor in Node by reading 15.5 MB of events. It passes while the Rust store is unreadable (the B-O1 state) and while legacy records are duplicated (B-O1, B-O3). No doctor row sees a broken friction store. | Point the `observe-host-resolvable` probe at a read route (`friction rank --limit 1`), so it fails when the Rust store cannot be read. Retire the Node cursor twin with the lazy migration (one release), or replace it with P1. |
| B-O7 | B, C | Medium | reproduced (timing) | `friction.rs:291,342`, `packages/work-state/rust/src/legacy_friction.rs` | Every `friction record`/`resolve` re-reads the whole legacy event log under the store lock, even though the migration finished long ago (doctor: all 752 migrated). Measured on a scratch copy, release build: legacy read 51.5 ms, `record` 54-55 ms; on this repo that is 11.3 MB plus 4.2 MB across 91 files. The cost grows with the log, holds the lock that case/eval/snapshot wait on, and reads `.fgos/events*.jsonl`, the files the WORK/ES cutover will move: **this collides with the cutover**. | Retire the lazy migration from the write path. The migration stays as the explicit, locked `friction migrate` for one release (owner: fences and drains live one release), and then it is deleted. Coordinate with WORK/ES on the timing. |
| B-O8 | F, G | Low | reproduced | `friction_cli.rs:119-120` | When `--subject` is absent, `show` takes the first argument without a leading dash, which can be the value of a flag (`show --dir /x work:a` reads `/x`). The baseline's `friction show tsk-3ti` timing measured an error path: exit 1, `invalid subject "tsk-3ti"`. | Parse flags first, then take the positional. Re-take that baseline row with `work:tsk-3ti`. |
| B-O9 | A, F | Low | inferred | `apps/fgos/src/main.rs:128-148` vs `src/util/host-bin.mjs:85-90` | Node always passes the main checkout as `--dir`, while the Rust host walks up to the nearest `.fgos`. Twenty worktrees have `.fgos/observe/friction/*.jsonl`. A direct `fgos friction record` run in a worktree writes a store that Node and the doctor never read. | One root rule in Rust (main checkout, as Node does). Node then stops passing `--dir`. |
| B-A1 | A, E, F | **High** | inferred | Direct: `supervise.rs:21,209,252` use only `activity_from`; `rg` finds no `.classify(`, `stdin_policy(`, `Outcome::`, `BlockedReason` outside the crate; `git log -S'adapter.classify'` finds nothing (never wired). Terminal: `terminal/mod.rs:593-600` (quota → `NeedsHuman`), `terminal-outcomes.v1.json` `wire.usageLimit`; Node: `settle-attempt.mjs:84-129` | **The agent protocol is not the single outcome authority.**<br>- Direct mode: the Rust verdict `blocked(login\|usage-limit)` described as "implemented" in `agent-protocol/spec.md:64-68` is never consulted. Node re-derives it from the stderr tail (`settlement.mjs:633-643`).<br>- Terminal mode: Rust sees a quota screen and names it `needs-human`, losing the reason. At settle time Node reads the pane **again** and re-derives `provider-limit` with its own word list.<br>- If the pane changed or cleared between the stop and the settle read, which the settle comment allows (`:82`: "a screen that cannot be read is no evidence"), a provider limit settles as `blocked` (wait for a person) and the account is not rotated. | The receipt carries the Rust verdict in both modes:<br>- terminal: `terminal:blocked:usage-limit` (the v1 `results` table already has `usage-limit`; the terminal contract's exclusion is lifted, and every consumer moves in the same change);<br>- direct: the supervisor calls `classify` once at finish and writes `direct:blocked:<reason>`.<br>Node maps the reason to `provider-limit`/`blocked` by name only; `paneScreenOf`, `screenSaysProviderStop` and `SCREEN_LIMIT_PATTERNS` are deleted. This is a contract decision for the big lead; the wiring is T4, the Node deletion T4/T5. |
| B-A2 | A | Medium | reproduced (matcher level) | `direct/mod.rs:118-149` (Rust login list incl. `no default model selected`) vs `provider-auth-failure.mjs:19-28`; window `terminal/mod.rs:230-231` (bottom 12 lines) vs `settle-attempt.mjs:116` (tail 5) | The two sides decide on different words and windows:<br>- Node `matchAuthFailureLine('No default model selected')` gives `null`, while Rust says login;<br>- a login line 6 lines from the bottom: Rust says `blocked:login`, Node with a 5-line tail says `null`.<br>Either way the receipt says `terminal:blocked:login` and Node settles `blocked` instead of `provider-limit`. | Fixed by B-A1: one list in Rust, and Node reads the name. Until then, any wording change must land on both sides in one commit. |
| B-A3 | A | Medium | inferred | `settle-attempt.mjs:103-128` | Generic patterns (`rate limit`, `try again later`, `usage limit`, …) over the last 15 screen lines are applied to **every** `terminal:blocked\|needs-human`, including `blocked:trust-dialog`. A trust dialog whose screen holds such words from earlier conversation settles as `provider-limit`, and the caller rotates to another account that hits the same dialog. | Removed by B-A1. A trust dialog is named by Rust and never re-judged. |
| B-A4 | A, F | Low | reproduced (reading) | `terminal/mod.rs:386-389` | In the unruled wait, a failed `screen()` read returns `Readiness::Ready`: an error path is named a success, and the brief is typed into a pane that could not be read. | Return `Unverified` at minimum (an honest name, same wire outcome), or `NotReady` (nothing typed). The choice is the delivery owner's. |
| B-A5 | A | Low | inferred | `herdr-round.mjs:341,351-361` (refuses only a stale `result-1.json`) vs `direct/mod.rs:68-81` + `terminal/mod.rs:169-182,507,585` (any newest `result-N`); `worker-artifacts.mjs:39-60` (Node searches 3 dirs + `agent-result.json`) | Rust and Node can disagree on whether a result exists. A stale `result-2.json` passes the Node guard, and Rust then reports `delivered`/`completed` at once. A worker writing `agent-result.json` or into `worker-output/` is seen by the Node settle step but never by the Rust supervisor. | One rule in the protocol: `newest_result` over `launch.outboxDir` only. The Node guard and the claim lookup use the same rule (T5). |
| B-A6 | D, E | Low | reproduced (reading) | `port.rs:37-39` (`read`, `activity`: no caller), `outcome.rs:28-52` (`StdinPolicy` unused: Node hard-codes `stdinPolicy: 'null'`, `direct-launch.mjs:200`; `Activity::Event` vs `Output` read only through `is_active`), `direct/codex.rs:11-15` (override returns the default), `direct/{claude,agy,pi,omp}.rs` (identical) | Dead port surface. The direct adapters are five copies of the default, while the terminal side already uses one `Profile` table. | Delete per the delete table; the direct adapter becomes one `match` (generic vs named-blocks). |
| B-A7 | F, G | Low | reproduced (reading) | `supervise/terminal.rs:54,665,709,742` vs `terminal-outcomes.v1.json` `mapping.toReceiptReason`; `settle-attempt.mjs:132-136` | Four receipt reasons are outside the contract: `terminal:agent-not-started`, `result-unreadable`, `completed-no-exit`, `foreground-not-agent`. The stop message tells a person to "grant trust" for a `needs-human` that came from a quota screen. | List the reasons in the contract. The message follows the named reason (falls out of B-A1). |

## Migration table

| Node part | What it decides | Move? | Reason | Order | Receiving layer | Node budget after |
|---|---|---|---|---|---|---|
| `settle-attempt.mjs:84-129` (`paneScreenOf`, `SCREEN_LIMIT_PATTERNS`, `screenSaysProviderStop`, `terminalAdapterOutcome`) | provider stop vs person, from a re-read screen | yes | twin of the protocol verdict; wrong under screen change (B-A1, B-A3) | 2 (after T3 fixes the reason vocabulary) | T4 (supervisor writes the reason; step maps names) | 0 lines of matching; one name→outcome map (~5 lines) |
| `provider-auth-failure.mjs` (66) | dead-login and quota wordings | yes | second word list, already drifted (B-A2) | 3 | T5 (settlement, provider-capacity, account-rotation consume `direct:`/`terminal:` reasons) | 0 (file deleted) |
| `settlement.mjs:633-652` (exit-on-dead-credential and exit-on-quota from stderr tail) | direct-mode blocked verdict | yes | Rust `classify` already decides it, unwired (B-A1) | 3 | T4 wires `classify` → receipt; T5 deletes | name lookup only |
| `provider-capacity.mjs:966-993` | quarantine kind from wording | partly | policy (quarantine) stays Node at T5; the wording match moves | 3 | T5 | policy only |
| `herdr-round.mjs:351-361` stale-result guard; `worker-artifacts.mjs:39-60` | which file is "the result" | yes (rule), no (call site) | must match `newest_result` (B-A5) | 4 | T5 | thin call |
| `usage-parsers.mjs` (199) | token usage, not an outcome | not in T3 | not an outcome decision; I did not read it fully | — | T5 decides | unchanged |
| `trust-store.mjs` (634) | seeds trust entries (side effect), not an outcome | no | it prevents the dialog; it never names it | — | T5 | unchanged |
| `friction-client.mjs` validation and defaults | which layers/reasons are valid | yes | drifted twin (B-O5) | 1 (T3) | T3 (Observe) | ~60 lines, 2 exports |
| `checkObserveFrictionMigrated` (`registrations.mjs:5860-5960`) | migration cursor | yes / retire | twin; blind to B-O1/B-O3 (B-O6) | 1 (T3), with lazy-migration retirement | T3 | 0 (row retired) or a thin host call (P1) |

## Delete table

| What | Where | Why | Owning proof after |
|---|---|---|---|
| `AgentIo::read`, `AgentIo::activity` and their stubs | `port.rs:37-39`; `supervise/terminal.rs:482-488`; `tests/terminal_vectors.rs:103-107,497-501` | no caller | none needed (behaviour gone) |
| `StdinPolicy`, `DirectAdapter::stdin_policy`, codex override | `outcome.rs:28-35`, `direct/mod.rs:25-27`, `direct/codex.rs:11-15` | Node hard-codes `null`; Rust value never read | gate argv tests (T4) |
| Five direct adapter structs | `direct/{claude,codex,agy,pi,omp}.rs` | identical; one `match` in `adapter_for` | `direct_vectors.rs` |
| `Activity::Event` vs `Output` distinction (if no consumer appears) | `outcome.rs:39-52`, `direct/mod.rs:83-96` | only `is_active` is read | `direct_vectors.rs::activity_counts_growth_and_events` (assert active/quiet only) |
| Node screen re-judging | `settle-attempt.mjs:84-129` | B-A1 | `terminal_vectors.rs` + one settle wiring proof |
| `provider-auth-failure.mjs` + `test/runner/provider-auth-failure.test.mjs` | Node | B-A2 | `direct_vectors.rs` / `terminal_vectors.rs` |
| Node friction validation lists | `friction-client.mjs:12-28,56-112,152-165` | B-O5 | `friction.rs::test_friction_validation_errors` |
| Lazy migration on write (after one release: then the whole `run_lazy_migration`, `LegacyFrictionSource`, `legacy_friction.rs`) | `friction.rs:129-280,291,342`; `work-state/rust/src/legacy_friction.rs`; `wiring/friction_sources.rs` | B-O7; one-release drain | `friction.rs::test_friction_lazy_migration_and_deduplication` retires with it |
| Three subject-kind `match` copies | `friction.rs:300-307,351-358,438-444` | one `SubjectKind::as_str` | existing friction tests |

## Doctor table

| Row | Keep? | Correctness note |
|---|---|---|
| `observe-dir-writable` | keep | fine |
| `observe-host-resolvable` | keep, change probe | `friction ping` reads nothing; probe a read so B-O1 fails the row (B-O6) |
| `observe-friction-migrated` | retire with lazy migration (or P1) | Node twin; passes on an unreadable or duplicated store |
| `observe-run-coverage` | keep (speed seat to judge cost) | ~1 s host scan + Node scan per doctor run; no correctness defect found |
| `agent-cli-project-trusted` | out of this layer | machine fact (codex trust entry), not examined further |

## Tests table

| Behaviour | Owning proof | Duplicates / action |
|---|---|---|
| Login/quota wording → direct verdict | `agent-protocol/rust/tests/direct_vectors.rs` | `test/runner/provider-auth-failure.test.mjs` (Node twin) retires with the Node matcher (T5) |
| Terminal outcomes (ready, delivered, blocked, needs-human) | `tests/terminal_vectors.rs` (virtual clock, 0.32 s) | settle-step screen cases in `test/run-supervisor/attempt-steps.test.mjs` retire when settle reads names (T4) |
| Friction record/resolve/settle, torn line, unreadable shard, lock on migrate, instant compare | `observe/rust/src/friction.rs` unit tests (extend; no new file) | none today for B-O1..B-O4 |
| Observe lock path and exclusion | `store_lock.rs::acquire_excludes_a_second_taker_and_release_frees_it` | `tests/store_lock_multiprocess.rs`:<br>- retire `a_taker_times_out_after_five_seconds_on_a_long_holder` (5 s; owned by holder-lock `tests/multiprocess.rs:62` `wait_ms_times_out_and_nothing_is_kept`);<br>- retire `a_sigkilled_holder_frees_the_lock_at_once` (owned by holder-lock `multiprocess.rs:46`);<br>- retire `a_write_longer_than_the_old_expiry_is_not_stolen` (31 s real sleep; a kernel lock has no TTL by construction and the old TTL path is a tombstone, so the behaviour is holder-lock's).<br>Keep `a_taker_waits_for_a_holder_that_releases` and `processes_sharing_a_writer_id_never_interleave_snapshot_lines` (Observe's own). Saves about 34 s of the binary's 35 s. |
| Time-based waits | answered: `store_lock_multiprocess.rs` 35 s is **test sleeps**, not a real wait in Observe code (line 169 `sleep(31 s)`, line 143 5 s timeout) | `FsOutbox` 20 ms real sleep (`terminal/mod.rs:160,179`) is a product wait, not a test wait; acceptable |
| Moves down a layer | `test/rust-host/observe-store-lock.test.mjs` (Node) should be at most one wiring proof over the Rust lock | check that it does not repeat the timeout/kill cases |

## Proposed additions (owner picks; not part of the fixes above)

- **P1. A read-only "legacy pending" count in an existing read route.** It would go in `friction ping` or `friction list` metadata.
  - Problem: the doctor re-implements the migration cursor in Node (B-O6).
  - Evidence: `registrations.mjs:5860-5960` reads 15.5 MB.
  - Benefit: the doctor row becomes a thin host call.

  Needed only if the owner keeps the lazy migration past one release. Otherwise retire the row.
- **P2. A `friction repair` (or `--check`) that names invalid lines with file:line, as the eval store already does (`eval_journal.rs` invalid list).**
  - Problem: after B-O1 there is no tool to find the bad line.
  - Benefit: an operator fixes the store by hand, as with evals.

## Rejected hypotheses

- **"Rust's terminal adapter decides `blocked(usage-limit)` at `terminal/mod.rs:597`"** (baseline §6.2). Rejected: it returns `NeedsHuman`, as the terminal contract says; `TerminalBlock` has no usage-limit variant. That loss of the name is the real finding (B-A1).
- **"`metrics coverage` scans more than once per call."** Rejected: `scan_coverage` calls `scan_runs` once (`run-result/rust/src/lib.rs:425-434`). `metrics runs` does over-read: it collects all four sources (both run-result and unit-summary walk the assignments, plus all Claude transcripts with no `--since`, about 932 MB on this machine), then keeps only `run-result` observations (`scorecard.rs:214`). That is a speed question; I leave it to the speed seat.
- **"A dead holder keeps the observe lock."** Rejected: the lock is a kernel lock from holder-lock (`store_lock.rs:1-5`).
- **"`record`/`resolve` writers interleave lines."** Rejected: each takes the store lock and appends to its own writer shard. Only the unlocked `migrate` path can interleave (B-O3).
- **"settle-attempt mis-parses Rust reason strings."** Rejected: the regexes match `early_reason`'s format exactly (`supervise/terminal.rs:538-546`). The defect is re-deriving the verdict, not parsing it.
- **"Settlement contradicts itself on quota vs login precedence."** Rejected after reading `provider-capacity.mjs:972-975` and `settlement.mjs:638-652`. Both use the same order: a login line in the tail, then a quota line in the tail, then a login line anywhere.
- **"The terminal per-CLI adapters are many copies."** Rejected for terminal: one shared state machine plus a `Profile` table (`terminal/mod.rs:186-228`). Confirmed for direct (B-A6).

## Notes for the big lead

- B-A1 needs a contract decision. Adding `usage-limit` to the terminal `blocked` reasons supersedes the explicit terminal-contract line `wire.usageLimit`. The direct half is wiring code that already exists.
- B-O7 (retire lazy migration) touches the files the WORK/ES cutover will move. Sequence it with WORK.
- B-O1 and B-O2 compound. A torn write that cuts a multi-byte char gives the store B-O1's failure: reads fail and every later write re-migrates the legacy records. Fix both in one change through the shared eval reader and writer.

Status: DONE_WITH_CONCERNS
Summary: Two High findings. First, an unreadable friction shard makes every read fail and every write re-append all 752 legacy records (reproduced). Second, the agent protocol is not the single outcome authority: the direct verdict was never wired, and the terminal quota verdict is discarded and re-derived in Node (inferred). Five Medium findings were reproduced (torn append, unlocked migrate, string-ordered settlement, drifted Node validation, per-write legacy scan), plus two Medium twins/drift on the protocol side and a doctor blind spot.
Concerns/Blockers: B-A1's High is inferred, because I did not observe a pane screen changing between stop and settle. I classified `usage-parsers.mjs`, `provider-adapter.mjs` and `trust-store.mjs` from `rg` only, without reading them line by line. The baseline's `friction show tsk-3ti` timing measured an error path.
