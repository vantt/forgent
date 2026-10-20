# Review: Git phase 06 units 2 and 3 (Land recovery, ack-gated cleanup, crash matrix, unit-1 fixes), 78429d1dd..6f16ca086

**Verdict: not merge-ready.** The eight unit-1 findings are fixed as stated. But the new admission exemption lets a fresh Land proceed over an older Land chain whose ref effect is observed and whose checkout reconciliation is unfinished. I reproduced this: the main checkout keeps a staged revert of the first land that Git itself produced, and the first chain can never be recovered afterwards. Three Medium findings also leave reachable recovery rows permanently `recovery-required`.

## Method

I read the full diff, the unit-1 review, both lead reports, spec §9 and §10 (rules 4, 4a, 4b and the recovery table), and the Worktree removal door. The worktree is read-only, so I exported `6f16ca086` with `git archive` into a scratch copy and added one probe test file there. It reuses `tests/support/land.rs` and drives the real `GitDriver` against real git repositories, built with a scratch `CARGO_TARGET_DIR`. Nothing in the workspace was modified. Probe source: `/tmp/claude-1000/-home-vantt-projects-forgent/df7c7389-3dae-463f-af65-dc376ed906a7/scratchpad/wt/packages/git/rust/tests/probe.rs`. Runner: `.../scratchpad/run-probe.sh probe_`. All three probes ran and printed the results quoted below.

## Unit-1 findings: status

- **H1 is fixed.** Publish and recovery use two-tree `read-tree -m -u <target> <candidate>` (`land.rs:754`, `:1335`). A staged entry that overlaps the land still refuses, through the status gate. The proof records the expected next stage-entry digest (`land.rs:1052-1086`). See the new High below for a remaining hole in the same area.
- **H2 is fixed for the same writer.** Under slot 20, admission closes same-writer pre-attempt chains as `abandonedBeforeAttempt` (`land.rs:383-402`), and `wal.rs` allows that transition from LandVerified. The live slot does prove that no session can still publish: a session holds slot 20 from prepare until its receipt, and recover and acknowledge take the same slot. A different writer is still blocked; see M3.
- **M1 is fixed.** `refs::classify_ref_attempt` (`refs.rs:79-100`) is now the one door for both Refs and Land. It compares checkout facts, treats an unchanged or candidate tip after a failed CAS as recovery-required, and records Loss only for a third-party tip.
- **M2 is fixed.** Publish checks the WAL phase before any live check (`land.rs:637-640`), and prepare refuses `land-already-merged` (`:369-378`).
- **L1-L4 are fixed.**
  - L1: file paths are validated before allocation (`:291-303`), and later errors carry the candidate path and operation id.
  - L2: `pendingStoreCollision` is a distinct outcome.
  - L3: lost replay returns the same stale error with its receipt (`replay_land_receipt`).
  - L4: compacted and known-id replay happen before the slot is acquired.

## Critical

None.

## High

**N-H1. A fresh Land proceeds over an unrecovered, effect-observed Land chain. That leaves a Git-made staged revert in the main checkout and makes the older chain permanently unrecoverable.** (`refs.rs:130-131` exemption, `land.rs:403-411`)

- **Reproduced** (`probe_fresh_land_over_unrecovered_post_cas_chain`):
  1. Land X is interrupted at `land-before-read-tree`, after its CAS. HEAD is C1 while the index and file `a` still hold `base`.
  2. Without recovering X, land Y (source changes `b`, target C1). Y succeeds with `checkout: Pending`.
  3. Afterwards `HEAD:a = incoming`, `:a = base`, `status = "M  a"`.
  4. `recover_land(x)` now returns `land-target-effect-unknown` forever, because the ref is C2, not X.next.
