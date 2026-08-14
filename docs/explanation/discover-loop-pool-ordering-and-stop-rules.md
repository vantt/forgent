# Why discover-loop's pool ordering and stop rules diverge from merge-loop's

`/fgOS:discover-loop` (backed by `/fgOS:discover-next`, tsk-3go) mirrors
`merge-loop`'s shape — `/loop` wrapped around a next-item picker — but for
the `stage:clarify`/`stage:decompose` backlog instead of the merge
frontier. Several of its rules were **not** copied from `merge-loop`
as-is; each was independently re-derived against the actual code, and in
two places the result diverges from what a naive copy would have
produced.

## No existing pool function to reuse

No existing backend function covers a "next clarify/decompose item" pool
— `frontier()` (`src/state/frontier.mjs:78-98`) only ever returns
`stage:executing` items. A new backend function was added for this pool
rather than an ad-hoc filter at the skill layer, because real ordering
logic was needed (see below) that a one-off skill-side filter couldn't
cleanly express or reuse.

## Two different sort orders for the two sub-pools

- **`stage:decompose` pool** sorts by `priority` ASC (absent-last), then
  FIFO — the same shape as `compareReadyOrder`
  (`frontier.mjs:121-133`). This is valid here because every item
  reaching `decompose` has already been through `discover` once, so
  `priority` is already computed (`discovery.mjs:329-338`, unconditional
  on either a clear or unclear outcome).

- **`stage:clarify` pool** does **not** sort by `priority`. Verified:
  `computePriority` (`src/state/priority-formula.mjs:75-80`) computes
  `raw = impact*w*d/e`; `impact` defaults to `0` when
  `semanticRelatedness` (`verdict.impactScore`) is absent — which it
  always is pre-discover, since that value only exists after the LLM
  judge runs (`discovery.mjs:313`, `330-334`). With `impact=0`, `raw` is
  always `0`, so `priority` collapses to the same fixed constant
  (`PRIORITY_SCALE`) for every item that hasn't been discovered yet — no
  real ordering signal. Instead, the clarify pool sorts by **`blocks`**
  (how many other open items this one blocks — from `rankImpact`, defined
  at `src/state/impact.mjs:88`, called internally by `blocksForItem` at
  `discovery.mjs:66-69`) DESC, then the `urgent` flag (true first), then
  FIFO. `blocks` is purely dependency-graph-structural — no LLM call
  needed, and available immediately at submit time.

## Only `status:todo` items are eligible

`discover-next` only considers `status:todo` items in either sub-pool.
`status:doing` items are excluded — those are actively claimed by another
live session (an open `fgos-coding-exploring`/`fgos-coding-planning` session on that
item), and the loop must not touch a session someone else already has
open.

## Eligibility also requires deps-readiness, or the picker hands back an id nobody can claim

Status and stage were not enough on their own. `isCandidate()` originally
read:

```js
function isCandidate(item) {
  return item.status === 'todo' && CANDIDATE_STAGES.has(item.stage);
}
```

Nothing there asks whether the item's dependencies are resolved — so the
picker could hand a caller an id that the very next step refuses. The
claim path checks what the pool did not: `take`'s handler calls
`isDepsAndLineageReady(dir, id)` directly, and refuses with `"<id>" is
todo but has an unmet dependency or an open decomposed child`.

Confirmed live (2026-08-11) on `tsk-28x` — `status:todo`, `stage:clarify`,
so an exact match for the old two-clause filter — whose `take` was refused
because its deps `tsk-12m` (`awaiting-human`) and `tsk-1hy` (`cleanup`,
not yet `done`) were unresolved. Every such pick costs a whole
discover/session round that can only end in a refusal.

The fix reuses the helper that was already exported and already the claim
path's own check (`src/state/frontier.mjs`), rather than writing a second
readiness rule that could drift from it:

```js
function isCandidate(item, view) {
  return (
    CANDIDATE_STATUSES.has(item.status) &&
    isCandidateStage(item) &&
    isDepsAndLineageReady(view, item.id)
  );
}
```

Two properties of that reuse are deliberate:

- **The whole helper, not just its deps clause.** `isDepsAndLineageReady`
  also refuses on `hasOpenDescendant` (an open decomposed child). Bundling
  both is right here for the same reason `take`'s explicit-`--id` branch
  already bundles both: an item anchored by an open child is equally not
  dispatchable, and why it is undispatchable does not change the answer.
