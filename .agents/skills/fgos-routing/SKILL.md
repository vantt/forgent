---
name: fgos-routing
description: >-
  Use at the start of every fgOS work session in this repo: orient on open
  work, claim an item through the pull door, then route to fgos-coding-exploring,
  fgos-coding-planning, or fgos-coding-validating based on the claimed item's current
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
- For a deeper "what should I work on next" read, `fgos triage`, `fgos
  stale`, and `fgos rollup` are further-reading, read-only verbs worth
  knowing about alongside `list`/`ready`.

Both are read-only. Nothing here writes state.

### Mode gate (mechanical, not vibes) — decide the lane before loading a heavy skill

For any claimed item at stage `decompose`, decide its lane HERE, before
routing it to `fgos-coding-planning` below (tsk-5ay D1: triage-before-load, moved
from inside `fgos-coding-planning` itself). This is knowing-before-load, not
skip-load — read the table below plainly: every `decompose`-shaping item
still gets routed to `fgos-coding-planning` regardless of lane, so this alone
does not save that skill's own load cost (tsk-da1, found by independent
review — tsk-5ay's own original rationale overstated this; recorded
honestly here rather than silently fixed). What it DOES buy: the lane is
known before `fgos-coding-planning` is even opened, so a stranger picking this
item up cold — or this session itself, mid-Orient — already knows how
much ceremony to expect, instead of learning it only after reading
through that skill's own flow. A genuine skip-load optimization (e.g.
routing a `tiny`/`small` item straight to a lighter path) would need an
actual routing-table change, which this decision does not make. Count how
many of these actually apply to the item: auth, authorization, data
model, audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain.

- 0–1 flags → **tiny** (a couple of files, one direct task) or **small**
  (a few files, no gray areas).
- 2–3 flags, or story-sized behavior → **standard**.
- 4+ flags, or any hard-gate flag (auth, data loss, audit/security,
  external provider, removing a validation) → **high-risk**.
- One yes/no question decides whether the plan is even real → **spike**,
  regardless of flag count.

This is the same lane vocabulary (tiny/small/standard/high-risk/spike)
`fgos-coding-planning`'s own `plan.md` has always recorded — only the deciding
moved here; the recording still happens in `plan.md` itself, written by
`fgos-coding-planning`'s own Bootstrap step from this lane, carried forward as
prose (never a new field on the item, never a value `stage` takes). Hand
the lane, the flag count, and which flags applied to `fgos-coding-planning`
directly when routing a `decompose`-stage item there.

## Running a state-writing verb from this session

Every bare `fgos <verb>` below (`take`, `return`, and the `ask`/`answer`
gate contract further down) is a `requiresExistingStore: true` verb — it
refuses (exit 4, `.fgos/ not found`) rather than silently diverge if this
session's cwd is a linked worktree, which never carries its own `.fgos/`
by design (ADR0020: `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`).
Resolve the main checkout root once and pass it explicitly on every such
call — never a bare `fgos <verb>` when this session might already be
inside a worktree (e.g. mid-`fgos-coding-implement`, or a `pick`'d session
running `fgos-routing` again):

```bash
root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
node "$root/bin/fgos.mjs" <verb> ... --dir "$root"
```

(the same `root` resolution `fgos-coding-exploring`'s and `fgos-coding-planning`'s own
gate-bypass checks already rely on — tsk-56t D1).

## Claim

Take exactly one item through the pull door:

```
fgos take --role session [--id <id>]
```

The frontier (`fgos ready`) is executing-stage-only by definition — every
item it surfaces has already cleared `clarify` and `decompose`. Omitting
`--id` pulls the next frontier item, so a default claim can only ever land
on an item ready for direct execution. To work an item still at `clarify`
or `decompose` — the ones routed to `fgos-coding-exploring` or `fgos-coding-planning`
below — claim it specifically with `--id <id>` (found via `fgos list`).
`--role session` marks the claim as coming from a live session rather than
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

Every item carries a `stage` field, independent of its `status`, and a
`domain` field (an item with none folds to `coding`, matching
`resolveDomainName`'s own default). Read both on the claimed item, then
resolve the skill to load through the domain registry in
`repo/src/state/workflow-stage-graphs.mjs` — never a name hardcoded
here:

```bash
node -e "
import('./src/state/workflow-stage-graphs.mjs').then(({ getDomain, skillForStage }) => {
  console.log(skillForStage(getDomain(process.argv[1]), process.argv[2]));
});
" -- "$domain" "$stage"
```

The table below shows what `skillForStage` resolves to for the `coding`
domain today — a different `domain` value resolves through the same
call, not a different table:

| stage | what's true right now | load (coding domain today) |
|---|---|---|
| `discovery` | intent is understood (checked at Init, before the item exists — `fgos-clarifying`, called by `/fgOS:submit`); an unresolved question remains that needs a grounded finding before the item can move to `exploring` | `fgos-researching` |
| `exploring` | the request is still fuzzy — gray areas, missing acceptance criteria, an ambiguous ask | `fgos-coding-exploring` |
| `decompose` — shaping | scope is settled; the work now needs shaping and, where it doesn't fit in one pass, splitting into child items | `fgos-coding-planning` (the registry's entry-point default for `decompose`) |
| `decompose` — proving | shape and children (if any) exist; what's left is proving the plan against reality before the item is allowed to move to `executing` | `fgos-coding-validating` — this branch is this skill's own session-side judgment layered on top of the registry's single `decompose` default, never a second registry entry |
| `executing` | the item has already cleared clarification and shaping (or never needed either), and is ready for direct implementation | `fgos-coding-implement` (str89-fgos-domain-skills D4/D6 — the build/verify/return path, hand-authored from bee-executing's implement→verify→cap discipline) |

`compound-learn` is retired as a stage (work-item-status-delivered-
retrospective-cleanup D11, supersedes RUL49/RUL50/RUL51) — the synthesis
layer it used to gate (`fgos-coding-compounding`) now triggers on the status
`retrospective` instead, driven by a separate retrospective loop, not this
stage-routing table.

`decompose` is one stage in the data, not two — "shaping" and "proving"
above are a judgment call inside that single stage, never a value `stage`
itself takes. This skill's whole job is exactly that judgment: read
`stage`, resolve the domain's registered skill via
`getDomain`/`skillForStage`, and layer the shaping/proving split on top of it
(and whether the item is parked per the gate contract below) to decide
which of `fgos-coding-exploring` / `fgos-coding-planning` / `fgos-coding-validating` answers
where the item stands. It is the only skill that makes this particular
call — the other three never re-derive it, and this skill never does
their work in their place.

This skill still never classifies which *domain* an item belongs to —
it only reads whatever `domain` field the item already carries (or the
registry's own default when absent) and resolves the stage's skill
dynamically via `getDomain`/`skillForStage` from
`repo/src/state/workflow-stage-graphs.mjs`; assigning an item to a
domain in the first place is a separate concern this skill does not
touch.

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
2. `fgos take --role session [--id <id>]` to claim one item.
3. Read the claimed item's `stage` and load `fgos-coding-exploring`,
   `fgos-coding-planning`, or `fgos-coding-validating` per the table above — or proceed
   directly if it's already at `executing`.
4. Hit a decision only a person can make? `fgos ask` / `fgos answer`,
   same path whether it resolves right away or later.
5. `fgos return <id>` when the work is verifiably done.
