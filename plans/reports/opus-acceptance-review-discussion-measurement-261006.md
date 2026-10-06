# Acceptance review: phases 4-5 (unit summaries, `metrics discussions`, stance sensor)

Date: 2026-10-06. Reviewer: independent Opus acceptance pass. Scope: phases 4 and 5 of
[plan](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md), uncommitted working tree.
Method: I read the code, ran focused `node --test` (46/46 and 3/3 pass), ran read-only probes with
`target/debug/fgos` (rebuilt host, has `discussions`) against mdview and synthetic scratch roots, and
counted on-disk unit-run directories. I did not run cargo, `npm test` or any dispatch.

## Verdict per acceptance criterion

| Criterion (plan.md / phase file) | Verdict | Evidence |
|---|---|---|
| plan: four mdview Delphi workflows, refusal with zero seats, two fallback seats; 30 attempts = 30 Dispatch runs, separate from 28 final seats | PASS | Live `metrics discussions --since=2026-10-05 --by=workflow` from mdview shows `wf-run-…1f688991` (1 unit, 0 seats), `…842d7c56` (8 seats/9 attempts/1 fallback), `…6466fc15` (10/11/1), `…28f05967` (10/10/0). 12 unit dirs on disk between 10:25 and 11:19, each with a summary. `metrics runs --since=2026-10-05T10:25:29.807Z --until=…11:20:00Z --by=role` gives 6+6+8+5+5 = 30; `find … result.json` in the same window gives 30. |
| plan: live three-seat panel, three valid votes, agreement 1; no options reads unmeasured; malformed stance keeps the seat passing | PASS | Live evidence is real, not just claimed. `mdview/.fgos/assignments/unit-run-1791219961331-276f364c/unit.json` holds `stanceOptions [no-gate, optional-gate, mandatory-gate]` and `settlement pass`. Each panelist's `result.json.agentClaim.stance` is `no-gate` (claude-herdr 0.78, xai 0.82, gemini 0.95). `brief-1.md`/the launch envelope contain "Declared choices". Native output: measured, agreement 1, 3 valid. Malformed stance: `test/workflow/workflow-runner.test.mjs:1201-1280` (real CLI, settlement, `confidence: 'malformed'` gives a seat `invalid` and unit `pass`), passing. |
| P4: after backfill, the four Delphi runs appear with seats, executors, fallbacks, outcome | PASS | As above. Fallback `unit-run-1791196890514-aab0cccf` panelist-3: gemini provider-limit, then xai pass with `fallbackFrom.executor=gemini`. |
| P4: a unit that throws still gets a summary | PASS (partial, see M3) | `run.mjs:241-520` try/catch with `settle('execution-failure')`; `run.test.mjs` "unit summaries cover refusal, thrown execution and resume" passes. Panel waits for peers (`panel.mjs` allSettled). Reviewed does not (M3). |
| P4: no second implementation of the attempt rules in Rust | PASS with caveat (H1) | Selection and outcome mapping live only in `unit-run-history.mjs:readUnitRunSeats`, which history and summary share. Rust (`unit_summary.rs`) only validates and filters by window. However Rust decides who votes from role names (`discussions.rs:123-126`), which is pattern semantics re-derived on the reader side. |
| P4: workflow link passed at creation, not rebuilt from events | PASS | `workflow/runner.mjs:396` passes `{runId, stepId, unitId}`; `run.mjs:225` records it in `unit.json`. Events are used only by the backfill for legacy units, and only from exact `unit.complete` records (`backfill-unit-summaries.mjs:9-35`). |
| P4: schema (seats, attempts with executor/provider/persona/model/outcome/fallbackFrom, final, inline) plus `discussions --since --by workflow\|executor\|persona` with attempts next to seats | PASS | `unit-summary.mjs:43-96`; `discussions.rs:96-110` emits `seats` and `attempts` separately. The live summaries have every field filled. |
| P4: backfill idempotent, dry-run, safe to re-run, touches only `unit-summary.json` | PASS with caveat (L3) | Byte-compare before an atomic rename (`unit-summary.mjs:100-112`); the unit-summary test proves dry-run writes nothing, a re-run leaves mtime unchanged and originals stay byte-identical. It does overwrite a summary whose content differs, which is by design, but see L3. |
| P5: optional stance never rejects or fails a seat | PASS | `agent-result-claim-contract.mjs` ignores unknown fields, and the test covers v2 and legacy claims with malformed stance. The end-to-end CLI test settles a malformed stance as `pass`. |
| P5: `--stance-options` plumbing end to end, panelist brief has the options and the instruction | PASS | `bin/fgos.mjs:2181, 2683` → `store.mjs` persisted in `workflow.started` → `runner.mjs:352` → `validateUnit` → `role-tasks.mjs:63-70`. Shown in a real envelope (test) and a real `brief-1.md` (live). |
| P5: no options = unmeasured; missing/invalid counted separately; agreement = largest share; genuineSplit < 2/3 | PASS with defect (M2) | `discussions.rs:131-169`. Zero valid votes still report `genuineSplit: true`. |
| P5: existing no-stance workflows unchanged | PASS with caveat (L2, L5) | Unit shape is unchanged when options are absent (`unit.test.mjs:210`). But every worker prompt now carries a stance line, and panelists now get `params.roleTasks`. |
| Fixtures synthetic (no controlToken, secrets, home paths, real text) | PASS | grep for controlToken, `/home/`, `vantt`, `protected/`, Bearer, apiKey, `sk-` over `unit-summary.test.mjs`, `rust/tests/unit_summary.rs`, `discussions.rs`, `test/fixtures/run-layout`, and the read contract: no hits. |
| Full suite 6,750 pass; independent writer/reader reviews approved | UNPROVEN | I did not run it (out of my remit). No review artifacts were checked. The focused tests I ran pass. |