- **Silent exclusion, not a new "found but blocked" report.** This matches
  the only existing convention in the codebase for the same kind of
  filter — `frontier()`, in the same directory, already drops an
  executing-stage item with `depsReady === false` without announcing it.
  No new return shape was introduced.

Only the picker's filter changed. `/fgOS:discover`'s own claim step was
never buggy: it calls `take`, inherits `take`'s real check transitively,
and correctly relays the refusal and stops.

One real asymmetry stayed open rather than being folded in: `pick --id
<id>` does **not** call `isDepsAndLineageReady` at all, going straight to
`claimWork` with only a CAS on `expectedStatus`. That path is not
exercised by this failure mode — `/fgOS:discover` falls back to `pick`
only when `take` fails for a branch-exists reason, never for unmet deps —
so it is a known sibling gap, not something this change silently covered.

## Stop rules — deliberately not "same item blocked twice"

`discover-loop`'s stop rules are **only**:

1. the pool (clarify + decompose, `status:todo`) is empty,
2. a `lock-timeout` error (`EventLogError('lock-timeout', ...)`,
   `src/state/events.mjs:309-314`, `.fgos/events.lock` held past
   `EVENTS_LOCK_TIMEOUT_MS=2000` by another process) — a genuine systemic
   failure, since the lock guards the one shared event log for every
   item, not scoped to whichever item happened to hit it,
3. a configurable iteration cap is reached.

The loop does **not** stop on an item parking `awaiting-human`, and does
not stop on a per-item CAS `conflict`
(`FsmError('conflict', ...)`, `fsm.mjs:204-208`). Both are scoped to the
one item: skip it, log it, continue to the next.

This is a deliberate divergence from `merge-loop`, which stops when the
*same* item blocks twice in a row. The original task description for
tsk-3go had copied that "same item parks twice" rule from `merge-loop`
without verifying it applied here — it doesn't. `putInAwaiting`
(`store.mjs:570-582`) moves an item's `status` to `awaiting-human` on the
very first park, which removes it from the `status:todo` pool
immediately — so there is no risk of `discover-loop` re-picking the same
parked item on a later iteration, unlike `merge-loop`'s own "blocked"
case, where the blocked item's status never changes and it can be
re-selected on the next pass.

## The lock-timeout signal broke silently when discover-next stopped being a CLI subprocess, then was restored end-to-end

The stop rule above (`lock-timeout` — exit code `7` — stops the whole
loop) assumed `discover-next` calls `fgos discover`/`fgos plan` as a
raw CLI subprocess, whose real exit code it can read directly. `tsk-31l`
later switched `discover-next` to dispatch through the `fgos-coding-driving`
skill instead (which invokes `fgos-coding-exploring`/`fgos-coding-planning` in-session,
never as a subprocess) — and that switch silently broke the signal this
doc's own stop-rule section depends on. A `lock-timeout` several skill
layers down now looked identical to any other one-off `blocked` outcome:
`discover-next` had no exit code left to read, so it could no longer tell
"stop the whole loop, this is systemic" apart from "skip this one item and
continue."

`tsk-1c6` (discovered while implementing `tsk-31l` itself, filed as an
explicit out-of-scope gap rather than silently patched inline) restored
the signal by threading a literal, locked token —
**`stop-reason: lock-timeout`** — through every layer between where a
`fgos discover`/`fgos plan` call can actually fail and where
`discover-next`/`discover-loop` classify the result:

> "D2: Fix lives at the root: `fgos-coding-driving`'s own stop-report
> contract gains the structured lock-timeout signal, not a narrow patch
> scoped only to `discover-next`'s own dispatch handling... visible to
> every caller of `fgos-coding-driving` (`/fgOS:cook`, `/fgOS:pick`, any
> future sweep), not just `discover-next`."
>
> "D4: The stop-report's lock-timeout signal is identified by the literal
> token `stop-reason: lock-timeout`. This is a locked contract string, not
> an implementation detail: whoever implements D2 must emit exactly this
> token, and `fgos-coding-exploring`/`fgos-coding-planning` must relay exactly this
> token when their own engine-verb call fails that way."

