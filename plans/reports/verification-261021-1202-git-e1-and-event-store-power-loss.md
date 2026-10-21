# Verification: Git E1 power cut and Event Store power loss

2026-10-21, second machine (Linux 7.0.0-38-generic, ext4 on `/dev/nvme0n1p2`, git 2.53.0), run by the owner with sudo, read by the coordinator. Checkout `land-0530/wt` tracking main.

## Results

| Proof | Script | Result |
|---|---|---|
| Git E1 (spec §15, §19) | `sudo env "PATH=$PATH" scripts/git/e1-power-cut.sh --work /var/tmp/fgos-e1 --replay-log <xfstests replay-log> --user <owner>` | **held**: 24 Publication operations on 3 refs (one nested, packed-refs halfway), dm-log-writes replayed to every FUA after mkfs, 1029 replay points, 0 failed. At each point the image mounts, `git fsck --full` is clean, every acknowledged CAS is on its ref or a later planned value, and every acknowledged WAL chain is readable and terminal. Syscall order (`trace`): 114 WAL records, 879 fsyncs, 61 ref renames, 0 violations. |
| Event Store §23.2 item 10 | `sudo env "PATH=$PATH" scripts/event-store/power-loss.sh --runs 20 --keep-failed` | **PASS 20/20**: dm-flakey power cuts with a seal every 7 appends, 1675 acknowledged events in total, none lost, doubled or out of sequence; one run kept 3 unacknowledged survivors, which the contract allows. |

Evidence copies: `/home/vantt/.claude/jobs/e1505f04/tmp/e1-final/` (e1-verdict.json, checkpoints.jsonl, order.json, plan.jsonl, e1.log, es-power-loss.jsonl).

## Product defects found and fixed on the way

1. **Seal trees were not durable** (`a8a306a35`). The first Event Store power-loss run failed 19/20 with `event-store-gap: seal.json missing`. A kept image showed every seal commit's tree as an empty loose object. `strace` showed `git -c core.fsync=all mktree` writes its loose object without fsync (git 2.53), while `hash-object`, `write-tree` and `commit-tree` do fsync. The Publication port now builds canonical tree bytes and writes them with `hash-object -w -t tree`, the same door as blobs and commits.
2. **An interrupted pin release never resumed** (`5d5a0de33`). A power cut during the exact-old delete of a terminal operation's pin left the chain at `PinReleaseAttempt` and returned `recovery-required` forever. Pins are unique per operation id and never rewritten after the operation ends, so `pin == candidate` proves the delete did not happen; the release now re-issues the exact-old delete (Git spec §9 step 4 clarification, 2026-10-21). Native lock files are never removed; doctor `git-native-locks` now lists pin locks too. Diagnosis: [debug report](debug-261021-1135-e1-orphan-candidate-lock.md); fix: [phase-lead report](phase-lead-261021-1145-git-resumable-pin-release.md).

## Experiment script defects fixed (never run before)

Addon path moved per checkout; the writer kept root's HOME; sudo dropped node from PATH; replay-log's usage exit status under pipefail; the handshake reader kept the workload alive and bash unset the coprocess pid; `replay-log --find` prints `entry@sector`; loop devices created in subshells were never detached; a half-initialised repository before the first acknowledgement; the fixture (`git init`, mid-run `pack-refs`) was not durable before judged writes; udev held the snapshot device during removal. `power-loss.sh` gained `--keep-failed`.

## Not covered

- The owner machine's disks were not tested; repeat there only if its filesystem differs from ext4 on NVMe.
- The Event Store item 10 result is the store layer; the Work end-to-end gates stay in the WORK lane.
- Neither fix is in an activated release yet; they land with the next release on both machines.
