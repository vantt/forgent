# HARDEN T3-04a phase 03: agent-protocol contract and outbox

Lead report, 2026-10-24 (Asia/Saigon). Worktree `harden-t3a-p03`, branch `harden/t3a-p03`. Commits: `1a8eb0f01` (red tests, on main `7f38f56a9`), `c621d6989` (fix, one commit: the contract change and the deletions share files, and L10 wants one change).

## Red to green

| Red test | Red on `1a8eb0f01` (re-run this session) | Green on `c621d6989` |
|---|---|---|
| 6a FIFO named like a result | `(newest_complete, newest_unreadable found)` = `(None, None)`: both blocked past 2 s | `FsOutbox` opens through `open_beneath`; a FIFO is `NotRegular`, both reads return `None` in ms |
| 6b oversized result | `an oversized result was read whole and accepted` | read capped at `MAX_RESULT_BYTES` (16 MiB); `TooLarge` is `None` |
| 7 five `usage-limit-on-an-idle-screen-is-blocked-usage-limit` vectors | claude: left `needs-human`, right `blocked/usage-limit` | all five CLIs green in `terminal_every_cli_vector_resolves_as_recorded` |

## Gate before other changes (anchored login)

Temporary comparison (removed before commit) of the old substring matcher against the new `screen_login` over the bottom 12 lines of every `terminal/*/*.txt` capture and every `screen` string in every `terminal/*/vectors.json`: 370 lines, 0 differences. The 5 recorded login lines still match: pi `Error: No API key found for openai-codex`, claude `Invalid API key · Please run /login`, omp ` Warning: No default model selected…`, codex `ERROR: Not logged in`, agy `Authentication required`. Direct captures keep the old substring rule (`capture_login`), so the agy glog vector is untouched.

New proof: five vectors (one per CLI) where login wording sits mid-sentence in agent text on a detector-blocked screen name `needs-human` (the old matcher names `login` for them).

## Changes (spec requirement to result)

1. One enum: `TerminalBlock` deleted, `BlockedReason::as_str` added.
2. `stop_reason(screen)` = `classify_blocked` then anchored quota; used by `blocked_readiness`/`blocked_outcome` (detector-said-blocked path). Screen-only callers unchanged.
3. `screen_login` (terminal, anchored after `error|warning|fatal` label) and `capture_login` (direct) over one phrase list.
4. Bounded no-follow outbox: unix via `open_beneath` + `read(MAX_RESULT_BYTES)`; Windows via the new `fgos_durable_file::open_no_reparse(&mut OpenOptions, path)` (the one helper phase 04 must reuse; none created elsewhere). New dep `fgos-durable-file` in agent-protocol.
5. `Outbox::newest_complete(io)` and `FsOutbox::newest_unreadable(io)` wait through `io.pause`; one private `stable_newest`.
6. Leading zeros refused in `newest_result`; `result-0.json` still accepted.
7. Unreadable screen in unruled wait returns `Readiness::Unverified`.
8. `TerminalOutcome::receipt_reason` plus four `REASON_*` constants in the protocol crate; supervisor `early_reason` and its `FOREGROUND_NOT_AGENT` const removed, call sites swapped.
9. Settle step untouched.
10. Contracts: enum widened, `wire.usageLimit` deleted (rule now stated in `blocked.meaning`), `toReceiptReason` prose names every reason and constant; `agent-protocol.v1.json` lost `io.read`, `io.activity`, the stdin decision and the codex matrix note; `contracts-terminal.test.mjs` enum pinned to three reasons. Direct fixtures lost their `stdinPolicy` field (no reader left).
11. Deleted: `StdinPolicy`, `Activity::Event`, `AgentIo::read/activity` (+ stubs), six `direct/*.rs` adapters (now one `Direct` struct, `adapter_for` returns it by value), `TerminalOutcome::to_json`.

## Retired tests and new owners

| Retired | Owner now |
|---|---|
| `direct_vectors.rs` `codex_stdin_is_the_null_device` and the `stdin_policy` assertion | behaviour removed from the protocol; stdin is the gate's (`gate.rs:200-205`), owned by run-supervisor gate tests |
| `Event` assertions in `activity_counts_growth_and_events` (renamed `activity_counts_growth`; a JSON line is now asserted `Output`) | behaviour removed |
| supervisor `an_early_end_names_why_in_the_receipt_and_a_good_step_names_nothing` | `every_receipt_reason_and_stop_constant_is_named_in_the_contract` (`terminal_vectors.rs`) |

