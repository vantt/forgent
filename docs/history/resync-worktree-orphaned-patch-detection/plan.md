# Plan: tsk-jg4 — resyncWorktree crash-window orphaned patch detection

Mode: **small** (0-1 risk flags: no auth/authz/data-model/audit/external-
system/cross-platform impact; one function gains a defensive pre-check,
happy path unchanged). Evidence: `RESEARCH.md` Round 1.

## Approach

Scope locked to the item's own "at minimum" floor (`RESEARCH.md` Round 1):
detect a pre-existing orphaned patch for this branch and refuse loudly,
using the same `WorktreeError` shape the sibling real-conflict path
already uses (`src/runner/worktree.mjs:780-784`) — not a new mechanism,
the existing "patch file on disk = actionable signal" idea, just checked
proactively instead of only encountered reactively. Option B (a distinct
before/after state marker) is out of scope for this item — a genuine
further design question the item's own phrasing frames as optional
("might"), not required to close the described hazard (silent stranding).

### Files touched

- `src/runner/worktree.mjs` — `resyncWorktree` (`~711-788`): at the very
  top, before `lastSyncedCommit` is even read, resolve `gitCommonDir` and
  `patchDir` (currently computed later, at step 1 — hoist that
  computation earlier since this check needs it first) and glob `patchDir`
  for any file matching `${branch.replace(/\//g,'-')}-*.patch`. If one or
  more match, throw `WorktreeError` naming every matched file and
  instructing the caller to inspect/clean them up before resyncing — same
  message shape as the existing real-conflict refusal at `worktree.mjs:
  780-784` ("the patch is preserved at ... for manual review"). No other
  branch of the function changes; the happy path (no orphaned patch) falls
  straight through to the existing logic unchanged.
- `test/runner/worktree.test.mjs` — new unit test(s):
  1. A pre-existing patch file under `fgos-resync-patches/` matching the
     target branch causes `resyncWorktree` to throw, naming the file, and
     performs NO reset/reapply (worktree left untouched — assert the
     working tree is unchanged from before the call).
  2. A patch file for a DIFFERENT branch (different filename prefix) does
     NOT trip the new check — `resyncWorktree` proceeds normally. Prevents
     the new glob from over-matching across branches.
  3. Existing 7 tests in this file continue to pass unmodified (regression
     guard — none of them leave a patch file behind before calling
     `resyncWorktree`, so the new check is a no-op for all of them).

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `resyncWorktree`'s new pre-check | low — additive, runs before any mutating git call, no behavior change on the (dominant) no-orphan path | new unit tests above (1) and (2) |
| Existing `resyncWorktree` callers (`resync-worktree` CLI case, `resyncClaimWorktree`'s own sibling logic) | none — no call site changes, only the shared function gains an earlier guard | existing 7 `worktree.test.mjs` tests + full `npm test` |

Impact-analysis capability gate: checked
`fgos tool query --capability impact-analysis --status present` — GitNexus
`present` but flagged stale (index last at `c0cedaa`, well behind current
`HEAD`, same staleness already confirmed during tsk-jgs's own plan on this
branch family). Posture: **degraded**. Compensating evidence: `grep -rn
"resyncWorktree\|fgos-resync-patches"` across `src/`/`test/` (RESEARCH.md
Round 1, findings 1-2) already enumerates every call site and every
existing reference to the patch directory by hand — the blast radius here
is a single function with 3 known callers
(`bin/fgos.mjs`'s `resync-worktree` case, and internally by nothing else —
`resyncClaimWorktree` is a distinct, sibling function, not a caller of
`resyncWorktree`), already fully accounted for.

## Split decision

One honest piece — no split. The check, its test coverage, and nothing
else form a single coherent unit.

## Outstanding questions

None
