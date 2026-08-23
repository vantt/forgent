# Plan — tsk-4l1: point the stale-worktree refusal at a real diagnostic recipe

Mode: small

No `exploring` stage ran for this item (discovery's own verdict was `clear`,
2026-08-14). There is no `CONTEXT.md`/locked-decisions table; every claim
below cites either `docs/history/tsk-4l1-stale-worktree-diagnostic-recipe/
RESEARCH.md`'s round 1, or a direct repo `file:line` read done in this
planning pass.

## Approach

**Confirmed gap** (RESEARCH.md round 1): `resyncClaimWorktree`'s third
refusal (`src/runner/worktree.mjs:660-665`, the exact message quoted in this
item's own title/description) already holds `lastSynced`/`branchTip`/
`worktreePath` at throw time but tells a person only "commit or discard by
hand" — no path to actually tell a stale artifact apart from real work
first. `resync-worktree` (the existing repair verb) is not a safe blind
answer either: it assumes the staged content is real work worth preserving,
and reapplying a genuinely stale artifact onto the new branch tip would
recreate the exact corruption the guard exists to prevent (RESEARCH.md).

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` reports `gitnexus` `present`, but a
`gitnexus impact --target resyncClaimWorktree --direction upstream` query
run in this planning pass returned `impactedCount: 0` — contradicted by a
direct `grep -n "resyncClaimWorktree(" src/runner/worktree.mjs`, which shows
one real caller at `worktree.mjs:853` (`createClaimWorktree`'s own reattach
branch). The index was flagged stale by the harness right after this
session's earlier commit. Per `CLAUDE.md`'s cross-check rule, the grep result
is what this plan relies on, not GitNexus's zero-result: exactly one caller,
`createClaimWorktree`, both in the same file, both under existing test
coverage (`test/runner/worktree.test.mjs`).

**Design decision:** the smallest honest piece that closes the gap is (1) a
new how-to doc giving the mechanical diagnostic recipe — walk backward
through `lastSynced`'s own ancestry (`git log --format=%H`), running `git
diff --quiet <candidate> -- ':!.fgos'` at each step until a zero-diff match
proves genuine staleness, or a bounded depth is exhausted (treat as real,
unproven work) — and (2) one added sentence in the existing throw
(`worktree.mjs:662`) pointing at that doc, using the same `worktreePath`/
`lastSynced` values already in scope. This is purely additive to an error
message string; it changes no control flow and touches no other caller.

A fuller option — computing the ancestor-walk match INSIDE
`resyncClaimWorktree` itself and naming the matched commit directly in the
thrown message, instead of pointing a person at a recipe to run by hand — is
a real, larger alternative. Not taken here: the item's own wording treats "a
documented diagnostic recipe" as sufficient on its own ("a doctor check
and/or a documented diagnostic recipe (or an automated one)"), and a doc +
pointer is provably lower-risk (zero behavior change to the guard's own
logic) for the same outcome — a person hitting the refusal now has a
concrete next step instead of starting from zero. Named here as a deliberate
scope line, not a silently dropped option — a natural follow-up if the
manual recipe proves too slow in practice.

Files touched: `src/runner/worktree.mjs` (one message string, line 662),
`docs/how-to/tell-a-stale-worktree-index-apart-from-real-uncommitted-
work.md` (new), `test/runner/worktree.test.mjs` (extend the existing
refusal test with a message-content assertion). No split — one honest,
contained piece.

## Shape

1. Write `docs/how-to/tell-a-stale-worktree-index-apart-from-real-
   uncommitted-work.md`: the concrete recipe (the ancestor-walk `git diff
   --quiet` loop above), framed for a person who just hit the
   `resyncClaimWorktree` refusal — what a MATCH means (safe to `git reset
   --hard` by hand, or discard), what NO MATCH means (real work — commit it
   or run `fgos resync-worktree` to carry it forward across the resync).
2. At `worktree.mjs:662`, append one sentence to the existing thrown message
   pointing at that doc path — no change to `lastSynced`/`branchTip`
   computation, no change to which branch throws.
3. Extend `test/runner/worktree.test.mjs`'s existing test (`createClaimWorktree
   refuses to resync ... AND has real uncommitted work`, line 655-675) with
   an assertion that the caught error's `.message` contains the doc's own
   path string — proves the pointer is really wired in, not just written in
   the doc.

Proof point (light risk — an error-message string plus a doc, under
existing test coverage): `test/runner/worktree.test.mjs` already exercises
this exact throw path; the extended assertion is the concrete case proving
the pointer landed.

## Outstanding questions

None
