# Re-review: Event Store phase 08 review fixes (10bf3e375..9bde6cf19)

Read-only re-review. I read the first review, the fix report, the full code and test diff, the spec delta (§15/§18/§21 text in `docs/platform/event-store/spec.md`), and checked the adapter against Git 05's real code on `git/p05-commit-sync` (tip 44ea50358): `scoped_commit.rs`, `refs.rs` (`failure`/`recovery`), `driver.rs` (`Output::error`), the napi `operation()` envelope, and the WAL `Outcome` serde tags. I ran no builds or tests, because they write `target/` and fixtures in the worktree.

**Verdict:** there are no Critical findings. There is one High: the H2 stale-import replacement swaps the local legacy ref *before* it checks the mirror refs. The result is a divergent local ref that wedges the next run, which is the H2 problem coming back through a different door. Two Mediums: attempt-id selection does not run under event-seal, and local filesystem failures no longer restore the work tree. The other original findings are fixed.

## Verification of the original findings

- **H1: fixed.** `cutoverFailure` (`src/verbs/events/migrate.mjs:165-170`) restores only when `code === 'refused'` and the cause is in an explicit allow-list, or when the bare code is in that list. I checked the list against Git 05:
  - Every listed cause is a `failure(...)`/`out.error(...)` (code `refused`) raised either before staging, or inside `prepared` after Git's own `reset` and snapshot restore. That covers `literal-path-staging-failed`, `staged-set-mismatch` and `commit-rejected`.
  - Every recovery-class cause (`commit-effect-unknown`, `commit-unstage-recovery-required`, `commit-worktree-restore-required`, `commit-attempt-recovery-required`, `commit-prepared-state-changed`) carries code `recovery-required`, so none of them restores.
  - Codes not on the list fail closed: `operation-id-reused`, `checkout-command-failed`, arbitrary `.map_err(failure)` I/O causes, and non-JSON errors. The napi envelope (`{"code","cause",...}` via `Error::from_reason`) matches the parser.
- **H2: partly fixed.** Per-attempt ids work: `cutover_operation_id` skips only settled `commitRejected` and `abandonedBeforeAttempt`, and keeps the id when an outcome is in flight or unknown, so Git's refusal stays binding. The serde tags match Git 05's `Outcome`. Replacing a local-only stale import under event-seal with an observed-OID CAS also works. The replacement does introduce a new wedge; see High-1.
- **H3: fixed.** Unborn HEAD passes. With no fence and no retired paths, the doctor passes with `warning: null`. Retired paths with no fence produce a warning (`event-store-checks.mjs:57`). A fence with any disagreement, or coexisting with retired paths, fails. Fresh projects do not fail; `migrate.test.mjs` covers unborn and fresh-commit layouts.
- **M1: fixed.** The unfenced branch of `read.rs:202-210` reads only HEAD, through `read_consumer_from_head`. Legacy-ref names serve as root hints and never as bytes. The test covers stale local and mirror refs.
- **M2: fixed.** Pages are 100,000 entries. Admission and reads use consumer roots, and full discovery stays in migrate and the doctor. Low-3 below covers one consequence.
- **M3: fixed.** Porting lines go to the single historical log. Multiple logs refuse. Parity runs on the exported bytes, the test reads the result through `listPorting`, and §18 documents the path mapping.
- **M4: fixed.** `hostScan` fails on any non-clean scan once `createGitScopedCommit` exists. The one exception is the exact PID-namespace refusal with zero blockers.
- **L1 through L8: fixed as described.** L7 calls `recover_publications` under seal before the ref is read.

## Critical

None.

## High

**High-1. The stale-import replacement can overwrite or create the local legacy ref when a published, pushed import exists, and it leaves the ref changed when it then refuses.**
- Where: `packages/event-store/rust/src/legacy_import.rs:387-436`. The local CAS runs at lines 389-408. The check that local and mirror refs equal the computed OID runs afterwards, at lines 417-436.
- **Scenario A.** Machine A migrates and pushes `refs/fgos/legacy`, which is fenced in A's commit. Machine B fetched the mirror but is still on the pre-cutover main, and runs `fgos events migrate`.
  - B's HEAD has no fence, so `inv.migrated` is false. B's local ref is `Absent`, so B creates its own import by CAS. Only then does B refuse with "published legacy refs disagree".
  - B is left with a local `refs/fgos/legacy` that differs from the fenced import. After B pulls main, `write_readiness` refuses with `event-store-refspec-missing`, and the doctor fails. The only way out is a manual `git update-ref -d`.
- **Scenario B.** This one follows spec §18. A cutover commit is reverted before main is pushed, but `sync` already pushed the legacy ref, because `sync.rs:458` pushes the local ref when the mirror is absent.
  - The next migrate, on the new HEAD, replaces the local ref and then refuses on the mirror. Every rerun after that refuses the same way.
  - This contradicts the new spec sentence "No manual ref deletion is required". It also breaks the brief's rule that the replacement must never replace a published-and-pushed import.
