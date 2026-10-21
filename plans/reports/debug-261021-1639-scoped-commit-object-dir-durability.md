# ScopedCommit: durability of the objects `git add` / `write-tree` / `git commit` create

Worktree `git-fu` (branch `git/followups`), git 2.53.0, ext4 on NVMe (`/dev/nvme0n1p2`, rw,relatime), 2026-10-21 Asia/Saigon. Diagnosis only; no product edit, no commit.

## Verdict

**Gap is real.** Nothing in ScopedCommit makes the directory entries of the objects it creates durable, and the loose files of the blob and tree it stages are never fsynced at all. Spec §10 (`docs/platform/git/spec.md:47`) says fgos-git fsyncs "every loose-object fan-out directory and `objects/` it wrote into before the WAL `prepared` record and before any ref that references those objects". ScopedCommit does not.

The lead's reading of R2 ("not applicable because next == baseline") is **correct about R2's own meaning but wrong in its conclusion**: R2 cannot see this gap, because the check only looks at the fan-out of the intent's `next`, and ScopedCommit's intent sets `next = baseline.head` (`scoped_commit.rs:1225-1229`). That oid is an old fixture object nobody in the trace fsynced, so R2 fires for a meaningless reason. The real property (new objects durable before the receipt) has no rule at all in the checker. R1/R3/R4 passing says nothing about objects.

## 1. Code path (ScopedCommit, `scoped_commit.rs`)

| Step | Line | Writes objects? | Durability work |
|---|---|---|---|
| `git add -A` via `stage_paths` | 1202 | new blob(s), index | none: no `core.fsync` (grep of `-c core.fsync` in scoped_commit.rs finds only 1266) |
| `git write-tree` | 1206 | new tree(s) (root + changed subtrees) | none: no `core.fsync` |
| WAL `intent`, `prepared`, `target-attempt` | 1227-1255 | no | WAL file + directory fsyncs (durable-file) |
| `git -c core.fsync=all commit` | 1260-1275 | commit object (index rewrite, ref move) | Git fsyncs the commit's tmp_obj, the index.lock and the ref lock file; **never a directory** (§10) |
| `show --raw` observation (fused child) | 1277-1290 | no | none |
| Outcome install | 1322-1333 | no | `append_ordered(..., Some(&ref_durable))`: `refs::sync_refs` = ref directory chain (`refs/heads`, `refs`, `.git`) overlapped with the record's own fsync; record installed only after both |

Recovery (`recover_scoped_commit`, ~600-625) records `Outcome::Commit` after only `refs::sync_refs`: same hole, same fix needed.

Publication, by contrast, writes every object through `hash-object -w` with `core.fsync=all` (publication.rs:485-497) and calls `sync_object` = `sync_dirs(object_dirs)` (fan-out + `objects/`, memoised in `durable_objects`) before `prepared` (publication.rs:1423). ScopedCommit has no equivalent.

## 2. Strace evidence

Trace: the lead's existing strace of 3 warm ScopedCommit operations with the shipped binaries, `/home/vantt/.claude/jobs/e1505f04/tmp/sc-speed/o-after.strace` (30057 lines, same syscall set as `e1-power-cut.mjs trace`). I did not re-run the workload; I wrote an event-timeline reader (`/home/vantt/.claude/jobs/e1505f04/tmp/sc-durable/tl.mjs`) and read the p-0 window by hand. Aggregate over the whole trace: **0 fsyncs of any `objects/` directory** (fan-out or `objects/`), 6 fsyncs of `tmp_obj_*` (all of them commit objects, 2 per repo: the warm-up commit and the scoped commit).

One scoped commit (op `p-0`, linked worktree `p-port-0-linked`, lines 10255-11015):

| New object | Created by | File fsynced | Fan-out dir fsynced | `objects/` fsynced |
|---|---|---|---|---|
| blob `fc/8e9368...` | `git add` (mkdir fc, tmp_obj write, link) | **no** | **no** | **no** |
| tree `df/0982e1...` | `git write-tree` (mkdir df, write, link) | **no** | **no** | **no** |
| commit `37/5a2827...` | `git commit` (fsync tmp_obj, then link) | yes (Git) | **no** | **no** |

Order of the fsyncs that do occur after the commit's link: `fsync(refs/heads/producer.lock)`, rename onto `refs/heads/producer`, then (our code) `fsync(refs/heads)`, `fsync(refs)`, `fsync(.git)` concurrent with the Outcome temp file, `fsync(operations/p-0)`, compaction records. Nothing touches `objects/`.

