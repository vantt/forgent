# Choke-Point Investigation: Claim + Worktree

**tsk-53f** | 2026-07-28 17:17 | stage: clarify

## Summary

Found **3 independent claim paths** and **6 createWorktree call sites** with no shared choke-point. Main-checkout-lock exists but NOT wired anywhere.

---

## Claim Paths (moveWork to 'doing')

| Path | File:Line | Actor | Creates Worktree? | Uses ownershipStore? | Acquires main-checkout-lock? |
|------|-----------|-------|-------------------|----------------------|------------------------------|
| CLI `take` | bin/fgos.mjs:1217,1226 | human/session | NO | NO | NO |
| CLI `pick` | bin/fgos.mjs:1287 | session | YES | NO | NO |
| Runner `claimItem` | loop.mjs:485 | runner | (later, in dispatch) | YES | NO |

**Gap #1**: CLI verbs bypass `ownershipStore` entirely — 2 sessions can `pick` same item simultaneously.

**Gap #2**: None acquire main-checkout-lock before writing to main's .fgos/events.jsonl.

---

## createWorktree Call Sites (6)

| Context | File:Line | baseRef | Ephemeral? | Error handling |
|---------|-----------|---------|------------|----------------|
| `pick` | bin/fgos.mjs:1302 | current HEAD (main) | NO | error surfaces as-is |
| `approve` (leaf merge) | bin/fgos.mjs:1721 | root branch | YES | removeWorktree in finally |
| `review` | bin/fgos.mjs:1954 | item branch | YES | removeWorktree in finally |
| Runner (legacy?) | loop.mjs:397 | ? | NO | removeWorktree in finally |
| Runner LEAF | loop.mjs:674 | root branch | NO | removeWorktree in finally |
| Runner ROOT | loop.mjs:676 | current HEAD | NO | removeWorktree in finally |

**Gap #3**: `pick` always forks from main HEAD even for LEAF items — ignores root branch. Runner does it correctly (line 674 uses `baseRef: branchNameFor(rootId)` for leaves).

**Gap #4**: Cleanup inconsistent — `pick` has no cleanup on error; runner/approve/review have finally blocks.

---

## main-checkout-lock Status

```
src/runner/main-checkout-lock.mjs  — DEFINED (acquireMainCheckoutLock, releaseMainCheckoutLock)
Imported by: NOTHING
Called by: NOTHING
```

Phase 2 "wire into git hook" never happened. The lock primitive exists but is dead code.

---

## Proposed Choke-Point Design

### Option A: Gom vào claim-port.mjs

Single module all claim flows go through:

```javascript
// src/runner/claim-port.mjs
export function claimWork(dir, { id, actor, isolate = true }) {
  // 1. Acquire main-checkout-lock
  // 2. ownershipStore check (even for CLI)
  // 3. moveWork to 'doing'
  // 4. If isolate: createWorktree with correct baseRef (leaf vs root)
  // 5. Release lock only AFTER worktree stands
  return { claim, worktree? };
}
```

Callers:
- `take` calls with `isolate: false`
- `pick` calls with `isolate: true`
- Runner calls with `isolate: true`

### Option B: Wire lock into git hooks (original Phase 2)

Add pre-commit hook that acquires main-checkout-lock, post-commit releases. Lower-level, blocks ALL git commits on main.

### Recommendation: Option A

- Explicit control over when isolation happens
- Fixes root-cause (claim logic scattered)
- Can still add hook guard later as defense-in-depth

---

## Immediate Fixes (Low-Hanging Fruit)

1. **pick uses wrong baseRef for leaves** — copy runner's leaf logic (line 674) into pick
2. **main-checkout-lock not wired** — import and call in claim-port.mjs
3. **take/pick bypass ownershipStore** — wrap in same claimRoot check

---

## Questions for Human

1. **Chọn Option A hay B?** (Recommend A)
2. **take nên tạo worktree không?** Current behavior: take = no worktree, pick = worktree. Keep or unify?
3. **Scope creep check**: tsk-1an (bootstrap .fgos copy) is separate concern — this investigation is about lock/choke-point, not store replication. Confirm separation?

---

## Files to Change (if Option A)

| File | Change |
|------|--------|
| `src/runner/claim-port.mjs` | NEW — choke-point module |
| `bin/fgos.mjs` (take) | Import claim-port, replace inline claim |
| `bin/fgos.mjs` (pick) | Import claim-port, replace inline claim |
| `src/runner/loop.mjs` (claimItem) | Import claim-port, replace inline claim |
| `src/runner/main-checkout-lock.mjs` | No change — already has primitives |

Estimated effort: **F2** (medium — new module + 3 callers)
