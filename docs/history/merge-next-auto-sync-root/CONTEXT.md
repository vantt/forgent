# CONTEXT: tsk-173 — merge-next silently skips blockedOnSync roots

## Feature boundary

`fgos merge next` (and by extension `/fgOS:merge-loop`, which calls it
repeatedly) only ever looks at `mergeReadiness()`'s `ready` bucket. An
`awaiting-approval` root whose own `fgw/<root-id>` branch has drifted ahead
of `main` (`needsSync: true` in `driftStatus()`) lands in `blockedOnSync`
instead, and `merge next` reports it as if nothing were pending at all
(`{picked: null, reason: 'nothing ready to merge'}`) — zero signal that a
real, resolvable block exists. Today the only way out is a human noticing
this by separately running `fgos merge list --json` and hand-invoking
`fgos sync-root <root-id>`.

This item's boundary: `merge next` gains a bounded, single-mutation
auto-remediation step for the CLEAN blockedOnSync case, folding the
existing `fgos sync-root` verb into its own flow instead of leaving it a
manual side-channel. It does **not** touch `merge list` (stays a pure
read, unchanged contract) and does not touch `approve`/`sync-root`
themselves — both are reused as-is.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | `merge next` auto-calls `fgos sync-root` on a blockedOnSync root when the sync comes back clean (`outcome: 'synced'`), then re-checks readiness and proceeds exactly as it does today. On any of `sync-root`'s existing failure outcomes — `merge-conflict`, Iron Law trip, `fgos-write-rejected`, `verify-fail` — it stops and reports the outcome plainly; it never attempts to push past any of those on its own authority. User picked this (Option B) over visibility-only (Option A) after reviewing `sync-root`'s real failure-mode surface (`bin/fgos.mjs:2719`) — auto-remediation only ever automates the already-safe, already-gated path; every genuinely risky outcome still stops for a human exactly as `approve`'s Iron Law path already does. |
| D2 | `merge next` stays a **single mutation per call** — matches the existing D6 contract ("merge next... no parallel merge mechanism", `docs/history/merge-standardization/CONTEXT.md`). When `blockedOnSync` holds more than one root, only the top-ranked one (same `rankImpact` order `ready` already uses) gets a `sync-root` attempt this call; the rest are left for the next call. Chosen over "try every blockedOnSync root in one call" specifically because `/fgOS:merge-loop` calls `merge next` unattended in a tight loop — one call, one real git mutation, stays true whether that mutation is an `approve` merge or a `sync-root` merge. |

## Pinned terms

- **blockedOnSync** — `mergeReadiness()`'s (`src/state/graph-harness.mjs:93`)
  bucket for an otherwise-candidate `awaiting-approval` item whose
  resolved root (`resolveRoot(view, item.id)`) shows `needsSync: true` in
  the supplied `driftStatus()` snapshot. Always empty unless a caller
  passes `opts.drift`.
- **needsSync** — `driftStatus()`'s (`src/state/drift-status.mjs:93`) own
  flag per root: `aheadOfTarget > 0 && !RESOLVED_STATUSES.has(rootItem.status)`.
  True whenever the root branch (`fgw/<root-id>`) carries commits not yet
  on its target (`main`, or `fgw/<parentId>` for a nested root) and the
  root item itself isn't yet delivered/retrospective/cleanup/done/wontfix.
- **sync-root** — the existing verb (`bin/fgos.mjs:2719`, built tsk-50i,
  delivered) that merges a root branch's current tip into its target
  WITHOUT changing the root item's own status/stage. Reuses
  `mergeRunnerItem`'s lock/verify/Iron-Law path — same gates `approve`
  already applies to a runner-sourced item.

## Scout evidence

- **Live repro, confirmed still current** (re-checked 2026-08-03, ~13min
  after first scout — no drift in the finding): `fgos merge list --json`
  → `blockedOnSync: ["tsk-5q5"]`, `ready: []`. `git rev-list --left-right
  --count main...fgw/tsk-5q5` → `570  9` (570 behind, 9 ahead) — matches
  the item's own description exactly.
