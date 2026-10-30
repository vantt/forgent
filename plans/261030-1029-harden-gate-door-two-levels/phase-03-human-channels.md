# Phase 03: Human channels: Claude hook, dashboard, Work `answer --approve`; the MCP approve path goes

Decision 55 (2a): a human answer counts only from the hook on the real `AskUserQuestion` result, the dashboard, or the CLI from a non-agent session (the CLI check landed in phase 02). A plain-chat answer is never a grant; the agent re-asks through a channel that is one. Runs in parallel with phase 04 (disjoint files).

## Context

- Claude Code is the only CLI with a result hook on `AskUserQuestion`; Codex and agy users answer through the dashboard or a human terminal (shape adjustment 4).
- The hook table is `src/setup/agent-hooks.mjs:118-139`; the `decision-question` row (`:121`) is a PreToolUse form check and stays. Native hook kinds are listed in `packages/host-runtime/contracts/command-routes.json:486-489` (`mailbox`, `mailbox-sync`), wired under `apps/fgos/src/wiring/`.
- The mailbox hook's caller check (`packages/mailbox/rust/store/src/head.rs:164` `caller_is_head`) proves a hook was started by the CLI head, within the same-user limit (`docs/platform/agent-mailbox/spec.md:448`).
- The dashboard answers by spawning the CLI: `apps/fgos-gateway/src/gateway.rs:918-924` (`post_work_answer`, forwards `--approve`, tests `:2233-2280`). The gateway MCP surface, which agents call, also forwards approve: `apps/fgos-gateway/src/mcp.rs:282-294`, test `:641`. An agent with that MCP tool can approve today.
- `fgos answer --approve` (`bin/fgos.mjs:1896-1899`) is the Work park's explicit yes; it writes `approved` on `work.move`.

## Requirements

