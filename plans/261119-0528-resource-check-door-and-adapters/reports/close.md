# Close: plan 261119-0528 resource-check door and adapters (2026-11-19)

Phases landed on main one by one through the landing script (main was the integration branch, as in
plan A); each phase branch was reviewed by a codex `code:review` seat (two rounds each for 8b, 8 and 7b)
and gated by its owning tests, clippy `-D warnings`, the msvc check and the one-door scan. Gate details:
`gates.md`.

## Landings

| Phase | Commit on main | Notes |
|---|---|---|
| step zero | `530a5e2ef` | base refresh, fact re-read, plan-check baseline (`step-zero.md`, `plan-check-baseline-step0.txt`) |
| 8b supervisor adapter and honest reader | `9590a753e` | 3 blocking review findings fixed before landing |
| 8 Work, plan-check, plan-lint adapters | `2be0fc21b` | 1 blocking finding fixed (dropped entries failed open); outcomes in `p08-outcomes.md` |
| 7b planner door `fgos resource-check` | `78039e663` | 2 blocking findings fixed; catalog row added by the lead (footprint extended); non-unix refuses inputs by name; one limit left open (`p07b-known-limit.md`) |
| plan-check: same-wave rule skips done phases/plans | `63a6db392` | supervisor request; owning cases in `test/scripts/plan-contract-check.test.mjs` |
| 9 discovery | `063f17a2a` | plan contract, planning skills, reading map, CHANGELOG |
| 10 fixes found by the full gate | `93cc5bebc`, `01554e28b` | stale version envelope vector (new verbs of this plan and the supervisor plan); shard mean summed in input order |

## Acceptance criteria

1. Pass. Only `packages/write-scope/src/lib.rs:149` defines the overlap rule; the manifest door entry "the footprint and write-scope overlap rule" guards new copies.
2. Pass. `test/rust-host/resource-check-door.test.mjs` (bad plan: `questions_*.rs` vs `questions_a.rs`, empty footprint, `..`; good plan). Smoke: the door rejected this plan's own first table (glob vs literal in wave 2), fixed in `5dbc5d7de`.
3. Pass. Work-side case in `test/state` (graph-adapter / graph-metrics owning tests).
4. Pass. `plan-contract.md` section 4 names the door; `npm run build:skills` second run clean.
5. Pass. Input-refusal cases in `apps/fgos/src/wiring/resource_check.rs` tests, incl. `<symlink>/.` spellings after review.
6. Pass. Truncated and dropped-entry answers fail closed in the script, the Work adapter and plan-lint; `footprint_problem` in the supervisor.
7. Pass. Supervisor reader (8b) and script (8) refuse the same malformed tables, for every status.
8. Pass. `p08-outcomes.md` records before/after of `conflicts`, `schedule`, decompose gate, merge readiness, fan-out verifier.
9. Partly. `cargo test --workspace`: 3465 passed, 2 failed — the version vector (fixed `93cc5bebc`) and `fgos-supervision land::two_concurrent_lands_into_one_target_serialize`, flaky under load, passes alone. `npm test`: 44 failed; 3 fixed (`93cc5bebc`), 1 fixed (`01554e28b`), 1 flaky (`mailbox-live-confined`), the rest `/tmp` EDQUOT (-122) noise that passed on rerun with TMPDIR on ext4. No full suite was rerun after the two fixes. Plan check: failing 1, only `261118-1117-external-ui-integration-multica` (other lane, not fixed). Census matches the tree.

Door time on the largest real plan (124 rows, 261119-0030): 11-24 ms (debug build); no trie needed.

## Census

Each phase regenerated the census for its own files; no entry outside a phase footprint. At `01554e28b` the scan reports 0 undeclared sites.

## Release

Active release before and after this landing: `sha256:20df0cf27445c2fd87b3815127df781435448cad4bafd990a7c38cb79ceb7d5c` (cut by lead:OPC at 08:55, before phase 8b). The new verb and adapters are merged but NOT activated: per L9 the landing is merged, not durable, until lead:OPC cuts and activates a release from main at or after `01554e28b` and `fgos doctor` passes through the shim.

## Other lanes

- `261118-0936-ops-metrics` and `261118-1045-project-supervisor` were flagged by the new rule; done waves are now skipped (`63a6db392`) and SUPERVISION made phase 10 explicit (`f0ddce65a`).
- `/tmp` EDQUOT on fg-server2 makes full `npm test` runs noisy (TEST lane).
