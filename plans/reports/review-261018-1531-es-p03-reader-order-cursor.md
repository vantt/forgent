# Review: Event Store phase 03 (reader, walk, order, cursor) and Git resolve_head/list_tree

- Branch `event-store/p03-reader`, base `7162365bb`, head `176cd4eeb`. Read-only review.
- Contract read: phase-03 plan, event-store spec §7-§12, §14, §15, §18 and plan D10/D17/D18, Git spec §3, §4 (C1), §7, phase-lead report u3, design principles.
- Gates re-run in a private target dir: `cargo test --locked -p fgos-event-store -p fgos-git -- --test-threads=1` gave 124 passed, 0 failed, 1 ignored. `cargo clippy ... -D warnings` passed. `cargo fmt --check` passed.
- `impact-analysis`: not used. This review reads code and does not edit it.

## Verdict

Not ready to merge as it stands. Ordering is sound: Kahn sort, deferral, C3, C4 and C5, and the Git additions follow the driver patterns. Two High findings and eight Medium findings sit in the read pipeline (`read.rs`, `cursor.rs`). The model re-check (plan step 5) has not run yet.

## Critical

None.

## High

**H1. Fold answer compares two different coordinate systems. With legacy history present it never returns `Incremental`.** `read.rs:375-394`, `cursor.rs:325-336`.
`full_order` is the legacy identities followed by the v4 hashes. `old_order` holds only the hashes of `req.folded`, which is v4 `Envelope`s and cannot contain legacy events. When legacy events exist (every migrated Work repository, since `project` reads the legacy ref), `old_order[0]` (v4) is compared with `full_order[0]` (legacy). The result is `first == 0`, so the answer is always `RebuildRequired { first_difference: 0 }`. `first_difference` is also an index into legacy+v4, while the consumer folds only v4. Spec §12 and §15 promise `Incremental` in the proven case, and this breaks that promise in the main post-cutover configuration: every catch-up refolds from zero. No test covers legacy together with an incremental fold (`cursor_incremental.rs:125` has no legacy).
*Fix:* compute `first` over the v4 order only (`ordered.events` against `folded`). A legacy change is already caught by `legacy_tips`. If replay positions must include legacy, build `old_order` from legacy plus folded instead. Add a test that has legacy history plus a proven own-stream append and asserts `Incremental`.

**H2. `reconcile_durable_history` writes the receipt before its overlap check, and compares positions without comparing content.** `read.rs:479-503`.
(a) `sealed.json` with `lastSeq = high` is written durably at line 494. The overlap refusal comes after it, at line 498. The L5 test asserts this left-behind state (`cursor_incremental.rs:206-211`: the call is refused and the receipt is already 1). Take the L5 case, where a stream restarted at seq 1 with *different* events. Once that local batch rotates, the segment ends at or below the receipt. §9 step 4 then treats it as "published and awaiting deletion", and the §10 recovery row "after the receipt, before the delete" deletes it with no hash check. Acked, unpublished events are lost as soon as phase 04's seal follows the table.
(b) A legitimate overlap is refused. After the crash "after update-ref, before the receipt", the closed segment holds the same events as the ref. The check `local.events.iter().any(|e| e.seq <= high)` refuses it until a seal deletes the segment.
*Fix:* do the overlap check under the same append guard and before the receipt write. Compare every local event at or below `high` with the walked own event at the same position by `h`. Identical events are published and awaiting deletion, so write the receipt. Distinct events: refuse with `event-store-seq-recovery-conflict` and write nothing. Change the L5 test so it asserts that no receipt is written on refusal, and add an identical-overlap case.

## Medium

**M1. Certification, the only pruning rule, is effectively disabled whenever the walk sees an event outside the request.** `read.rs:354-364`, `walk.rs:119-124`, `read.rs:45-126`.
`walk` returns events of every stream on every event ref. Coverage only holds requested and emitted streams. Hidden (unpromoted) branch events are never emitted. So `walked.events.iter().all(|e| cover >= e.seq)` is false, and no commit is certified, when any of these hold:
- a second stream exists (for example `project:porting` while Work reads `project`);
- any branch-events ref has events beyond its last promote, which includes orphans, and §7 says nothing promotes those automatically;
- local-events refs exist during a project read.

Every read then walks O(V+E) with two Git reads per commit, and the mirror walks (`read.rs:299-311`) repeat that work. `tips()` also takes every event ref as a tip, while §11 step 3 reads only "each ref that can carry a requested stream". For a project read, branch events reach the project only through a promote commit's second parent, so branch-events refs should not be tips there at all. Correctness holds (the behaviour is conservative). The cost misses §11 Termination ("visits the commits added since the last complete walk") and the plan's 2 s rebuild threshold.
*Fix:*
- select tips by the scopes of the requested streams;
- leave branch-events refs out of project reads;
- filter walked events to the query (requested streams, plus branch streams named by promotes) before the certification check.

The cursor is bound to `streams` and `project_order`, so certifying across non-requested streams is safe. Add a test with two streams where the second read of one stream visits only the new commits.