- **Why it matters:**
  - The checkout now holds a staged reversion of a landed change, created by Git's own unfinished reconciliation. Y's gate tolerated it as unrelated dirt, and Y's two-tree merge kept it. A user's next ordinary `git commit` silently reverts X.
  - The one row that could have repaired it is now permanently closed ("ref=next, checkout exactly captured old → guarded finish").
  - The cause is the admission exemption, which skips destination conflicts with every same-authority Land chain, whatever its phase. Pre-attempt chains are already closed by the abandon loop just above it. So in practice the exemption only waives blocking for post-attempt chains, and §10 rule 4 gives Land no supersession of those.
- **Fix:**
  - In `admission_with_land`, keep the exemption only when the unresolved chain has no TargetAttempt, or when the current destination tip is neither that chain's `next` nor a descendant of it.
  - When the tip equals the chain's `next`, return `resource-recovery-required` naming that id. `recover_land` can finish that row.
  - If the "TargetAttempt with ref == expected" case must not block (the reason the exemption exists), handle it by exact tip comparison, not by phase-blind exemption.
  - Optionally, add a record-only Land supersession, analogous to rule 4a, so such chains become terminal instead of pending forever. That is a spec amendment.
- **Test to add:** the probe above. It should refuse Y until X is recovered, and after recovery Y should land with `a` reconciled.

## Medium

**M1. A routine `git status` after a post-CAS crash permanently disables the exact-old finish row.** (`land.rs:1328-1331`, proof `:1090`)

- **Reproduced** (`probe_index_stat_refresh_after_post_cas_crash`): after a crash at `land-before-read-tree`, rewriting an unrelated file with the same bytes and running `git status` rewrites `.git/index` (stat refresh). `recover_land` then returns `land-checkout-recovery-required`, and no door remains.
- **Cause:** `old_index` is a fingerprint of the raw index file bytes, which include stat data. IDEs and prompts run `git status` constantly, so in practice this row is rarely reachable.
- **Fix:** capture the old index as the canonical `ls-files --stage -z` digest, which has no stat data. Compare that digest plus the existing `old_index_tree` and per-path fingerprints, and drop the raw-byte comparison. Native `index.lock` presence is already refused separately by `land_target_checkout`.

**M2. A crash between CAS and Outcome while an ignored store collision exists has no terminal recovery.** (`land.rs:707-713`, `:1290-1296`)

- **Reproduced** (`probe_store_collision_post_cas_crash`):
  - Setup: the source tracks `.fgos/store/x`, and main has an ignored local copy. Publish stops at `land-after-cas`. HEAD moved, and the ignored bytes were preserved.
  - Result: `recover_land` returns `land-checkout-fingerprints-missing`. This is permanent, even though publish deliberately leaves the checkout untouched in this case, and the right terminal state, `pendingStoreCollision` observed-only, is fully determined.
- **Fix:** record in LandVerified that checkout reconciliation is deliberately skipped (for example a proof variant `{"storeCollision": true}`). After read-back of `ref == next`, recovery records `Outcome::Land{checkout: "pendingStoreCollision", observed_only: true}` without touching the checkout. Add this row to the crash matrix fixture.

**M3. A pre-attempt chain left by a different writer blocks the destination, and recovery offers no way out for anyone else.** (`land.rs:396-398`, `:1146-1151`)

- **The problem:**
  - Prepare refuses with `land-abandoned-writer-mismatch` and tells the caller to use named recovery.
  - `recover_land` itself refuses any writer other than the recorded one (`land-authority-mismatch`), including for the record-only `abandonedBeforeAttempt` branch.
  - The Land authority binding is writer-independent, `(repo, "land", destination)`, and slot 20 already proves the old domain is gone.
- **Consequence:** if the recorded writer identity is never reused (for example a per-session identity), the destination is blocked for every other writer. The only escape is to impersonate the recorded writer string, which is caller-supplied and unauthenticated (`createGitLand(options.writer)`). This conflicts with "an abandoned prepare never blocks the destination permanently".
- **Fix:** in `recover_land`, allow the `!attempted` branch (record-only abandonment, evidence retained) under the destination 20/40/50/80 authority for any writer. Keep the writer equality check for post-attempt completion and for cleanup. Add a test: writer A's prepare is SIGKILLed, writer B is refused at prepare, B recovers the named id, then B lands.