Ten `SKILL.md` files ended up needing the token (both `.claude/skills/`
and `.agents/skills/` mirrors of `fgos-coding-driving`/`fgos-coding-exploring`/
`fgos-coding-planning`/`fgos-coding-validating`, plus `discover-next`/`discover-loop`
themselves) — `fgos-coding-validating` was added mid-implementation once
`fgos-coding-planning`'s reality gate noticed it also fires `fgos plan`
internally (its own Gate section), which the original eight-file count had
missed.

The verify for this fix is itself a case study in a boundary this same
retro-loop's own synthesis skill enforces elsewhere
(`docs/how-to/write-verify-for-a-skill-prose-change.md`): a shell command
can assert the literal token is *present* in the prose (and that a
superseded "Known gap" paragraph is *gone*), but cannot prove an LLM
actually relays that token across a live skill-invocation hop at runtime —
that proof is explicitly left to `docs/how-to/
smoke-test-fgos-coding-implement-with-a-trivial-item.md` plus real
event-log observation, not to this field. `tsk-1c6`'s own verify went
through three locked-then-reversed forms before landing there (a
mechanical grep, disputed five times as unable to prove a runtime claim;
then "wait for a not-yet-built verification harness"; then, once that
harness turned out to be YAGNI, `tsk-4l9`'s actual written standard) — the
five disputes were never overturned, they were answered by narrowing what
`verify` was being asked to prove in the first place.

## The loop never auto-chains past discover/decompose

Verified: `bin/fgos.mjs`'s `discover`/`decompose` CLI cases
(lines 883–916) just `return resolveDiscovery(...)` /
`return resolveDecompose(...)` — no call into `dispatch`/`execute`
anywhere in that path (0 grep matches in `src/intake/discovery.mjs` /
`decompose.mjs`). This differs from `fgos-runner`'s own `--watch` daemon
(`src/runner/loop.mjs:970-1000`), which *does* chain its own
clarify/decompose sweep straight into Execute-stage dispatch within the
same run. `fgos-runner`'s watch loop is a structurally different,
always-running background process — not something `discover-loop`
triggers or depends on. Advancing a cleared item into execution stays
`/fgOS:pick`'s job.

## No worktree/branch/merge machinery needed

`discover`/`decompose` never write to the git tree (0
`writeFileSync`/`fs.write` matches in `src/intake/discovery.mjs` /
`decompose.mjs`); every state change resolves to `appendEvent` on the
shared, lock-guarded `.fgos/events.jsonl`
(`src/state/events.mjs`) — safe for concurrent callers (this loop, a
human session, `fgos-runner`) by construction, without needing per-call
isolation.

## Two independent judge layers, no coupling logic needed

`judgeDiscovery` (stage `clarify`) and `judgeDecompose` (stage
`decompose`) are two independent mechanical judges — confirmed in
`docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md:69-70`.
`discover`'s own `clear`/`unclear` verdict is decided synchronously
inside `resolveDiscovery` (`discovery.mjs:340-354`) — it never waits on
`decompose` to run. A `clear` verdict only means clarify-stage ambiguity
is resolved (`moveStage` to `decompose`, `discovery.mjs:340-348`); the
item can still independently park `awaiting-human` later at the
`decompose` stage, asking a completely different kind of question
(effort/blast-radius/split-shape, not product intent). The pool the loop
scans (`stage in {clarify, decompose}, status:todo`) treats both as
separate, independently-resolvable item-states — no coupling logic is
needed between them.

Also confirmed: children created by a `decompose`-split verdict are
created directly at `stage:executing` (`decompose.mjs:495`), and the
parent item itself also moves to `stage:executing`
(`decompose.mjs:502`) — neither re-enters the clarify/decompose pool, so
a decompose split never grows the loop's own workload.

## Herdr pane rename stayed deferred

Whether to call `/fgOS:terminal` each iteration to rename the herdr pane
to the item currently being discovered (for live dashboard
observability) was raised as an open discovery question. It was resolved
as: herdr dashboard infrastructure is not assumed available — this is a
nice-to-have, deferred, non-blocking piece. The core discover-next /
discover-loop shape (backend picker + two skills) ships without needing
herdr integration for v1; if herdr isn't present on a given machine, the
skill still works correctly, since the terminal-rename skill is itself a
safe no-op when not running inside a herdr pane, per its own contract.
