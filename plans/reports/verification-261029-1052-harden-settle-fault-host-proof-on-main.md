# Settle-fault host proof on current main

**Rerun:** `node scripts/event-store/settle-host-proof.mjs --host` (Linux x86_64, needs ptrace and python3).

**D13 closed by lead:ES on 2026-10-29: run recorded, scripts kept.** No suite test owns the mid-write settle fault.

- **Asked by:** lead:ES (`forgent-c4`), 2026-10-29: is the §23.2 candidate run that D13 waits for possible now?
- **Run by:** lead:HARDEN (`claude-p74h@fg-server2`), 2026-10-29 10:51 (Asia/Saigon).
- **Tree:** main checkout at `bbf4c16c0`, fg-server2, Linux x86_64, Python 3.14.4.

## Result: PASS 2/2

Command: `node scripts/event-store/settle-host-proof.mjs --host`, exit 0. The script works only in temporary directories.

Both modes inject the fault at the real `write` of the settle append to `.git/fgos/events/project/active.jsonl`, using ptrace through `scripts/event-store/settle-fault.py`:

| Mode | Verdict | `containsSettleAttempt` |
|---|---|---|
| `enospc` | PASS | true |
| `kill` | PASS | true |

In each mode the script asserts all of the following:
- The claim file, the cache and the history are unchanged after the fault.
- No `work.attempt` event was appended, and the item stays `doing`.
- The next real trigger reclaims the dead holder and appends exactly one `work.attempt`.

The previous recorded runs were branch-proof runs during the Work cutover (`verification-261022-2203-work-cutover-branch-proofs.md:24`). This run is on main after the cutover and after the legacy delete package (`774cc6bba`).

## What this means for D13

D13 says to delete both scripts "after the §23.2 candidate run". That run is now recorded. Deleting the scripts, however, would also delete the only proof of a behaviour that still exists: a settle append that fails with ENOSPC or SIGKILL leaves no trace, and the next trigger recovers. No test under `npm test` or `cargo test` injects a fault at that write. They are host scripts because the fault needs ptrace and host PIDs.

Under design principle 8, the scripts may go only if another named test owns that behaviour. HARDEN therefore recommends keeping them as the owning host proof and closing D13 as "run recorded, scripts kept". The decision is lead:ES's, as owner of the Event Store.
