# Phase 2 — Token usage survey per CLI

Research only. This phase has no code change.

## Inputs
- Backlog rows p-s5mliyp335 and p-mvc3d54cda (`docs/backlog.md`).
- `src/runner/dispatch/usage-parsers.mjs:25-160`, the parsers that exist today (pi, codex; claude is a stub).
- `src/runner/dispatch/settlement.mjs:806`, its one caller.
- Live run dirs under `/home/vantt/projects/forgent/.fgos/assignments/*/runs/*/` (`stdout.log`, `stderr.log`).
- Executor definitions and invocations: `core/config-standard/runner.yaml`, `fgos dispatch explain`.

## Footprint
`plans/261118-0936-ops-metrics/reports/usage-survey.md`.

## Steps
1. For each CLI fgOS runs (claude, codex, pi, omp, agy, gemini, and any other in the executor list), answer three
   questions: how a seat invokes it (headless flags, pane, output format), where its token counts appear (stdout JSON,
   stderr, a session or transcript file, or OTel export), and in what shape. Include cache tokens and any cost field.
2. Take one real sample per CLI from the live run dirs, or from a small read-only run where none exists. Name the CLI
   version.
3. For a CLI that exposes nothing, name the reason in words a parser can return.
4. Map each field to the names in `observe-names.json` (phase 1 step 2).

## Verify
The report has a row per CLI with an invocation, a source, a sample, a mapping and a reason-when-absent. Phase 5 can be
written from it without re-reading the CLIs.

## Rollback
Delete the report.
