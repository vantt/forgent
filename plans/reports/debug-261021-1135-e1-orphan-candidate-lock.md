# E1 orphan `candidate.lock` — diagnosis

Worktree: git-p07 (branch git/p07-switch). No production edits, no commits. Scratch: /home/vantt/.claude/jobs/e1505f04/tmp/e1-lock/.

## Executive summary

- The orphan lock is NOT the in-flight operation's pin. It belongs to an OLD, already-terminal operation whose pin is being RELEASED (deleted) by deferred compaction, run from `admit_pending` before the new op's Intent. The interrupted command is `git update-ref -d refs/fgos/git-operations/<old>/candidate`. The pin-create/Intent/Prepared order is correct and is not involved.
- Not just fsck noise. Git's own crash residue (stale `candidate.lock` + stale `packed-refs.lock`) is correct per spec (§11 never unlink), but it exposes a real product defect: a WAL chain left at `PinReleaseAttempt` with the pin still present can never finish — even after the operator removes both locks — because `release_pin_and_compact` refuses (`RecoveryRequired`) instead of retrying the exact-old pin delete. Nothing else ever completes it. Retained chains grow without bound.
- Recommended fix: resume the pin delete when the pin still equals the recorded expected tip (product, `publication.rs`), plus a harness verdict rule so E1 no longer reports covered lock residue as an unexplained fsck failure.

## 1. What creates the pin; why absent from listPending

Creation order for op N (`packages/git/rust/src/publication.rs` `compare_and_swap`, ~1370-1445):
1. `admit_pending` (line 264) — compaction of OLD terminal chains of the same ref.
2. `wal.begin` Intent (line ~1421) — durable.
3. `point("before-pin-cas")`, pin created by exact-old CAS `cas_raw(pin, Absent -> candidate)` (1429-1438), read back (1440).
4. `append_after_ref_durable(... Phase::Prepared ...)` (1444): pin dir fsync, then Prepared record.
5. `attempt` -> TargetAttempt -> target CAS -> Outcome.

So the pin lock cannot precede the Intent. Spec §9 step 5/§10 matches (pins reachability-only, written before target CAS, after Intent).

What the orphan really is (evidence from the replayed images; all 21 lock checkpoints share it):
- Image 2783 (acked=16): `refs/fgos/git-operations/e1-1/candidate.lock` (0 bytes), `packed-refs.lock` (0 bytes), `packed-refs.new` (1136 B, unrenamed), pin `e1-1/candidate` still present (in packed-refs, 40d84e9...). WAL `operations/e1-1/00000004.json` = `pin-release-attempt` (expected=candidate, next=absent), no `pin-released`. Same shape at 3022 (e1-2), 4546/4563 (e1-8), 2552 (e1-0).
- The lock-owning op is always the oldest terminal chain of the ref, e.g. e1-0 released during e1-15's admission. In flight at the cut: e1-N admission, before its own Intent exists.
- Why "from the 16th op": `RECENT_TERMINAL = 4` (publication.rs:203) per ref; 3 refs rotate; first ref has 5 terminal chains (0,3,6,9,12) at op 15 -> first deferred release is e1-0 at op 15 (16th op). Each later op releases one old pin (21 checkpoints = 2-4 per op, ops 15-23).
- Release sequence (`release_pin_and_compact`, 1871-1925): append `PinReleaseAttempt` record -> `update-ref -d` (git takes `packed-refs.lock` AND `<pin>.lock`, rewrites packed-refs) -> append `PinReleased` -> compact. A cut between attempt record and delete completion leaves exactly the observed state. Git-delete always takes `packed-refs.lock` (verified: deleting even a loose-only ref needs it).
- Absent from `listPending` because `list_pending` (recovery.rs:81-98) lists only chains with no Outcome; e1-1 has an Outcome (record 3) then PinReleaseAttempt, so `terminal=true`. Recovery treats it as complete by design; the pin release is a post-terminal compaction step.

