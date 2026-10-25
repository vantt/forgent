# HARDEN T3-04a phase 06: specs, contracts prose, boundary rows, CHANGELOG

Lead report, 2026-10-24 (Asia/Saigon). Worktree `harden-t3a-p06`, branch `harden/t3a-p06` on track tip `11bad990f`. Docs only.

## Changed doc files (the list for the DOC lane)

- `docs/platform/agent-protocol/spec.md`
- `docs/specs/observe.md`
- `docs/platform/holder-lock/spec.md`
- `docs/platform/component-boundary.md`
- `docs/specs/reading-map.md`
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` (not on the phase list: its `observe-run-coverage` paragraph still described the Node admission comparison)
- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md` (not on the phase list: `observe-host-resolvable` row description)
- `CHANGELOG.md` (`## [Unreleased]`, five lines at the top)

## Claims and the code that proves them

| Claim | Checked against |
|---|---|
| `read()`/`activity()` gone from the IO gate; waits (outbox included) go through `pause` | `packages/agent-protocol/rust/src/port.rs` (`AgentIo`: send, screen, inspect, now_ms, pause); `terminal/mod.rs` `stable_newest` |
| `blocked(usage-limit)` in both modes; anchored quota (after optional `error`); terminal login anchored after `error|warning|fatal`; direct login substring in the last 5 lines | `direct/mod.rs` `capture_login`, `screen_login`, `is_quota_limit`, `TAIL_LINES`, `blocked_reason` |
| One rule on every stop path (detector-blocked at the ready gate and after delivery, idle after delivery); the screen-only checks skip quota | `terminal/mod.rs` `stop_reason`, `blocked_readiness`, `blocked_outcome`, `quota_on` in `detect_completed`, `classify_blocked` in `start_banner_on`, `ready_gate`, unruled wait |
| Receipt reasons incl. four supervisor stop reasons; `direct:blocked:<reason>` not wired | `TerminalOutcome::receipt_reason`, `REASON_*`; `Direct::classify` has no caller in the supervisor (report p03) |
| Outbox: 16 MiB, no-follow, regular only, durable-file on Unix, type and size check elsewhere, leading zeros refused, `result-0.json` accepted | `terminal/mod.rs` `MAX_RESULT_BYTES`, `read_result` (both cfgs); `direct/mod.rs` `newest_result` |
| Stability compares bytes and mtime | `stable_newest` (spec said length and mtime; code is stricter, doc says bytes) |
| JSON line is `Output`; no `Event`; stdin is the envelope's and the gate applies it; dependency on `fgos-durable-file` | `outcome.rs` `Activity`; `direct/mod.rs` `activity_from`; `run-supervisor/rust/src/gate.rs` `launch.stdinPolicy`; `agent-protocol/rust/Cargo.toml` |
| One `Direct` adapter, a known CLI only enables block detection | `direct/mod.rs` `adapter_for` |
| Shard door rules (real directories, no-follow regular, heal vs refuse, one `write_all`, bounded reader, stderr warning text, Windows no-reparse, known limits) | `packages/observe/rust/src/shard.rs` (`store_dir`, `open_regular`, `append_lines`, `read_store`, `warn_skipped`); `TornTail::Heal` in friction, case, snapshot and `Refuse` in eval |
| Lock wait 4 s | `store_lock.rs` `ACQUIRE_TIMEOUT`, error text |
| Writing verbs use the main checkout root; reads keep the requested root; `observe-root-unresolved:` | `provider.rs` `trusted_root`, `rooted`; `metrics_cli/mod.rs` `writes`; `friction_cli.rs` |
| `friction migrate` explicit; instants settle, equal instant only by line order in a session shard, `~` is +1 ms, unparsable stamp skipped | `friction.rs` `stamp_millis`, `settles`; `friction_cli.rs` verb list |
| `friction-invalid-input:` prefix | `friction.rs:37` |
| One metrics flag grammar, `--json` no-op, named errors | `flags.rs`; test `every_verb_reads_flags_one_way_json_is_a_no_op_and_bad_input_is_named` in `metrics_cli/mod.rs` |
| `UnitSummarySource` gone, summaries come from `scan_unit_summaries`; `parse_timestamp_millis` gone, grammar is `civil_time::parse_rfc3339_millis` | `run-result/rust/src/unit_summary.rs`, `lib.rs` |
| Doctor `observe-run-coverage` does accounting plus directory count only; `observe-host-resolvable` reads `friction rank --limit 1` | `src/setup/registrations.mjs` `checkObserveRunCoverage`, `registerCheck` for `observe-host-resolvable`; p02 report for the probe |
| CHANGELOG speed figures | p05 report table (coverage 1.02 to 0.17 s, runs 1.03 to 0.17 s, harness 1.56 to 0.71 s on 535 run dirs) |

Supersession (owner decision 31): the independence line and the Hermetic-consumer sentence in `observe.md` now carry a pointer, and the full supersession is a dated entry in § 6 (also records the 4 s lock and the rejected "main root for reads too"). The old § 6 entries are untouched.

## Deviations from the phase text

- `observe.md` § 1 "Observe độc lập" line (not only `:58` and `:74`) was the independence line decision 31 names; reworded with a pointer to § 6.
- Quota is anchored in direct mode too (`is_quota_limit` is shared); the phase text only said anchored for terminal screens. Doc says what the code does.
- "Ready gate, detector-blocked, idle" in the phase text: the code uses the full rule (quota included) when the detector says blocked (at the ready gate re-ask and after delivery) and when idle after delivery; the ready gate's own screen look, the start banner and the unruled wait skip quota on purpose. Doc states that.
- `D-T3A-1` is a plan-local label, so the spec says the Node settle re-read belongs to the run-supervisor layer without the id.
- Agent-protocol spec history entry is in Vietnamese like the neighbouring entries; observe.md entry likewise.
- Docs-only commit; the two extra doc files above were stale for the same changes (L5 q6).

## Validation

- `test/runner/dead-vocabulary-guard.test.mjs`, `test/docs/agents-doctrine-anchors.test.mjs`, `test/docs/decisions-corpus-retired.test.mjs` through `runChosenTests`: 18 pass, 0 fail, status 0.
- `fgos convention check --all` through `npm run fgos:dev` (plain `fgos` has no installation in the worktree): only warnings, all on unrelated existing `plans/reports/*` names; none on the changed files.
- Link targets added or kept in the changed prose exist (`ls`); no other test reads these specs.

## For the owner / next phases

- Stale code text, outside a docs-only phase: `src/setup/registrations.mjs` still describes `observe-run-coverage` as matching "the independent Node layout and eligibility projections" (the `description:` string shown by doctor). Phase 05 left it; one-line fix, and `test/setup/observe-doctor-checks.test.mjs` or `checks.test.mjs` may pin the string.
- `docs/specs/distribution.md` (2026-10-16 history entry) still says the observe lock waits 5 s. Left as a dated record; say so if the DOC lane wants it annotated.
- Owner Q3 (scorecard constants) is not documented: no removal described.
- T4: `Direct::classify` wiring and deleting Node's settle-time screen re-read; the spec says so as pending, not as shipped.

Status: DONE_WITH_CONCERNS
