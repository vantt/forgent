---
id: p-eldzmhlkl5
title: "The land gate refuses any edit to a plan without the `contract: plan-v1` marker, while `--all` only warns (land gate, priority high; source: manual supervisor, 2026-11-24)"
status: proposed
priority: P1
area: land
created: 2026-11-24
---

# Why

`scripts/plan-contract-check.mjs` run with `--plan` (how the `land.gates` entry at `.fgos/config.yaml` line 344 calls it) fails hard with "legacy plan: no contract: plan-v1 marker" for an old plan, while `--all` only warns. So no small fix to a plan that lacks the marker can land. Example: the running plan `261114-2051-rust-verb-migration-program` cannot get two cells pointing to the frame plan `261124-1026-harden-next-round` (S6b, S7). The one-way link from the frame plan (phases 3 and 5) is enough for now, so nothing waits on this.

# Done when

The owner picks one behaviour and it is implemented: (a) `--plan` treats a legacy plan like `--all` (warn, not block) when the commit does not change the marker, or (b) each legacy plan is migrated when touched. Loosening the gate changes behaviour, so this needs the owner's choice before work starts.

# Notes

Request came by mail from the manual supervisor. Confirmed by the owner to be opened as a backlog row on 2026-11-24.

# Consequence met, and the direction proposed

- Consequence: the running plan `261114-2051-rust-verb-migration-program` cannot get two cells (S6b and S7) that point to phases T6 and T7 of the frame plan `261124-1026-harden-next-round`. Only the forward link exists today (phases 3 and 5 of the frame plan name themselves S6b and S7); the backward link is missing. The two-sentence patch was dropped.
- Proposed direction (a), not chosen by the owner yet: `plan-contract-check --plan` treats a legacy plan like `--all` (warn, do not block) when the commit neither adds nor changes the marker. A plan that has the marker, and any commit that touches the marker, stay strictly checked.
- Numbers: 166 plans, 115 legacy (77 done, 24 draft, 7 running, 3 ready, 4 withdrawn).
- The 3 legacy plans in `ready` are `261023-1619-collaboration-degree-spec`, `261030-0323-mailbox-v9-wake-on-mail` and `261030-1029-harden-gate-door-two-levels`.

# Decision

On 2026-11-24 the owner chose direction (a): the land gate only warns, as `--all` does, for an old plan that has no `plan-v1` marker. Two guards stay: a plan that has the marker is still checked strictly, and a commit that adds or changes the marker is checked in full. Migrating each plan when it is touched is not chosen. The work is ready for a planner; the row's status stays `proposed` because the backlog uses only `proposed`, `done` and `dropped`.