## Findings

### High

**H1. Panels from the shipped panel presets are silently `unmeasured`, even though their workers are asked for a stance.**
- `panel.mjs:60` gives every member the stance instruction (`kind: 'panelist'`). The summary records their stances.
- Rust counts only the roles `panelist` or `panelist-<n>` as voters (`discussions.rs:123-126, 138`).
- Both shipped panel presets name members differently: `research-fan-out` and `research-fan-out-gated` use `role: 'researcher'` (`presets.mjs:21-35`). Their members become `researcher-1..3`.
- Probe: a synthetic summary with `researcher-1..3` holding valid stances and `stanceOptions [a,b]` gives `measurement: unmeasured, stanceSeats: 0, stances: {}` from `target/debug/fgos metrics discussions`.
- Failure scenario: an operator runs `fgos run --unit q.json --pattern research-fan-out --stance-options "a|b"`. The workers spend tokens on stances, and Observe reports no measurement.
- This is also the D3 concern: the reader re-derives "who votes" from naming convention.
- Fix: the writer should stamp `voter: true` (or `kind: 'panelist'`) on seats the pattern dispatched as panelists, and Rust should read that flag. Add a test for `params.role`.

### Medium

**M1. `fgos run record` writes a unit-level settlement from the producer seat alone, so a reviewed unit reads `pass` before any checker runs.**
- `run.mjs:600-603`: `unitJson.settlement = { outcome: outcomeOfRunResult(recordPayload), … }` runs for any pattern. `buildUnitSummary` puts `settlement.outcome` ahead of `reviewedHistoryOutcome` (`unit-summary.mjs:82`).
- Probe: a `code-change` unit with an inline producer, after `recordInlineRun`, has a summary with `outcome: pass`, a `settledAt`, and only the producer seat.
- Failure scenario: an inline producer is recorded and the resume never happens, or happens later. Observe counts a passed, settled unit that was never reviewed, which inflates the pass rate.
- Fix: settle at the unit level only when the pattern is solo. Otherwise write the summary without a settlement, so the outcome stays derived or `unknown`.

**M2. `genuineSplit` is `true` when no panelist gave a valid stance.**
- `discussions.rs:166-167`: with `largest = 0`, the check `0*3 < voters*2` is true.
- Probe: three panelists all `missing` with options declared gives `measured, agreement 0, genuineSplit true, stancesValid 0`.
- Failure scenario: models ignoring the instruction (a risk the phase file names) show up as "genuine dissent". That is exactly the number a future dissent-gate decision would read.
- Fix: emit `genuineSplit: null` (and agreement `null`) when `stancesValid == 0`. Better still, use a minimum valid quorum, and document it.

