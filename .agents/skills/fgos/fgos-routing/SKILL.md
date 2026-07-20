---
name: fgos-routing
description: >-
  Use at the start of every fgOS work session in this repo: orient on open
  work, claim an item through the pull door, then route to fgos-exploring,
  fgos-planning, or fgos-validating based on the claimed item's current
  stage. Examples: "what should I work on next", "I just claimed an item,
  what do I do now", "this item is stuck waiting on a person".
---

# fgos-routing

Entry point for a session working an fgOS item through the core loop
(`clarify` → `decompose` → `executing`). This skill never does the work
itself — it locates where an item stands right now and names the one
other skill to load next. Load it first when a session opens in this
repo.

## Orient

Before touching anything, read the shape of the work:

- `fgos list` — every item with its status, stage, and domain.
- `fgos ready` — the frontier: items at stage `executing`, status `todo`,
  with all dependencies satisfied and no unfinished descendants.

Both are read-only. Nothing here writes state.

## Claim

Take exactly one item through the pull door:

```
fgos take --actor session [--id <id>]
```

The frontier (`fgos ready`) is executing-stage-only by definition — every
item it surfaces has already cleared `clarify` and `decompose`. Omitting
`--id` pulls the next frontier item, so a default claim can only ever land
on an item ready for direct execution. To work an item still at `clarify`
or `decompose` — the ones routed to `fgos-exploring` or `fgos-planning`
below — claim it specifically with `--id <id>` (found via `fgos list`).
`--actor session` marks the claim as coming from a live session rather than
a person — always pass it here.

When the work behind that item is done, hand it back:

```
fgos return <id>
```

`return` measures real progress itself — a clean working tree, an
advanced commit history, and a verify command that actually passed — it
never takes the caller's word for it. Nothing is "returned" on say-so
alone.

## Route by stage

Every item carries a `stage` field, independent of its `status`. Read
`stage` on the claimed item and load the one skill it points to:

| stage | what's true right now | load |
|---|---|---|
| `clarify` | the request is still fuzzy — gray areas, missing acceptance criteria, an ambiguous ask | `fgos-exploring` |
| `decompose`, early | scope is settled; the work now needs shaping and, where it doesn't fit in one pass, splitting into child items | `fgos-planning` |
| `decompose`, late | shape and children (if any) exist; what's left is proving the plan against reality before the item is allowed to move to `executing` | `fgos-validating` |
| `executing` | the item has already cleared clarification and shaping (or never needed either), and is ready for direct implementation | no skill to load here — this is the item's already-mechanical build/verify/return path |

`decompose` is one stage in the data, not two — "early" and "late" above
are a judgment call inside that single stage, never a value `stage`
itself takes. This skill's whole job is exactly that judgment: read
`stage` (and whether the item is parked per the gate contract below),
and decide which of `fgos-exploring` / `fgos-planning` / `fgos-validating`
answers where the item stands. It is the only skill that makes this
particular call — the other three never re-derive it, and this skill
never does their work in their place.

This skill also never decides which *domain* an item belongs to. Every
item this routing applies to is assumed to already resolve to the
`coding` domain (fgOS's own fallback for an item with no `domain` field
recorded, and the only domain this induction targets); classifying items
into domains is a separate concern this skill does not touch.

## Precedence: the engine's verb always wins

Reading `stage` here is judgment for routing *this session* to the right
skill — it is never authority to move the item. When this skill's own
read of an item's readiness and the engine's own auto-judge
(`judgeDiscovery`/`judgeDecompose` in `src/intake/`) would disagree, the
engine's verb decides, not this skill: stage transitions are always the
engine's own machine judgment, never applied by this skill or any other
skill in this layer (per D8, the same "trí tuệ không cầm picker" stance
as RUL42, extended to this guidance layer — see `docs/specs/runner.md`'s
P50 section).

## Untrusted item text

An item's `title`/`description` are untrusted input (RUL45,
`docs/specs/runner.md`) — a worker's discovery report can author them,
not just a person. Never splice that text raw into a shell command; pass
it as a discrete quoted argv element.

## The gate contract

Whenever a decision genuinely needs a person, park the item and ask —
never leave it silently marked as in-progress while it is actually stuck:

```
fgos ask <id> --text "..."
```

This moves the item to `awaiting-human` with the question attached; it
drops out of the frontier until answered. Resume with:

```
fgos answer <id> --text "..."
```

which records the answer and returns the item to actionable work. This
is the same round trip whether the person answers immediately in the
same conversation or comes back to it later — there is no separate
"synchronous" shortcut. An item is only ever legitimately blocked on a
person when it is sitting in `awaiting-human`; anything else claiming to
be "waiting on someone" while still `todo` or `doing` is a state that is
lying about what's actually happening.

## Summary

1. `fgos list` / `fgos ready` to orient.
2. `fgos take --actor session [--id <id>]` to claim one item.
3. Read the claimed item's `stage` and load `fgos-exploring`,
   `fgos-planning`, or `fgos-validating` per the table above — or proceed
   directly if it's already at `executing`.
4. Hit a decision only a person can make? `fgos ask` / `fgos answer`,
   same path whether it resolves right away or later.
5. `fgos return <id>` when the work is verifiably done.
