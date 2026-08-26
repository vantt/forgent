# Research — tsk-1hq: preClaimRevision CAS never refreshed after claim

## Round 1 — 2026-08-26T09:07Z (fgos-coding-discovering, via fgos-researching)

**Asked:** Confirm whether `editWork` still fails to refresh an active
claim's `preClaimRevision` after a successful edit, whether any CLI verb
today refreshes a live claim's `preClaimRevision`, and whether the design
doc specifies HOW the "explicit reconcile path" it names should work.

**Checked and found:**

1. `src/state/store.mjs:1101-1105` (`settleClaim`) still throws
   `conflict` unconditionally on any `preClaimRevision` mismatch — no
   reconcile branch exists at that point in `main`/this worktree's branch
   (`fgw/tsk-1hq`, based on `main@d679ae0c`).
2. `src/state/store.mjs:362-469` (`editWork`) confirmed: appends only a
   `work.edit` event, never calls `withClaimsLock`/`readClaim`/any claim
   write. It does not touch the claim record.
3. **Broader than the item's own framing:** `src/state/store.mjs:1382-1404`
   (`moveStage`, the door every stage-transition verb — `fgos discover`,
   `fgos plan` — calls) *also* never touches the claim record, and
   `src/state/replay.mjs:406-428` (`case 'work.stage'`) confirms a stage
   move mutates `item.stage` directly on the same `work[id]` object
   `getItemDurableRevision` hashes (`src/state/runtime-coordination.mjs:
   49-53`, `sha256(JSON.stringify(view.work[id]))`). So the CAS gap is not
   `fgos edit`-specific: *any* durable mutation of `work[id]` during
   `doing` — a stage move included — invalidates `preClaimRevision`
   without the intervening writer being a real conflict.
4. `preClaimRevision` is written in exactly one place in the whole repo:
   `src/runner/claim-port.mjs:317` (`acquireClaim`, at claim time). No
   other write path exists (`grep -rn "preClaimRevision" src/` returns
   only the claim-port write, the `runtime-coordination.mjs` claim-record
   shape, and the three `settleClaim` read/compare lines above).
5. `docs/architect/doing-coordination-redesign.md:663-666` (§11.2) states
   settle succeeds only if "durable item revision still matches
   `preClaimRevision`, **or an explicit reconcile path accepts the
   change**" — names the requirement, leaves the mechanism unspecified.

**Duplicate found — this is the significant finding.** `docs/history/`
already has a `tsk-1ht-settle-claim-revision-reconcile/` folder (empty on
this branch's checkout, real content only on `fgw/tsk-1ht`). Work item
`tsk-1ht` (`fgos list --id tsk-1ht`: title "settleClaim's revision-CAS
check has no reconcile path, refuses return for any claimed item
edited…", `status: doing`, `stage: planning`) is the *same bug*, already
past discovery (its own verdict was `clear`) and into planning. Its
branch (`fgw/tsk-1ht`, commit `f6e7c63d`, "fix(state): settleClaim
reconciles same-writer revision drift instead of refusing") already has a
real fix committed — `revisionDriftIsSelfCaused` in `store.mjs`, which
requires every event on `id` since the claim's `acquiredAt` to carry
`payload.writer.id === claim.writerId` before reconciling, else it
refuses exactly as today. This is NOT yet merged into `main`
(`git merge-base --is-ancestor f6e7c63d main` → not an ancestor). Its own
`plan.md` (`fgw/tsk-1ht:docs/history/tsk-1ht-settle-claim-revision-
reconcile/plan.md`) confirms the fix covers every mutating event
(editWork *and* moveStage both carry writer stamps per D8/D15/D17/D18),
not just `fgos edit` — matching finding 3 above exactly, already solved
there.

**Still open:** whether tsk-1hq should be marked a duplicate/wontfix of
tsk-1ht, merged as a dependency, or continue independently — a scope
decision, not a repo-evidence gap.
