# fgos-cleanup-loop — locked decisions

Item: `tsk-dvc`. Source request (raw, untrusted per RUL45): "Thiết kế một
loop /fgOS:cleanup-loop, quét các item thỏa điều kiện để cleanup và thực
hiện cleanup." (Design a loop /fgOS:cleanup-loop, scan items that satisfy
the cleanup condition and perform cleanup.)

## Feature boundary

**In scope**: a new pair of skills — `fgOS:cleanup-next` (process the
single next TTL-ready `status:cleanup` item) and `fgOS:cleanup-loop`
(wraps the built-in `/loop` skill around `/fgOS:cleanup-next`, repeating
until a stop condition trips) — plus whatever pure-function pool-picker
`cleanup-next` needs to find that single next item without invoking the
existing `fgos cleanup <id>` verb on items that aren't actually ready yet.

**Out of scope**: any change to `fgos cleanup <id>` itself
(`bin/fgos.mjs`'s `case 'cleanup'`) or to `cleanup-harness.mjs`'s
`assessCleanupReadiness`/`checkCleanupTTLElapsed`/`checkRetrospectiveContent`/
`checkMergeStillResolves` — all four are reused exactly as they exist
today. No FSM edge changes (`delivered`/`retrospective`/`cleanup`/`done`
and their edges are already locked by
`work-item-status-delivered-retrospective-cleanup`, D2/D5). No change to
the `retrospective` verb's own batch-sweep shape (it already processes
every `delivered` item in one call — it was never a "next"/"loop" pair to
begin with, and this item does not touch it).

## Why a naive loop doesn't work

`fgos cleanup <id>` (`bin/fgos.mjs:969-1011`) requires the target already
be at `status:cleanup`, then runs `assessCleanupReadiness` (TTL elapsed +
retrospective content exists +, for worktree-backed domains, merge still
resolves on main). **Any** failing check — including "TTL not elapsed
yet" — moves the item straight to `cleanup -> blocked` with the failing
reasons joined as `reason` (`bin/fgos.mjs:995-999`). A loop that blindly
calls this verb on every `status:cleanup` item, once per pass, would
immediately block every item still waiting out its TTL — real,
unnecessary state churn (a `blocked` park plus its `blocked -> delivered`
recovery, which restarts the TTL clock per D7 of the parent feature,
since the clock anchors to the latest `retrospective -> cleanup`
transition). The picker this item adds exists specifically to avoid that:
it must never let `cleanup-next` invoke the verb on an item whose TTL
hasn't elapsed.

## Pinned terms

- **pool** — the set of work items currently at `status:cleanup`, mirroring
  how `fgos-coding-exploring`'s sibling feature already uses "pool" for
  `stage:clarify`/`stage:decompose` items (`discover-pool.mjs`).
- **TTL-ready** — a `status:cleanup` item whose `checkCleanupTTLElapsed`
  (`src/state/cleanup-harness.mjs:97-112`) already returns `ok: true` —
  i.e. calling `fgos cleanup <id>` on it will not park it `blocked` purely
  for not having waited long enough.
- **candidate** — a `status:cleanup`, TTL-ready item, before the other two
  harness checks (content, merge-still-resolves) have been evaluated by the
  verb itself.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | The pool-picker orders TTL-ready candidates FIFO by the item's most recent `retrospective -> cleanup` transition timestamp (oldest first) — the same event `checkCleanupTTLElapsed` already reads (`rawEvents` filtered to `work.move` with `payload.to === 'cleanup'`, `.at(-1)`). No new ranking field, no priority/tier weighting — cleanup is housekeeping, not merge-readiness; FIFO avoids starvation with zero new state. |
| D2 | When `cleanup-next` calls `fgos cleanup <id>` on a TTL-ready candidate and the verb still parks it `blocked` (because `checkRetrospectiveContent` or `checkMergeStillResolves` failed — the other two `assessCleanupReadiness` checks, not TTL), `cleanup-loop` treats this as scoped to that one item: skip it and continue to the next candidate, never stop the whole loop. Mirrors `discover-loop`'s handling of a per-item CAS conflict — a real problem, but not a systemic one, and the item stays visibly parked `blocked` for a person to pick up later. |
| D3 | `cleanup-loop` has no fixed iteration cap. It runs until the pool is empty, a lock-timeout is hit, or (per D2) it has skipped every currently-blocked candidate and nothing TTL-ready remains — mirroring `merge-loop`'s uncapped shape (`docs/history/merge-loop-skill`), not `discover-loop`'s capped-at-15 shape. Rationale: each `cleanup-next` iteration is a deterministic mechanical check (TTL/content/merge-ancestry) plus a real but bounded git cleanup — it carries no LLM-judgment cost, which is the reason `discover-loop` needed a cap in the first place (`judgeDiscovery`/`judgeDecompose` calls, real per-call cost that scales with backlog size). |

