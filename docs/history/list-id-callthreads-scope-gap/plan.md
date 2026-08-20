# plan — tsk-5dnt: scope `callThreads` in `fgos list --id`'s singleView

Mode: small (0-1 flags: only "existing covered behavior" applies — the
existing scoping test in `test/cli/fgos-read.test.mjs` needs a matching
assertion added for this new section; no auth/authorization/data-model/
audit-security/external-system/public-contract/cross-platform/weak-proof/
multi-domain flag applies). No CONTEXT.md/`exploring` round happened —
discovery verdict was `clear`, confirmed in `RESEARCH.md` round 1.

## Approach

**Chosen path:** add `callThreads: scopedById(rawView.callThreads)` to the
`singleView` object literal in `bin/fgos.mjs`'s `list --id` handler
(currently lines 2246-2257), immediately alongside the seven other
sections that already use the exact same `scopedById` helper (`discovery`,
`gates`, `settlements`, `outcomes`, `frictions`, `learnings`,
`decisionsById`). This is a same-shape, same-pattern addition — `RESEARCH.md`
round 1 confirmed `callThreads` is id-keyed (`{[id]: CallThreadEntry[]}`,
built in `src/state/replay.mjs:478-530`), identical to the other seven
sections' shape, so `scopedById`'s existing implementation
(`section?.[id] !== undefined ? {[id]: section[id]} : {}`, line 2245)
needs no adaptation.

**Alternatives rejected:**
- Migrating `list --id` callers to the `show` verb instead (`show` is
  already correctly scoped, never includes `callThreads`) — rejected: the
  two verbs' JSON shapes are genuinely different (`show`'s fields are
  de-keyed, e.g. `data.discovery` IS the item's own array; `list --id`'s
  stay id-keyed dicts, e.g. `data.discovery[id]`), so migrating would
  require rewriting every coding-domain skill's existing access pattern
  (`fgos-coding-discovering/SKILL.md` step 1 reads `view.discovery[id]`
  today) — a much larger, riskier change than this item's own scope.
  Noted in the item's own description as a possible separate follow-up,
  not part of this plan.
- Scoping the multi-item/paginated path's `scopeSideLogsTo` (line
  2212-2222, which also omits `callThreads`) in the same pass — rejected
  as out of this item's own stated scope (the item's description and
  discovery round both name only the `list --id` singleView path).
  Flagged below as a real, separate follow-up rather than silently folded
  in or silently dropped.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `bin/fgos.mjs` singleView object (line ~2246) | light — one-line addition mirroring 7 existing identical lines, same helper, same shape, no new code path | New assertion in the existing `test/cli/fgos-read.test.mjs` scoping test (see Shape below); zero consumers of `callThreads` from a `list --id` response exist today (`RESEARCH.md` round 1, grep-confirmed across `.agents/skills` and `domains/`), so no behavior regression is possible for any known caller |

No proof point needs blast-radius evidence beyond the direct grep
cross-check already run (`RESEARCH.md` round 1) — `fgos tool query
--capability impact-analysis --status present` confirms GitNexus is
`present` on this machine (posture: full), but the enclosing function
(`runVerb`, a ~2000-line verb dispatcher) is a hub symbol whose call-graph
fan-in would not add signal beyond the grep-confirmed zero-consumer
finding already recorded — the real evidence for this specific field is
the direct read of every id-keyed-section reader plus the exhaustive
`callThreads` consumer grep, both already done.

`fgos graph --json`: `tsk-5dnt` is not on the critical path
(`criticalPath.path` does not include it) and `topUnblock` is empty —
confirms this item has no dependency-ordering interaction with the rest
of the open backlog; files/order below are decided purely by the fix's
own shape, not by unblock priority.

**Files touched, in order:**
1. `test/cli/fgos-read.test.mjs` — extend the existing `'list --id scopes
   every id-keyed view section...'` test (tsk-2u9 D1/D2, ~line 300) with a
   `callThreads` case: seed `callThreads` for two items via
   `recordCall(dir, { id, toRole: 'researcher', reason: 'consult',
   outcome: '...' })` (the same `store.mjs` helper
   `test/cli/fgos-handoff.test.mjs` already uses to seed `callThreads` in
   its own fixtures), then assert `data.callThreads` from a `list --id
   item-a --json` call contains only `item-a`'s own key, never
   `item-b`'s. Write this first (it fails against current code — the
   whole leak this item exists to close) so the fix in step 2 is proven
   by a red-to-green transition, not just eyeballed.
2. `bin/fgos.mjs` (~line 2246-2257) — add the one line:
   `callThreads: scopedById(rawView.callThreads),` to `singleView`,
   alongside the other seven `scopedById(...)` lines.

## Shape

One honest piece, pass-through (no split — see below). The fix is exactly
as small as it looks: one object-literal line, proven by one extended
existing test. No phased plan needed at this lane.

Cases to prove (folded into the single extended test in step 1 above):
- **The leak case (regression guard):** with two items and `callThreads`
  populated for both, `list --id item-a --json`'s `data.callThreads` must
  contain `item-a` only, never `item-b`.
- **The empty case:** an item with no `callThreads` entries at all —
  `data.callThreads` must read `{}` (via the existing `scopedById`
  helper's `section?.[id] !== undefined ? {...} : {}` fallback), not
  `undefined` and not the whole unscoped section.

## Decide the split

No split. This is one honest, self-contained piece — a single-line fix in
one file, proven by one test file's own extended case. No independent
sub-pieces exist to carve out.

## Leave execution alone

The one command that proves this piece done — synced onto the item's own
`work.verify` (replacing the prose placeholder the discovery round left
there, which was never meant to be executed literally):

```
node --test --test-name-pattern="list --id scopes every id-keyed view section" test/cli/fgos-read.test.mjs
```

This runs the one extended test (step 1) which fails red against current
`bin/fgos.mjs` and passes green once the one-line fix (step 2) lands.
Broader confidence (`npm test`) is Execute's own call, not mandated here.

## Follow-up (not in this item's scope)

`scopeSideLogsTo` (`bin/fgos.mjs:2212-2222`, the multi-item/paginated
`list --all`/default path) also omits `callThreads` from its own section
list, the same gap pattern as `singleView`. Confirmed via direct read
during Approach above — not part of this item's stated fix target (the
item's own description and the discovery round both scope this to `list
--id` only), and out of scope to fold in silently. Worth a follow-up
submission if the same leak matters for the multi-item path (lower
severity there since the multi-item path already returns a large, mixed
response by design).

## Outstanding questions

None