## Low

- **L1. The crash matrix has no tolerated dirt.** The SIGKILL matrix (`land_crash_matrix.rs:105-170`) uses a fixture with no staged or unstaged unrelated dirt. It asserts only `a` bytes and `Checkout::Reconciled`, so the H1 preservation guarantee (staged entries kept across interrupted reconciliation and recovery) is not exercised at any kill point. Add a staged modification, a staged addition and an unstaged edit outside the footprint to the matrix fixture. At every boundary, assert their bytes plus `ls-files --stage` for those paths.
- **L2. Cleanup authorization is unauthenticated and leaves no record of what authorized deletion.** (`land.rs:1408-1551`)
  - Any caller passing the recorded writer string and any nonempty acknowledgement deletes the candidate and pins, and compacts the chain.
  - Evidence safety itself holds:
    - The candidate must be clean, not live and in custody.
    - It must be reachable from a non-`refs/fgos/` ref (`worktree.rs:886-898`).
    - Pins are removed only after the worktree, by exact-old delete.
    - A live session's slot excludes cleanup.
  - However, the acknowledgement value is neither recorded in the WAL nor in the compact ledger. Record its digest in the cleanup or compaction record so that a later audit can see what authorized deletion.
- **L3. Abandoned and lost candidates have no cleanup door.** `acknowledge_land` returns `land-cleanup-deferred: no delivered candidate proof` for `AbandonedBeforeAttempt` and `Loss`. Every rejected verification therefore leaves one worktree and three pins forever, and pins keep the objects alive. This is by design for now, but note it as a follow-up item.
- **L4. One recovery path skips the native index-lock check.** If the destination is no longer checked out in main at recovery time, `land_target_checkout` returns false before its `index.lock` and MERGE_HEAD checks, and recovery records `notApplicable` (`land.rs:1280-1289`). An interrupted read-tree residue in main is then not reported. This is rare, because Git refuses checkout switches while `index.lock` exists. Consider checking main's native state regardless.

## Checked and found sound

- **No CAS replay.** Recovery never reissues a target CAS (`land.rs:1176-1192`). A third tip is refused as `land-target-effect-unknown`, and reflog is never consulted. The pin rewind repair is exact-old and only applies with a Prepared record.
- **Lock order.** Recovery takes 20, then 40, then 50, checks quiescence, then takes 80. Retained native ref locks are refused (`native_lock_present`).
- **Exact-old finish cannot overwrite user bytes** in the cases I traced:
  - It requires own-path fingerprints equal to the old ones, an equal old index tree and the index fingerprint.
  - Two-tree `-u` only touches paths changed between target and candidate.
  - A new user file on an incoming path, or an ignored collision, changes the fingerprint and refuses.
  - The probes confirmed the fail-closed side.
- **Same-writer auto-abandon** cannot close a chain that is still live. A live session, recovery or cleanup holds slot 20, which `Wait::Ms(0)` refuses. The install is no-overwrite.
- **Compacted replay.** The request-digest match and `binding_digest` for Land (destination, writer, tips) are consistent, and compaction resume works under the slot and admin locks.
- **Crash matrix.**
  - Kill points are the production `FileSystem::checkpoint` seam, at real WAL, pin, CAS, read-tree and receipt boundaries.
  - The native read-tree kills use ptrace on actual syscalls.
  - There are no sleeps, and the assertions compare bytes of `a`, the index and `index.lock`.
  - The per-kill-point fresh-id check does run, but only after recovery, which is why N-H1 is not exercised.

## Unresolved questions

- N-H1: should a Land with `TargetAttempt` and `ref == expected` (outcome truly unknown) block the destination until §11, or should Land get a rule-4a-style record-only supersession? This is a spec and owner decision. The minimal safe fix (block only when tip == chain.next) does not need it.
- M3: is the different-writer refusal at prepare an intended policy? If so, which door is the "named recovery" a different writer is supposed to use?