Index: `git add` and `write-tree` write `index` with no fsync (`index.lock` rename, lines 10271/10390/10524). `git commit` fsyncs `index.lock` (10609) then renames it; the directory holding it (`.git/worktrees/<name>/` for a linked worktree) is never fsynced; for the main worktree `.git` is incidentally fsynced by the ref chain. The index is not part of the spec's receipt contract (objects, ref, journal), and a stale index equals the staged content, so I list it as optional hardening, not part of the required fix.

`order` output (`order-after.json`) confirms: 6 violations, all `R2 <op>: objects/<xx> not fsynced before prepared` where `<xx>` is the fan-out of the *baseline head* (`4bc3aec...`, `6a36d1...`, `13...`), created by the fixture setup with plain `git commit` and never fsynced. Identical before and after the speedup, as the lead said.

## 3. Does ext4 make it safe anyway?

Two separate things.

**Directory entries (fan-out `mkdir`/`link`, `objects/` entry): masked on ext4, by luck of ordering.** jbd2 keeps one total order of metadata. Git `fsync(tmp_obj)` of the commit object, and later `fsync(refs/heads/<x>.lock)`, each force a journal commit of the running transaction, which contains every earlier metadata operation, including the earlier `mkdir fc/`, `link` of the blob and tree, and the commit object's own link (that link precedes the ref lock fsync). So by the time Git's ref rename happens, all object names already survive a cut. XFS is the same by log ordering. This is an accident of per-filesystem journal ordering, not a guarantee, which is exactly why §10 says "Git 2.53 never fsyncs a parent directory" and assigns directory durability to fgos-git, and why the receipt "advertises `durability.processCrash` only" until a profile is proved (spec :47).

**Loose-file data of blobs and trees: NOT covered on ext4.** `git add` / `write-tree` without `core.fsync` leave the file bytes in delayed-allocation page cache. ext4 `data=ordered` only orders data for blocks *allocated* in the committing transaction; delalloc pages are allocated at writeback (up to ~35 s later), and `auto_da_alloc` covers only rename-over and truncate, not `link`. A journal commit forced by another file's fsync therefore persists the dir entry and an inode of size 0. After a cut within that window the branch ref names a commit whose tree/blob loose file is empty: `git fsck` reports an empty object, `git checkout`/`show` fail. This is the same defect class the E1 run already found and fixed for Publication (`git mktree` writes an unsynced loose tree; spec §19 E1 row, fix `a8a306a35`). I have not reproduced the zero-length file (needs root, dm-log-writes); the trace proves the missing fsync, the ext4 consequence is from the delalloc rules above. The E1 replay in section 5 proves or refutes it.

**Other filesystems.** The spec names only ext4 (E1 profile; "stable-media profile unproved"). General behaviour, not from the spec: btrfs logs a new name only when an inode of that name is fsynced, so the blob and tree names (never fsynced) can be lost; ZFS commits per-object itx chains, so ordering across objects is not guaranteed; APFS needs `F_FULLFSYNC` anyway; NTFS has no directory-fsync notion. Not verified here. Spec position stands: do not rely on it.

Crash-window note: Git moves the ref itself inside `git commit`, so for the *commit object* "durable before the ref moves" cannot be met without replacing `git commit` by `commit-tree` + CAS (loses hooks and the whole current design). The receipt-binding form is achievable: when the receipt says `committed`, objects, ref and journal are durable. A cut before the receipt leaves an open chain that recovery observes; recovery must tolerate (and, with the fix, will re-sync) an unreadable object.

## 4. Recommended fix (cause-aligned, within spec)

One mechanism, reused: Publication's `object_dirs` / `sync_dirs` / `durable_objects` memo, plus `fgos_durable_file::sync_directories` which already takes arbitrary paths and fsyncs them concurrently (`sync_directory` is `File::open` + `sync_all`, so it also fsyncs a regular file; Unix only, as the rest).

