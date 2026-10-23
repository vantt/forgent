---
title: "Mailbox V7e phase 7: pi and omp recordings, injection roles, MCP-off and session facts"
description: "Phase 7 of plans/261023-1411-mailbox-v7-codex-postooluse-pi-omp-and-aliases: pi 1.4.0 and omp 18.12.6 pointed at a local recording endpoint under the confined launch, with no model call. Every extension injection method measured for the role it reaches the provider under; MCP-off proven with its falsifier; subagent, runner-id and session-id facts; the method phase 8 uses; and the account facts that block pair P3."
date: 2026-10-24
---

# Mailbox V7e phase 7: pi and omp recordings and roles

Branch `mailbox/v1-v3`. Owner Q2 option A (2026-10-23 14:53). Scratch and run data on ext4 only: `~/projects/forgent-worktrees/mailbox-evidence/v7/` (probe home `fgos-work/mailbox-v7e-probe-live/`, logs `fgos-work/mailbox-v7e/`).

**Model calls spent in phase 7: 0** of the about 12 benign runs Q2 allows for phases 7 and 8. Every probe below, including the subagent, runner-id and MCP-off probes the plan had placed under Q2, ran against the recording endpoint with a scratch login, so no probe needed a model.

## Versions

- pi 1.4.0. Launcher `~/.local/bin/pi` → `~/.pi/agent/bin/pi`, a shell script that execs `~/.pi/agent/install/releases/1.4.0/…/pi` through `#!/usr/bin/env node`.
- omp 18.12.6. A single binary `~/.local/bin/omp` (bun); its native addon is at `~/.omp/natives/18.12.6/`.
- Both export `PI_SESSION_ID` and `PI_SESSION_FILE` to their bash tool. omp did not export them at 18.11.2 (probe of 2026-10-20); it does at 18.12.6 (session probe below).

## How the probes ran

- **Recording endpoint.** `scripts/lib/mailbox-role-recorder.mjs` (test `test/scripts/mailbox-role-recorder.test.mjs`):
  - It is a harness instrument on 127.0.0.1, never a model.
  - It keeps each request (path, header names, body decoded from its zstd encoding) in a 0600 file. It never keeps a header value.
  - It answers in the OpenAI Responses stream shape: first a `bash` call running `ls`, then the text `done`.
- **Provider override.**
  - pi: the documented `models.json` override of the built-in `openai-codex` provider's `baseUrl`.
  - omp: the same in `models.yml`.
  - Both CLIs then send their normal `openai-codex` Responses request, through their own converter, to the endpoint. Both first try a websocket upgrade, which the endpoint refuses, and fall back to HTTP.
- **Login.** A scratch OAuth login, token-shaped, naming a scratch account. It is materialized the way a real run's login will be (below).
- **Confinement.** Every probe ran under the behaviour suite's confined launch:
  - the home allow-list;
  - bound back read-only: pi's `~/.pi/agent/{bin,install}`, `~/.local/bin/omp` and `~/.omp/natives`;
  - `PI_NATIVES_DIR` pointing at the natives, so nothing is unpacked into a run.
  - Mask plan sha256 `f03dada76ca5…` in every ledger entry.
- **The probe extension.** `test/live/mailbox-role-probe-ext.ts`, loaded by path (`-e`) with every other source off. It injects `MARK-<method>` at the first tool result through the method under test.
- **Harness subcommands** (`test/live/mailbox-behaviour.live.mjs`):
  - `role-probe <pi|omp>`
  - `session-probe <pi|omp>`
  - `mcp-probe <pi|omp> [--without-off]`
- 38 probe runs; results in `mailbox-v7e-probe-live/results/`.

## Role table

The role each method reaches the provider under. Each method was run once per CLI against the recorder, on the `openai-codex` Responses converter.

| Method (at the first tool result) | pi 1.4.0 | omp 18.12.6 | Point | New turn |
|---|---|---|---|---|
| `tool_result` handler appends a text block (the real output kept) | `function_call_output` (tool output, no role) | `function_call_output` | the same request as the tool's own output | no |
| `context` handler inserts a `custom` message | `user` | `developer` | the next request only (request-local, not stored) | no |
| `context` handler inserts a `developer` message | dropped (not sent) | `developer` | next request only | no |
| `context_with_system` appends to the system message | `instructions` | dropped (not sent) | next request only | no |
| `before_provider_request` pushes a `developer` item (Responses shape only) | `developer` | `developer` | next request only | no |
| `before_agent_start` returns a system prompt | `instructions` | `instructions` | every request of the run, from the start (not mid-step) | no |
| `sendMessage` custom, no `deliverAs` / `steer` | `user` | `developer` | next request | no |
| `sendMessage` custom, `followUp` | `user` | `developer` | after the run's last answer | yes (one more request) |
| `sendMessage` custom, `aside` (omp) | - | `developer` | next request | no |
| `sendMessage` custom, `nextTurn` | not sent in the run | not sent in the run | the next user turn | - |
| `sendUserMessage`, no `deliverAs` | not sent (the run was streaming) | - | - | - |
| `sendUserMessage`, `steer` / `aside` | `user` | `user` | next request | no |
| `sendUserMessage`, `followUp` | `user` | `user` | after the last answer | yes |

