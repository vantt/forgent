---
name: fgos-coding-driving
user-invocable: false
description: >-
  Drive one coding-domain work item through its own lifecycle, one stage at
  a time, until it hits a ceiling, a question only a person can answer, or
  the ceiling stage/status is reached. This is the mechanical loop every
  coding-domain caller (`/fgOS:cook`, `/fgOS:pick`, a discovery/planning/
  execution sweep) is built on top of, never a second routing judgment of
  its own. Use when a session already knows which item and how far to carry
  it (the ceiling), and just needs the loop that gets it there. Examples:
  "drive this item to executing", "carry this claimed item as far as
  awaiting-approval", "run the discovery-only loop on this item".
---

# fgos-coding-driving

The one mechanical loop every coding-domain multi-stage caller is built on:
read an item's current stage/status, decide whether a ceiling or a
person-shaped stop already applies, and if not, load the one skill the
routing registry names for that stage, let it run, then loop. This skill
never decides which skill a stage maps to on its own — it always asks the
same registry the routing skill reads from. It is a driver, not a router:
the stage-to-skill judgment still lives in exactly one place.

This skill's name states its scope on purpose: its own body is a purely
mechanical loop with no coding-specific content leaking into it, but it is
proven correct only for the `coding` domain — reused across every loop of
that one domain's work (`cook`/`pick`/a discovery sweep/a planning
sweep/an execution sweep), never assumed to generalize automatically to a
domain that does not exist yet.

## Hard rules

- Never invent a stage-to-skill mapping. Resolve the skill via the same
  registry lookup the routing skill uses (`getDomain`/`skillForStage`,
  `src/state/workflow-stage-graphs.mjs`).
- Never apply a stage or status transition directly — every transition
  happens because the loaded stage-skill calls its own engine verb
  (`fgos discover`/`fgos plan`/`fgos return`). This holds even at
  `discovery`, whose own skill calls `fgos discover` itself.
- Check the ceiling BEFORE invoking the current stage's skill, never
  after — this is what lets a `stage:planning` ceiling stop with the item
  freshly landed AT planning, never one stage further.
- Reclaim the role/holder ball BEFORE invoking the current stage's skill,
  same ordering as the ceiling check. Read it off the domain's role
  graph. Every stage-skill's own reclaim block assumes this loop already
  did this — skipping it once left a holder stuck on `reviewer` forever
  after a reject, refusing with a callstack-cap error two cycles later.
  See `references/reclaim-and-role-graph.md`.
- Resolve the three person/system-shaped stops through
  `parkReasonForStatus(domain, status)`, never a literal `status ===
  'blocked'`-style comparison — `blocked` and `awaiting-human` share one
  status category but need opposite handling here:
  - `human-question` (today: `awaiting-human`) — stop immediately, before
    any ceiling check. Relay the question; never guess an answer.
  - `system-error` (today: `blocked`) — stop immediately. Relay the
    block; never retry blind.
  - `natural-finish` (today: `awaiting-approval`) — the DEFAULT ceiling,
    overridable, never an unconditional stop. A caller with no ceiling
    stops here; a caller with an explicit ceiling beyond it (e.g.
    `status:cleanup`) drives past, per `## Advance-axis` below.
    Re-invoking the `executing`-stage skill on an already-
    `awaiting-approval` item is never correct, and this loop never
    itself performs the merge/approve action.
- The merge gate is protected by a launcher convention, not by this loop
  refusing: no launcher in `plugins/fgOS/skills/**` ships a default
  ceiling past `awaiting-approval`. A launcher that needs the post-merge
  chain passes an explicit `status:*` ceiling. Do not remove this
  convention — it is what keeps `awaiting-approval → delivered` a human
  decision now that the stop above is overridable.
- Anchored-by-open-children always stops the loop, checked every
  iteration, before the ceiling check: any item with `parent == id` whose
  `status` is not `delivered`/`retrospective`/`cleanup`/`done`/`wontfix`
  anchors this item (the same rule `frontier.mjs`'s `hasOpenDescendant`
  uses). Stop, report every anchoring child id, invoke nothing this turn
  — the caller decides what happens next. See
  `references/caller-contract.md`.
- No progress in an iteration is also a stop: if invoking the resolved
  stage-skill leaves both `stage` and `status` unchanged from what this
  iteration read at its top, stop and report "no progress at stage
  `<stage>` after invoking `<skill>`" instead of looping again.
- Claim or resync right before the FIRST invocation of the
  `executing`-stage skill, never earlier. On the first invocation, run a
  fresh `fgos pick` claim when not yet claimed (`status != 'doing'`), or run
  `fgos resync-worktree` (no claim/CAS involved) when already claimed
  (`status == 'doing'`) — never a bare skip. Which command to run depends
  on `getDomain(domain).worktreeBacked` — see `references/loop-mechanics.md`
  for both branches.
- The pane-labeling call is decoration, never a gate: it always exits `0`
  and no-ops when nothing is registered. Never stop, retry, or branch on
  it, and never read a label back to decide anything. See
  `references/reclaim-and-role-graph.md`.
