# P30 - attempt output and report completeness (lead report)

Backlog `p-cxeyevtimz`. Branch `harden/t9-p30-attempt-output-complete`.

## What changed
- Dispatch settlement (`declareReport`, `src/runner/dispatch/settlement.mjs`) writes `reportDeclaration { complete, incompleteReason }` on the RunResult: complete when a substantive report exists and the seat ended on its own (claim written, no timeout, no signal); else `no-report` or `seat-did-not-finish`. Never null (agreed with COOK, contract section 4 `f5e8cb2a5`). Both adapter kinds settle through this one function.
- Execution (`outputOf`, `run.mjs`) writes `output { report, claim, complete, incompleteReason }` per attempt into `data.results[]`; `report` is `reportDigestOf` (new, in `handoff-refs.mjs`, shares the file read with `reportDigest`; per attempt record, not the seat's latest round). An attempt settled before the declaration has no `output` (reads as not known).
- L10: one `extendedRunResult` (`src/runner/dispatch/run-result.mjs`) replaces `withActivity` (`run.mjs`) and `unfrozenCopy` (`assignment-runner.mjs`); both deleted. Dispatch is the lowest layer both import (tier rule: `src/runner/execution/` already imports `src/runner/dispatch/`).
- Fixtures: every seat attempt of the ten golden files carries `output` (incl. one `seat-did-not-finish`, `no-report` cases); the Node fixture test pins the shape. Rust reader unchanged (ignores unknown fields); `cargo test -p fgos-run-result` green.

## Proofs
- Owning, per adapter kind (`cli-spawn`, `herdr-spawn`): `test/runner/run-result-report-complete.test.mjs` (complete, no-report, seat-did-not-finish).
- Wiring: `run-case-admission.test.mjs` (output reaches `data.results[-1]`), `handoff-refs.test.mjs` (`reportDigestOf`).

## Real run (dev host, read-only prompt)
- `--provider openai` (headless): `pass`, `output.report {path, bytes 93, sha256}`, claim present, `complete: true`, `incompleteReason: null`. `--provider deepseek`: same.
- `--provider claude` (headless): the seat could not write its outbox files (permission denied inside the seat, its answer only in `stdout.log`); `output { report: null, claim: null, complete: false, incompleteReason: "no-report" }`, outcome `execution-failure`. Declaration is correct; why the claude seat cannot write its outbox is a separate open question.
- The default seat (gemini pane inside herdr) sat idle 14 minutes with no outbox files; I stopped the run; unit `unit-run-1794464894525-e702b487` waits for `--resume` (unit is read-only, nothing written).

## Gates
See the landing line on the board.

## Authority
- `complete` is held by Dispatch settlement only; Execution copies it and never derives it. An attempt with no declaration gets no `output`.
- The contract "Today" column for `output` is now stale (DOC/COOK). `unit-state.mjs` and Workflow reading `output` are not touched.

## Lessons
- The brief assumed adapters write reports; in code no adapter does, the seat writes `report-N.md` and settlement is the one reader. Reading `settlement.mjs` before designing saved a per-transport field that would have had one value.
- A pane seat in the default tier can sit idle forever with no outbox; for acceptance runs pick a headless provider explicitly (`env -u HERDR_*` and `--provider openai`).
- Backgrounded long `fgos run` calls cost several polling rounds; run them with `timeout` from the start.
