# HARDEN T3 part 04a council: red-team seat

HEAD `330c5242a` (main), 2026-10-24 19:35 to 19:45 (Asia/Saigon). Seat: red-team (adversarial). Read-only, except this report and some scratch files in the session scratchpad.

## What I ran

| Command | Purpose | Writes |
|---|---|---|
| `rg`, `sed`, `grep`, `wc`, `git ls-files`, `git check-ignore`, `git log -S` | reading | none |
| `node --input-type=module -e` importing `classifyProviderCapacityFault` (`provider-capacity.mjs`) with crafted screen text | reproduce RT-01 at the classifier | none (pure function) |
| `node -e` calling `recordFriction(..., {layer:'spec'})` | reproduce RT-12; Node validation throws before any host call | none |
| `fgos friction list --dir <scratch root>` with crafted shard files under the scratchpad | reproduce RT-03 and RT-04 on a throwaway root (`list` reads only, no lazy migration) | scratchpad only |
| A scratch crate in the scratchpad that depends on `fgos-agent-protocol`; `mkfifo outbox/result-1.json`; `timeout 5 fifo-probe` | reproduce RT-02 | scratchpad plus my private target dir |
| `fgos metrics runs|harness|cover…age`, timed with `/usr/bin/time`, with and without `CLAUDE_CONFIG_DIR=/nonexistent` | split the scan cost | none (read verbs, source read first) |
| `strace -c -f` on the same three verbs | count syscalls | none |
| `cargo check -p fgos-agent-protocol` and `-p fgos-observe --all-targets`, each for `--target x86_64-pc-windows-msvc` and `aarch64-apple-darwin` | build check on Windows and macOS | `/home/vantt/projects/forgent-worktrees/t3a-seat-redteam-target` |

Load average was 13.8 to 17.8 during the timings, because TEST was running on the shared machine. Each timing below sits next to that load figure. I ran no `npm test`, no `cargo test`, and no `fgos` verb that writes.

## Challenges to the baseline and the brief

1. **Baseline §6.2 is wrong.** The Rust terminal adapter never decides `blocked(usage-limit)`. At `terminal/mod.rs:595-599`, `detect_completed` returns `TerminalOutcome::NeedsHuman` for a quota line. `TerminalBlock` has no usage-limit variant at all (`terminal/mod.rs:27-30`), and the contract says so on purpose (`terminal-outcomes.v1.json:15`). So the protocol **throws away** a distinction it had already made, and Node then guesses it back from screen text (RT-08, RT-01).
2. **The brief asks whether the protocol is "the single place that turns output into an outcome". In direct mode it is not used at all.** The supervisor reads only `activity_from` from the direct adapter (`supervise.rs:209`, `:245`) and `newest_result` (`supervise.rs:92`). `DirectAdapter::classify`, `Outcome`, `BlockedReason`, `StdinPolicy`, `ExitInfo`, `stdin_policy()` and `names_blocks()` have no production caller. I checked with `rg` over every `*.rs` outside `packages/agent-protocol`; the only hits are in `tests/direct_vectors.rs`. Every direct-mode outcome is decided in Node (`settlement.mjs:633-652` over `provider-auth-failure.mjs`) (RT-07).
3. **The baseline counted 2 to 3 Node word lists; there are 7.** The baseline missed `provider-capacity.mjs:948-956` (`AUTH_ANCHOR_PATTERNS`), `provider-credential-probe.mjs:24` (`QUOTA_PATTERN`) and `provider-account-probe.mjs:26-27` (`QUOTA_PATTERN`, `TRUST_PATTERN`). The full table is under RT-10.
4. **Scan cost, re-measured.** At load 16.5, `metrics runs` took 1.28 s. With transcripts switched off it took 1.11 s, and `cover…age` took 1.05 s. So about 0.15 s is the Claude transcript read: 835 MB under `~/.claude/projects/-home-vantt-projects-forgent`, filtered line by line on `"usage"`. The rest is the run-result scan. The baseline's "445 assignment directories" is the top-level count; the scan sees 535 run directories (the host reports `runDirsSeen: 535`). The scan makes about 15 k syscalls and spends 0.04 s in the kernel, so the second it costs is user-space parsing in `fgos-run-result`, not I/O. That crate is outside this part.