- `src/state/graph-harness.mjs:93-125` — `mergeReadiness()`, the
  `blockedOnSync` computation.
- `src/state/drift-status.mjs:55-98` — `driftStatus()`, the `needsSync`
  computation, git-shelling (kept out of `graph-harness.mjs` deliberately
  per that file's own purity discipline).
- `bin/fgos.mjs:1484-1521` — the `merge` verb case (`list`/`next`
  sub-verbs); `next` only ever reads `mergeReadiness(...).ready`.
- `bin/fgos.mjs:2719-2815` — the `sync-root` verb, its full outcome shape
  (`synced` / `blocked: merge-conflict` / `blocked: fgos-write-rejected` /
  `blocked: verify-fail`).
- `plugins/fgOS/skills/merge-next/SKILL.md`,
  `plugins/fgOS/skills/merge-list/SKILL.md` — both relay only
  `ready`/`waiting`/`conflicts` from `mergeReadiness`'s return shape;
  neither mentions `blockedOnSync`, `mergeSets`, `mergeTier`, or
  `supersededOut` (grepped 2026-08-03, zero hits) — confirmed not touched
  since 2026-07-30 (unrelated Iron-Law evidence work), so this gap has
  not been separately patched.
- No competing work item found: full `fgos list --json` scan for any item
  whose title/description mentions `blockedOnSync`, `sync-root`, or
  `merge-next` visibility turned up only `tsk-173` itself.
- A prior decision in the log
  ("D3: no change needed in merge/next handler or merge-list/merge-next/
  merge-loop skill files", 2026-08-02T04:57:43Z) is **not** a conflicting
  precedent — its companion decision ("independent of merge-harness-v2's
  not-yet-built driftStatus/sync-root design") shows it predates
  `driftStatus`/`sync-root` existing at all (both landed later the same
  day, ~07:00-10:20). It was scoped to an unrelated `merge.mjs` fix, not
  this gap.
- `impact-analysis` capability posture: **full** — `fgos tool query
  --capability impact-analysis --status present` returns `gitnexus`
  (`present`). Planning/validating/executing should run real `impact()`
  calls on `mergeReadiness`, the `merge next` CLI case, and `sync-root`
  before editing any of them, per the repo's own gate.

## Canonical references

- `docs/history/tsk-3bn-merge-conductor-harness-v2/CONTEXT.md` — original
  design for drift-detection + sync-root + merge-set clustering.
- `docs/history/merge-standardization/CONTEXT.md` — D6, the "merge next:
  no parallel merge mechanism" contract this item's D2 extends.
- `docs/history/tsk-2ie-duplicate-superseded-guard/CONTEXT.md` — most
  recent prior extension of `mergeReadiness`'s return shape
  (`supersededOut`), same file this item's D1 also touches.

## Deferred to planning

- Exact outcome-shape `merge next` reports for the new auto-sync path
  (e.g. how a `sync-root` attempt nested inside `merge next`'s JSON
  differs from today's `{picked, approve}` / `{picked, blocked:
  'iron-law'}` shapes) — implementer's concern, not a product decision.
- How `/fgOS:merge-loop`'s existing stop-rules (frontier empty, Iron Law
  trip, same item blocked twice in a row) accommodate the new outcome —
  needs slotting into that skill's own stop-rule table, not designed here.
- Resolving which root id to pass to `sync-root` when the top-ranked
  blockedOnSync candidate is itself a leaf item (not the root) —
  mechanical (`resolveRoot(view, id)` already exists and is already used
  by `mergeReadiness` for this exact purpose), left to planning to wire
  rather than re-derived here.
- `verify` command for this item (currently unset, standard placeholder)
  — planning's job per this repo's own convention.