**M2. D17 machine and scope checks are applied to the tip only.** `read.rs:277-279`, `walk.rs:84-125`, `walk.rs:181-182`.
D17 says "a seal's `machineId` equals its ref's machine-id segment" and "only `project` scope on `events` refs". Ancestors are never checked. The comment that ancestors can belong to other machines is wrong for this protocol: sync merges the own ref only with the mirror of the *same* machine id (§14 step 3), and a promote's second parent is the same machine's branch ref. A remote accident that splices a seal with another `machineId`, or a `local`-scope seal, under a valid tip is emitted without complaint.
*Fix:* walk per tip, or carry the tip's machine through the walk. Check every seal and merge for `machineId == segment`. Require seal scope `Project`, except for commits reached through a promote second parent, which must be `Branch` from the same machine. Add a named test for the spliced-ancestor case.

**M3. The own-origin mirror check trusts only the local receipt cache.** `read.rs:318-321`.
`read_last_seq(sealed.json).unwrap_or(0)`: when `sealed.json` is lost (the P02 L5 state), any mirror of the own ref carrying own seals gives `event-store-ref-tampered`, and doctor fails, unless `reconcile_durable_history` happened to run first. §8 calls `sealed.json` "a cache, verified against the ref".
*Fix:* compare with the larger of the receipt and the own ref's walked `published` high for that stream. Better, run the reconciliation from the read path when the receipt is missing.

