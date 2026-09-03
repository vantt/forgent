---
type: reference
title: fgos slots verb output fields
tags: [cli, worker-slots, occupancy, ceiling, claimWork]
source_capture_ids: [tsk-3dt]
authoritative_for: fgos slots CLI verb output shape and the worker-slot ceiling gate inside claimWork
framework: diataxis
mode: reference
---
# `fgos slots` verb output fields

The read-only port for the worker-slot design
(`docs/explanation/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md`):
how many work items are running right now, whether the execution lane has
room under a configured ceiling, and the admin lane's fixed reservation.
Decision 0014 makes the CLI the door — `herdr-plugin` (Rust) and
`fgos-fanout` (a prose skill) have no other way to ask the engine before
standing a worker up.

## Invocation

```bash
fgos slots --dir <root>
```

`touchesState: false`, `requiresExistingStore: false`,
`externalEffect: false`, `paginated: false` — pure read, no fs access
inside `src/state/worker-slots.mjs` itself.

## Output shape

```json
{
  "execution": {
    "occupied": 11,
    "items": [
      {"id": "tsk-u8w", "sessionId": "6ea94464-...", "claimRole": "session"},
      "..."
    ],
    "ceiling": null,
    "free": null,
    "hasRoom": true,
    "reason": "no-ceiling-configured"
  },
  "admin": {
    "reserved": 4
  }
}
```

| Field | Meaning |
|---|---|
| `execution.occupied` | Count of work items currently at `doing` — one running item = one slot (D1/D7 in the design doc: a slot is the occupied seat of exactly one rootTask). |
| `execution.items` | One row per running item — diagnostic detail for a human, not paginated; grows with the number of items at `doing`. |
| `execution.ceiling` | The configured `workerSlots.ceiling` value, or `null` when unconfigured. |
| `execution.free` | `ceiling - occupied`, or `null` when there's no ceiling to subtract from. |
| `execution.hasRoom` | `true`/`false` — the actual pre-check answer a launcher acts on. |
| `execution.reason` | Why `hasRoom` reads the way it does, e.g. `"no-ceiling-configured"`. |
| `admin.reserved` | The admin lane's fixed reservation (4 today) — never counted against `execution`, per the design doc's D4/D9 lane split. |

## Absent ceiling means no ceiling, by design

`fgos setup` writes no `workerSlots.ceiling` value until a person arms
one. An absent or `null` ceiling makes `hasRoom` always `true` — this is
deliberate, not a missing default: on this very repo, 11 items were at
`doing` at the time this doc was written, well past what a small default
ceiling would have allowed. A live default here would have refused the
next claim outright, on a repo that had never opted in to a ceiling.

## Where the enforcing half lives

The ceiling is read-only here; the half that actually refuses a claim
lives inside `claimWork` (`src/runner/claim-port.mjs:90` — the single
choke point `take`/`pick`/`runner` all funnel through), placed *beside*
the existing `deps-not-merged` branch, never nested inside it — a worker
holds a slot whether or not it also got a worktree.

`src/state/worker-slots.mjs` is a pure module exporting both faces:
`countWorkerSlots` (occupancy — a plain fold over the work-item view,
using `status === 'doing'` and the session identity already present as
`payload.writer.id`, no new event type, no new field, no periodic
liveness filter) and `hasWorkerSlotRoom` (the has-room query, including
the whole-batch overflow rule the design doc's D7/D8 describe).

## What this item deliberately left out

- **No admin-lane liveness registry.** The admin lane's reservation
  (`admin.reserved: 4`) is a fixed count, not a live pid-tracked pool —
  named and rejected as out of scope for this item.
- **No `fgos approve`.** Landing an Iron-Law-flagged change
  (`matchedModules: [bin/fgos.mjs, src/runner/claim-port.mjs]`) is a
  human decision (`--acknowledge-iron-law`), never run automatically by
  the item that triggers it.

## Related

- `docs/explanation/worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md`
  — the design decisions (D1-D10) this verb and gate implement
- `docs/history/orchestrator-worker-slots/DISCUSSION.md#task-slot-ledger`
  — the shaping discussion this item's own footprint was scoped from