## 2. Noise or defect? (reproduced)

Direct rdump replay cannot run the Rust port (repository identity is dev:ino bound -> `Untrusted` on every chain; verified). So I reproduced the identical state on a fresh scratch repo: run `e1-power-cut.mjs workload --ops 15` (same tooling), inject `packed-refs.lock` + `refs/fgos/git-operations/e1-0/candidate.lock`, then drive ops 15-30 through `createGitPublication` (script op.mjs). Pin release of e1-0 then fails exactly as at the crash (WAL = PinReleaseAttempt, pin present).

Observed:
- Publication keeps succeeding (CAS only needs loose refs: verified with plain git, create/update with packed-refs.lock present rc=0). Each admission prints only `git compaction deferred: e1-N: pin-release-failed` to stderr.
- With `packed-refs.lock` present EVERY pin release fails (git: "Unable to create packed-refs.lock"), so backlog grows by ~1 chain/op (24 retained after 24 ops, none compacted).
- Later admissions then also hit `e1-0: publication-wal: RecoveryRequired`: `release_pin_and_compact` line 1917-1920 — last state is `PinReleaseAttempt` and `absent_tip(pin) != Absent` -> `RecoveryRequired`. The comment "A resumed release never retries its irreversible deletion".
- After the operator removes `packed-refs.lock`, then `candidate.lock`, e1-0/e1-3/e1-6 STILL fail with RecoveryRequired on every later op, pins still present. Only a manual exact-old `git update-ref -d --no-deref <pin> <oid>` unblocks them (then the next op compacted e1-0, e1-3, e1-6: `compacted/` gained them). So the stuck state is not recoverable by fgOS even after the locks are cleaned.
- `recover_publications` (837-870) calls `release_pin_and_compact(...)?` — one stuck chain aborts the loop; later chains are never processed.
- Doctor (on the same scratch repo, `inspectGit`): `nativeLocks=["packed-refs.lock"]` (git-native-locks row fails: "never removed") and `journal.pendingCount=0` (git-operation-journal passes). The `refs/**/candidate.lock` itself is not scanned (only config/packed-refs/shallow/index locks; `node-addon/src/git.rs:256-263`), so the doctor signal exists only because git also leaves `packed-refs.lock`.
- `listPending` -> `{"complete":true,"operations":[]}`; `inspectOperation(e1-0)` -> `terminal:true`, phase `pin-release-attempt`.
- Plain git with a stale `<ref>.lock` (git 2.53.0): delete, update/recreate of that ref -> fail ("Unable to create ...candidate.lock: File exists"); other refs unaffected; `git fsck` -> `badRefContent` on the `.lock`; gc/pack-refs/for-each-ref fine.
- Is the lock "fgOS's job" to clean? Spec §11 (docs/platform/git/spec.md:503): native ref/packed-refs locks are never unlinked by age/PID; only an exact-owned dead-child quarantine under exclusion. Spec 596 doctor row: "no deletion"; 868 forbids doctor repair. The only quarantine implemented is the dormant `repairNativeIndexLock` (index.lock). So the lock itself is correct, spec-conforming residue and fsck noise by design; the product defect is the un-resumable PinReleaseAttempt (and the missing ref-level lock detection, minor).

## 3. Cause-aligned fix + owning proof

