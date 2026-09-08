**Scout report — vnflow (Context Investigator)**

CASE: "start from the symptom
'EOD and intraday evolution is becoming difficult' and determine whether
the right decision is to keep separate pipelines with shared contracts,
introduce one pluggable pipeline abstraction, or reframe the problem
elsewhere"

Investigation was read-only. No files were written, no tests or pipelines were executed, and `.env` and `backups/` were excluded. Paths below are relative to `/home/vantt/projects/vnflow`.

**Hypothesis attacked**

The suggested early hypothesis was: "the EOD and intraday pipelines are mirrored/duplicated enough, and diverging fast enough, that the duplication itself is now the real cost — not the number of pipelines."

I looked for what would make that false: an existing shared runner, reused domain calculations, deliberate differences in behavior, independent changes, and failures originating outside duplicated orchestration.

**Evidence against the hypothesis**

Both pipelines already execute through one configurable runner:

- `src/vnflow/application/ingest_eod.py` constructs `AssetRunner(EOD_ASSET_SPECS, ...)`.
- `src/vnflow/application/ingest_intraday.py` constructs `AssetRunner(INTRADAY_ASSET_SPECS, ..., progress=intraday_progress)`.
- `src/vnflow/application/asset_runner.py` supplies the shared `AssetSpec`, `AssetContext`, `AssetRunResult`, topological ordering, downstream selection, dependency blocking, and check execution.

The registries contain **14 EOD assets and 6 intraday assets**, respectively, in `application/asset_specs.py` and `application/asset_specs_intraday.py`. They are different graphs, not two implementations of graph execution.

Domain behavior is also shared. Both feature paths call existing indicator functions; both money-flow marts call `score_money_flow`; both signal engines call `evaluate_buy_gate`. Intraday alert dispatch imports and calls EOD's `dispatch_alerts`, supplying its own renderer, cooldown, and cap.

Evidence: `application/features/{stock_daily_features,intraday_features}.py`, `application/marts/{money_flow,money_flow_intraday}.py`, and `application/signals/{signal_engine,signal_engine_intraday,alert_dispatch_intraday}.py`, all under `src/vnflow/`.

The strongest historical counterexample is commit **`c64de07`, 2026-06-22**. Its commit message records that the **shared** runner wrote intraday progress into the EOD registry, leaving a running record that hijacked the EOD banner. The fix introduced a separate progress registry and injected it into the existing runner. This was a shared-state isolation defect; creating a mirrored module was part of its resolution.

**Where mirroring is real, and where behavior differs**

Physical line counts include comments and blank lines.

| Parallel modules under `src/vnflow/application/` | EOD lines | Intraday lines | Observation |
|---|---:|---:|---|
| `ingest_eod.py` / `ingest_intraday.py` | 192 | 144 | Repeated lifecycle bookkeeping, but different recovery and notification behavior |
| `eod_progress.py` / `intraday_progress.py` | 150 | 147 | Same implementation after normalizing Eod/Intraday identifiers and removing docstrings |
| `asset_specs.py` / `asset_specs_intraday.py` | 375 | 100 | Same registration contract; different graph size and asset bodies |
| `features/stock_daily_features.py` / `features/intraday_features.py` | 168 | 166 | Similar per-symbol processing; shared indicators, different temporal inputs and RVOL handling |
| `marts/money_flow.py` / `marts/money_flow_intraday.py` | 263 | 141 | Shared scorer; different inputs and aggregation |
| `signals/signal_engine.py` / `signals/signal_engine_intraday.py` | 476 | 218 | Shared buy gate; different context assembly and output completeness |
| `signals/alert_dispatch.py` / `signals/alert_dispatch_intraday.py` | 408 | 100 | Intraday is a wrapper around shared dispatch |

Intraday additionally has a **98-line** signal-loader module, `signals/signal_engine_intraday_loaders.py`; the signal-engine comparison therefore does not count all its loading code.

The progress pair provides a directly measured duplicate. However, `git log -- <path>` shows **no subsequent edits to either registry after its introduction**: EOD on June 21, intraday on June 22. That duplicate has not demonstrated accelerating maintenance churn in this history.

The ingest wrappers have meaningful policy differences. EOD supports selection/force, scans five preceding trading sessions for missing outputs, and checks for an unfinished prior run. Intraday counts consecutive failed passes, alerts at a threshold of three, and publishes a successful-refresh event. Evidence: `ingest_eod.py` and `ingest_intraday.py`.

Intraday signals deliberately omit entry range, stop, target, R:R, and position size. Its money-flow calculation passes no foreign-net value or preceding OBV. These are different available inputs and product behaviors, not simply renamed daily calculations. Evidence: `signals/signal_engine_intraday.py` and `marts/money_flow_intraday.py`.