- **Fix:**
  - List the local and mirror legacy refs *before* the CAS, under the same seal guard.
  - If any mirror legacy ref exists and differs from the computed OID, refuse with `EventStoreLegacyMismatch` before any ref write. Do the same if the observed local OID equals any mirror's OID, because that import was published.
  - Name the recovery in the refusal: pull the fenced main, or decide as owner on the remote ref.
  - Have `--check` (the `importPlan` action and the `existingLegacyOid` napi field) report mirror disagreement too, so check and the real run agree.
  - Add a test: set a mirror ref to a stale import, run `importLegacy`, and assert that it refuses and that `refs/fgos/legacy` is byte-unchanged (absent, or the old OID).

## Medium

**Medium-1. The attempt id is not selected under event-seal.**
- Where: `packages/git/node-addon/src/event_store.rs:547`, which calls `cutover_operation_id` from `read_legacy_from_head`, and `legacy_import.rs:615-645`.
- Problem: the selection holds no lock. The coordinator decision requires it to run under event-seal.
- Today the true arbiter is Git: `wal.known_id` and `begin` refuse a duplicate id. A collision between two concurrent migrate runs therefore fails closed, as `commit-attempt-recovery-required`. But that path is recovery-class, so the losing run keeps its deleted and fenced work tree without restoring it.
- Moving the scan under the seal alone is not enough either, because the seal is dropped before `scoped.commit`, so two serialized runs can still read the same free slot.
- Fix: select the id inside `import_legacy` while the seal guard is held, and return it in `pin`. Then either keep a seal-scoped reservation, such as a marker or the WAL intent, until the commit is attempted, or state in §21 that a concurrent migrate is excluded by the quiesce gate. In the second case, confirm that `checkStopped` actually reports a second `fgos events migrate` process.

**Medium-2. Local failures before `scoped.commit` no longer restore the work tree.**
- Where: `src/verbs/events/migrate.mjs:107-128`.
- Problem: an `fs.unlinkSync`/`put`/`unlinkSync('.gitattributes')` error (for example `EACCES` or `ENOENT` halfway through the deletion loop) carries a Node code that is not on the allow-list. The tree is left half-deleted, and the message points at a Git record that does not exist. Before the fix, these cases restored, and that is safe here: nothing is staged and HEAD has not moved.
- Fix: set a `commitCalled` flag immediately before `scoped.commit(...)`. Treat any error thrown before that flag as restorable, keeping the existing HEAD-unchanged guard. Use `cutoverFailure` only for errors thrown from the commit. Append the "inspect Git ScopedCommit record" text only when the commit was called.

## Low

- **Low-1. `importPlan` re-implements Git's tree and commit hashing in JS** (`migrate.mjs:139-158`). This duplicates Rust's `tree`/`event_commit` construction, which goes against design principles 1 and 7 and RUL104 "not bigger". A divergence fails closed, by refusing every migrate, so the risk is only availability. Fix: have the napi `readLegacyFromHead` return the computed data-tree and commit OIDs from Rust, hashing without writing objects, and drop the JS hasher.
- **Low-2. `cutover_operation_id` decodes outcomes by round-tripping them through serde to tag strings** (`legacy_import.rs:635-640`). Once Git 05 is in the same crate graph, match `Outcome::CommitRejected { .. } | Outcome::AbandonedBeforeAttempt` directly. Also note that a settled `commit` outcome whose HEAD was later reset by hand keeps that id forever, which means a permanent recovery refusal for that HEAD. That is fail-closed, but undocumented.
- **Low-3. Write admission now uses consumer roots.** `write_readiness` (`legacy_import.rs:478`) uses `consumer_inventory`. A porting log outside `.fgos/`, `docs/distillery/state/porting/` or `porting/` is seen by migrate and the doctor but not by admission, so v4 writes can be admitted on such a project, and migrate then refuses with "published v4 events exist before cutover". The read roots match the pre-phase behaviour, so this is not a read regression. Fix: include the configured porting directory in the consumer roots, or document that the doctor warning is the guard.
- **Low-4. The post-commit L1 check can report a successful commit as a failure.** It calls `readLegacyFromHead` (`migrate.mjs:116`), which also opens the WAL. If that call throws after a successful commit, the error is reported as a failure. No restore happens, so this is safe, but the message is misleading. Compare HEAD with a plain inventory read, or use `result.oid`.

## Layering and configuration

No new configuration, environment variable, Git subprocess adapter or mock was found. `migrate.mjs` reaches Git only through `src/git/index.mjs`.

## Tests not run

These are unverified by me: the fix report's Rust result (26 passing, clippy clean) and its Node result (56 of 58 passing, two skips gated on the Git 05 export). The two real-hook tests, including rejected-then-retried, cannot run until Git 05 is merged.

## Unresolved questions

- For High-1, should a mirror holding a different import be a plain refusal with a named recovery step, or an owner decision question when the mirror's import is unfenced?
