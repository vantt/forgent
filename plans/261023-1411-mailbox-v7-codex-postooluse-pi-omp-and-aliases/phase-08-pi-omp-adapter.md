---
phase: 8
title: "V7e: pi and omp adapter through the one generated extension"
status: pending
sub_rung: V7e
depends_on: [phase 3, phase 7 report and its gate]
live_budget: "about 4 benign live-suite runs inside Q2"
---

# Phase 8: pi/omp adapter (V7e)

## Requirements

1. **One extension, one door** (plan decision 10): `generateInProcessExtensionSource(options)` in `src/setup/agent-hooks.mjs` emits the mailbox handlers only for an opted-in project (`mailbox.enabled`); doctor's byte check compares with the generator called with the same option. The handler:
   - does nothing when `process.env.FGOS_SESSION_ID` starts with `att-` (a runner worker) and never writes `process.env`;
   - finds the shim by walking up from `ctx.cwd` to the first `.fgos/installation/bin/fgos` that is a regular file owned by the user and not group- or world-writable (none found: nothing, fail open);
   - `spawnSync`s `<shim> hook mailbox --cli <pi|omp> --event <post-tool-use|stop>` with a payload `{session_id, hook_event_name, cwd}` (`session_id` from `ctx.sessionManager.getSessionId()`), timeout `ceil(mailbox.hook.budgetMs/1000)+2` s, stdin closed after write; any failure swallowed.
2. **Host answer** for pi/omp is the mailbox's own contract (both ends are ours): `{"inject": "<text>", "method": "<phase 7 method>"}` or empty; the extension applies only the method the adapters contract names for that CLI and version.
3. **Store adapters** `adapters/{pi,omp}.rs`: parse the payload; writer key from `session_id` (like Codex); a payload whose `session_id` starts with `att-` is quiet `RunnerHead`; subagent marker as phase 7 recorded (none: that CLI deferred like agy); `hookFacts` topology `direct`, `headExecutables` from phase 7, `postToolUseContextMaxBytes` from a ladder like V5's (or `null`); channel facts with roles, held by phase 1's rule (no delivering channel with role `user`).
4. `adapters.v1.json`: `testedAgainst` for pi 1.4.0 and omp 18.12.6 only with recorded fixtures; else `deferred` with the reason.
5. Sends from pi/omp tools: `~unregistered` unless C4 makes session identity read `PI_SESSION_ID` (pi only); stated in spec §5.1.1.
6. **Live-suite cases** (spec §14 V7 row: each adapter with its own live suite): `P1` (pi) and `O1` (omp) in `test/live/mailbox-claude.live.mjs` (the one live-suite door; registration, mid-step frame, `send` back), version pin checked before each case.
7. Spec §4.1 layout row, §6.2 nudge table, §7 (pi/omp recorded), §11 (cases), §15.3 (moved out of "later"), §17.

## Tests first

| # | Behaviour (test title) | File |
|---|---|---|
| T1 | the generated extension carries the mailbox handlers only for an opted-in project and doctor accepts exactly that file | `test/setup/agent-hooks.test.mjs` |
| T2 | the generated extension loads in Node with only node: builtins | same (V5 H1's import proof, extended) |
| T3 | the extension stays inert for a runner worker and never writes the process environment | same (the handler run against a stub `ctx`) |
| T4 | the extension finds the shim from a subdirectory and refuses a group-writable or foreign-owned shim | same |
| T5 | a recorded pi/omp payload registers the head from its session id and drains at post-tool-use within the bound; a subagent marker and an att- session are quiet | `store/tests/hook_payloads.rs` |
| T6 | a pi/omp head whose parent executable is not in headExecutables never registers | `store/tests/head.rs` |

## Steps

Sync; T1-T6 failing; implement; green; private release; `P1`/`O1` dry, then once each for real (benign); spec; sync; board.

## Acceptance

Both CLIs either tested (fixtures, cases passed) or deferred with a recorded reason; no delivering channel with role `user`; the extension never touches process identity.
