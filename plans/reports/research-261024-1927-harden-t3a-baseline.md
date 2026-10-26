# HARDEN T3 part 04a baseline: Agent protocol and Observe

Main SHA `330c5242a` (branch main, activated release `sha256:d6d3d082…`), measured 2026-10-24 19:28 to 19:34 (Asia/Saigon) on the second machine (24 cores). The Event Store part (04b) is out of scope. Read-only work except the report; one accidental Observe write is disclosed in section 2.

## Summary

| Item | Agent protocol | Observe |
|---|---|---|
| Rust src / tests (lines) | 1 288 (17 files) / 684 (2 files) | 6 364 (26 files) / 1 305 (5 files) |
| Rust total | 1 972 (plan said 1 883) | 7 669 (plan said 7 632) |
| Rust tests (count, wall) | 16 pass, about 0.3 s of test time | 62 pass, 37 s of test time (35.0 s is one multiprocess lock file) |
| N-API addon namespace | none (`packages/git/node-addon/src` has no file for either) | none |
| Host wiring | none; consumed by crate `fgos-run-supervisor` (`supervise.rs`, `supervise/terminal.rs`) | `apps/fgos/src/main.rs`, `cli_projector.rs`, `wiring/*` (36 lines) |
| Node around it | `settle-attempt.mjs` 251, `usage-parsers.mjs` 199, `provider-adapter.mjs` 714, `provider-auth-failure.mjs` 66, `trust-store.mjs` 634 | `src/observe/friction-client.mjs` 194 |
| Doctor rows | 1 related (`agent-cli-project-trusted`, currently failing) | 4 (all passing) |
| Open backlog rows | 1 (`p-d2dc4f2e`), 1 loosely related (`p-c3a41d07`) | 0 |

Two measured facts matter most for the council. First, `metrics harness`, `runs` and `coverage` cost 1.0 to 1.4 s each (they scan 445 assignment directories) while every other read-only route costs 9 to 60 ms. Second, the quota and login wording is written twice, in Rust (`direct/mod.rs`) and in Node (`provider-auth-failure.mjs`, `settle-attempt.mjs`), and the Node settle step also matches Rust's reason strings by regex.

## 1. Lines of code

Counted with `wc -l` on `*.rs` / `*.mjs` files.

| Area | Path | Lines |
|---|---|---|
| Agent protocol Rust src | `packages/agent-protocol/rust/src` (largest: `terminal/mod.rs` 617, `terminal/common.rs` 230, `direct/mod.rs` 165, per-CLI adapters 9 to 17 each) | 1 288 |
| Agent protocol Rust tests | `tests/terminal_vectors.rs` 552, `tests/direct_vectors.rs` 132 | 684 |
| Observe Rust src | `packages/observe/rust/src` (largest: `scorecard.rs` 1 298, `friction.rs` 793, `case_journal.rs` 496, `sources/claude_transcripts.rs` 489, `metrics_cli/discussions.rs` 488, `eval_journal.rs` 434, `metrics_cli/harness.rs` 355) | 6 364 |
| Observe Rust tests | `eval_journal_test.rs` 792, `store_lock_multiprocess.rs` 197, `harness_protocols_test.rs` 200, `fixture_test.rs` 67, `boundary_test.rs` 49 | 1 305 |
| Host wiring for Observe | `apps/fgos/src/main.rs` (417, descriptors at 108-109, subcommand tables 119-122, providers 234-242), `cli_projector.rs` (898, `observe.metrics` at 31, `observe.friction` at 56), `wiring/friction_sources.rs` 10, `wiring/metrics_sources.rs` 26 | only the lines named are Observe; the files are shared |
| Agent protocol consumer (Rust) | `packages/run-supervisor/rust/src/supervise.rs:21,92`, `supervise/terminal.rs:26-27,749` (804 lines total) | shared |
| N-API addon | `packages/git/node-addon/src/*` (canonical_json, config, durable_file, event_store, git, holder_lock, marshal, process, session_identity, single_load, yaml): nothing for agent protocol or Observe | 0 |
| Node facade | `src/observe/friction-client.mjs` (spawns the host `friction` verb through `invokeHost`, `src/util/host-bin.mjs`) | 194 |
| Node supervisor settle | `src/run-supervisor/steps/settle-attempt.mjs` | 251 |
| Node usage parsing | `src/runner/dispatch/usage-parsers.mjs` | 199 |
| Node adapter registry | `src/runner/dispatch/provider-adapter.mjs` | 714 |
| Node outcome twins found by rg | `src/runner/dispatch/provider-auth-failure.mjs` 66; `src/runner/dispatch/trust-store.mjs` 634 (folder-trust seeding that avoids the Rust `trust-dialog` outcome); `src/runner/dispatch/settlement.mjs` 843 (comments at 630-646 and consumer of quota/login lines); `src/runner/dispatch/herdr-round.mjs` 495 (pre-trust, line 208) | listed |

