---
id: F02
type: flow
name: "Approve a merge, end to end"
platforms: [desktop, mobile]
hosts: []
status: active
design_ref: ""
rules: []
regions: []
---

# F02 — Approve a merge, end to end

## Purpose

The only flow on this client that changes trunk. Everything about its
shape is downstream of that one fact.

## Steps

1. **Land on the taskboard** (S02) — the item sits in the `NEEDS ANSWER`
   group tagged as a gate, because D4 makes a gate-approve question the
   same category to a person as an `ask`.
2. **Open the item** (S03) — the person reads what the agent did, the
   narrative first, machine log collapsed.
3. **Trigger approve** — `Approve merge` in the ACTIONS region, visually
   distinct from `Edit`/`Retire` (R8). If the gateway is not at the
   repository's main working tree, this control is **disabled with the
   reason attached** (ERR-APPROVE-UNAVAILABLE) and the flow stops here,
   honestly, before the person invests any attention.
4. **Confirm** (M02) — what lands, into which branch, which verb runs on
   which machine, and what happens if the re-run verify fails.
5. **Wait** — approve is not instant; the verify re-runs before anything
   merges. ST-SUBMITTING keeps the modal alive rather than looking frozen.
6. **Outcome** — `merge.settled` arrives. Delivered, or parked blocked
   with the engine's own reason. Both are shown; neither is summarized
   into "something went wrong".

## Branches

- **Approve cannot run here** — step 3 stops the flow with the reason
  visible. This is the R7 branch, and it is a designed outcome rather
  than a failure.
- **Post-merge verify fails** — the item parks blocked; M02 stays open
  showing the park reason verbatim, so the person is not returned to a
  screen that appears to have done nothing.

```yaml herdrweb-contract
flow:
  goal: "Review and approve a merge from the dashboard, with the trunk consequence stated before confirming"
  preconditions:
    - "an item is awaiting approval"
    - "the gateway runs at the repository's main working tree"
  steps:
    - A-S02-001
    - A-S03-002
    - A-M02-001
  branches:
    - when: "approve cannot run where this gateway sits"
      action: A-S03-009
    - when: "decide not to approve after reading what lands"
      action: A-M02-002
```
