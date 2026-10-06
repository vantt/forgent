# Unit summary and passive stance: prior-art evidence

## Scope and verification boundary

Phases 4–5 of `261005-1143-observe-run-visibility-and-discussion-measurement` implement writer-owned derived unit summaries and a non-blocking stance sensor. This report records read-only prior-art/design evidence. Tests, production backfill and live panels are reserved for the integration owner; none were run by this worker.

## Existing execution semantics reused

`src/runner/execution/unit-run-history.mjs` is the sole attempt-selection owner, now exposing `readUnitRunSeats` to both the existing history projection and the summary writer:

- A seat is a role/round, not simply a role. `<round>-fb<n>` is a provider-limit fallback assignment; highest settled fallback wins.
- A resumed assignment has multiple numeric `runs/<NN>` directories. Latest settled **numeric** run within that assignment wins. Review found the inherited lexical `99`/`100` defect; the shared owner now compares numeric attempt values with a stable name tie-break for both final selection and the complete attempt list.
- Selection occurs before parsing the selected result. A corrupt selected result is ignored; an earlier success is not silently substituted.
- Classification vocabulary is unchanged: `ok → pass`; verdict/findings → `findings`; blocked → `blocked`; policy → `policy-refusal`; infra provider-limit/paused-limit → `provider-limit`; otherwise → `execution-failure`.
- Every parseable settled attempt is retained in the summary alongside the one owner-selected final. A resume is not a fallback merely because it has multiple attempts.
- Inline `fgos run record` has `unitRunId`, no dispatch `runId`; it becomes a real final seat, not an Observe dispatch run.
- Legacy direct `reviewed` units use `reviewedHistoryOutcome` from the pattern owner, with its shared round assessment and checker/verify completeness rules. Earlier findings do not override a later complete passing round; incomplete history or missing required verification evidence remains `unknown`, not an invented verdict. Persisted owner settlement or an explicit workflow completion always wins.

Prior commits read with `git log`: `b19643448` (template-directed earlier results), `8301d83ca` (blind role copies), `e7c628fa4` (blind dispatch/refusal), `31eb37f6e` (anonymized inputs), `3b02e0c82` (workflow persona/params).

GitNexus bound repository: forgentX, main checkout; `.gitnexus/meta.json` index `2639e0c85d778730d8ceced290af5c90cd727571`, indexed 2026-10-05T13:50:39.615Z. CLI `list-repos` is not supported in this installed build, so impact calls explicitly used `--repo .` and metadata established identity. `runUnit` impact: LOW, four exact upstream symbols; `readUnitRunHistory`: LOW, six exact upstream symbols including hand-off resolution; `validateUnit`: HIGH, seven exact upstream symbols with direct `lintPhaseUnits` and `runUnit`, plus plan lint and Workflow advancement. HIGH risk was reported to the integration owner. No JavaScript LSP tool is exposed in this worker runtime.

Before these review corrections, GitNexus could not resolve newly added `readUnitRunSeats` / `buildUnitSummary` (UNKNOWN: additions are not indexed), so scoped caller searches established their actual history/summary/backfill/test users. The existing history symbol still reported LOW/six exact upstream symbols. `runReviewed` returned zero indexed upstream callers, which is UNKNOWN rather than safety evidence; source inspection confirms its import/dispatch from the pattern index. Corrections change no caller signature and reuse the pattern's own pure assessment instead of rebuilding reviewed semantics in the summary.

## Historical mdview shapes, read on disk

Read `unit-run-1791199160356-cf1d02db/unit.json`: unit template, overrides, config snapshot, resolved inputs, worktree, createdAt, and per-role/round bindings; no persisted workflow link or unit settlement in this legacy shape. Bindings carry executor/model/persona and attempt ids.

Read `unit-run-1791198761763-204317b8/panelist-1/1/runs/01/result.json`: RunResult v3, nested assignment/run ids, executorId, policy.providerModel/model/persona, result-owned `settledAt` 2026-10-05T11:13:29.720Z and settled `agentClaim`. Summary projection excludes claims, control fields, raw report text and absolute paths.

