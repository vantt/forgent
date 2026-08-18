# work-item-status-delivered-retrospective-cleanup — locked decisions

Item: `tsk-1ca`. Source request (raw, untrusted per RUL45): "Nâng cấp bộ
status chuẩn manage lifecycle của workitem chuẩn (domain agnostic), thêm
delivered (đã merge), restrospective, cleanup (chổ này mới cleanup
worktree), done (xong hoàn toàn) chuẩn bị cho việc dời compound step vào
restrospective." Dep: `tsk-4op` (tách ship khỏi compound-learn — the
motivating complaint this item resolves structurally).

## Feature boundary

Today `done` is a single terminal status reached by two doors
(`doing->done`, `awaiting-approval->done`), gated by RUL50 (must have
passed the `compound-learn` *stage* — coding domain only) and RUL58
(acceptance-clause evidence, any domain). This conflates three distinct
concerns into one status: "code merged", "learning/doc synthesis done",
"worktree housekeeping done". `RUL12` (dependent-open) and 5 other
consumers only unblock on this single conflated `done`, so a slow doc-write
step delays every dependent even after the code itself is safely merged —
the concrete pain `tsk-4op` filed.

**In scope**: replace the single `done` gate with a sequential chain —
`delivered -> retrospective -> cleanup -> done` — that separates "merged"
(fast, unblocks dependents) from "learning synthesized" and "worktree
reclaimed" (slow, batched, never blocks dependents). Retire the
`compound-learn` *stage* entirely; its content becomes the `retrospective`
*status*'s job.

**Out of scope**: any change to the `stage` dimension other than removing
`compound-learn` (clarify/decompose/executing unaffected); any change to
`todo`/`doing`/`blocked`/`awaiting-human`/`wontfix` edges not touched below;
domain classification; exact TTL day-count value (global config exists,
value itself is a planning/build parameter).

## Pinned terms

