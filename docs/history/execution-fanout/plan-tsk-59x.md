# TTL leaf-aware cleanup — plan (`tsk-59x`)

Mode: standard

Flags counted (per `fgos-routing`'s Mode gate): **existing covered
behavior** (`test/state/cleanup-harness.test.mjs`, 24 existing tests, plus
a separate `test/state/cleanup-pool.test.mjs` — both touched) and **weak
proof around the area** (`impact-analysis: degraded` — GitNexus `present`
but this session's own hooks repeatedly flagged its index stale against
current HEAD). 2 flags → **standard** lane. No auth/authorization/
data-model/audit-security/external-systems/public-contracts/
cross-platform/multi-domain flags apply.

`CONTEXT.md` for this item: `docs/history/execution-fanout/CONTEXT-tsk-59x.md`
(D1, D2).

## Approach

`resolveRoot(view, id)` (`src/runner/root-affinity.mjs:66-78`) already
walks `parent` links and returns `id` itself when there is no parent OR the
parent record is missing from `view.work` (dangling parent treated as
root) — reused directly for leaf detection rather than a fresh
`item.parent` truthy check, matching `checkMergeStillResolves`'s own
existing precedent (same file, same helper, same file).

1. **`src/setup/registrations.mjs`** — add `DEFAULT_CLEANUP_LEAF_TTL_DAYS
   = 0` next to the existing `DEFAULT_CLEANUP_TTL_DAYS = 7` (line 545),
   extend the `cleanup` config default's `shape` to `{ ttlDays:
   DEFAULT_CLEANUP_TTL_DAYS, leafTtlDays: DEFAULT_CLEANUP_LEAF_TTL_DAYS }`
   (D1). Same `registerConfigDefault` pattern the existing `ttlDays` entry
   already uses — doctor/setup pick this up automatically, no new
   registration mechanism.

2. **`src/state/cleanup-harness.mjs`** — add one new pure exported helper:

   ```js
   export function resolveTtlDaysForItem(view, id, { ttlDays, leafTtlDays }) {
     const isLeaf = resolveRoot(view, id) !== id;
     return isLeaf ? leafTtlDays : ttlDays;
   }
   ```

   (new import: `resolveRoot` from `../runner/root-affinity.mjs`, mirroring
   `checkMergeStillResolves`'s own existing import in this same file).
   `assessCleanupReadiness`'s signature gains one new optional field,
   `leafTtlDays` (destructured alongside the existing `ttlDays`) — when
   supplied, it calls `resolveTtlDaysForItem(view, id, {ttlDays,
   leafTtlDays})` and passes the RESULT to `checkCleanupTTLElapsed` instead
   of the raw `ttlDays` it passes today (`cleanup-harness.mjs:218`). When
   `leafTtlDays` is omitted, behavior is byte-identical to today (falls
   through to plain `ttlDays` for every item, root or leaf) — this keeps
   every other caller/test of `assessCleanupReadiness` that doesn't pass
   the new field completely unaffected (D2's own "root items keep the
   existing global 7-day default unchanged" holds structurally, not just
   by value).

3. **`src/state/cleanup-pool.mjs`** — `pickNextCleanupItem` already
   receives `view` and iterates `work[id]` per candidate; add the same
   `leafTtlDays` option, resolve per-item via the same
   `resolveTtlDaysForItem` helper before each `checkCleanupTTLElapsed`
   call (line 43), same omit-for-byte-identical-fallback shape as step 2.

4. **`bin/fgos.mjs`** — `case 'cleanup'` (line ~1181) reads
   `sharedConfig?.cleanup?.leafTtlDays ?? DEFAULT_CLEANUP_LEAF_TTL_DAYS`
   alongside the existing `ttlDays` read, passes both into
   `assessCleanupReadiness`. The `case 'stale'` call site (line ~1747)
   is explicitly left untouched — D2, deferred, still calls
   `stalePostDeliveryAdvisory`/`classifyStalePostDelivery` with only
   `ttlDays`, same as today.

5. **`plugins/fgOS/skills/cleanup-next/SKILL.md`** (found at
   `fgos-coding-validating` via `grep -rn "pickNextCleanupItem(" bin src plugins
   .claude` — the plan's own risk-map row anticipating this): the ONLY
   real caller of `pickNextCleanupItem`, an inline `node -e` script
   (lines 39-54) that reads `ttlDays` the same way `bin/fgos.mjs`'s
   `case 'cleanup'` does and calls `pickNextCleanupItem(view, rawEvents,
   { ttlDays })`. Add the same `leafTtlDays` read (importing
   `DEFAULT_CLEANUP_LEAF_TTL_DAYS` alongside the existing
   `DEFAULT_CLEANUP_TTL_DAYS` import) and pass it through:
   `pickNextCleanupItem(view, rawEvents, { ttlDays, leafTtlDays })`. This
   is a skill-prose path (`plugins/fgOS/skills/**/SKILL.md`) — per
   `docs/how-to/write-verify-for-a-skill-prose-change.md`, the edit here
   is a literal embedded script (deterministic, not LLM-interpreted
   prose), so a grep-based POSITIVE/NEGATIVE pair is sufficient proof,
   folded into the item's own verify command (below) rather than a
   separate smoke-test doc — this is a small supporting edit within a
   feature item, not itself a dedicated skill-behavior-change item.

**Rejected alternative:** changing `checkCleanupTTLElapsed`'s own
signature to take `view` directly, resolving leaf-ness internally.
Rejected because `checkCleanupTTLElapsed` is a lower-level primitive
(rawEvents + id only) reused for a specific timestamp-math job — folding
view-walking into it would give it two responsibilities instead of one,
and its own callers already have `view` in scope at the point they call
it (both `assessCleanupReadiness` and `pickNextCleanupItem`), so resolving
one level up costs nothing extra and keeps `checkCleanupTTLElapsed` itself
untouched (zero risk to its own 24 existing tests).

## Risk map

| Component | Risk | Proof point (→ `fgos-coding-validating`) |
|---|---|---|
| Leaf detection correctness | medium — must never misclassify a root as a leaf (would prematurely reclaim a root's own worktree while it's still the live merge target for other leaves) | new test: a root item (no `parent`) with `resolveTtlDaysForItem` called still resolves to `ttlDays` (root value), never `leafTtlDays`, even when passed alongside sibling leaf items |
| Root path stays byte-identical when `leafTtlDays` omitted | medium — this is the one flagged regression risk against 24 existing tests | run existing `test/state/cleanup-harness.test.mjs` + `test/state/cleanup-pool.test.mjs` suites unmodified against the new code — every existing call site that never passes `leafTtlDays` must still pass exactly as before |
| `pickNextCleanupItem`'s other real callers exist beyond what this plan enumerated | medium — `/fgOS:cleanup-next`/`/fgOS:cleanup-loop`'s exact call site wasn't read during this planning pass | `fgos-coding-validating`: grep `pickNextCleanupItem(` across the repo and confirm every call site either gets `leafTtlDays` threaded or is a test fixture that doesn't need it |
| Dangling-parent edge case (`resolveRoot` treats a missing-parent-record item as root) | low — matches existing `checkMergeStillResolves` behavior already in this same file, not a new risk this item introduces | none needed beyond the existing precedent already covering it |

## Files touched

- `src/setup/registrations.mjs` — new `DEFAULT_CLEANUP_LEAF_TTL_DAYS`,
  extended `cleanup` config shape
- `src/state/cleanup-harness.mjs` — new `resolveTtlDaysForItem` export,
  `assessCleanupReadiness` gains optional `leafTtlDays`
- `src/state/cleanup-pool.mjs` — `pickNextCleanupItem` gains optional
  `leafTtlDays`
- `bin/fgos.mjs` — `case 'cleanup'` reads and threads `leafTtlDays`
- `plugins/fgOS/skills/cleanup-next/SKILL.md` — its own inline script
  threads `leafTtlDays` through to `pickNextCleanupItem` (found at
  `fgos-coding-validating`, confirmed the only real caller)
- `test/state/cleanup-harness.test.mjs`, `test/state/cleanup-pool.test.mjs`
  — new cases per risk map above

## Verify (revised at `fgos-coding-validating`)

```
node --test test/state/cleanup-harness.test.mjs && npm test && grep -q "leafTtlDays" plugins/fgOS/skills/cleanup-next/SKILL.md && ! grep -q "pickNextCleanupItem(view, rawEvents, { ttlDays })" plugins/fgOS/skills/cleanup-next/SKILL.md
```

The two grep clauses are the POSITIVE/NEGATIVE pair
`write-verify-for-a-skill-prose-change.md` requires for any item touching
a `plugins/fgOS/skills/**/SKILL.md` path: POSITIVE proves the new
`leafTtlDays` threading landed in the skill's own script; NEGATIVE proves
the old ttlDays-only call signature is gone (not just added alongside it).
The original verify (`node --test ... && npm test`) already existed and
covers every `.mjs` file above; this revision only adds the two grep
clauses for the newly-found `SKILL.md` file.

## Assumptions

- One-level-only parent nesting (no grandchildren) — same caveat
  `tsk-4fg`'s own planning stage flagged for this repo's current `.fgos`
  state; `resolveRoot`'s own walk already handles arbitrary depth
  correctly regardless, so this assumption only affects whether a deeper
  test case is worth writing, not correctness.
- `leafTtlDays` config field name is this plan's own choice (`CONTEXT.md`
  left it to planning) — picked to mirror `ttlDays` exactly, same prefix
  convention.

## Split decision

No split. One cohesive change across 4 files + 2 test files, all
implementing the same single `resolveTtlDaysForItem` primitive threaded
through its 2-3 call sites — `fgos graph --json` shows this item as an
isolated 1-node component (no deps), and no risk-map row is large enough
to warrant its own item.
