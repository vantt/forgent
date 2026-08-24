# RESEARCH.md — tsk-3ofc

## 2026-08-23 — round 1 (discovery stage, called by fgos-coding-discovering)

**Asked:** verify the item's claim that `src/runner/loop.mjs`'s
`hasStillNeededDescendant` is semantically identical to `frontier.mjs`'s
`hasOpenDescendant`/`indexChildrenByParent`, and safe to delete/replace as
described, before the discovery stage self-judges `clear`/`unclear`.

**Checked:**
- `src/runner/loop.mjs` (`rg -n "hasStillNeededDescendant|hasOpenDescendant|indexChildrenByParent" src/runner/loop.mjs`)
- `src/state/frontier.mjs` (`hasOpenDescendant`, `isResolvedStatus`, `isCanceledStatus`, `TAIL_RESOLVED_STATUSES`)
- repo-wide grep for any other `hasStillNeededDescendant` call site

**Found:**

1. `loop.mjs:86` already imports `resolveRoot, hasOpenDescendant,
   indexChildrenByParent` from `../state/frontier.mjs` — confirmed both
   are exported and already in scope in `loop.mjs`.
2. `loop.mjs:345-352` defines `hasStillNeededDescendant(id, work)`; its
   only call site repo-wide is `loop.mjs:457`
   (`hasStillNeededDescendant(branchId, view.work)`), inside `startupReap`'s
   orphan-branch-pruning pass (confirmed by repo-wide `rg`, no other
   references besides the recursive self-call at line 349 and a
   docstring mention at line 367). Line numbers in the item description
   match exactly.
3. **The two functions are NOT semantically identical — the item's
   premise is factually wrong.** `loop.mjs:331-343`'s own docstring
   states this explicitly and is itself the evidence:
   > "Deliberately a BROADER 'still needed' set than `frontier.mjs`'s own
   > `isResolvedStatus`/`hasOpenDescendant` (which treats
   > `delivered`/`retrospective`/`cleanup` as resolved, for dispatch
   > purposes): a leaf sitting in exactly `cleanup` still needs its
   > root's `fgw/<rootId>` branch alive for its own
   > `checkMergeStillResolves` call (`assessCleanupReadiness`,
   > `cleanup-harness.mjs`) — reusing the shared dispatch-anchor
   > definition here would NOT catch the scenario that caused the real
   > 14-item false-positive block this guards against. **Do not
   > consolidate this with `hasOpenDescendant` — the two intentionally
   > answer different questions.**"

   Confirmed directly against the actual implementations:
   - `hasStillNeededDescendant` (`loop.mjs:345-352`) treats **only**
     `done`/`wontfix` as terminal — a descendant sitting in
     `delivered`/`retrospective`/`cleanup` counts as "still needed"
     (returns `true`).
   - `hasOpenDescendant` (`frontier.mjs:314-326`) delegates to
     `isResolvedStatus` (`frontier.mjs:266-270`), which treats
     `TAIL_RESOLVED_STATUSES = {delivered, retrospective, cleanup, done}`
     (`frontier.mjs:244`) **plus** `wontfix` (via `isCanceledStatus`,
     `frontier.mjs:259-264`) as resolved — a descendant sitting in
     `delivered`/`retrospective`/`cleanup` counts as resolved, i.e.
     **not** open (returns `false`).

   These disagree on exactly the `delivered`/`retrospective`/`cleanup`
   range — the range the docstring says the 14-item false-positive
   incident hinged on. The item's description asserts "no behavior
   change (both functions are semantically identical — confirmed by
   direct read)" — that assertion is contradicted by both the code
   comment and the actual bodies of the two functions.
4. `test/runner/loop.test.mjs` exists; not fully read this round beyond
   confirming the file is real (path resolves) — moot given finding 3
   already establishes the premise is false regardless of test coverage.

**Still open:** none for the stated goal — the goal was to verify the
duplication/no-behavior-change claim, and the finding is unambiguous:
the claim is false, verified against both a locked code comment and the
real implementations.

**Verdict:** `clear` (the ambiguity itself is fully resolved with
evidence) but the resolved finding contradicts the item's own premise —
the described refactor would be a real behavior change disguised as a
"no behavior change" cleanup, on the exact axis (`delivered`/
`retrospective`/`cleanup` statuses) a prior real incident (14-item
false-positive block, tsk-577) hinged on. This is a product/scope
decision (is the item invalid as scoped? should it be re-scoped to just
adding a comment cross-reference, or closed wontfix?), not something
discovery can resolve alone — handing to `exploring` via an `unclear`
verdict so a person decides.
