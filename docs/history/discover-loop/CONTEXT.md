# CONTEXT: discover-loop skill (tsk-3go)

## Feature boundary

Build 2 new skills that let a human-driven, interactive `/loop` session
sweep the `stage:clarify`/`stage:decompose` backlog one item at a time —
mirroring `merge-loop`'s shape (`plugins/fgOS/skills/merge-loop/SKILL.md`)
but for the discover/decompose side of the pipeline instead of the merge
side:

- `/fgOS:discover-next` — picks exactly one next item from the
  clarify/decompose backlog and runs the matching mechanical verb
  (`fgos discover <id>` or `fgos plan <id>`) on it, reporting the
  outcome.
- `/fgOS:discover-loop` — wraps `/loop` around `discover-next`.

Explicitly NOT in scope: `fgos-runner`'s background `--watch` daemon (a
separate, already-existing automated sweep — see D7 below), and anything
past the stage the mechanical verb itself produces (no auto-chaining into
`pick`/`take`/execution — see D6).

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | No existing backend function covers a "next clarify/decompose item" pool — `frontier()` (`src/state/frontier.mjs:78-98`) only ever returns `stage:executing` items. Add a **new backend function** for this pool (not a skill-level ad-hoc filter), since real ordering logic is needed (D2/D3) that a one-off skill-side filter can't cleanly express/reuse. |
| D2 | **`stage:decompose` pool** sorts by `priority` ASC (absent-last), then FIFO — same shape as `compareReadyOrder` (`frontier.mjs:121-133`). Valid here because every item reaching `decompose` has already been through `discover` once, so `priority` is already computed (`discovery.mjs:329-338`, unconditional on either clear/unclear outcome). |
| D3 | **`stage:clarify` pool** does **NOT** sort by `priority`. Verified: `computePriority` (`src/state/priority-formula.mjs:75-80`) computes `raw = impact*w*d/e`; `impact` defaults to `0` when `semanticRelatedness` (`verdict.impactScore`) is absent — which it always is pre-discover, since that value only exists after the LLM judge runs (`discovery.mjs:313`, `330-334`). With `impact=0`, `raw` is always `0`, so `priority` collapses to the same fixed constant (`PRIORITY_SCALE`) for every item that hasn't been discovered yet — no real ordering signal. Instead, sort by **`blocks`** (how many other open items this one blocks — from `rankImpact`, defined at `src/state/impact.mjs:88` — verified directly at `fgos-coding-validating` time; `bin/fgos.mjs:32` imports it from there, `src/state/graph-harness.mjs` only *calls* it internally for its own unrelated `mergeReadiness`, an earlier citation of this decision named the wrong file — and the same `blocksForItem` — `discovery.mjs:66-69` — calls internally) DESC, then `urgent` flag (true first), then FIFO. `blocks` is purely dependency-graph-structural — no LLM call needed, available immediately at submit time. |
| D4 | `discover-next` only considers `status:todo` items in the pool (both sub-pools). `status:doing` items are excluded — those are actively claimed by another live session (an open `fgos-coding-exploring`/`fgos-coding-planning` session on that item) and must not be touched by the loop. |
| D5 | `discover-loop`'s stop rules are **only**: (a) the pool (clarify+decompose, status:todo) is empty, (b) a `lock-timeout` error (`EventLogError('lock-timeout', ...)`, `src/state/events.mjs:309-314`, `.fgos/events.lock` held past `EVENTS_LOCK_TIMEOUT_MS=2000` by another process) — this is a genuine systemic failure since the lock guards the one shared event log for every item, so it is NOT scoped to the one item that hit it, unlike (c) below; stop the whole loop and report, (c) a configurable iteration cap is reached. The loop does **NOT** stop on: an item parking `awaiting-human` (verified: `putInAwaiting`, `store.mjs:570-582`, moves `status` to `awaiting-human` on the very first park — the item leaves the `status:todo` pool immediately, so there is no risk of it being re-picked, unlike `merge-loop`'s own "blocked" case where the item's status never changes; the "same item parks twice" rule in `tsk-3go`'s original description was copied from `merge-loop` without verifying this and does not apply here), nor on a per-item CAS `conflict` (`FsmError('conflict', ...)`, `fsm.mjs:204-208` — a field-level check scoped to the one raced `id`, never evidence of a systemic problem, confirmed it cannot cascade to a different item). Both of those cases: skip the one item, log it, continue to the next. |
| D6 | `discover-loop` always prints an end-of-run summary (counts: N cleared/decomposed, N parked awaiting-human, N skipped/errored, N remaining if the cap was hit). |
| D7 | The loop never auto-chains past whatever stage/status the mechanical verb itself produced. Verified: `bin/fgos.mjs`'s `discover`/`decompose` cases (lines 883-916) just `return resolveDiscovery(...)`/`return resolveDecompose(...)` — no call into `dispatch`/`execute` anywhere in that path (confirmed by grep — 0 matches in `src/intake/discovery.mjs`/`decompose.mjs`). This differs from `fgos-runner`'s own `--watch` daemon (`src/runner/loop.mjs:970-1000`), which DOES chain its own clarify/decompose sweep straight into Execute-stage dispatch in the same run — that's a structurally different, always-running background process (`bin/fgos-runner.mjs`), not something this skill triggers or depends on. Advancing a cleared item into execution is `/fgOS:pick`'s job, out of scope here. |
| D8 | No worktree/branch/merge machinery needed for `discover-next` itself. `discover`/`decompose` never write to the git tree (0 `writeFileSync`/`fs.write` matches in `src/intake/discovery.mjs`/`decompose.mjs`); every state change resolves to `appendEvent` on the shared, lock-guarded `.fgos/events.jsonl` (`src/state/events.mjs`) — safe for concurrent callers (this loop, a human session, `fgos-runner`) by construction, without per-call isolation. |
| D9 (deferred, non-blocking) | Nice-to-have: call `/fgOS:terminal` each iteration to rename the herdr pane to the item currently being discovered, for live observability. Not required for the core shape; can ship without it. |

