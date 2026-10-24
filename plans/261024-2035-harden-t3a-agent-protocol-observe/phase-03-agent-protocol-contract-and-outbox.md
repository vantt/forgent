---
phase: 03
title: "Agent protocol: blocked(usage-limit) in terminal mode, bounded outbox, one reason renderer, deletions"
status: pending
depends_on: [01]
parallel: "with phases 02, 04, 05 (disjoint files; shares only census and Cargo.lock, both regenerated)"
effort: ~1d
net_size: "agent-protocol Rust src −55 / run-supervisor Rust (T4 crate) −10 / durable-file +25 / Node 0 / tests +110 (Rust; red tests +55 included) / contract fixtures +≈60 JSON — estimates"
---

# Phase 03 — Agent protocol contract and outbox

## Context

Arbitration §2.1 (owner-approved, decision 30), §4.2 item 2, §4.5. Findings RT-02, RT-08, RT-09, RT-17, RT-20, B-A4, B-A7 and the adjusted delete list (classify is **kept** for T4 to wire). Facts F-A1..F-A10 in [plan.md](plan.md). The RT-01 decision (settle change waits for T4) is D-T3A-1 in plan.md; this phase leaves its fix path clear (requirement 9).

## Red tests this phase turns green

6a (FIFO named like a result), 6b (oversized result), 7 (the five `usage-limit-on-an-idle-screen-is-blocked-usage-limit` vectors).

## Requirements

1. **One block enum** (RT-08, simplicity F5): `TerminalBlock` (`terminal/mod.rs:25-39`) is deleted; the terminal adapter uses `outcome::BlockedReason` (`outcome.rs:6-11`, already `TrustDialog | Login | UsageLimit`) with one `as_str`.
2. **Usage limit is named in terminal mode on the two stop paths:** one function `stop_reason(screen)` = the trust/login checks of `classify_blocked` (`terminal/mod.rs:246-261`) then an anchored quota line (`is_quota_limit`, `direct/mod.rs:151-157`) in the lines of interest. It is used where the agent has stopped: the detector-said-blocked path (`blocked_readiness`/`blocked_outcome`, `:263-279`) and the idle check of `detect_completed` (`:593-601`, today `NeedsHuman`). `classify_blocked`'s screen-only callers (start banner `:288`, ready gate `:310`, unruled wait `:390`) are unchanged, so stale quota text in scrollback never stops a launch. Quota wording is unchanged (no new phrase: arbitration wording rule). <!-- Red Team: failure F4 -->
3. **Login anchored in terminal mode** (RT-09), as two named matchers over one phrase list:
   - `screen_login(line)` (terminal): the trimmed line, after an optional `error`/`warning`/`fatal` prefix with `:` or space, **starts** with one of: `not logged in`, `invalid api key`, `no default model selected`, `no api key found for `, `oauth refresh failed`, `oauth token refresh failed`, `authentication required`, `authentication failed`, `login required`, `api key ` followed within 20 characters by `missing`/`invalid`/`expired`. Recorded screens that must still match: omp ` Warning: No default model selected. Use /login…` (`contracts/fixtures/terminal/omp/login-needed.txt:10`, vector `terminal/omp/vectors.json:89-105`), claude `Invalid API key · Please run /login` (`terminal/claude/vectors.json:102-118`), codex `ERROR: Not logged in`, `Not logged in · Please run /login`. `run /login` alone mid-line no longer counts.
   - `capture_login(line)` (direct): today's substring rule over the last 5 capture lines (`TAIL_LINES`, `direct/mod.rs:20`), the CLI's own error region; a measured direct vector has the wording mid-line (agy glog `W0912 … You are not logged into Antigravity.`, `contracts/fixtures/direct/agy/vectors.json`).
   - Gate in step 2, before anything else changes: run `screen_login` over every `terminal/*/vectors.json` step and every `terminal/*/*.txt` capture and compare with today's matcher; any recorded login screen that stops matching blocks the step.
   - New vectors: one per terminal CLI where a login phrase inside agent text on a detector-blocked screen names `needs-human`.
   - Residual, named in the spec: agent text printed at column 0 can still read as a provider line (true today through the Node screen patterns, `settle-attempt.mjs:103-110`); 04a does not widen it, and the anchored list narrows the login half. <!-- Red Team: assumptions F1, security F4 -->