The legacy zero-seat policy refusal has explicit owner evidence: `.fgos/workflow-runs/wf-run-1791195929806-1f688991/events.jsonl`, `unit.complete` seq 4, timestamp 2026-10-05T10:25:29.985Z, exact `unitRunId: unit-run-1791195929977-fd44cbc6`, step `blind-proposals`, unit `propose-round-1`, outcome `policy-refusal`. Backfill can use this exact completion link, not infer from a unit name, directory time or `unit.scheduled`. Only the Node owner/backfill reads these completion events; Rust never joins them. The generated summary records relative evidence file and sequence in `derivation` and never rewrites original unit/result/event records.

New executions persist `workflow` at creation and owner `settlement` at every unit end, including refusal/throw/resume/inline record. A panel throw waits for other panelists to settle before summary publication. Historical settlement uses actual owner completion or result-owned settlement only, never creation as fictional completion; missing evidence remains null.

## Stance prior art and deliberate deviation

Read the `panel-dissent-agreement-gate` and `agreement-sensor-passive` porting-log rows and [A/B comparison](council-ab-comparison-261004.md). The comparison explicitly says “Đồng thuận: không thêm cổng” and records that the sensor appeared only after the council enforcement round, evidence n=1 on one provider.

The [Chairman report](council-lens-experiment-261004/outputs/ab-council-chairman-verdict.md) proposed prose `STANCE:` tokens and these exact review conditions:

- K2: “Over the first 30 logged panel runs, at least 90% have a unanimous stance.”
- K3: “At least 1 logged unanimous panel is later reversed by the `reviewed.mjs` red-team or by a human revision of the decision within 14 days.”
- K5: “The sensor has run 60 days and nobody has read or queried it, so K2 and K3 were never checked.”

These many-run review conditions are outside this plan's acceptance, not new gates/alerts.

Transport intentionally deviates to optional `agentClaim.stance: { choice, confidence }`, read only from settled `result.json` (inline record uses its nested result claim). This avoids guessing report/outbox paths and parsing prose. Existing claim validity is untouched: missing/malformed/unknown stance fields remain accepted. The summary labels each final stance valid/missing/invalid. Choice is a declared question-local label or reserved `other`; confidence is optional/null or a finite number 0–1. Confidence is recorded, not used as a vote weight.

Options are per question: top-level Unit `stanceOptions`, `fgos run --stance-options`, and `workflow start --stance-options`. Workflow run events preserve the labels across detached/resumed advancement and template normalization supports local defaults; run-supplied nonempty options take precedence. The panel's existing role-task helper adds the instruction even when a panelist task is overridden. Synthesizers do not vote.

Agreement is largest valid option group divided by **all final panelist seats**, retaining missing/invalid seats in the denominator. Split threshold is strictly below 2/3, not the source design's >70% counterfactual gate. Missing responses can produce an incomplete-evidence split signal; they are not proof of real dissent. No options or zero panelist seats is unmeasured. The Observe reader computes these values from owner-written summaries, with no second attempt semantics.

## Integration commands

```sh
node scripts/backfill-unit-summaries.mjs --dir /home/vantt/projects/forgentX --dry-run
node scripts/backfill-unit-summaries.mjs --dir /home/vantt/projects/mdview --dry-run
node scripts/backfill-unit-summaries.mjs --dir /home/vantt/projects/forgentX
node scripts/backfill-unit-summaries.mjs --dir /home/vantt/projects/mdview
```

Run backfill again to confirm `changed: 0`; manually compare the refusal, a complete panel, and a fallback panel against original directories. Live panel (run from mdview, explicit prepared Unit file): `node /home/vantt/projects/forgentX/bin/fgos.mjs run --unit <panel-unit.json> --stance-options 'no-gate|optional-gate|mandatory-gate' --dir /home/vantt/projects/mdview`. Workflow alternative (declared id from `core/workflows/delphi.yaml`): `node /home/vantt/projects/forgentX/bin/fgos.mjs workflow start delphi --request <question> --stance-options 'a|b|c' --dir /home/vantt/projects/mdview --foreground`.

Integration owner should run the behavioral Node suites (unit summary, unit, run, pattern panel/role tasks, claim contract, workflow runner), then full npm and Rust suites once all peers have landed.
