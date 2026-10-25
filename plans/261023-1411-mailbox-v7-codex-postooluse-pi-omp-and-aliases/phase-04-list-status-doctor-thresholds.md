---
phase: 4
title: "V7d: list, status, the doctor check and CHANGELOG"
status: pending
sub_rung: V7d
depends_on: [phase 1, phase 3 (handle column), host routing C5; threshold keys after V6's phase 7 report]
live_budget: "0"
---

# Phase 4: leftovers of the spec's V7 row (V7d)

## Requirements

1. `fgos mailbox list` (spec §1 lists it in the first slice; V5 left it to V7), minimal: short name, handle, CLI, tier and liveness (`fgos_process::judge`) of each live head; runner heads omitted (spec §11 item 8, the `list` half); `--long` adds the key. No presence column until a source exists for every CLI.
2. `fgos mailbox status`, **report-only** (plan decision 13): the spec §9 signals computable from the snapshot and the outcome file (1 latency recorded→offered; 2 refusals per reason; 3 offers per message; 5 queue depth and oldest age; 8 record size; 9 pending mail with no drain; 10 offered and never answered; the latest `hook-outcome.json`). It opens the record read-only with the same directory checks `Record::open` uses, never creating anything.
3. Thresholds: after V6's phase 7 report, a `mailbox.status.thresholds.<signal>` key (reader `status`) only for a signal that report gives a measured basis (it hands over distributions for signals 1, 3, 9 and 10); only those drive the non-zero exit and the `send` "mailbox degraded: <signal>" sentence. No placeholder value is shipped.
4. Doctor: the existing `mailbox-hook` check (`src/setup/registrations.mjs:2374`) runs `fgos mailbox status --json` through the shim when the project opted in and reports its record verdict; the record's rules stay in Rust, with no JS copy. Missing record: "no record yet" (no hook has run).
5. `CHANGELOG.md` `[Unreleased]`: one line per landed sub-rung (V7a Stop off, V7b aliases, V7d `list`/`status`).
6. Q4 = A only: `Offered.claimed_at` with schema 2 (v1 read and upgraded, `SnapshotVersion::check` changed, size caps rebuilt from the real struct with `claimed_at: Some(MAX)`, `snapshot.v2.json`, rollback = archive and reset the record) as its own step with T7-T9; Q4 = B: none of it.
7. Spec §6.1 rows, §9, §12, §14 V7 row split into V7a-V7f, §17.

## Tests first

| # | Behaviour (test title) | File |
|---|---|---|
| T1 | list shows each live head with its name, handle, CLI, tier and liveness and omits runner heads | `store/tests/verbs.rs` |
| T2 | status reports each signal from a record seeded through the store's own holds and creates nothing | same |
| T3 | status exits non-zero and send adds the degraded sentence only for a signal with a threshold key | `store/tests/verbs.rs`, `core/tests/report.rs` |
| T4 | a threshold key is in the contract with a named reader and the loader refuses a wrong type | `store/tests/limits_contract.rs`, `limits_loader.rs` |
| T5 | the mailbox-hook doctor row reports the record verdict from status, passes with no record yet, and writes nothing | `test/setup/registrations.test.mjs` |
| T6 | the host routes mailbox list and status natively | `test/rust-host/command-routes.test.mjs`, `apps/fgos/tests/mailbox_routes.rs` (one wiring proof each) |
| T7 (Q4 A) | a v1 snapshot is read as v2 and a v2 snapshot is refused by name by a v1-only reader | `store/tests/record_snapshot.rs` |
| T8 (Q4 A) | the size caps hold for headers carrying claimed_at | `store/tests/record_ceiling.rs` |
| T9 (Q4 A) | a finished claim records its claim time | `core/tests/delivery.rs` |

## Steps

1. Sync; shared-file announcement on the board (plan section 6) if not done.
2. T1-T6 failing; implement; `cargo test …` and `node --test test/setup/registrations.test.mjs test/rust-host/command-routes.test.mjs` green; then `npm test -- --test-concurrency=4` once (shared setup file changed).
3. After V6's report: threshold keys with their source; T3/T4 again; spec §12.
4. Q4 A only: step 6 with T7-T9.

## Acceptance

Tests green on a fresh merge; doctor on an opted-out project unchanged (`not enabled`); no threshold without a named measured source.

## Plan-owner decisions after the V7 review (agent, 2026-10-23; `reports/code-review-v7abd.md`)

- L2: `list` and `status` count heads by one rule (not a runner key, not judged dead).
- L4: one platform rule for the adapters' facts (`facts`, `tier`, `stop_drains`).
- L6: `read_existing` does not re-check the record directory's identity after opening the snapshot; documented, inside the same-user limit.
- M1: channel roles in the adapters contract are a closed set (`user`, `developer`, `system`, `tool`, `transcript:<type>`); the `transcript:` residual for Claude Code is named in spec §7.3.
- M4: the formatting of other lanes' code in `apps/fgos/src/cli_projector.rs` and `apps/fgos/src/main.rs` was reverted; only the `list`/`status` lines remain there.