4. **Bounded, no-follow outbox read** (RT-02): `FsOutbox` reads `result-<N>.json` through `fgos_durable_file::open_beneath(dir, name)` then `.read(MAX_RESULT_BYTES)` (`packages/durable-file/rust/src/beneath.rs:255`, `:120-131`: `O_NOFOLLOW|O_NONBLOCK`, regular files only, `TooLarge` past the cap). `MAX_RESULT_BYTES` = 16 MiB (red test 6b writes 16 MiB + 1). `open_beneath` is `cfg(unix)` (`packages/durable-file/rust/src/lib.rs:421-426`); on Windows, one helper added to `fgos-durable-file` (the T0 leaf both crates reach; it already depends on `windows-sys` with `Win32_Storage_FileSystem`, `Cargo.toml:59-62`): `open_no_reparse(options, path)` opens with `FILE_FLAG_OPEN_REPARSE_POINT` and refuses a handle whose attributes carry `FILE_ATTRIBUTE_REPARSE_POINT` or that is not a regular file (`std::os::windows::fs::MetadataExt::file_attributes` on the opened handle); the outbox then checks `len() <= MAX_RESULT_BYTES` and reads with `take(MAX + 1)`. Phase 04 uses the same helper for Observe's Windows shard door (RT-06). <!-- Red Team: scope F2, security F3 --> A refusal, a missing file or an oversized file is `None`, never a hang. New dependency: `fgos-durable-file` (path) in `packages/agent-protocol/rust/Cargo.toml` (an L0 leaf; the run supervisor already depends on it).
5. **Time through `pause`, one stability rule** (RT-17): `Outbox::newest_complete` and `FsOutbox::newest_unreadable` take `io: &mut dyn AgentIo` and wait through `io.pause` (today `std::thread::sleep`, `terminal/mod.rs:160`, `:179`). One private helper reads the newest result, loops `pause` until `io.now_ms()` shows the stable window has elapsed (`TermIo::pause` can return early when the run is finished, `supervise/terminal.rs:524-534`), re-reads, and calls it stable only when length **and** modified time are unchanged (today `newest_complete` compares length only, `:181`; `newest_unreadable` compares bytes and mtime, `:161`). A window cut short (run finished) counts as **not** stable. Every `Outbox` implementer changes with it: `FsOutbox`, `ScriptedOutbox` and `NoOutbox` (`tests/terminal_vectors.rs:129`, `:524`) and the calls at `:298-335`; the supervisor passes its `TermIo` (`supervise/terminal.rs:658`, `:703`). Proofs: a virtual-clock vector where the window is cut short returns `None`; one supervisor unit case where a stop request arrives during the stability wait records the stop's reason, not a completion. <!-- Red Team: failure F5, assumptions F10 -->
6. **Leading zeros refused** (RT-20): `newest_result` (`direct/mod.rs:68-81`) refuses a number with a leading `0` (except `0` itself) the way it refuses `+` (`:76`). Owning proof: `tests/direct_vectors.rs:95` `newest_result_takes_the_highest_number`, extended.
7. **Honest readiness name** (B-A4): an unreadable screen in the unruled wait (`terminal/mod.rs:386-389`) returns `Readiness::Unverified`, not `Ready`. Same wire outcome (`ready`, `:92-94`), so delivery behaviour does not change in a hardening pass; `NotReady` would stop typing and is a behaviour change for the owner (D-T3A-6). One vector or unit case with a pane whose `screen()` errs.
8. **One receipt-reason renderer in the protocol crate** (RT-08, B-A7, arbitration §4.5):
   - `TerminalOutcome::receipt_reason(&self) -> Option<String>` replaces the supervisor's `early_reason` (`supervise/terminal.rs:538-545`) and the test-only `TerminalOutcome::to_json` (`terminal/mod.rs:52-68`; its only callers are vector tests, which compare through `receipt_reason` or the outcome directly).
   - The four supervisor stop reasons outside the contract (`supervise/terminal.rs:54` `foreground-not-agent`, `:665` `agent-not-started`, `:709` `result-unreadable`, `:742` `completed-no-exit`) become `pub const`s in the protocol crate, imported by the supervisor, and are written into the existing prose of `terminal-outcomes.v1.json` `mapping.toReceiptReason` (`:19`, a string; its shape does not change).
   - Proof: one test in `tests/terminal_vectors.rs` that every rendered reason and the four constants occur in that string. <!-- Red Team: scope F5 -->
   - The direct-mode arm (`direct:blocked:<reason>`) is **not** added here: it would be dead until T4 wires `classify`; T4 adds it next to the call, reusing `BlockedReason::as_str`.
