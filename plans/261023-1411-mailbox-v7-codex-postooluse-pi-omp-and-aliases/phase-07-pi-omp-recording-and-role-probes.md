---
phase: 7
title: "V7e: pi and omp recordings, extension contracts and the role of each injection method"
status: pending
sub_rung: V7e
depends_on: [phase 1, phase 5 (harness home); owner Q2 for the real-model probes only]
live_budget: "read-only checks and recorder runs: no model call (plan decision 9); real-model probes: about 8 benign runs inside Q2"
---

# Phase 7: pi/omp recordings and role probes (V7e)

## Context

pi 1.4.0 and omp 18.12.6 are installed (F11); the last probe ran pi 1.3.0 and omp 18.11.2: pi exports `PI_SESSION_ID` to its Bash tool, omp exports nothing; both give `ctx.sessionManager.getSessionId()` to an extension handler; omp's terminal-session record is not trustworthy; pi refused a `sendUserMessage` without `deliverAs` (spec §7). The role question is the Codex lesson: a body that reaches the model as `user` is an injection channel.

## Requirements

1. **Read-only first.** Without running a model: whether pi accepts a custom provider with a base URL (its `models.json` schema) and whether omp does (`omp --help`, its config schema); the extension API's injection methods from the installed type definitions (read-only under `~/.pi/agent/install` and omp's equivalent; if a path is blocked, the report says so). The recorder is built only for a CLI that accepts a custom endpoint.
2. **Account and launch** (plan decision 11): the shell functions are bypassed; pi runs `/home/vantt/.local/bin/pi` with `PI_CODING_AGENT_DIR=<private copy holding only the login file of ~/.pi/accounts/openai-tetnu>`; omp runs `/home/vantt/.local/bin/omp --profile=<name>` with a private profile holding only its login file. Masks over `~/.pi` and `~/.omp`; bound back read-only only `~/.pi/agent/{bin,install}` and `~/.omp/natives`; copied `sessions/` left empty; byte compare after each run and set-aside on change (the `codex-auth-guard` rule extended).
3. **Recording endpoint** (harness instrument, not a model): a local OpenAI-compatible endpoint on 127.0.0.1 that writes each request body to a 0600 file inside the run directory and answers a scripted two-turn exchange (a tool call running `ls`, then a final text).
4. **Each injection method once per CLI against the recorder**: `tool_result` rewrite (expected rejected as a channel, like agy's `overwriteResult`), `context` message insertion, custom message (`sendMessage` with a custom type), `sendUserMessage` with each `deliverAs`, system-prompt change at `before_agent_start`. Recorded: did the text reach the provider request, under which role, at which point, and did it start a new turn.
5. **Real-model probes** (Q2, benign, one each): does the extension load and fire inside an omp `task` subagent (and a pi one if any), and what marks it; does `getSessionId()` change on `/new` and `/resume` (interactive, one pane each); the hook process's parent executable for the caller check; whether a runner-style `FGOS_SESSION_ID=att-…` in the CLI's environment reaches the extension (the extension must then stay inert, plan decision 10).
6. Fixtures under `packages/mailbox/contracts/fixtures/hooks/{pi,omp}/` recorded by `scripts/record-mailbox-hook-fixtures.mjs` (extended) outside every checkout, redacted by allowlist.

## Tests first

| # | Behaviour (test title) | File |
|---|---|---|
| T1 | a confined pi or omp run cannot read the real account stores, starts from its bound-back binary, and its copied account holds no sessions | `test/scripts/mailbox-live-confined.test.mjs` (real bwrap) |
| T2 | a changed pi or omp login copy is set aside, never deleted, and stops the batch | `test/scripts/codex-auth-guard.test.mjs` |
| T3 | the recording endpoint writes each request body to a 0600 file in the run directory and serves the scripted turns | `test/scripts/mailbox-role-recorder.test.mjs` (module `scripts/lib/mailbox-role-recorder.mjs`) |
| T4 | the fixture guard refuses a recording that leaks a field outside the allowlist | `store/tests/fixtures_contract.rs` |

## Deliverable and gate

Report `research-…-mailbox-pi-omp-recordings-and-roles.md` (name from `fgos convention path`): versions; the role table (method × CLI → role, turn point, new turn); the subagent answer; the id answers; the hook topology; for each CLI the method phase 8 will use, or "deferred" with the reason. **Hard gate:** if a CLI has no method whose role is not `user`, that CLI is deferred and the report carries a decision question for the owner (template `core/skills/_shared/decision-question.md`) on whether a user-role pointer line is acceptable; phase 8 does not build it without the answer.