The words `usage-limit`, `trust-dialog` and `needs-human` appear in Node only in `settle-attempt.mjs:126,134` (`needs-human` in two regexes). Other Node files carry the same ideas in other words (`provider-limit`, `quota`, `login`, `trust`), listed in section 6.

Node callers of Observe: `recordFriction` is called from `bin/fgos.mjs` (1406, 3356, 3405, 3510, 3649), `src/runner/loop.mjs:1179`, `src/verbs/merge/approve.mjs` (about 17 sites), `src/verbs/merge/sync-root.mjs` (7 sites); `resolveFriction` from `src/state/store.mjs:1013-1581`. Both re-export through `src/state/store.mjs:43-44`. `metrics coverage` is called from Node only by the doctor row (`src/setup/registrations.mjs:6143`).

Node test files covering these components (lines / test-or-it count):

| File | Lines | Tests |
|---|---|---|
| `test/observe/observe-contracts-fixtures.test.mjs` | 187 | 5 |
| `test/rust-host/observe-store-lock.test.mjs` | 65 | 2 |
| `test/setup/observe-doctor-checks.test.mjs` | 338 | 15 |
| `test/util/host-bin.test.mjs` (host call helper) | 174 | 7 |
| `test/runner/usage-parsers.test.mjs` | 168 | 11 |
| `test/runner/provider-auth-failure.test.mjs` | 122 | 9 |
| `test/runner/provider-adapter.test.mjs` | 624 | 23 |
| `test/run-supervisor/attempt-steps.test.mjs` (settle step) | 319 | 10 |
| `test/run-supervisor/terminal-cutover.test.mjs` | 194 | 9 |
| `test/run-supervisor/direct-cutover.test.mjs` | 210 | 10 |
| `test/run-supervisor/contracts-terminal.test.mjs` | 116 | 7 |
| `test/cli/fgos-verb-help-json.test.mjs`, `test/rust-host/help-routes.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs` (touch `metrics`/`friction` help only) | 218 / 159 / 335 | 12 / 5 / 4 |

The Observe-only and protocol-only files (first three rows, plus usage-parsers, provider-auth-failure) total 880 lines and 42 tests. The test counts come from a grep for `it(`/`test(` at line start and are approximate. I did not decide which of the supervisor files belong to this layer (they mostly belong to the run-supervisor component); the council should.

## 2. Routes and verbs

Verbs that end in these crates: `fgos metrics <ping|case|harness|faults|runs|coverage|discussions|eval|outcomes|entropy|snapshot>` and `fgos friction <record|resolve|list|show|rank|ping|migrate>` (descriptors `OBSERVE_METRICS_DESCRIPTOR`, `OBSERVE_FRICTION_DESCRIPTOR`, `main.rs:108-109`). Agent protocol owns no verb and no host route; it is a library inside the run-supervisor host crate. There are no addon calls for either. Node reaches Observe only by spawning the host through `invokeHost`.

