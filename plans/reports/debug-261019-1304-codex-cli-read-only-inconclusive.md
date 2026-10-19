# codex cli read-only run classified inconclusive

## Verdict
By design, not an adapter bug. The codex cli adapter lets the worker write both outbox files. The settler rejects the report text "ok" as non-substantive, and a read-only "done" claim without a valid report is downgraded to no-evidence.

## Evidence
- Run `unit-run-1792348130863-4f194a8b` (`.fgos/assignments/<id>/producer/1/runs/01/`): `stderr.log` shows codex ran `apply patch` and created `agent-report.md` (content `ok`) and `agent-result.json` (`status:done`, `summary:ok`) in `worker-output/outbox/`. So bwrap binds, sandbox flags and credentials are fine.
- `evidence.json`: `agent-result.json` valid:true, `agent-report.md` **valid:false**.
- `result.json`: `agentClaim` parsed (done/ok), `assessment.verdict=inconclusive`, `confidence=no-evidence`, basis `valid-agent-result-claim`, `captured-stdout`.
- Brief text (stderr.log): "a done status with no report artifact is treated as unevidenced (no-evidence), not accepted as done."
- `src/runner/dispatch/settlement.mjs:103-130` `isSubstantiveReportText`: every word of `ok` is in GENERIC_KEYWORDS (line 116, `OK`), so non-generic words = 0, so it returns false. Called at `settlement.mjs:587`.
- `receipt.json` `outboxPresent:false` is the supervisor's synthesized flag; it is not the settler's source of truth (the settler read the files and listed them as artifacts). Mildly misleading, not causal.
- Repro, real reading task, herdr env unset, openai/tetnu, cli-spawn + bwrap: run `unit-run-1792389923463-229a52e5` gave verdict **pass**, confidence `reported`, claim "The first heading in README.md is Forgent." with `evidenceRefs:["README.md:1"]`, both artifacts valid. Same adapter, same account, so the adapter is not at fault.
- Claude contrast (`smoke-6.2` run with a real task) passes; a bare "reply ok" claude run is inconclusive for the same reason. Both providers agree.
- Not checked: `unit-run-1792348106118-d5ff76e3` is not present under `.fgos/assignments/` (no directory found). The 6.3 run has the same symptom, so the conclusion rests on that run.

## Hypotheses eliminated
1. Worker cannot write outbox (bwrap bind or codex sandbox): eliminated, files exist, valid claim parsed, repro passes.
2. Credentials or capture: eliminated, `credentialProvisioned:true`, stdout captured.
3. Codex mis-reports: eliminated, it followed the brief exactly. The probe prompt "Reply with the single word ok" makes the honest report trivially "ok".

## Fix
None needed in adapter or settler code. Smallest options, in order:
- Test or smoke prompts for read-only runs must be a real reading task (as in the repro). No code change. Recommended.
- Optional, only if bare-ack probes should pass: no change is better than loosening `isSubstantiveReportText`, since that gate is the anti-placeholder guard (`OK` is deliberately generic).
- Tiny diagnostic improvement (RUL104-compatible): make `runnerNote` say "report non-substantive" instead of plain "Settled" when a done claim is downgraded for that reason, so this does not look like a bug. Not required.

## Unresolved
- B2 run `unit-run-1792348106118-d5ff76e3` directory not found; confirm where it lives if it must be inspected.

Status: DONE
Summary: Inconclusive is the settler rejecting the one-word report "ok" as non-substantive (settlement.mjs:103-130, 587), not an adapter failure. A real-task repro with the same codex cli path passes.