## Part A: target shape (red-team constraints on each component)

### Agent protocol (`packages/agent-protocol/rust`)

- **Authority.** It is the one place that turns a CLI's output, screen or outbox into a named outcome **together with the evidence line**, in both modes. No Node code matches provider, CLI or screen wording.
- **Contract change, without making it bigger.** The enum `blocked(usage-limit)` already exists in `agent-protocol.v1.json:15`. The terminal adapter starts using it instead of `needs-human`. The supervisor's receipt reason then carries `terminal:blocked:usage-limit`, and in direct mode the receipt carries the outcome `classify` returns. The receipt carries the matched line so a person can read it. Node maps reason → settlement code with a lookup table; there is no regex over the text.
- **Outbox reads are hostile input.** Results are read no-follow and non-blocking, regular files only, with a size cap, through the existing door `fgos_durable_file::open_beneath(..).read(max)` (`packages/durable-file/rust/src/beneath.rs:237-255`; Unix only, so Windows needs a type and size check on the opened file).
- **Time.** All time passes through `AgentIo::pause`. `FsOutbox`'s own `thread::sleep` goes (RT-17).
- **Delete list.** See the delete table. The direct adapter is either wired in (preferred, because the owner wants no deciding logic in Node) or deleted. It must not stay as untested-in-production code that only looks authoritative.
- **Doctor.** No row of its own. `agent-cli-project-trusted` stays a machine fact; I agree it is not a code defect.
- **Size target.** Rust about −40 (Codex override, `to_json` if it stays unused, `names_blocks`), plus about +30 for the bounded outbox read and the usage-limit variant. Node about −120 after T4/T5 take over the word lists.

### Observe (`packages/observe/rust`, `src/observe/*`)

- **Authority.** The friction, case, eval and snapshot journals, and the scorecard.
- **One shard door.** A single appender and a single reader for all four stores, built from `eval_journal.rs`'s hardened pair (`open_append_shard` at `:173`, `read_bounded_line`). The three unhardened copies are deleted: `friction.rs:119-127`, `case_journal.rs:214-224`, `snapshot.rs:68-82`, plus `shard.rs:163-197`'s reader. Each line is written with one `write_all`. A bad line is skipped and named, never fatal and never silent (RT-03, RT-04, RT-05).
- **Node budget.** `friction-client.mjs` goes from 194 to about 70 lines, with no validation lists: Rust validates and names the error.
- **Doctor.** Keep the four rows. No new row. `observe-friction-migrated` must read through the same reader as the host (RT-19).
- **Size target.** Rust about −150 (three appenders and a reader collapse into one), Node about −120.

## Part B: findings

Severity follows proposal §2.2. "R" means reproduced; "I" means inferred from `file:line`.