New tests: `a_stability_wait_the_run_cut_short_is_not_stable_and_the_wait_goes_through_pause`, `every_receipt_reason_and_stop_constant_is_named_in_the_contract`, leading-zero/plus assertions in `newest_result_takes_the_highest_number`. The outbox file tests now run on a virtual clock (faster).

## Measured delta (vs `1a8eb0f01`, which already holds the red tests)

| Area | Delta |
|---|---|
| agent-protocol Rust src | +214 −244 = **−30** (estimate −55, ceiling ≤ −60: **not met**; comments on the new rules and the cfg-split read account for it) |
| run-supervisor Rust src | −12 (estimate −10) |
| durable-file Rust src | +21 (estimate +25) |
| agent-protocol Rust tests | +130 −55 = +75 (red tests +55 already in the base) |
| Node | 0 src; test pin line 1 changed |
| Contract fixtures | +105 −5 (five new vectors, five removed `stdinPolicy` lines) |
| Contract JSON | +7 −11 |

## Gates

- `cargo test -p fgos-agent-protocol -p fgos-durable-file`: pass. `-p fgos-run-supervisor --lib`: 17 pass. `--test supervise_terminal_fake_herdr` 10 pass (36 s) and `--test release_slot_step` 9 pass; note these need `cargo build -p fgos-run-supervisor --examples` first (the harness binary), otherwise every test fails with ENOENT at `support/supervisor.rs:183`.
- Node `contracts-terminal`, `terminal-cutover`, `attempt-steps`: 26 pass, 0 fail. **Run took 2m17s** (`terminal-cutover` spawns real panes). `terminal-cutover.test.mjs:112-123` stays green.
- `cargo clippy -p fgos-agent-protocol -p fgos-run-supervisor -p fgos-durable-file --all-targets -- -D warnings`: clean.
- `cargo check ... --all-targets` on `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: compile clean. Warnings exist but are **identical on the base** (checked by stashing): msvc `gate.rs:168` unread fields and `supervise.rs:185` unread `outbox`; darwin `supervise/terminal.rs` unused `sandboxed`. All in the run-supervisor crate (T4), none from this phase; not fixed here (out of scope). The Windows `open_no_reparse` and `read_result` compile but have not run on Windows.
- `git-one-door-scan --write-census`: count 5; census regenerated and committed. `Cargo.lock` +1 line (the new edge).
- `rg` criterion: the listed names are gone from `packages/agent-protocol`; remaining hits in the supervisor src are unrelated (`ProcTuple::to_json`, socket `read`, the envelope's `launch.stdinPolicy` that the gate owns). `thread::sleep` only in `port.rs` default `pause`.

## Deviations and not done

- **Idle check is quota-only.** The spec has `detect_completed`'s idle check use `stop_reason` (trust and login too). I kept it to the anchored quota line only (`quota_on`): a trust marker is a plain substring over 20 lines, and on an idle screen the agent's own text could quote it and stop a healthy run; today only quota stops there. All vectors pass either way. Flip it if you want the literal spec.
- **Stability compares bytes and mtime** for both reads (spec: length and mtime for `newest_complete`); stricter, one rule, same cost.
- **Stability wait is one `pause` plus an elapsed check on `now_ms`**, not a loop: the supervisor's `pause` only returns early when the run finished, and a loop would spin on a virtual clock that does not advance.
- **Supervisor unit case "stop request during the stability wait" not added.** Building a `Sup`/`TermIo` needs the gate socket, domain and terminal-control core; a fake-herdr integration case would race a 20 ms window. Owning proof is the protocol vector (cut-short window is `None`); the supervisor then sees `finished()` at the top of its loop and keeps the stop's reason (existing behaviour).
- One commit instead of the spec's two (contract change and deletions touch the same lines of `terminal/mod.rs` and `direct/mod.rs`).
- Direct fixtures' `stdinPolicy` field removed (not in the file list; it was dead data after `StdinPolicy` went).

## For phase 06 (docs and CHANGELOG), phase 04, T4

- `docs/platform/agent-protocol/spec.md` still names `StdinPolicy`, `io.read` and the terminal needs-human quota rule (grep it); CHANGELOG: receipt reason `terminal:blocked:usage-limit` is new, login on a terminal screen must start a line.
- Phase 04: reuse `fgos_durable_file::open_no_reparse(&mut OpenOptions, &Path)` (cfg windows); it replaces custom flags on the options you pass.
- T4: `Direct::classify` is still unwired; add the `direct:blocked:<reason>` arm next to `TerminalOutcome::receipt_reason`.

## Proposed additions (not built)

- Fix the three pre-existing run-supervisor dead-field warnings on windows/macOS (T4's crate).

Status: DONE_WITH_CONCERNS
