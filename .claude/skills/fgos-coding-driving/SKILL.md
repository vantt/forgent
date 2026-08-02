---
name: fgos-coding-driving
description: >-
  Drive one coding-domain work item through its own lifecycle, one stage at
  a time, until it hits a ceiling, a question only a person can answer, or
  the ceiling stage/status is reached. This is the mechanical loop every
  coding-domain caller (`/fgOS:cook`, `/fgOS:pick`, a clarify/planning/
  execution sweep) is built on top of, never a second routing judgment of
  its own. Use when a session already knows which item and how far to carry
  it (the ceiling), and just needs the loop that gets it there. Examples:
  "drive this item to executing", "carry this claimed item as far as
  awaiting-approval", "run the clarify-only loop on this item".
---

# fgos-coding-driving

The one mechanical loop every coding-domain multi-stage caller is built on
(tsk-19j D9/D12): read an item's current stage/status, decide whether a
ceiling or a person-shaped stop already applies, and if not, load the one
skill `fgos-routing`'s own registry lookup names for that stage, let it run,
then loop. This skill never re-derives which skill a stage maps to on its
own prose judgment — it always asks the same registry `fgos-routing` reads
from. It is a driver, not a router: `fgos-routing`'s stage-to-skill judgment
still lives in exactly one place.

Named `fgos-coding-driving`, not a domain-neutral `fgos-driving` (D12): this
skill's own body is a purely mechanical loop with no coding-specific
content leaking into it, which makes a neutral-sounding name MORE likely to
be misused for a future non-coding domain than a name that states its scope
up front. D9/D10 established this loop is proven correct for the `coding`
domain only — reused across every loop *of that one domain's* work
(`cook`/`pick`/a clarify-sweep/a planning-sweep/an execution-sweep), never
asserted to generalize automatically to a domain that does not exist yet.

## Hard rules

- Never invent a stage-to-skill mapping. Every iteration resolves the
  skill to load via the exact same registry lookup `fgos-routing` uses
  (`getDomain`/`skillForStage`, `src/state/workflow-stage-graphs.mjs`) —
  this skill's whole value is doing that lookup in a loop, not doing it
  differently.
- Never apply a stage or status transition directly. Every transition
  happens because the loaded stage-skill called its own engine verb
  (`fgos discover`/`fgos decompose`/`fgos return`) — this skill only reads
  state and decides whether to loop again, exactly the same "engine's verb
  always wins" stance `fgos-routing` itself states.