- **`delivered`** — code is merged/accepted into main. The new, earlier,
  narrower meaning `done` always informally carried for dependent-opening
  purposes (`frontier.mjs`'s own comment: "'done' means 'accepted into the
  main tree'").
- **`retrospective`** — the (former) `compound-learn` synthesis work
  (settlement/decision/learning/enduser-docs via `fgos-coding-compounding`),
  reframed as a status, processed in batch by a dedicated loop — never
  inline in `return`/`approve`.
- **`cleanup`** — a TTL-bounded park state for worktree reclamation
  (`removeWorktree`/`removeDispatchWorktree`, `src/runner/worktree.mjs`),
  deliberately delayed (not synchronous with merge) so a post-merge
  incident can still reuse the worktree.
- **`done`** — administrative closure only, reached exactly once, after
  `cleanup`'s harness re-verifies the item is genuinely finished.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | New status `delivered` inserted before `done`, superseding the two old doors (`doing->done`, `awaiting-approval->done` become `doing->delivered`, `awaiting-approval->delivered`). `done` keeps exactly one door in (`cleanup->done`), zero out — terminal, unchanged in kind. Supersedes RUL4/D5's original two-door shape. Replaces the additive-marker approach `tsk-3p1` had proposed for the same underlying problem (`tsk-3p1` is now superseded by this item, not run in parallel). |
| D2 | Full new edge set (fsm.mjs): `doing->delivered`, `awaiting-approval->delivered`, `blocked->delivered` (new, mechanical retry, no `reason` — mirrors existing `blocked->awaiting-approval` fan-out-parallel D18 precedent), `delivered->retrospective` (new), `retrospective->cleanup` (new), `cleanup->done` (new), `cleanup->blocked` (new, `reason` required — mirrors existing `awaiting-approval->blocked`). Existing `blocked` exits (`->todo`, `->doing`, `->wontfix`) are unchanged and already cover "real rework needed" and "abandon after cleanup failure" — no further new edges needed there. |
| D3 | RUL58 (acceptance-clause evidence) gates **all three** doors into `delivered` (`doing->delivered`, `awaiting-approval->delivered`, `blocked->delivered`) — moved from its old `to==='done'` check, kept at entry so a dependent opening on `delivered` (D9) is exactly as protected as it was when `done` was the trigger. This is the corrected final placement — an earlier draft of this design had bundled RUL58 with RUL50-content onto `cleanup->done`, which was found to create a real gap (dependents could open on acceptance-unverified code) and was explicitly retracted. |
| D4 | RUL50-content (renamed: "has this item's retrospective+cleanup actually completed") gates `cleanup->done` only — this is administrative/learning-synthesis completeness, not code correctness, so it is correct for it to run *after* dependents have already opened (D9) — that deferral is the entire point of this item. |
| D5 | `delivered`/`retrospective`/`cleanup`/`done` are STATUS edges — universal, domain-agnostic (RUL35 preserved: `fsm.mjs` never reads `work.domain`). Every domain, including the illustrative/throwaway `synthetic` domain (single stage `assembling`, zero worktree, zero stage-transitions — `workflow-stage-graphs.mjs`), passes through the same edges. Domain-awareness (e.g. `synthetic` has no worktree to merge-verify) lives only in the harness/skill layer that runs checks before allowing a transition, never in the FSM table itself — same layering `RUL51`'s old `compound` verb precondition and `fgos-routing`'s domain->skill resolution already use. |
| D6 | Lazy-default, no backfill: work items already `done` before this feature existed keep their real history unchanged (never rewritten to claim they passed `delivered`/`retrospective`/`cleanup`). Matches the precedent set when `compound-learn` (stage) was introduced (RUL49) — old `done` items stayed at stage `executing`, no migration script ran (`tsk-u8w`'s own observation confirms this cohort split already exists in the live log). Different precedent than decision `0024` (status rename), which backfilled because it was a pure relabeling with zero behavior change — this item adds a genuinely new required step, so backfilling would fabricate history that never happened. |
| D7 | `cleanup` is a TTL park state, threshold configured **globally** (not per-item/per-domain — YAGNI, no demonstrated need yet). The TTL clock anchors to the specific `retrospective->cleanup` transition event's timestamp — mirror `graph-metrics.mjs`'s `classifyStaleDoing` precedent (`now - claimedAt`, `claimedAt` = the specific `todo->doing` event, never "latest event of any kind for this id") — an unrelated `decision`/`friction` logged on a parked item must never reset this clock. `removeWorktree`/`removeDispatchWorktree` no longer run synchronously at merge/return time; they run only after TTL elapses AND the `cleanup->done` harness (D8) passes. |
| D8 | `cleanup->done` is gated by a dedicated skill/harness (separate module, not folded into `return`/`compound`) that re-verifies, at the final gate: (1) the item's code is genuinely still merged on main — data source already exists (`headAtTake`/`headAtReturn`, RUL30, Data Dictionary #15/16), no new field needed; (2) `retrospective` actually produced real content (not just "status reached `cleanup`" — a crashed/partial retrospective run could transition without writing real output, so this is a content-level check, e.g. a genuine outcome/docType record exists), and D4's RUL50-content. On failure: `cleanup->blocked` (D2), never a silent stuck state. |
| D9 | `retrospective` is processed by a **separate loop**, run once per invocation, scanning every item currently at `delivered` — never inline in `return`/`approve`. `return`/`approve` now stop exactly at `delivered`. This is where the (former) `compound-learn` stage's synthesis work (settlement/decision/enduser-docs via `fgos-coding-compounding`) relocates. Batch-trigger threshold (N items / T time) for this loop is explicitly **not** decided here — deferred, matches the still-open item (2) on `tsk-4op`/`tsk-3o3`. |
| D10 | Order is strictly sequential: `delivered -> retrospective -> cleanup -> done` — never parallel branches. `cleanup->done`'s harness (D8) needs to read "did retrospective complete", which sequential ordering gives for free as a precondition of the prior edge. |
| D11 | Stage `compound-learn` is retired outright — **supersedes RUL49/RUL50/RUL51** (not just RUL50's gate-check; the stage itself, its edge `executing->compound-learn`, and the `compound` verb). The `fgos-coding-compounding` skill now triggers on status `retrospective` instead of stage `compound-learn`. Keeping both would be two mechanisms doing the same reflect/learning job on two different axes — accepted as redundant technical debt if not retired now. |
| D12 | Extending `retrospective` with a genuinely new kind of learning-action later reuses the two patterns already proven in this codebase — never a new status/stage per kind: (a) a new non-transitioning event type, fold-by-`id` (mirrors `addDecision`/`addFriction`), for a shape unlike anything existing; (b) a new value in an existing closed classification set (mirrors `DIATAXIS_DOC_TYPES`, `store.mjs:705`), for a variant of something already captured. Both cost ~0, touch no transition table, need no migration. |
| D13 | RUL12 fix: `frontier.mjs:160`'s `RESOLVED_STATUSES` set expands from `{done, wontfix}` to `{delivered, retrospective, cleanup, done, wontfix}` — one shared constant, fixing all 6 consumers at once (`frontier.mjs` depsReady + lineage/`hasOpenDescendant`, `claim-port.mjs`, `impact.mjs`, `graph-metrics.mjs`, `entropy.mjs`), all of which only care "does this item still affect CODE/graph state" — which nothing past `delivered` does. `fgos rollup` (progress reporting, "k/n done") is a separate module, does **not** share this constant, and is intentionally left counting strict `done` — no change required there. |
| D14 | No schema change needed for `outcome.actual.outcome`/`outcome.predicted.outcome` ("disposition") vocabulary — verified via `addOutcome` (`store.mjs:739`): the payload is appended raw, unvalidated against any enum. Decision `0024`'s shared-vocabulary warning applied to a specific historical string choice, not a schema constraint; nothing here needs to mirror the new status values into that field. |
| D15 | No RUL15-equivalent rule needed for `delivered`/`retrospective`/`cleanup` ("runner must never pick these"). Already structurally guaranteed: `frontier()` only ever considers `status==='todo'` items, and `fsm.mjs`'s transition table has no `X->doing` edge from any of the three — a `take`/`pick` attempt fails `precondition` automatically. |
| D16 | The dependent-opens-early tradeoff (a dependent may start work while its dep is only `delivered`, not yet fully `done`) does **not** introduce a new class of risk. The only thing that ever actually protected a dependent — RUL58 correctness evidence + the existing `return`-time dirty check (`headAtTake`) — still gates at exactly the same effective point (`delivered`, D3) it always gated at (old `done`). The new `cleanup->done` harness (D8) is strictly additive detection the old design never had at all (a post-merge revert on main was previously undetectable, forever); this item makes that case strictly safer, not riskier, than before. |

## Superseded

- `tsk-3p1` (additive marker, no new status/stage — proposed for the same
  underlying problem as D1) — superseded by this item's D1. Its own
  acceptance clauses (explore jointly with `tsk-38t`, don't decide a
  status-shape question twice) still apply in spirit: this item's design
  was in fact explored jointly against the same files (`src/state/store.mjs`,
  `src/state/frontier.mjs`).
- RUL49/RUL50/RUL51 (`compound-learn` stage, its entry edge, and the
  `compound` verb) — superseded by D11.
- The bundled "RUL58 travels with RUL50-content to `cleanup->done`" framing
  from an earlier point in this item's own decision log (seq 3481) —
  superseded by D3/D4's split (seq 3517).

## Deferred to planning (implementer concerns, not locked here)

- Idempotency of the `retrospective` loop's retry path: `addOutcome`/
  `addDecision` are additive-not-idempotent (RUL13/RUL11 "cộng thêm không
  đè") — a crash-and-retry on the same item risks duplicate records unless
  the loop's implementation adds its own dedup check.
- `workflow-stage-graphs.mjs`'s `DOMAINS` registry has no field today
  declaring whether a domain is worktree-backed (needs D8's real
  merge-verification) versus not (`synthetic`) — a new field (e.g.
  `worktreeBacked: boolean`) is needed before the `cleanup->done` harness
  can be domain-aware per D5.
- Exact TTL day-count for the global config (D7) — not chosen, a build
  parameter.
- CLI verb/command naming for the new transitions and the two new loops
  (retrospective-loop, cleanup-loop) — implementer's choice, consistent
  with existing verb-naming conventions (`fgos <verb> <id>`).
- Consumer audit checklist before code: enumerate every remaining literal
  `status === 'done'` read across the codebase beyond the 6 already fixed
  by D13 (frontier/claim-port/impact/graph-metrics/entropy) and D8's own
  harness — e.g. CLI display/triage-table columns, discovery-judge — per
  the same bar `tsk-38t` already set for itself.

## Scout evidence / references

Read in full during exploration (not re-cited inline per file, listed once
here): `src/state/fsm.mjs`, `src/state/stage.mjs`,
`src/state/workflow-stage-graphs.mjs`, `src/state/store.mjs` (`moveStage`,
`composeLearning`, `addOutcome`, `addDecision`, `assertValidDocType`/
`DIATAXIS_DOC_TYPES`), `src/state/frontier.mjs` (`RESOLVED_STATUSES`,
`depsReady`, `hasOpenDescendant`), `src/runner/worktree.mjs`
(`removeWorktree`/`removeDispatchWorktree`), `src/state/graph-metrics.mjs`
(`classifyStaleDoing`), `docs/specs/work-state.md` RUL4/RUL11/RUL12/RUL15/
RUL18/RUL21/RUL30/RUL35/RUL49/RUL50/RUL51/RUL58, `docs/decisions/0024-doi-
ten-status-proposed-thanh-awaiting-approval.md`, `.claude/skills/fgos-
routing/SKILL.md` (stage->skill table). Related backlog items:
`tsk-4op` (dep, motivating complaint), `tsk-3p1` (superseded), `tsk-38t`
(Phase 2 status-schema split, same files, not conflicting — orthogonal
axis: label vs statusCategory, untouched by this item).

**Impact-analysis capability gate** (per `CLAUDE.md`): `fgos tool query
--capability impact-analysis --status present` returned GitNexus
`present`. Informational only here — this skill edits no code, so the
gate's MUST-run-impact-before-editing rules don't apply to this stop; they
bind whoever implements D1-D16 in `fgos-coding-implement`.

## Outstanding, explicitly deferred

None left open at the decision-lock level — all three original gray areas
(RUL12 dependent-open timing, cleanup failure recovery path, compound-learn
stage's fate) are resolved (D13, D2/D8, D11). Everything remaining is
implementer-scoped (see "Deferred to planning" above).
