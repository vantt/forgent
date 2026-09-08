**Candidate: retain the two pipelines and existing runner; make their persisted context and alert accounting explicit contracts.**

"Difficult" means a change in one pipeline can alter the other's decisions without a declared dependency or a failing test, leaving the sole maintainer to discover and reconcile the consequences. Success means those changes become locally testable and independently deployable, with useful stopping points.

This proposal assumes there is room for bounded corrective releases while the existing jobs continue operating. It does not assume an incident, a failure frequency, or an urgency level. The lead advisor's sole-maintainer interpretation is the operational premise.

The scout reports 14 EOD assets and 6 intraday assets already using `AssetRunner`. Introducing another execution abstraction is not the necessary first move. I agree with the scout's lean toward specific coupling points: the strongest evidence concerns policy inputs, persisted data, and shared alert accounting.

**Ranked constraints shaping this candidate. #1 is the acceptance condition; the others have bounded mitigations.** Magnitudes below describe exposure, not incident likelihood or urgency.

**1. This candidate must stop implicit policy omission before it reaches an external notification — HIGH consequence; code reversible, delivered effects irreversible.**

The scout traces the breadth-gate divergence to `235d05d`. Intraday's gate invocation (`src/vnflow/application/signals/signal_engine_intraday.py:122`) omits breadth, and the shared rule (`src/vnflow/domain/analytics/signal_rules.py:248`) explicitly passes unavailable breadth. The bypass is recorded in reasons, but it is not enforced as a contract failure.

*Magnitude:* every intraday buy evaluation using this invocation bypasses that gate. This does **not** mean every resulting buy is wrong: other gates still apply, and intentional exemption remains unresolved. A resulting Telegram notification, however, cannot be undone by reverting Python code; a recipient may already have acted.

*Cheapest mitigation:* make breadth policy explicit at the application boundary: either required with a value and source session, or deliberately exempt with a named reason. Missing data must not implicitly select exemption. Preserve the existing behavior initially as a visibly declared compatibility exemption; activating required breadth is a separate policy decision for the maintainer, not an architectural inference.

Add paired EOD/intraday caller tests that fail when a required shared policy input is omitted. Report exemption and unavailable-input counts in the run result. When required mode is enabled, validate before persisting actionable signals or dispatching them.

This timing matters: runner checks execute after the asset function (`src/vnflow/application/asset_runner.py:135`). Adding a post-execution check alone cannot protect a notification already sent.

*Operational cost:* one explicit policy choice and automated regression cases; no new service. Emit a degradation transition and recovery through the existing operational reporting mechanism, rather than one notification per symbol or poll.

**2. Preserve EOD recovery semantics by keeping the migration at consumer boundaries — HIGH blast radius if expanded; rollback becomes incomplete after historical writes.**

The scout identifies unattended EOD execution, dead-man-switch commit `ea70bf6`, and catchup across up to five trailing sessions. The catchup implementation (`src/vnflow/application/ingest_eod.py:165`) suppresses notifications and tolerates historical-run failures so the current run can continue.

*Magnitude:* a shared execution change could affect the current session plus five historical sessions in one invocation, with downstream marts and signals consuming the results. Code rollback would not itself restore rewritten partitions.

*Cheapest mitigation:* keep `AssetRunner`, EOD scheduling, catchup selection, and persisted EOD formats unchanged in this candidate. Do not simultaneously activate the currently unwired `freshness`/`force` behavior. Implement context compatibility in a read-only adapter injected into intraday.

Each release must remain useful if work stops there. There is no dual-write interval, historical rewrite, or second engine to retire. Reader rollback is a code revert; already emitted signals and alerts remain historical effects and must not be automatically replayed.

Preserve tests for stale-running detection, bounded catchup, notification suppression, and continuation after catchup failure. The dead-man-switch (`src/vnflow/application/ingest_eod.py:139`) checks a previous unfinished run when invoked; it is not evidence of immediate crash detection.

