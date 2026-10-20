# Seat Binding phase 02: seat identity, resolver, patterns as seats

Branch `worktree-agent-ada3fbf1ebfc8faab`, merged with `seat-binding-wave` at a191c7b1e (phase-00 corrections applied).

## Done

- One seat resolver, `src/runner/execution/seat-resolver.mjs`: seat list for solo, reviewed, panel and debate (declared `seats:` required for the last two), roles `producer, synthesizer, reviewer, red-team, judge`, posture per seat (`readOnly, writer, forceOutOfProcess, inlineAllowed, stance, verdict`), `effectiveRigorOf` / `capabilityRigorOf` (exact key, `<prefix>:*`, bare verb), `checkerSeatsOf`, `requiresDistinctFamilies`, `seatLaunchesOf`. The Node duplicates of capability rigor in `reviewed.mjs`, `dispatch/plan.mjs`, `dispatch/cli.mjs` and `assignment-policy.mjs` now call it; admission judges the frame floor against the effective rigor.
- Seat id rule owned by Convention: `identifiers` entry `seat-id` in `convention.rules.v1.json`, Rust check + shared golden vectors (`identifierCases`), Node loader `src/convention/seat-id.mjs` (lazy read). Enforced in the resolver, `run.mjs` path builders, `recordInlineRun`, handoff refs and the workflow schema; traversal tests in `test/convention/seat-id.test.mjs`.
- `tester` is checker seat `tester`, role `reviewer`, posture `verdict: false` (`CHECKER_SEATS`; `VALID_CHECKER_SEATS` is the one set, the second set in `registrations.mjs` merged). Claim contract, `settlement.mjs` and the verdict receipt (`case-projection.mjs`) read posture via `isVerdictSeat` / `isVerdictResult`.
- Patterns run on seats; `role-ledger.mjs` deleted for `seat-ledger.mjs` (ledger + per-unit promise queue + bind barrier). `run.mjs` binds, publishes to the ledger and launches in that order; provider-limit rebinds go through the same queue. `bind()` reads posture only (`CHECKER_ROLES`, `isCheckerOrPanelRole` gone); an ask without a seat is the unit's producer seat.
- Storage and readers keyed by seat: `unit.json` gains `seatSchema: 1` and `seats`; bindings, assignment dirs, history, unit summary (`seat`, canonical `role`, `kind`), handoff refs, unit-sync (`sync` seat), `walkStateOf`, doctor replay, dry-bind (`seats`), seat providers, ref digests, unit handoff, workflow runner.
- One legacy read path `legacy-seat-read.mjs` (pre-fence panel, debate, reviewed incl. tester, retired presets `consult` / `research-fan-out*`, role-keyed results). Records without `seatSchema` (any `execution` status, or none) stay readable and are refused on resume `record-predates-seat-binding` before a controller is taken. Parked workflow gates resolve their role-keyed refs through it (tested).
- Workflow schema accepts `seats: [{seat, role, persona?, tier?}]`, refuses unknown keys (`prefer`, `executor`, `overrides`); `seats[].tier` refused from `--units` files and `--unit` files/stdin. `--seats` re-seats generic `member-N` seats only.
- Core workflows converted to explicit `seats:` (architecture-advisory, nominal-group, group-cognition panel + debate with flagship judge, council-lite, business-discussion, delphi x2); presets `consult` and `research-fan-out*` use seats.
- Rust: `packages/convention` (identifier rule), `packages/run-result` contract (optional `seat`), `packages/observe` (legacy-shape voter test); `panelist-` removed from fixtures. `cargo test -p fgos-convention -p fgos-observe -p fgos-run-result` green.

## Files outside the phase's list or notes for the merger

- `case-projection.mjs`: two hunks, the import line (~:12) and `receiptsFromResults` (:242-246). Nothing else touched.
- `assignment-runner.mjs` (write-gate recompute binds through `bindSeatOf`, `seatIdOf`, posture in the two brief contexts), `settlement.mjs` (:290, :568), `agent-result-claim-contract.mjs`: authorised by the phase-00 corrections.
- `bin/fgos.mjs` untouched: `:743` reads the canonical `role` of settlement records, still meaningful. `recordInlineRun` accepts `role` as the older spelling of `seat`, so `fgos run record --role` still works.
- `docs/architecture-manifest.json`: new files registered as `domain` (patterns may import them).
- `CHANGELOG.md` not touched (hot file): needs a line for "panel and debate units declare seats; pre-seat records are refused on resume".

## Deviations and open points

- `loop.mjs:1608` and `work-dispatch.mjs workRigorFor` compute item/operation rigor that is an input to the unit, not capability rigor; left as inputs.
- A reviewed unit may declare its seats; checker roles must match checkersByRigor[effective rigor] plus minCheckers exactly, else it is refused by name.
- Behaviour change by design: reviewed checker count now follows effective rigor (unit and capability), not unit rigor alone.
- `seats[].tier` is validated and stored; nothing reads it until phase 06.
- Global release door: a copy of the payload needs `packages/convention/contracts/convention.rules.v1.json` only when a seat is named (lazy), already in `package.json` `files`.

## Verification

Verified here:
- `npm test` (queue env as briefed), twice. Run 2: 8592 tests, 8444 pass, 53 fail, all inside five whole-file 10-minute timeouts: `test/rust-host/fgctl-*.test.mjs` (need a built host, environmental, same on their own), `test/run-supervisor/crash-matrix-adopt-resume.test.mjs` and `test/runner/loop.test.mjs`; the last two pass alone (30/30, and loop inside a 337-test run).
- Every other touched area passes alone: `test/runner/execution/**` (incl. new `seat-resolver`, `seat-ledger`, `legacy-seat-read`), `test/convention/seat-id`, `test/workflow/core-workflow-seats`, `test/architecture`, assignment-layout and enumerator guard, run-verb, driver-rununit, setup rc-line.
- Cargo as above, private target dir `seat-p02-cargo`.

Not verified: rust-host suites in this worktree (host not built under the private target); `dev-host.test.mjs` fails here for the same reason.

Commits: d9b7026d5, 171bf7eab, plus the report commit.
