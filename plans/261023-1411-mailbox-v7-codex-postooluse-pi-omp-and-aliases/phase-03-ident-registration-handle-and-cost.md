---
phase: 3
title: "V7b: head registration with IDENT, handle in frames, hook cost"
status: pending
sub_rung: V7b
depends_on: [phase 2, IDENT C1 and C1b answers (fallbacks allowed)]
live_budget: "2 benign alias cases (Claude Code, Codex) + 2 cost runs (T1, T2) of the V5 live suite; no approval needed"
---

# Phase 3: registration with IDENT, handle in frames, hook cost (V7b)

## Requirements

1. **Registered flag.** `Begun` and `ShellOutcome` carry `registered: Option<Generation>` for `Created` and `Replaced` (today collapsed to a bool, `drain.rs:236-241`, `shell.rs:147-161`).
2. **First-hook IDENT step** (plan decision 7), only when `registered` is set, after the shell returned, behind the `HOME` guard, with the state root from the `identity` verbs' resolver (an explicit `FGOS_STATE_ROOT` wins, as for every reader): derive the own handle (`handle_of`), `directory::resolve` it read-only; found with this head's full id: done; found with another id: outcome-log `ident-handle-in-use`, nothing registered; `not-found`: C1's `register_writer(state_root, key, cli, Some(head_record), &[], false)`, or until C1 lands `register_current(state_root, head_pid, fgos_dir, None, &[], false)` for Claude Code only. A head whose record is incomplete is skipped. Any refusal (including the directory's 512-entry cap) is one outcome-log line; no retry in the process.
3. **The registering call is quiet by construction** (a new generation has no mail), so the write gate is idle and the watchdog covers the IDENT step; a test proves a registering call never emits a frame.
4. **Handle in frames** (plan decision 8): the store's render takes `handle_of: &dyn Fn(&WriterKey, &Cli) -> Option<String>` from the wiring (C1b's `handle_for`, else `machine_info` + `session::handle`); the header gains `handle="…"` through a new `escape_handle` (header alphabet plus `@`, bounded by `mailbox.frame.maxHeaderChars`); `escape_header` and `in_name_alphabet` unchanged. No snapshot change.
5. **Cost.** `cargo tree` shows the store crate unchanged; the host binary size before and after; steady no-mail `PostToolUse` p95 inside each CLI with the V5 live suite's `cost` (T1 Claude Code, T2 Codex, N = 99 each) against 50 ms (V5: 26.5 ms, 38.1 ms); the registering call measured over 50 process-level runs of the host entry against a directory seeded with 500 IDENT entries (through IDENT's own `register`), p95 against the same 50 ms target. A miss is named per component and handled like V5's question 24 (optimise the named cost), never by moving the step onto the steady path.

## Tests first

| # | Behaviour (test title) | File |
|---|---|---|
| T1 | a hook call that created or replaced a binding reports it as registered and a refreshing call does not | `store/tests/hook_shell.rs` |
| T2 | a registering hook call emits no frame | same |
| T3 | a registering call registers the head with IDENT once and a second call of the same head does not ask IDENT | `apps/fgos/tests/mailbox_routes.rs` (temporary state root) |
| T4 | a registering call whose handle IDENT already holds for another id registers nothing and records ident-handle-in-use | same |
| T5 | a hook call whose IDENT step fails still exits 0 with empty stdout and records the failure | same |
| T6 | the hook and a sender resolve the same IDENT state root under an explicit FGOS_STATE_ROOT and under a private HOME | same |
| T7 | a frame from a sender with a derivable handle shows it with @ kept, and a hostile value is escaped and bounded | `core/tests/frame.rs` |
| T8 | candidates and recipients still render through the header escape after the handle escape was added | `core/tests/report.rs` |

## Steps

1. Sync; T1-T8 failing; build; green: `cargo test -p fgos-mailbox-core -p fgos-mailbox -p fgos -p fgos-identity -- --test-threads=4`.
2. Seeded-directory cost run (no CLI, no model): 50 runs, numbers into the phase report.
3. Private release from the branch (V5's private shim, never activated); dry runs against stubs.
4. Live, benign, one each, no retry, through `test/live/mailbox-claude.live.mjs` (new cases `A1` Claude Code: send `--to <handle>` and `--to lead:<test-role>`, the role taken by `fgos identity session --role` inside the case's private state root; `A2` Codex: `--to <handle>`, through IDENT if C1 landed, else through the record match); then `cost` T1 and T2.
5. Report via `fgos convention path --kind report --type research --slug mailbox-v7b-aliases-and-hook-cost --json`; `fgos convention check`; spec §5.1, §5.5, §7.5 (cost), §17; sync.

## Acceptance (per CLI)

- Tests green; steady no-mail p95 at or under 50 ms in both CLIs, and the registering-call p95 at or under 50 ms with 500 entries, or each excess named per component.
- Claude Code: `A1` passes (handle and role). Codex: `A2` passes; its IDENT registration is claimed only if C1 landed.
- A frame seen by the model in `A1` carries `handle="…@…"`.

## Risks

- The frame text changes (the `handle` attribute), so V6's numbers were measured on the previous frame bytes; V7c and V7e freeze the new frame in their addenda, and spec §5.5 names which frame each number used.
- IDENT's `head_liveness` is unknown under bwrap print mode for IDENT's own registrations; the mailbox passes its verified head record through C1 so its entries can be judged.
