# Research — tsk-2jg

## Round 1 — 2026-08-26 (discovery stage, via fgos-researching)

**Asked:** Verify the three concrete code-fact claims in tsk-2jg's bug
report against the current repo, and find whether a docsRef-resolved
fallback path already exists that a fix could mirror.

**Checked (repo, cited):**

1. `src/state/store.mjs:621-643` — `assertPlanEvidence(id, work, repoRoot)`.
   Confirmed: for `work.risk === 'heavy'`, builds candidate paths
   (`work.docsRef`-resolved `plan.md` if set, plus
   `docs/history/<id>/plan.md`) but checks EVERY candidate only via
   `git cat-file -e fgw/<id>:<candidate>` (line 631) — never a plain
   `fs.existsSync` against the current working tree. An item with no
   `fgw/<id>` branch fails every candidate regardless of whether the
   file genuinely exists on disk/on main.

2. `src/runner/merge.mjs:236-245` — `classifySource(repoRoot, item)`.
   Confirmed: `branchExists(repoRoot, branchNameFor(item.id))` (line 237)
   is checked FIRST and returns `'runner'` immediately if true — the
   `headAtTake`/`headAtReturn` pull-door markers (`resolvePullDoorHeads`,
   lines 229-233) are only consulted as a fallback when no branch exists.
   A same-named branch existing at all — for any reason, including one
   created purely to satisfy `assertPlanEvidence` — flips classification
   to `'runner'` even when the item's own recorded take/return markers say
   `'pull'`.

3. **Correction to the bug report's own framing** (still same net effect,
   different actual trigger): `src/verbs/merge/approve.mjs`'s local
   (non-`--github`) pre-flight call to `assertPlanEvidence` (line 406) is
   scoped INSIDE `if (source === 'runner')` (line 383) — it never runs at
   all for a `pull`/`legacy`-sourced item. The pull/legacy local path
   (lines ~888-923) calls `runGoalCheck` against the current tree exactly
   as the report describes for verify, then `moveDeliveredOrRecordFault`
   → `moveWork(dir, { id, to: 'delivered', ... })` (approve.mjs:88). The
   actual failure trigger for a pull-door heavy-risk item with no branch
   is **`store.mjs`'s own unconditional backstop**
   (`moveWork`, `store.mjs:881-884`: `if (to === 'delivered') {
   assertAcceptanceEvidence(...); assertPlanEvidence(...); }`) — this
   fires on EVERY transition to `delivered` regardless of `classifySource`
   result, including the pull/legacy verify-only path. The thrown
   `StoreError('precondition', ...)` is explicitly NOT caught by
   `moveDeliveredOrRecordFault`'s own guard (approve.mjs:90-100 — the
   comment there names this exact case: "A StoreError from transitionWork's
   own precondition/CAS check ... is a legitimate refusal that must keep
   propagating exactly as before"), so it surfaces as an uncaught error out
   of `approve`, matching the report's "approve is a dead end" symptom.
   **Implication for a fix:** patching only `approve.mjs`'s runner-scoped
   pre-flight (line 406) would not touch this bug at all — the fix has to
   change `assertPlanEvidence` itself (store.mjs:621) and/or its unconditional
   call site at store.mjs:881-884, since that backstop is what actually
   gates the pull-door path.

4. **Existing current-tree-verify precedent to mirror:** confirmed —
   `approve.mjs`'s own pull/legacy path (comment at lines 888-890: "code is
   already on main (D4) — no merge step, just re-run the item's own verify
   against the current tree") already re-runs verify via `runGoalCheck`
   directly against `repoRoot`'s working tree rather than a branch. This is
   the exact pattern the report's option-1 fix direction proposes mirroring
   inside `assertPlanEvidence` (an `fs.existsSync`-style check against
   `repoRoot` when no `fgw/<id>` branch exists and the item's own source
   classification is `pull`/`legacy`, alongside the existing branch check).

5. **Claim-source field:** no separate persisted `source` field exists on
   a work item. `classifySource` is a pure re-derivation from two things:
   live `git branch` existence (`branchExists`) and the item's own
   `headAtTake`/`headAtReturn` (or `lastAttempt.headAtTake/headAtReturn`)
   fields, set at `fgos take`/`fgos return` time. These two ARE the
   only recorded provenance for "was this claim pull-door" — a fix
   preferring them over branch existence (report's option 2) means
   checking `resolvePullDoorHeads` before, not after, `branchExists`.

**Still open (not resolved here — a design choice, not a fact-check):**
which of the report's two fix directions to take (teach
`assertPlanEvidence` a current-tree fallback scoped to
non-`'runner'`-classified items, vs. reorder `classifySource` to prefer
`headAtTake`/`headAtReturn` over branch existence) — and, given finding 3
above, that any fix must also touch `store.mjs`'s unconditional
`moveWork` backstop (or make `assertPlanEvidence` itself source-aware),
not just `approve.mjs`. This is a scope/approach decision for
`planning`, not an ambiguity discovery needs to block on — the underlying
facts are now fully grounded.