## Scout evidence

- `bin/fgos.mjs:969-1011` (`case 'cleanup'`) — the existing per-id verb,
  reused unchanged; confirms the "any failing check -> blocked" behavior
  D1-D3 above are designed around.
- `src/state/cleanup-harness.mjs` (full file, incl. its own header
  comment) — `assessCleanupReadiness`'s three independent checks and their
  exported building blocks (`checkCleanupTTLElapsed`,
  `checkRetrospectiveContent`, `checkMergeStillResolves`), all reused
  as-is by the new picker/verb calls this item adds.
- `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
  — the parent feature's locked decisions (D2 edges, D7 TTL-clock
  anchoring, D8 harness gating). Its own "Deferred to planning" section
  explicitly left "CLI verb/command naming for the new transitions and
  the two new loops (retrospective-loop, cleanup-loop) — implementer's
  choice" — this item is that deferred choice for `cleanup-loop`
  specifically (`retrospective` turned out not to need a loop at all —
  its verb already batch-sweeps every `delivered` item in one call, per
  D9 of that same doc).
- `plugins/fgOS/skills/discover-next/SKILL.md`,
  `plugins/fgOS/skills/discover-loop/SKILL.md`,
  `src/state/discover-pool.mjs` (referenced, not yet re-read line-by-line
  at this stage) — the closest existing analog: a bare per-id CLI verb
  with no built-in ranking, wrapped by a skill-level pool-picker
  (`pickNextDiscoverItem`) and a `-next`/`-loop` skill pair. Chosen over
  `merge-loop`/`merge-next` as the template because merge already had a
  CLI-level ranked "next" (`fgos merge next`, `mergeReadiness` in
  `src/state/graph-harness.mjs`) before its loop was built — cleanup has
  no such CLI-level picker yet, same starting point discover was in.
- `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md` —
  confirms the loop mechanism to recurse into is the built-in `loop`
  skill (dynamic self-pacing, no config), never `ck-loop` (a
  mechanical-metric optimization loop with an unrelated
  Goal/Scope/Verify-number/Guard contract). `cleanup-loop` has no metric
  to optimize, so it follows the same precedent.
- Impact-analysis capability gate (per `CLAUDE.md`): `fgos tool query
  --capability impact-analysis --status present` returned GitNexus
  `present` → posture is **full**. Informational only at this stage —
  this skill edits no code — binding on `fgos-coding-implement` once this item
  reaches that stage.

## Deferred to planning (implementer concerns, not locked here)

- Exact new source module path/name for the pool-picker (e.g.
  `src/state/cleanup-pool.mjs`, `pickNextCleanupItem`) and its test file.
- Whether `cleanup-next` is a genuinely separate skill file or the pool-
  picker call is folded directly into `cleanup-loop`'s own steps — this
  item's boundary above names both by convention (matching the
  discover-next/discover-loop precedent) but the actual file split is
  planning's shaping call, not locked here.
- Exact CLI invocation shape the picker uses to read `.fgos/` state (a
  `node -e` inline script à la `discover-next`'s step 2, vs. a small
  dedicated verb) — implementer's choice, consistent with existing
  verb-naming/invocation conventions.
- Whether `cleanup-loop`'s final report needs to surface a count of
  "waiting" (not-yet-TTL-ready) candidates left in the pool, beyond just
  the stop reason — a reasonable nice-to-have, not required by any locked
  decision above.
- Test coverage shape for the new picker (unit tests mirroring
  `discover-pool.mjs`'s own test file, if one exists) and for the two new
  skill files (skills are markdown + a Bash walkthrough, not unit-testable
  the same way — planning decides what "verified" means for this item's
  acceptance clause).

## Outstanding, explicitly deferred

None left open at the decision-lock level — the three original gray areas
(pick order among simultaneous TTL-ready candidates, what to do on a
post-TTL harness block, whether the loop needs an iteration cap) are
resolved by D1/D2/D3. Everything remaining is implementer-scoped (see
"Deferred to planning" above).
