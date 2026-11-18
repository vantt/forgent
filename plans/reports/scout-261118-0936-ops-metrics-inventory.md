# Scout: operations measurement inventory (2026-11-18)

Brief: `.fgos/runtime/tmp/ops-metrics-brief.md`. Read-only scan of this worktree (branch `shape/ops-metrics`, head
`39b5cd176`) and the live main checkout `/home/vantt/projects/forgent/.fgos`. Live numbers come from working-tree code
(`npm run fgos:dev -- <verb> --dir <main checkout>`); the activated `fgos` on fg-server2 is older than main and does not
yet have `dispatch inspect --attention` or `fgos questions`.

## 1. What exists

### Observe (`packages/observe/rust`, spec `docs/platform/observe/spec.md`, history `docs/platform/observe/decisions/observe-component-architecture.md`)

| Verb | What it answers today | Grouping | Code |
|---|---|---|---|
| `metrics runs` | run counts by bucket (ok, exec_failed, verdict_fail, inconclusive, blocked, policy_refused, provider_limited, unclassified) | `--by executor\|adapter\|role`, `--since/--until/--case` | `metrics_cli/runs.rs`, `scorecard.rs:176` |
| `metrics harness` | one scorecard: runs, tokens, commits, work, faults | none for tokens | `metrics_cli/harness.rs`, `scorecard.rs:266` |
| `metrics discussions` | unit pass rate, seats, attempts, fallback rate, median duration, stance agreement | `--by workflow\|executor\|persona` | `metrics_cli/discussions.rs` |
| `metrics faults` | invocation faults by class | `--class` | `metrics_cli/faults.rs` |
| `metrics coverage` | run-layout accounting | none | `metrics_cli/coverage.rs` |
| `metrics case open\|close\|list` | named measurement window (sessions, interventions, verdict) | per case | `metrics_cli/case.rs` |
| `metrics outcomes`, `entropy`, `snapshot`, `eval` | Work outcome nag, entropy score, snapshot line, judge-score journal | — | `metrics_cli/*.rs` |
| `friction record\|resolve\|migrate\|list\|show\|rank` | friction journal; `rank` = 2 × unsettled records per subject | subject kinds run, session, executor, case, work | `friction.rs:222-398` |

Live (main checkout, since 2026-11-10 where windowed): `metrics runs` 244 runs, 158 ok, 50 exec_failed, 9
provider_limited (gemini 8 of 47, deepseek 15 exec_failed of 33); tokens 2.24 B over 12 sessions (2.21 B cache read);
discussions median 32.8 s over 90 units; friction 762 records, 752 on `work` subjects, only **10 in 2026-11**.

### Run records (`.fgos/assignments/<id>/`, 217 dirs live)

- `unit-summary.json` v3 (`packages/run-result/contracts/unit-summary.read.v3.json`): `startedAt`, `settledAt`,
  outcome, `infrastructureReason`, seats with every attempt's executor, **provider**, persona, **model**, outcome,
  fallbackFrom; optional `verify` block (command, outcome, durationMs) from plan `261117-1553` (done).
- `runs/<n>/result.json`: `usage {input,output,total,cacheRead,cacheCreation,source}`, `classification.failure`,
  `durationMs`, `policy.model/tier/persona`, `workId`. `run.json`: startedAt, settledAt, attempt, retry.
- `runs/<n>/provider-capacity-selection.json`: **accountId**, accountLabel, selectedAt — the only per-run account record.
- `unit.json.unit.objective`: the plan and phase appear only as free text ("leader for phase 16 of plan plans/…").

### Views and other stores

- `fgos dispatch inspect --attention --since` (`src/runner/dispatch/attention-view.mjs`): runs needing a person
  (needs-human, blocked, refused, failed, past-deadline, controller-dead); computed per call, nothing stored.
- `fgos questions --open` (`src/portfolio/open-questions.mjs`, commit `967101665`): open owner questions across
  discussion, plan, execution.
- `fgos dispatch probe-account [--record]`: seat health with timings. `fgos doctor` rows `run-attempts-stuck`,
  `observe-*`. `.fgos/logs/invocation-faults.jsonl`.
- Session rotation (`src/session-rotation/measure.mjs`, `decide.mjs`, `rotate.mjs`; config `sessionRotation`):
  context fraction per head session from the statusline sidecar or transcript; lineage files `rotation.json`,
  `incidents.jsonl`, `rotation.log` under `.fgos/runtime/session-rotation/<persona>-<name>/`. No read verb.
