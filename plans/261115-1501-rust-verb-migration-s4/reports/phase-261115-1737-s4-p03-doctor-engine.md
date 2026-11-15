# Phase 03 report: doctor engine, one registry, Node rows bridge

Branch `rust-verb-migration-program/s4-p03`, rebased on `ec82f6acb`. Status: DONE_WITH_CONCERNS (phase 00 report was not on its branch when this was written).

## What changed
- `fgos-distribution::doctor`: engine (status, fix attribution, ok/next, exact-order fixes, `--strict`, JSON report, `--pretty`), registry parser (config rows enter as one group), one lenient `Report` type that `init.rs` `closing_block` and `doctor_is_clean` now read.
- `packages/distribution/contracts/doctor-registry.v1.json` (110 rows, 27 fixes, order, descriptions, owner, repairs, judge) and `doctor-bridge.v1.json` (line format, vectors read by both sides).
- Host: operation `doctor.run`, `wiring/doctor/{mod,bridge}.rs`, `VerbAnswer {data, exit, text}` in host-runtime (config check moved onto it), doctor root policy = main checkout and acts on the resolved root even with no `.fgos`. `legacy_exec.rs`: `resolve_payload` (root + entry), `payload_command`, `Forwarding` shared by the legacy lane and the bridge.
- Node: `src/setup/doctor-bridge.mjs` (stdin request, prefixed result lines, body stdout routed to stderr), `runBridged`; `registerCheck/registerFix` keep bodies only (no descriptions, no repairs); doctor arm, `runDoctor`, status logic, pretty doctor half, `EXIT_OF.doctor` deleted.
- Doors rows: doctor readiness registry, Node rows bridge (retiredBy S7), no Node from the native packaging verbs; seeded negative cases in `test/architecture.test.mjs`. D4 test: `bridgeFailures` over `test/helpers/doctor-judge-closure.mjs`, with seeded negatives (label too low, label too high = must move, drifted judge, unknown step).

## Parity (host vs base release 118df7065, `doctor.cases.mjs`, 34 cases)
Green. Compared per row (id, status, passed, fix, message, detail, description), exit, stderr, and on-disk state for `--fix`/refusals. Volatile and accepted: release/host paths, commit, state-root source word (host pins it), random machine key, Node CLI start-up git cache in state root, host redacts `=value` in the fault record message.

## Retired test -> owner now
| retired | owner now |
|---|---|
| `registrations.test.mjs` "doctor run reports status per row, fix, ok, deduplicated next" | `doctor.rs` `a_run_reports_ok_next_and_the_fix_of_each_failing_row_in_registry_order`, `a_row_level_follows_its_own_status...`, `an_owner_that_cannot_judge...` |
| `registrations.test.mjs` "doctor --fix runs fixes before rows" | `doctor.rs` `fixes_run_in_exact_registry_order...`, `rows_are_judged_after_the_fixes_ran` |
| `doctor-strict-exit.test.mjs` (file) | `doctor.rs` `strict_exits_one_only_when_a_row_still_fails`, `doctor/mod.rs` answer test, `cli_tests.rs` Node-missing case (strict exit 1) |
| `verb-exit.test.mjs` doctor lines | same |
| `pin-drift-check` runDoctor use | row's own answer asserted directly; level derivation is the engine's |
| `closing-block.test.mjs` canned Node doctor | same file: canned rows from a copy of the payload's bridge; closing block unchanged over the shared type; golden of the base release in `init.rs` test |
Kept as host wiring proofs (now drive the host via `runHostDoctor`): `checks-doctor-config` fresh-repo and no-events-child cases, `dir-resolution`, `agy-permissions`, `yaml-parse-failures`, `active-release-drift`, `agent-wiring` HOME case.

## Gates
fmt, clippy -D warnings (fgos, fgos-distribution, fgos-host-runtime, fgctl, fgos-config), msvc and darwin check (msvc: only pre-existing test warnings; fgos-config tests do not build on msvc, as before), cargo test fgos/distribution/host-runtime/fgctl/config green, census 0 undeclared, routes `--check` clean. Node: 64 files (every importer of checks/registrations/harness plus parity, routes, flag tests, fgctl init/upgrade/closing-block, install-packaging) 1135 tests green. Earlier red files (background-seal, loop, orphan sweep) were load from my concurrent builds; green alone. Series gate must still run the full suite.

## Latency (debug builds, 9 runs, median; fresh git project)
base Node entry 4.0 s; base host serving Node doctor 6.6 s; new host 6.5 s. Not above the base through the host. This repo: Node 26.9 s, host 29.9 s (not through base host; re-measure against 00's medians).

## Proposed CHANGELOG line
`fgos doctor` runs in the Rust host over one registry; rows of layers still written in Node run in one bounded Node child; with Node missing those rows fail and `next` says to install Node.

## Concerns / for the step lead
1. 00 report absent: labels are mechanical (judge registration, import closure without tier ports, tier -> step), giving S4 49 rows, S5 1, S6a 32, S6b 6, S7 7 plus config group S4. 00's hand table may differ; reconcile before landing. Rule lives in `doctor-judge-closure.mjs`.
2. Bridge deadlines (check 120 s, fix 300 s) are provisional pending F21.
3. P7 tail-failure tests (`fgctl-init-preflight-tail`, `fgctl-upgrade`) now fail the `init` tail step (host doctor cannot exit 42); phase 10 must re-point them when init goes native.
4. Phase 06/07 etc: new `pub` items only in fgos-distribution and host-runtime; none in fgos-git.
5. Tests outside the phase list touched: `agent-wiring`, `dir-resolution` (separate hunks), `agy-permissions`, `yaml-parse-failures`, `active-release-drift-check`, new `test/helpers/doctor-judge-closure.mjs`, `doctor-bridge.test.mjs`; docs: contract section 3 and 2 sentences, spec RUL109 sentence.
6. Windows: tree kill is the child only (no Job Object); Node doctor rows mostly fail early there.
