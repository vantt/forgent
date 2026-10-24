# WORK lead: read and append cost (wave 4)

Branch `work/es-cutover`, tip `9b5eae9dd` before this report. **No product code, test or spec changed.** Every lever in scope either failed the conditions TEST set or is already pinned by the spec. The only commit is this report.

Coordinator corrections applied: item 2 dropped (no reader of `.git/refs` or `packed-refs` written anywhere); item 3 only with a contract line plus a crash proof; item 1 only from a recorded migration fact.

## Item 1: skip the HEAD/legacy probe: not possible exactly

What the read needs HEAD for (`read.rs` `legacy_view` -> `read_legacy`): the legacy history is a function of the HEAD commit of the trusted main checkout. Two branches: a tracked fence `.fgos/events` at HEAD (then events come from the pinned legacy ref), or no fence and tracked legacy files at HEAD (`legacy_import::read_consumer_at`). Both are properties of the HEAD commit's tree.

Recorded facts that exist without looking at HEAD, and why none proves "no legacy view":
- `refs/fgos/legacy` present: only says an import was published. HEAD may still be a pre-cutover commit (checkout, old worktree commit, a revert of the cutover commit) whose tracked files must be read; spec section 11 and the 2026-10-23 repeat-read note: "a moved HEAD names another commit".
- The fence: lives in HEAD's tree, so reading it needs HEAD.
- Cutover receipts in the Git WAL (`event-store-cutover-<head>`): per attempt and per commit, not a statement about the current HEAD.
- Absence of files: excluded by the correction.

So any skip would make a read miss legacy events after HEAD moves, which the repeat-read memo tests rely on being observed (`read_memo.rs`, HEAD that moves to other legacy files). Dropped; no spec line, no test.

What a cheap, exact HEAD observation from the Git port would need (for HARDEN, `driver.rs` `resolve_head`, today 3 spawns: `symbolic-ref`, `rev-parse --verify HEAD^{commit}`, `symbolic-ref` again):
- One spawn for tips plus attached HEAD: the ref listing already runs `for-each-ref` over all refs. Adding `%(HEAD)` (marks the checked-out branch) and listing `refs/heads/` as well gives, in one snapshot, the attached branch and its oid. That also replaces the before/after race check, since a single listing is atomic. Detached and unborn HEAD fall back to the current 3-call path (rare).
- Caveat to keep: `HEAD^{commit}` also proves the object exists and peels tags; a branch tip from the listing needs no peel, a detached HEAD does (so it stays on the existing path).
- Shape: one port method returning `(Vec<RefEntry>, HeadFact)` for the same prefixes, so the store makes 1 process per read instead of 4. That is about 3 of 4.8 spawns per read, about 25 percent of the gap per the attribution report.

## Item 2: ref-tip probe without git: dropped by coordinator

Not started. Nothing written. Need from the Git port (same method as above): a ref observation that does not spawn for an unchanged store, exact on every call. That cannot be built correctly outside the driver (reftable, packed-refs, symbolic refs, worktree-private refs), so it belongs to HARDEN.

## Item 3: append fsyncs: none can go

Measured (strace, `announce line`, event-store paths under `.git/fgos/events`): 68 fsyncs for the case. Steady-state append is exactly 3: `active.jsonl`, the stream directory, the store root. The rest are first creation, rotation (`closed/`, stream dir, `hwm.json` tmp/rename/dir) and seal (receipt, `closed/` and stream dir after delete), each a named barrier in spec sections 9 and 10.

Candidates for removal and why they stay:
- Stream directory and store root on every append: spec "Append keeps the active-file, stream-directory and store-root durability barriers. The store root is synced on every append: an existing stream directory may have been created by a predecessor killed before its parent was synced", and "Append retains all three steady-state fsyncs". The contract line says the opposite of "not needed". Owning proofs: `p02_review.rs` `steady_append_performs_three_real_fsyncs_and_no_hint_replacement` and `interrupted_stream_creation_requires_root_barrier_before_ack`. A same-process "already synced" memo would need to be keyed on directory identity, and inode reuse after delete and recreate makes that not exact.
- Rotation and seal barriers: spec section 10 steps 1, 2.4, 2.5; covered by `kill_append.rs` rotation and `append_recovery.rs`.

Nothing removed; no crash proof added (it would pin an fsync that stays).

## Counts

Single case `announce line`, tip `9b5eae9dd`, release addon, strace on execve/fsync (load not controlled): 68 event-store fsyncs; git `execve` lines (bwrap-wrapped, so a spawn can show twice): 783. Before equals after, since nothing changed. Per read: 4 processes on a repeat read (1 ref listing + 3 `resolve_head`), as in the wave 3 report. The whole `loop.test.mjs` was not run (no change to measure), so no message to `main` was needed.

## Tests

None run: no source change. Working tree has no changes except this report. Census untouched.

## Concerns

- The 1.2x bar cannot be met by WORK-owned levers alone. What remains is outside WORK: the HEAD observation (Git port, about 25 percent of the gap), seal cadence (owner rule), publication ceremony and object writes (Git lane), the post-publish verification walk (kept deliberately).
- Unmeasured: Rust-side CPU in read and seal (the attribution report's open question).

Status: DONE_WITH_CONCERNS
Summary: No WORK-owned lever survives the conditions: no recorded fact proves an empty legacy view, the ref probe was dropped, and the three steady fsyncs are a spec-pinned contract with owning proofs. Report lists what the Git port needs (one listing with attached HEAD) to remove 3 of 4 spawns per read.
Concerns/Blockers: 1.2x target depends on HARDEN's HEAD observation and the owner's seal-cadence decision.
