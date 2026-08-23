# Research: tsk-2cl — pre-commit staleWorktreeIndexRefusal fail-open on unreadable branch tip

## Round 1 (discovery, 2026-08-13)

**Asked:** confirm the bug against current code; assess how narrow the
race really is and — the item's own explicit hedge — whether the fix is
genuinely complex enough to need a person weighing a trade-off, or whether
evidence resolves that question on its own.

**Checked / found:**

1. `.githooks/pre-commit`'s `staleWorktreeIndexRefusal`
   (`.githooks/pre-commit:180-218`, current). Three failure-mode branches:
   - `lastSynced` unreadable (reflog) → `return "commit refused: ...
     (fail-closed)"` (lines 189-197).
   - `branchTip` unreadable (`git rev-parse branch` throws) → **`return
     null;`** (lines 199-204) — no refusal, commit proceeds unguarded.
     Confirmed exactly as the item describes, current code, not already
     fixed.
   - Not an ancestor (diverged) → `return "commit refused: ... (fail-
     closed)"` (lines 207-215).

   The `branch` name itself was already read successfully via
   `git symbolic-ref --short -q HEAD` two blocks earlier (line 183) before
   `branchTip` is read — same precondition the item's own text states.

2. **Complexity of the fix, checked directly against the two sibling
   branches already in the same function**: both existing fail-closed
   branches are a 3-line `try { ... } catch { return "commit refused:
   ..."; }` shape, each returning ONE string built from values already in
   scope. The fail-open branch (199-204) is the exact same shape MINUS the
   refusal message — `catch { return null; }` instead of `catch { return
   "commit refused: ..."; }`. Making it fail-closed is a same-shape,
   same-file, one-branch edit: swap `return null` for a `return
   "commit refused: ..."` string citing `branch`/`lastSynced` (the only
   two values in scope at that point — `branchTip` itself is, by
   definition, exactly what failed to read). **This directly contradicts
   the item's own hedge ("needs a person/planning to weigh whether this
   narrow race is worth the added refusal-message complexity")** — there
   is no meaningful added complexity; it is the same three-line shape
   already used twice in the same function, for the same kind of failure.

3. `docs/history/stale-worktree-index-guard/CONTEXT.md` D2 (cited by the
   item itself): "Not an ancestor, or reflog unreadable -> refuse (fail
   closed)" — the design's own stated intent was ALREADY fail-closed by
   default for every unreadable/ambiguous state; the branch-tip-unreadable
   case reads as an oversight in translating that intent to code (the
   in-code comment at line 203 rationalizes it after the fact — "branch
   ref unreadable -- not this guard's failure mode" — rather than
   reflecting a deliberate design choice recorded in `CONTEXT.md` itself;
   no D-ID anywhere locks this specific sub-case as intentionally
   fail-open).

4. Test coverage: `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`
   already exercises the sibling fail-closed branches through the real
   hook subprocess (`tsk-1d7` tests, lines 152-178: diverged branch
   refused, in-sync branch allowed). No existing test exercises the
   branch-ref-unreadable path.

**Verdict: clear.** The item's own stated reason for needing a person —
added complexity — does not hold up against the evidence: the fix is the
same 3-line shape as two sibling branches in the same function, and
`CONTEXT.md` D2's own stated intent was already fail-closed-by-default,
making this a straightforward alignment rather than a new design
decision. Verify: `npm test`.