What the table shows:

- **On pi, every message-shaped method reaches the provider as `user`.** That covers `context`, `sendMessage` with any `deliverAs`, and `sendUserMessage`. pi converts its `custom` message role to `user` for this provider.
- **On omp, the same custom message reaches it as `developer`.** omp's converter maps `custom` to `developer` (from omp's own bundled source).
  - That mapping depends on the provider converter. The Gemini converter was not recorded (see P3 below).
- **Four methods are request-local.** `context_with_system`, `before_provider_request` and both `context` insertions change one request only and are never stored, so a frame they carry is gone from every later request of the run.
- **The system prompt** is fixed at run start. It cannot carry mail that arrives mid-step.
- **The `tool_result` append is the one method that is:**
  - stored (it is part of the tool's result in the session);
  - mid-step;
  - the same on both CLIs;
  - available on every provider, since every API has a tool-result carrier (corrected after the V7e review, M2: its role was recorded through the openai-codex Responses converter only; on another provider a tool result may ride inside a `user`-role message, unmeasured). It reaches the provider as tool output, the lowest-authority carrier, and the same carrier that held the frame in V7c arm P (`custom_tool_call_output` after `inbox --claim`).

## Method for phase 8, and the hard gate

**Both CLIs: the `tool_result` handler appends the frame as a text block after the tool's real output. The carrier is tool output (`function_call_output`), not `user`.** The hard gate does not fire for either CLI, so no owner question is needed for it.

- This is a plan-owner decision inside the frame.
- The plan expected a tool-result rewrite to be "rejected as a channel, like agy's `overwriteResult`". That reason does not apply:
  - agy's hook can only *replace* a tool's real output with peer text.
  - pi and omp keep the real output and add the frame after it, so the model still gets the tool's real output.
- `channels.postToolUse` will be recorded as `{deliver: true, role: "tool"}`.
- `channels.stop` will be recorded as `{deliver: false}` for both CLIs, so neither gets a wake channel, as with Codex:
  - pi has no non-`user` turn-starting method;
  - omp's `sendMessage … triggerTurn` would reach the model as `developer` only on this provider.

## Subagents

- **pi 1.4.0:** no subagent tool. Its tools are `read`, `bash`, `powershell`, `edit`, `write`, `grep`, `find` and `ls`.
- **omp 18.12.6** (session probe; the recorder answered the head with a `task` call, then a `wait`):
  - The subagent runs in the same process. A second instance of the extension loads for it.
  - Its `tool_result` fires with its own session id.
  - **Marker:** `ctx.sessionManager.getHeader().parentSession` is a string in the subagent's session and undefined in the head's. The subagent's session file lies under the parent's session directory (`<parent>/Sub.jsonl`).
  - A forked session may also carry `parentSession`; that case was not measured. Treating it as a subagent fails safe (quiet).

## Session ids

- **pi `/new`** (interactive, zero model, scratch home in a private tmux):
  - the extension is loaded again;
  - `session_start` fires;
  - `getSessionId()` returns the new id.
- **pi `/resume`:** the extension is loaded again, and `session_start` carries the resumed session's id.
- **omp `/new`:** no reload and no `session_start`, but `getSessionId()` at the next tool result returns the new id. The adapter reads the id at each tool result, so it follows `/new` on both CLIs.
- **omp `/resume`:** not observed. The probe's turn after the resume produced no tool call in the observation window.
- The interactive probes ran unconfined, with a scratch home and a scratch login against the recorder, never the owner's.

## Process and environment (for the caller check and the runner rule)

- **pi's head process:** `/proc/<pid>/exe` is the `node` binary; `comm` is `pi`.
- **omp's head process:** `/proc/<pid>/exe` is `~/.local/bin/omp`; `comm` is `omp`.
- The extension runs inside the head process, so a hook it spawns has the head as its parent (direct topology).
- **pi's executable name `node` is not specific to pi.** Phase 8 decides how the caller check names a pi head.
- **Runner id.** A runner-style `FGOS_SESSION_ID=att-probe-runner` in the CLI's environment reaches the extension's `process.env` on both CLIs (session probe). The extension must therefore check it and stay inert (plan decision 10).

## MCP-off (owner's requirement; confined launch, no model)

The planted server was a stdio MCP server (`test/live/mailbox-mcp-probe-server.mjs`) in every project MCP source (`.mcp.json`, `mcp.json`, `.claude/mcp.json`, `.cursor/mcp.json`, `.pi/mcp.json`), plus pi's user `mcp.json` in the private home.

| CLI | Confined launch | Same launch without the off switches (falsifier) |
|---|---|---|
| pi | tools `read bash powershell edit write grep find ls`; no MCP tool | adds `codemode`, `tool_search`, `mcp__planted__mbx_planted_probe` |
| omp | 18 built-in tools; no MCP tool; the planted tool in 0 provider requests | adds `mcp__planted_mbx_planted_probe`; named in 2 provider requests |

- **pi's switches:** `--offline --no-extensions --no-mcp --no-skills --no-prompt-templates`.
- **omp's switches:** `--no-extensions --no-skills --no-rules --no-lsp --no-title` plus the `--config` overlay `mcp.enableProjectConfig: false`.
  - omp has no MCP flag.
  - Its user-level MCP sources live in the private home, which holds none. A planted user-level file is loaded whatever the switches (measured in a scratch run).
- **Limit:** omp's `web_search` tool stays on, as Codex's network access does.

## Logins and accounts (affects phase 9)

- **pi's own `openai-tetnu` login expired** (its `expires` was 6.7 h in the past on 2026-10-23 23:5x).
  - Using it would make pi refresh, rotating the refresh token inside a run copy.
  - **Decision (plan owner, inside the frame):** pi and omp both carry the same approved account's (`openai-tetnu`) Codex OAuth login, read read-only from omp's `openai-tetnu` profile store. At the time of reading it had about 201 h left.
  - The login is materialized in the private home, never linked:
    - pi: its `auth.json`;
    - omp: an `agent.db` holding only that credential, through omp's own `auth import` with the private home as `HOME`.
  - The guard compares pi's copy by bytes and omp's by its credential rows, because omp writes usage rows into the same database on every run.
  - No credential row of the owner's is written. **Corrected after the V7e review (M3):** the read-only open of the owner's `agent.db` wrote its `-shm` index (a 5 ms touch, measured once; the database and the WAL untouched). The store is now copied to scratch and the copy is read.
  - Tests:
    - `a confined pi or omp run cannot read the real account stores, starts from its bound-back binary, and its copied account holds no sessions`;
    - `an omp login copy is compared by its credential rows: …`;
    - `the account credential is read from the profile store read-only, …`.
- **`gemini-tetnu` holds no login.**
  - `~/.omp/profiles/gemini-tetnu/` has only `agent/config.yml`, with no `agent.db` and no credential, created 2026-10-21 20:48.
  - The owner's other Gemini login is `gemini-tetcu72`, which Q2 does not allow.
  - **Pair P3 (omp + Gemini) cannot run** under the approval as given. Its Gemini role mapping is also unrecorded, because the recorder speaks only the Responses shape.
  - The decision question is below. P1 and P2 do not depend on it.

## Fixtures (deviation)

The plan's requirement 6 asked for pi/omp fixtures in phase 7. The pi/omp hook payload is the mailbox's own (both ends are ours, phase 8 requirement 2), so there is nothing to record before the extension exists. The fixtures and their guard (T4) move to phase 8, recorded from the generated extension through the recorder with no model.

## Decision question for the owner (P3)

- **What is happening:** pair P3 (omp with a Gemini model on `gemini-tetnu`) cannot start, because that omp profile was never logged in. It holds no credential store.
- **Cause:** the profile was created on 2026-10-21 with settings only. The only Gemini login on this machine is `gemini-tetcu72`, which Q2 excluded.
- **Options:**
  - **A.** The owner logs in `omp --profile=gemini-tetnu` once. P3 then runs after P1 and P2 inside Q2's ceiling. Cost: one owner login; P3 starts later.
  - **B.** Allow `gemini-tetcu72` for P3. Cost: a second personal account carries the copy and its egress residual.
  - **C.** Drop P3. P1 and P2 still split the CLI effect from the model effect against V7c; the model-family comparison is lost.
- **Recommendation:** A. It keeps the approved account and adds no new risk.
- **Scope of the answer:** only P3's account. P1 and P2 run without waiting.

## Proofs

- `test/scripts/mailbox-role-recorder.test.mjs`: 1 test, green.
- `test/scripts/mailbox-live-confined.test.mjs`: the three new tests, green under real bwrap.
- Probe evidence:
  - `role-probe-pi.log`, `role-probe-omp.log`, `session-probe.log`, `mcp-probe.log` under `…/fgos-work/mailbox-v7e/`;
  - per-run JSON under `…/mailbox-v7e-probe-live/results/`.