**Evidence supporting evolution drift**

Two concrete asymmetries survived inspection.

1. **A shared rule evolved without equivalent input wiring.** Commit **`235d05d`, 2026-07-05** added the breadth gate and changed EOD signal assembly and backtesting. EOD loads and supplies `pct_sectors_leading`; intraday does not supply it.

   The shared `evaluate_buy_gate` defaults that input to `None`, and `_gate_breadth` explicitly records `breadth=unavailable(bypassed)` for that case. Thus sharing the rule does not ensure equivalent enforcement.

   Evidence: `application/signals/signal_engine.py`, `application/signals/signal_engine_intraday.py`, `domain/analytics/signal_rules.py:248`, under `src/vnflow/`, and `git show 235d05d`.

   I could not determine whether the intraday omission was intentional. The observed bypass is definite; calling it an unintended trading-policy defect would require that intent.

2. **Schema-tolerance fixes did not reach all parallel loaders.** EOD signal loaders now read partitions separately and concatenate using `diagonal_relaxed`, with comments explaining mixed historical schemas. Intraday's EOD-context loaders still use `pl.read_parquet(files)` across all discovered partitions.

   Evidence: `application/signals/signal_engine.py:274` onward versus `application/signals/signal_engine_intraday_loaders.py:17` onward. EOD loader history includes **`068d898`, 2026-06-24**; broader schema fixes appear in **`06f4ecc`, 2026-06-22**.

   The intraday loaders catch read errors and return absent regime/sector context. This is an analogous exposure left after related fixes, **not a reproduced intraday failure**: I did not execute a mixed-schema fixture or inspect production partitions.

**The boundary is partly a persisted-data contract**

Intraday reads EOD market regime and sector rotation, plus the reference sector map, directly from lake paths. Regime and sector rotation use a **seven-calendar-day lookback**, including the requested date. Reference sector mapping takes the latest effective date without the same cutoff.

Evidence: `src/vnflow/application/signals/signal_engine_intraday_loaders.py`.

Those EOD dependencies do **not** appear in the intraday DAG: its signal asset declares only `mart.money_flow_intraday` as its dependency. Consequently, the runner's dependency blocking does not express whether the EOD context exists, is recent enough, or was successfully decoded.

The port boundary is also incomplete:

- `composition/container.py:109` supplies the same concrete lake object under feature, mart, signal, and other repository keys.
- `domain/contracts/ports_analytics.py` declares daily analytics protocols but contains no intraday analytics methods.
- `signal_engine_intraday.py` obtains `.lake` from `bar_repo`, reads through loader functions, and calls signal existence/write methods through `feature_repo`.

These are verified uses of concrete adapter capabilities beyond the declared analytics contracts. The absence of intraday methods was checked both in `ports_analytics.py` and across `domain/contracts/*.py`; an intraday **bar** repository protocol does exist in `ports_repository.py`.

Another shared-state seam is documented in `signals/alert_dispatch_intraday.py`: EOD and intraday alerts share a dataset without a kind discriminator, so EOD alerts already sent that day count toward the intraday daily cap. The source identifies manual EOD alert execution during the trading session as a contamination path. I did not measure its frequency.

These observations locate actual coupling in persisted context, port assumptions, and shared alert state, beyond the count of pipeline entry points.

**History, magnitude, and trend**

The checkout's HEAD is **`8f73adb`, 2026-07-10**. Its **83 reachable commits** begin on **2026-06-10**; Git reports the repository is not shallow. This is approximately one month of repository history, not evidence of a multi-quarter trend.

For the execution boundary, I used **`c64de07`** as the most recent explicit runner refactor. Later architecture-relevant feature changes include outcome wiring and operational recovery; "most recent architecture-relevant commit" is therefore not a uniquely defined repository marker.

I counted commits after `c64de07` against an explicit application-code scope:

- EOD: ingest, progress, registry, three daily feature modules, four daily mart modules, signal engine, alert dispatcher — **12 files**.
- Intraday: ingest, progress, registry, bar ingestion, feature, mart, signal engine, signal loaders, alert wrapper — **9 files**.

Using `git rev-list c64de07..HEAD` and per-commit `git diff-tree --name-only`, **9 commits** touched that scope:

| Scope touched | Commits |
|---|---:|
| EOD only | 6 |
| Intraday only | 0 |
| Both | 3 |

The three joint changes were:

- **`ceb6ffe`, June 23:** intraday alert tuning, including shared dispatch changes.
- **`c12b3cf`, June 23:** validation and outcome tracking.
- **`ea70bf6`, July 5:** operational alerts and recovery.

