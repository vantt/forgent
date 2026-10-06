# Phase 6 Implementation Report — S6 + S8: atomic writes and settlement ordering

- Plan: plans/260928-2327-dispatch-engine-liveness-hardening/plan.md, "## Phase 6"
- Worktree: `.claude/worktrees/dispatch-engine-liveness-p6-atomic-writes-settlement-ordering` (branch `unit/P6`, based on `dc18f6bc0`)
- Commit: `91cc7679e` — `fix(dispatch): atomic assignment.json writes and recoverable settlement ordering (S6, S8)`
- Status: DONE

## Files modified

- `src/runner/dispatch/assignment-runner.mjs` (+13/-4): `executeAssignment`'s `assignment.json` writer now calls `publishImmutableProof` instead of a bare `fs.writeFileSync` guarded only by `!existsSync`.
- `src/runner/coordination/store.mjs` (+9/-2): `createSessionAssignmentLocked`'s `assignment.json` writer switched to the same `publishImmutableProof` primitive; added one import line.
- `src/runner/dispatch/settlement.mjs` (+53/-8): `commitRunSettlement` now recognizes "this exact control token already settled control" and completes/rehydrates the commit instead of refusing the retry as superseded. Two new params: `_afterControlSettlement` (test-only crash-simulation hook, mirrors the existing `_beforeAuthoritativePublish`) and no change to the public call contract otherwise.
- `test/runner/assignment-dispatch.test.mjs` (+211): one new fault-injection helper (`injectSingleWriteFailureForDir`) + 3 new tests (S6 x2, S8 x1).

## S6 — atomic assignment.json (Work item 1)