1. **Hook channel.** New native hook kind `gate-answer`: `fgos hook gate-answer` reads the PostToolUse payload, passes the mailbox caller check (reused, not copied: move `caller_is_head` and its ancestry reader to Identity if the gate crate cannot depend on the mailbox crate without a cycle; decide by the dependency graph at build), finds the `gate:<askId>` marker that `gate-ask` told the agent to put in the question, checks that the ask is pending and was asked by the same session key, reads the selected option from `tool_response`, and calls `grant` (selected option equals the ask's approve option) or records `gate.declined`. Fail quiet: never blocks the tool call; prints one line of additional context naming the grant or the decline.
2. **Hook row.** One Claude row in the hook table: `PostToolUse`, matcher `AskUserQuestion`, command `<shim> hook gate-answer`, new `HOOK_KINDS.GATE`. Installers and doctor checks are table-driven, so no new doctor row. MAIL is told before the table changes.
3. **Dashboard channel.** The gateway links `fgos-gate` and grants in process: `POST /v1/gates/{askId}/answer {answer, approve}` and `GET /v1/gates?pending=true` (display list), behind the existing gateway authentication. `post_work_answer` with `approve: true` grants every pending ask whose `ref.work` is the item, in process, then calls the CLI `answer` without `--approve` for the Work status move.
4. **Work CLI.** `fgos answer <id> --approve` grants the item's pending asks through the CLI channel before the Work answer; from an agent session it refuses as a whole with `agent-session-cannot-grant`. With no pending ask it behaves as today (the Work `approved` field goes in phase 05).
5. **MCP.** `answer_work` loses its approve argument; an MCP answer is a clarification only. The MCP description says approvals go through the dashboard or a human terminal.
6. **Refusal text** for `require` and for `gate-ask` output names the three channels and, on Codex and agy, the dashboard URL from `fgos gateway status`.

## Files

- **Create:** `apps/fgos/src/wiring/gate_hook.rs`; `packages/gate/rust/tests/hook.rs`.
- **Modify:** `packages/gate/rust/src/channel.rs` (hook and dashboard sources), `packages/gate/rust/src/lib.rs`; `apps/fgos/src/wiring/mod.rs`, `apps/fgos/src/main.rs`; `packages/host-runtime/contracts/command-routes.json:486-489` (`native_kinds` adds `gate-answer`); `src/setup/agent-hooks.mjs:118-139` (one row, one kind constant); `bin/fgos.mjs:4972` (`ALLOWED_HOOK_KINDS` is the legacy list; only touched if the native kind list requires it) and `:1886-1900` (`answer --approve` through `src/gate/door.mjs`); `apps/fgos-gateway/Cargo.toml`, `apps/fgos-gateway/src/gateway.rs:918-930,1198` (+ the two gate routes), `apps/fgos-gateway/src/mcp.rs:150,282-294,438`.
- **Delete:** the approve argument of MCP `answer_work` (`mcp.rs:291-294`) and its test (`:641-648`); the CLI subprocess `--approve` forwarding in `post_work_answer` (`gateway.rs:924` approve branch); if moved, `caller_is_head` leaves the mailbox crate (mailbox imports it from Identity).

## Tests to retire, and the test that now owns the behaviour

| Retired | Now owned by |
|---|---|
| `mcp.rs` `execute_answer_work_forwards_approve_when_passed_as_third_argument` (`:641`) | behaviour removed (MCP cannot approve); one MCP test proves an approve argument is rejected |
| `gateway.rs` `post_work_answer_forwards_approve_flag_when_true` (`:2233`) | `gateway.rs` test that an approving POST writes a `gate.granted` with `channel: dashboard` and calls the CLI without `--approve` (rewritten in place, same file) |
| none in `src/setup` | the existing table-driven hook install test gains one row case (`test/setup/registrations.test.mjs` or the agent-hooks test that owns the table), not a new file |

New owning proofs: hook grant and decline from a recorded real Claude PostToolUse payload, and refusal of a payload whose ask was made by another session (`packages/gate/rust/tests/hook.rs`); `fgos answer --approve` from an agent session refuses (one CLI wiring test in the file that owns `answer`, found with `rg -l "'answer'" test/cli`).

## Steps

1. Capture one real Claude Code PostToolUse payload for `AskUserQuestion` (live run, stored as a fixture with the question text and selected option); this is the measured fact the hook parses.
2. Decide where the caller check lives (Identity or mailbox) by the crate graph; move it once if needed.
3. Hook kind, wiring, table row; MAIL told.
4. Gateway in-process grant and the two routes; MCP approve removed.
5. `fgos answer --approve` through the door.

## Validation

- `cargo test -p fgos-gate`, `cargo test -p fgos-mailbox` (if the caller check moved), `cargo test -p fgos --test cli_tests hook`, `cargo test` in `apps/fgos-gateway`
- Focused Node via `fr.mjs`: the agent-hooks install test, the `answer` CLI test, `test/rust-host/command-routes.test.mjs`
- Live: in a Claude Code session, `gate-ask`, answer the question, `gate-show --json` shows `granted` with `channel: hook:claude`; from the same session `fgos answer <id> --approve` refuses; from a plain terminal it grants; from the dashboard on the second machine it grants and the asking machine sees it after `fgos events sync`.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Claude Code changes the PostToolUse payload shape | M x M | Parser keyed on the recorded fixture; an unknown shape is a quiet no-op plus a friction row, so the agent re-asks and the human can use the dashboard |
| An agent forges a hook payload (same-user limit) | L x H | Session match against the ask, recorded channel and session; Q3 |
| Dashboard grants for an ask that is no longer pending | L x L | `grant` refuses `ask-not-pending`; the UI refreshes |

## Rollback

Revert with drop B. The hook row is removed by `fgos setup` of the previous release (table-driven install migrates its own rows only; verify the previous release leaves an unknown fgOS row harmless: the shim prints an unknown-kind error and exits 0 under the hook's `|| true` guard; if not, the guide lists the one line to delete).

## Net size (estimate)

Rust: about +260 (hook parse and checks, gateway routes and grant). Node: about +10 (one table row, `answer` call through the door). Tests: about +150 Rust, about -30 rewritten. Deleted: MCP approve path about -20.
