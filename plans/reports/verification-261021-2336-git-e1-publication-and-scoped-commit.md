# Verification: E1 power cut, Publication and ScopedCommit

2026-10-21 23:36 (Asia/Saigon), second machine. Run by the owner with sudo:
- kernel 7.0.0-38;
- ext4 on a loop device over dm-log-writes;
- git 2.53.0;
- code at main `ed45bb84c` (worktree `land-0530/wt`).

Command: `scripts/git/e1-power-cut.sh --work /var/tmp/fgos-e1 --replay-log <xfstests replay-log> --user vantt`, which runs both kinds. The image is replayed to every FUA after mkfs, and each replay point is judged through a snapshot.

## Result: held

| Kind | Operations | Replay points | Failed | Order trace |
|---|---|---|---|---|
| Publication | 24 on 3 refs (one nested, packed-refs halfway) | 1040 | 0 | 0 violations, 880 fsyncs |
| ScopedCommit | 12 | 554 | 0 | 0 violations, 454 fsyncs |

**Publication is judged at every point on these properties:**
- `git fsck --full` is clean.
- Every acknowledged CAS is on its ref.
- Every acknowledged WAL chain is readable and terminal.

**ScopedCommit is judged at every point on these properties:**
- The branch tip's history lists.
- Every tree and blob opens.
- `fsck` is clean, with no excused error.

`umount-busy.log` was not created, so no snapshot unmount was ever busy. The `device-mapper: remove ioctl … busy` lines are `dmsetup remove --retry` waiting for udev, which is expected.

## What the earlier runs found (all fixed before this run)

1. **Script errors.**
   - The scoped workload ran without the staged host binary. Fixed by `53f39c272`.
   - A transient busy unmount aborted the run. Fixed by `60eaad9d0`.
   - The census missed the descriptor. Fixed by `6048ab647`.
2. **Run at 19:16, `6048ab647`: violated, 26 of 1471 points.**
   - **ScopedCommit, product defect.** 24 points failed. `git add` and `write-tree` linked loose objects before fsyncing them, so a cut left empty objects under their final names. Git also never rewrites an existing loose file, so the next commit would have named the corrupt blob; this was reproduced by hand. Fixed in `4aa17103c` with three changes:
     - both stagers now run with `core.fsync=loose-object`;
     - corrupt staged objects are healed, or refused with `object-file-corrupt`;
     - a new trace rule (R8).
   - **Publication, fixture defect.** 2 points failed: the halfway `pack-refs` ran without fsync. Fixed with `core.fsync=all` on that call, plus trace rule R9.

## Raw evidence

`/var/tmp/fgos-e1/out/{publication,scoped}/{checkpoints.jsonl,order.json}` and `/var/tmp/e1.log` on the second machine.