- Head request socket and Session Host (`packages/run-supervisor/rust/src/head_request.rs`,
  `packages/session-host/`): lifecycle ops, no timestamped history.
- Hand measurements: solo-driving trial (`plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md`:
  shape→green 36 and 62 min, 14 manual interventions, cost not recorded) and its measures sheet
  `plans/261117-1435-solo-driving-trial/reports/measures-template.md`.
- `.fgos/runtime/tmp/` helpers (`land-branch.sh`, `sec/*.sh`, …): landing and phase launch scripts; none measures
  time or cost.

## 2. What is missing (against the four goal questions)

1. **Cost.** No price table anywhere (`rg -i 'usd|per_million|costUsd|cost_usd'`: no hit). Per-run `usage` is
   declared but null in sampled runs (backlog p-s5mliyp335); omp/pi/agy report none (p-mvc3d54cda). Transcript tokens
   are one flat total: the model attribute is read but never grouped; no split by run, plan, phase, provider, account.
2. **Time.** `durationMs` is copied into each run observation (`packages/run-result/rust/src/lib.rs:714`) but
   `compute_runs` never aggregates it; sampled runs had it null. No phase or plan lead time (ready → done).
   Owner wait: gate answers carry `answeredAt` (`src/workflow/case-runtime.mjs`), but no asked-at for `fgos ask`
   (`rg 'askedAt|parkedAt|awaitingSince'`: no hit), so wait time cannot be computed.
3. **Failure rate.** Grouped by executor/adapter/role/workflow/persona only. Provider and model exist in
   `unit-summary.json`; account exists only in `provider-capacity-selection.json`; neither is a `--by` dimension.
4. **Friction trend and link.** No week/time bucket (`list --since` filters only). No `plan` subject kind
   (p-7nqygnztum) and no backlog-row link. No skill under `core/skills` records friction; writers are Work-era
   Node paths (merge, retrospective, loop), so the journal has nearly stopped (10 records in November).
5. **Run → plan join key.** No record carries a plan id or phase (`rg 'planId|plan_id|phaseId' src/runner
   packages/run-result`: no hit). Every per-plan question above depends on this.
6. **Supervisor liveness / no-progress.** Audit `plans/reports/audit-261117-1545-supervisor-watcher-audit.md` (main
   checkout) finds leader liveness (R6), two ticks without progress (R7), adaptive pace (R9) unbuilt and assigns them
   to `plans/261117-1430-portfolio-driving-draft` — status `draft`, no phase ready. The ready secretary plan
   (`261117-1856`) covers attempt liveness only. So it is assigned on paper, not covered by a ready plan.
7. **Council instability cost** (p-24dxhwq7zr): needs per-unit attempt/resume counts joined to tokens; attempts exist
   in `unit-summary.json`, tokens do not.

## 3. Backlog rows named in the brief

| Row | Fit |
|---|---|
| p-s5mliyp335 (attempt `usage` always null) | fold in: prerequisite for cost per run |
| p-mvc3d54cda (no usage for omp/pi/agy) | fold in: same producer survey, per-CLI reason when none |
| p-7nqygnztum (friction cannot name a plan) | fold in: friction→plan link |
| p-24dxhwq7zr (council instability cost) | fold in the measurement only (attempts/resumes × tokens per unit); the stability fix stays in Workflow |
| p-tslryr3buq (run dirs never removed) | not folded: retention belongs to Workflow; this plan must not depend on run dirs living forever, and should say what history it keeps when they go |
| p-ixrbglli5o (retrospective opens a topic per item) | not folded: knowledge-registry concern, not measurement |

## 4. The seven driving measures (owner pointer, 2026-11-18)

Source: `origin/plan-supervisor-prototype:plans/reports/spec-261116-1042-plan-supervisor.md` §13.3 "Bảy thước đo
(không token)", computed in the prototype by `tools/plan-supervisor/scripts/plan-board.mjs report` (branch only, not on
main). Measured by hand in the solo-driving trial
(`plans/261117-1430-portfolio-driving-draft/reports/trial-261117-1705-solo-driving-trial.md` § Measures, template
`plans/261117-1435-solo-driving-trial/reports/measures-template.md`):

1. completion (case milestone, transcript length);
2. lead time from hand-off to checked result, split worker / failed runs / re-check / owner wait;
3. interventions by kind and wait time;
4. scope fidelity (write paths widened, worker claims contradicted by the check);
5. plan defects caught by validate, by kind;
6. failure detection latency;
7. gates passed at the first independent check, with unit, e2e and docs in the commit.

The spec names its blind spots: runs refused at intake and orphan runs with no summary; owner wait measured only from
the queue.
