# Current Cell: P01.2 (Clear-Input Manual Proof)

Status: in-progress (Phase 1 of the 9-phase advisory loop complete)
Owner: Coordinator (this session), acting as the Architecture Advisory
Coordinator per the newly-authored playbook
Last updated: 2026-09-06
Next action: dispatch context investigator (Phase 3) against mdview

## Objective

Run `docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md`
for real against `/home/vantt/projects/mdview`'s thin-client-vs-local-ownership
question. Person confirmed 2026-09-06 the question is genuinely undecided and
authorized dispatch. Persist every phase's real artifacts under
`proofs/P01.2/` per the playbook's own PERSISTENT STATE tree — no simulated
roles, no coordinator-authored "human" turns.

## Must Read

- `docs/architect/agent-coordination/playbooks/prompts/architecture-advisory-coordinator.md` (the playbook this cell executes, in full)
- `docs/architect/agent-coordination/playbooks/architecture-advisory-role-doctrine.md` (per-role doctrine for every dispatch)
- `docs/architect/agent-coordination/playbooks/architecture-advisory-artifact-templates.md` (exact shape for every persisted artifact)
- `docs/architect/agent-coordination/playbooks/architecture-advisory-evaluation-rubric.md` (what "done well" means for this cell)
- `docs/architect/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/intake.md` (Phase 1 output, already written)
- `docs/architect/agent-coordination/verification/architecture-advisory-panel/P00.1.md` (the proven allowlist this cell dispatches through)

## Files

Lease `panel-proof-clear`: `verification/architecture-advisory-panel/P01.2.md`,
`proofs/P01.2/**`, matching reports. Never touches `mdview` itself (read-only
inspection only) and never touches production skills/protocol/schema/CLI.

## Do Not Touch

`mdview` (`/home/vantt/projects/mdview`) — read-only for the whole session,
under real bwrap/sandbox confinement for every dispatched role, never a
direct unconfined command against it. `index.md`, this file (Coordinator-owned).

## Real Gap Found (recorded, not silently worked around)

`dispatch.mjs decide/execute` does not actually recognize
`claude-bwrap`/`agy-bwrap` as real executors (they were P00.1's own
descriptive labels, never registered in `.fgos/config.json`) — confirmed by
reading `src/runner/dispatch/mechanism.mjs`. This cell invokes `bwrap`
directly by hand, exactly matching P00.1's own live-proved invocation,
rather than trusting `dispatch.mjs`'s uninformative fallback answer. Full
detail in `proofs/P01.2/intake.md`.

## Exact Commands

Each real dispatch is a direct shell invocation (not `dispatch.mjs execute`,
per the gap above):

```sh
# codex-readonly (native sandbox, no bwrap needed)
codex exec -s read-only --cd /home/vantt/projects/mdview "<prompt>"

# claude via bwrap (confirmed scratch-bind design before use)
bwrap --ro-bind / / --dev /dev --proc /proc \
  --bind <evidenceDir> <evidenceDir> \
  --bind <scratch> <scratch> \
  --chdir /home/vantt/projects/mdview \
  -- claude -p "<prompt>" --model <tier-model> --permission-mode acceptEdits

# agy via bwrap (confirmed scratch-bind design before use)
bwrap --ro-bind / / --dev /dev --proc /proc \
  --bind <evidenceDir> <evidenceDir> \
  --bind <scratch> <scratch> \
  --chdir /home/vantt/projects/mdview \
  -- agy -p "<prompt>" --mode accept-edits --model <tier-model>
```

## Stop Gates (from plan.md + the playbook's own STOP CONDITIONS)

- No real person available for a Decision Dialogue turn the session genuinely
  requires — park with a consolidated request, never simulate the person.
- Fewer than two safe executor/provider bindings reachable.
- The case turns out to already be decided (ratification, not advice).
- The question is not actually an architecture question.
- Evidence needed to distinguish top candidates requires mutating mdview.
- Proceeding would require inventing a fact about the person's obligations.

## Trace Update

Coordinator (this session) writes to `proofs/P01.2/**` per the playbook's own
named artifact tree, and to `P01.2.md` as the cell-level summary/trace.
Owns `index.md` and this file exclusively.

## Report

`plans/260905-architecture-advisory-panel/reports/coordinator-260906-p01-2-mdview-proof-report.md`
End with: `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | PARKED` and a summary.