Writing verbs that I did not run: `friction record`, `friction resolve`, `friction migrate`, `metrics case open|close`, `metrics eval record`.

Mistake to disclose: `fgos metrics snapshot` appends one line to `.fgos/observe/snapshots/<writerId>.jsonl`. I ran it once (not in the benchmark) before reading its source. It touched no Work state. I deleted the single file it created (`.fgos/observe/snapshots/8e8e56bb-….jsonl`); `git status` shows no snapshot file left, and the older `pid-2260757.jsonl` is untouched. `metrics snapshot` is therefore not measured.

What I ran: `fgos <verb>` through the shim `~/.local/bin/fgos` (resolves to the activated host), with `</dev/null`, cwd the main checkout. Each route got one discarded first call, then 10 cold runs and 15 warm runs. Cold means: before each run the page cache was dropped for the host binary and every file under `.fgos/observe` with `posix_fadvise(DONTNEED)` (no root, so the rest of the page cache and the directory scan data were not evicted). Warm means back-to-back runs. Load average was about 2.3 to 2.6 at the start and nothing from TEST was running yet (all route timings finished before 19:33, before the 19:35 cutoff the coordinator named). The throwaway script is in the session scratchpad, not committed.

| Route | Cold p50 / p95 (ms) | Warm p50 / p95 (ms) |
|---|---|---|
| `metrics ping` | 12.4 / 14.0 | 8.9 / 10.2 |
| `metrics case list` | 13.0 / 13.6 | 9.7 / 9.9 |
| `metrics faults` | 13.6 / 18.2 | 9.2 / 10.2 |
| `metrics eval list` | 39.1 / 43.1 | 33.7 / 38.2 |
| `metrics discussions` | 49.8 / 67.3 | 41.9 / 61.7 |
| `metrics outcomes` | 58.4 / 72.2 | 54.4 / 61.0 |
| `metrics entropy` | 58.0 / 69.2 | 50.1 / 58.2 |
| `friction ping` | 33.7 / 39.5 | 31.1 / 35.0 |
| `friction show tsk-3ti` | 37.6 / 43.0 | 27.7 / 34.4 |
| `friction list` | 49.9 / 55.3 | 45.2 / 57.2 |
| `friction rank` | 48.1 / 57.8 | 48.0 / 53.7 |
| `metrics coverage` | 1 052.8 / 1 064.2 | 1 034.1 / 1 054.8 |
| `metrics runs` | 1 341.1 / 1 527.3 | 1 274.3 / 1 299.1 |
| `metrics harness` | 1 432.2 / 2 644.9 | 1 332.2 / 1 901.6 |

Reading: a bare route costs about 9 ms (`metrics ping`), well below the 1.2 to 1.4 ms T1 spawn figures only because the shim adds a shell start before the host. The three slow routes all scan the 445 assignment directories under `.fgos/assignments` (535 directories per the doctor message), so their cost is scan cost, not route cost. The `friction` routes at 30 to 50 ms read 2 shard files (720 KB for the whole `.fgos/observe`) and are slower than the metrics routes that read less. Cold versus warm differs by 3 to 10 ms for cheap routes, and the page-cache drop did not reach the assignment tree, so cold numbers for the three slow routes are really warm for their data. All of this can be re-taken after 20:00 if the coordinator wants numbers free of any other load; nothing here was taken after 19:35.

## 3. Tests

Rust: `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-baseline-target cargo test -p fgos-agent-protocol -p fgos-observe`. Total wall time 46.1 s including a fresh compile of the target dir (load average was elevated by my own compile at the end, 12.8 at 19:33). All pass.

| Binary | Tests | Test time |
|---|---|---|
| agent-protocol lib unit tests | 0 | 0 s |
| `direct_vectors` | 7 | 0.01 s |
| `terminal_vectors` | 9 | 0.32 s |
| observe lib unit tests | 27 | 1.56 s |
| `boundary_test` | 1 | 0.09 s |
| `eval_journal_test` | 26 | 0.10 s |
| `fixture_test` | 1 | 0.00 s |
| `harness_protocols_test` | 1 | 0.04 s |
| `store_lock_multiprocess` | 6 | 35.01 s |
| Doc tests | 0 | 0 s |
| Total | 78 (16 + 62) | about 37 s |

