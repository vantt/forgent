# S6a phase 00 facts (index)

Plan: [261118-1341-s6a-execution-tier-rust](../plan.md). Phase file: [phase-00-facts.md](../phase-00-facts.md).
The phase-lead rules cite this file as `reports/facts.md`; its sections live in the two parts below.

## Recorded sha and integration base

- Recorded `main` sha: **`f031ab0c8af42a3588cdb19839273a226e275c09`** (2026-11-19 12:04 +07:00). Every `file:line` in
  both parts was read on it.
- Integration base: `s6a-execution/integration` did not exist when phase 00 ran, so no merge base is recorded yet. Cut
  it from `f031ab0c8`; the first re-sync (phase-lead rules, before phase 15) records the cut point here as
  `<integration-base>` and every later re-sync moves it forward.

## Parts

| Part | Sections | File |
|---|---|---|
| A | §1 module port map (119 Node files, 34 259 lines; deleting phase per file; finding D1), §2 consumer census (seam scan: `src bin scripts` 201 hits / 62 files; `test` 492 / 190), §6 tests (every test file with its owning phase), §10 baselines (one-door scan 0 undeclared; suite shares), proposed phase-table edits | [facts-part-a.md](facts-part-a.md) |
| B | §3 admission and Workflow calls (operations, `runUnit` options per caller, error classes), §4 doctor rows (32 `bridge:S6a`), §5 doors rows, §8 prior art, §9 collisions, phase-file changes applied, items for the plan lead | [facts-part-b.md](facts-part-b.md) |

Scanner: `test/golden-recorders/seam-scan.mjs` (commands in part A, top); rerun by phases 20 and 21.

## Corpus

Node-era record corpus: `packages/execution/contracts/corpus/`, replayed by every Rust reader (P21, F13; readers in
phases 12, 13, 18, 21). Three sample kinds are absent from it: a pre-`seatSchema` record, a legacy seat read
(`src/runner/execution/legacy-seat-read.mjs`), and a v2 run result. The Rust readers for those three fall back to the
Node test fixtures that cover them today (record the fixtures as vectors with the module's committed recorder; never
hand-write them).

## Plan-lead decisions on these facts (2026-11-19, inside the approved scope)

1. Deletion order (part A §1, D1): phase 20 deletes the 23 files of `src/runner/execution/` and `src/run-supervisor/`
   that no Node dispatch file imports; phase 21 deletes the other 30 with `src/runner/dispatch/**`. Exact lists in
   [phase 20](../phase-20-node-seam.md) and [phase 21](../phase-21-dispatch-subs.md).
2. Phase 11 (3 026 lines) split by file into 11 (transport base: `adapters`, `provider-adapter`,
   `visibility-session`, `terminal-slot`, `worker-session`, `worker-session-boot`, `worker-home`, `mechanism`; 1 528)
   and 11b (`transport`, `herdr-round`, `session-attempt`, `runtime-inspection`, `attention-view`; 1 498; engine module
   `transport_round`; wave 4, depends on 11). The cut follows the Node import direction (each 11b file imports 11
   files, no 11 file imports an 11b file), so it differs from part A's proposed launch/inspection cut. 16b, 17, 21 and
   22 depend on 11b.
3. `bind.mjs` and `dry-bind.mjs` port in phase 16 (`planning`, 2 264 lines) instead of 18 (2 298).
4. Test files in no phase footprint (part A §6) get an owner: `test/scripts/write-wrapper-script.test.mjs` -> 21; the
   other eleven were already placed by part B (20: `convention/seat-id`, `portfolio/work-questions`,
   `seat-binding/client`; 21: the rest). `test/install-packaging.test.mjs` is not a hit (it names
   `packages/run-supervisor`). Of the 14 `test/run-supervisor/` importers, 13 move to 21 (their imports die with
   phase 21's files) and `attempt-steps.test.mjs` stays in 20. Phase 21 also holds `test/helpers/**`;
   `test/cli/{execution-outcome-exit-codes,fgos-manifest}` and `test/verbs/dispatch-recovery` leave phase 20's row.
5. The `run-unit` result carries an error type tag beside `errorClass`, so the door rethrows `CaseAdmissionRefusedError`
   and `RunnerConfigError` as instances (part B §3 C): P14; schema in 18, rethrow and the two classes' tier-0 home in
   19, callers in 20.
6. P11: phase 17 moves `seat-binding-route` to Rust (part B §4: the client keeps callers above tier 5 after phase 20);
   phase 20 keeps `src/seat-binding/client.mjs`.
