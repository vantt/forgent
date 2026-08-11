# TTL leaf-aware cleanup — CONTEXT (`tsk-59x`)

`tsk-59x` · tier `light` · risk `light` · kind `chore` · stage `clarify` ·
`docsRef` = `docs/history/execution-fanout/` (shared feature dir with
sibling items `tsk-umc`/`tsk-4fg`; this file scopes `tsk-59x`'s own
decisions only) · `refs` = `docs/history/execution-fanout/DISCUSSION.md#design`
· `verify` = `node --test test/state/cleanup-harness.test.mjs && npm test`

**Mandatory pre-read** (per the item's own text, honored before any
decision below): `docs/history/work-item-status-delivered-retrospective-
cleanup/CONTEXT.md` — D7 there made the cleanup TTL global-only,
explicitly flagged `YAGNI — no demonstrated need yet`. This item supplies
that missing evidence and supersedes D7's global-only premise for the
leaf/root axis specifically (per `review-audit-self-decision`: reversing a
verified decision is legitimate when new evidence justifies it, and D7's
own text names exactly the evidence bar this item clears).

## Ranh giới tính năng

**Trong phạm vi:** a leaf work item (`parent` set, `resolveRoot(view, id)
!== id`) gets `ttlDays = 0` at the `cleanup` status instead of the global
default — reaching every consumer that actually GATES or PICKS cleanup
work: `bin/fgos.mjs`'s `case 'cleanup'` (→ `assessCleanupReadiness` →
`checkCleanupTTLElapsed`) and `pickNextCleanupItem`
(`src/state/cleanup-pool.mjs`, the picker behind `/fgOS:cleanup-next`/
`/fgOS:cleanup-loop`). Root items are completely unaffected — they keep
the existing global `cleanup.ttlDays` default (7 days) exactly as before.

**Ngoài phạm vi, deferred:**
- `fgos stale`'s `postDelivery` advisory (`classifyStalePostDelivery`,
  `src/state/graph-metrics.mjs`) — informational only, never gates or
  reclaims anything itself; stays on root's TTL for now (D2).
- Exact TTL day-count for the ROOT default — untouched, already decided
  (7 days, unchanged from before this item).
- Any change to the `delivered`/`retrospective`/`cleanup`/`done` FSM edges
  themselves, or to D8's two other gate checks (retrospective content,
  merge-still-resolves) — this item only changes which `ttlDays` value
  feeds the existing TTL precondition, never the checks around it.

## Quyết định đã khoá

| D-ID | Quyết định | seq |
|---|---|---|
| **D1** | Leaf items get `ttlDays = 0` (immediate, once D8's other checks pass) at `cleanup`. Root items keep the existing global 7-day default unchanged. | 9151 |
| **D2** | Leaf-aware TTL must reach `pickNextCleanupItem` (`src/state/cleanup-pool.mjs`), not just the direct gate in `bin/fgos.mjs`'s `case 'cleanup'` — widens footprint beyond what the item originally declared. The `fgos stale --postDelivery` advisory (`src/state/graph-metrics.mjs`) stays out of scope, deferred. | 9154 |

## Thuật ngữ đã ghim

Reuses the pinned terms already locked upstream — **lá / leaf**, **case 1**
(same-root split) — from `docs/history/execution-fanout/DISCUSSION.md` and
`docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`'s
own **`cleanup`** term (TTL-bounded park state for worktree reclamation).
No new term needed for this item.

## Bằng chứng scout

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` returns gitnexus `present`, but this session's own Bash
hooks repeatedly surfaced `GitNexus index is stale (last indexed:
251d0b5)` against current HEAD throughout this session. Per `CLAUDE.md`'s
three-way gate, `present` but flagged stale is degraded. Informational
only here — this skill edits no code; the MUST-run-impact rule binds
`fgos-coding-implement`, not this stop.

- `src/setup/registrations.mjs:540-551` — `DEFAULT_CLEANUP_TTL_DAYS = 7`,
  registered as global config `cleanup.ttlDays`, with the exact D7 comment
  this item's own boundary supersedes.
- `src/state/cleanup-harness.mjs:182-197` (`checkCleanupTTLElapsed`) —
  takes a flat `ttlDays` number, no `view`/leaf-awareness of its own;
  `:100-141` (`checkMergeStillResolves`) already resolves a leaf's target
  ref to `fgw/<rootId>` via `resolveRoot` (imported from
  `../runner/root-affinity.mjs`) — the precedent this item's own
  leaf-detection should reuse, not re-derive.
- `bin/fgos.mjs:1166-1206` (`case 'cleanup'`) — the real gate, reads
  `sharedConfig?.cleanup?.ttlDays ?? DEFAULT_CLEANUP_TTL_DAYS` as one flat
  value for every item regardless of leaf/root.
- `src/state/cleanup-pool.mjs:37-45` (`pickNextCleanupItem`) — a second,
  independent consumer of the same flat `ttlDays`, behind
  `/fgOS:cleanup-next`/`/fgOS:cleanup-loop`; this is the picker whose
  0/99-elapsed symptom the item's own description names directly, so D2
  treats fixing it as forced by the item's own stated motivation, not an
  optional widening.
- `bin/fgos.mjs:1738-1750` (`case 'stale'`) → `stalePostDeliveryAdvisory`
  (`src/state/store.mjs:1070`) → `classifyStalePostDelivery`
  (`src/state/graph-metrics.mjs:534-558`) — the third consumer, confirmed
  read-only/advisory-only (own code comment: "This advisory never cleans
  up"), which is why D2 defers it rather than folding it in.
- `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
  D7 — the exact decision this item's D1 supersedes, with the item's own
  description directly supplying the "demonstrated need" D7 said was
  missing.

## Tham chiếu chuẩn

- `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
  (D7, mandatory pre-read) and `plan.md`
- `docs/history/execution-fanout/DISCUSSION.md` §3 rows 31/32/34/35/37/40,
  §5 round 4-5
- `src/state/cleanup-harness.mjs`, `src/state/cleanup-pool.mjs`,
  `src/setup/registrations.mjs`, `bin/fgos.mjs` (`case 'cleanup'`,
  `case 'stale'`)

## Câu để lại cho planning

- Exact config field name for the leaf TTL default (e.g.
  `cleanup.leafTtlDays`, following the same `registerConfigDefault`
  pattern `cleanup.ttlDays` already uses) — implementer's choice, not a
  product decision.
- Exact call-site shape for threading leaf/root detection into
  `checkCleanupTTLElapsed`'s three callers (whether the function itself
  gains a `view`/leaf-detection parameter, or each caller resolves the
  right `ttlDays` value before calling) — implementer's choice.
- Whether `resolveRoot(view, id) !== id` or a plain `work[id].parent`
  truthiness check is the right leaf test — both are equivalent under the
  current one-level-only parent model; planning should confirm no deeper
  nesting exists before picking one, the same caveat `tsk-4fg`'s own
  planning stage already flagged for this same one-level assumption.
