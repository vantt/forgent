# Node-era execution corpus

Scrubbed copies of real records written by the Node execution tier, for Rust readers to replay.
Source: the main checkout's `.fgos/assignments/` on this machine (read-only copy, taken 2026-11-19).
Total size is under 1 MB. JSON shape, field names, ids, timestamps, digests and versions are kept.

## Scrub rule

- Every JSON string under a prose key (prompt, brief, objective, summary, message, stdout, stderr, reason, note, claim,
  report, expectedOutputs, and similar) and every string longer than 120 characters became `SCRUBBED`.
- Every key ending in token/secret/password became `SCRUBBED-TOKEN` (control tokens, attempt secrets); digest fields stay.
- Home paths became `/SCRUBBED-PATH`; the user name, persona names, emails and bearer/api-key patterns were replaced.
- Dropped whole: `*.log`, `launcher.sh`, `outbox/`, `worker-output/`, `protected/session/` (agent transcripts) and
  `protected/capture/`. `*.md` briefs and any non-JSON file became the one line `SCRUBBED`; empty files stay empty.
- Model ids such as `name@provider` are provider ids, not emails.

## Samples

| Directory | Generation | Source id | What it is |
|---|---|---|---|
| `v3-solo-settled/` | `unit.json` seatSchema 2, run result `assignment-run-result` v3 (embedded agent claim v2), unit-summary v3 | `unit-run-1795056603528-44eb3ca1` | Settled single-seat unit run, full layout with `envelope.json`. |
| `v3-open-attempt/` | same era, seatSchema 2 | `unit-run-1794987012087-5f3337a8` | Attempt directory with `attempt.lock`, `envelope.json`, `receipt.json`, no `result.json` and no `closed.json`. Its unit-summary says `execution-failure`. |
| `adopt-v3-envelope-attempt/` | v3 envelope layout, result v3 | `asgn_4f660b01_7ec3_48f3_89b5_8219ba811853_op_001` | Real attempt that `adopt` judges: has `attempt.lock`, `envelope.json`, `supervisor-binding.json`, `gate-exit.json`, `receipt.json`, `steps/`, `closed.json`. The synthetic layouts the Rust tests build are in `packages/run-supervisor/rust/tests/support/adopt_fixture.rs`. |
| `pre-v3-layout-assignment/` | Older assignment layout: no `envelope.json`, empty `attempt.lock`; result v3 | `asgn_8e8e56bb_00a0_4158_ad04_ec29cabf8204_op_001` | Run directory `adopt` classifies as `legacy-run`. |

## Absent on this machine (not fabricated)

- **Pre-`seatSchema` record**: absent. All 237 `unit-run-*/unit.json` here carry `seatSchema` 2 (and no sibling worktree
  `.fgos/` holds an older one).
- **Legacy seat read** (`src/runner/execution/legacy-seat-read.mjs`): absent for the same reason; no record keyed by
  retired role names without `seatSchema` exists here.
- **Run result v2**: absent. All 382 `result.json` files have `contract.version` 3. `"version": 2` seen in them is the
  nested agent-claim contract, not the run result. The v2 reader is covered only by the Node source
  (`RUN_RESULT_CONTRACT_V2` in `src/runner/dispatch/run-result.mjs`) and its tests.
