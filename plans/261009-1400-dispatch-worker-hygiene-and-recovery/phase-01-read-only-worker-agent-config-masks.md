---
phase: 1
title: "Read-only worker agent-config masks"
status: pending
budget: "<= 60 added src lines; 0 new files under src/runner/dispatch; 1 static asset under core/; no durable state"
stop: 2026-10-11
---

# Phase 01: read-only worker agent-config masks

## Context

- [plan.md](plan.md); [confinement-authority.md](../../docs/specs/confinement-authority.md) §6.5 (driver has no provider branching), §8.3, §9.2 (masks as contract data, tracked-file hazard), §13.
- `BLIND_HIDDEN_ROOTS` + token resolution: `src/runner/dispatch/confinement/resources.mjs:26-34,194-215`.
- Driver mount order: `src/runner/dispatch/confinement/drivers/bwrap.mjs:470-524`.
- Read-only policy (no workspace grant): `src/runner/dispatch/confinement/policies.mjs:27-43`.
- Observed 2026-10-09 on mcp-skill-hub: agy blocks every tool on a failing PreToolUse hook (exit 127); codex hook-trust dialog per fresh home (idle 300 s, killed); codex stalls on target MCP `skillhub` `internal_error`. Earlier: claude stuck on target `.mcp.json` dialog ([evidence table row 1](../../archive/reports/discussion-advisory-approach-current-261008.md)).

## Decision

Durable fix lives in **dispatch confinement**, not in the hook installer. A read-only confined worker sees a neutral stand-in for the target's agent hook and MCP files, for the life of the sandbox only. Host files never change.

- Why here: the worker's view is what confinement owns; it fixes all three faults (hooks, hook trust, MCP) at once and for every CLI; the hazard of masking tracked files (§9.2) does not exist without a writable workspace.
- Why not the installer: fail-open commands change every target's committed files and interactive sessions, silently drop enforcement where the shim is missing, and fix neither trust dialog nor MCP. Deferred, trigger in plan.md Q3.
- `verifyProcessCwd` (`herdr-round.mjs:193`): doc note only. Fail-closed is correct; only a hand-made user-namespace launcher defeats it; product never wraps workers that way.

## Requirements

- Mask list is contract data next to `BLIND_HIDDEN_ROOTS` (e.g. `READ_ONLY_AGENT_CONFIG_MASKS`), workspace-relative: `.agents/hooks.json`, `.codex/hooks.json`, `.codex/config.toml`, `.mcp.json`. Nothing else (no observed fault for `.claude/settings.json`).
- Applied only when the confinement plan has no writable `workspace` grant. Only paths that exist on the host are masked.
- Neutral content: one shipped JSON asset `{}` for `.json`; `/dev/null` for `.toml`. No per-provider branch in the driver.
- Resource enters plan/attestation like `hidden-root` (identity names the path, not content).

## Files

- Modify: `src/runner/dispatch/confinement/resources.mjs` (list + resolve), `src/runner/dispatch/confinement/drivers/bwrap.mjs` (materialize after base mounts, read-only), `src/runner/dispatch/confinement/policies.mjs` (re-export only, if needed).
- Create: `core/confinement/neutral-agent-config.json` (`{}`), confirm it is staged into the release payload.
- Tests: `test/runner/dispatch-confinement-backend-p03.test.mjs` (or the file that owns `prepareBwrapSync` argv tests).
- Docs: `docs/specs/confinement-authority.md` (one paragraph in §9, one line in §13 for `verifyProcessCwd`), `CHANGELOG.md` `## [Unreleased]` (user-visible: target agent hooks/MCP no longer run in read-only seats).
- Delete/leave: no installer change; `.fgos/config.json` `--strict-mcp-config` left as owner config.

## Steps

1. Impact analysis per the CLAUDE.md capability gate on `prepareBwrapSync`, resource resolver; report risk.
2. Local smoke, no prompt sent: in a scratch git dir with copies of the four files replaced by the neutral content, start agy, codex, claude TUIs; record that each starts with no hook/trust/MCP dialog. If one rejects `{}`: stop per kill criterion.
3. Add list + resolver; driver binds each resolved mask `--ro-bind <neutral> <target>` after `--ro-bind / /` (and after blind masks).
4. Unit test (builder gate): read-only plan with the four files present -> argv contains four ro-binds; workspace-write plan -> none; absent file -> no bind.
5. Spec paragraph + CHANGELOG line. Install gate: no new config, env var or tool -> no doctor check (state it in the commit body). No component-boundary change.
6. Independent review, then merge; Lead runs R1.

## Done

R1 (plan.md). Builder does not run R1. A fault R1 hits outside this file list is a separate work item.

## Risks / rollback

- Target AGENTS.md still tells agents to call `skill_resolve`; tool now absent -> agent should continue. If it stalls, separate item (prompt-level), not this phase.
- Read-only seats lose fgOS `dispatch-decide` hook; nested dispatch still bounded by `MAX_DISPATCH_DEPTH` (`src/runner/dispatch/transport.mjs:37-39`).
- Rollback: revert the commit; no state, no host file touched.