| Id | Axis | Sev | R/I | file:line | What goes wrong | Fix shape |
|---|---|---|---|---|---|---|
| RT-01 | A, E | High | R (classifier half), I (settle half) | `src/run-supervisor/steps/settle-attempt.mjs:103-128`; `src/runner/dispatch/settlement.mjs:633-652`; `src/runner/dispatch/provider-capacity.mjs:967-976` | **Text the agent controls can quarantine an account.** A terminal attempt that stopped as `terminal:needs-human` or `blocked` (for example the detector showing a permission prompt) is re-read from the **later** pane screen at settle time. Any of the last 15 lines that matches `/usage limit/i`, `/rate limit/i`, `/try again (later\|in \d)/` and so on makes it `provider-limit`. The capacity classifier then runs the **unanchored** auth list over the **whole** stderr plus screen (`matchAuthFailureLine(text)` with no tail limit). Reproduced: `classifyProviderCapacityFault({provider:'anthropic', adapterOutcome:'provider-limit', stderr:<screen containing "…when the user is not logged in">})` returns `{action:'quarantine', reasonCode:'auth-token', quarantineKind:'manual-clear'}`, which keeps the account out until a person clears it. A line with "rate limit" gives a temporary quarantine. The comment at `settle-attempt.mjs:100-101` ("a working agent's own text never counts") is false: the brief echo and the agent's own lines are on that screen. | The protocol names `blocked(usage-limit\|login\|trust-dialog)` with its evidence line in the receipt (RT-08). Node maps the reason through a table, with no regex. Delete `SCREEN_LIMIT_PATTERNS` and the screen re-read. Receiving layers: T4 (settle step, receipt), T5 (settlement, capacity). |
| RT-02 | A, B | High | R (protocol), I (supervisor hang) | `packages/agent-protocol/rust/src/terminal/mod.rs:151-182`; consumer `packages/run-supervisor/rust/src/supervise/terminal.rs:524-534`, `:697-703` | **A FIFO in the outbox hangs the supervisor.** `FsOutbox::newest_complete` and `newest_unreadable` call `std::fs::read` on whatever `result-<N>.json` is: a FIFO, a symlink to anywhere, or a file of any size. Reproduced: with `mkfifo outbox/result-1.json`, `newest_complete()` was still blocked after 5 s (`timeout` exit 124). The terminal supervisor is single-threaded and runs its watch (deadlines, cancel, heartbeat) only inside `pause`, so a blocked read stops every tick. A multi-GB result is read twice per poll. The worker writes its own outbox, so this is input the worker controls. | Read through `fgos_durable_file::open_beneath` plus `read(max)` (no-follow, `O_NONBLOCK`, regular files only; it already exists). On Windows, check the type and cap the size. One proof in `terminal_vectors.rs` (FIFO and oversized file give `None`, not a hang). |
| RT-03 | A | High | R (read failure), I (duplication) | `packages/observe/rust/src/shard.rs:177-178`; `friction.rs:141`, `:291`, `:342` | **One bad byte stops friction reads and re-migrates everything.** One invalid UTF-8 line in any friction shard (a torn write in the middle of a Vietnamese `detail` is enough) makes `read_all_json` fail. Reproduced: `friction list` gives `stream did not contain valid UTF-8` for the whole store. `run_lazy_migration` does `read_all_json(..).unwrap_or_default()`, so it then sees **no** migrated pairs and appends all 752 legacy records again on the next `record` or `resolve`. Its error is discarded too (`let _ = run_lazy_migration`). | The one shard reader handles bad lines per line and names them, as `eval_journal` already does. Migration refuses on a reader error instead of defaulting to empty. |
| RT-04 | A | Medium | R | `shard.rs:174-191`; `friction.rs:123-125`, `snapshot.rs:81` (`writeln!`) | **A torn line swallows the next record silently.** Reproduced: a shard holding a torn line, then one whole record, lists 0 of the 2. They join into one unparseable line, which is dropped without a word. `writeln!` on a `File` can issue more than one `write`. Reads have no line-length cap. | Write the line and `\n` in one `write_all` (as `case_journal.rs:220-223` does). Use the bounded reader from `eval_journal`. |
| RT-05 | A | Medium | I | `friction.rs:119-127`; `case_journal.rs:214-224`; `metrics_cli/snapshot.rs:70-76`; `shard.rs:174` (`is_file` follows links) | **Symlinks are followed in three of the four stores.** The friction, case and snapshot appenders and the shared reader follow symlinks; only the eval store refuses them (`eval_journal.rs:144-215`). `.fgos/observe/**` is git-tracked (`git ls-files` lists the friction, snapshot and eval shards), and git stores symlinks. So a merged branch can plant `.fgos/observe/friction/pid-<N>.jsonl → <file outside the repo>`, and the next record appends JSON lines to the target. | The one hardened shard door (Part A). |
| RT-06 | A (Windows) | Medium | I (compile only) | `eval_journal.rs:206-219` | On Windows (no `O_NOFOLLOW`), the eval appender sets `create_new(true)`. So a writer's **second** `metrics eval record` fails with AlreadyExists. Both crates pass `cargo check` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`, with no warnings from these two crates. | On Windows: open, then check on the opened handle that it is a regular file and not a reparse point. |
| RT-07 | E, F, D | Medium | R (by `rg`) | `packages/agent-protocol/rust/src/direct/mod.rs:89-132`; `outcome.rs:7-58`; `direct/codex.rs:12-14`; spec `docs/platform/agent-protocol/spec.md` §4 and §8 | **The direct-mode outcome machine is dead in production.** The spec says `blocked(login\|usage-limit)` are facts the controller acts on; in fact no production code calls `classify`. Node re-derives them (`settlement.mjs:633-652`). Also `Codex::stdin_policy` repeats the default exactly. | Wire it: the supervisor calls `classify` at exit and writes the outcome and its evidence into the receipt (T4). Node `exitedOnDeadCredential` and `exitedOnQuota` are then deleted (T5). If the owner declines, delete the direct classify and its vectors. |
| RT-08 | F, E | Medium | R (by reading) | `terminal/mod.rs:595-599`; `terminal-outcomes.v1.json:15`; `supervise/terminal.rs:538-543` | A quota screen is reported as `needs-human`. The usage-limit fact is lost at the boundary, and that loss is the reason RT-01's regexes exist. The wire shape `TerminalOutcome::to_json` (`mod.rs:54-67`) is used only by tests; the receipt uses the supervisor's own `terminal:<x>:<y>` strings. So the "Rust reason strings" that Node regex-matches are owned by T4, not by the protocol. | Report `Blocked(UsageLimit)` (the enum value exists in v1). Have one function in the protocol crate render the reason the receipt carries. Change every caller in the same pass (L10). |
| RT-09 | A | Medium | I | `direct/mod.rs:185-216` (`contains`, unanchored); `terminal/mod.rs:247-261`, `:230-235` | **Unanchored login matching.** Login wordings are matched as substrings anywhere in the bottom 12 screen lines, which include the echoed brief and the agent's own text. Quota wordings are anchored to the line start. When the detector says `blocked` (for example a permission prompt showing a command that contains "not logged in"), the outcome becomes `blocked(login)` instead of `needs-human`. With RT-01 this escalates to a credential quarantine. | Anchor the login wordings the same way, or read only the CLI's own error region. Add one vector per CLI. |
| RT-10 | E | Medium | R (`rg`) | see the table below | **Seven word lists for "provider cannot serve", and they disagree** (for example `use /login` against `run /login`; `/trust/i` alone at `provider-account-probe.mjs:136`). When a provider CLI changes its wording, the Rust side fails safe (no match gives `needs-human` or the idle timeout), while the wide Node lists fail unsafe (a false provider-limit). | Rust owns all of them. The probes (T5) ask the protocol through the host; this is a cold path, and the owner allows a host route there. |
| RT-11 | B | Low | I | `terminal/agy.rs:3-6` | The agy start-banner marker is "synthesized from the backlog description", not taken from a captured screen. If the wording differs, the banner is never dismissed, and the outcome is `delivery-unknown` after the ready wait. That is the safe direction, but the result is silent and gives no named "unknown screen" reason. | Record a real capture. Name the reason `terminal:delivery-unknown:not-ready` separately from a failed confirm, so drift is visible in receipts. |
| RT-12 | E, F | Low | R | `src/observe/friction-client.mjs:12-28`, `:56-112` | Node keeps its own copies of the layer, disposition, docType and reason lists, and they already drift: `layer:'spec'` is refused by Node ("invalid layer \"spec\"") but accepted by Rust (`friction.rs:13-24`) and listed in `observe.friction.v1.json`. | Delete the Node lists and let the host refuse with a named error. Target about 70 lines. |
| RT-13 | F, A | Low | R (by `rg`) | `packages/observe/rust/src/store_lock.rs:35-43`; `friction.rs:40-43` | `FGOS_NOW` is a test-only time override read in production code (it stamps every friction, case and eval `ts`). AGENTS.md L5 forbids test-only env switches. `FGOS_CALLER_PID` has no producer anywhere (`rg` over `src`, `bin`, `apps`, `packages`) and lets any environment forge the recorded caller pid. | Inject the clock in tests. Delete both env reads. |
| RT-14 | F, D | Low | R (by reading) | `metrics_cli/harness.rs:168-169`, `:205-219` | The harness scorecard reports constants as measurements (`total_routes = 50; native_routes = 2`). It also buckets lines of code by forgent's own folders (`src/runner/`, `herdr-dashboard/`), which is wrong for every other project that uses fgOS (mission #1). | Drop the two fake fields, or measure them. Bucket by test or non-test only. |
| RT-15 | G | Low | R | `metrics_cli/runs.rs:249-250` (same pattern in every `metrics` subcommand parser) | `fgos metrics runs --json` fails with "unexpected argument … --json". Agents pass `--json` by convention, and the output is already JSON. | Accept `--json` as a no-op on every Observe verb. |
| RT-16 | A (secrets) | Medium | I | `friction.rs:296-318`; producers `src/verbs/merge/approve.mjs:574` (raw `git merge` stderr), `src/runner/loop.mjs:1186` (`failure.message`) | **Leak class: raw git and runner errors are written verbatim into a git-tracked file.** Friction `detail` holds that text unredacted in `.fgos/observe/friction/*.jsonl`, which is git-tracked. The class at risk is a remote URL with an embedded credential in git stderr, or a credential echoed in an error message. Observe has no redaction (`rg redact` over `packages/observe` and `src/observe` finds 0 hits). A scan of the tracked 685 KB shard for credential shapes found none: every hit was a `tsk-`/`task-` id. | Run `detail` through the existing secrets redaction door before append (check `packages/secrets` for an exported redactor before adding anything), or keep `detail` in an untracked store. Owner choice: see Proposed additions. |
| RT-17 | F | Low | R (by reading) | `terminal/mod.rs:160`, `:179-181` | `FsOutbox` sleeps with `std::thread::sleep`, outside `AgentIo::pause`. This contradicts `mod.rs:3-4` ("time only passes through `AgentIo::pause`"), and the supervisor gets no tick during it. `newest_complete` compares length only, while `newest_unreadable` compares bytes and mtime. | Give `pause` to the outbox. Use the same stability rule in both. |
| RT-18 | D | Low | R (by reading) | `packages/observe/rust/tests/store_lock_multiprocess.rs:163-177` (31 s sleep plus a holder of up to 35 s), `:132-145` (5 s) | **Time-based tests.** The 35 s test proves that a mechanism removed in `8549e77f1` (the mtime expiry) is absent. A kernel lock has no expiry by construction, and holder-lock's own tests own that behaviour (T1). | Retire both. Their behaviour is owned by holder-lock's acquire, wait and timeout proofs. Keep `processes_sharing_a_writer_id_never_interleave_snapshot_lines` (Observe's own invariant). |
| RT-19 | E, B | Low | I | `src/setup/registrations.mjs:5860-5967` | Doctor's `observe-friction-migrated` is a second Node reader of the legacy `events.jsonl`/`events/*.jsonl` and of the friction shards. It tolerates bad UTF-8 (`readFileSync 'utf8'`), while the host fails on it. So doctor says "all migrated" while `fgos friction list` fails (RT-03). It also reads the legacy events layout, which **will collide with WORK's Event Store cutover**. | Make it a host read (`friction migrate` already exists; a read-only check form would be new, so it is listed under Proposed additions). Coordinate with WORK/ES. |
| RT-20 | A | Low | I | `direct/mod.rs:135-148` | `result-07.json` and `result-7.json` both parse as 7, and `max_by_key` then picks whichever `read_dir` lists last, which depends on the filesystem. | Refuse leading zeros, as the `+` sign is already refused. |
| RT-21 | B | Low | I | `shard.rs:144-149` | `pid-<N>` shard names come from a terminal-head pid, which is not unique across machines, inside a git-tracked directory. Two machines with the same pid append to one file, so their histories conflict on merge. | Add the machine to the pid fallback (an identity concern: hand to the identity owner if it needs a crate change). |

### RT-10 table: wording lists

| Where | Layer | Lists |
|---|---|---|
| `agent-protocol/rust/src/direct/mod.rs:185-224` | T3 | auth (9 substrings, plus an api-key rule), quota (3, anchored) |
| `agent-protocol/rust/src/terminal/{claude,codex,agy}.rs` | T3 | trust markers, banner |
| `src/runner/dispatch/provider-auth-failure.mjs:19-54` | T5 | auth (8 regex), quota (3) |
| `src/run-supervisor/steps/settle-attempt.mjs:103-110` | T4 | 6 wide screen-limit regexes |
| `src/runner/dispatch/provider-capacity.mjs:948-956` | T5 | 6 auth anchors |
| `src/runner/dispatch/provider-credential-probe.mjs:24` | T5 | `usage limit\|quota\|rate limit` |
| `src/runner/dispatch/provider-account-probe.mjs:26-27`, `:136` | T5 | quota, trust (`/trust/i` fallback) |

## Migration table

| Node part | What it decides | Move? | Reason | Order | Receiving layer | Node budget after |
|---|---|---|---|---|---|---|
| `settle-attempt.mjs:97-129` (`SCREEN_LIMIT_PATTERNS`, `terminalAdapterOutcome`) | provider-limit or blocked, from a later screen | Move | RT-01, RT-08; owner wants no deciding logic in Node | 1, after the protocol emits `blocked(usage-limit)` | T4 | about −35; a table lookup on the receipt reason |
| `provider-auth-failure.mjs` (66) plus `settlement.mjs:633-652` | the direct-mode login or quota outcome | Move | RT-07: the Rust classify exists but is not wired | 2 | T4 (receipt carries `classify`), T5 (settlement reads it) | −66 and about −20 |
| `provider-capacity.mjs:948-1009` text rules | quarantine kind from stderr | Move | RT-01, RT-10 | 3 | T5 | about −40; reads the outcome and its cause |
| `provider-credential-probe.mjs:24`, `provider-account-probe.mjs:26-27,136` | probe verdicts | Move, through a host route (cold path) | RT-10 | 4 | T5 | about −15 |
| `usage-parsers.mjs` (199) | token counts, not an outcome | Not in T3 | no outcome authority involved; per-CLI knowledge, so a later candidate | n/a | T5 | unchanged |
| `friction-client.mjs` validation (about 120 lines) | input validity | Delete | RT-12: Rust validates | anytime in 04a | T3 | 194 → about 70 |
| `registrations.mjs:5860-5967` legacy reader | migration complete? | Move to the host reader | RT-19 | after the WORK cutover | T3, with WORK/ES | about −100 |

## Delete list

| Item | Proof that owns the behaviour afterwards |
|---|---|
| `direct/codex.rs:12-14` (`stdin_policy` override, same as the default) | `direct_vectors.rs:68` (default null device) |
| `names_blocks()` (if the direct classify is wired, the `Generic` adapter can just return no block) | `direct_vectors.rs` |
| Unwired `DirectAdapter::classify` and its vectors, **only if** the owner declines the RT-07 wiring | none needed: the behaviour is gone |
| `friction.rs:119-127`, `case_journal.rs:214-224`, `snapshot.rs:68-82`, `shard.rs:163-197` (three appenders and one reader) | the one shard door built from `eval_journal.rs:173-260`; `eval_journal_test.rs` |
| `FGOS_NOW` and `FGOS_CALLER_PID` reads | the injected clock in `eval_journal_test.rs:295` |
| `harness.rs:168-169` constants | none: they were fake |
| `store_lock_multiprocess.rs:132-177` (two time-based tests) | holder-lock's acquire, wait and timeout tests (T1) |
| `.fgos/observe/.lock/TOMBSTONE` (untracked fence from 2026-10-17) | owner rule "fences live one release": delete once the release after the cutover has shipped |
| Node `SCREEN_LIMIT_PATTERNS`, `AUTH_ANCHOR_PATTERNS`, probe patterns, `provider-auth-failure.mjs` | protocol vectors (T4/T5 receiving layers) |

## Doctor

| Row | Keep | Note |
|---|---|---|
| `observe-dir-writable` | yes | |
| `observe-friction-migrated` | yes, read through the host | RT-19; ES cutover collision |
| `observe-host-resolvable` | yes | |
| `observe-run-coverage` | yes | Pays two full scans (host about 1 s plus Node). It is a deliberate independent check, and I do not challenge it on this lens. `host-version-mismatch` passes as `degraded` (`registrations.mjs:6145-6146`), which is acceptable |
| `agent-cli-project-trusted` | yes, machine fact | I agree it is not a code defect |

No new rows. The row count does not grow.

## Tests

| Behaviour | Owning proof | Note |
|---|---|---|
| Terminal outcomes per CLI | `agent-protocol/rust/tests/terminal_vectors.rs` (virtual clock) | add a FIFO and an oversized-result vector (RT-02); add `blocked(usage-limit)` (RT-08) |
| Direct outcomes | `tests/direct_vectors.rs` | becomes production-relevant only if RT-07 is wired |
| Login and quota wording | Rust vectors only | Node `test/runner/provider-auth-failure.test.mjs` (9 tests) is a **duplicate**; retire it with the module |
| Settle mapping reason → code | `test/run-supervisor/attempt-steps.test.mjs` (T4) | becomes a table test with no text cases |
| Shard append, read, torn lines and symlinks | `eval_journal_test.rs`, once it serves all stores | add a bad-UTF-8 and a torn-line case (RT-03, RT-04) |
| Lock wait and timeout | holder-lock (T1) | retire the Observe 35 s and 5 s tests (RT-18): **about 36 s of the 37 s Observe test time** |
| Friction validation | Rust `friction.rs` unit tests | Node validation cases in `test/observe/*` retire with the lists |

## Proposed additions (owner picks)

1. **Redact or untrack friction `detail`** (RT-16). The problem: verbatim command stderr goes into a git-tracked file. The evidence: `approve.mjs:574`, plus no redaction anywhere in Observe. The benefit: closes a leak class before it happens; nothing has leaked so far. Option A: reuse an existing secrets redactor, if one is exported, at the append point. Option B: move `detail` into an untracked side file.
2. **A read-only check form of `friction migrate`** for the doctor row (RT-19). The problem: a second Node reader that disagrees with the host. The benefit: one reader, and no collision with the ES cutover.
3. **A named `terminal:delivery-unknown:not-ready` reason** (RT-11). The benefit: CLI wording drift shows up in receipts instead of passing silently.

## Rejected hypotheses

- **Writer-id path traversal** through `FGOS_SESSION_ID`-style variables. `usable()` (`packages/identity/rust/src/resolve.rs:115-123`) allows only `[A-Za-z0-9._-]`, and `.jsonl` is appended, so `..` becomes the file name `...jsonl`.
- **Transcript text spoofing token usage.** `claude_transcripts.rs` parses each line as JSON and reads top-level fields, and agent text is escaped inside strings. The `"usage"` substring pre-filter only skips lines.
- **`--dir` ignored by the subcommand parsers.** The host projector consumes `--dir` as the root (`apps/fgos/src/main.rs:131-134`); my `friction list --dir <scratch>` read the scratch root.
- **The direct supervisor hanging on a FIFO.** `outbox_present` (`supervise.rs:90-93`) lists names only, so only terminal mode is exposed (RT-02).
- **Transcripts dominating the slow routes.** Measured at about 0.15 s of about 1.28 s at load 16.5 (Challenges, item 4).
- **Secrets in the tracked friction shard today.** The pattern scan found only false positives (`tsk-`/`task-` ids). I printed no values.
- **Windows or macOS build breaks.** Both crates pass `cargo check --all-targets` on both targets, with no warnings from these crates. RT-06 is a behaviour defect, not a build defect.

```text
Status: DONE_WITH_CONCERNS
Summary: The protocol is not the outcome authority in direct mode (its classifier is unwired), and in terminal mode it drops the usage-limit fact, so Node re-derives it with wide regexes over a later screen; I reproduced that agent-controlled screen text yields a manual-clear account quarantine. Also reproduced: a FIFO result file blocks the outbox read with no timeout, and one bad byte makes every friction read fail, which can also re-migrate all legacy records.
Concerns/Blockers: RT-01's settle half, RT-03's duplication and RT-06 (Windows) are inferred, not reproduced, because reproducing them needs a write verb or a Windows host. Timings were taken at load 13.8 to 17.8 while TEST was running. The fixes for RT-01, RT-07 and RT-08 land mostly in T4/T5 code and need those layers to take them on.
```
