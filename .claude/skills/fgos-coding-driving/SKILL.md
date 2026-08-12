---
name: fgos-coding-driving
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
(`cook`/`pick`/a discovery-sweep/a planning-sweep/an execution-sweep), never
asserted to generalize automatically to a domain that does not exist yet.

## Hard rules

- Never invent a stage-to-skill mapping. Every iteration resolves the
  skill to load via the exact same registry lookup `fgos-routing` uses
  (`getDomain`/`skillForStage`, `src/state/workflow-stage-graphs.mjs`) —
  this skill's whole value is doing that lookup in a loop, not doing it
  differently.
- Never apply a stage or status transition directly. Every transition
  happens because the loaded stage-skill called its own engine verb
  (`fgos discover`/`fgos plan`/`fgos return`) — this skill only reads
  state and decides whether to loop again, exactly the same "engine's verb
  always wins" stance `fgos-routing` itself states. This holds for every
  coding-domain stage without exception (tsk-tku D7 — `discovery`'s own
  skill chủ, `fgos-coding-discovering`, calls `fgos discover` itself, the
  same shape every other stage-skill in this loop already follows).
- Check the ceiling BEFORE invoking the current stage's skill, never after
  (tsk-19j §3's own verified boundary — this is what lets a `ceiling:
  stage:planning` loop stop with the item freshly landed AT `planning`,
  never one stage further, having invoked `fgos-coding-planning` first by mistake).
- The three person/system-shaped stops below are resolved through
  `parkReasonForStatus(domain, status)` (`src/state/workflow-stage-graphs.mjs`,
  tsk-3w3 follow-up), never a direct `status === 'awaiting-human'`-style
  literal comparison — same "resolve through the registry, don't hardcode"
  discipline `stageForStep`/`skillForStage` already use. `parkReason` is a
  narrower table than `statusLabels`/`statusCategory`: `blocked` and
  `awaiting-human` share one `statusCategory` (`in-progress`) but need
  OPPOSITE handling here, which is exactly why this reads `parkReason`, not
  `statusCategory` — reading the coarser table would erase the distinction
  this loop needs. Today only `coding` declares real `parkReason` entries
  (no other domain has ever been driven through this loop — D9/D10), so in
  practice this still resolves to the same three literals below; the
  indirection exists so a future domain could relabel them without silently
  breaking this loop's own semantics.
- `parkReasonForStatus(domain, status) == 'human-question'` (today: `status
  == 'awaiting-human'`) always stops the loop immediately, before any
  ceiling check — the same "an item is only legitimately blocked on a
  person while sitting in `awaiting-human`" contract `fgos-routing`'s own
  gate section describes. Return the question to whoever called this skill;
  never guess an answer to keep looping.
- `parkReasonForStatus(domain, status) == 'system-error'` (today: `status
  == 'blocked'`) also always stops the loop immediately — a failed verify
  or a rejected merge is a real stop, never something to loop past silently.
- **`parkReasonForStatus(domain, status) == 'natural-finish'` (today:
  `status == 'awaiting-approval'`) is the DEFAULT ceiling, overridable —
  never an unconditional stop.** A caller that supplies no ceiling stops
  here, exactly as before (tsk-19j-4's original safety gap stays closed:
  an "unlimited" drive still ends at the merge gate). A caller that
  deliberately supplies a ceiling beyond it — `status:cleanup`, say —
  drives past it, because there IS a next step registered past this point
  once the advance-axis is read as position rather than stage (see
  `## Advance-axis: position, not stage` below). Two things stay true
  either way: re-invoking the `executing`-stage skill on an
  already-`awaiting-approval` item is never correct (its claim was already
  released), and this loop never itself performs the merge/approve action.
- **The merge gate is protected by a launcher convention now, not by this
  loop refusing — do not remove the convention (`0031`, `CONTEXT.md` D2).**
  Because the stop above became overridable, the thing that keeps
  `awaiting-approval → delivered` a human decision is this named
  constraint: **no launcher ships a default ceiling past
  `awaiting-approval`.** Every launcher in `plugins/fgOS/skills/**` either
  omits `ceiling` or passes a `stage:*` one; a launcher that needs to work
  the post-merge chain passes an explicit `status:*` ceiling naming exactly
  how far it goes, and never one that would cross the merge edge itself.
  Merge/approve stays a human decision, the same boundary `/fgOS:cook`'s
  own hard rules already draw. A future session that finds this constraint
  inconvenient is looking at the actual safety mechanism — change it by
  superseding the decision, never by quietly widening a launcher's default.
- **Anchored-by-open-children always stops the loop, checked every
  iteration, before the ceiling check** (tsk-19j-4 — the gap D14's original
  "retrofit is nearly free" claim missed): a `decompose` outcome can turn
  the current item into a root with real children (`addWork`, `parent:
  id`) — the frontier/lineage rule (`frontier.mjs`'s `hasOpenDescendant`)
  means this item is never itself dispatchable again while any child is
  still open, no matter what its own `stage`/`status` now read. Blindly
  looping past this would try to build the ROOT directly instead of
  waiting for its children — the exact failure mode a literal "just keep
  looping" driver would hit on its very first real split. Detect it the
  same way `frontier.mjs` does, from the same fresh read: any item with
  `parent == id` whose `status` is NOT one of `delivered`/`retrospective`/
  `cleanup`/`done`/`wontfix` anchors this item. When anchored, stop — never
  invoke a stage skill this turn — and report every anchoring child id back
  to the caller. This is never this skill's own job to resolve: the caller
  decides whether to drive each open child next (see the loops table below
  for how `/fgOS:cook` uses this).
- **No progress in an iteration is also a stop, never a silent re-loop**:
  if invoking the resolved stage-skill leaves BOTH `stage` and `status`
  unchanged from what this same iteration read at its top (compare the
  fresh re-read at the NEXT loop start against what THIS iteration started
  with), stop and report "no progress at stage `<stage>` after invoking
  `<skill>`" instead of looping again. This is the fail-safe for a stage
  skill whose own engine-verb call came back `invalid`/uncommitted (e.g.
  `resolvePlan`'s `{kind:'invalid'}` fail-safe leaves the item exactly
  where it was, per `plan.mjs`'s own header — the file `decompose.mjs` was
  renamed to, tsk-403 D15) — a real, already-existing
  outcome this skill must never paper over by just trying again.
- **Claim right before the FIRST invocation of the `executing`-stage
  skill, never earlier, and only when not already claimed** (generalizes
  `/fgOS:cook`'s existing hard rule "never claims before stage executing"
  into this skill, since it is now the one thing that decides when a
  stage-skill is about to run): immediately before invoking the skill this
  loop resolved for stage `executing` (`fgos-coding-implement` in the `coding`
  domain's registry today), check the item's live `status` from the SAME
  fresh read this iteration already did. If it is already `doing` (the
  caller — e.g. `/fgOS:pick`'s own step 2 — already claimed it, or a prior
  iteration of THIS loop already did), skip claiming and proceed straight
  to invoking the skill; the session is assumed to already be inside the
  claimed worktree in that case (or, for a `worktreeBacked:false` domain,
  already at the main checkout — see below). Otherwise, read
  `domain.worktreeBacked` (`getDomain(domain).worktreeBacked`, the same
  registry lookup this skill already uses for `skillForStage`, no new
  field) and claim accordingly:

  - `worktreeBacked === true` (today: `coding`) — claim exactly the way
    `/fgOS:pick`'s own step 2 does:

    ```bash
    root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
    node "$root/bin/fgos.mjs" pick "<id>" --dir "$root"
    ```

    then hand the session into the returned `data.worktree.path` the same
    way `/fgOS:pick`'s own step 4 does (`EnterWorktree`, falling back to
    printing the path and stopping if it is unavailable/refuses — never
    fail or retry past that fallback) — only THEN invoke `fgos-coding-implement`.

  - `worktreeBacked === false` — claim without a worktree, the same
    stage-agnostic claim `fgos-routing` and 2 other skills already use
    (`claimWork`'s `isolate:false` path, `claim-port.mjs:88`; `take --id`
    already claims an item at any stage, `bin/fgos.mjs`'s `take` case):

    ```bash
    root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
    node "$root/bin/fgos.mjs" take --role session --id "<id>" --dir "$root"
    ```

    never call `EnterWorktree` for this branch — invoke the
    `executing`-stage skill directly at the current (main-checkout) cwd.
- **The pane-labeling call is decoration, never a gate.** The helper
  invoked once per drive (see `## Pane labeling: the pinned execution-lane
  call site` below) always exits `0` and silently does nothing when no
  `pane-labeling` provider is registered or the session is not inside a
  labelable pane. Never stop the loop, retry, or branch on its result — and
  never read a pane label back to decide anything, which is forbidden
  outright (D2: labels are for humans; occupancy is engine state).
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
- **Relay a known error category verbatim, never paraphrased into a generic
  "blocked"** (tsk-1c6 D2/D4). When an invoked stage-skill hands back a
  failure whose underlying `fgos <verb>` call carried a known error category
  — or when one of THIS skill's own verb calls (`fgos list`, `fgos pick`)
  hits one — the stop this skill reports must carry that category as its own
  line, in exactly this shape:

  ```text
  stop-reason: lock-timeout
  ```

  `lock-timeout` is the category that matters (tsk-1c6 D1): it is
  `EventLogError('lock-timeout')` / exit code `7`, and it means
  `.fgos/events.jsonl`'s lock — shared by every item — is stuck, so a caller
  looping over items should stop the whole run rather than skip one item.
  Other categories (`session-fail`, `merge-fail`, CAS `validation`) stay
  per-item and need no such line.

  Before tsk-31l, callers read this off a raw CLI subprocess's exit code.
  Dispatching through this skill removed that channel, so this line IS the
  channel now. Never summarize it away, never soften it to "blocked", and
  never emit the line for a failure that was not actually a lock-timeout.

## Input

- `id` — the item to drive. This skill never chooses which item; the
  caller already claimed or is otherwise authorized to drive it.
- `ceiling` — `stage:<name>` or `status:<name>` (D13, explicit prefix,
  never inferred from which of two disjoint name sets a bare string
  belongs to). `stage:<name>` compares against the item's domain's own
  `stages` array order (`getDomain(item.domain).stages`, e.g. coding's
  `['discovery', 'exploring', 'decompose', 'planning', 'executing']`) — the loop stops once the
  item's current stage's index is `>=` the ceiling stage's index in that
  same array. `status:<name>` compares by exact match only — the loop
  stops the moment `item.status === name` (status is not a strict linear
  order like stage is: `blocked`/`awaiting-human`/`wontfix` are branches,
  not points on one line, so this skill never tries to rank them; it only
  ever needs exact-match ceilings in practice). `status:awaiting-approval`
  no longer needs to be passed explicitly (tsk-19j-4): it is one of the
  loop's own always-checked implicit stops now, same as `awaiting-human`/
  `blocked`. Omitting `ceiling` entirely means "default" — loop until a
  person-shaped stop, an anchor, a no-progress read, or `awaiting-approval`
  ends it. A caller that genuinely means to work the post-merge chain says
  so with an explicit `status:*` ceiling; it never gets there by accident.

## Advance-axis: position, not stage

Two sentences pin this whole section. The advance-axis is the item's
position, not its stage. And, kept on one unwrapped line so a line-based
search matches it:

awaiting-approval is the DEFAULT ceiling, overridable

A ceiling-less drive still ends there; an explicit further ceiling drives
past it.

Which axis this loop advances along is resolved from the item's **current
position**, not fixed to `stage` (`CONTEXT.md` D1). Position means:

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
mechanism bolted on: `skillMap` (`src/state/workflow-stage-graphs.mjs`)
has held five stage names *and* the status name `retrospective` in one
frozen object since decision record `0027` D5, which recorded that "the
two vocabularies never collide" and that which lookup table a key belongs
to is the caller's concern. The registry was already a position→skill
map; this loop simply reads it as one. The three-role vocabulary this
serves — `launcher` (1 unit, lets go) / `driver` (1 unit, stays) /
`orchestrator` (N units, stays, the T0 aggregate layer) — is `0029` D17's
own 2×2 grid; this skill is the `driver` cell.

Nothing else about the loop changes. The same `skillForStage(domain,
position)` lookup resolves the skill, the same `null` result means "this
position is mechanical, nothing to load", and the same three
`parkReasonForStatus` stops apply. In particular, `cleanup` deliberately
registers no skill (`0027` D5: "pure harness, no skill ever loads for
it"), so a loop that reaches it resolves nothing and stops — the caller's
own mechanical verb covers that position, exactly as before.

## Loop

```text
shownItemOnce = false   # scoped to this ONE fgos-coding-driving call only,
                         # never persisted — see the display step below
labeledPaneOnce = false # same scope, same lifetime — see the labeling step

loop:
  read id's current {stage, status, domain} FRESH via `fgos list --id <id> --json`
  iterationStartStage, iterationStartStatus = stage, status   # for the no-progress check below
  domain = getDomain(item.domain)   # resolve early — parkReasonForStatus below needs the object, not the name
  position = stage-is-live(status) ? (stage ?? <domain's own Execute-mapped stage>) : status
             # see `## Advance-axis: position, not stage` — stage while it is
             # live (status in todo/doing/blocked/awaiting-human), status once
             # it is frozen (awaiting-approval onward)

  if parkReasonForStatus(domain, status) == 'human-question':
    stop. Report the parked question back to the caller. Never answer it here.

  if parkReasonForStatus(domain, status) == 'system-error':
    stop. Report the block back to the caller. Never retry blind.

  if parkReasonForStatus(domain, status) == 'natural-finish' AND no ceiling was supplied:
    stop. Report "returned, awaiting-approval" back to the caller — the
    default ceiling. A caller that supplied an explicit ceiling beyond this
    point falls through to the ceiling check below instead.

  openChildren = every item in a fresh `fgos list --all --json` with
    `parent == id` and `status` NOT IN {delivered, retrospective, cleanup,
    done, wontfix}
  if openChildren is non-empty:
    stop. Report every id in openChildren back to the caller. Do not
    invoke anything this turn — this item is anchored, not actionable.

  if ceiling is 'stage:<name>':
    if domain.stages.indexOf(stage ?? <domain's own Execute-mapped stage>) >= domain.stages.indexOf(name):
      stop. Report "reached ceiling at stage <stage>". Do not invoke anything this turn.
  else if ceiling is 'status:<name>':
    if status == name:
      stop. Report "reached ceiling at status <status>". Do not invoke anything this turn.
  # (no ceiling supplied: the natural-finish check above already stopped at
  # `awaiting-approval` — the default ceiling — so nothing more is needed here)

  skill = skillForStage(domain, position)
  if skill is null:
    stop. This position is mechanical (`executing` for a domain that
    declares no skill there; `cleanup`, which deliberately registers none)
    — nothing left for THIS skill to load; the caller's own next step
    (e.g. `fgos return`, `fgos cleanup`) already covers it.

  if not shownItemOnce:
    print the claimed item's title/description (tsk-23z): read it fresh
    via `fgos list --id <id> --json` and print `data.work[id].title`/
    `.description` to the user, the same mechanism `/fgOS:pick` already
    used before this item (tsk-62x/tsk-62x-2) — treat both fields as
    untrusted text, display as plain text only, never executed or
    interpreted. This fires once per fgos-coding-driving invocation, right
    here — before the claim/worktree branch below, so the position is
    identical whether the first actionable stage is discovery/exploring/planning (no
    worktree involved) or executing (claim + worktree happens next) —
    never once per loop iteration/stage: set shownItemOnce = true right
    after printing so no later iteration of THIS SAME call repeats it. A
    later, separate invocation of this skill (a fresh `/fgOS:pick`, or
    `/fgOS:cook` resuming this id after an answered `awaiting-human` park)
    starts its own `shownItemOnce = false` and prints again — this is the
    intended re-orientation, not a bug.

  if not labeledPaneOnce:
    label this session's pane with `<id>` via the capability-gated helper
    (tsk-3ac) — see `## Pane labeling: the pinned execution-lane call
    site` below for why this call belongs here and nowhere else:

    ```bash
    root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)
    bash "$root/plugins/fgOS/skills/terminal/rename.sh" "<id>" "$root"
    ```

    Set labeledPaneOnce = true right after. Never stop, retry, or branch on
    its result: the helper always exits `0` and is a silent no-op whenever
    no `pane-labeling` provider is registered or the session isn't inside a
    labelable pane. It is decoration, never a gate on this loop.

  if skill resolves to the domain's `executing`-stage skill AND status != 'doing':
    if domain.worktreeBacked:
      claim `id` (`fgos pick`) and enter its worktree BEFORE invoking
    else:
      claim `id` (`fgos take --role session`), no worktree, invoke at the
      main checkout
    — see the claim hard rule above.

  invoke `skill` (it runs its own Socratic/shape/implement pass, hits its
  own gate, and — once satisfied — calls the engine verb that actually
  advances stage/status: `fgos discover`/`fgos plan`/`fgos return` —
  EXCEPT at stage `discovery`: apply `fgos-researching`'s own returned
  verdict via `fgos discover` on its behalf, see `## Discovery and
  exploring stages` below)

  re-read id's current {stage, status} FRESH
  if stage == iterationStartStage AND status == iterationStartStatus:
    stop. Report "no progress at stage <stage> after invoking <skill>" —
    see the no-progress hard rule above. Never loop again on a stuck read.

  go back to loop start
```

The invoked skill is trusted to do its own job completely (including its
own gate question, when one is needed) before returning control here — this
skill never second-guesses or repeats a stage-skill's own gate.

## Pane labeling: the pinned execution-lane call site

This loop is where the execution lane labels its own pane, and it is the
only place that call belongs (`docs/history/orchestrator-worker-slots/
DISCUSSION.md` §6 "Phân công đặt nhãn theo lane", D5). Two reasons, both
structural: this loop knows the item id **earliest** — every launcher that
drives a coding item routes through here — and it sees **every stage
change**, so one call here replaces N launchers each having to remember
one. `/fgOS:discover-next` used to carry its own optional rename call for
exactly this purpose; it does not any more, because it now reaches this
loop through `/fgOS:discover` and inherits the call.

Calling it does not break this skill's "purely mechanical loop" hard rule,
and §6 says so directly: invoking a capability-gated helper that no-ops is
a mechanical action, not a routing judgment. The loop never reads a result
from it, never branches on it, and never lets it fail the drive.

**The gate is not in this file.** `rename.sh` itself queries the
`pane-labeling` capability (`fgos tool query`) and no-ops silently when no
provider is registered — see `plugins/fgOS/skills/terminal/SKILL.md`. That
is what makes labeling adapter-swappable: a future tmux/cmux orchestrator
is a different registered provider, not an edit to this loop.

**Nothing may ever read a label back** (D2). Labels exist for a person
looking at a screen; occupancy and "what is running" are engine state.
This loop writes one and never reads one.

`/fgOS:pick` step 3 also calls the same helper, at claim time — earlier
than this loop, and it covers pick's own `EnterWorktree`-fallback branch
where this loop is never invoked at all. The two calls produce the same
label for the same id, so the overlap is redundant, never conflicting.

## Which existing loops are this loop (D9 §3, no separate mechanisms)

| Caller | `id` source | `ceiling` |
|---|---|---|
| `/fgOS:cook` | freshly submitted item, or a child this loop's own anchor report just surfaced | none (safe now: `awaiting-approval`/anchor/no-progress are implicit stops, tsk-19j-4) |
| `/fgOS:pick` | one explicitly claimed item | none (same implicit stops) |
| a discovery/exploring-only sweep | the discover pool `/fgOS:discover-next` picks from (`src/state/discover-pool.mjs` — its candidate set is `discovery`/`exploring` plus a now-dead `clarify` entry; coding maps no stage to the `Clarify` step anymore, so `frontier(view, {step:'Clarify'})` surfaces nothing for it) | `stage:planning` |
| a planning-only sweep | `fgos ready --step Divide` (the `planning` stage; the legacy `decompose` alias drains through the same pool, `src/state/plan-pool.mjs`) | `stage:executing` |
| an execution-only sweep | `fgos ready --step Execute` (today's existing frontier default, unchanged) | none needed (`awaiting-approval` is now implicit — an explicit `status:awaiting-approval` ceiling still works identically, kept for this row's own historical naming) |

This table is descriptive, not a retrofit checklist this skill performs —
`cook`/`pick` calling this skill instead of their own inline stage-dispatch
prose is a separate, explicit step (tsk-19j-4: see
`plugins/fgOS/skills/cook/SKILL.md` and `plugins/fgOS/skills/pick/SKILL.md`
for how each one actually calls this skill today).

## Caller contract: what to do with an anchored-by-open-children report

Fan-out is a CAPABILITY a caller opts into, never a second entry point this
skill provides itself (D8, `docs/history/execution-fanout/CONTEXT.md`) —
this skill still never resolves an anchor on its own (see the hard rule
above). This is the one place that contract is written down; every caller
in the table above reads it from here, never keeps its own copy.

When this skill reports **anchored by open children**, the caller already
holds a real candidate set for free: the reported `openChildren` list IS
`children(parentId)` — case 1's own candidate-set definition
(`docs/history/execution-fanout/CONTEXT.md` § Thuật ngữ, "tập ứng viên").
A caller MAY still drive each child sequentially — nothing about an anchor
report requires concurrency — but when it wants them run concurrently
instead of one at a time, the contract is:

1. Invoke the `fgos-fanout` skill with `parentId` = the item that just
   anchored and `candidateIds` = the reported `openChildren` list,
   unchanged, no re-derivation.
2. Let `fgos-fanout` run to its own stop (every candidate reaches a
   terminal status, or is reported back needing a person) — this skill
   never re-implements or peeks inside that loop; `fgos-fanout` owns it
   completely, the same "the invoked skill does its own job completely"
   stance this skill already holds for a stage-skill.
3. Once `fgos-fanout` returns, invoke THIS skill again on the original
   `parentId`. The anchor either clears (every child reached a terminal
   status, so the parent's own lifecycle continues) or it still reports
   the same or a smaller `openChildren` set (some child came back
   `blocked` or needing a person) — either way, re-entering this skill on
   `parentId` is the same fresh-read discipline every other iteration of
   this loop already follows, never a special case.

### Five callers, one contract — what changes here

The caller table above lists five readers of this same anchor report. This
item (tsk-66d) wires exactly ONE of them into the contract above; the
other four inherit it as written but are NOT touched in this item —
carried forward from `docs/history/execution-fanout/plan.md`'s own Open
Question:

| Caller | Changed in this item? |
|---|---|
| `/fgOS:cook` | Reverted — tsk-66d wired it to `fgos-fanout` for a time; per an explicit user decision (260811) it was reverted back to the sequential front-of-queue push (`plugins/fgOS/skills/cook/SKILL.md`), since the contract above already states fan-out is an OPTION, never a requirement |
| `/fgOS:pick` | No — it still drives exactly the one id it was given; an anchor there means that ONE claimed item split into children, a legitimate stop for a single-id claim to report as-is |
| a discovery/exploring-only sweep | No — inherits the contract, unmodified this item |
| a planning-only sweep | No — inherits the contract, unmodified this item |
| an execution-only sweep | No — inherits the contract, unmodified this item |

If a later session finds one of the four "No" rows above is a real gap
rather than legitimate scope, that is new evidence for a follow-up item —
`plan.md` already named this as an open question, not a silent omission.

## Red flags

- resolving a stage's skill from anything other than the live
  `getDomain`/`skillForStage` registry lookup
- comparing `status` against a literal (`status === 'blocked'`, etc.)
  instead of resolving through `parkReasonForStatus(domain, status)`
- applying a stage or status move directly instead of leaving it to the
  invoked stage-skill's own engine-verb call
- checking the ceiling after invoking the current stage's skill instead of
  before
- continuing to loop past `parkReasonForStatus == 'human-question'` or
  `'system-error'` (today's `awaiting-human`, `blocked`) — both are
  unconditional, no ceiling overrides either
- continuing past `'natural-finish'` (today's `awaiting-approval`) when the
  caller supplied NO ceiling — it is the default ceiling, so a
  ceiling-less drive still ends there
- widening a launcher's default ceiling past `awaiting-approval`, which is
  the one convention keeping the merge gate a human decision now that this
  loop no longer refuses structurally
- fixing the advance-axis to `stage` instead of resolving `position` (stage
  while live, status once frozen)
- treating `status:<name>` as a ranked comparison instead of an exact match
- reusing a stage/status snapshot from a prior loop turn instead of
  re-reading fresh
- invoking a stage skill while the item is anchored by open children
  instead of stopping and reporting them
- looping again after a stage-skill invocation left both `stage` and
  `status` unchanged, instead of stopping on the no-progress fail-safe
- claiming an item before its FIRST invocation of the `executing`-stage
  skill (e.g. at `discovery`/`exploring`/`planning`), or claiming again when the item's
  status already reads `doing`
- treating the pane-labeling call as a gate — stopping, retrying, or
  branching on its result — or reading a pane label back to decide
  anything (D2)
- asserting this loop generalizes to a domain other than `coding` without
  new evidence for that domain (D10)
- reading the claim step's `worktreeBacked` branch, or the stop-condition
  checks' `parkReasonForStatus` resolution, as if either were itself new
  cross-domain evidence — both only read a per-domain field the registry
  already carries; neither asserts this loop has been exercised against a
  second domain; D10 still holds

Violating the letter of the rules is violating the spirit of the rules.

Ceiling reached, `awaiting-approval` reached, an anchor by open children,
a no-progress read, or a person-shaped stop. Report which one to the
caller — this skill's own job ends there; it never decides what happens
next on its own authority.

When the stop came from a failure carrying a known error category, the
report also carries that category's own line verbatim — today
`stop-reason: lock-timeout` is the one category that qualifies (see the
Hard rules above). A caller looping over items reads that line to tell
"stop the whole run, the shared lock is stuck" apart from "skip this one
item".
