# Review: Git phase 06 unit 1 (dormant Land prepare/publish), be7236cf5..78429d1dd

**Verdict: not merge-ready.** Two High findings, both reproduced against the real addon. Lock order, evidence binding, the WAL ordering and the ScopedCommit extraction are sound. Recovery being absent was not flagged, as the brief asked.

## Method

I read the full diff, the lead report, spec §9 and the §10 rules 4/4a/4b, and the existing Refs CAS door (`refs.rs:755-785`) for comparison. To test behaviour, I exported the commit with `git archive` into a scratch copy. That was needed because the worktree is read-only, so the addon cannot be staged there. In the copy I ran three Node probes built on the same `fixture()` as `test/git/land.test.mjs`, using a real git repo and the real addon. Nothing in the workspace was modified. Probe source and log: `/tmp/claude-1000/-home-vantt-projects-forgent/0d0cd2e4-d24f-410c-9549-1cf619209a62/scratchpad/wt/test/git/probe.test.mjs` and `.../scratchpad/probe.log`.

## Critical

None.

## High

**H1. Staged dirt that does not overlap the land is destroyed while the receipt reports `pending`.** (`packages/git/rust/src/land.rs:676`, gate at `:173-239`)
- **Reproduced:** in main, stage a change to `b` (not touched by the land) and stage a new file `newstaged`, then run prepare and publish. The receipt says `checkout: pending`. Afterwards `b` is back to `base\n`, and `newstaged` is gone from both the index and the disk.
- **Cause:** the gate tolerates any dirt outside the own-file set, staged dirt included. After the CAS, `read-tree -m -u HEAD` does a one-way merge. That replaces index entries that differ from the new tree, and `-u` then rewrites or deletes the matching worktree files, because they are "up to date" relative to the staged entry. The spec's claim that non-overlapping dirt is preserved (and D-ADR0042) does not hold for staged dirt.
- **Fix (either):**
  - Have the gate also refuse any index entry that differs from `target` (`diff --cached --name-only target`, excluding `.fgos`). Only unstaged worktree dirt is then tolerated.
  - Or reconcile with a two-tree `read-tree -m -u <target> <candidate>`, which keeps index-only changes to paths unchanged between the two trees.
- **Test to add:** staged modification plus staged addition outside the footprint.

**H2. An abandoned prepare blocks the destination with no way out.** (`land.rs:500-521`, `land.rs` session drop, `node-addon/src/git/land.rs:84-88`)
- **Reproduced:** prepare `one`, call `close()` (the normal "consumer verification failed" path), then prepare `two` on the same destination. It fails with `recovery-required / resource-recovery-required` from `refs::admission`.
- **Why it matters:** rejected verification is a routine outcome, not a recovery case. The chain ends at Prepared, with no TargetAttempt. Spec §10 rule 4b says such a chain is closed record-only as `abandonedBeforeAttempt`, and that "a later operation id on the same ref is never blocked by it". This is also the phase 05 lesson about no permanent per-destination block. Since this unit ships no recovery, every failed verification wedges the destination for good.
- **Fix:** add an explicit `abandon`/`close` on `LandSession` (and in the addon) that appends `Outcome::AbandonedBeforeAttempt` while the slot is still held and the chain is still at Prepared. That transition is already allowed by `wal.rs` `validate_transition`. Pins and the candidate stay as evidence. Make plain `close()` either do this or return an error saying it did not. Add a test: prepare, abandon, then a new id lands.

## Medium

**M1. Land's CAS failure classification differs from the existing Refs door.** (`land.rs:654-672`, compare `refs.rs:769-784`)
- **The problem:** whenever `update-ref` exits non-zero, Land records a terminal `Outcome::Loss` with whatever tip it observed. The Refs door instead returns `ref-write-failed-recovery-required` when `observed == old`, and records Loss only when someone else moved the ref.
- **Consequences:**
  - A transient failure such as `refs/heads/<x>.lock` contention or an I/O error becomes a permanent "lost" receipt even though nothing moved.
  - A non-zero exit after the ref did move to the candidate becomes `Loss` with `observed == next`, which mislabels a landed state.
  - Land also drops the before/after checkout-facts comparison around the CAS that the Refs door uses to detect checkout switches. The phase 05 lesson on mutual exclusion between lifecycle and checkout applies here.
- **Fix:** branch three ways: `observed == target` gives a recovery error, `observed == candidate` gives a recovery error (an effect is observed), and only any other tip records Loss. Add the facts comparison, or better, factor the post-attempt classification out of `refs.rs` and share it (one door, as with `ignored_checkout_collisions`).

