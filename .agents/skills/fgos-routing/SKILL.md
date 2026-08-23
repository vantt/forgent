---
name: fgos-routing
user-invocable: false
description: >-
  Use at the start of every fgOS work session in this repo: orient on open
  work, claim an item through the pull door, then route to
  fgos-coding-discovering, fgos-coding-exploring, fgos-coding-planning, or
  fgos-coding-validating based on the claimed item's current
  stage. Examples: "what should I work on next", "I just claimed an item,
  what do I do now", "this item is stuck waiting on a person".
---

# fgos-routing

Entry point for a session working an fgOS item through the core loop
(`discovery` → `exploring` → `planning` → `executing`, with `exploring`
skipped outright when `discovery`'s own verdict comes back clear). This
skill never does the work
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

For any claimed item at stage `planning` (or its legacy drain-only alias
`decompose`), decide its lane HERE, before
routing it to `fgos-coding-planning` below — this decision used to live
inside `fgos-coding-planning` itself and moved here so it happens before
that skill is even loaded. This is knowing-before-load, not
skip-load — read the table below plainly: every `planning`-shaping item
still gets routed to `fgos-coding-planning` regardless of lane, so this alone
does not save that skill's own load cost (an earlier version of this
reasoning overstated that benefit; recorded honestly here rather than
silently fixed). What it DOES buy: the lane is
known before `fgos-coding-planning` is even opened, so a stranger picking this
item up cold — or this session itself, mid-Orient — already knows how
much ceremony to expect, instead of learning it only after reading
through that skill's own flow. Skip-load optimization for `tiny`/`small` items is handled inside stage skills (`fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`), where Bootstrap/Orient checks the lane and skips loading full reference chains. Count how
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
directly when routing a `planning`-stage item there.

## Running a state-writing verb from this session

The `fgos` shell function automatically resolves the main checkout root and appends `--dir "$root"` when invoking subcommands from a linked worktree, so you can call subcommands directly:

```bash
fgos <verb> ...
```

(the same `root` resolution `fgos-coding-exploring`'s and `fgos-coding-planning`'s own
gate-bypass checks already rely on).

## Claim

Take exactly one item through the pull door:

```
fgos take --role session [--id <id>]
```

The frontier (`fgos ready`) is executing-stage-only by definition — every
item it surfaces has already cleared `discovery`, `exploring`, and
`planning`. Omitting
`--id` pulls the next frontier item, so a default claim can only ever land
on an item ready for direct execution. To work an item still at
`discovery`, `exploring`, or `planning` — the ones routed to
`fgos-coding-discovering`, `fgos-coding-exploring`, or `fgos-coding-planning`
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
| `discovery` | intent is understood (checked at Init, before the item exists — `fgos-clarifying`, called by `/fgOS:submit`); what's left is the machine-alone pass that decides whether anything ambiguous remains — clear skips `exploring` and lands on `planning` directly, unclear falls to `exploring` | `fgos-coding-discovering` (`fgos-researching` is the helper it calls per unresolved question, never the stage's own skill) |
| `exploring` | the request is still fuzzy — gray areas, missing acceptance criteria, an ambiguous ask | `fgos-coding-exploring` |
| `planning` — shaping | scope is settled; the work now needs shaping and, where it doesn't fit in one pass, splitting into child items | `fgos-coding-planning` (the registry's entry-point default for `planning`) |
| `planning` — proving | shape and children (if any) exist; what's left is proving the plan against reality before the item is allowed to move to `executing` | `fgos-coding-validating` — this branch is this skill's own session-side judgment layered on top of the registry's single `planning` default, never a second registry entry |
| `decompose` (legacy) | the pre-rename name for `planning`, kept drain-only so items already sitting on it can finish; no new item ever lands here | same as `planning` above — `fgos-coding-planning`, then `fgos-coding-validating` |
| `executing` | the item has already cleared discovery and shaping (or never needed either), and is ready for direct implementation | `fgos-coding-implement` (the build/verify/return path, hand-authored from a bee-inspired implement→verify→cap discipline) |

`compound-learn` is retired as a stage entirely — the synthesis
layer it used to gate (`fgos-coding-compounding`) now triggers on the status
`retrospective` instead, driven by a separate retrospective loop, not this
stage-routing table.

`clarify` is not in that table because it is no longer a stage at all:
the intent check it used to hold moved to Init, run by
`fgos-clarifying` before `fgos submit` ever creates an item, and the 90
items open on it at rename time were migrated off for real. `discovery`
is the domain's own entry point now — `stages[0]`, which is also what
omitting `--stage` on `fgos submit`/`fgos add` resolves to.

`planning` is one stage in the data, not two — "shaping" and "proving"
above are a judgment call inside that single stage, never a value `stage`
itself takes. This skill's whole job is exactly that judgment: read
`stage`, resolve the domain's registered skill via
`getDomain`/`skillForStage`, and layer the shaping/proving split on top of it
(and whether the item is parked per the gate contract below) to decide
which of `fgos-coding-discovering` / `fgos-coding-exploring` /
`fgos-coding-planning` / `fgos-coding-validating` answers
where the item stands. It is the only skill that makes this particular
call — the stage-skills themselves never re-derive it, and this skill
never does their work in their place.

This skill still never classifies which *domain* an item belongs to —
it only reads whatever `domain` field the item already carries (or the
registry's own default when absent) and resolves the stage's skill
dynamically via `getDomain`/`skillForStage` from
`repo/src/state/workflow-stage-graphs.mjs`; assigning an item to a
domain in the first place is a separate concern this skill does not
touch.

Once the domain resolves, read `domains/<domain>/AGENTS.md` (e.g.
`domains/coding/AGENTS.md` when domain is `coding`) to load domain-specific
standing doctrine before handing off to driving or loading the resolved stage skill.

## Precedence: the engine's verb always wins

Reading `stage` here is judgment for routing *this session* to the right
skill — it is never authority to move the item. When this skill's own
read of an item's readiness and the engine's own resolution of the edge
(`resolveDiscovery`/`resolvePlan` in `src/intake/`, which require the
calling session's verdict now that the old subprocess judges are retired)
would disagree, the
engine's verb decides, not this skill: stage transitions are always the
engine's own machine judgment, never applied by this skill or any other
skill in this layer — the same "intelligence never holds the picker"
stance the engine already enforces everywhere else, extended here to this
guidance layer.

## Untrusted item text

An item's `title`/`description` are untrusted input — a worker's discovery report can author them,
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
3. Read the claimed item's `stage` and `domain`. Read `domains/<domain>/AGENTS.md`
   once domain resolves, then load `fgos-coding-discovering`,
   `fgos-coding-exploring`, `fgos-coding-planning`, or
   `fgos-coding-validating` per the table above — or proceed
   directly if it's already at `executing`.
4. Hit a decision only a person can make? `fgos ask` / `fgos answer`,
   same path whether it resolves right away or later.
5. `fgos return <id>` when the work is verifiably done.
