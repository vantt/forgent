# Current Cell: P02.1 (Chain Verb And Pack Registration)

Status: in-progress
Owner: Doer (to be dispatched)
Last updated: 2026-09-04
Next action: dispatch Doer

## Goal

Give a real, read-only `fgos coordination chain <track>` verb that
reconstructs cell status entirely from session event logs (no new
persisted plan object), and register
`standalone-master-coordination-loop` into the group-thinking Protocol
Pack. Add the `--cwd` flag to `bin/fgos.mjs`'s `coordination` case (needed
by P01.1's engine-level mechanism, but P01.1 itself never touches this
file).

## Non-Goals

- No kernel/dispatch-core change of any kind (that is P01.1's lease).
- No caching/index file under `.fgos/` (R6 is a hard negative requirement).
- No fixture change to `standalone-master-coordination-loop.yaml` itself.

## Must Read

- `plans/260904-2329-group-thinking-plan-loop/phase-02-chain-verb-and-pack-registration.md` (full)
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/P02.1.md` (this cell's trace)
- `core/protocol-packs/group-thinking.json`
- `core/coordination-protocols/standalone-master-coordination-loop.yaml`
- `src/cli/command-registry.mjs`
- `bin/fgos.mjs` (coordination case only)
- Existing `show`/`launch-master-loop` verb implementation under `src/verbs/coordination/` (mirror their registration/read pattern)
- `src/verbs/coordination/launch-master-loop.mjs` (R8's stale comments, ~lines 22-24 and ~152-157 — re-locate before editing)
- AGENTS.md's Dispatch section (for the `--cwd`/`--repo-root` split precedent `dispatch execute` already uses)

## May Inspect

Anything else under `src/verbs/`, `src/runner/coordination/` (read-only —
if R2 seems to need a NEW kernel export, expose it as a small additive
export from the existing `show`-side function, do not add new kernel
logic; report instead of expanding scope).

## Do Not Touch

- `src/runner/coordination/**`, `src/runner/dispatch/**` (P01.1's exclusive lease — no kernel/dispatch-core file in this cell's diff at all).
- `core/coordination-protocols/standalone-master-coordination-loop.yaml` itself.
- `.agents/skills/fgos-plan-loop/**` (does not exist yet; Phase 03's lease).
- `docs/architect/agent-coordination/verification/group-thinking-plan-loop/index.md`, `current-cell-P01.1.md`, `P01.1.md` — Coordinator/other-cell-owned.

## Tests First

Write the 9 "Tests First" items from
phase-02-chain-verb-and-pack-registration.md as real tests before/while
implementing.

## Acceptance

Exactly phase-02-chain-verb-and-pack-registration.md's own Acceptance
section — all 9 Tests First items pass (independently re-run by
Coordinator), zero regression in the existing group-thinking pack
conformance suite, `chain`'s implementation contains zero write-side
function calls (verified), independent Reviewer + Red-Team both APPROVE.

## Bug Taxonomy

Verbs-layer, read-only. Watch for: a write-side call sneaking into
`chain.mjs` (R4's whole point), loose prefix matching (`probe--` vs
`probe--other-track--`), stale/incomplete CLI enumeration strings (R5's
grep must be exhaustive), `--cwd` defaulting incorrectly and silently
changing today's behavior when omitted.

## Trace Update

Doer writes to `P02.1.md`'s Proof Matrix, Commands, and Gaps sections
only (this file). Never edit Review/Red-Team sections. Never edit
`index.md` or `current-cell-P01.1.md`.

## Report

Write a short report to
`plans/260904-2329-group-thinking-plan-loop/reports/doer-260905-0000-p02-1-chain-verb-report.md`
(role, cell, outcome, paths touched, whether any shared-lease file was
touched (must be none), the real R5 grep output). End with:
`Status: DONE | DONE_WITH_CONCERNS | BLOCKED` and a two-line summary.