**M2. After a ref-moving attempt, a retry of publish is reported as `stale` instead of recovery-required.** (`land.rs:605-620`)
- **The problem:** publish compares the destination with `target` and returns `stale("land-target-changed")` before it reads the WAL phase. Suppose a publish fails after the CAS, for example with `land-main-head-changed` or `land-ref-drift`. Calling publish again on the same session (or after prepare-replay, which currently fails with `land-recovery-required` because no outcome exists) reports `stale`.
- **Why it matters:** `stale` invites the consumer to re-prepare under a new id. Source is then already an ancestor of the new target, so the merge is "Already up to date", and `commit-tree` lands a second, empty merge commit. That is a second land.
- **Fix:**
  - Inspect the chain first. Anything past `Prepared` returns `land-recovery-required` before any ref comparison.
  - Separately, have prepare refuse with `land-already-merged` when `source` is an ancestor of `target` (`merge-base --is-ancestor`).

## Low

- **L1. Request validation happens after effects.** `req.files` paths (`land.rs:400-410`) are validated after the candidate worktree is allocated and the merge has run. An invalid path, a conflict, or a symlink refusal leaves a candidate directory under `.fgos/runtime/git-candidates` with no Land WAL record pointing to it, so a later cleanup unit cannot find it by Land id. Validate `files` with the other request checks at `:262-285`. For post-allocation failures, record the candidate path in the error, or let the cleanup unit find it through the `lc-<digest>` worktree operation id.
- **L2. One `pending` value covers two different main-checkout states.** It means "index and worktree untouched, ignored `.fgos` collision" (`:672`) and also "reconciled except tolerated dirt" (`:683`). The recovery unit cannot tell them apart from the outcome record. Use distinct outcome values (for example `pending` and `pendingStoreCollision`), even if the receipt maps both to `Checkout::Pending`.
- **L3. Same-id replay of a lost land changes shape.** The first call fails with `stale` and carries the receipt. Replay through prepare returns `Ok` with a `landed: false` receipt, and a later `publish` returns `Ok` with that receipt. Return the same error-with-receipt on replay so that M4's "same id, same result" holds for consumers.
- **L4. A finished operation cannot be replayed while its destination slot is held.** Prepare acquires slot 20 with `Wait::Ms(0)` (`:286-290`) before the same-id replay check (`:301`). Replaying a completed id while another session holds the destination slot fails as busy instead of returning the stored receipt. Do the `known_id` check before acquiring the slot; it is read-only.

## Checked and found sound

- **Lock order.**
  - Prepare refuses any held rank above 20 and an already-held slot before any effect (`:250-261`).
  - The slot is acquired with no wait, and the candidate goes through the Worktree door under 40.
  - Pins are written under 40, which is then dropped (`:504-519`), so only 20 is held during verification.
  - Publish takes 40 then 50 (`:547-550`).
  - The probe and the `slot_excludes_same_destination_through_verification` test both show the second prepare is excluded.
- **Evidence binding.**
  - All four bound values are checked against the session candidate, and the evidence digest must be non-empty. The WAL transition re-checks the same binding (`wal.rs` Prepared→LandVerified).
  - Before the CAS, publish confirms candidate HEAD, write-tree and porcelain status, all three pins, and the commit types, so stale or tampered candidates cannot publish.
  - The tree digest adds no binding beyond the tree OID, but it is consistent. Forged evidence digests are accepted by design, since the consumer owns them.
- **Durability and ordering.**
  - The order is `LandVerified → TargetAttempt → CAS (core.fsync=all) → read-back → read-tree → Outcome`.
  - A TargetAttempt without an Outcome is never replayed (Node test "unresolved target attempts never replay a CAS").
  - Successful same-id replay returns the receipt even after an ABA.
- **Concurrency and checkout state.** Concurrent lands on one destination are serialized by slot 20, the admission check and the CAS. Foreign checkout or linked-worktree attachment of the destination is refused.
- **ScopedCommit extraction.** `checkout_call_borrowed` is byte-for-byte the old logic: same `PATH_LIMIT` (64 MiB), same Refused codes, same post-hook refresh. The only change is order: the custody/handle check now runs before preflight, which changes only which error wins. There is no behaviour change. `ignored_checkout_collisions` is a clean extraction.
- **Layering.** The addon and Node layers are thin, the manifest entry was added, and the write-scope `overlaps` export reuses the existing predicate.
- **Tests.** They use real git and the real addon, with no test-only switches. Missing cases: H1, H2, M1 (CAS non-success with the tip unchanged) and M2.

## Unresolved questions

- For H1, should Land refuse staged dirt outright (simpler and stricter), or preserve it with a two-tree read-tree? The fix differs, and it is a product choice under D-ADR0042.
