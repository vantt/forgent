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
  `status == 'awaiting-approval'`) also always stops the loop immediately**
  (tsk-19j-4 — the safety gap an "unlimited" ceiling would otherwise hit on
  its very first real run): this is `fgos return`'s own natural finish
  line for the `executing`-stage skill, and there is no next stage-skill
  registered past it for this loop to resolve — re-invoking the
  `executing`-stage skill on an already-`awaiting-approval` item would be
  invoking it on an item whose claim was already released, which is never
  correct. Merge/approve past `awaiting-approval` stays out of this loop's
  reach entirely (a human decision, same boundary `/fgOS:cook`'s own hard
  rules already draw) — this skill's job ends here either way, ceiling or
  not.
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
  `judgeDecompose`'s `{kind:'invalid'}` fail-safe leaves the item exactly
  where it was, per `decompose.mjs`'s own header) — a real, already-existing
  outcome this skill must never paper over by just trying again.
- **Claim right before the FIRST invocation of the `executing`-stage
  skill, never earlier, and only when not already claimed** (generalizes
  `/fgOS:cook`'s existing hard rule "never claims before stage executing"
  into this skill, since it is now the one thing that decides when a
  stage-skill is about to run): immediately before invoking the skill this
  loop resolved for stage `executing` (`fgos-code-implement` in the `coding`
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
    fail or retry past that fallback) — only THEN invoke `fgos-code-implement`.

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
  ever needs exact-match ceilings in practice). `status:awaiting-approval`
  no longer needs to be passed explicitly (tsk-19j-4): it is one of the
  loop's own always-checked implicit stops now, same as `awaiting-human`/
  `blocked`. Omitting `ceiling` entirely means "unlimited" — loop until a
  person-shaped stop, an anchor, a no-progress read, or `awaiting-approval`
  ends it.

## Loop

```text
loop:
  read id's current {stage, status, domain} FRESH via `fgos list --id <id> --json`
  iterationStartStage, iterationStartStatus = stage, status   # for the no-progress check below
  domain = getDomain(item.domain)   # resolve early — parkReasonForStatus below needs the object, not the name

  if parkReasonForStatus(domain, status) == 'human-question':
    stop. Report the parked question back to the caller. Never answer it here.

  if parkReasonForStatus(domain, status) == 'system-error':
    stop. Report the block back to the caller. Never retry blind.

  if parkReasonForStatus(domain, status) == 'natural-finish':
    stop. Report "returned, awaiting-approval" back to the caller. There is
    no next stage-skill past this point in this loop's reach.

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
  # (no ceiling supplied: never stops here — only a person-shaped stop or
  # running out of registered stages/skills ends the loop)

  skill = skillForStage(domain, stage ?? <domain's own Execute-mapped stage>)
  if skill is null:
    stop. Stage is mechanical (today: only `executing` for domains that
    declare no skill there) — nothing left for THIS skill to load; the
    caller's own next step (e.g. `fgos return`) already covers it.

  if skill resolves to the domain's `executing`-stage skill AND status != 'doing':
    if domain.worktreeBacked:
      claim `id` (`fgos pick`) and enter its worktree BEFORE invoking
    else:
      claim `id` (`fgos take --role session`), no worktree, invoke at the
      main checkout
    — see the claim hard rule above.

  invoke `skill` (it runs its own Socratic/shape/implement pass, hits its
  own gate, and — once satisfied — calls the engine verb that actually
  advances stage/status: `fgos discover`/`fgos decompose`/`fgos return`)

  re-read id's current {stage, status} FRESH
  if stage == iterationStartStage AND status == iterationStartStatus:
    stop. Report "no progress at stage <stage> after invoking <skill>" —
    see the no-progress hard rule above. Never loop again on a stuck read.

  go back to loop start
```

The invoked skill is trusted to do its own job completely (including its
own gate question, when one is needed) before returning control here — this
skill never second-guesses or repeats a stage-skill's own gate.

## Which existing loops are this loop (D9 §3, no separate mechanisms)

| Caller | `id` source | `ceiling` |
|---|---|---|
| `/fgOS:cook` | freshly submitted item, or a child this loop's own anchor report just surfaced | none (safe now: `awaiting-approval`/anchor/no-progress are implicit stops, tsk-19j-4) |
| `/fgOS:pick` | one explicitly claimed item | none (same implicit stops) |
| a clarify-only sweep | `fgos ready --step Clarify` (needs `frontier(view, {step:'Clarify'})`, tsk-19j Track D's own `frontier.mjs` generalization) | `stage:decompose` |
| a planning-only sweep | `fgos ready --step Divide` | `stage:executing` |
| an execution-only sweep | `fgos ready --step Execute` (today's existing frontier default, unchanged) | none needed (`awaiting-approval` is now implicit — an explicit `status:awaiting-approval` ceiling still works identically, kept for this row's own historical naming) |

This table is descriptive, not a retrofit checklist this skill performs —
`cook`/`pick` calling this skill instead of their own inline stage-dispatch
prose is a separate, explicit step (tsk-19j-4: see
`plugins/fgOS/skills/cook/SKILL.md` and `plugins/fgOS/skills/pick/SKILL.md`
for how each one actually calls this skill today).

## Red flags

- resolving a stage's skill from anything other than the live
  `getDomain`/`skillForStage` registry lookup
- comparing `status` against a literal (`status === 'blocked'`, etc.)
  instead of resolving through `parkReasonForStatus(domain, status)`
- applying a stage or status move directly instead of leaving it to the
  invoked stage-skill's own engine-verb call
- checking the ceiling after invoking the current stage's skill instead of
  before
- continuing to loop past `parkReasonForStatus == 'human-question'`,
  `'system-error'`, or `'natural-finish'` (today's `awaiting-human`,
  `blocked`, `awaiting-approval`)
- treating `status:<name>` as a ranked comparison instead of an exact match
- reusing a stage/status snapshot from a prior loop turn instead of
  re-reading fresh
- invoking a stage skill while the item is anchored by open children
  instead of stopping and reporting them
- looping again after a stage-skill invocation left both `stage` and
  `status` unchanged, instead of stopping on the no-progress fail-safe
- claiming an item before its FIRST invocation of the `executing`-stage
  skill (e.g. at `clarify`/`decompose`), or claiming again when the item's
  status already reads `doing`
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
