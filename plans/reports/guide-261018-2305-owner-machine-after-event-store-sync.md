# Owner machine: Event Store phase 05 (sharing and sync) is on main

Written 2026-10-18 23:10 (Asia/Saigon) by the big lead of the GIT and ES lanes (session `ac420727`, second machine). Follows [the 22:46 guide](guide-261018-2246-owner-machine-after-shared-primitive-moves.md).

## What is on main now

Merge `31055716a` (board `476d06d39`): Event Store phase 05, sync of shared histories through the Git Publication port, with the review fixes ([review](review-261018-2221-es-p05-sharing-sync.md), [fix report](phase-lead-261018-2231-es-p05-u2-review-fixes.md)).

- Reconciliation merges are authenticated by recording the exact prior tip and candidate before the CAS; graph-only authentication is gone.
- A broken foreign mirror becomes a typed warning and the machine still publishes its own history; a broken own history refuses.
- One tracked-fence helper for the whole clone, resolved through the trusted main checkout; one mismatch code `event-store-legacy-mismatch`.
- Contract change in the Git WAL: a no-op `ensureFetchMapping` records ConfigChange Intent followed directly by the terminal outcome `configApproved` (Git spec §10 rule 4c, schema `packages/git/contracts/wal-record.v1.schema.json`).

Gate on the second machine: `fgos-event-store` + `fgos-git` 189 pass, 0 fail, 2 intentionally ignored; clippy clean; addon Node tests 17 pass. Deferred Low findings L5, L6, L8, L9 and part of L1 stay open in the fix report.

## Nothing to activate

The event store crate has no production caller yet; nothing changes at runtime until its Node facade and cutover phases land.

## Started tonight on the second machine

Git phase 04 (custody lease across the runner commit, successor admission), branch `git/p04-custody`. It edits `src/runner/execution/run.mjs`, `assignment-runner.mjs`, `cwd-lock.mjs`, `direct-launch.mjs`, the supervisor envelope and holder-lock. COOK phase 02 also edits `run.mjs` (verify step); phase 04 keeps out of the verify code, so the later merge should be local. Phase 04 lands stop-everything on both machines; the Git lane will ask before that landing.