`store_lock_multiprocess` alone is 35 s of the 37 s, so it is the first place to look for a time-based wait. The Rust test wall time was taken at about 19:33, before TEST's run began; the test-time column is dominated by sleeps and so is little affected by load, but a re-take after 20:00 would settle it.

Node tests: the files and counts are in section 1. I did not run any of them (no `node --test` runs), so there is no Node wall time. The Node↔Rust test duplicates in section 6 are from reading file names and sources only; I did not read the test bodies.

## 4. Doctor rows and setup steps

Rows (all in `src/setup/registrations.mjs`; the plan's line numbers 6586 to 6650 were stale):

| Row id | Registered at | Check function | What it checks | Status now |
|---|---|---|---|---|
| `observe-dir-writable` | 6191 | `checkObserveDirWritable` 5844 | `.fgos/observe` exists or can be created and is writable | pass |
| `observe-friction-migrated` | 6197 | `checkObserveFrictionMigrated` 5860 | every legacy `work.friction` record is migrated to `.fgos/observe/friction` and none is past the cursor | pass ("all 752 legacy work.friction record(s) migrated") |
| `observe-host-resolvable` | 6203 | `checkObserveHostResolvable` 5971 | the Rust host resolves and answers `friction ping` | pass |
| `observe-run-coverage` | 6326 | `checkObserveRunCoverage` 6138 | host `metrics coverage` (layout rule `v2`, accounting) against Node `scanAssignmentLayout`: directory count and eligible count, 60 s tolerance | pass (directories Node 535 vs host 535; eligible 531 vs 531) |
| `agent-cli-project-trusted` | 4527 | `checkAgentCliProjectTrusted` | the project root is trusted in every codex home and agy sub-HOME the configured executors use, so a dispatch does not stop at a trust prompt (the situation the `trust-dialog` outcome names) | fail: codex config `/home/vantt/.codex/config.toml` has no entry for this project |

Also relevant: `src/setup/holder-lock-checks.mjs:221` knows the `observe.lock` file (owned by T1's holder-lock rows, not by Observe). There are no setup steps and no config defaults registered for either component: `rg` over `src/setup` finds none for observe, friction or agent protocol. Agent protocol has no doctor row of its own.

`fgos doctor --json </dev/null`, run once: 140 checks, 128 pass, 12 fail. The failing ids are `executor-skills-installed`, `main-checkout-hook-wired`, `tool-registry-configured`, `work-step-vocabulary`, `run-attempts-stuck`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `confined-pane-accounts`, `agent-cli-project-trusted`, `active-release-matches-checkout`, `git-mutation-one-door`; only `agent-cli-project-trusted` touches this layer. It took 62.9 s wall (cold-ish single run; slow because of the whole registry, not these rows).

## 5. Open backlog rows (`docs/backlog.md`)

I read the status column of each candidate.

| Id | Status | Summary |
|---|---|---|
| `p-d2dc4f2e` | proposed | An agent seat started through herdr sometimes never starts, and the brief is then typed into the pane's shell (xai/`grok` seats, intermittent; `terminal-launch-not-started`). It touches the terminal adapter's ready/launch detection. |
| `p-c3a41d07` | proposed | Bind the confinement ownership marker to its herdr pane at pane creation (`src/runner/dispatch/confinement/*`); loosely related, belongs to dispatch hygiene, not to the adapters. |
| `p-f97bb935` | done (main `82903e710`) | A brief typed into a pane whose foreground is the shell is run by the shell; fixed by refusing a send while the foreground is the shell. Listed because it changed terminal-adapter send rules. |
| `p-6f17c807` | closed, not reproduced | Pane agent starts in its runDir instead of the worktree. Not Observe or adapter work. |

No backlog row mentions Observe, `fgos metrics`, `fgos friction` or `packages/observe` (grep on those terms and on the file names found only noise unrelated to these components).

## 6. Node↔Rust duplicates noticed (not judged)

1. **Quota/login wording, Node and Rust.** Rust `packages/agent-protocol/rust/src/direct/mod.rs:112` and `:151-156` (`is_quota_limit`: "you've hit your usage limit", "usage limit has been reached", "individual quota reached") and `:110`, `:124-127` (`run /login`, `login required`) versus Node `src/runner/dispatch/provider-auth-failure.mjs:22-24` and `:51-54` (`QUOTA_LIMIT_PATTERNS`, the same three phrases, plus the login patterns). Consumers on the Node side: `src/runner/dispatch/settlement.mjs:630-646`, `src/runner/execution/account-rotation.mjs`.
2. **Screen limit patterns, Node only, wider than Rust.** `src/run-supervisor/steps/settle-attempt.mjs:103-110` (`SCREEN_LIMIT_PATTERNS`: usage limit, rate limit, quota exceeded, too many requests, try again, model at capacity) plus `screenSaysProviderStop` at `:113-118`, which then also calls the provider-auth-failure matchers. Rust's terminal adapter decides `blocked(usage-limit)` at `terminal/mod.rs:597` using only `is_quota_limit`. The two answer the same question with different word lists.
3. **Reason strings re-parsed in Node.** `settle-attempt.mjs:126` and `:134` regex on `terminal:(blocked|needs-human|delivery-unknown)`, which is Rust's `TerminalBlock` / outcome naming (`terminal/mod.rs:29-36`, `outcome.rs`).
4. **Trust dialog, both sides.** Rust `terminal/codex.rs:14` ("trust this folder?") and the `TerminalBlock` trust variant in `terminal/mod.rs` versus Node `src/runner/dispatch/trust-store.mjs` (634 lines; seeds trust entries so the dialog never appears), `herdr-round.mjs:208`, and the doctor row `agent-cli-project-trusted` (`registrations.mjs:4527`).
5. **Run coverage, deliberately twice.** Rust `packages/observe/rust/src/metrics_cli/coverage.rs` (86) and `sources/repo.rs` versus Node `scanAssignmentLayout` used by `observe-run-coverage` (`registrations.mjs:6138`); `docs/specs/observe.md` states the independence on purpose, and a shared fixture `test/fixtures/run-layout/expected.json` ties them. Listed so the council can judge whether the doctor's second implementation is worth its keep.
6. **Usage parsing, Node only.** `src/runner/dispatch/usage-parsers.mjs` (`parsePiUsage`, `parseCodexCliUsage`, `parseClaudeUsage`, `parseHerdrUsage`, `parseUsageForAdapter`) has no Rust twin; the per-CLI knowledge is split, with CLI screens and exits in Rust and token usage in Node.
7. **Friction migration check.** `checkObserveFrictionMigrated` (`registrations.mjs:5860`) reads the legacy `work.friction` in Node, while the migration itself is Rust `friction migrate` (`friction_cli.rs`).

Status: DONE_WITH_CONCERNS
Summary: LOC, routes with p50/p95, Rust test counts and time, doctor rows (with current status), backlog rows and Node/Rust duplicates are recorded in the report. Concerns are listed below.
Concerns/Blockers: (1) I ran `fgos metrics snapshot` once by mistake, which appended one Observe snapshot line; I deleted that file and confirmed `git status` is clean of it (no Work state touched). (2) All timings (routes, `cargo test` wall time, doctor wall time) were taken 19:28 to 19:33, before the 19:35 cutoff, at load average 2.3 to 2.6 (the cargo run raised it to 12.8 itself); they can be re-taken after 20:00 on request. (3) Cold runs evict only the host binary and `.fgos/observe` files, because root is not available. (4) Node tests were counted by grep only and not run. (5) The doctor run shows 12 failing rows on main, 11 outside this layer.
