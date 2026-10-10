---
phase: 7
title: "Claude worker: approve the target's own MCP servers per process"
status: pending
budget: "<= 70 added src lines; 0 new files under src/runner/dispatch; no durable state"
stop: 2026-10-14
---

# Phase 07: claude worker MCP approval per process

## Context

- [plan.md](plan.md). Dialog captured 2026-10-10 (pty run of `claude` in mcp-skill-hub): "New MCP server found in this project: skillhub ... Use this MCP server / Use this and all future MCP servers in this project / Continue without using this MCP server", footer `Enter to confirm · Esc to cancel`. Seats stop there (`not briefed`).
- `~/.claude.json` project entry has `hasTrustDialogAccepted: true` but empty `enabledMcpjsonServers` / `disabledMcpjsonServers`. That file is written constantly by every claude session; a read-modify-write of it from dispatch would race.
- Verified: `claude --settings <file>` with `{"enabledMcpjsonServers":["skillhub"]}` starts at the prompt with no dialog, and writes nothing shared.
- Read-only workers may need the target's MCP (the target's AGENTS.md tells agents to call `skill_resolve`), so declining the servers (`disabledMcpjsonServers`) is rejected: it removes capability instead of solving the dialog.
- Separate question, not this phase: whether `skillhub` works inside the sandbox (codex stalled on its `internal_error`).

## Decision

Pass a per-process settings file to claude workers whose project root is already trusted: `enabledMcpjsonServers` = the server names declared in the project's `.mcp.json`. Same derivation rule as folder and hook trust (propagate a trust decision the person already made for the root; sandbox bounds what a server can do).

## Requirements

- The settings file lives in the worker's own run/private area, never in the project and never in `~/.claude.json`.
- Names come from the cwd's `.mcp.json` `mcpServers` keys; no `.mcp.json` means no flag.
- Applied only when the folder is trusted in the account store (reuse the existing trust check).
- Only claude workers; no provider branch in the confinement driver: the claude-specific piece lives where the claude trust store kind is already handled.

## Files

- Modify: the claude trust-store path (`src/runner/dispatch/trust-store.mjs` helper + `src/runner/dispatch/herdr-round.mjs` call, or the adapter that builds agent args; locate before editing).
- Tests: next to the trust tests; one test that the generated file lists the declared servers and is skipped without `.mcp.json` or without trusted root.
- Docs: `docs/specs/confinement-authority.md` one line; `CHANGELOG.md`.

## Steps

1. Impact (capability gate) on the args builder and `seedWorkspaceTrust`.
2. Locate where the claude agent's args are assembled per dispatch; add the flag there.
3. Tests, `npm test`, independent review, merge.
4. Verify with the claude probe in mcp-skill-hub; then the full R1.

## Done

R1 (plan.md): claude seat no longer stops at the MCP dialog.

## Risks / rollback

- The approved server runs inside the worker sandbox; if it hangs there the seat stalls (separate item).
- claude weekly quota is near the limit (99% on 2026-10-10): probes cost real quota.
- Rollback: revert; nothing persists.