## Two independent judge layers (background, informs D1/D3 scope)

`judgeDiscovery` (stage `clarify`) and `judgeDecompose` (stage
`decompose`, separate verb) are two **independent** mechanical judges —
confirmed in `docs/reference/work-item-pipeline-stages-verbs-and-
handoffs.md:69-70` ("cùng 1 shape lặp lại ở cả `clarify` và `decompose`").
`discover`'s own `clear`/`unclear` verdict is decided synchronously inside
`resolveDiscovery` (`discovery.mjs:340-354`) — it never waits on
`decompose` to run. A `clear` verdict only means clarify-stage ambiguity
is resolved (`moveStage` to `decompose`, `discovery.mjs:340-348`); the
item can still independently park `awaiting-human` later at the
`decompose` stage, asking a completely different kind of question
(effort/blast-radius/split-shape, not product intent). This is why the
pool the loop scans (`stage in {clarify, decompose}, status:todo`) treats
both as separate, independently-resolvable item-states — no coupling
logic needed between them.

Also confirmed: children created by a `decompose`-split verdict are
created directly at `stage:executing` (`decompose.mjs:495`), and the
parent item itself also moves to `stage:executing` (`decompose.mjs:502`)
— neither re-enters the clarify/decompose pool, so a decompose split
never grows the loop's own workload.

## Persistence guarantee (no data lost across a park)

Verified: `addDiscovery`/`addDecision` are called **before** the
clear/unclear (or need-human/pass-through/decompose) branch in both
`discovery.mjs` and `decompose.mjs` — every park already has its
discovery entry / decision logged in state before `putInAwaiting` runs.
`answerAwaiting` (`store.mjs:596-600`) resumes to `gates[id].statusAtAsk`.
Live proof: `tsk-62d`'s own `discovery` array contains both the original
`clear:false` (question) entry and a later `clear:true` entry, plus its
`gates` record retaining both the `ask` and the human's `answer`
verbatim. Nothing needs to be added by this skill to preserve this —
it's already guaranteed by the engine.

## Scout evidence / canonical references

- `src/state/frontier.mjs:78-133` — `frontier()`, `compareReadyOrder`
- `src/state/store.mjs:355-621` — `moveWork`, `moveStage`, `putInAwaiting`, `answerAwaiting`
- `src/state/fsm.mjs:204-208` — `transitionWork` CAS conflict check
- `src/state/events.mjs:288-338` — `withEventsLock`, lock-timeout
- `src/state/priority-formula.mjs:63-81` — `computeImpact`, `computePriority`
- `src/state/graph-harness.mjs` — `rankImpact` (also used by `merge`'s `mergeReadiness`)
- `src/intake/discovery.mjs:66-69,285-356` — `blocksForItem`, `resolveDiscovery`
- `src/intake/plan.mjs:455-505` — `resolveDecompose` branches
- `src/runner/loop.mjs:970-1000` — `fgos-runner`'s own clarify/decompose sweep (contrast case, D7)
- `bin/fgos.mjs:883-916` — `discover`/`decompose` CLI cases
- `plugins/fgOS/skills/merge-loop/SKILL.md` — the shape being mirrored, and the stop-rule this design deliberately diverges from (D5)
- `docs/reference/work-item-pipeline-stages-verbs-and-handoffs.md:69-70` — two-judge-layer confirmation
- Prior research: `plans/reports/tsk-3go-discover-loop-260731-1510-stop-rule-and-worktree-question-report.md`, `plans/reports/internal-research-260802-0900-tsk-3go-discover-loop-frontier-stop-rule-runner-report.md`
- impact-analysis capability posture at time of writing: **full** (`gitnexus` MCP provider present, `fgos tool query --capability impact-analysis --status present`)

## Outstanding questions deferred to planning

- Exact default iteration cap number for `discover-loop` — implementer's
  call at `fgos-coding-planning`/shaping time.
- Exact shape of the new D1 backend function (single function with a
  `stage` param selecting D2 vs D3 ordering, vs two separate exported
  functions) — an implementation-detail choice, not a product decision.