- Every stop lands a closing report on the item
  (`fgos report <id> --text ... --stop-reason ...`) before reporting to
  the caller — a finished pane is reused by the orchestrator, so a result
  that lives only there can be overwritten before anyone reads it. Never
  a gate: if the report call fails, report the stop to the caller anyway.
  See `references/reclaim-and-role-graph.md`.
- Every bare `fgos <verb>` this skill calls directly (`list`, to re-read
  state each iteration) requires an existing store — resolve the main
  checkout root and pass it explicitly:

  ```bash
  fgos list --id "<id>" --json
  ```

- Re-read the item's stage/status FRESH at the top of every iteration —
  never reuse a snapshot from a prior loop turn.
- Relay a known error category verbatim, never paraphrased into a generic
  "blocked". When a failure carries a known error category, the stop this
  skill reports must carry that category as its own line:

  ```text
  stop-reason: lock-timeout
  ```

  `lock-timeout` means the shared event log's lock is stuck — a caller
  looping over items should stop the whole run, not skip one item. Other
  categories stay per-item and need no such line.

## Input

- `id` — the item to drive. This skill never chooses which item; the
  caller already claimed or is otherwise authorized to drive it.
- `ceiling` — `stage:<name>` or `status:<name>` (explicit prefix, never
  inferred from which of two disjoint name sets a bare string belongs to).
  `stage:<name>` compares against the item's domain's own `stages` array
  order (`getDomain(item.domain).stages`, e.g. coding's `['discovery',
  'exploring', 'decompose', 'planning', 'executing']`) — the loop stops
  once the item's current stage's index is `>=` the ceiling stage's index
  in that same array. `status:<name>` compares by exact match only — the
  loop stops the moment `item.status === name` (status is not a strict
  linear order like stage is: `blocked`/`awaiting-human`/`wontfix` are
  branches, not points on one line, so this skill never tries to rank
  them). `status:awaiting-approval` does not need to be passed explicitly:
  it is one of the loop's own always-checked implicit stops, same as
  `awaiting-human`/`blocked`. Omitting `ceiling` entirely means "default"
  — loop until a person-shaped stop, an anchor, a no-progress read, or
  `awaiting-approval` ends it. A caller that genuinely means to work the
  post-merge chain says so with an explicit `status:*` ceiling; it never
  gets there by accident.

## Advance-axis: position, not stage

The advance-axis is the item's position, not its stage, and
`awaiting-approval` is the DEFAULT ceiling, overridable — a ceiling-less
drive still ends there; an explicit further ceiling drives past it.

Which axis this loop advances along is resolved from the item's **current
position**, not fixed to `stage`. Position means:

- **while `stage` is still live** — `status` is one of `todo`/`doing`/
  `blocked`/`awaiting-human` — the position IS the item's `stage`
  (`discovery`/`exploring`/`planning`/`executing` for coding, plus the
  drain-only legacy `decompose`).
- **once `stage` is frozen** — from `awaiting-approval` onward, where no
  further `stage` transition exists — the position IS the item's `status`
  (`delivered`/`retrospective`/`cleanup`/…).

`status` is the full-lifecycle axis (`src/state/status-fsm.mjs`'s
`TRANSITIONS`: `todo → doing → awaiting-approval → delivered →
retrospective → cleanup → done`, plus the `blocked`/`awaiting-human`/
`wontfix` branches); `stage` is the sub-axis that only carries meaning
across the front of it. Reading position this way is not a second
mechanism bolted on: the stage-to-skill map
(`src/state/workflow-stage-graphs.mjs`) has long held both the five stage
names and the status name `retrospective` in one frozen object, because
the two vocabularies never collide — which lookup table a key belongs to
is the caller's concern. The registry was already a position→skill map;
this loop simply reads it as one.

Nothing else about the loop changes. The same `skillForStage(domain,
position)` lookup resolves the skill, the same `null` result means "this
position is mechanical, nothing to load", and the same three
`parkReasonForStatus` stops apply. In particular, `cleanup` deliberately
registers no skill — pure harness, no skill ever loads for it — so a loop
that reaches it resolves nothing and stops, the caller's own mechanical
verb covers that position, exactly as before.

## Workflow

Full step-by-step detail, including every fresh-read and the exact bash
for each branch, lives in `references/loop-mechanics.md`. This is the
high-level shape:

### Step 1: Read state and resolve position
Read the item's current `{stage, status, domain, holder}` fresh via `fgos
list --id <id> --json`. Resolve `domain` and `position` (stage while live,
status once frozen, per the Advance-axis section above).

### Step 2: Check the always-on stops
In order: `human-question` park (stop, relay the question), `system-error`
park (stop, relay the block), `natural-finish` with no ceiling supplied
(stop, report "returned, awaiting-approval"), open children anchoring this
item (stop, report every anchoring id).

### Step 3: Check the ceiling
If a `stage:<name>` or `status:<name>` ceiling was supplied and the item's
position has reached or passed it, stop and report "reached ceiling at
<position>" without invoking anything this turn.

### Step 4: Resolve the stage skill and prepare to invoke it
Resolve `skill = skillForStage(domain, position)`. If `null`, stop — this
position is mechanical, nothing left for this skill to load. Otherwise:
show the item's title/description once per drive, label the session's
pane once per drive (decoration, never a gate), claim or resync the item's
worktree if this is the first invocation of the `executing`-stage skill,
and reclaim the role/holder ball if it is set to something other than the
domain's default role.

### Step 5: Invoke the skill
Invoke `skill`. It runs its own gate and, once satisfied, calls the engine
verb that actually advances stage/status (`fgos discover`/`fgos plan`/
`fgos return`) — except at stage `discovery`, where this loop applies the
discovery skill's own returned verdict via `fgos discover` on its behalf.
The invoked skill is trusted to do its own job completely, including its
own gate question when one is needed, before returning control here — this
skill never second-guesses or repeats a stage-skill's own gate.

### Step 6: Re-read and decide: loop or stop
Re-read the item's `{stage, status}` fresh. If both are unchanged from
what Step 1 read this same iteration, stop and report "no progress at
stage `<stage>` after invoking `<skill>`". Otherwise, go back to Step 1.

Every stop above lands a closing report on the item first
(`fgos report <id> --text ... --stop-reason ...`), then reports the same
thing to the caller — see `references/reclaim-and-role-graph.md`.

## Operation-aware loop

- The driver first checks lifecycle stops and ceilings exactly as today.
- Then it resolves legal stage operations via `operationsForStage(domain, stage, { kind: workflow })`.
- Primary operation (`primary: true`, e.g. `shape-plan` for planning) keeps the direct stage-skill compatibility path.
- Secondary operation (e.g. `planning.validate-plan`) creates an Assignment only when the stage skill or deterministic rule selects it.
- Assignment result is evidence input for driver decision, not lifecycle movement by itself.
- Only engine verbs (`fgos plan`, `fgos discover`, `fgos return`) move Work lifecycle state.

## Caller contract

Five callers reuse this exact loop with different `id` sources and
ceilings, and share one contract for what to do with an anchored-by-open-
children report (fan out via `fgos-fanout`, or drive each child
sequentially). See `references/caller-contract.md` for the caller table
and the fan-out contract.

## Red flags

- resolving a stage's skill from anything other than the live
  `getDomain`/`skillForStage` registry lookup
- comparing `status` against a literal instead of resolving through
  `parkReasonForStatus(domain, status)`
- applying a stage or status move directly instead of leaving it to the
  invoked stage-skill's own engine-verb call
- checking the ceiling after invoking the current stage's skill instead of
  before
- continuing to loop past a `human-question` or `system-error` park —
  both are unconditional, no ceiling overrides either
- continuing past `natural-finish` (`awaiting-approval`) when the caller
  supplied NO ceiling — it is the default ceiling
- widening a launcher's default ceiling past `awaiting-approval`, the one
  convention keeping the merge gate a human decision
- fixing the advance-axis to `stage` instead of resolving position (stage
  while live, status once frozen)
- treating `status:<name>` as a ranked comparison instead of an exact
  match
- reusing a stage/status snapshot from a prior loop turn instead of
  re-reading fresh
- invoking a stage skill while the item is anchored by open children
  instead of stopping and reporting them
- invoking the current stage's skill without first reclaiming a holder
  that is not the domain's default role
- treating a reclaim's own "no open call" refusal as a stop-worthy error —
  it is the ordinary outcome of another session already having reclaimed
  first
- looping again after a stage-skill invocation left both `stage` and
  `status` unchanged, instead of stopping on the no-progress fail-safe
- claiming or resyncing an item before its FIRST invocation of the
  `executing`-stage skill, or running `resync-worktree` again on a
  second-or-later invocation within the same drive
- treating the pane-labeling call as a gate, or reading a pane label back
  to decide anything
- reporting a stop to the caller without first landing the same closing
  report on the item, or letting that call's failure change, delay, or
  suppress the stop itself
- asserting this loop generalizes to a domain other than `coding` without
  new evidence for that domain

Violating the letter of the rules is violating the spirit of the rules.

## References

- `references/loop-mechanics.md` — the full step-by-step loop, exact bash
  for every read/claim/report call, and the discovery-stage special case
- `references/reclaim-and-role-graph.md` — role/holder reclaim mechanics,
  the pane-labeling call site, and the closing-report landing place
- `references/caller-contract.md` — the five callers table and the
  anchored-by-open-children fan-out contract

## Workflow Position

**Typically follows:** `fgos-routing` (orients and claims, then hands the
item to this loop), `fgos-fanout` (re-enters this loop on a parent once
its children clear an anchor)
**Typically precedes:** whichever stage skill the loop resolves for the
item's current position — `fgos-coding-discovering`, `fgos-coding-
exploring`, `fgos-coding-planning`, `fgos-coding-validating`, or
`fgos-coding-implement`
**Related:** `fgos-fanout` (the caller opts into it when it wants an
anchor's open children run concurrently instead of sequentially)