**M4. Legacy path selection at HEAD accepts root-level files of the user's project.** `read.rs:149-161`, `171-177`.
The same filter serves the HEAD source and the legacy-ref source. At HEAD it also accepts `events.jsonl`, `events/**.jsonl` and `porting/events.jsonl` at the repository root. fgOS runs on other projects (mission #1), and a project that tracks its own `events/*.jsonl` would have those files parsed as fgOS history: either every read fails on parse, or foreign lines are ingested. The filter also accepts nested `events/a/b.jsonl`, while `src/state/replay.mjs:838-852` reads only direct children of `events/`. That breaks the "exactly as replay.mjs" rule of §12 placement 1.
*Fix:* use one path set per source:
- HEAD: `.fgos/events.jsonl`, `.fgos/events/<name>.jsonl` (one level), and the porting path;
- legacy ref: the §18 names (`events.jsonl`, `events/<name>.jsonl`, `porting/events.jsonl`).

**M5. A fence with no legacy ref is reported as tampering.** `read.rs:228-233`.
A fresh clone pulls main (which carries the tracked fence) before the refspec fetches `refs/fgos/legacy`. That is a normal state in D10, which names `event-store-refspec-missing` for it. The code returns `event-store-ref-tampered`, so doctor would report tampering on every fresh clone.
*Fix:* when `refs.is_empty()` and a fence exists, return a distinct code (refspec missing, or legacy not fetched). Keep `ref-tampered` for an OID mismatch.

**M6. The legacy HEAD read lists the whole repository tree on every page.** `read.rs:144`, `packages/git/rust/src/driver.rs` (`list_tree`).
`list_tree` runs `ls-tree -r -t -z --full-tree <rev>` over the full revision on every page and filters by prefix in Rust. `legacy_files` passes prefix `b""`, so the cost is O(N²/1024), and on a large repository the 64 MiB capture refusal fails the whole read. That violates the "reads are bounded/paginated" intent of Git §3 for this use.
*Fix:* in Git, scope `ls-tree` to the prefix's subtree (resolve `<rev>:<dir>` to a tree OID, or use a `:(literal)` pathspec) so Git does not output the full tree. In Event Store, pass `.fgos/` (HEAD) or the legacy roots.

**M7. The Git additions sit on the Publication trait, and the reader needs writer authority.** `packages/git/rust/src/lib.rs:296-304`, `publication.rs:973-985`, `publication.rs:96-110`.
Git spec §4 says Publication has "no index, worktree, HEAD", and §3's Inspect table does not list `resolveHead` or `listTree` (the phase lead already flagged that the docs are pending). `read()` and `reconcile_durable_history()` take `&dyn Publication`, which only `PublicationPort` implements, and building one validates an `event-seal` handle (`HolderAuthority::bind`). So every outside-gate read must hold event-seal, the same lock sync holds across fetch and push (§14). `fgos list` catch-up then waits on the network. Spec §11 does not put reads under event-seal, and its active→closed→ref argument exists precisely so reads can run concurrently with a seal.
*Fix:* this needs a decision from the Git lead. Either let `read()` take `&dyn Inspect` with an Inspect-level commit walk (Inspect "ancestry"), or record in both specs that reads borrow event-seal and accept the wait. Amend Git §3 and §4 for the two new reads either way.

**M8. Every Git failure becomes `event-store-gap`.** `walk.rs:11-13`.
In §11, `event-store-gap` means corruption ("never skipped", doctor fails). Spawn failures, timeouts, promisor or shallow layout refusals and a `list_refs` page error all arrive as corruption.
*Fix:* map Git errors to an unavailable or I/O code that carries `cause`. Keep `EventStoreGap` for contiguity holes.

## Low

- **L1.** `order.rs:23-29`, `187-196` together with `read.rs:333-336`: a `seen` predecessor in a stream the caller did not request counts as missing. Its event, and every event after it, then stays deferred permanently, even though the walk fetched that stream and `retain` dropped it. This is harmless while each consumer's `seen` names only its own query's streams. Either state that invariant or keep predecessor streams in the ordering set.
- **L2.** `read.rs:360`: `certified` takes every visited commit, so the cursor grows O(V). Consumers store it verbatim, and `walk_commits` digests the full stop set on every page. Keeping the frontier (the walk's tips) is enough under §11.
- **L3.** `walk.rs:84`, `99`, `read.rs:278`: two separate `read_paths_at` calls per commit, plus a header re-read for every tip. Batch `seal.json` and `events.jsonl` (the port already accepts several paths) to cut the number of Git spawns on rebuild.
- **L4.** `run-gates.sh:4` runs `cargo fmt`, which rewrites sources. A gate should run `cargo fmt --check`.
- **L5.** `cursor.rs:268`, `306-308`: `emitted` duplicates `cover`, and `parse` requires the two to be equal. Keep one field (DRY, one source of truth).
- **L6.** `read.rs:68-74`: the mirror parse assumes the remote name has no `/`. Mirrors under a remote such as `a/b` are dropped without notice instead of being refused.
- **L7.** `read.rs:491-495`: the receipt JSON is built by hand and lacks the §10 step 2.4 fields `sha256` and `firstSeq`. A durable-write error is mapped to `invalid`, which loses the I/O code. Phase 04's receipt writer should be the one place that writes `sealed.json`.
- **L8.** Plan scope still open before merge:
  - Requirement 10 and step 5: the model re-check and `packages/event-store/proofs/model/` are absent.
  - The named files `deferral.rs` and `v_seq_store.rs` were folded into `order_kahn.rs`, which is acceptable but should be recorded.
  - V-SEQ-01 "random 10,000 above 7" was run at nine events only.
  - The coordinator docs are not updated: Git spec §3 and §4, CHANGELOG and the board.
- **L9 (info).** The Kahn key compares `seq` as a number (`order.rs:12-15`), while §12 says "as bytes". The number is correct (decimal bytes would sort 10 before 9), so fix the spec wording.
- **L10 (info).** When both `project` and `project:porting` are requested, the legacy events of both are merged into one `(ts, file, seq)` order. Today's Node code orders each directory separately.

## Verified, no finding

- **C3.** No pairwise comparator in v4 ordering. `ready` is a `BTreeSet<(Key, node)>`. The only sort is the single-stream `members.sort_by_key(seq)`. The legacy comparator is the prefix that §12 allows.
- **C4.** The walk prunes only at certified commits (`walk.rs:81`), and the C4 vector, including a real promote second parent, is tested against real refs.
- **C5.** Deferral spreads to dependents through `next`. The `throughSeq` of a promote with a missing tail defers it. Deferred nodes stay in the cycle check. A read with anything deferred certifies nothing and raises no coverage for those events.
- **C6.** A late foreign event gives `RebuildRequired` at 0, and the suffix replay equals a rebuild. This holds without legacy; see H1.
- **Termination.** Git paginates with continuation, and the Rust `visited` set skips repeats. An incomplete page with no continuation is refused. On error the input cursor is untouched, which is tested.
- **Panics.** The remaining `unwrap`s in the new code cannot fail (the prefix was already matched, the page is known to be non-empty). No `unwrap` sits on an I/O result.
- **Tests.** They use real temporary repositories through `GitDriver` and `PublicationPort`. There is no in-memory double and no environment bypass.
- **D17 checks that do exist.**
  - Event origin and stream equal the seal header (`decode` with strict framing).
  - Scope, range and count equal the header.
  - Segment digest.
  - Merge parents equal the commit's parents.
  - Mirror rewind keeps the old cursor.
  - Legacy fence OID, seal digest and `fromCommit`.
- **Git additions.**
  - Hardened `invoke` (no replace objects, no lazy fetch, optional locks off, hooks path).
  - `--git-dir` per worktree, so HEAD belongs to the worktree.
  - `ls-tree -z` with literal byte-prefix selection.
  - Bounded output and a 30 s timeout.
  - Named refusals: `invalid-tree-bounds`, `tree-cursor-query-mismatch`, `head-changed-during-read`, and the layout refusals.
  - The tree cursor is bound to its revision and prefix.
  - SHA-1/SHA-256 × files/reftable, plus detached linked worktree and unborn HEAD, are tested.

Status: DONE_WITH_CONCERNS
Summary: Ordering, deferral and the Git additions match the spec. The read pipeline has two High defects: the fold answer can never be incremental once legacy history exists, and receipt reconciliation writes `sealed.json` before its overlap check. Eight Medium findings follow.
