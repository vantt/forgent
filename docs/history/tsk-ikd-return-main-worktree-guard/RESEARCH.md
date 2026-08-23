# Research: tsk-ikd — return's main-source path has no main-worktree guard

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match Finding 4's description
(`return`'s main-source path has no `isMainWorktree` guard, unlike
`approve`/`sync-root`/`promote-to-component`)? Does the report's own
"Suggested direction" (apply the same `isMainWorktree(repoRoot)` refusal)
hold up against the REST of the codebase, or does it conflict with an
existing, already-settled design decision?

**Checked:**
- `bin/fgos.mjs:2873` (`case 'return'`) through the main-source branch
  (originally `:3021`, now shifted) — read directly. Confirmed: no
  `isMainWorktree` check anywhere in the case, exactly as described.
- `bin/fgos.mjs:3355` (`approve`'s own guard, originally cited at `:3307-
  3333` in the report — line numbers shift as the file grows, content
  confirmed identical) — read directly: a TWO-PART guard, a session-
  registry loop (`listSessions(repoRoot)`, refusing ANY registered session
  worktree) FOLLOWED BY a structural `isMainWorktree` check (catching an
  unregistered ad-hoc worktree the registry loop can't see).
- `docs/specs/runner.md:656-669` — **the critical find**: this section
  explicitly states (own translation): "Epic 2 wires `approve` into the
  registry as a BLOCK, not an adaptation: `approve` running from inside a
  session worktree is cleanly refused... because a session worktree is
  structurally the wrong place for a merge-into-main to happen. `return`
  does NOT need to change: its progress check (`aheadCount` + `verify`) is
  ALREADY correct when run from inside a session worktree (spike-proven),
  so running `return` from inside a session behaves exactly the same as
  everywhere else." This is a locked, already-settled design decision with
  cited evidence ("spike-proven"), not a gap.
- `src/runner/session.mjs:311-402` (`createSession`) — read directly:
  session worktrees are DETACHED (`git worktree add --detach`, never a new
  branch, unlike a claim worktree's `fgw/<id>`), and their `.fgos` is a
  SYMLINK to the real shared store (never copied, per D10 cited in the
  spec) — so state writes from inside a session worktree land in the real
  store, not a stale/isolated copy.
- `src/runner/session.mjs:424-482` (`endSession`) — read directly: WITHOUT
  `--force`, refuses to remove a worktree whose HEAD has diverged from its
  own `startCommit` (a dangling commit), naming the sha explicitly — this
  is the actual layer responsible for making sure work returned from a
  session worktree doesn't get silently discarded before it reaches main,
  not `return` itself.
- `test/cli/fgos-return.test.mjs:997` — an EXISTING test,
  `'return succeeds unchanged from inside a real session worktree...'`,
  explicitly asserts `return` succeeds from a session worktree. Confirmed
  this is the SAME design decision the spec documents, not an oversight —
  running this test against a naive `isMainWorktree`-only guard (mirroring
  approve's own structural check with no session carve-out) broke it
  (confirmed empirically before correcting the implementation, see plan.md
  Approach).

**Found:** the report's "Suggested direction" ("apply the same
`isMainWorktree(repoRoot)` refusal") is INCOMPLETE against the rest of the
codebase — it does not account for `docs/specs/runner.md`'s own explicit
session-worktree carve-out, a locked decision with cited evidence. Per
review-audit-self-decision's "Verified Decisions" rule, a locked/spike-
proven decision is not reversed on an audit's abstract suggestion without
new evidence; the audit here didn't cite any new evidence contradicting the
spike-proof, it simply didn't check for the carve-out. The correct fix
narrows the report's own suggestion: refuse an UNREGISTERED worktree only
(mirroring approve's own two-part shape — registry loop + structural check
— but with `return`'s own, opposite session-handling: ALLOW a registered
session, matching `approve`'s registry loop inverted in effect).

**Decided:** add a guard that checks `isMainWorktree(repoRoot)` OR
membership in `listSessions(repoRoot)` (the same realpath-prefix match
`approve`'s own registry loop already uses) before refusing — refusing
ONLY when neither holds. This closes Finding 4's real failure scenario (an
UNRELATED, unregistered `fgw/<id>` leftover worktree, or a bare `git
worktree add` by hand) while leaving the spec-locked session-worktree
behavior exactly as documented and tested.

**Remaining open:** none — resolved directly from the spec + existing test
+ code, no product decision left open. This finding is a case where
following the audit's suggested direction LITERALLY would have reversed a
locked decision without new evidence — caught before implementing it
broadly, corrected to the narrower, spec-consistent fix.

**Verify (real, runnable):**
```
node --test test/cli/fgos-return.test.mjs test/cli/fgos-approve.test.mjs
```
(existing suites covering both `return`'s own case and the sibling
`approve` guard this item mirrors; one new case added proving the actual
Finding 4 failure scenario is closed, without touching the pre-existing
session-worktree case.)