- Check the ceiling BEFORE invoking the current stage's skill, never after
  (tsk-19j §3's own verified boundary — this is what lets a `ceiling:
  stage:decompose` loop stop with the item freshly landed AT `decompose`,
  never one stage further, having invoked `fgos-planning` first by mistake).
- `status: awaiting-human` always stops the loop immediately, before any
  ceiling check — the same "an item is only legitimately blocked on a
  person while sitting in `awaiting-human`" contract `fgos-routing`'s own
  gate section describes. Return the question to whoever called this skill;
  never guess an answer to keep looping.
- `status: blocked` also always stops the loop immediately — a failed
  verify or a rejected merge is a real stop, never something to loop past
  silently.
- Every bare `fgos <verb>` this skill calls directly (`list`, to re-read
  state each iteration) is `requiresExistingStore: true` — resolve the main
  checkout root the same way every other stage-skill does and pass it
  explicitly:

  ```bash
  root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
  node "$root/bin/fgos.mjs" list --id "<id>" --json --dir "$root"
  ```
- Re-read the item's stage/status FRESH at the top of every iteration —
  never reuse a snapshot from a prior loop turn, since the whole point of
  looping is that the loaded skill just changed that state.

## Input

- `id` — the item to drive. This skill never chooses which item; the
  caller already claimed or is otherwise authorized to drive it.
- `ceiling` — `stage:<name>` or `status:<name>` (D13, explicit prefix,
  never inferred from which of two disjoint name sets a bare string
  belongs to). `stage:<name>` compares against the item's domain's own
  `stages` array order (`getDomain(item.domain).stages`, e.g. coding's
  `['clarify', 'decompose', 'executing']`) — the loop stops once the
  item's current stage's index is `>=` the ceiling stage's index in that
  same array. `status:<name>` compares by exact match only — the loop
  stops the moment `item.status === name` (status is not a strict linear
  order like stage is: `blocked`/`awaiting-human`/`wontfix` are branches,
  not points on one line, so this skill never tries to rank them; it only
  ever needs exact-match ceilings in practice — `status:awaiting-approval`
  for an execution-loop is the one case named in this item's own design
  history). `ceiling: stage:executing` or omitting a ceiling entirely
  means "unlimited" — loop until a person-shaped stop or the item leaves
  the loop's reach (its own `executing`-stage skill returns it to
  `awaiting-approval`).

## Loop

```text
loop:
  read id's current {stage, status, domain} FRESH via `fgos list --id <id> --json`

  if status == 'awaiting-human':
    stop. Report the parked question back to the caller. Never answer it here.

  if status == 'blocked':
    stop. Report the block back to the caller. Never retry blind.

  domain = getDomain(item.domain)   # registry lookup, never guessed
  if ceiling is 'stage:<name>':
    if domain.stages.indexOf(stage ?? <domain's own Execute-mapped stage>) >= domain.stages.indexOf(name):
      stop. Report "reached ceiling at stage <stage>". Do not invoke anything this turn.
  else if ceiling is 'status:<name>':
    if status == name:
      stop. Report "reached ceiling at status <status>". Do not invoke anything this turn.
  # (no ceiling supplied: never stops here — only a person-shaped stop or
  # running out of registered stages/skills ends the loop)

  skill = skillForStage(domain, stage ?? <domain's own Execute-mapped stage>)
  if skill is null:
    stop. Stage is mechanical (today: only `executing` for domains that
    declare no skill there) — nothing left for THIS skill to load; the
    caller's own next step (e.g. `fgos return`) already covers it.

  invoke `skill` (it runs its own Socratic/shape/implement pass, hits its
  own gate, and — once satisfied — calls the engine verb that actually
  advances stage/status: `fgos discover`/`fgos decompose`/`fgos return`)

  go back to loop start
```

The invoked skill is trusted to do its own job completely (including its
own gate question, when one is needed) before returning control here — this
skill never second-guesses or repeats a stage-skill's own gate.

## Which existing loops are this loop (D9 §3, no separate mechanisms)

| Caller | `id` source | `ceiling` |
|---|---|---|
| `/fgOS:cook` | freshly submitted item, or a child a `decompose` outcome just created | unlimited (no ceiling) |
| `/fgOS:pick` | one explicitly claimed item | unlimited (no ceiling) |
| a clarify-only sweep | `fgos ready --step Clarify` (needs `frontier(view, {step:'Clarify'})`, tsk-19j Track D's own `frontier.mjs` generalization) | `stage:decompose` |
| a planning-only sweep | `fgos ready --step Divide` | `stage:executing` |
| an execution-only sweep | `fgos ready --step Execute` (today's existing frontier default, unchanged) | `status:awaiting-approval` |

This table is descriptive, not a retrofit checklist this skill performs —
`cook`/`pick` calling this skill instead of their own inline stage-dispatch
prose is a separate, explicit step (see `plugins/fgOS/skills/cook/SKILL.md`
and `plugins/fgOS/skills/pick/SKILL.md`), done only once this skill itself
has been proven correct against the existing behavior it replaces.

## Red flags

- resolving a stage's skill from anything other than the live
  `getDomain`/`skillForStage` registry lookup
- applying a stage or status move directly instead of leaving it to the
  invoked stage-skill's own engine-verb call
- checking the ceiling after invoking the current stage's skill instead of
  before
- continuing to loop past `status: awaiting-human` or `status: blocked`
- treating `status:<name>` as a ranked comparison instead of an exact match
- reusing a stage/status snapshot from a prior loop turn instead of
  re-reading fresh
- asserting this loop generalizes to a domain other than `coding` without
  new evidence for that domain (D10)

Violating the letter of the rules is violating the spirit of the rules.

Ceiling reached, or the item left the loop's reach via a person-shaped
stop. Report which one to the caller — this skill's own job ends there; it
never decides what happens next on its own authority.
