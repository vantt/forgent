# Phase 2 — Token usage survey per CLI

Research only. No code change.

## Inputs
- Backlog rows p-s5mliyp335 and p-mvc3d54cda (`docs/backlog.md`).
- `src/runner/dispatch/usage-parsers.mjs:25-160`: today only pi and codex are parsed; claude is a stub (:126).
- `src/runner/dispatch/settlement.mjs:806`, the only caller.
- Live run dirs `/home/vantt/projects/forgent/.fgos/assignments/*/runs/*/` (`stdout.log`, `stderr.log`). Live data
  holds 0 of 98 results with tokens.
- Executors: `core/config-standard/runner.yaml` and `fgos dispatch explain`.

## Footprint
`plans/261118-0936-ops-metrics/reports/usage-survey.md`.

## Steps
1. For every CLI that fgOS runs (claude, codex, pi, omp, agy, gemini, and any other in the executor list), record:
   - how a seat invokes it: headless flags, pane, output format;
   - where its token counts appear: stdout JSON, stderr, a session or transcript file, or OTel export;
   - the shape of those counts, including cache tokens and any cost field.
2. Take one real sample per CLI, with the CLI version. Use the live run dirs, or a small read-only run if none exists.
3. For a CLI that exposes no counts, name the reason the parser will return.
4. Map each field to `observe-names.json` (phase 1).

## Verify
The report has one row per CLI with: invocation, source, sample, mapping, and the reason returned when counts are
absent. Phase 6 can be written from it alone.

## Rollback
Delete the report.