1. Extract Publication's object-durability into one `pub(crate)` free function, e.g. `sync_loose_objects(repo, &[Oid], extra: &[PathBuf])`: for each oid whose loose file exists and is not in `durable_objects`, collect the loose file, its fan-out dir, and `objects/` once; add `extra`; one `sync_directories` batch; `remember` after success. `Publication::sync_object` calls it (keeps its fault `point`). Do not copy the code (one door, principle 1).
2. Get the new oids with **zero extra Git children**: change the existing fused post-commit `show` from `--name-only` to `--raw -t -r -z --no-abbrev` (verified on a scratch repo: output is `:mode mode old new status\0path\0` for files **and** changed trees, with new-side oids; headers `%H %T %P` unchanged). `split_observation` then yields `(observed, root_tree, parents, entries)`; the file set `actual` = entries whose mode is not `040000` (deletes keep the zero new-oid and are skipped; gitlinks `160000` skipped). New objects = `observed` + root tree + the changed trees + the changed blobs. The foreign-parent fallback (`diff --name-only` child) stays as is.
3. In `commit_scoped`, build the `ref_durable` closure to run `refs::sync_refs` **and** `sync_loose_objects(repo, new_oids, &[])` in the same concurrent batch (they are independent; the receipt name is still installed only after both returned `Ok`). Failure keeps the existing "error leaves only the temp, no Outcome" behaviour.
4. `recover_scoped_commit`: before installing `Outcome::Commit`, compute the same oid set (it already runs a `diff` child on `baseline..observed`; use `rev-list --objects observed ^baseline` there, recovery is not on the budget) and call the same helper next to `sync_refs`.
5. Optional hardening (not required by §10): add the worktree gitdir (index location) to `extra`.

Not recommended: `-c core.fsync=all` on `add` / `write-tree`. It would fsync file-by-file serially inside Git (one journal commit each, N x ~5 ms) and still leaves directories. Pre-ref ordering of blobs/trees (a separate fsync round before `git commit`, +1 serial round, ~5-10 ms) is available if the owner wants §10's "before any ref" for those too; ext4 ordering makes it moot, the receipt contract does not need it, so I would not spend the 250 ms budget on it unasked.

### Cost

Typical one-file commit (as in the trace): 3 new loose objects = 3 files + 3 fan-out dirs + `objects/` = 7 extra fsyncs, but all issued concurrently with the existing ref-chain fsyncs (3 dirs) and the Outcome temp. Microbench on this host (ext4, load average 15-19 so absolute numbers are inflated; script `/home/vantt/.claude/jobs/e1505f04/tmp/sc-durable/fsbench.py`): a concurrent batch of 1 dirty dir, 4 dirs, 3 files + 4 dirs, 5 files + 6 dirs all take p50 10.1-10.3 ms (one journal commit; p95 10.4-10.8 ms), while the same fsyncs issued serially take p50 10.3, 10.3, 31.3, 51.0 ms. So batching is mandatory and the added cost, since the batch joins the existing ref-chain round, is about 0 to one journal-commit round: **estimate +0 to +6 ms** (the breakdown measured the ref-dir step at 5.1 ms unloaded), against warm p50 147.7 ms / p95 154.7 ms and the 250 ms budget (headroom about 95 ms). Many-file commits add one fsync per blob but stay in the same round. This is an estimate; no product code was changed so it was not measured end to end. Re-measure with `sc-speed/measure2.sh` after implementing.

### Owning proof (principle 8)

- Behaviour "every new loose object's file and fan-out dir are fsynced before a receipt": extend the existing Publication proof in `packages/git/rust/tests/publication.rs` (`recreated_loose_object_gets_directory_durability_again`, which counts `publication-directory-fsync` checkpoints) to the extracted helper (a loose file plus dirs counted; a second call for the same inode counts 0). That is the lowest layer that observes fsyncs.
- Parsing of the new `show --raw -t` output (modes, trees, deleted paths, a path with a newline, malformed shapes): `observation_tests` in `scoped_commit.rs`, replacing the current name-only cases.
- Wiring: one test in `packages/git/rust/tests/scoped_commit_sync.rs`, e.g. extend `literal_scoped_commit_real_hook_and_replay` (line 105): after a commit that adds a file in a new nested directory, every oid from `git rev-list --objects <new> ^<base>` that is loose is fsync-observable... there is no fsync seam in ScopedCommit today (no `FileSystem` injection, unlike Publication). Cheapest honest wiring proof: make the new fan-out directory unsyncable (replace `objects/<xx>` by a symlink before the batch is not reachable from outside), so prefer an in-crate unit test of the closure ordering, or add the same `FileSystem::checkpoint` seam Publication uses. I would not add a strace test (strace not guaranteed in CI). The end-to-end proof is the E1 replay below.
- `e3-census`: the Git child count stays 29 (no new child), so no census change is expected; check.