**M3. The throw-path summary is still lossy for `reviewed` units.**
- Panel was moved to `Promise.allSettled`. `reviewed.mjs:321-322` still uses `Promise.all` for checkers and verify.
- When one checker's `runRole` throws (for example the `RunnerConfigError` "checker role cannot be bound inline" at `run.mjs:403-405`, or an `executeAssignment` throw), `runUnit` catches it and writes `settle('execution-failure')` (`run.mjs:516-519`) while the sibling checker is still running.
- The sibling's later `result.json` never reaches the summary, because nothing rewrites it after the throw.
- The phase's own risk line says a missed exit is the main defect class. `code-change` is the default coding preset.

**M4. A crashed or killed process leaves a unit with no summary, and nothing detects it.**
- The writer runs only inside the `runUnit` process (`settle`). SIGKILL, OOM or a killed detached workflow advance produces no summary. These are the very "crashed units" D3 was meant to cover.
- Recovery is a manual one-shot script. There is no doctor check or reconciler hook.
- The phase's "Signal it broke: unit directories without a summary" has no detector, so the signal is invisible.
- Acceptable to defer, but the plan states that crashed units are no longer orphaned, and that holds only after a manual backfill.

### Low

**L1. Summaries the reader cannot use are dropped with no count.**
- `unit_summary.rs:131-141` skips summaries with null `settledAt`, a bad contract, oversized files or symlinks, silently.
- Live: mdview has 3 such summaries and forgentX has 6 (null `settledAt`), invisible in `discussions`.
- This breaks the counted-skip principle the plan set for runs.
- Fix: add a `skipped: {reason: n}` block to the output.

**L2. The stance instruction is now in every worker prompt.**
- `agent-result-claim-contract.mjs:39` adds the stance line unconditionally, for every role and every dispatch (work items, reviewers, solo producers). It is not limited to measured panelists.
- Live: the synthesizer, which does not vote, emitted `stance: no-gate`.
- This conflicts with "existing workflows unchanged when stance absent". It costs prompt tokens and can bias non-voting roles toward taking a side.
- Fix: render the line only when the assignment carries stance options.

**L3. The backfill treats an in-flight unit as settled, and can race the live writer.**
- Without a `settlement`, `buildUnitSummary` derives the outcome from the seats finished so far (any non-pass, otherwise `pass`) and takes `settledAt` from the latest attempt (`unit-summary.mjs:80-91`).
- Running the backfill while a panel is mid-synthesis therefore publishes `pass`/settled.
- If the backfill reads `unit.json` before the live `settle` and renames after it, the stale summary wins, because the last rename wins.
- Fix: skip units with no `settlement`, no legacy completion and a live run (`run.json` without `result.json`), or document the script as "quiescent store only".

**L4. A failure writing the derived summary is fatal to the unit.**
- On the success path, an exception from `writeUnitSummary` inside `settle` (`run.mjs:241-245, 508`) makes `runUnit` throw after the pattern passed and `unit.json` was settled `pass`. The workflow then records a failed unit.
- On the throw path, it masks the original error.
- The derived read model should be best-effort with a logged warning, matching the plan's "summary is derived, never authoritative".

**L5. Out-of-scope behavior change: panelists now receive `params.roleTasks[role|'panelist']`.**
- `panel.mjs:56` previously passed `unit` unchanged.
- No current workflow uses it (grep of core/plugins/.agents and mdview found none), but it is an unrequested semantic change and is not in the CHANGELOG.

**L6. `fgos run --resume <id> --stance-options …` silently ignores the options.**
- The resume path uses the stored `unit.json` (`run.mjs:143-150`). It should refuse, not ignore.

## Claims checked as false or unproven

- "independent writer/reader re-reviews closed every reported finding": unproven. No review artifact was cited for M1-M3, and M1 and M2 reproduce on the current tree.
- "Unit end has several exits … test each": the reviewed-checker throw (M3) and the inline-record-on-multi-role-pattern exit (M1) are untested.
- Everything else I checked held: four Delphi runs, 30=30, a genuine live stance panel, synthetic fixtures, no attempt selection in Rust.

## Overall verdict

ACCEPT WITH FIXES. The core D3 design and the live evidence are real. H1 and M1-M3 make the measurement wrong in reachable cases, so they should be fixed before any agreement number is used for a gate decision.