9. **RT-01 fix path left clear** (D-T3A-1): after this phase a quota stop reaches the settle step as `terminal:blocked:usage-limit` (the receipt reason is rendered from `BlockedReason::as_str`), a login stop as `terminal:blocked:login`, a trust dialog as `terminal:blocked:trust-dialog`, a question as `terminal:needs-human`. The settle step (`src/run-supervisor/steps/settle-attempt.mjs:125-129`) is not changed: its regex `^terminal:(blocked|needs-human|delivery-unknown)` already accepts the new reason, so behaviour is unchanged until T4 swaps the screen re-read for a name table.
10. **Contract edits (L10, every consumer in this change):**
    - `terminal-outcomes.v1.json`: `outcomes.blocked.fields.reason.enum` gains `usage-limit`; `wire.usageLimit` (`:15`) is deleted; the `mapping.toReceiptReason` prose names every reason. Version stays `1`: the consumer set is closed and moves in the same commit (the receipt's `reason` is free text, `packages/run-supervisor/contracts/receipt.v1.json:11`).
    - `test/run-supervisor/contracts-terminal.test.mjs:113` pins the enum to `['trust-dialog', 'login', 'usage-limit']`.
    - `agent-protocol.v1.json`: delete `io.read` (`:7`), `io.activity` (`:8`), the `stdinPolicy` decision (`:25`) and the `(stdinPolicy null)` matrix note (`:36`); the envelope's own `launch.stdinPolicy` (gate-owned, `packages/run-supervisor/rust/src/gate.rs:200`) is untouched.
11. **Deletions (adjusted D1–D6; classify kept):**
    - `StdinPolicy` (`outcome.rs:28-35` region, re-export `lib.rs:13`), `DirectAdapter::stdin_policy` (`direct/mod.rs:25-27`), the Codex override (`direct/codex.rs`).
    - The five identical adapter structs and the trait: `direct/{claude,codex,agy,pi,omp,generic}.rs` and `DirectAdapter` (`direct/mod.rs:22-52`) become one `pub struct Direct { cli, names_blocks }` with `activity_from` and `classify`, and `adapter_for` (`:56-65`) is one `match` returning it. The supervisor's field type (`supervise.rs:188`) and import (`:21`) change with it.
    - `Activity::Event` (`outcome.rs` `Event` variant; `direct/mod.rs:86-88`): only `is_active` is read in production (`supervise.rs:252`); a JSON line is `Output`.
    - `AgentIo::read` and `AgentIo::activity` (`port.rs:37-39`) and their stubs (`supervise/terminal.rs:482-488`, `tests/terminal_vectors.rs:103-107`, `:497-501`).

## Files

- **Create:** none.
- **Modify:** `packages/agent-protocol/rust/src/{lib.rs,outcome.rs,port.rs,direct/mod.rs,terminal/mod.rs}`, `packages/agent-protocol/rust/Cargo.toml`, `packages/durable-file/rust/src/lib.rs` (the Windows `open_no_reparse` helper only), `packages/agent-protocol/rust/tests/{terminal_vectors.rs,direct_vectors.rs}`, `packages/agent-protocol/contracts/{agent-protocol.v1.json,terminal-outcomes.v1.json}`, `packages/agent-protocol/contracts/fixtures/terminal/<cli>/vectors.json` (red-test vectors already changed; new negative login vectors), `packages/run-supervisor/rust/src/supervise.rs` (`:21`, `:188`), `packages/run-supervisor/rust/src/supervise/terminal.rs` (`:54`, `:482-488`, `:538-545`, `:665`, `:703`, `:709`, `:742`, test module `:749-781`), `test/run-supervisor/contracts-terminal.test.mjs` (`:113`), `packages/git/contracts/mutation-census.v1.json` (regenerated), `Cargo.lock` (regenerated).
- **Delete:** `packages/agent-protocol/rust/src/direct/{claude,codex,agy,pi,omp,generic}.rs`.
- **Tests to retire:**
  - `tests/direct_vectors.rs:67` `codex_stdin_is_the_null_device` — behaviour removed from the protocol; the stdin the agent gets is the gate's (`gate.rs:200-205`), owned by the run-supervisor gate tests.
  - The `stdin_policy` assertion inside `every_cli_vector_classifies_as_recorded` (`:43`) — same owner.
  - `activity_counts_growth_and_events` (`:112`) keeps its active/quiet assertions; the `Event` assertions go (behaviour removed).
  - `supervise/terminal.rs:776-781` `early_reason` assertions move to the protocol crate's renderer test (owner named in the commit).

## Steps

1. Enum merge and usage-limit rule (red 7 green); run all terminal vectors.
2. Gate first: run the proposed `screen_login` over every recorded terminal vector and capture; then anchored terminal login; add the five negative vectors.
3. Windows helper in `fgos-durable-file`; bounded outbox with `pause` and one elapsed-time stability rule (red 6a, 6b green; 6a runs in milliseconds once fixed).
4. Leading zeros; B-A4.
5. Renderer + constants + contract lists; swap the supervisor call sites; delete `early_reason` and `to_json`.
6. Deletions (requirement 11) and contract edits (requirement 10); `contracts-terminal.test.mjs:113`.
7. Census regenerate; `git diff --stat` check; commit `feat(agent-protocol): …` (contract change) and `refactor(agent-protocol): …` (deletions), bodies naming behaviours and retired tests with owners.

## Validation (focused)

```sh
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-t3a-p03-target
cargo test -p fgos-agent-protocol
cargo test -p fgos-run-supervisor --lib
cargo test -p fgos-run-supervisor --test supervise_terminal_fake_herdr --test release_slot_step   # assert terminal:needs-human (:161, :148); a generic blocked screen must still name it
cargo test -p fgos-durable-file
node --input-type=module -e "import {runChosenTests} from './scripts/run-tests.mjs'; runChosenTests(['test/run-supervisor/contracts-terminal.test.mjs','test/run-supervisor/terminal-cutover.test.mjs','test/run-supervisor/attempt-steps.test.mjs'])"
```

`terminal-cutover.test.mjs:112-123` must stay green: its screen (`■ You've hit your usage limit…` with the detector saying `blocked`) does not match the anchored quota list, so the protocol still names `needs-human` and Node's screen re-read still settles `provider-limit`. That test is T4's to revisit (D-T3A-1).

Land gates:

```sh
cargo check -p fgos-agent-protocol -p fgos-run-supervisor -p fgos-durable-file --all-targets --target x86_64-pc-windows-msvc
cargo check -p fgos-agent-protocol -p fgos-run-supervisor -p fgos-durable-file --all-targets --target aarch64-apple-darwin
cargo clippy -p fgos-agent-protocol -p fgos-run-supervisor -p fgos-durable-file --all-targets -- -D warnings
node scripts/git-one-door-scan.mjs --root .   # count stays 5
```

## Success criteria

- Red 6a, 6b, 7 green; every recorded vector unchanged except the five red ones.
- `rg -n "StdinPolicy|stdin_policy|TerminalBlock|fn read\(|fn activity\(|to_json|early_reason" packages/agent-protocol packages/run-supervisor/rust/src` → 0 hits.
- `rg -n "std::thread::sleep|std::fs::read\(" packages/agent-protocol/rust/src` → 0 hits outside `port.rs`'s default `pause`.
- Crate Rust src Δ ≤ −60 (measured, reported).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A real quota screen that today settles `provider-limit` changes outcome | L × M | Settle is unchanged (requirement 9): the new reason still passes the settle regex and the screen re-read; only the receipt reason text changes for an anchored quota line |
| Anchoring login drops a real terminal login screen | M × M | Prefix set includes `warning` (omp's real capture) and start phrases include `invalid api key`; the step-2 gate runs the anchored matcher over every recorded vector and capture before any other change |
| A worker plants many `result-N.json` entries or a refused newest file | L × L | It only stalls its own attempt until its idle/hard deadline (the worker controls its own outcome anyway); named residual, no new mechanism |
| `open_beneath` adds a sha256 per read (`beneath.rs:130`) | L × L | Results are small JSON claims; capped at 16 MiB |
| `pause` inside outbox reads now runs the supervisor's watch | L × L | That is the intended behaviour (`terminal/mod.rs:3-4`); the virtual clock in vectors covers it |
| T4's crate is edited by T3 | M × L | Mechanical edits only (imports, one call, stubs, constants); no deciding logic; T4 told via the hand-off row |

## Rollback

Revert the two commits. No on-disk format changes. A receipt written with `terminal:blocked:usage-limit` is read by the previous release's settle step through the same regex (`settle-attempt.mjs:126`).