## 5. Add ScopedCommit to E1 (`scripts/git/e1-power-cut.sh`, root, owner runs it)

The harness already fits: `workload` writes, logs `ack` marks, `check` runs `git fsck --full` (which flags empty/missing loose objects, exactly this defect) and verifies each acknowledged ref. Changes:

1. `scripts/git/e1-power-cut.mjs`: add `--kind publication|scoped` to `workload` and `check` (default `publication`; the `.sh` runs both kinds, two logged recordings or one per kind, writing `e1-verdict.json` with a `kinds` array).
2. Scoped `workload`: `prepare` builds one repo and one linked worktree with custody and the activation fence, the same fixture as `test/git/scoped-commit.test.mjs:fixture()` (`acquireSync(createLockScope(),'dispatch-cwd',{fgosDir, cwd:linked})` and the TOMBSTONE fence file). Loop `i`: write a fresh file in a fresh nested directory (`d<i>/f<i>`, so a blob, two trees and a commit are new every round), `preflight` then `commit`, append `intent` (id, ref `producer`, the baseline head) to the plan, then on return append `ack` with `receipt.oid` and the receipt's `files`; same `--handshake` marks as now.
3. Scoped `check`: same repository open and `fsck --full --no-dangling` (the decisive check: it fails on an empty loose blob/tree); the branch must contain the last acknowledged oid (`merge-base --is-ancestor <ack.oid> <branch>`); `cat-file -p <oid>^{tree}` and `ls-tree -r` of that oid must read every blob (use `git archive <oid> | tar -t >/dev/null` or `git cat-file --batch-all-objects --batch-check` plus `rev-list --objects <oid> | cat-file --batch`); the WAL chain of every acknowledged id must be terminal via `recovery.inspectOperation` (`createGitScopedCommit`'s recover). Unacknowledged ops may be absent or open, never corrupt.
4. `checkOrder` (`trace` mode): replace the meaningless R2 on scoped traces by two rules, evaluated for every outcome record whose operation kind is ScopedCommit: **R5** for each successful `link(.../objects/<xx>/<hex>)` before the outcome install and after `prepared`'s predecessor, `objects/<xx>` and `objects/` are fsynced between the link and the outcome; **R6** each such object's file is fsynced (its tmp path before the link, or its final path before the outcome). Skip R2 when the intent's `next` equals its `expected` (ScopedCommit) so the verdict stops carrying a false positive. After the fix both rules must hold on the same trace the lead used (`sc-speed/order.sh`), and fail on the current binaries (a useful red/green pair: R5 fails 3 of 3 objects per op today).
5. `.sh`: step 4 (`trace`) runs both kinds; `OPS` default stays 24 for publication, 12 for scoped (each scoped op is about 150 ms, cheap). Root requirement and the device-overwrite warning are unchanged.

## 6. Unresolved questions

- Zero-length blob/tree after a cut is inferred from ext4 delalloc rules plus the trace, not reproduced; the scoped E1 replay (needs the owner's root run) settles it. If it does not reproduce, the fix is still required by the spec (§10 order, receipt contract), only its urgency changes.
- Whether the owner wants blobs and trees synced before `git commit` (pre-ref ordering, +1 serial round, ~5-10 ms) rather than only before the receipt. I recommend receipt-only.
- Windows: `sync_directory` opens read+write there, which fails on 0444 loose objects; the file-fsync half is Unix-only as written (the product's durability is Linux-only today, spec implementation status).

Status: DONE_WITH_CONCERNS
Summary: ScopedCommit never fsyncs objects/<xx>, objects/, or the loose files of the blob and tree it stages (0 objects-dir fsyncs in 3 traced commits); ext4 journal ordering masks only the directory entries, not the unsynced blob/tree bytes, and R2 cannot see any of it because ScopedCommit's `next` is the baseline head. Fix is one concurrent batch (reusing Publication's helper) beside the ref-chain sync, est. +0-6 ms, plus R5/R6 and a scoped workload in E1.
Concerns/Blockers: the zero-length-object consequence is inferred, not replayed (needs root dm-log-writes); end-to-end cost not measured since no product code was changed; the wiring test needs an fsync seam ScopedCommit does not have yet.