Both writers (`assignment-runner.mjs:1264`, `coordination/store.mjs:1052` per the audit's line numbers before drift) were `if (!existsSync) fs.writeFileSync(...)`. A crash mid-write left partial bytes; the reader (`JSON.parse`) then threw `corrupt (invalid JSON)` / `CoordinationError('corrupt-log', ...)` forever, since nothing ever rewrites an already-present `assignment.json` (immutability by design).

Fix: both writers now call `publishImmutableProof` (fsynced temp file + exclusive hard link — the same primitive already used for `result.json`/`run.json`). A crash mid-write can only ever leave the temp file behind (never linked); the target path is always either cleanly absent or fully complete.

**Merge decision (plan's "consider merging the two writers into one"):** I did NOT physically merge the two call sites into one function. They live in different layers with different surrounding contracts:
- `assignment-runner.mjs`'s writer additionally does template-snapshot resolution and, on the "already exists" branch, reads back and freezes the on-disk copy as the immutable `effectiveAssignment` for `executeAssignment`'s own use.
- `coordination/store.mjs`'s writer is a defensive re-entry guard inside `createSessionAssignmentLocked`'s crash-recovery design (documented in that function's own doc comment) and never reads back.

Physically merging these into a shared helper would require a new file outside this phase's declared file ownership (`assignment-runner.mjs`, `coordination/store.mjs`, `settlement.mjs` only), and the audit's own "real simplicity gap" framing is about the two writers using two **different, both-broken primitives** — not that a single call site is architecturally required. I closed the actual duplication by having both call the **same existing atomic primitive** (`publishImmutableProof`, already exported from `proof-helpers.mjs`) rather than inventing two independent fixes. This is the smaller real diff and stays inside the phase's file-ownership boundary. Flagging this as a judgment call in case Lead wants the physical-merge form instead.

**Recoverability differs by call site — evidenced, not assumed:**
- `assignment-runner.mjs`: a retry (`executeAssignment` called again with the same Assignment) now **fully self-heals** — `!fs.existsSync` is true again since the interrupted write left nothing, so the retry re-attempts fresh and succeeds. Proven by test.
- `coordination/store.mjs`: `createSessionAssignmentLocked`'s own doc comment (lines ~740-786) documents "claim record exists, `assignment.json` absent" as an **already-intentional, loud, safe terminal failure** for a crash *before* the write — self-heal is explicitly scoped to *after* `assignment.json` exists (a different crash window). My fix converts the *previously-undefined* "corrupt garbage bytes, unreadable" failure mode into that same well-defined, already-documented "absent" state — it does not add new single-call self-heal for this specific writer, because that would be new scope beyond an atomicity fix (e.g., reclaiming/cleaning a stale claim), not what S6 asks for. Verified via `coordination-store.test.mjs`'s own pre-existing test `"crash between claim-record write and assignment.json write: retry with the same taskKey throws CoordinationError('corrupt-log'), never a second Assignment"`, which still passes unchanged after my fix.

## S8 — settlement ordering (Work item 2)

`commitRunSettlement` (settlement.mjs) called `settleRunControl` (publishes the `'settled'` generation) before `publishImmutableProof(result.json)`. A crash in that window left control permanently `'settled'` with no `result.json`.

**Chose "make control-settlement recoverable" over "reorder", with evidence, not just per the plan's suggestion:**

I first checked whether reordering (publish `result.json` first, settle control second) is the smaller diff, since the plan explicitly allows either. Reordering is **unsafe**: `settleRunControl`'s CAS is what fences a stale/zombie controller (one that lost a `acquireRunControl` race to a newer controller after being presumed dead) from ever writing an authoritative `result.json`. `publishImmutableProof`'s own hard-link/EEXIST guard provides mutual exclusion between writers but has no knowledge of control tokens — if publish ran before the CAS, a superseded controller could win the hard-link race and permanently commit a stale result before its own (now-losing) `settleRunControl` call ever got a chance to refuse it. The existing TOCTOU test (`"...proves stale controller cannot overwrite authoritative result.json..."`) exists specifically to catch this class of regression, so reordering was rejected on that evidence, not assumption.

Also: `run-lock.mjs` and `reconciliation-planner.mjs` (which owns `repair-projection`'s "no terminal result exists yet to prove settlement" refusal — confirmed by reading `reconciliation-planner.mjs:482-506`) are both **out of my file ownership** for this phase, ruling out fixing `acquireRunControl`'s `purpose === 'settled'` short-circuit or `repair-projection`'s result-required precondition directly.

Fix, entirely inside `settlement.mjs` (imports two already-exported read-only helpers from `run-lock.mjs`, `controlDirs`/`currentGeneration` — no edits to that file): `commitRunSettlement` now reads the current control generation up front. If it is `purpose: 'settled'` with the **same `controlToken`** and `settledEpoch === controlEpoch` as the caller's own — a shape only reachable if this exact caller (or a caller holding the identical token) already settled it — it skips the redundant `isRunControlCurrent`/`settleRunControl` re-check/re-call (which would otherwise always fail: `settleRunControl` always publishes settlement as `current.epoch + 1`, so a bare retry with the original epoch reads as "not current" and is refused as superseded forever, matching the audit's "can neither resume nor repair" finding) and proceeds straight to `publishImmutableProof`. If that publish also finds the file already there (a duplicate/concurrent resumed attempt), it rehydrates via `interpretRunResult` instead of throwing. A genuinely different (newer) controller's token never matches, so it is unaffected and still refused exactly as before — verified by all 3 pre-existing TOCTOU/CAS tests passing unchanged.

## Tests added

1. `executeAssignment: an interrupted assignment.json publish leaves it cleanly absent, and a retry recovers instead of permanently bricking the Assignment (S6)` — fault-injects a crash on the exact `fs.writeSync` call `publishImmutableProof`'s temp-file step performs, proves `assignment.json` is absent (not corrupt) afterward, then proves a retry fully completes `executeAssignment` and produces a valid file.
2. `createSessionAssignment: an interrupted assignment.json publish leaves it cleanly absent rather than corrupt-but-unreadable (S6, coordination/store.mjs writer)` — same fault-injection pattern against `coordination/store.mjs`'s writer; proves the target is absent, not garbled.
3. `commitRunSettlement: a crash between control-settlement and result-publication is recoverable, not permanently stuck (S8)` — uses the new `_afterControlSettlement` test hook to throw exactly between `settleRunControl` and `publishImmutableProof`; proves (a) `result.json` never lands, (b) a fresh `acquireRunControl` is refused with `status: 'settled'` (reproducing the audit's exact "stuck" symptom), (c) a retry with the same token completes the commit, (d) a further idempotent retry rehydrates rather than throwing.

All three reproduce the audit's own crash-window shape against the real production module (`commitRunSettlement`, `executeAssignment`, `createSessionAssignment`), not a mock, per the plan's verification strategy.

## Tests status

- Targeted run (`node --test --test-name-pattern="S6|S8"` + `TOCTOU|superseded|R5|isolation`): 10/10 pass.
- `test/runner/assignment-dispatch.test.mjs` full file: 81/81 pass.
- `test/runner/coordination-store-fault-injection.test.mjs` + `test/runner/coordination-store.test.mjs`: 52/52 pass (including the pre-existing "crash between claim-record write and assignment.json write" test, confirming the documented absent-case behavior is unchanged).
- Full suite (`env -u CLAUDE_CODE_SESSION_ID npm test`): 8002 tests, 7878 pass, 51 fail, 0 cancelled, 8 skipped, 65 todo. **All 51 failures are in `test/rust-host/*`** (`fgctl-init`, `fgctl-stage`, `fgctl-upgrade`, `release-tree`), all failing with `Compiled Rust binary not found at .../target/release/fgos` / `fgctl binary must exist at .../target/release/fgctl` — this worktree has no `cargo build --release --workspace` run, a pre-existing environment gap unrelated to this phase's JS-only diff (confirmed the failing test files are 100% rust-host, zero overlap with dispatch/coordination/settlement).

## Deviations from the phase spec

- Did not physically merge the two `assignment.json` writers into one function (see "Merge decision" above) — same underlying atomic primitive, two call sites, for the reasons given.
- S6 fix for `coordination/store.mjs` closes the "corrupt garbage" failure mode but not full single-retry self-heal for a crash before `assignment.json` exists — that state was already an intentional, documented terminal failure in `createSessionAssignmentLocked`'s own doc comment, not something S6 asked to change.

## Unresolved questions

None — both work items and the exit criteria (real tests proving recovery from a simulated crash at the exact window each finding names) are closed. Flagging the merge-vs-shared-primitive choice above for Lead's awareness, not as a blocker.