Starting instead immediately after intraday introduction, **`0666388`**, adds one EOD-only schema fix and the intraday-only progress fix: **11 commits, 7 EOD-only, 1 intraday-only, 3 joint**.

These counts exclude shared domain/storage/config-only changes and do not measure engineering effort. They establish that mirroring was not required for every change; they do not establish that EOD-only changes were always semantically isolated.

The recorded schema failure also points outside duplicated pipeline bodies. `plans/reports/debugger-260622-1729-eod-intraday-diagnosis-report.md` attributes failures to provider nullability and mixed Parquet schemas. Commit `06f4ecc` changed **6 files**, spanning storage and feature loading. The report's runtime measurements are historical report claims, not measurements repeated in this investigation.

**Decision records and forward pressure**

`plans/260622-1118-intraday-polling-upgrade/plan.md:21` explicitly scopes the work as additive and says not to modify the running EOD pipeline. Its analytics phase simultaneously directs domain reuse, describes copying the money-flow wrapper's structure, and says excessive copied logic should move into shared domain functions. This documents deliberate tactical isolation alongside reuse, rather than an accidental pair of independent implementations.

There are concrete future pressures, but they do not all imply implementing one feature twice:

- `plans/reports/codebase-audit-260705-1305-system-usefulness-decision-readiness-report.md:145` proposes intraday ATR entry planning and continuous RVOL scoring. EOD already produces entry plans; intraday currently leaves those fields absent. This is a documented convergence pressure, but the audit presents alternatives and does not establish an accepted implementation commitment.
- `plans/260705-1325-decision-readiness-fixes/phase-06-validation-hygiene-backlog.md`, item 8, records unattached OHLC, price-jump, volume-spike, and missing-bar checks. Current registry inspection found checks on **9 of 14 EOD assets and 0 of 6 intraday assets**. Shared checking machinery exists; registration differs.
- Operational notification was an actual cross-pipeline requirement, not merely a proposal. `phase-03-ops-alert-auto-catchup.md` and commit `ea70bf6` show it implemented with shared `ops_notify.py` and separate wrapper hooks.

Document status is imperfect evidence of remaining work: the decision-readiness parent plan says pending while several phase files say completed. Commit history and present source were used to distinguish implemented changes from proposals.

**Tests and absences**

Tests exist around the separation boundary. `tests/application/test_intraday_progress.py` exercises registry isolation and runner routing. `tests/application/test_intraday_pipeline_e2e.py` checks intraday outputs and that several EOD datasets are not written. "There are no seam tests" would be false.

However, that intraday end-to-end fixture patches both EOD-context loaders; `tests/application/test_signal_engine_intraday.py` does likewise. A repository-wide test search for the loader names and loader module found only these patching references. I found no direct named-loader test exercising real EOD regime/sector partitions, including mixed schemas. This search does not rule out indirect coverage under unrelated names.

The shared runner also has an unfinished capability: `AssetSpec.freshness` exists, and `force` is passed into `_materialize`, but neither controls materialization there. `skipped_fresh` is returned when an asset has no function. Evidence: `src/vnflow/application/asset_runner.py`. An abstraction exists; its advertised staleness behavior is not implemented in the inspected execution path.

**Could not determine**

- **Whether duplication is the dominant cost.** No engineering-time measurements, concrete blocked change, or repeated mirrored-fix effort was established. Named costly changes and their work/review history would determine this.
- **Whether drift is accelerating.** The available history is short, and the most exact duplicate—the progress registry—has no subsequent churn. Longer history or dated maintenance records would determine the trend.
- **Whether breadth bypass is intended.** An explicit intraday policy or acceptance example would distinguish intentional behavior from missed propagation.
- **Whether the loader asymmetry fails on deployed data.** Representative mixed-schema fixtures and execution results would determine it.
- **Current production scale, latency distribution, and failure frequency.** Historical reports and scheduler templates exist, but deployed measurements were not inspected. The Windows intraday template specifies a five-minute interval and four-minute execution limit in `src/vnflow/interface/scheduler.py`; that is configuration evidence, not a measured production SLO.
- **Which proposed changes are committed forward requirements.** Audit recommendations and inconsistent plan statuses do not settle priority or ownership.

The hypothesis is therefore only partly supported: repeated wrapper logic and demonstrable drift exist, but a shared execution abstraction and shared domain behavior already exist too. The evidence does not establish duplication as the principal cause of the reported difficulty; it does identify specific contract, context-loading, policy-wiring, and state-isolation seams for the panel to examine.
