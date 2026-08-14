# Research — tsk-4l1: stale-worktree refusal gives no diagnostic recipe

## 2026-08-14 — Round 1 (discovery)

**Asked:** Where does `pick`'s stale-worktree resync refusal actually live,
what data does it already have at refusal time, and what mechanical
diagnostic recipe could distinguish "genuinely stale artifact" from "real
uncommitted work" for a person hitting it? Does `fgos doctor`'s check
registry, or any existing CLI error-message convention, already give a
place to hang this?

**Checked:**
- `src/runner/worktree.mjs:570-670` (`lastSyncedCommit`,
  `isDirtyRelativeToSync`, `resyncClaimWorktree`) — read directly.
- `.githooks/pre-commit:161-223` (`staleWorktreeIndexRefusal`) — read
  directly.
- `src/runner/worktree.mjs:694-751` (`resyncWorktree`, the `fgos
  resync-worktree` repair verb) — read directly.
- `test/runner/worktree.test.mjs:618-751` (existing `resyncClaimWorktree`/
  `createClaimWorktree` reattach test coverage) — read directly.
- `docs/how-to/` directory listing — confirmed no existing doc already
  covers this pattern (`grep -rl "byte-identical\|stale artifact" docs/`
  hits only unrelated files).

**Found:**
- The exact quoted refusal in the item's own description
  (`"refusing to resync claim worktree ... last-synced commit ... behind
  the branch current tip ... uncommitted changes ... never auto-reset over
  uncommitted work"`) is `resyncClaimWorktree`'s third throw
  (`worktree.mjs:660-665`), reached when `isDirtyRelativeToSync` returns
  `true`. At that point the function already holds `lastSynced`,
  `branchTip`, and `worktreePath` (passed as the `WorktreeError`'s
  structured data, `worktree.mjs:663`) — but the thrown message text never
  surfaces a concrete next step beyond "commit or discard by hand."
- `isDirtyRelativeToSync` (`worktree.mjs:594-607`) compares the worktree
  against `lastSynced` (the reflog-derived last-synced commit) via `git
  diff --quiet lastSynced -- ':!.fgos'` plus an untracked-file scan. A
  worktree byte-identical to `lastSynced` itself would never reach this
  throw (it returns `false`, and `resyncClaimWorktree` auto-resyncs). The
  item's own live incident (tsk-2qc-2cfwQQ) means the real content was NOT
  byte-identical to `lastSynced` — it matched some OTHER, older commit
  instead, which the session had to find by manually walking history
  (`git diff --cached <old-commit>` for a zero-diff match). This is the
  concrete, mechanizable recipe: walk backward through `lastSynced`'s own
  ancestry via `git log --format=%H`, running `git diff --quiet <candidate>
  -- ':!.fgos'` at each step, until a zero-diff match is found (a genuine
  "this worktree exactly matches an old, real commit" proof) or a bounded
  depth is exhausted (no match found → treat as real, unproven work).
- `.githooks/pre-commit`'s own `staleWorktreeIndexRefusal`
  (`.githooks/pre-commit:180-223`) is a DIFFERENT, unconditional guard (any
  commit attempt while `lastSynced !== branchTip` is refused outright,
  regardless of diff content) that already points to `fgos
  resync-worktree` as its own fix. `resyncClaimWorktree`'s own refusal
  (the one this item is about) does NOT point to that verb — but
  `resyncWorktree` (`worktree.mjs:694-751`) assumes the staged content is
  "real work worth preserving" (it captures it as a patch, resets, then
  reapplies). Running it blind on a genuinely stale artifact risks
  reapplying that staleness onto the new tip — so `resync-worktree` is not
  a safe blanket answer here; the stale/real distinction still has to be
  made FIRST, by a person, before choosing between "run resync-worktree"
  (real work) and "just reset by hand" (proven stale).
- `test/runner/worktree.test.mjs:655-675` already covers the throw
  itself (`assert.throws(..., WorktreeError)`) but never asserts on the
  message's own content — free to extend with a message-content assertion
  without touching existing coverage.
- `docs/how-to/register-a-fixable-doctor-check-in-fgos.md` exists (doctor
  check registration pattern), confirming a `fgos doctor` check IS a real,
  available option — but a doctor check runs at a fixed startup/on-demand
  sweep, not scoped to "a person just hit this specific refusal right
  now," which is when the diagnostic is actually needed. The item's own
  wording ("a doctor check and/or a documented diagnostic recipe (or an
  automated one)") explicitly treats a documented recipe as sufficient on
  its own.

**Remains open:** none for a contained fix. A fuller automation (computing
the ancestor-walk match INSIDE `resyncClaimWorktree` itself and reporting
the matched commit directly in the thrown message, rather than just
pointing at a recipe a person runs by hand) is a legitimate larger option
but not required by the item's own wording — recorded as a deliberate scope
line in `plan.md`, not a silently dropped option.