1. Product (primary), `packages/git/rust/src/publication.rs` `release_pin_and_compact` (~1915-1922): when the chain's last state is `PinReleaseAttempt` and the pin ref still equals the recorded expected candidate, re-issue the exact-old no-deref delete (`cas_raw(pin, candidate -> Absent)`), then fall through to read-back, `PinReleased`, compaction. Keep `RecoveryRequired` only when the pin holds a different value. Safety: the pin is reachability-only (spec §10), its id is bound forever (rule 1) so nobody recreates it, and the delete is exact-old; a repeat is idempotent and is not the TargetAttempt class of effect (rule 4). Update the "never retries" comment. A failed retry (lock still present) keeps the evidence and stays deferred (already the case). Also make `recover_publications` not abort the whole loop on one stuck release (collect/continue) — only if the owner accepts; it is a second, smaller point.
   - No lock auto-unlink; spec §11 stays untouched.
   - Owning test: extend `packages/git/rust/tests/publication.rs`, next to `recovery_reconciles_only_the_recorded_pin_and_preserves_native_locks` (line 702; the file's owner of "native locks preserved, pin reconciled"). New case: chain at PinReleaseAttempt with pin present + `packed-refs.lock` -> `release_pin_and_compact` errors, lock bytes preserved; after the test removes the lock -> same call completes (pin absent, ledger compacted, `list_pending` empty). One behaviour, one proof; the WAL-level compaction crash test (`wal.rs` 3184) already owns record/ledger crash safety and is not duplicated.
2. Harness (E1 verdict), `scripts/git/e1-power-cut.mjs` `check()` (the E1 owner): fsck failure that consists ONLY of `badRefContent` on `refs/fgos/git-operations/<id>/candidate.lock` paths is covered residue when (a) the same checkpoint has `packed-refs.lock`, (b) WAL `<id>` last record is `pin-release-attempt`; then record it as an expected Git crash residue (non-violation) and additionally require the post-cut port to still accept the next CAS. Anything else stays a violation. Reason: spec §11 makes the residue legal and the doctor row reports it.
3. Optional idea (needs owner choice; scope increase): doctor `git-native-locks` also scanning `refs/fgos/git-operations/*/*.lock` (bounded). Justification: today the only signal is the incidental `packed-refs.lock`.

Rejected: ordering Intent earlier (already earlier), sweeping pin locks in recovery (violates spec §11), excluding every `.lock` from fsck (would hide a lock that is not covered by any chain).

## 4. Correction to the premise (the run's other violations)

checkpoints.jsonl shows more than the lock windows. Counting violation signatures: 12 `WAL scan NotFound` (entries 161-257), 80 `refs/fgos/events/e1-a(,b,c): absent after acked` (2177-2551, acked 13-15) and 21 candidate.lock (2552-4563). The 80 are zero-byte `packed-refs` (verified at 2300: size 0, refs live only in packed-refs): the fixture's mid-run `git pack-refs --all`. log.img was recorded 11:25:32, before b43b53448 (11:32:25) added `sync --file-system` after the pack and the NotFound-tolerance; so these 92 are fixture noise already fixed in the script, not product defects. 2552 and 2568 are the tail of the window (zero-byte packed-refs plus the e1-0 lock). Expect a rerun with HEAD to leave only the 19 entries 2783-4563 (plus 2552/2568 lock-only). The statement "all other invariants held" is true only after discounting those; not verified by rerun (needs root).

## Unresolved

- Rerun of the root-driven E1 on HEAD (needs root) not done; prediction above untested.
- Why zero-byte (not stale) `packed-refs` appears in 2552 despite `.new` fsynced: attributed to the pre-fix fixture window, not proven at block level.
- Owner decision: should `recover_publications` continue past a stuck chain; should doctor scan ref-level locks (idea only).
- Could not run the Recovery port directly on a dm-log-writes rdump: identity is `dev:ino` bound (`Untrusted`); the scratch reproduction is equivalent but not the identical bytes.

Status: DONE_WITH_CONCERNS
Summary: Orphan lock is a legal Git crash residue from a deferred old-pin delete (`PinReleaseAttempt`), invisible to listPending because the chain is terminal; the real defect is that such a chain can never finish (even after locks are removed) because `release_pin_and_compact` does not retry the exact-old delete. Fix in `publication.rs`, owning test in `tests/publication.rs`; harness verdict rule in `e1-power-cut.mjs`.
Concerns/Blockers: 92 other violations in run3 predate the fixture-sync fix; direct port run on rdump images impossible (identity bound), so reproduced on an equivalent scratch repo.