*Operational cost:* one implementation remains on call. The maintainer does not inherit two execution systems or a migration reconciliation queue.

**3. Isolate intraday cap accounting without migrating alert history — MEDIUM, potentially session-wide suppression; code reversible, missed timely delivery unrecoverable.**

The scout's contamination finding is confirmed by the intraday dispatcher's documented constraint (`src/vnflow/application/signals/alert_dispatch_intraday.py:17`). The shared dispatcher (`src/vnflow/application/signals/alert_dispatch.py:152`) counts all sent records for the date.

*Magnitude:* with intraday cap C, intraday sends I, and same-date EOD sends E, available capacity is currently `max(0, C − I − E)` instead of `max(0, C − I)`. EOD execution during the session can consume the entire remaining allowance. This is a live code path, not proof it has occurred.

*Cheapest mitigation:* introduce an explicit cap scope for intraday dispatch, using the existing documented `-intraday` strategy-version identity to classify legacy records. Validate the identity rule in tests before relying on it; ambiguous records must produce a visible accounting error rather than silently becoming zero usage. Preserve existing dedupe keys and sent history.

Test mixed EOD/intraday records across multiple polls and repository-read failure. The latter matters because the current exception path resets the count to zero: proposed behavior should withhold that dispatch batch and report accounting unavailable.

*Operational cost:* no backfill or dual-write reconciliation. Roll out between sessions, retain the ledger, and never "recover" suppressed historical alerts automatically. A future explicit `kind` field can be additive if the identity convention proves insufficient.

**4. Make EOD context availability a checked input — MEDIUM, potentially all consumers of a failed read; reader changes reversible.**

The scout reports mixed-schema hardening in EOD (`068d898`) without corresponding intraday coverage. Intraday loads multiple Parquet files together and converts read failures into absent context (`src/vnflow/application/signals/signal_engine_intraday_loaders.py:19`). Its seven-day lookup also returns values without their source dates. The intraday DAG (`src/vnflow/application/asset_specs_intraday.py:1`) does not express this external dependency.

*Magnitude:* one incompatible partition can invalidate the aggregate regime or sector read for that poll, potentially affecting every evaluated symbol. The mixed-schema failure remains an exposure, not a reproduced production incident.

*Cheapest mitigation:* inject a narrow EOD-context reader returning values, source sessions, and explicit available/missing/stale/incompatible status. Normalize supported historical schemas per partition and reject missing required fields. Validate freshness against the expected completed trading session, including holidays, rather than equating seven calendar days with freshness.

Express this as an intraday input/preflight asset; it checks persisted EOD readiness without executing EOD. Required context failure must block dependent work before writes. Avoid accidentally suppressing unrelated protective actions: retain any independently computable actions only under an explicit tested policy.

Add real temporary Parquet fixtures covering mixed schemas, missing partitions, and stale sessions. The scout reports that current seam tests patch the loaders, and that intraday has no registered validation checks.

*Operational cost:* one adapter, one preflight, and bounded fixture tests. Measure its runtime against the configured four-minute execution limit; that configuration is not a measured SLO.

**Delivery and stopping rule**

Estimated implementation budget: **4–7 focused maintainer days**, assuming the existing repository interfaces and strategy identity support these changes. This is a planning estimate, not measured throughput.

Ship independently: explicit policy inputs and tests; scoped cap accounting; context adapter and preflight. Validate each with isolated fixtures and fake notification delivery. Any comparison run must use isolated outputs, not production writes. Budget one session's result review per behavioral rollout, with automated degradation reporting afterward.

Stop when an EOD contract change either passes a real intraday consumption test or fails visibly before dependent side effects. Reconsider execution architecture only if subsequent changes demonstrate repeated coordination work that these boundaries do not remove.

The no-build path retains the current bypass, contamination, and context-loss exposures, plus manual discovery cost. No incident rate is available to price that cost honestly. This candidate trades that unbounded investigative burden for several finite changes that remain valuable even if the maintainer never undertakes a larger restructure.
