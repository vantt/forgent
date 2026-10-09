---
phase: 1
title: "Worker agent-config hygiene: hook trust first, masks only for what remains"
status: pending
budget: "<= 60 added src lines; 0 new files under src/runner/dispatch; no durable state"
stop: 2026-10-11
---

# Phase 01: worker agent-config hygiene

## Context

- [plan.md](plan.md); [confinement-authority.md](../../docs/specs/confinement-authority.md) §6.5 (driver has no provider branching), §8.3, §9.2 (masks as contract data, tracked-file hazard), §13.
- Trust seeding today: `seedWorkspaceTrust` / `trustStorePaths` (`src/runner/dispatch/herdr-round.mjs:650,703`) writes folder trust into the worker's private `CODEX_HOME/config.toml` and removes it on settle. Only `auth.json` is copied from the account home (`confinement/drivers/bwrap.mjs:92-100`).
- Observed 2026-10-09 on mcp-skill-hub: agy blocks every tool on a failing PreToolUse hook (exit 127); codex hook-trust dialog per fresh home; codex stalls on target MCP `skillhub` `internal_error`. Earlier: claude stuck on target `.mcp.json` dialog ([evidence table row 1](../../archive/reports/discussion-advisory-approach-current-261008.md)).
- Diagnosis 2026-10-09 (this plan's owner session):
  - codex stores hook trust as `[hooks.state."<abs hooks.json>:<event>:<group>:<handler>"] trusted_hash` in `config.toml`; the hash is sha256 of the key-sorted JSON of `{event_name, matcher, hooks:[{type:"command", command, timeout:600, async:false}]}` (`openai/codex` `codex-rs/hooks/src/engine/discovery.rs`, `codex-rs/config/src/fingerprint.rs`). Reproduced: both real hashes in `~/.codex-fgovn/config.toml` match.
  - `codex app-server` `hooks/list` for `forgentX/.codex/hooks.json`: `untrusted` with an empty home, `trusted` after seeding the computed hashes. So the codex hook dialog is fixed at its root by seeding, not by masking.
  - The trust key is the absolute path of `hooks.json`, so seeding must be derived from the worker's cwd. A worktree without `.codex/hooks.json` has no project hooks (`hooks/list` empty).
  - The hook command `.fgos/installation/bin/fgos hook ...` is cwd-relative; from any directory other than a checkout holding `.fgos/installation` it exits 127 (reproduced from `/tmp`).
  - Not explained: `Continue anyway? [y/N]` in the council-lite openai seat, whose cwd was a worktree with no project hooks. Needs its full screen captured.

## Decision

Fix the cause that is proven, then measure what is left.

1. **Seed codex hook trust** next to folder trust: for every hook entry in the worker cwd's `.codex/hooks.json`, write the `hooks.state` entry with the computed hash into the private `CODEX_HOME/config.toml`, and remove exactly those entries on settle (same lifecycle as folder trust).
2. **Masks are not built up front.** After 1, run R1; add a mask for a file only if R1 still shows a fault that file causes (agy hook exit 127, target MCP `internal_error`, claude `.mcp.json` dialog). Any mask keeps the earlier contract: contract data next to `BLIND_HIDDEN_ROOTS`, read-only confined workers only (no writable workspace grant; masking tracked files in a writable workspace is the §9.2 hazard), neutral content, no per-provider branch in the driver.
3. Hook installer fail-open stays deferred; the proven 127 cause is the cwd-relative command, to be handled as its own item if a worker with write access hits it.

## Requirements

- Hash function is a small pure function with a test that pins it to the two real hashes from the diagnosis (command strings and expected values in the test).
- Seeding never throws (same stance as `seedWorkspaceTrust`); a hooks file that cannot be parsed or has an unsupported handler type is skipped and noted in the round note.
- Only entries this round wrote are removed on settle.
- No change when the cwd has no `.codex/hooks.json`.

## Files

- Modify: `src/runner/dispatch/herdr-round.mjs` (call site next to `seedWorkspaceTrust` / `removeWorkspaceTrust`); the trust-store module that owns `seedCodexTrust` / `removeCodexTrust` (locate with grep before editing) for the hash + write/remove helpers.
- Tests: next to the existing trust-store tests (locate with grep); one test runs `codex app-server` `hooks/list`-free: pure hash vs known values, plus seed/remove round trip on a temp `config.toml`.
- Docs: one paragraph in `docs/specs/runner.md` or the spec that owns trust seeding; `CHANGELOG.md` `## [Unreleased]`.
- Delete/leave: no installer change; no mask code in this phase unless R1 demands it.

## Steps

1. Impact analysis per the CLAUDE.md capability gate on `seedWorkspaceTrust`, `removeWorkspaceTrust`, `seedCodexTrust`; report risk.
2. Add hash + seed/remove helpers; wire into the round.
3. Unit tests (builder gate).
4. Spec paragraph + CHANGELOG line. No new config, env var or tool, so no doctor check (say so in the commit body). No component-boundary change.
5. Independent review, then merge; Lead runs R1 on the codex account `tetcu72` and records which faults remain.

## Done

R1 (plan.md). Builder does not run R1. A fault R1 hits outside this file list is a separate work item; the list of remaining faults decides whether a mask follow-up is opened.

## Risks / rollback

- Hash algorithm is a private codex contract; a codex update can change it. Mitigation: the pinned test fails loudly against known hashes, and a stale seed only brings back the dialog, never a wrong trust grant (codex compares hashes).
- Seeding trusts exactly the hooks currently in the file: the same decision the owner makes when pressing "trust". It must run only for the cwd the worker actually runs in.
- Rollback: revert the commit; the private home is deleted after each run.
