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
